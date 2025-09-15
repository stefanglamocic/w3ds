export class ShaderProgram {
    private program: WebGLProgram;

    constructor(private gl: WebGL2RenderingContext,
        private vsSource: string,
        private fsSource: string
    ) {
        const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        this.program = this.linkProgram(vs, fs);
    }

    getProgram() { return this.program; }

    private linkProgram(vs: WebGLShader, fs: WebGLShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
            throw new Error("Can't link the program: " + this.gl.getProgramInfoLog(program));

        return program;
    }

    private compileShader(type: number, source: string) {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
            throw new Error("Can't compile shader: " + this.gl.getShaderInfoLog(shader));

        return shader;
    }
}