#version 300 es

uniform mat4 uProjMat, uViewMat;
uniform vec3 uCamPos;

out vec3 vWorldPos;


const float gridSize = 100.0;
const vec3 gridPlane[4] = vec3[](
    vec3(-1.0,  .0, -1.0),
    vec3(1.0, .0, -1.0),
    vec3(1.0, .0, 1.0),
    vec3(-1.0, .0, 1.0)
);

const int indices[6] = int[](0, 1, 2, 0, 2, 3);

void main() {
    vec3 p = gridPlane[indices[gl_VertexID]] * gridSize;
    p.x += uCamPos.x;
    p.z += uCamPos.z;

    vWorldPos = p;

    gl_Position = uProjMat * uViewMat * 
        vec4(p, 1.0);
}