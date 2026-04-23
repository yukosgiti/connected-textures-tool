import { WorkerInput, WorkerOutput } from "./types";

export async function applyShader<TInputs, TOutput>(w: Worker, inputs: TInputs): Promise<TOutput> {

    return await new Promise<TOutput>((resolve, reject) => {
        let started = false;

        w.onmessage = async (event: MessageEvent<WorkerOutput<TOutput>>) => {
            console.log("Message from worker:", event.data);

            if (event.data.type === "ready" && !started) {
                started = true;
                try {
                    console.log("Posting inputs to worker");
                    w.postMessage({
                        type: "apply",
                        uniforms: inputs,
                    } satisfies WorkerInput<TInputs>);
                } catch (error) {
                    reject(error);
                    w.terminate();
                }
                return;
            }

            if (event.data.type === "error") {
                reject(new Error(event.data.message));
                w.terminate();
                return;
            }

            if (event.data.type === "complete") {
                console.log("Worker completed with output:", event.data.output);
                resolve(event.data.output);
                w.terminate();
            }
        };

        w.onerror = (event) => {
            console.error("Worker error:", event.message, event.error);
            reject(event.error ?? new Error(event.message));
            w.terminate();
        };

        w.onmessageerror = () => {
            console.error("Worker message could not be deserialized.");
            reject(new Error("Worker message could not be deserialized."));
            w.terminate();
        };
    });
}