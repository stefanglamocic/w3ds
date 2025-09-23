#version 300 es

uniform uint uObjectIndex;
uniform uint uDrawIndex;

out uvec2 fragColor;

void main() {
    fragColor = uvec2(uObjectIndex, uDrawIndex);
}