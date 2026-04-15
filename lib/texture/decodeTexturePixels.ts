import { type SerializedTextureData } from "./types"
import { decodeBase64 } from "./internal"

export function decodeTexturePixels(texture: SerializedTextureData) {
  return decodeBase64(texture.pixels)
}
