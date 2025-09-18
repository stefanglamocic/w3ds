#version 300 es

uniform mat4 uProjMat, uViewMat, uModelMat;
uniform bool uHasColor;

in vec3 aPosition;
in vec3 aNormal;
in vec3 aColor;

out vec3 vColor;
out vec3 vNormal;

const vec3 defaultColor = vec3(0.522);

void main() {
    vColor = uHasColor ? aColor : defaultColor;
    vNormal = normalize(mat3(uModelMat) * aNormal);
    gl_Position = uProjMat * uViewMat * uModelMat * vec4(aPosition, 1.);
}