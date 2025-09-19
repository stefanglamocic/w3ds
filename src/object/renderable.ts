import { Mat } from "../math/mat.js";
import type { Mesh } from "./mesh.js";
import { defaultPosition, type Position } from "./position.js";
import { UniformManager } from "./uniform-manager.js";

//vertex arr is interleaved
//for obj: pos -> texPos? -> normal
//for primitive: pos -> normal -> color

export class Renderable {
    private static readonly uniformNames = ['uHasColor'];

    private position: Position = defaultPosition();
    private modelMat: number[];
    private modelMatLoc: WebGLUniformLocation | null;
    private uniformManager: UniformManager;
    

    constructor(private gl: WebGL2RenderingContext, 
        private mesh: Mesh,
        private program: WebGLProgram,
        private vao: WebGLVertexArrayObject | null = null
    ) {
        this.modelMatLoc = gl.getUniformLocation(program, 'uModelMat');
        this.modelMat = Mat.getIdentityMat();
        this.uniformManager = new UniformManager(gl, program, Renderable.uniformNames);
        this.init();
    }

    draw() {
        this.gl.bindVertexArray(this.vao);
        this.gl.useProgram(this.program);
        this.gl.uniformMatrix4fv(this.modelMatLoc, 
            false,
            this.modelMat
        );
        this.uniformManager.setBool(Renderable.uniformNames[0]!, this.mesh.hasColors);
        this.gl.drawElements(this.gl.TRIANGLES, 
            this.getCount(),
            this.getType(),
            0 
        );
    }

    move(dPos: Position) {
        this.position.x += dPos.x;
        this.position.y += dPos.y;
        this.position.z += dPos.z;
        this.position.theta += dPos.theta;
        this.position.phi += dPos.phi;

        Mat.setIdentityMat(this.modelMat);
        Mat.translate(this.modelMat, this.position);
        Mat.rotY(this.modelMat, this.position.theta);
        Mat.rotX(this.modelMat, this.position.phi);
    }

    getVAO() { return this.vao; }

    getProgram() { return this.program; }

    getCount() { return this.mesh.indices.length; }

    getType() { return this.mesh.isUInt ? 
        this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT;
    }

    getModelMat() { return this.modelMat; }

    private pointToAttrib(loc: number, isTex2D: boolean, 
        stride: number, offset: number) {
        if (loc === -1)
            return;

        this.gl.vertexAttribPointer(loc, 
            isTex2D ? 2 : 3, 
            this.gl.FLOAT,
            false, 
            stride,
            offset
        );
        this.gl.enableVertexAttribArray(loc);
    }

    private init() {
        if (this.vao !== null)
            return;
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        const vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER, 
            this.mesh.vertices, 
            this.gl.STATIC_DRAW);
        //for primitive meshes
        if (this.mesh.isPrimitive) {
            const stride = 3 * 4 + 
            (this.mesh.hasNormals ? 3 * 4 : 0) +
            (this.mesh.hasColors ? 3 * 4 : 0);

            const attribs: Attribute[] =
                [
                    {name: 'aPosition', exists: true},
                    {name: 'aNormal', exists: this.mesh.hasNormals},
                    {name: 'aColor', exists: this.mesh.hasColors}
                ]
            let offset = 0;
            for (const a of attribs) {
                if (!a.exists)
                    continue;
                const loc = this.gl.getAttribLocation(this.program, a.name);
                this.pointToAttrib(loc, false, stride, offset);
                offset += 3 * 4;
            }
        }
        //for obj meshes
        else {
            const stride = 6 * 4 + (this.mesh.texturable ? 2 * 4 : 0);

            const attribs: Attribute[] = [
                {name: 'aPosition', exists: true},
                {name: 'aTexCoord', exists: this.mesh.texturable},
                {name: 'aNormal', exists: this.mesh.hasNormals}
            ];

            let offset = 0;

            for (const [i, a] of attribs.entries()) {
                if (!a.exists)
                    continue;
                const loc = this.gl.getAttribLocation(this.program, a.name);
                this.pointToAttrib(loc, i === 1, stride, offset);
                offset += (i === 1) ? 2 * 4 : 3 * 4;
            }
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        const ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, 
            this.mesh.indices,
            this.gl.STATIC_DRAW
        );

        this.gl.bindVertexArray(null);
    }
}

type Attribute = {
    name: string,
    exists: boolean
};