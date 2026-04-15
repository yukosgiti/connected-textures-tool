import { type SerializedTextureData } from "./types"
import { createDerivedTexture, sampleClampedPixel } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function magnifyTexture(
  texture: SerializedTextureData,
  values: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const distortedPixels = new Uint8ClampedArray(sourcePixels.length)
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.max(0.0001, Math.hypot(width / 2, height / 2))

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const strength = clamp(values[frameIndex] ?? 0, -1, 1)
    const edgeInfluence = 0.25 * Math.abs(strength)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offsetX = x + 0.5 - centerX
        const offsetY = y + 0.5 - centerY
        const radius = Math.hypot(offsetX, offsetY)
        const normalizedRadius = clamp(radius / maxRadius, 0, 1)
        const influence =
          edgeInfluence + (1 - edgeInfluence) * (1 - normalizedRadius) ** 2
        const localScale = Math.max(0.05, 1 + strength * influence)
        const sourceRadius = radius / localScale
        const radiusScale = radius <= 0 ? 0 : sourceRadius / radius
        const sample = sampleClampedPixel(
          sourcePixels,
          width,
          height,
          frameStart,
          offsetX * radiusScale + centerX - 0.5,
          offsetY * radiusScale + centerY - 0.5
        )
        const targetIndex = frameStart + (y * width + x) * 4

        distortedPixels[targetIndex] = sample.red
        distortedPixels[targetIndex + 1] = sample.green
        distortedPixels[targetIndex + 2] = sample.blue
        distortedPixels[targetIndex + 3] = sample.alpha
      }
    }
  }

  return createDerivedTexture(texture, "magnified", distortedPixels)
}