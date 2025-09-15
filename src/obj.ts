export class Obj {
    [key: string]: any;

    constructor(public v: number[] = [],
        public vt: number[] = [],
        public vn: number[] = [],
        public f: Array<[number, number | null, number]> = []
    ) {}

    canApplyTex() { 
        if (this.f.length > 0) {
            return this.f[0]![1] !== null;
        }

        return false;
    }

    buildMesh() {
        const vertices: number[] = [];
        const indices: number[] = [];

        let i = 0;
        const iMapping: Map<string, number> = new Map();
        for (const face of this.f) {
            const key = face.join('/');
            if (iMapping.has(key)) {
                indices.push(iMapping.get(key)!);
                continue;
            }

            indices.push(i);
            iMapping.set(key, i++);

            for (const [id, fId] of face.entries()) {
                if (fId === null)
                    continue;
                const verts = this.pickVertices(id, fId);
                vertices.push(...verts);
            } 
        }

        let isUInt = indices.length > 65535;
        return {
            vertices: new Float32Array(vertices),
            indices: isUInt ?
                new Uint32Array(indices) :
                new Uint16Array(indices),
            isUInt: isUInt
        };
    }

    private pickVertices(id: number, fId: number): number[] {
        const i = (fId - 1) * 3;
        const ti = (fId - 1) * 2;
        switch (id) {
            case 0:
                return [this.v[i]!, this.v[i + 1]!, this.v[i + 2]!];
            case 1:
                return [this.vt[ti]!, this.vt[ti + 1]!];
            case 2:
                return [this.vn[i]!, this.vn[i + 1]!, this.vn[i + 2]!];
            default:
                return [];
        }
    }
}