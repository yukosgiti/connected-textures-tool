import JSZip from "jszip";

import { CONNECTED_TEXTURE_OUTPUTS } from "@/lib/connected-texture";
import { decodeTexturePixels, type SerializedTextureData } from "@/lib/texture";

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Could not create a 2D canvas context.");
  }

  return context;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not render the texture as a PNG."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

function sanitizePngFileName(name: string) {
  const safeName = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${safeName || "texture"}.png`;
}

function createProjectZipName(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");

  return `project-${year}${month}${day}-${hours}${minutes}${seconds}.zip`;
}

export async function textureToPngBlob(texture: SerializedTextureData) {
  const canvas = createCanvas(texture.width, texture.height);
  const context = getCanvasContext(canvas);

  context.putImageData(
    new ImageData(decodeTexturePixels(texture), texture.width, texture.height),
    0,
    0,
  );

  return canvasToBlob(canvas);
}

async function downloadZip(zip: JSZip) {
  const blob = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = createProjectZipName();
  link.click();

  URL.revokeObjectURL(objectUrl);
}

export async function downloadTextureZip(texture: SerializedTextureData) {
  const zip = new JSZip();
  zip.file(sanitizePngFileName(texture.name), await textureToPngBlob(texture));
  await downloadZip(zip);
}

export async function downloadConnectedTextureZip(outputTextures: Record<string, SerializedTextureData | null>) {
  const zip = new JSZip();

  for (const output of CONNECTED_TEXTURE_OUTPUTS) {
    const texture = outputTextures[output.handleId] ?? null;

    if (!texture) {
      throw new Error(`Missing connected texture output ${output.index}.`);
    }

    zip.file(`${output.index}.png`, await textureToPngBlob(texture));
  }

  await downloadZip(zip);
}