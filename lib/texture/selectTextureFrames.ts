import { type SerializedTextureData } from "./types"
import { normalizeFrameIndex } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function selectTextureFrames(
  texture: SerializedTextureData,
  frameIndices: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const selectedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const selectedFrame = Math.round(frameIndices[frameIndex] ?? 0)
    const sourceFrameIndex = normalizeFrameIndex(selectedFrame, texture.frames)
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    selectedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return {
    name: `${texture.name} (selected)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(selectedPixels),
  }
}
