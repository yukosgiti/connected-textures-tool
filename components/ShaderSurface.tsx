"use client";
import { useRef } from 'react';
import { Mesh } from 'three';

/**
 * st.y *= 16.0;
    st.x += floor(st.y) / 16.0;
    st.y = fract(st.y);
 */
const fragmentShader = `
  precision highp float;
  #define PI 3.1415926535

  varying vec2 vUv;
  uniform sampler2D t;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.537);
  }

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
`;



export const ShaderSurface = (props: { position: [number, number, number] }) => {

  const ref = useRef<Mesh>(null!)
  // Hold state for hovered and clicked events
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
    >
      <boxGeometry args={[2, 1, 1]} />
      <meshStandardMaterial color={'orange'} />
    </mesh>)
};
