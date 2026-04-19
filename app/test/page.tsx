"use client";

import { ProgramInfo, drawScene } from "@/shaders/draw-scene";
import { initBuffers } from "@/shaders/init-buffers";
import { initShaderProgram } from "@/shaders/init-shader-program";
import { useEffect, useRef } from "react";

const size = 16;
const frames = 16;
const scale = 10;

const vsSource = `
    attribute vec2 aVertexPosition;

    varying highp vec2 vUv;

    void main(void) {
      vUv = aVertexPosition;
      gl_Position = vec4(
        aVertexPosition.x * 2.0 - 1.0,
        1.0 - aVertexPosition.y * 2.0,
        0.0,
        1.0
      );
    }
  `;

const fsSource = `
    precision mediump float;

    varying highp vec2 vUv;

    void main(void) {
      gl_FragColor = vec4(vUv.x, vUv.y, 1.0 - vUv.x, 1.0);
    }
  `;

export default function Page() {
    const canvasRef = useRef<HTMLCanvasElement>(null!);

    useEffect(() => {
        const gl = canvasRef.current.getContext("webgl");
        if (!gl) {
            return;
        }

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
        const programInfo: ProgramInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            },
        };
        const buffers = initBuffers(gl);

        drawScene(gl, programInfo, buffers);
    }, []);

    return (
        <div>
            <h1>Test</h1>
            <div className="bg-gray-500 w-min h-min p-1">
                <canvas ref={canvasRef} width={size} height={size * frames} className="border border-gray-700" style={{
                    width: size * scale,
                    height: size * frames * scale,
                    imageRendering: "pixelated"
                }} />
            </div>
        </div>
    );
}