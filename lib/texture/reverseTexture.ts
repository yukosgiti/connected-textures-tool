import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function reverseTexture(
  texture: SerializedTextureData
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const reversedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const sourceFrameIndex = texture.frames - 1 - frameIndex
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    reversedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return {
    name: `${texture.name} (reversed)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(reversedPixels),
  }
}
