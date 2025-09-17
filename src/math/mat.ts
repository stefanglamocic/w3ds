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

    static transX(mat: number[], x: number) {
        mat[12]! += x;
    }

    static transY(mat: number[], y: number) {
        mat[13]! += y;
    }

    static transZ(mat: number[], z: number) {
        mat[14]! += z;
    }

    static scale(mat: number[], s: number) {
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                mat[i + 4 * j]! *= s;
            }
        }
    }

    static degToRad(angle: number) {
        return angle * Math.PI / 180;
    }
}