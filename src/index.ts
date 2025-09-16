import { Camera } from "./camera.js";
import { InputEvents } from "./input-events.js";
import { Mat } from "./mat.js";
import { ShaderProgram } from "./shader-program.js";
import { Utility } from "./util.js";

const cubeVertArr =
[
    -1, -1, 1,    0, 0, 1,
    1, -1, 1,     0, 0, 1,
    1, 1, 1,      0, 0, 1,
    -1, 1, 1,     0, 0, 1,

    1, -1, 1,     1, 0, 0,
    1, -1, -1,    1, 0, 0,
    1, 1, -1,     1, 0, 0,
    1, 1, 1,      1, 0, 0,

    -1, -1, -1,    1, 0, 1,
    1, -1, -1,     1, 0, 1,
    1, -1, 1,      1, 0, 1,
    -1, -1, 1,     1, 0, 1,

    -1, -1, -1,   0, 1, 1,
    -1, -1, 1,    0, 1, 1,
    -1, 1, 1,     0, 1, 1,
    -1, 1, -1,    0, 1, 1,

    -1, 1, 1,     0, 1, 0,
    1, 1, 1,      0, 1, 0,
    1, 1, -1,     0, 1, 0,
    -1, 1, -1,    0, 1, 0,

    -1, 1, -1,     1, 1, 0,
    1, 1, -1,      1, 1, 0,
    1, -1, -1,     1, 1, 0,
    -1, -1, -1,    1, 1, 0,

];

const cubeIndexArr = 
[
    0, 1, 2,    0, 2, 3,
    4, 5, 6,    4, 6, 7,
    8, 9, 10,   8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
];

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
    gl.useProgram(program);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertArr), gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 6 * 4, 0);
    gl.enableVertexAttribArray(aPositionLoc);
    const aColorLoc = gl.getAttribLocation(program, 'aColor');
    gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
    gl.enableVertexAttribArray(aColorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndexArr), gl.STATIC_DRAW);

    const uProjMatLoc = gl.getUniformLocation(program, 'uProjMat');
    const uViewMatLoc = gl.getUniformLocation(program, 'uViewMat');
    const uModelMatLoc = gl.getUniformLocation(program, 'uModelMat');

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

        gl.drawElements(gl.TRIANGLES, cubeIndexArr.length, gl.UNSIGNED_SHORT, 0);
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