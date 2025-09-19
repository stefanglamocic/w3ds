import { Camera } from "./camera.js";
import { InputEvents } from "./input-events.js";
import { Mat } from "./math/mat.js";
import { Renderable } from "./object/renderable.js";
import { ShaderProgram } from "./shader-program.js";
import { Utility } from "./util.js";

const vertShaderFile = 'shaders/vertexShader.vert';
const fragShaderFile = 'shaders/fragmentShader.frag';
const gridVertFile = 'shaders/grid.vert';
const gridFragFile = 'shaders/grid.frag';


var FOV = 60;
var canvasSize: [number, number] = [window.innerWidth, window.innerHeight];

export class Renderer {
    private programs: { [key: string]: WebGLProgram } = {};

    private projMat: number[];
    private viewMat = Mat.getIdentityMat();

    private inputEvents: InputEvents;
    private camera: Camera;

    private renderables: Renderable[] = [];

    private constructor(private gl: WebGL2RenderingContext,
        private canvas: HTMLCanvasElement) {
        window.addEventListener('resize', () => canvasSize = [window.innerWidth, window.innerHeight]);
        this.setContextState();
        this.projMat = Mat.getProjectionMat(FOV, canvas.width / canvas.height, 1, 100);
        this.inputEvents = new InputEvents();
        this.camera = new Camera(this.inputEvents, this.viewMat);
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

    loadPrimitiveModel(file: string) {
        const program = this.programs['regular'];
        if (program === undefined)
            throw new Error("Regular shader program is missing!");
        this.loadModel(file, program);
    }

    loadModel(file: string, program: WebGLProgram) {
        Utility.readFile(file)
            .then(source => {
                const mesh = Utility.parseObj(source).buildMesh();
                this.renderables.push(new Renderable(this.gl, mesh, program));
            });
    }

    private setContextState() {
        this.resizeCanvas();
        this.gl.clearColor(0.16, 0.16, 0.16, 1.0);
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