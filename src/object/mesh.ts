export type Mesh = {
    vertices: Float32Array,
    indices: Uint32Array | Uint16Array,
    isUInt: boolean,
    texturable: boolean,
    hasNormals: boolean,
    hasColors: boolean,
    isPrimitive: boolean
};