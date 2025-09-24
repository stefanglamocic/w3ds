import type { Renderable } from "../object/renderable.js";

export class OutlineRenderer {
    private modelMatLoc: WebGLUniformLocation | null;

    constructor(private gl: WebGL2RenderingContext, private program: WebGLProgram) {
        this.modelMatLoc = gl.getUniformLocation(program, 'uModelMat');
    }

    draw(r: Renderable) {
        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(r.getVAO());
        this.gl.uniformMatrix4fv(this.modelMatLoc, false, r.getModelMat());

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.FRONT);
        this.gl.drawElements(this.gl.TRIANGLES, r.getCount(), r.getType(), 0);
        this.gl.cullFace(this.gl.BACK);
    }
}