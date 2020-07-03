precision mediump float;
varying vec3 vColor;

uniform sampler2D uSampler;
uniform float t;
uniform float blurStepSize;

#ifndef BLURSIZE
#define BLURSIZE 8.0
#endif

#ifdef DIR_H
vec2 dir = vec2(1.0, 0.0);
#else ifdef DIR_V
vec2 dir = vec2(0.0, 1.0);
#endif
    
vec4 toGrayScale(vec4 p)
{
    float g = 0.2126*p.r + 0.7152*p.g + 0.0722*p.b;
    return vec4(g, g, g, p.a);
}

vec4 toBlur(sampler2D sampler, vec2 uv, float blurStep)
{
    vec4 accum = texture2D(uSampler, uv);
    float j = 0.0;
    for(float i = 1.0;i <= BLURSIZE; i+=1.0) {
        accum += texture2D(uSampler, uv + (i * blurStep * dir));
        accum += texture2D(uSampler, uv - (i * blurStep * dir)); 
        j = i;
    }
    accum = accum / (2.0 * j + 1.0);
    return vec4(accum.rgb, 1.0);
}

void main(void)
{
    vec4 p = texture2D(uSampler, vColor.xy);
    vec4 sourceColor = p;
    vec4 destColor = toBlur(uSampler, vColor.xy, blurStepSize);
    gl_FragColor = mix(sourceColor, destColor, t);
}