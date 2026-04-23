import { WorkerScope } from "./types";

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

export function createWorkScope<TInput, TOutput>(scope: WorkerScope<TInput, TOutput>, onMessage: (input: TInput) => Promise<TOutput>) {
    console.log("Worker script loaded");
    scope.postMessage({ type: "ready" });
    scope.addEventListener("message", async (event) => {
        console.log("Worker received message:", event.data);
        if (event.data.type !== "apply") {
            return;
        }

        try {
            const canvas = new OffscreenCanvas(16, 16*60);

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            scope.postMessage({
                type: "error",
                message,
            });
        }
    });
}