import { type FlipTextureMode, FLIP_TEXTURE_MODE_LABELS, type SerializedTextureData } from "./types"
import { createDerivedTexture } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function flipTexture(
  texture: SerializedTextureData,
  mode: FlipTextureMode
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const flippedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sourceX =
          mode === "horizontal" || mode === "both" ? width - 1 - x : x
        const sourceY =
          mode === "vertical" || mode === "both" ? height - 1 - y : y
        const sourceIndex = frameStart + (sourceY * width + sourceX) * 4
        const targetIndex = frameStart + (y * width + x) * 4

        flippedPixels[targetIndex] = sourcePixels[sourceIndex]
        flippedPixels[targetIndex + 1] = sourcePixels[sourceIndex + 1]
        flippedPixels[targetIndex + 2] = sourcePixels[sourceIndex + 2]
        flippedPixels[targetIndex + 3] = sourcePixels[sourceIndex + 3]
      }
    }
  }

  return createDerivedTexture(
    texture,
    FLIP_TEXTURE_MODE_LABELS[mode],
    flippedPixels
  )
}
