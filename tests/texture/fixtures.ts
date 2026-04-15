import { type SerializedTextureData } from "@/lib/texture"

export type RgbaPixel = readonly [number, number, number, number]

export function rgba(
  red: number,
  green: number,
  blue: number,
  alpha = 255
): RgbaPixel {
  return [red, green, blue, alpha]
}

export function createFrame(...pixels: RgbaPixel[]) {
  return new Uint8ClampedArray(pixels.flat())
}

export function createSolidFrame(
  width: number,
  height: number,
  pixel: RgbaPixel
) {
  const framePixels = new Uint8ClampedArray(width * height * 4)

  for (let index = 0; index < framePixels.length; index += 4) {
    framePixels[index] = pixel[0]
    framePixels[index + 1] = pixel[1]
    framePixels[index + 2] = pixel[2]
    framePixels[index + 3] = pixel[3]
  }

  return framePixels
}

export function encodePixels(pixels: Uint8ClampedArray) {
  return Buffer.from(pixels).toString("base64")
}

export function decodePixels(base64: string) {
  return new Uint8ClampedArray(Buffer.from(base64, "base64"))
}

export function createTexture(options: {
  name?: string
  width: number
  frameSize: number
  frames: Uint8ClampedArray[]
  sourceFrames?: number
}): SerializedTextureData {
  const pixels = new Uint8ClampedArray(
    options.frames.reduce((total, frame) => total + frame.length, 0)
  )
  let offset = 0

  for (const frame of options.frames) {
    pixels.set(frame, offset)
    offset += frame.length
  }

  return {
    name: options.name ?? "Texture",
    width: options.width,
    height: options.frameSize * options.frames.length,
    frameSize: options.frameSize,
    frames: options.frames.length,
    sourceFrames: options.sourceFrames ?? options.frames.length,
    pixels: encodePixels(pixels),
  }
}

export function getFramePixels(texture: SerializedTextureData, frameIndex = 0) {
  const frameByteLength = texture.width * texture.frameSize * 4
  const start = frameIndex * frameByteLength
  const pixels = decodePixels(texture.pixels)

  return pixels.slice(start, start + frameByteLength)
}

export function getPixel(
  framePixels: Uint8ClampedArray,
  width: number,
  x: number,
  y: number
) {
  const start = (y * width + x) * 4

  return Array.from(framePixels.slice(start, start + 4))
}
