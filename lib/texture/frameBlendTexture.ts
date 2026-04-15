import { type SerializedTextureData } from "./types"
import { clampUnit, createDerivedTexture, normalizeFrameIndex } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function frameBlendTexture(
  texture: SerializedTextureData,
  blendValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const blendedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const nextFrameIndex = normalizeFrameIndex(frameIndex + 1, texture.frames)
    const blendAmount = clampUnit(blendValues[frameIndex] ?? 0)
    const frameStart = frameIndex * frameByteLength
    const nextFrameStart = nextFrameIndex * frameByteLength

    for (let offset = 0; offset < frameByteLength; offset += 1) {
      blendedPixels[frameStart + offset] = Math.round(
        sourcePixels[frameStart + offset] * (1 - blendAmount) +
          sourcePixels[nextFrameStart + offset] * blendAmount
      )
    }
  }

  return createDerivedTexture(texture, "frame blend", blendedPixels)
}
