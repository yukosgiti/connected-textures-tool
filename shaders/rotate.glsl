precision highp float;
#define PI 3.1415926535

varying vec2 vUv;
uniform sampler2D t;

mat2 rotate2d(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void main() {
  vec2 st = vUv;

  st.y *= 60.0;
  st.x += floor(st.y) / 60.0;
  st.y = fract(st.y);


  gl_FragColor = vec4(texture2D(t, st));
} 