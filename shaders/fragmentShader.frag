#version 300 es
precision highp float;

const vec3 uLightDir = vec3(-0.5, -1.0, -0.3);
const vec3 ambient = vec3(.1);

uniform bool uHasTex;
uniform sampler2D uDiffuseMap;

in vec3 vColor;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 fragColor;

void main() {
    vec3 L = normalize(-uLightDir);
    float alpha = max(0.0, dot(L, vNormal));
    vec3 baseColor = uHasTex ? texture(uDiffuseMap, vTexCoord).rgb : vColor;
    vec3 color = baseColor * alpha;
    fragColor = vec4(color + ambient, 1.);
}