import { Camera } from "./camera.js";
import { InputEvents } from "./input-events.js";
import { Mat } from "./math/mat.js";
import { buildCube } from "./object/cube.js";
import { Renderable } from "./object/renderable.js";
import { ShaderProgram } from "./shader-program.js";
import { Utility } from "./util.js";

const vertShaderFile = 'shaders/vertexShader.vert';
const fragShaderFile = 'shaders/fragmentShader.frag';

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

    const vsSource = await Utility.readFile(vertShaderFile);
    const fsSource = await Utility.readFile(fragShaderFile);

    setContextState(canvas);

    const program = new ShaderProgram(gl, vsSource, fsSource).getProgram();

    const renderables: Renderable[] = [];
    const cubeMesh = buildCube();
    renderables.push(new Renderable(gl, cubeMesh, program));
    renderables.push(new Renderable(gl, cubeMesh, program));
    renderables[1]?.move({
        x: 2, y: 0, z: -3, theta: 10, phi: 0
    });

    const uProjMatLoc = gl.getUniformLocation(program, 'uProjMat');
    const uViewMatLoc = gl.getUniformLocation(program, 'uViewMat');
    const uModelMatLoc = gl.getUniformLocation(program, 'uModelMat');

    gl.useProgram(program);

    const projMat = Mat.getProjectionMat(FOV, 
        canvas.width / canvas.height, 
        1, 100);
    gl.uniformMatrix4fv(uProjMatLoc, false, projMat);

    const viewMat = Mat.getIdentityMat();
    const camera = new Camera(inputEvents, viewMat);
    camera.move();
    gl.uniformMatrix4fv(uViewMatLoc, false, viewMat);

    const modelMat = Mat.getIdentityMat();
    gl.uniformMatrix4fv(uModelMatLoc, false, modelMat);

    const animate = (timestamp: number) => {
        if (canvas.width !== canvasSize[0] || canvas.height !== canvasSize[1]) {
            resizeCanvas(canvas);
            Mat.setAspectRatio(projMat, FOV, canvas.width / canvas.height);
            gl.uniformMatrix4fv(uProjMatLoc, false, projMat);
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        camera.move();
        gl.uniformMatrix4fv(uViewMatLoc, false, viewMat);

        for (const r of renderables) {
            gl.bindVertexArray(r.getVAO());
            gl.useProgram(r.getProgram());
            gl.uniformMatrix4fv(uModelMatLoc, false, r.getModelMat());
            gl.drawElements(gl.TRIANGLES, r.getCount(), r.getType(), 0);
        }

        requestAnimationFrame(animate);
    };

    animate(0);
}

function setContextState(canvas: HTMLCanvasElement) {
    resizeCanvas(canvas);
    gl.clearColor(0.15, 0.15, 0.15, 1.0);
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