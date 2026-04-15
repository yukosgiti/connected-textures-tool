import { createCanvas, decodeBase64, getCanvasContext } from "./internal"
import { type SerializedTextureData } from "./types"

export function textureFrameToDataUrl(
  texture: SerializedTextureData,
  frameIndex = 0
) {
  const safeFrameIndex =
    ((frameIndex % texture.frames) + texture.frames) % texture.frames
  const canvas = createCanvas(texture.width, texture.frameSize)
  const context = getCanvasContext(canvas)
  const frameByteLength = texture.width * texture.frameSize * 4
  const frameStart = safeFrameIndex * frameByteLength
  const decodedPixels = decodeBase64(texture.pixels)
  const framePixels = decodedPixels.slice(
    frameStart,
    frameStart + frameByteLength
  )

  context.putImageData(
    new ImageData(framePixels, texture.width, texture.frameSize),
    0,
    0
  )

  return canvas.toDataURL()
}
