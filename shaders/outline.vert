#version 300 es

uniform mat4 uProjMat, uViewMat, uModelMat;

layout(location = 0) in vec3 aPosition;
//layout(location = 1) in vec3 aNormal;

const float outlineThickness = 0.03;

void main() {
    vec3 scaledPos = aPosition + normalize(aPosition) * outlineThickness; 
    gl_Position = uProjMat * uViewMat * 
        uModelMat * vec4(scaledPos, 1.0);
}