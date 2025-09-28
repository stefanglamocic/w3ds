export class ShadowMapFBO {
    private fbo!: WebGLFramebuffer;
    private depthTex!: WebGLTexture;

    constructor(private gl: WebGL2RenderingContext, private width: number, private height: number) { 
        this.init();
    }

    private init() {
        this.fbo = this.gl.createFramebuffer();
        this.createDepthTex();

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT,
            this.gl.TEXTURE_2D, this.depthTex, 0);

        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE)
            throw new Error("Shadow map framebuffer error!");

        this.gl.drawBuffers([this.gl.NONE]);
        this.gl.readBuffer(this.gl.NONE);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    private createDepthTex() {
        this.depthTex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT32F,
            this.width, this.height, 0, this.gl.DEPTH_COMPONENT, this.gl.FLOAT, null
        );
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    }
}