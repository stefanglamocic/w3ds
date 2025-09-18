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

    private getLoc(name: string) {
        const loc = this.locations[name];
        if (loc === null || loc === undefined)
            throw new Error("unknown uniform name: " + name);

        return loc;
    }

}