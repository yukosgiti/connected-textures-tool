import { type SerializedTextureData } from "./types"
import { createDerivedTexture } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function grayscaleTexture(
  texture: SerializedTextureData
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const grayscalePixels = new Uint8ClampedArray(sourcePixels.length)

  for (let index = 0; index < sourcePixels.length; index += 4) {
    const luminance = Math.round(
      0.2126 * sourcePixels[index] +
        0.7152 * sourcePixels[index + 1] +
        0.0722 * sourcePixels[index + 2]
    )

    grayscalePixels[index] = luminance
    grayscalePixels[index + 1] = luminance
    grayscalePixels[index + 2] = luminance
    grayscalePixels[index + 3] = sourcePixels[index + 3]
  }

  return createDerivedTexture(texture, "grayscale", grayscalePixels)
}
