import { encodeBase64 } from "./internal"

export function encodeTexturePixels(pixels: Uint8ClampedArray) {
  return encodeBase64(pixels)
}
