import { encodeTexturePixels, type SerializedTextureData } from "@/lib/texture";
import { FRAMES, SIZE } from "@/lib/utils";

export const RANDOM_TEXTURE_MODE_LABELS = {
  grayscale: "Grayscale Noise",
  rgb: "RGB Noise",
  binary: "Binary Noise",
  pastel: "Pastel Noise",
} as const;

export type RandomTextureMode = keyof typeof RANDOM_TEXTURE_MODE_LABELS;

const HEX_COLOR_REGEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function createSerializedTexture(name: string, pixels: Uint8ClampedArray, sourceFrames: number) {
  return {
    name,
    width: SIZE,
    height: SIZE * FRAMES,
    frameSize: SIZE,
    frames: FRAMES,
    sourceFrames,
    pixels: encodeTexturePixels(pixels),
  } satisfies SerializedTextureData;
}

function createMulberry32(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), value | 1);

    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function parseHexColor(hexColor: string) {
  const normalizedHex = normalizeHexColor(hexColor);

  if (!normalizedHex) {
    throw new Error("Use a valid hex color.");
  }

  const red = Number.parseInt(normalizedHex.slice(1, 3), 16);
  const green = Number.parseInt(normalizedHex.slice(3, 5), 16);
  const blue = Number.parseInt(normalizedHex.slice(5, 7), 16);

  return { red, green, blue };
}

export function normalizeHexColor(value: string) {
  const match = value.trim().match(HEX_COLOR_REGEX);

  if (!match) {
    return null;
  }

  let hex = match[1].toLowerCase();

  if (hex.length === 3) {
    hex = hex.split("").map((character) => `${character}${character}`).join("");
  }

  return `#${hex}`;
}

export function createRandomTextureSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

export function createColorTexture(hexColor: string) {
  const { red, green, blue } = parseHexColor(hexColor);
  const frameByteLength = SIZE * SIZE * 4;
  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES);

  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = red;
    pixels[index + 1] = green;
    pixels[index + 2] = blue;
    pixels[index + 3] = 255;
  }

  return createSerializedTexture(`Color Texture ${hexColor.toUpperCase()}`, pixels, 1);
}

export function createRandomTexture(mode: RandomTextureMode, seed: number) {
  const frameByteLength = SIZE * SIZE * 4;
  const framePixels = new Uint8ClampedArray(frameByteLength);
  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES);
  const random = createMulberry32(seed);

  for (let index = 0; index < framePixels.length; index += 4) {
    let red = 0;
    let green = 0;
    let blue = 0;

    switch (mode) {
      case "grayscale": {
        const value = Math.round(random() * 255);
        red = value;
        green = value;
        blue = value;
        break;
      }
      case "rgb":
        red = Math.round(random() * 255);
        green = Math.round(random() * 255);
        blue = Math.round(random() * 255);
        break;
      case "binary": {
        const value = random() >= 0.5 ? 255 : 0;
        red = value;
        green = value;
        blue = value;
        break;
      }
      case "pastel":
        red = 128 + Math.round(random() * 127);
        green = 128 + Math.round(random() * 127);
        blue = 128 + Math.round(random() * 127);
        break;
    }

    framePixels[index] = red;
    framePixels[index + 1] = green;
    framePixels[index + 2] = blue;
    framePixels[index + 3] = 255;
  }

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    pixels.set(framePixels, frameIndex * frameByteLength);
  }

  return createSerializedTexture(`Random Texture ${RANDOM_TEXTURE_MODE_LABELS[mode]}`, pixels, 1);
}