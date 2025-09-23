#version 300 es

uniform mat4 uProjMat, uViewMat, uModelMat;

layout(location = 0) in vec3 aPosition;

void main() {
    gl_Position = uProjMat * uViewMat * uModelMat * vec4(aPosition, 1.0);
}