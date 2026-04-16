import { type SerializedTextureData } from "./types"
import { decodeBase64 } from "./internal"

const decodedTexturePixelsCache = new WeakMap<SerializedTextureData, Uint8ClampedArray>()

export function decodeTexturePixels(texture: SerializedTextureData) {
  const cachedPixels = decodedTexturePixelsCache.get(texture)

  if (cachedPixels) {
    return cachedPixels
  }

  const decodedPixels = decodeBase64(texture.pixels)
  decodedTexturePixelsCache.set(texture, decodedPixels)

  return decodedPixels
}
