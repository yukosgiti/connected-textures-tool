import { type SerializedTextureData } from "./types"
import { normalizeFrameIndex } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function speedTexture(
  texture: SerializedTextureData,
  speedValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const retimedPixels = new Uint8ClampedArray(sourcePixels.length)
  let playbackPosition = 0

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const sourceFrameIndex = normalizeFrameIndex(
      Math.floor(playbackPosition),
      texture.frames
    )
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    retimedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )

    playbackPosition += speedValues[frameIndex] ?? 1
  }

  return {
    name: `${texture.name} (retimed)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(retimedPixels),
  }
}
