import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"
import { clampUnit } from "./internal"

export function adjustContrastTexture(
  texture: SerializedTextureData,
  contrastValues: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(decodedPixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const contrast = Math.max(-1, Math.min(1, contrastValues[frameIndex] ?? 0))
    const contrastFactor = 1 + contrast

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset
      const red = decodedPixels[pixelIndex] / 255
      const green = decodedPixels[pixelIndex + 1] / 255
      const blue = decodedPixels[pixelIndex + 2] / 255

      adjustedPixels[pixelIndex] = Math.round(
        clampUnit((red - 0.5) * contrastFactor + 0.5) * 255
      )
      adjustedPixels[pixelIndex + 1] = Math.round(
        clampUnit((green - 0.5) * contrastFactor + 0.5) * 255
      )
      adjustedPixels[pixelIndex + 2] = Math.round(
        clampUnit((blue - 0.5) * contrastFactor + 0.5) * 255
      )
      adjustedPixels[pixelIndex + 3] = decodedPixels[pixelIndex + 3]
    }
  }

  return {
    name: `${texture.name} (contrast)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(adjustedPixels),
  }
}
