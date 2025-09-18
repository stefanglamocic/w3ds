#version 300 es

uniform mat4 uProjMat, uViewMat;
uniform vec3 uCamPos;

out vec3 vNearPoint;
out vec3 vFarPoint;

const vec3 gridPlane[6] = vec3[](
    vec3(1.0,  1.0, 0.0),
    vec3(-1.0, -1.0, 0.0),
    vec3(-1.0,  1.0, 0.0),
    vec3(-1.0, -1.0, 0.0),
    vec3(1.0,  1.0, 0.0),
    vec3(1.0, -1.0, 0.0)
);

vec3 unprojectPoint(float x, float y, float z, mat4 viewMat, mat4 projMat) {
    mat4 viewMatInv = inverse(viewMat);
    mat4 projMatInv = inverse(projMat);

    vec4 unprojPoint = viewMatInv * projMatInv * vec4(x, y, z, 1.0);
    return unprojPoint.xyz / unprojPoint.w;
}

void main() {
    vec3 p = gridPlane[gl_VertexID];
    vNearPoint = unprojectPoint(p.x, p.y, 0.0, uViewMat, uProjMat);
    vFarPoint = unprojectPoint(p.x, p.y, 1.0, uViewMat, uProjMat);

    gl_Position = vec4(p, 1.0);
}