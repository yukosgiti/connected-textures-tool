"use client";
import { drawScene, ProgramInfo } from "@/shaders/draw-scene";
import { initBuffers } from "@/shaders/init-buffers";
import { initShaderProgram } from "@/shaders/init-shader-program";
import { useMemo } from "react";

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
export const useShader = ({
    fsSource,
    uniforms,
}: {
    fsSource: string;
    uniforms?: Record<string, number>;
}) => {
    const c = useMemo(() => {
        const canvas = new OffscreenCanvas(16, 16 * 60);
        const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
        if (!gl) {
            throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
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

        gl.useProgram(shaderProgram);
        for (const [name, value] of Object.entries(uniforms ?? {})) {
            const location = gl.getUniformLocation(shaderProgram, name);
            if (location) {
                gl.uniform1f(location, value);
            }
        }

        drawScene(gl, programInfo, buffers);
        return canvas;
    }, [fsSource, uniforms]);
        
    return [c] as const;
}