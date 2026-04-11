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

export const TEXTURE_BLEND_MODE_LABELS = {
  normal: "Normal",
  darken: "Darken",
  lighten: "Lighten",
  multiply: "Multiply",
  divide: "Divide",
  add: "Add",
  subtract: "Subtract",
  screen: "Screen",
  overlay: "Overlay",
} as const;

export type TextureBlendMode = keyof typeof TEXTURE_BLEND_MODE_LABELS;

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

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error("Could not read the preset image."));
    };

    image.src = url;
  });
}

function normalizeTextureImage(image: HTMLImageElement, name: string): SerializedTextureData {
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
    name,
    width: SIZE,
    height: SIZE * FRAMES,
    frameSize: SIZE,
    frames: FRAMES,
    sourceFrames,
    pixels: encodeBase64(normalizedPixels),
  };
}

export async function normalizeTextureFile(
  file: File,
): Promise<SerializedTextureData> {
  const image = await loadImage(file);
  return normalizeTextureImage(image, file.name);
}

export async function normalizeTextureUrl(
  url: string,
  name: string,
): Promise<SerializedTextureData> {
  const image = await loadImageFromUrl(url);
  return normalizeTextureImage(image, name);
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

export function adjustOpacityTexture(
  texture: SerializedTextureData,
  opacityValues: readonly number[],
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture);
  const adjustedPixels = new Uint8ClampedArray(decodedPixels);
  const frameByteLength = texture.width * texture.frameSize * 4;

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength;
    const opacity = Math.max(0, Math.min(1, opacityValues[frameIndex] ?? 1));

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const alphaIndex = frameStart + offset + 3;
      adjustedPixels[alphaIndex] = Math.round(decodedPixels[alphaIndex] * opacity);
    }
  }

  return {
    name: `${texture.name} (opacity)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(adjustedPixels),
  };
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function blendChannel(base: number, blend: number, mode: TextureBlendMode) {
  switch (mode) {
    case "normal":
      return blend;
    case "darken":
      return Math.min(base, blend);
    case "lighten":
      return Math.max(base, blend);
    case "multiply":
      return base * blend;
    case "divide":
      return clampUnit(blend <= 0 ? 1 : base / blend);
    case "add":
      return clampUnit(base + blend);
    case "subtract":
      return clampUnit(base - blend);
    case "screen":
      return 1 - (1 - base) * (1 - blend);
    case "overlay":
      return base < 0.5
        ? 2 * base * blend
        : 1 - 2 * (1 - base) * (1 - blend);
  }
}

export function blendTextures(
  baseTexture: SerializedTextureData,
  blendTexture: SerializedTextureData,
  mode: TextureBlendMode,
): SerializedTextureData {
  if (
    baseTexture.width !== blendTexture.width ||
    baseTexture.frameSize !== blendTexture.frameSize ||
    baseTexture.frames !== blendTexture.frames
  ) {
    throw new Error("Textures must have matching dimensions and frame counts.");
  }

  const basePixels = decodeTexturePixels(baseTexture);
  const blendPixels = decodeTexturePixels(blendTexture);
  const mergedPixels = new Uint8ClampedArray(basePixels.length);

  for (let index = 0; index < basePixels.length; index += 4) {
    const baseRed = basePixels[index] / 255;
    const baseGreen = basePixels[index + 1] / 255;
    const baseBlue = basePixels[index + 2] / 255;
    const baseAlpha = basePixels[index + 3] / 255;
    const blendRed = blendPixels[index] / 255;
    const blendGreen = blendPixels[index + 1] / 255;
    const blendBlue = blendPixels[index + 2] / 255;
    const blendAlpha = blendPixels[index + 3] / 255;
    const outAlpha = blendAlpha + baseAlpha * (1 - blendAlpha);

    const mergedRed = blendChannel(baseRed, blendRed, mode);
    const mergedGreen = blendChannel(baseGreen, blendGreen, mode);
    const mergedBlue = blendChannel(baseBlue, blendBlue, mode);

    const outRed = outAlpha === 0
      ? 0
      : (((1 - blendAlpha) * baseRed * baseAlpha) + (blendAlpha * mergedRed)) / outAlpha;
    const outGreen = outAlpha === 0
      ? 0
      : (((1 - blendAlpha) * baseGreen * baseAlpha) + (blendAlpha * mergedGreen)) / outAlpha;
    const outBlue = outAlpha === 0
      ? 0
      : (((1 - blendAlpha) * baseBlue * baseAlpha) + (blendAlpha * mergedBlue)) / outAlpha;

    mergedPixels[index] = Math.round(clampUnit(outRed) * 255);
    mergedPixels[index + 1] = Math.round(clampUnit(outGreen) * 255);
    mergedPixels[index + 2] = Math.round(clampUnit(outBlue) * 255);
    mergedPixels[index + 3] = Math.round(clampUnit(outAlpha) * 255);
  }

  return {
    name: `${baseTexture.name} (${mode} ${blendTexture.name})`,
    width: baseTexture.width,
    height: baseTexture.height,
    frameSize: baseTexture.frameSize,
    frames: baseTexture.frames,
    sourceFrames: baseTexture.frames,
    pixels: encodeTexturePixels(mergedPixels),
  };
}

export function maskTexture(
  texture: SerializedTextureData,
  mask: SerializedTextureData,
): SerializedTextureData {
  if (
    texture.width !== mask.width ||
    texture.frameSize !== mask.frameSize ||
    texture.frames !== mask.frames
  ) {
    throw new Error("Textures must have matching dimensions and frame counts.");
  }

  const texturePixels = decodeTexturePixels(texture);
  const maskPixels = decodeTexturePixels(mask);
  const maskedPixels = new Uint8ClampedArray(texturePixels);

  for (let index = 0; index < texturePixels.length; index += 4) {
    const maskRed = maskPixels[index] / 255;
    const maskGreen = maskPixels[index + 1] / 255;
    const maskBlue = maskPixels[index + 2] / 255;
    const maskAlpha = maskPixels[index + 3] / 255;
    const maskLuminance = (0.2126 * maskRed) + (0.7152 * maskGreen) + (0.0722 * maskBlue);
    const opacity = clampUnit(maskLuminance * maskAlpha);

    maskedPixels[index + 3] = Math.round(texturePixels[index + 3] * opacity);
  }

  return {
    name: `${texture.name} (masked by ${mask.name})`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(maskedPixels),
  };
}

export function invertTexture(
  texture: SerializedTextureData,
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture);
  const invertedPixels = new Uint8ClampedArray(sourcePixels.length);

  for (let index = 0; index < sourcePixels.length; index += 4) {
    invertedPixels[index] = 255 - sourcePixels[index];
    invertedPixels[index + 1] = 255 - sourcePixels[index + 1];
    invertedPixels[index + 2] = 255 - sourcePixels[index + 2];
    invertedPixels[index + 3] = sourcePixels[index + 3];
  }

  return {
    name: `${texture.name} (inverted)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(invertedPixels),
  };
}

export function phaseTexture(
  texture: SerializedTextureData,
  frameOffsets: readonly number[],
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture);
  const frameByteLength = texture.width * texture.frameSize * 4;
  const phasedPixels = new Uint8ClampedArray(sourcePixels.length);

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameOffset = Math.round(frameOffsets[frameIndex] ?? 0);
    const sourceFrameIndex = ((frameIndex + frameOffset) % texture.frames + texture.frames) % texture.frames;
    const sourceStart = sourceFrameIndex * frameByteLength;
    const targetStart = frameIndex * frameByteLength;

    phasedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart,
    );
  }

  return {
    name: `${texture.name} (phased)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(phasedPixels),
  };
}