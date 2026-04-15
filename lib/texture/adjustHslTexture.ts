import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"
import { hslToRgb, rgbToHsl } from "./internal"

export function adjustHslTexture(
  texture: SerializedTextureData,
  hueValues: readonly number[],
  saturationValues: readonly number[],
  lightnessValues: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(decodedPixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const hueShift = hueValues[frameIndex] ?? 0
    const saturationShift = saturationValues[frameIndex] ?? 0
    const lightnessShift = lightnessValues[frameIndex] ?? 0

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset
      const red = decodedPixels[pixelIndex]
      const green = decodedPixels[pixelIndex + 1]
      const blue = decodedPixels[pixelIndex + 2]
      const alpha = decodedPixels[pixelIndex + 3]
      const hsl = rgbToHsl(red, green, blue)
      const hue = (((hsl.hue + hueShift) % 1) + 1) % 1
      const saturation = Math.max(
        0,
        Math.min(1, hsl.saturation + saturationShift)
      )
      const lightness = Math.max(0, Math.min(1, hsl.lightness + lightnessShift))
      const rgb = hslToRgb(hue, saturation, lightness)

      adjustedPixels[pixelIndex] = rgb.red
      adjustedPixels[pixelIndex + 1] = rgb.green
      adjustedPixels[pixelIndex + 2] = rgb.blue
      adjustedPixels[pixelIndex + 3] = alpha
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
  }
}
