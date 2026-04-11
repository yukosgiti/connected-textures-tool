import { FRAMES, SIZE } from "@/lib/utils";

export type SerializedTextureData = {
  name: string;
  width: number;
  height: number;
  frameSize: number;
  frames: number;
  sourceFrames: number;
  pixels: string;
};

function encodeBase64(bytes: Uint8ClampedArray) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function decodeBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8ClampedArray(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

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

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the uploaded image."));
    };

    image.src = objectUrl;
  });
}

export async function normalizeTextureFile(
  file: File,
): Promise<SerializedTextureData> {
  const image = await loadImage(file);

  if (image.width !== SIZE) {
    throw new Error(`Texture width must be exactly ${SIZE}px.`);
  }

  if (image.height % SIZE !== 0) {
    throw new Error(`Texture height must be a multiple of ${SIZE}px.`);
  }

  const sourceFrames = image.height / SIZE;

  if (FRAMES % sourceFrames !== 0) {
    throw new Error(
      `Texture height maps to ${sourceFrames} frame(s), which must divide ${FRAMES}.`,
    );
  }

  const sourceCanvas = createCanvas(SIZE, image.height);
  const sourceContext = getCanvasContext(sourceCanvas);
  sourceContext.drawImage(image, 0, 0);

  const sourcePixels = sourceContext.getImageData(0, 0, SIZE, image.height).data;
  const frameByteLength = SIZE * SIZE * 4;
  const normalizedPixels = new Uint8ClampedArray(frameByteLength * FRAMES);

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    const sourceFrameIndex = frameIndex % sourceFrames;
    const sourceStart = sourceFrameIndex * frameByteLength;
    const sourceEnd = sourceStart + frameByteLength;
    const targetStart = frameIndex * frameByteLength;

    normalizedPixels.set(
      sourcePixels.slice(sourceStart, sourceEnd),
      targetStart,
    );
  }

  return {
    name: file.name,
    width: SIZE,
    height: SIZE * FRAMES,
    frameSize: SIZE,
    frames: FRAMES,
    sourceFrames,
    pixels: encodeBase64(normalizedPixels),
  };
}

export function textureFrameToDataUrl(
  texture: SerializedTextureData,
  frameIndex = 0,
) {
  const safeFrameIndex = ((frameIndex % texture.frames) + texture.frames) % texture.frames;
  const canvas = createCanvas(texture.width, texture.frameSize);
  const context = getCanvasContext(canvas);
  const frameByteLength = texture.width * texture.frameSize * 4;
  const frameStart = safeFrameIndex * frameByteLength;
  const decodedPixels = decodeBase64(texture.pixels);
  const framePixels = decodedPixels.slice(frameStart, frameStart + frameByteLength);

  context.putImageData(
    new ImageData(framePixels, texture.width, texture.frameSize),
    0,
    0,
  );

  return canvas.toDataURL();
}

export function getTextureFramePixels(
  texture: SerializedTextureData,
  frameIndex = 0,
) {
  const safeFrameIndex =
    ((frameIndex % texture.frames) + texture.frames) % texture.frames;
  const frameByteLength = texture.width * texture.frameSize * 4;
  const frameStart = safeFrameIndex * frameByteLength;
  const decodedPixels = decodeBase64(texture.pixels);

  return decodedPixels.slice(frameStart, frameStart + frameByteLength);
}