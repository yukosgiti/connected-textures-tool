import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function getTextureFramePixels(
  texture: SerializedTextureData,
  frameIndex = 0
) {
  const safeFrameIndex =
    ((frameIndex % texture.frames) + texture.frames) % texture.frames
  const frameByteLength = texture.width * texture.frameSize * 4
  const frameStart = safeFrameIndex * frameByteLength
  const decodedPixels = decodeTexturePixels(texture)

  return decodedPixels.slice(frameStart, frameStart + frameByteLength)
}
