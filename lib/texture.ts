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

export function decodeTexturePixels(texture: SerializedTextureData) {
  return decodeBase64(texture.pixels);
}

export function encodeTexturePixels(pixels: Uint8ClampedArray) {
  return encodeBase64(pixels);
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
  const framesPerSourceFrame = FRAMES / sourceFrames;
  const normalizedPixels = new Uint8ClampedArray(frameByteLength * FRAMES);

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    const sourceFrameIndex = Math.floor(frameIndex / framesPerSourceFrame);
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
  const decodedPixels = decodeTexturePixels(texture);

  return decodedPixels.slice(frameStart, frameStart + frameByteLength);
}

export function rotateTexture(
  texture: SerializedTextureData,
  values: readonly number[],
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture);
  const width = texture.width;
  const height = texture.frameSize;
  const frameByteLength = texture.width * texture.frameSize * 4;
  const rotatedPixels = new Uint8ClampedArray(frameByteLength * texture.frames);
  const centerX = width / 2;
  const centerY = height / 2;

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength;
    const angleTurns = values[frameIndex] ?? 0;
    const radians = angleTurns * Math.PI * 2;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offsetX = x + 0.5 - centerX;
        const offsetY = y + 0.5 - centerY;
        const sourceX = cos * offsetX + sin * offsetY + centerX - 0.5;
        const sourceY = -sin * offsetX + cos * offsetY + centerY - 0.5;
        const wrappedX = ((Math.round(sourceX) % width) + width) % width;
        const wrappedY = ((Math.round(sourceY) % height) + height) % height;
        const sourceIndex = frameStart + (wrappedY * width + wrappedX) * 4;
        const targetIndex = frameStart + (y * width + x) * 4;

        rotatedPixels[targetIndex] = decodedPixels[sourceIndex];
        rotatedPixels[targetIndex + 1] = decodedPixels[sourceIndex + 1];
        rotatedPixels[targetIndex + 2] = decodedPixels[sourceIndex + 2];
        rotatedPixels[targetIndex + 3] = decodedPixels[sourceIndex + 3];
      }
    }
  }

  return {
    name: `${texture.name} (rotated)`,
    width,
    height: texture.height,
    frameSize: height,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(rotatedPixels),
  };
}