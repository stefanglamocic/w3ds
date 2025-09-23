import type { InputEvents } from "./input-events.js";
import { Mat, type Vec3 } from "../math/mat.js";

export class Camera {
    private readonly movSens = 0.15;
    private readonly rotSens = 0.07;
    private readonly zoomSens = 0.01;
    private readonly panSens = 0.01;

    private state: CameraState = {
        x: 0,
        y: 4,
        z: 12,
        u: [1, 0, 0],
        v: [0, 1, 0],
        n: [0, 0, 1]
    };
    private firstFrame = true;
    private viewMatLocs = new Map<WebGLProgram, WebGLUniformLocation>();

    constructor(private inputEvents: InputEvents, private viewMat: number[]) { 
            this.state.n = Mat.rotateVec(this.state.n, this.state.u, -20);
            this.state.v = Mat.cross(this.state.n, this.state.u);
            this.normalizeUVN();
    }

    move(gl: WebGL2RenderingContext, programs: WebGLProgram[]) {
        const moved = this.updatePosition();
        if (!moved && !this.firstFrame)
            return;
        Mat.setIdentityMat(this.viewMat);
        this.setCameraPosition();

        this.storeLocations(gl, programs, 'uViewMat');

        for (const p of programs) {
            const loc = this.viewMatLocs.get(p)!;
            gl.useProgram(p);
            gl.uniformMatrix4fv(loc, false, this.viewMat);
        }
        this.firstFrame = false;
    }

    getWorldPos() { return [this.state.x, this.state.y, this.state.z]; }

    private updatePosition(): boolean {
        let moved = false;


        if (this.inputEvents.isKeyActive('w')) {
            this.state.x -= this.state.n[0] * this.movSens;
            this.state.y -= this.state.n[1] * this.movSens;
            this.state.z -= this.state.n[2] * this.movSens;

            moved = true;
        }

        if (this.inputEvents.isKeyActive('a')) {
            this.state.x -= this.state.u[0] * this.movSens;
            this.state.y -= this.state.u[1] * this.movSens;
            this.state.z -= this.state.u[2] * this.movSens;

            moved = true;
        }

        if (this.inputEvents.isKeyActive('s')) {
            this.state.x += this.state.n[0] * this.movSens;
            this.state.y += this.state.n[1] * this.movSens;
            this.state.z += this.state.n[2] * this.movSens;

            moved = true;
        }

        if (this.inputEvents.isKeyActive('d')) {
            this.state.x += this.state.u[0] * this.movSens;
            this.state.y += this.state.u[1] * this.movSens;
            this.state.z += this.state.u[2] * this.movSens;

            moved = true;
        }

        if (this.inputEvents.middleMActive) {
            const dx = this.inputEvents.rotDelta[0] * this.rotSens;
            const dy = this.inputEvents.rotDelta[1] * this.rotSens;

            this.state.n = Mat.rotateVec(this.state.n, [0, 1, 0], -dx);
            this.state.u = Mat.normalize(Mat.cross([0, 1, 0], this.state.n));

            this.state.n = Mat.rotateVec(this.state.n, this.state.u, -dy);
            this.state.v = Mat.cross(this.state.n, this.state.u);

            this.normalizeUVN();

            this.inputEvents.rotDelta = [0, 0];
            moved = true;
        }
        else if (this.inputEvents.rightMActive) {
            this.state.x -= this.state.u[0] * this.inputEvents.movDelta[0] * this.panSens;
            this.state.y += this.state.v[1] * this.inputEvents.movDelta[1] * this.panSens;
            this.state.z += this.state.v[2] * this.inputEvents.movDelta[1] * this.panSens;

            this.inputEvents.movDelta = [0, 0];
            moved = true;
        }

        if (this.inputEvents.zoomDelta !== 0) {
            this.state.x += this.state.n[0] * this.inputEvents.zoomDelta * this.zoomSens;
            this.state.y += this.state.n[1] * this.inputEvents.zoomDelta * this.zoomSens;
            this.state.z += this.state.n[2] * this.inputEvents.zoomDelta * this.zoomSens;

            this.inputEvents.zoomDelta = 0;
            moved = true;
        }

        return moved;
    }

    private normalizeUVN() {
        this.state.n = Mat.normalize(this.state.n);
        this.state.u = Mat.normalize(this.state.u);
        this.state.v = Mat.normalize(this.state.v);
    }

    private setCameraPosition() {
        const camPos: Vec3 = [this.state.x, this.state.y, this.state.z];
        //inverse of local camera space to world space
        this.viewMat[0] = this.state.u[0]; this.viewMat[4] = this.state.u[1]; this.viewMat[8] = this.state.u[2]; this.viewMat[12] = -Mat.dot(this.state.u, camPos);
        this.viewMat[1] = this.state.v[0]; this.viewMat[5] = this.state.v[1]; this.viewMat[9] = this.state.v[2]; this.viewMat[13] = -Mat.dot(this.state.v, camPos);
        this.viewMat[2] = this.state.n[0]; this.viewMat[6] = this.state.n[1]; this.viewMat[10] = this.state.n[2]; this.viewMat[14] = -Mat.dot(this.state.n, camPos);
        this.viewMat[3] = 0; this.viewMat[7] = 0; this.viewMat[11] = 0; this.viewMat[15] = 1;
    }

    private storeLocations(gl: WebGL2RenderingContext,
        programs: WebGLProgram[], name: string) {
        for (const p of programs) {
            if (!this.viewMatLocs.has(p))
                this.viewMatLocs.set(p,
                    gl.getUniformLocation(p, name)!
                );
        }
    }
}

type CameraState = {
    x: number,
    y: number,
    z: number,
    u: Vec3,
    v: Vec3,
    n: Vec3
};