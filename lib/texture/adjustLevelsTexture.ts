import { type SerializedTextureData } from "./types"
import { clampUnit, createDerivedTexture } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function adjustLevelsTexture(
  texture: SerializedTextureData,
  blackValues: readonly number[],
  whiteValues: readonly number[],
  gammaValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(sourcePixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const blackPoint = clampUnit(blackValues[frameIndex] ?? 0)
    const whitePoint = Math.max(
      blackPoint + 0.01,
      clampUnit(whiteValues[frameIndex] ?? 1)
    )
    const gamma = Math.max(0.1, Math.min(4, gammaValues[frameIndex] ?? 1))

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset

      for (let channelOffset = 0; channelOffset < 3; channelOffset += 1) {
        const channelValue = sourcePixels[pixelIndex + channelOffset] / 255
        const normalized = clampUnit(
          (channelValue - blackPoint) / (whitePoint - blackPoint)
        )

        adjustedPixels[pixelIndex + channelOffset] = Math.round(
          clampUnit(normalized ** (1 / gamma)) * 255
        )
      }

      adjustedPixels[pixelIndex + 3] = sourcePixels[pixelIndex + 3]
    }
  }

  return createDerivedTexture(texture, "levels", adjustedPixels)
}
