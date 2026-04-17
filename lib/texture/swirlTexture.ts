import { type SerializedTextureData } from "./types"
import {
  createDerivedTexture,
  memoizeTextureFrameValueOperation,
  samplePixel,
} from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

const computeSwirlTexture = (
  texture: SerializedTextureData,
  values: readonly number[]
): SerializedTextureData => {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const swirledPixels = new Uint8ClampedArray(sourcePixels.length)
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.max(0.0001, Math.hypot(width / 2, height / 2))

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const strength = clamp(values[frameIndex] ?? 0, -1, 1)
    const falloffExponent = 1 + (1 - Math.abs(strength)) * 2

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offsetX = x + 0.5 - centerX
        const offsetY = y + 0.5 - centerY
        const radius = Math.hypot(offsetX, offsetY)
        const normalizedRadius = clamp(radius / maxRadius, 0, 1)
        const angle = Math.atan2(offsetY, offsetX)
        const twist =
          strength * Math.PI * 2 * (1 - normalizedRadius) ** falloffExponent
        const sourceAngle = angle - twist
        const sample = samplePixel(
          sourcePixels,
          width,
          height,
          frameStart,
          Math.cos(sourceAngle) * radius + centerX - 0.5,
          Math.sin(sourceAngle) * radius + centerY - 0.5
        )
        const targetIndex = frameStart + (y * width + x) * 4

        swirledPixels[targetIndex] = sample.red
        swirledPixels[targetIndex + 1] = sample.green
        swirledPixels[targetIndex + 2] = sample.blue
        swirledPixels[targetIndex + 3] = sample.alpha
      }
    }
  }

  return createDerivedTexture(texture, "swirled", swirledPixels)
}

export const swirlTexture = memoizeTextureFrameValueOperation(
  computeSwirlTexture
)