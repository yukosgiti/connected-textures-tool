import { TILE_TEXTURE_MODE_LABELS, type SerializedTextureData, type TileTextureMode } from "./types"
import { createDerivedTexture, mirrorUnit, samplePixel } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"

export function tileTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[],
  mode: TileTextureMode
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const tiledPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const repeatX = Math.max(0.25, Math.min(8, xValues[frameIndex] ?? 1))
    const repeatY = Math.max(0.25, Math.min(8, yValues[frameIndex] ?? 1))

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const normalizedX = ((x + 0.5) / width) * repeatX
        const normalizedY = ((y + 0.5) / height) * repeatY
        const sampleX =
          mode === "mirror"
            ? mirrorUnit(normalizedX) * width - 0.5
            : (normalizedX - Math.floor(normalizedX)) * width - 0.5
        const sampleY =
          mode === "mirror"
            ? mirrorUnit(normalizedY) * height - 0.5
            : (normalizedY - Math.floor(normalizedY)) * height - 0.5
        const sample = samplePixel(
          sourcePixels,
          width,
          height,
          frameStart,
          sampleX,
          sampleY,
          mode
        )
        const targetIndex = frameStart + (y * width + x) * 4

        tiledPixels[targetIndex] = sample.red
        tiledPixels[targetIndex + 1] = sample.green
        tiledPixels[targetIndex + 2] = sample.blue
        tiledPixels[targetIndex + 3] = sample.alpha
      }
    }
  }

  return createDerivedTexture(
    texture,
    TILE_TEXTURE_MODE_LABELS[mode],
    tiledPixels
  )
}
