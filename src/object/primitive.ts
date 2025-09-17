import type { Mesh } from "./mesh.js";

export class Primitive {

    constructor(private vertices: number[] = [], 
        private indices: number[] = [],
        private hasNormals = false,
        private hasColors = false
    ) {}

    buildMesh(): Mesh {
        const isUInt = this.indices.length > 65535;

        return {
            vertices: new Float32Array(this.vertices),
            isUInt,
            indices: isUInt ?
                new Uint32Array(this.indices) :
                new Uint16Array(this.indices),
            texturable: false,
            hasNormals: this.hasNormals,
            hasColors: this.hasColors,
            isPrimitive: true
        };
    }
}