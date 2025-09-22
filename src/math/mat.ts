export class Mat {
    static getIdentityMat() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    };

    static setIdentityMat(mat: number[]) {
        for (let i = 0; i < 16; ++i) {
            if (i % 5 == 0)
                mat[i] = 1;
            else
                mat[i] = 0;
        }

    }

    static getProjectionMat(angle: number, ar: number, zMin: number, zMax: number) {
        const t = Math.tan(this.degToRad(angle * 0.5)),
            A = -(zMax + zMin) / (zMax - zMin),
            B = (-2 * zMax * zMin) / (zMax - zMin);

        return [
            1 / t, 0, 0, 0,
            0, ar / t, 0, 0,
            0, 0, A, -1,
            0, 0, B, 0,
        ];
    }

    static setAspectRatio(mat: number[], angle: number, ar: number) {
        const t = Math.tan(this.degToRad(angle * 0.5));
        mat[0] = 1 / t;
        mat[5] = ar / t;
    }

    static rotX(mat: number[], angle: number) {
        const c = Math.cos(this.degToRad(angle));
        const s = Math.sin(this.degToRad(angle));
        const mv1 = mat[1], mv5 = mat[5], mv9 = mat[9];
        mat[1] = mat[1]! * c - mat[2]! * s;
        mat[5] = mat[5]! * c - mat[6]! * s;
        mat[9] = mat[9]! * c - mat[10]! * s;

        mat[2] = mat[2]! * c + mv1! * s;
        mat[6] = mat[6]! * c + mv5! * s;
        mat[10] = mat[10]! * c + mv9! * s;
    }

    static rotY(mat: number[], angle: number) {
        const c = Math.cos(this.degToRad(angle));
        const s = Math.sin(this.degToRad(angle));
        const mv0 = mat[0], mv4 = mat[4], mv8 = mat[8];

        mat[0] = c * mat[0]! + s * mat[2]!;
        mat[4] = c * mat[4]! + s * mat[6]!;
        mat[8] = c * mat[8]! + s * mat[10]!;

        mat[2] = c * mat[2]! - s * mv0!;
        mat[6] = c * mat[6]! - s * mv4!;
        mat[10] = c * mat[10]! - s * mv8!;
    }

    static rotZ(mat: number[], angle: number) {
        const c = Math.cos(this.degToRad(angle));
        const s = Math.sin(this.degToRad(angle));

        const mv0 = mat[0], mv4 = mat[4], mv8 = mat[8];

        mat[0] = mat[0]! * c - mat[1]! * s;
        mat[4] = mat[4]! * c - mat[5]! * s;
        mat[8] = mat[8]! * c - mat[9]! * s;

        mat[1] = mv0! * s + mat[1]! * c;
        mat[5] = mv4! * s + mat[5]! * c;
        mat[9] = mv8! * s + mat[9]! * c;
    }

    static modelToNormalMat(modelMat: number[], normalMat: number[]) {
        const a00 = modelMat[0]!;
        const a01 = modelMat[1]!;
        const a02 = modelMat[2]!;
        const a03 = modelMat[3]!;
        const a10 = modelMat[4]!;
        const a11 = modelMat[5]!;
        const a12 = modelMat[6]!;
        const a13 = modelMat[7]!;
        const a20 = modelMat[8]!;
        const a21 = modelMat[9]!;
        const a22 = modelMat[10]!;
        const a23 = modelMat[11]!;
        const a30 = modelMat[12]!;
        const a31 = modelMat[13]!;
        const a32 = modelMat[14]!;
        const a33 = modelMat[15]!;

        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;

        // Calculate the determinant
        let det =
            b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
            this.setIdentityMat(normalMat);
        }
        det = 1.0 / det;

        normalMat[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        normalMat[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        normalMat[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        normalMat[3] = 0;

        normalMat[4] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        normalMat[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        normalMat[6] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        normalMat[7] = 0;

        normalMat[8] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        normalMat[9] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        normalMat[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        normalMat[11] = 0;

        // No translation
        normalMat[12] = 0;
        normalMat[13] = 0;
        normalMat[14] = 0;
        normalMat[15] = 1;
    }

    static transX(mat: number[], x: number) {
        mat[12]! += x;
    }

    static transY(mat: number[], y: number) {
        mat[13]! += y;
    }

    static transZ(mat: number[], z: number) {
        mat[14]! += z;
    }

    static translate(mat: number[], pos: { x: number, y: number, z: number }) {
        this.transX(mat, pos.x);
        this.transY(mat, pos.y);
        this.transZ(mat, pos.z);
    }

    static scale(mat: number[], s: number) {
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                mat[i + 4 * j]! *= s;
            }
        }
    }

    static dot(x: Vec3, y: Vec3) {
        let res = 0;
        for (let i = 0; i < 3; ++i) {
            res += x[i]! * y[i]!;
        }

        return res;
    }

    static cross(a: Vec3, b: Vec3): Vec3 {
        return [
            a[1]*b[2] - a[2]*b[1],
            a[2]*b[0] - a[0]*b[2],
            a[0]*b[1] - a[1]*b[0]
        ];
    }

    static normalize(v: Vec3): Vec3 {
        const len = Math.hypot(...v);
        if (len === 0)
            return [0, 0, 0];
        
        return [v[0] / len, v[1] / len, v[2] / len];
    }

    // rotation of v around k
    //Rodrigues rotation
    static rotateVec(v: Vec3, k: Vec3, angle: number): Vec3 {
        const theta = this.degToRad(angle);

        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const kN = this.normalize(k);

        const kxv = this.cross(kN, v);
        const kdotv = this.dot(kN, v);

        return [
            v[0] * c + kxv[0] * s + kN[0] * kdotv * (1 - c),
            v[1] * c + kxv[1] * s + kN[1] * kdotv * (1 - c),
            v[2] * c + kxv[2] * s + kN[2] * kdotv * (1 - c)
        ];
}

    static degToRad(angle: number) {
        return angle * Math.PI / 180;
    }
}

export type Vec3 = [number, number, number];