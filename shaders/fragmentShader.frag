#version 300 es
precision highp float;

const vec3 ambient = vec3(.07);

uniform bool uHasTex;
uniform sampler2D uDiffuseMap;
uniform vec3 uLightDir;

in vec3 vColor;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 fragColor;

void main() {
    vec3 L = normalize(-uLightDir);
    vec3 N = normalize(vNormal);
    float alpha = max(0.0, dot(L, N));
    vec3 baseColor = uHasTex ? texture(uDiffuseMap, vTexCoord).rgb : vColor;
    vec3 color = baseColor * alpha;
    fragColor = vec4(color + ambient, 1.);
}