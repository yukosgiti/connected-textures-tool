import { type SerializedTextureData } from "./types"
import { createDerivedTexture, sampleClampedPixel } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function cropTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[],
  widthValues: readonly number[],
  heightValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const croppedPixels = new Uint8ClampedArray(sourcePixels.length)
  const minWidth = 1 / width
  const minHeight = 1 / height

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const cropWidth = Math.max(
      minWidth,
      Math.min(1, widthValues[frameIndex] ?? 1)
    )
    const cropHeight = Math.max(
      minHeight,
      Math.min(1, heightValues[frameIndex] ?? 1)
    )
    const originX = Math.max(
      0,
      Math.min(1 - cropWidth, xValues[frameIndex] ?? 0)
    )
    const originY = Math.max(
      0,
      Math.min(1 - cropHeight, yValues[frameIndex] ?? 0)
    )

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const normalizedX = (x + 0.5) / width
        const normalizedY = (y + 0.5) / height
        const sample = sampleClampedPixel(
          sourcePixels,
          width,
          height,
          frameStart,
          (originX + normalizedX * cropWidth) * width - 0.5,
          (originY + normalizedY * cropHeight) * height - 0.5
        )
        const targetIndex = frameStart + (y * width + x) * 4

        croppedPixels[targetIndex] = sample.red
        croppedPixels[targetIndex + 1] = sample.green
        croppedPixels[targetIndex + 2] = sample.blue
        croppedPixels[targetIndex + 3] = sample.alpha
      }
    }
  }

  return createDerivedTexture(texture, "cropped", croppedPixels)
}
