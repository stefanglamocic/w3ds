import type { InputEvents } from "./input-events.js";
import { Mat } from "./math/mat.js";
import type { Position } from "./object/position.js";

export class Camera {
    private readonly movSens = 0.15;
    private readonly rotSens = 0.2;
    private readonly zoomSens = 0.01;
    private readonly panSens = 0.01;

    private position: Position = {
        x: 0,
        y: 0,
        z: 9,
        theta: 0,
        phi: 0
    };
    private firstFrame = true;
    private viewMatLocs = new Map<WebGLProgram, WebGLUniformLocation>();

    constructor(private inputEvents: InputEvents, private viewMat: number[]) {}

    move(gl:WebGL2RenderingContext, programs: WebGLProgram[]) {
        const moved = this.updatePosition();
        if (!moved && !this.firstFrame)
            return;
        Mat.setIdentityMat(this.viewMat);
        Mat.transX(this.viewMat, -this.position.x);
        Mat.transY(this.viewMat, -this.position.y);
        Mat.transZ(this.viewMat, -this.position.z);
        Mat.rotY(this.viewMat, -this.position.theta);
        Mat.rotX(this.viewMat, -this.position.phi);

        this.storeLocations(gl, programs, 'uViewMat');

        for (const p of programs) {
            const loc = this.viewMatLocs.get(p)!;
            gl.useProgram(p);
            gl.uniformMatrix4fv(loc, false, this.viewMat);
        }
        this.firstFrame = false;
    }

    getWorldPos() { return [this.position.x, this.position.y, this.position.z]; }

    private updatePosition(): boolean {
        let moved = false;

        const phiRad = Mat.degToRad(this.position.phi);
        const thetaRad = Mat.degToRad(this.position.theta);

        const fX = -Math.sin(thetaRad) * this.movSens;
        const fY = Math.sin(phiRad) * this.movSens;
        const fZ = -Math.cos(thetaRad) * Math.cos(phiRad) * this.movSens;

        const sX = Math.cos(thetaRad) * this.movSens;
        const sZ = Math.sin(thetaRad) * this.movSens;

        if (this.inputEvents.isKeyActive('w')) {
            this.position.x += fX;
            this.position.y += fY;
            this.position.z += fZ;
            moved = true;
        }

        if (this.inputEvents.isKeyActive('a')) {
            this.position.x -= sX;
            this.position.z -= sZ;
            moved = true;
        }

        if (this.inputEvents.isKeyActive('s')) {
            this.position.x -= fX;
            this.position.y -= fY;
            this.position.z -= fZ;
            moved = true;
        }

        if (this.inputEvents.isKeyActive('d')) {
            this.position.x += sX;
            this.position.z += sZ;
            moved = true;
        }

        if (this.inputEvents.middleMActive) {
            this.position.phi -= (this.inputEvents.rotDelta[1] * this.rotSens) % 360;
            this.position.theta -= (this.inputEvents.rotDelta[0] * this.rotSens) % 360;

            this.inputEvents.rotDelta = [0, 0];
            moved = true;
        }
        else if (this.inputEvents.rightMActive) {
            this.position.x -= this.inputEvents.movDelta[0] * this.panSens;
            this.position.y += this.inputEvents.movDelta[1] * this.panSens;

            this.inputEvents.movDelta = [0, 0];
            moved = true;
        }

        if (this.inputEvents.zoomDelta !== 0) {
            this.position.z += this.inputEvents.zoomDelta * this.zoomSens;
            this.inputEvents.zoomDelta = 0;

            moved = true;
        }

        return moved;
    }

    private storeLocations(gl:WebGL2RenderingContext, 
        programs: WebGLProgram[], name: string) {
        for (const p of programs) {
            if (!this.viewMatLocs.has(p))
                this.viewMatLocs.set(p, 
                    gl.getUniformLocation(p, name)!
                );
        }
    }
}