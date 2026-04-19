
precision highp float;
varying vec2 uv;
uniform float time;
uniform float blue;
void main() {
  vec2 p = 2.0 * uv - vec2(1.0);
  float a = atan(p.y,p.x);
  float r = pow( pow(p.x*p.x,4.0) + pow(p.y*p.y,4.0), 1.0/16.0 );
  vec2 uv = vec2( 1.0/r + blue*time, a );
  float f = cos(12.0*uv.x)*cos(6.0*uv.y);
  vec3 col = 0.5 + 0.5*sin( 3.1416*f + vec3(0.0,0.0,0.0) );
  col = col*r;
  gl_FragColor = vec4( col, 1.0 );
}
