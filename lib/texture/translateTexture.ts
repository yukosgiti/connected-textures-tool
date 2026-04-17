import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"
import { memoizeTextureFramePairOperation } from "./internal"

const computeTranslateTexture = (
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[]
): SerializedTextureData => {
  const decodedPixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const translatedPixels = new Uint8ClampedArray(
    frameByteLength * texture.frames
  )

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const offsetX = Math.round((xValues[frameIndex] ?? 0) * width)
    const offsetY = Math.round((yValues[frameIndex] ?? 0) * height)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sourceX = (((x - offsetX) % width) + width) % width
        const sourceY = (((y - offsetY) % height) + height) % height
        const sourceIndex = frameStart + (sourceY * width + sourceX) * 4
        const targetIndex = frameStart + (y * width + x) * 4

        translatedPixels[targetIndex] = decodedPixels[sourceIndex]
        translatedPixels[targetIndex + 1] = decodedPixels[sourceIndex + 1]
        translatedPixels[targetIndex + 2] = decodedPixels[sourceIndex + 2]
        translatedPixels[targetIndex + 3] = decodedPixels[sourceIndex + 3]
      }
    }
  }

  return {
    name: `${texture.name} (translated)`,
    width,
    height: texture.height,
    frameSize: height,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(translatedPixels),
  }
}

export const translateTexture = memoizeTextureFramePairOperation(
  computeTranslateTexture
)
