import { Camera } from "../core/camera.js";
import { InputEvents } from "../core/input-events.js";
import { Mat } from "../math/mat.js";
import { buildCube } from "../object/cube.js";
import { Grid } from "../object/grid.js";
import { Renderable } from "../object/renderable.js";
import { ShaderProgram } from "./shader-program.js";
import { Utility } from "../util/util.js";
import { PickingFramebuffer } from "./picking-framebuffer.js";
import { OutlineRenderer } from "./outline-renderer.js";

const vertShaderFile = 'shaders/vertexShader.vert';
const fragShaderFile = 'shaders/fragmentShader.frag';
const gridVertFile = 'shaders/grid.vert';
const gridFragFile = 'shaders/grid.frag';
const pickingVertFile = 'shaders/picking.vert';
const pickingFragFile = 'shaders/picking.frag'
const outlineVertFile = 'shaders/outline.vert';
const outlineFragFile = 'shaders/outline.frag';

var FOV = 60;
var canvasSize: [number, number] = [window.innerWidth, window.innerHeight];
const clearColor: [number, number, number, number] = [0.16, 0.16, 0.16, 1.0];

export class Renderer {
    private static instance: Renderer | null = null;
    private onSelect: ((r: Renderable | null) => void) | null = null;

    private programs: { [key: string]: WebGLProgram } = {};

    private projMat: number[];
    private viewMat = Mat.getIdentityMat();

    private inputEvents: InputEvents;
    private camera: Camera;
    private grid: Grid | null = null;

    private rendInstances = new Map<string, Renderable[]>();
    private renderables: Renderable[] = [];
    private loadedTextures: Record<string, { tex: WebGLTexture, refs: number }> = {};
    private selectedRenderable: Renderable | null = null;

    private pickingFBO: PickingFramebuffer;
    private outlineRenderer?: OutlineRenderer;

    private constructor(private gl: WebGL2RenderingContext,
        private canvas: HTMLCanvasElement) {
        window.addEventListener('resize', () => canvasSize = [window.innerWidth, window.innerHeight]);
        this.setContextState();
        this.projMat = Mat.getProjectionMat(FOV, canvas.width / canvas.height, 1, 100);
        this.inputEvents = new InputEvents(canvas);
        this.inputEvents.setClickCallback(this.onClick);
        this.camera = new Camera(this.inputEvents, this.viewMat);
        this.pickingFBO = new PickingFramebuffer(gl, canvas.width, canvas.height);
    }

    debug() {
        console.log(this.rendInstances);
    }

    run = (timestamp?: number) => {
        if (this.canvas.width !== canvasSize[0] || this.canvas.height !== canvasSize[1]) {
            this.resizeCanvas();
            Mat.setAspectRatio(this.projMat, FOV, this.canvas.width / this.canvas.height);
            this.updateProjMat();
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.camera.move(this.gl, Object.values(this.programs));

        for (const r of this.renderables) {
            if (this.selectedRenderable)
                this.outlineRenderer?.draw(this.selectedRenderable);
            r.draw();
        }

        this.drawGrid();

        requestAnimationFrame(this.run);
    }

    setOnSelect(callback: (r: Renderable | null) => void) {
        this.onSelect = callback;
    }

    private onClick = (event: MouseEvent) => {
        const x = Math.floor(event.clientX);
        const y = Math.floor(this.canvas.height - event.clientY - 1);

        this.pickingFBO.enableWriting();

        this.gl.clearBufferuiv(this.gl.COLOR, 0, new Uint32Array([0, 0, 0, 0]));
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

        this.gl.useProgram(this.programs['picking']!);

        for (const r of this.renderables) {
            this.pickingFBO.drawToBuffer(r);
        }

        this.pickingFBO.disableWriting();

        const objID = this.pickingFBO.readPixel(x, y);
        console.log(objID);

        this.selectedRenderable = null;

        if (objID) {
            this.selectedRenderable = this.renderables.find(r => r.ID === objID)!;
        }

        if (this.onSelect)
            this.onSelect(this.selectedRenderable);
    };

    static async init(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
        if (Renderer.instance)
            return Renderer.instance;

        const rend = new Renderer(gl, canvas);
        Renderer.instance = rend;
        const shaderPairs = await Renderer.readShaderFiles();

        for (const [key, pair] of Object.entries(shaderPairs)) {
            rend.programs[key] = new ShaderProgram(gl, 
                pair[0],
                pair[1]
            ).getProgram();
        }

        rend.camera.move(gl, Object.values(rend.programs));
        rend.updateProjMat();
        rend.pickingFBO.setUniformLocs(rend.programs['picking']!);
        rend.outlineRenderer = new OutlineRenderer(gl, rend.programs['outline']!);

        return rend;
    }

    enableGrid() {
        if (this.programs['grid'] === undefined) {
            throw new Error("Grid shader program is missing!");
        }

        this.grid = new Grid(this.gl, this.programs['grid']);
    }

    private drawGrid() {
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.grid?.draw(this.projMat, this.viewMat, this.camera.getWorldPos());

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.disable(this.gl.BLEND);
    }

    async loadRegularModel(file: File | string) {
        const program = this.programs['regular'];
        if (program === undefined)
            throw new Error("Regular shader program is missing!");
        return this.loadModel(file, program);
    }

    async loadModel(file: File | string, program: WebGLProgram) {
        let key = '';
        let url = ''; 
        if (file instanceof File) {
            key = await this.hashFile(file);
            url = URL.createObjectURL(file);
        }
        else {
            key = file;
            url = file;
        }

        if (this.rendInstances.has(key) &&
            this.rendInstances.get(key)!.length > 0) {
            const temp = this.rendInstances.get(key)![0]!;
            const mesh = temp.getMesh();
            const vao = temp.getVAO();

            const r = new Renderable(this.gl, mesh, program, vao);
            this.rendInstances.get(key)?.push(r);
            this.renderables.push(r);

            return r;
        }

        try {
            return Utility.readFile(url)
                .then(source => {
                    const mesh = Utility.parseObj(source).buildMesh();
                    const r = new Renderable(this.gl, mesh, program);
                    this.rendInstances.set(key, [r]);
                    this.renderables.push(r);

                    return r;
                });
        }
        finally {
            URL.revokeObjectURL(url);
        }
    }

    private async hashFile(file: File) {
        const arrBuff = await file.arrayBuffer();
        const hashBuff = await crypto.subtle.digest('SHA-256', arrBuff);

        return Array.from(new Uint8Array(hashBuff))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    loadCube() {
        const objName = 'cube';
        const program = this.programs['regular'];
        if (program === undefined)
            throw new Error("Regular shader program is missing!");

        if (this.rendInstances.has(objName) &&
            this.rendInstances.get(objName)!.length > 0) {
            const temp = this.rendInstances.get(objName)![0]!;
            const r = new Renderable(this.gl, temp.getMesh(), program, temp.getVAO());
            this.rendInstances.get(objName)?.push(r);
            this.renderables.push(r);

            return r;
        }
        else {
            const cubeMesh = buildCube();
            const r = new Renderable(this.gl, cubeMesh, program);
            this.rendInstances.set(objName, [r]);
            this.renderables.push(r);

            return r;
        }
    }

    selectRenderable(r: Renderable) {
        this.selectedRenderable = r;
    }

    getSelectedRenderable() { return this.selectedRenderable; }

    deleteSelectedObject() {
        this.deleteObject(this.selectedRenderable);
    }

    deleteObject(r: Renderable | null) {
        if (!r)
            return;
        if (this.selectedRenderable === r)
            this.selectedRenderable = null;

        this.delArrEl(this.renderables, r);
        const tex = r.getTexture();
        if (tex !== null) {
            for (const t of Object.values(this.loadedTextures)) {
                if (t.tex === tex) {
                    if (--t.refs === 0)
                        this.gl.deleteTexture(tex);
                    break;
                }
            }
        }

        this.deleteFromInstances(this.rendInstances, r);

    }

    private deleteFromInstances(
        instances: Map<string, Renderable[]>,
        r: Renderable
    ) {
        for (const rends of instances.values()) {
            if (rends.length > 0 && rends[0]!.getVAO() === r.getVAO()) {
                this.delArrEl(rends, r);
                if (rends.length === 0) {
                    r.destroy();
                }
                break;
            }
        }
    }

    async loadTexture(file: string | File, program: WebGLProgram) {
        let url = '';
        let key = '';

        if (file instanceof File) {
            url = URL.createObjectURL(file);
            key = await this.hashFile(file);
        }
        else {
            url = file;
            key = file;
        }

        if (key in this.loadedTextures && this.loadedTextures[key]!.refs > 0) {
            this.loadedTextures[key]!.refs++;
            return this.loadedTextures[key]!.tex;
        }
        const texture = this.gl.createTexture();
        return Utility.loadImage(url)
            .then(img => {
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
                this.gl.texImage2D(this.gl.TEXTURE_2D,
                    0,
                    this.gl.RGBA,
                    this.gl.RGBA,
                    this.gl.UNSIGNED_BYTE,
                    img
                );
                this.gl.texParameteri(this.gl.TEXTURE_2D,
                    this.gl.TEXTURE_MAG_FILTER,
                    this.gl.LINEAR
                );
                this.gl.texParameteri(this.gl.TEXTURE_2D,
                    this.gl.TEXTURE_MIN_FILTER,
                    this.gl.LINEAR_MIPMAP_LINEAR
                );
                this.gl.generateMipmap(this.gl.TEXTURE_2D);

                this.gl.bindTexture(this.gl.TEXTURE_2D, null);

                this.loadedTextures[key] = { tex: texture, refs: 1 };

                return texture;
            });
    }

    private delArrEl(arr: Renderable[], r: Renderable) {
        const i = arr.indexOf(r);
        const len = arr.length;
        if (i === -1)
            return;

        arr[i] = arr[len - 1]!;
        arr.pop();
    }

    private setContextState() {
        this.resizeCanvas();
        this.gl.clearColor(...clearColor);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);
    }

    private resizeCanvas() {
        this.canvas.width = canvasSize[0];
        this.canvas.height = canvasSize[1];
        if (this.pickingFBO)
            this.pickingFBO.resizeTex(this.canvas.width, this.canvas.height);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    private static async readShaderFiles() {
        const gridShaders = await Promise.all([
            Utility.readFile(gridVertFile),
            Utility.readFile(gridFragFile)
        ]);

        const regularShaders = await Promise.all([
            Utility.readFile(vertShaderFile),
            Utility.readFile(fragShaderFile)
        ]);

        const pickingShaders = await Promise.all([
            Utility.readFile(pickingVertFile),
            Utility.readFile(pickingFragFile)
        ]);

        const outlineShaders = await Promise.all([
            Utility.readFile(outlineVertFile),
            Utility.readFile(outlineFragFile)
        ]);

        return {
            'grid': gridShaders,
            'regular': regularShaders,
            'picking': pickingShaders,
            'outline': outlineShaders
        };
    }

    private updateProjMat() {
        for (const p of Object.values(this.programs)) {
            const loc = this.gl.getUniformLocation(p, 'uProjMat');
            this.gl.useProgram(p);
            this.gl.uniformMatrix4fv(loc, false, this.projMat);
        }
    }
}