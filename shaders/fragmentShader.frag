#version 300 es
precision highp float;

const vec3 uLightDir = vec3(-0.5, -1.0, -0.3);

in vec3 vColor;
in vec3 vNormal;

out vec4 fragColor;

void main() {
    vec3 ambient = vec3(.135);
    vec3 L = normalize(-uLightDir);
    float alpha = max(0.0, dot(L, vNormal));
    vec3 color = vColor * alpha;
    fragColor = vec4(color + ambient, 1.);
}