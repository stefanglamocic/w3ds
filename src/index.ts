import { Camera } from "./camera.js";
import { InputEvents } from "./input-events.js";
import { Mat } from "./math/mat.js";
import { buildCube } from "./object/cube.js";
import { Grid } from "./object/grid.js";
import { Renderable } from "./object/renderable.js";
import { ShaderProgram } from "./shader-program.js";
import { Utility } from "./util.js";

const vertShaderFile = 'shaders/vertexShader.vert';
const fragShaderFile = 'shaders/fragmentShader.frag';
const gridVertFile = 'shaders/grid.vert';
const gridFragFile = 'shaders/grid.frag';

var gl!: WebGL2RenderingContext;
var FOV = 60;
var canvasSize: [number, number] = [window.innerWidth, window.innerHeight];

window.addEventListener('DOMContentLoaded', main);
window.addEventListener('resize', () => canvasSize = [window.innerWidth, window.innerHeight]);

async function main() {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    gl = canvas.getContext('webgl2')!;

    if (!gl) {
        //handle gl context error
        return;
    }

    const inputEvents = new InputEvents();

    const [gridVSrc, gridFSrc, vsSource, fsSource] = await Promise.all([
        Utility.readFile(gridVertFile),
        Utility.readFile(gridFragFile),
        Utility.readFile(vertShaderFile),
        Utility.readFile(fragShaderFile)
    ]);

    setContextState(canvas);

    const projMat = Mat.getProjectionMat(FOV, 
        canvas.width / canvas.height, 
        1, 100);
    const viewMat = Mat.getIdentityMat();

    const gridShaderProg = new ShaderProgram(gl, gridVSrc, gridFSrc).getProgram();
    const program = new ShaderProgram(gl, vsSource, fsSource).getProgram();

    const programs = [gridShaderProg, program];

    const renderables: Renderable[] = [];
    const cubeMesh = buildCube();
    Utility.readFile('res/bunny.obj')
        .then(source => {
            const mesh = Utility.parseObj(source).buildMesh();
            const r = new Renderable(gl, mesh, program);
            renderables.push(r);

            r.move({x: -2, y: 0, z: 0, theta: 0, phi: 0});
        });
    const cubeRenderable = new Renderable(gl, cubeMesh, program);
    const cubeCopy = new Renderable(gl, cubeMesh, program, cubeRenderable.getVAO());
    renderables.push(cubeRenderable);
    renderables.push(cubeCopy);
    cubeRenderable.move({
        x: 2, y: 0, z: -3, theta: 10, phi: 0
    });
    cubeCopy.move({
        x: -1, y: 0, z: -4.4, theta: 120, phi: 76
    });

    const camera = new Camera(inputEvents, viewMat);
    camera.move(gl, programs);

    const grid = new Grid(gl, gridShaderProg);
    
    updateProjMat(programs, projMat);
    
    const animate = (timestamp: number) => {
        if (canvas.width !== canvasSize[0] || canvas.height !== canvasSize[1]) {
            resizeCanvas(canvas);
            Mat.setAspectRatio(projMat, FOV, canvas.width / canvas.height);
            updateProjMat(programs, projMat);
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        camera.move(gl, programs);

        for (const r of renderables) {
            r.draw();
        }

        // gl.disable(gl.CULL_FACE);
        // grid.draw(projMat, viewMat, camera.getWorldPos());
        // gl.enable(gl.CULL_FACE);

        requestAnimationFrame(animate);
    };

    animate(0);
}

function updateProjMat(programs: WebGLProgram[], projMat: number[]) {
    for (const p of programs) {
        const loc = gl.getUniformLocation(p, 'uProjMat');
        gl.useProgram(p);
        gl.uniformMatrix4fv(loc, false, projMat);
    }
}

function setContextState(canvas: HTMLCanvasElement) {
    resizeCanvas(canvas);
    gl.clearColor(0.16, 0.16, 0.16, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
}

function resizeCanvas(canvas: HTMLCanvasElement) {
    canvas.width = canvasSize[0];
    canvas.height = canvasSize[1];

    if (gl)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}