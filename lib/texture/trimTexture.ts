import { type SerializedTextureData } from "./types"
import { createDerivedTexture, normalizeFrameIndex } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function trimTexture(
  texture: SerializedTextureData,
  startValues: readonly number[],
  lengthValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const trimmedPixels = new Uint8ClampedArray(sourcePixels.length)
  const baseFrameCount = Math.max(
    1,
    Math.min(texture.frames, texture.sourceFrames || texture.frames)
  )

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const start = normalizeFrameIndex(
      Math.round(startValues[frameIndex] ?? 0),
      baseFrameCount
    )
    const length = Math.max(
      1,
      Math.min(
        baseFrameCount,
        Math.round(lengthValues[frameIndex] ?? baseFrameCount)
      )
    )
    const sourceFrameIndex = (start + (frameIndex % length)) % baseFrameCount
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    trimmedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return createDerivedTexture(texture, "trimmed", trimmedPixels, baseFrameCount)
}
