import { type SerializedTextureData } from "./types"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function scaleTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const scaledPixels = new Uint8ClampedArray(frameByteLength * texture.frames)
  const centerX = width / 2
  const centerY = height / 2

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const scaleX = Math.max(0.0001, 1 + (xValues[frameIndex] ?? 0))
    const scaleY = Math.max(0.0001, 1 + (yValues[frameIndex] ?? 0))

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offsetX = x + 0.5 - centerX
        const offsetY = y + 0.5 - centerY
        const sourceX = offsetX / scaleX + centerX - 0.5
        const sourceY = offsetY / scaleY + centerY - 0.5
        const wrappedX = ((Math.round(sourceX) % width) + width) % width
        const wrappedY = ((Math.round(sourceY) % height) + height) % height
        const sourceIndex = frameStart + (wrappedY * width + wrappedX) * 4
        const targetIndex = frameStart + (y * width + x) * 4

        scaledPixels[targetIndex] = decodedPixels[sourceIndex]
        scaledPixels[targetIndex + 1] = decodedPixels[sourceIndex + 1]
        scaledPixels[targetIndex + 2] = decodedPixels[sourceIndex + 2]
        scaledPixels[targetIndex + 3] = decodedPixels[sourceIndex + 3]
      }
    }
  }

  return {
    name: `${texture.name} (scaled)`,
    width,
    height: texture.height,
    frameSize: height,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(scaledPixels),
  }
}
