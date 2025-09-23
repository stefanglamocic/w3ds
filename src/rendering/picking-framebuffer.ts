import type { Renderable } from "../object/renderable.js";

export class PickingFramebuffer {
    private fbo!: WebGLFramebuffer;
    private pickingTex!: WebGLTexture;
    private depthBuffer!: WebGLTexture;

    private locations: Record<string, WebGLUniformLocation | null> = {};

    constructor(private gl: WebGL2RenderingContext, 
        private width: number, 
        private height: number
    ) {
        this.init();
    }

    private init() {
        this.fbo = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);

        this.pickingTex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.pickingTex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RG32UI, this.width, this.height, 0, 
            this.gl.RG_INTEGER, this.gl.UNSIGNED_INT, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, 
            this.gl.TEXTURE_2D, this.pickingTex, 0);

        this.depthBuffer = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthBuffer);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT32F, this.width, this.height, 
            0, this.gl.DEPTH_COMPONENT, this.gl.FLOAT, null);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT,
             this.gl.TEXTURE_2D, this.depthBuffer, 0);

        if (!this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER)) {
            throw new Error("Framebuffer error!");
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    enableWriting() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    }

    disableWriting() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    setUniformLocs(program: WebGLProgram) {
        this.locations['uModelMat'] = this.gl.getUniformLocation(program, 'uModelMat');
        this.locations['uObjectIndex'] = this.gl.getUniformLocation(program, 'uObjectIndex');
        this.locations['uDrawIndex'] = this.gl.getUniformLocation(program, 'uDrawIndex');
    }

    drawToBuffer(r: Renderable) {
        this.gl.bindVertexArray(r.getVAO());
        this.gl.uniformMatrix4fv(this.locations['uModelMat']!, false, r.getModelMat());
        this.gl.uniform1ui(this.locations['uObjectIndex']!, r.ID);
        this.gl.uniform1ui(this.locations['uDrawIndex']!, 0);
        this.gl.drawElements(this.gl.TRIANGLES, 
            r.getCount(),
            r.getType(),
            0 
        );
    }

    readPixel(x: number, y: number) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);

         const data = new Uint32Array(2);
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0);
        this.gl.readPixels(x, y, 1, 1, this.gl.RG_INTEGER, this.gl.UNSIGNED_INT, data);

        this.gl.readBuffer(this.gl.NONE);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        return data[0];
    }
}