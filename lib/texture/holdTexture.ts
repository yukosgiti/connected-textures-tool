import { type SerializedTextureData } from "./types"
import { normalizeFrameIndex } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function holdTexture(
  texture: SerializedTextureData,
  holdValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const heldPixels = new Uint8ClampedArray(sourcePixels.length)
  let sourceFrameCursor = 0
  let outputFrameIndex = 0

  while (outputFrameIndex < texture.frames) {
    const holdLength = Math.max(
      1,
      Math.round(holdValues[sourceFrameCursor] ?? 1)
    )
    const sourceFrameIndex = normalizeFrameIndex(
      sourceFrameCursor,
      texture.frames
    )
    const sourceStart = sourceFrameIndex * frameByteLength

    for (
      let repeatIndex = 0;
      repeatIndex < holdLength && outputFrameIndex < texture.frames;
      repeatIndex += 1
    ) {
      const targetStart = outputFrameIndex * frameByteLength

      heldPixels.set(
        sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
        targetStart
      )

      outputFrameIndex += 1
    }

    sourceFrameCursor += 1
  }

  return {
    name: `${texture.name} (held)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(heldPixels),
  }
}
