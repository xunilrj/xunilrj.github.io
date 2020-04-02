precision mediump float;
varying vec3 vColor;

uniform sampler2D uSampler0;
uniform sampler2D uSampler1;

void main(void)
{
    vec4 ta = texture2D(uSampler0, vColor.xy);
    vec4 tb = texture2D(uSampler1, vColor.xy);
    
    gl_FragColor = vec4((ta.rgb * ta.a) + (tb.rgb * tb.a), 1.0);
}