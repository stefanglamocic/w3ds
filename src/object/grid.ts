export class Grid {
    private uProjMatLoc: WebGLUniformLocation | null;
    private uViewMatLoc: WebGLUniformLocation | null;
    private uCamPosLoc: WebGLUniformLocation | null;

    constructor(private gl: WebGL2RenderingContext,
        private program: WebGLProgram
    ) {
        this.uProjMatLoc = gl.getUniformLocation(program, 'uProjMat');
        this.uViewMatLoc = gl.getUniformLocation(program, 'uViewMat');
        this.uCamPosLoc = gl.getUniformLocation(program, 'uCamPos');
    }

    draw(projMat: number[], viewMat: number[], camPos: number[]) {
        this.gl.useProgram(this.program);
        this.gl.uniformMatrix4fv(this.uProjMatLoc, false, projMat);
        this.gl.uniformMatrix4fv(this.uViewMatLoc, false, viewMat);
        this.gl.uniform3fv(this.uCamPosLoc, camPos);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
}