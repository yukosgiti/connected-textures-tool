"use client";

import { Button } from "@/components/ui/button";
import { drawScene } from "@/shaders/draw-scene";
import { initBuffers } from "@/shaders/init-buffers";
import { initShaderProgram } from "@/shaders/init-shader-program";
import { useEffect, useRef } from "react";

const size = 16;
const frames = 16;
const scale = 1;

// Vertex shader program

const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;


// Fragment shader program
const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;


export type ProgramInfo = {
    program: WebGLProgram;
    attribLocations: {
        vertexPosition: number;
        vertexColor: number;
    };
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation | null;
        modelViewMatrix: WebGLUniformLocation | null;
    };
};
export default function Page() {
    const canvasRef = useRef<HTMLCanvasElement>(null!);
    function paint() {
        const gl = canvasRef.current.getContext("webgl")!;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);


        const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
                vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
            },
        };
        // objects we'll be drawing.
        const buffers = initBuffers(gl);

        // Draw the scene
        drawScene(gl, programInfo, buffers);

    }
    useEffect(() => {
        paint();
    }, []);
    return (
        <div>
            <h1>Test</h1>
            <Button onClick={paint}>Paint</Button>
            <div className="bg-gray-500 w-min h-min p-1">
                <canvas ref={canvasRef} width={size} height={size * frames} className="border border-gray-700" style={{
                    //pixel art should look nearest neighbour
                    width: size * scale,
                    height: size * frames * scale,
                    imageRendering: "pixelated"
                }} />
            </div>
        </div>
    );
}