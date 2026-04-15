import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function rotateTexture(
  texture: SerializedTextureData,
  values: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = texture.width * texture.frameSize * 4
  const rotatedPixels = new Uint8ClampedArray(frameByteLength * texture.frames)
  const centerX = width / 2
  const centerY = height / 2

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const angleTurns = values[frameIndex] ?? 0
    const radians = angleTurns * Math.PI * 2
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offsetX = x + 0.5 - centerX
        const offsetY = y + 0.5 - centerY
        const sourceX = cos * offsetX + sin * offsetY + centerX - 0.5
        const sourceY = -sin * offsetX + cos * offsetY + centerY - 0.5
        const wrappedX = ((Math.round(sourceX) % width) + width) % width
        const wrappedY = ((Math.round(sourceY) % height) + height) % height
        const sourceIndex = frameStart + (wrappedY * width + wrappedX) * 4
        const targetIndex = frameStart + (y * width + x) * 4

        rotatedPixels[targetIndex] = decodedPixels[sourceIndex]
        rotatedPixels[targetIndex + 1] = decodedPixels[sourceIndex + 1]
        rotatedPixels[targetIndex + 2] = decodedPixels[sourceIndex + 2]
        rotatedPixels[targetIndex + 3] = decodedPixels[sourceIndex + 3]
      }
    }
  }

  return {
    name: `${texture.name} (rotated)`,
    width,
    height: texture.height,
    frameSize: height,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(rotatedPixels),
  }
}
