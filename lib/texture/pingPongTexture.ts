import { type SerializedTextureData } from "./types"
import { createDerivedTexture } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function pingPongTexture(
  texture: SerializedTextureData
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const pingPongPixels = new Uint8ClampedArray(sourcePixels.length)
  const baseFrameCount = Math.max(
    1,
    Math.min(texture.frames, texture.sourceFrames || texture.frames)
  )
  const sequenceLength = baseFrameCount <= 1 ? 1 : baseFrameCount * 2 - 2

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const sequenceIndex = frameIndex % sequenceLength
    const sourceFrameIndex =
      sequenceIndex < baseFrameCount
        ? sequenceIndex
        : sequenceLength - sequenceIndex
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    pingPongPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return createDerivedTexture(
    texture,
    "ping-pong",
    pingPongPixels,
    baseFrameCount
  )
}
