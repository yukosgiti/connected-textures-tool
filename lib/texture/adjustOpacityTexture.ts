import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function adjustOpacityTexture(
  texture: SerializedTextureData,
  opacityValues: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(decodedPixels)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const opacity = Math.max(0, Math.min(1, opacityValues[frameIndex] ?? 1))

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const alphaIndex = frameStart + offset + 3
      adjustedPixels[alphaIndex] = Math.round(
        decodedPixels[alphaIndex] * opacity
      )
    }
  }

  return {
    name: `${texture.name} (opacity)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(adjustedPixels),
  }
}
