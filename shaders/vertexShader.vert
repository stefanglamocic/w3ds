#version 300 es

uniform mat4 uProjMat, uViewMat, uModelMat;

in vec3 aPosition;
in vec3 aColor;

out vec3 vColor;

void main() {
    vColor = aColor;
    gl_Position = uProjMat * uViewMat * uModelMat * vec4(aPosition, 1.);
}