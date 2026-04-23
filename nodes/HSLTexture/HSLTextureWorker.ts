import HSLTextureShader from "@/nodes/HSLTexture/HSLTexture.glsl";
import { drawScene, ProgramInfo } from "@/shaders/draw-scene";
import { initBuffers } from "@/shaders/init-buffers";
import { initShaderProgram } from "@/shaders/init-shader-program";
import { HSLWorkerInput, HSLWorkerOutput } from ".";
import { WorkerInput, WorkerScope } from "../common/types";

const workerScope = self as unknown as  WorkerScope<HSLWorkerInput, HSLWorkerOutput>;

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
console.log("Worker script loaded");
workerScope.postMessage({ type: "ready" });
workerScope.addEventListener("message", (event: MessageEvent<WorkerInput<HSLWorkerInput>>) => {
        console.log("Worker received message:", event.data);
        if (event.data.type !== "apply") {
            return;
        }

        try {
            const { uniforms } = event.data;
            const canvas = new OffscreenCanvas(16, 16*uniforms.frames);
            const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
            if (!gl) {
                throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
            }
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            const shaderProgram = initShaderProgram(gl, vsSource, HSLTextureShader);
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
            //release gl
            const bm = canvas.transferToImageBitmap();
            
            workerScope.postMessage({
                type: "complete",
                output: bm,
            }, [bm]);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            workerScope.postMessage({
                type: "error",
                message,
            });
        }
    });