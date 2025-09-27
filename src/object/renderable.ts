import { Mat } from "../math/mat.js";
import type { Mesh } from "./mesh.js";
import { defaultPosition, type Position } from "./position.js";
import { UniformManager } from "./uniform-manager.js";

//vertex arr is interleaved
//for obj: pos -> texPos? -> normal
//for primitive: pos -> normal -> color

export class Renderable {
    private static counter = 1;
    public readonly ID: number;
    private static readonly uniformNames = ['uHasColor', 'uHasTex', 'uDiffuseMap', 'uNormalMat'];

    private position: Position = defaultPosition();
    private scale = {x: 1, y: 1, z: 1};
    private modelMat: number[];
    private normalMat: number[];
    private modelMatLoc: WebGLUniformLocation | null;
    private diffuseTex: WebGLTexture | null = null;
    private uniformManager: UniformManager;
    private vbo!: WebGLBuffer;
    private ibo!: WebGLBuffer;
    

    constructor(private gl: WebGL2RenderingContext, 
        private mesh: Mesh,
        private program: WebGLProgram,
        private vao: WebGLVertexArrayObject | null = null
    ) {
        this.ID = Renderable.counter++;
        this.modelMatLoc = gl.getUniformLocation(program, 'uModelMat');
        this.modelMat = Mat.getIdentityMat();
        this.normalMat = Mat.getIdentityMat();
        this.uniformManager = new UniformManager(gl, program, Renderable.uniformNames);
        this.init();
    }

    draw() {
        this.gl.bindVertexArray(this.vao);
        this.gl.useProgram(this.program);
        this.setUpUniforms();
        this.gl.drawElements(this.gl.TRIANGLES, 
            this.getCount(),
            this.getType(),
            0 
        );
    }

    moveX(x: number) {
        this.position.x += x;
        this.updateMatrices();
    }

    moveY(y: number) {
        this.position.y += y;
        this.updateMatrices();
    }

    moveZ(z: number) {
        this.position.z += z;
        this.updateMatrices();
    }

    rotX(angle: number) {
        this.position.phi = (this.position.phi + angle) % 360;
        this.updateMatrices();
    }

    rotY(angle: number) {
        this.position.theta = (this.position.theta + angle) % 360;
        this.updateMatrices();
    }

    rotZ(angle: number) {
        this.position.gamma = (this.position.gamma + angle) % 360;
        this.updateMatrices();
    }

    scaleX(s: number) {
        if (this.scale.x < 0.1 && s < 0)
            return;
        this.scale.x += s;
        this.updateMatrices();
    }

    scaleY(s: number) {
        if (this.scale.y < 0.1 && s < 0)
            return;
        this.scale.y += s;
        this.updateMatrices();
    }

    scaleZ(s: number) {
        if (this.scale.z < 0.1 && s < 0)
            return;
        this.scale.z += s;
        this.updateMatrices();
    }

    move(dPos: Position) {
        this.position.x += dPos.x;
        this.position.y += dPos.y;
        this.position.z += dPos.z;
        this.position.theta += dPos.theta;
        this.position.phi += dPos.phi;
        this.position.gamma += dPos.gamma;

        this.updateMatrices();
    }

    setScale(s: {x: number, y: number, z: number}) {
        this.scale = s;
        this.updateMatrices();
    }

    getScale() { return this.scale; }

    private updateMatrices() {
        Mat.setIdentityMat(this.modelMat);
        
        Mat.scaleX(this.modelMat, this.scale.x);
        Mat.scaleY(this.modelMat, this.scale.y);
        Mat.scaleZ(this.modelMat, this.scale.z);
        Mat.rotX(this.modelMat, this.position.phi);
        Mat.rotY(this.modelMat, this.position.theta);
        Mat.rotZ(this.modelMat, this.position.gamma);
        Mat.translate(this.modelMat, this.position);

        Mat.modelToNormalMat(this.modelMat, this.normalMat);
    }

    getVAO() { return this.vao; }

    getProgram() { return this.program; }

    getCount() { return this.mesh.indices.length; }

    getType() { return this.mesh.isUInt ? 
        this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT;
    }

    getMesh() { return this.mesh; }

    getModelMat() { return this.modelMat; }

    setTexture(texture: WebGLTexture) {
        if (this.mesh.texturable)
            this.diffuseTex = texture;
    }

    getTexture() { return this.diffuseTex; }

    isTexturable() { return this.mesh.texturable; }

    getPosition() { return this.position; }

    destroy() {
        this.gl.deleteVertexArray(this.vao);
        this.gl.deleteBuffer(this.vbo);
        this.gl.deleteBuffer(this.ibo);
    }

    private setUpUniforms() {
        this.gl.uniformMatrix4fv(this.modelMatLoc, 
            false,
            this.modelMat
        );
        this.uniformManager.setMat4('uNormalMat', this.normalMat);
        this.uniformManager.setBool(Renderable.uniformNames[0]!, this.mesh.hasColors);
        if (this.diffuseTex !== null) {
            this.uniformManager.setBool(Renderable.uniformNames[1]!, true);
            this.uniformManager.setActiveTex(Renderable.uniformNames[2]!, this.diffuseTex, 0);
        }
        else {
            this.uniformManager.setBool(Renderable.uniformNames[1]!, false);
        }
    }

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

        this.vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
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

        this.ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
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