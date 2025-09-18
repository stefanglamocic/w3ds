#version 300 es

precision highp float;

in vec3 vNearPoint;
in vec3 vFarPoint;

out vec4 fragColor;

void main() {
    float t = -vNearPoint.y / (vFarPoint.y - vNearPoint.y);
    fragColor = vec4(1.0, .0, .0, 1.0 * float(t > 0.0));
}