import { type SerializedTextureData } from "./types"
import { createDerivedTexture, samplePixel } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function skewTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const skewedPixels = new Uint8ClampedArray(sourcePixels.length)
  const centerX = width / 2
  const centerY = height / 2

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const skewX = Math.max(-1, Math.min(1, xValues[frameIndex] ?? 0))
    const skewY = Math.max(-1, Math.min(1, yValues[frameIndex] ?? 0))
    const determinant = 1 - skewX * skewY
    const safeDeterminant =
      Math.abs(determinant) < 0.05
        ? 0.05 * (determinant < 0 ? -1 : 1)
        : determinant

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offsetX = x + 0.5 - centerX
        const offsetY = y + 0.5 - centerY
        const sourceOffsetX = (offsetX - skewX * offsetY) / safeDeterminant
        const sourceOffsetY = (offsetY - skewY * offsetX) / safeDeterminant
        const sample = samplePixel(
          sourcePixels,
          width,
          height,
          frameStart,
          sourceOffsetX + centerX - 0.5,
          sourceOffsetY + centerY - 0.5
        )
        const targetIndex = frameStart + (y * width + x) * 4

        skewedPixels[targetIndex] = sample.red
        skewedPixels[targetIndex + 1] = sample.green
        skewedPixels[targetIndex + 2] = sample.blue
        skewedPixels[targetIndex + 3] = sample.alpha
      }
    }
  }

  return createDerivedTexture(texture, "skewed", skewedPixels)
}
