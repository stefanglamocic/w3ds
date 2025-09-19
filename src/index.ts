import { Renderer } from "./renderer.js";

var gl!: WebGL2RenderingContext;

const objFiles = ['res/bunny.obj', 'res/garbage-truck.obj'];


window.addEventListener('DOMContentLoaded', main);

async function main() {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    gl = canvas.getContext('webgl2')!;

    if (!gl) {
        //handle gl context error
        return;
    }

    const renderer = await Renderer.init(gl, canvas);
    renderer.run();

    renderer.loadPrimitiveModel(objFiles[0]!);
}