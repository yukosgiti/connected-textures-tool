precision mediump float;

varying highp vec2 vUv;

uniform float frames;

vec3 hsv2rgb(vec3 color) {
    vec3 rgb = clamp(abs(mod(color.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return color.z * mix(vec3(1.0), rgb, color.y);
}

void main(void) {
    float frameIndex = floor(vUv.y * frames);
    float hue = mod(frameIndex / frames, 1.0);
    vec3 color = hsv2rgb(vec3(hue, 1.0, 1.0));

    gl_FragColor = vec4(color, 1.0);
}