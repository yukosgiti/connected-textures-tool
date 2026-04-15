import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function blurTexture(
  texture: SerializedTextureData,
  blurValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const blurredPixels = new Uint8ClampedArray(sourcePixels.length)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4

  const wrapIndex = (value: number, size: number) =>
    ((value % size) + size) % size

  const buildKernel = (sigma: number) => {
    const radius = Math.max(1, Math.ceil(sigma * 3))
    const weights = new Float32Array(radius * 2 + 1)
    let total = 0

    for (let offset = -radius; offset <= radius; offset += 1) {
      const weight = Math.exp(-(offset * offset) / (2 * sigma * sigma))
      weights[offset + radius] = weight
      total += weight
    }

    for (let index = 0; index < weights.length; index += 1) {
      weights[index] /= total
    }

    return { radius, weights }
  }

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const blurAmount = Math.max(0, Math.min(1, blurValues[frameIndex] ?? 0))
    const sigma = blurAmount * 4

    if (sigma < 0.01) {
      blurredPixels.set(
        sourcePixels.subarray(frameStart, frameStart + frameByteLength),
        frameStart
      )
      continue
    }

    const { radius, weights } = buildKernel(sigma)
    const horizontalPixels = new Float32Array(frameByteLength)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let premultipliedRed = 0
        let premultipliedGreen = 0
        let premultipliedBlue = 0
        let alphaSum = 0

        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const weight = weights[offsetX + radius]
          const sampleX = wrapIndex(x + offsetX, width)
          const sampleIndex = frameStart + (y * width + sampleX) * 4
          const alpha = sourcePixels[sampleIndex + 3] / 255

          premultipliedRed += sourcePixels[sampleIndex] * alpha * weight
          premultipliedGreen += sourcePixels[sampleIndex + 1] * alpha * weight
          premultipliedBlue += sourcePixels[sampleIndex + 2] * alpha * weight
          alphaSum += alpha * weight
        }

        const targetIndex = (y * width + x) * 4

        horizontalPixels[targetIndex] = premultipliedRed
        horizontalPixels[targetIndex + 1] = premultipliedGreen
        horizontalPixels[targetIndex + 2] = premultipliedBlue
        horizontalPixels[targetIndex + 3] = alphaSum
      }
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let premultipliedRed = 0
        let premultipliedGreen = 0
        let premultipliedBlue = 0
        let alphaSum = 0

        for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
          const weight = weights[offsetY + radius]
          const sampleY = wrapIndex(y + offsetY, height)
          const sampleIndex = (sampleY * width + x) * 4

          premultipliedRed += horizontalPixels[sampleIndex] * weight
          premultipliedGreen += horizontalPixels[sampleIndex + 1] * weight
          premultipliedBlue += horizontalPixels[sampleIndex + 2] * weight
          alphaSum += horizontalPixels[sampleIndex + 3] * weight
        }

        const targetIndex = frameStart + (y * width + x) * 4

        if (alphaSum <= 0.0001) {
          blurredPixels[targetIndex] = 0
          blurredPixels[targetIndex + 1] = 0
          blurredPixels[targetIndex + 2] = 0
          blurredPixels[targetIndex + 3] = 0
          continue
        }

        blurredPixels[targetIndex] = Math.round(
          Math.max(0, Math.min(255, premultipliedRed / alphaSum))
        )
        blurredPixels[targetIndex + 1] = Math.round(
          Math.max(0, Math.min(255, premultipliedGreen / alphaSum))
        )
        blurredPixels[targetIndex + 2] = Math.round(
          Math.max(0, Math.min(255, premultipliedBlue / alphaSum))
        )
        blurredPixels[targetIndex + 3] = Math.round(
          Math.max(0, Math.min(1, alphaSum)) * 255
        )
      }
    }
  }

  return {
    name: `${texture.name} (blurred)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(blurredPixels),
  }
}
