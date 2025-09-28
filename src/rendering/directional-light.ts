import { Mat, type Vec3 } from "../math/mat.js";

export class DirectionalLight {
    private readonly locName = 'uLightDir';
    private direction = {
        x: -0.5,
        y: -1.0,
        z: -0.3
    };

    private uLightDirLoc: WebGLUniformLocation | null;

    constructor(private gl: WebGL2RenderingContext, private program: WebGLProgram) {
        this.uLightDirLoc = gl.getUniformLocation(program, this.locName);
        gl.useProgram(program);
        gl.uniform3fv(this.uLightDirLoc, Object.values(this.direction));
    }


    moveX(dx: number) {
        if (this.direction.x + dx > 1.0 || this.direction.x + dx < -1.0)
            return;

        this.direction.x += dx;
        this.setUniform();
    }

    moveZ(dz: number) {
        if (this.direction.z + dz > 1.0 || this.direction.z + dz < -1.0)
            return;

        this.direction.z += dz;
        this.setUniform();
    }

    setUniform() {
        const data = Object.values(this.direction) as Vec3;
        const normalized = Mat.normalize(data);
        this.direction.x = normalized[0];
        this.direction.y = normalized[1];
        this.direction.z = normalized[2];
        this.gl.useProgram(this.program);
        this.gl.uniform3fv(this.uLightDirLoc, normalized);
    }

}