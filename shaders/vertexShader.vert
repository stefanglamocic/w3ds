#version 300 es

uniform mat4 uProjMat, uViewMat, uModelMat, uNormalMat;
uniform bool uHasColor;

in vec3 aPosition;
in vec3 aNormal;
in vec3 aColor;
in vec2 aTexCoord;

out vec3 vColor;
out vec3 vNormal;
out vec2 vTexCoord;

const vec3 defaultColor = vec3(0.522);

void main() {
    vTexCoord = aTexCoord;
    vColor = uHasColor ? aColor : defaultColor;
    vNormal = normalize(vec3(uNormalMat * vec4(aNormal, 0.0)));
    gl_Position = uProjMat * uViewMat * uModelMat * vec4(aPosition, 1.);
}