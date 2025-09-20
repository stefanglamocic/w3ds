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

    const obj = await renderer.loadRegularModel('res/garbage-truck.obj')
        .then(r => {
            r.move({x: 0, y: -1.1, z: 0, theta: -30, phi: 0}); 
            return r;
        });

    renderer.loadTexture('res/colormap.png', obj.getProgram())
        .then(tex => obj.setTexture(tex));

    const cube = renderer.loadCube();
    cube.move({x: 3.12, y: 0, z: -0.7, theta: 45, phi: 0});
    renderer.loadCube().move({x: -5.4, y: 0, z: -6.7, theta: 12, phi: 90});

    // renderer.deleteObject(cube);

    renderer.debug();

}