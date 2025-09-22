#version 300 es

precision highp float;

const float uGridCellSize = 0.25;
const vec4 uGridColorThin = vec4(0.35, 0.35, 0.35, 1.0);
const vec4 uGridColorThick = vec4(0.55);
const float uGridMinPixelsBetweenCells = 3.0;
const float uGridSize = 100.0;

uniform vec3 uCamPos;

in vec3 vWorldPos;

out vec4 fragColor;

float log10(float x)
{
    float f = log(x) / log(10.0);
    return f;
}


float satf(float x)
{
    float f = clamp(x, 0.0, 1.0);
    return f;
}


vec2 satv(vec2 x)
{
    vec2 v = clamp(x, vec2(0.0), vec2(1.0));
    return v;
}


float max2(vec2 v)
{
    float f = max(v.x, v.y);
    return f;
}

void main() {
    vec2 dvx = vec2(dFdx(vWorldPos.x), dFdy(vWorldPos.x));
    vec2 dvy = vec2(dFdx(vWorldPos.z), dFdy(vWorldPos.z));

    float lx = length(dvx);
    float ly = length(dvy);

    vec2 dudv = vec2(lx, ly);

    float l = length(dudv);

    float LOD = max(0.0, log10(l * uGridMinPixelsBetweenCells / uGridCellSize) + 1.0);

    float gridCellSizeLod0 = uGridCellSize * pow(10.0, floor(LOD));
    float gridCellSizeLod1 = gridCellSizeLod0 * 10.0;
    float gridCellSizeLod2 = gridCellSizeLod1 * 10.0;

    dudv *= 2.0;

    vec2 modDivDudv = mod(vWorldPos.xz, gridCellSizeLod0) / dudv;
    float lod0a = max2(vec2(1.0) - abs(satv(modDivDudv) * 2.0 - vec2(1.0)) );

    modDivDudv = mod(vWorldPos.xz, gridCellSizeLod1) / dudv;
    float lod1a = max2(vec2(1.0) - abs(satv(modDivDudv) * 2.0 - vec2(1.0)) );
    
    modDivDudv = mod(vWorldPos.xz, gridCellSizeLod2) / dudv;
    float lod2a = max2(vec2(1.0) - abs(satv(modDivDudv) * 2.0 - vec2(1.0)) );

    float LODFade = fract(LOD);
    vec4 color;

    if (lod2a > 0.0) {
        color = uGridColorThick;
        color.a *= lod2a;
    } else {
        if (lod1a > 0.0) {
            color = mix(uGridColorThick, uGridColorThin, LODFade);
	        color.a *= lod1a;
        } else {
            color = uGridColorThin;
	        color.a *= (lod0a * (1.0 - LODFade));
        }
    }
    
    float opacityFalloff = (1.0 - satf(length(vWorldPos.xz - uCamPos.xz) / uGridSize));

    color.a *= opacityFalloff;

    fragColor = color;
}