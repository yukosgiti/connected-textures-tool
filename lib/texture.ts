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

export function translateTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[],
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture);
  const width = texture.width;
  const height = texture.frameSize;
  const frameByteLength = width * height * 4;
  const translatedPixels = new Uint8ClampedArray(frameByteLength * texture.frames);

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength;
    const offsetX = Math.round((xValues[frameIndex] ?? 0) * width);
    const offsetY = Math.round((yValues[frameIndex] ?? 0) * height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sourceX = ((x - offsetX) % width + width) % width;
        const sourceY = ((y - offsetY) % height + height) % height;
        const sourceIndex = frameStart + (sourceY * width + sourceX) * 4;
        const targetIndex = frameStart + (y * width + x) * 4;

        translatedPixels[targetIndex] = decodedPixels[sourceIndex];
        translatedPixels[targetIndex + 1] = decodedPixels[sourceIndex + 1];
        translatedPixels[targetIndex + 2] = decodedPixels[sourceIndex + 2];
        translatedPixels[targetIndex + 3] = decodedPixels[sourceIndex + 3];
      }
    }
  }

  return {
    name: `${texture.name} (translated)`,
    width,
    height: texture.height,
    frameSize: height,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(translatedPixels),
  };
}

export function scaleTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[],
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture);
  const width = texture.width;
  const height = texture.frameSize;
  const frameByteLength = width * height * 4;
  const scaledPixels = new Uint8ClampedArray(frameByteLength * texture.frames);
  const centerX = width / 2;
  const centerY = height / 2;

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength;
    const scaleX = Math.max(0.0001, 1 + (xValues[frameIndex] ?? 0));
    const scaleY = Math.max(0.0001, 1 + (yValues[frameIndex] ?? 0));

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offsetX = x + 0.5 - centerX;
        const offsetY = y + 0.5 - centerY;
        const sourceX = offsetX / scaleX + centerX - 0.5;
        const sourceY = offsetY / scaleY + centerY - 0.5;
        const wrappedX = ((Math.round(sourceX) % width) + width) % width;
        const wrappedY = ((Math.round(sourceY) % height) + height) % height;
        const sourceIndex = frameStart + (wrappedY * width + wrappedX) * 4;
        const targetIndex = frameStart + (y * width + x) * 4;

        scaledPixels[targetIndex] = decodedPixels[sourceIndex];
        scaledPixels[targetIndex + 1] = decodedPixels[sourceIndex + 1];
        scaledPixels[targetIndex + 2] = decodedPixels[sourceIndex + 2];
        scaledPixels[targetIndex + 3] = decodedPixels[sourceIndex + 3];
      }
    }
  }

  return {
    name: `${texture.name} (scaled)`,
    width,
    height: texture.height,
    frameSize: height,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(scaledPixels),
  };
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return {
      hue: 0,
      saturation: 0,
      lightness,
    };
  }

  const delta = max - min;
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);

  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return {
    hue: hue / 6,
    saturation,
    lightness,
  };
}

function hueToRgb(p: number, q: number, t: number) {
  let value = t;

  if (value < 0) {
    value += 1;
  }

  if (value > 1) {
    value -= 1;
  }

  if (value < 1 / 6) {
    return p + (q - p) * 6 * value;
  }

  if (value < 1 / 2) {
    return q;
  }

  if (value < 2 / 3) {
    return p + (q - p) * (2 / 3 - value) * 6;
  }

  return p;
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  if (saturation === 0) {
    const value = Math.round(lightness * 255);

    return {
      red: value,
      green: value,
      blue: value,
    };
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    red: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    green: Math.round(hueToRgb(p, q, hue) * 255),
    blue: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
}

export function adjustHslTexture(
  texture: SerializedTextureData,
  hueValues: readonly number[],
  saturationValues: readonly number[],
  lightnessValues: readonly number[],
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture);
  const adjustedPixels = new Uint8ClampedArray(decodedPixels.length);
  const frameByteLength = texture.width * texture.frameSize * 4;

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength;
    const hueShift = hueValues[frameIndex] ?? 0;
    const saturationShift = saturationValues[frameIndex] ?? 0;
    const lightnessShift = lightnessValues[frameIndex] ?? 0;

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset;
      const red = decodedPixels[pixelIndex];
      const green = decodedPixels[pixelIndex + 1];
      const blue = decodedPixels[pixelIndex + 2];
      const alpha = decodedPixels[pixelIndex + 3];
      const hsl = rgbToHsl(red, green, blue);
      const hue = ((hsl.hue + hueShift) % 1 + 1) % 1;
      const saturation = Math.max(0, Math.min(1, hsl.saturation + saturationShift));
      const lightness = Math.max(0, Math.min(1, hsl.lightness + lightnessShift));
      const rgb = hslToRgb(hue, saturation, lightness);

      adjustedPixels[pixelIndex] = rgb.red;
      adjustedPixels[pixelIndex + 1] = rgb.green;
      adjustedPixels[pixelIndex + 2] = rgb.blue;
      adjustedPixels[pixelIndex + 3] = alpha;
    }
  }

  return {
    name: `${texture.name} (hsl)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(adjustedPixels),
  };
}