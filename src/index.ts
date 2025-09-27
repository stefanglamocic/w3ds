import { CustomScene } from "./rendering/custom-scene.js";
import { Renderer } from "./rendering/renderer.js";
import { addUiElements } from "./util/ui.js";

var gl!: WebGL2RenderingContext;

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
    renderer.enableGrid();
    renderer.run();

    addUiElements(renderer);

    CustomScene.load(renderer);
}