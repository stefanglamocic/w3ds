export class UniformManager {
    private locations: Record<string, WebGLUniformLocation | null> = {};

    constructor(private gl: WebGL2RenderingContext,
        private program: WebGLProgram,
        private commonUniforms: string[]
    ) {
        for (const u of commonUniforms) {
            this.locations[u] = gl.getUniformLocation(program, u);
        }
    }

    setBool(name: string, value: boolean) {
        const loc = this.getLoc(name);

        this.gl.uniform1i(loc, value ? 1 : 0);
    }

    setVec3(name: string, value: number[]) {
        const loc = this.getLoc(name);
        this.gl.uniform3fv(loc, value);
    }

    setMat4(name: string, value: number[]) {
        const loc = this.getLoc(name);
        this.gl.uniformMatrix4fv(loc, false, value);
    }

    setActiveTex(name: string, texture: WebGLTexture, unit: number) {
        const loc = this.getLoc(name);
        this.gl.uniform1i(loc, unit);
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    }

    private getLoc(name: string) {
        const loc = this.locations[name];
        if (loc === null || loc === undefined) {
            console.warn("Uniform not found or optimized away:", name);
            return null;
        }

        return loc;
    }

}