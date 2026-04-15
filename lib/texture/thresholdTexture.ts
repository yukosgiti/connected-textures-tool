import { type SerializedTextureData } from "./types"
import { clampUnit, createDerivedTexture } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function thresholdTexture(
  texture: SerializedTextureData,
  thresholdValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const thresholdedPixels = new Uint8ClampedArray(sourcePixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const threshold = clampUnit(thresholdValues[frameIndex] ?? 0.5)

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset
      const red = sourcePixels[pixelIndex] / 255
      const green = sourcePixels[pixelIndex + 1] / 255
      const blue = sourcePixels[pixelIndex + 2] / 255
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
      const value = luminance >= threshold ? 255 : 0

      thresholdedPixels[pixelIndex] = value
      thresholdedPixels[pixelIndex + 1] = value
      thresholdedPixels[pixelIndex + 2] = value
      thresholdedPixels[pixelIndex + 3] = sourcePixels[pixelIndex + 3]
    }
  }

  return createDerivedTexture(texture, "threshold", thresholdedPixels)
}
