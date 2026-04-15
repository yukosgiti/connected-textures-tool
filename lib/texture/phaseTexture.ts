import { type SerializedTextureData } from "./types"
import { normalizeFrameIndex } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function phaseTexture(
  texture: SerializedTextureData,
  frameOffsets: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const phasedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameOffset = Math.round(frameOffsets[frameIndex] ?? 0)
    const sourceFrameIndex = normalizeFrameIndex(
      frameIndex + frameOffset,
      texture.frames
    )
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    phasedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return {
    name: `${texture.name} (phased)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(phasedPixels),
  }
}
