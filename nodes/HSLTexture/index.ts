import { applyShader } from "../common/applyShader";

const workerUrl = new URL("./HSLTextureWorker.ts", import.meta.url)

export type HSLWorkerInput = { frames: number };
export type HSLWorkerOutput = ImageBitmap;

/**
 * @param inputs 
 */
export async function applyHSLTexture(){
    const worker = new Worker(workerUrl, { type: "module" });
    return await applyShader<HSLWorkerInput, HSLWorkerOutput>(
        worker,
        { frames: 60},
    );
}