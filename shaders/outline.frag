#version 300 es
precision highp float;

const vec3 outlineColor = vec3(1.0, 0.5, 0.2);

out vec4 fragColor;

void main() {
    fragColor = vec4(outlineColor, 1.0);
}