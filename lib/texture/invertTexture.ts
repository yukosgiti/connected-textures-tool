import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function invertTexture(
  texture: SerializedTextureData
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const invertedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let index = 0; index < sourcePixels.length; index += 4) {
    invertedPixels[index] = 255 - sourcePixels[index]
    invertedPixels[index + 1] = 255 - sourcePixels[index + 1]
    invertedPixels[index + 2] = 255 - sourcePixels[index + 2]
    invertedPixels[index + 3] = sourcePixels[index + 3]
  }

  return {
    name: `${texture.name} (inverted)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(invertedPixels),
  }
}
