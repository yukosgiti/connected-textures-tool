import { type SerializedTextureData } from "./types"
import { clampUnit, createDerivedTexture } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function adjustBrightnessTexture(
  texture: SerializedTextureData,
  brightnessValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(sourcePixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const brightness = Math.max(
      -1,
      Math.min(1, brightnessValues[frameIndex] ?? 0)
    )

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset

      adjustedPixels[pixelIndex] = Math.round(
        clampUnit(sourcePixels[pixelIndex] / 255 + brightness) * 255
      )
      adjustedPixels[pixelIndex + 1] = Math.round(
        clampUnit(sourcePixels[pixelIndex + 1] / 255 + brightness) * 255
      )
      adjustedPixels[pixelIndex + 2] = Math.round(
        clampUnit(sourcePixels[pixelIndex + 2] / 255 + brightness) * 255
      )
      adjustedPixels[pixelIndex + 3] = sourcePixels[pixelIndex + 3]
    }
  }

  return createDerivedTexture(texture, "brightness", adjustedPixels)
}
