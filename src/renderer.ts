import { Camera } from "./camera.js";
import { InputEvents } from "./input-events.js";
import { Mat } from "./math/mat.js";
import { buildCube } from "./object/cube.js";
import { Renderable } from "./object/renderable.js";
import { ShaderProgram } from "./shader-program.js";
import { Utility } from "./util.js";

const vertShaderFile = 'shaders/vertexShader.vert';
const fragShaderFile = 'shaders/fragmentShader.frag';
const gridVertFile = 'shaders/grid.vert';
const gridFragFile = 'shaders/grid.frag';

var FOV = 60;
var canvasSize: [number, number] = [window.innerWidth, window.innerHeight];
const clearColor: [number, number, number, number] = [0.16, 0.16, 0.16, 1.0];

export class Renderer {
    private programs: { [key: string]: WebGLProgram } = {};

    private projMat: number[];
    private viewMat = Mat.getIdentityMat();

    private inputEvents: InputEvents;
    private camera: Camera;

    private rendInstances = new Map<string, Renderable[]>();
    private renderables: Renderable[] = [];
    private loadedTextures: Record<string, {tex: WebGLTexture, refs: number}> = {};

    private constructor(private gl: WebGL2RenderingContext,
        private canvas: HTMLCanvasElement) {
        window.addEventListener('resize', () => canvasSize = [window.innerWidth, window.innerHeight]);
        this.setContextState();
        this.projMat = Mat.getProjectionMat(FOV, canvas.width / canvas.height, 1, 100);
        this.inputEvents = new InputEvents();
        this.camera = new Camera(this.inputEvents, this.viewMat);
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
            r.draw();
        }

        requestAnimationFrame(this.run);
    }

    static async init(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
        const rend = new Renderer(gl, canvas);
        const shaderPairs = await Renderer.readShaderFiles();

        rend.programs['grid'] = new ShaderProgram(gl,
            shaderPairs.gridShaders[0],
            shaderPairs.gridShaders[1]
        ).getProgram();

        rend.programs['regular'] = new ShaderProgram(gl,
            shaderPairs.regularShaders[0],
            shaderPairs.regularShaders[1]
        ).getProgram();

        rend.camera.move(gl, Object.values(rend.programs));
        rend.updateProjMat();

        return rend;
    }

    async loadRegularModel(file: string) {
        const program = this.programs['regular'];
        if (program === undefined)
            throw new Error("Regular shader program is missing!");
        return this.loadModel(file, program);
    }

    async loadModel(file: string, program: WebGLProgram) {
        if (this.rendInstances.has(file) && 
            this.rendInstances.get(file)!.length > 0) {
            const temp = this.rendInstances.get(file)![0]!;
            const mesh = temp.getMesh();
            const vao = temp.getVAO();

            const r = new Renderable(this.gl, mesh, program, vao);
            this.rendInstances.get(file)?.push(r);
            this.renderables.push(r);

            return r;
        }
        return Utility.readFile(file)
            .then(source => {
                const mesh = Utility.parseObj(source).buildMesh();
                const r = new Renderable(this.gl, mesh, program);
                this.rendInstances.set(file, [r]);
                this.renderables.push(r);

                return r;
            });
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

    deleteObject(r: Renderable) {
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

        for (const rends of this.rendInstances.values()) {
            if (rends.length > 0 && rends[0]!.getVAO() === r.getVAO()) {
                this.delArrEl(rends, r);
                if (rends.length === 0) {
                    r.destroy();
                }
                break;
            }
        }

    }

    async loadTexture(file: string, program: WebGLProgram) {
        if (file in this.loadedTextures && this.loadedTextures[file]!.refs > 0) {
            this.loadedTextures[file]!.refs++;
            return this.loadedTextures[file]!.tex;
        }
        const texture = this.gl.createTexture();
        return Utility.loadImage(file)
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

                this.loadedTextures[file] = {tex: texture, refs: 1};

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

        return {
            'gridShaders': gridShaders,
            'regularShaders': regularShaders
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