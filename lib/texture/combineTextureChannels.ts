import { decodeTexturePixels } from "./decodeTexturePixels"
import {
  createDerivedTexture,
  getChannelTextureValue,
  validateMatchingTextureDimensions,
} from "./internal"
import { type SerializedTextureData } from "./types"

export function combineTextureChannels(inputs: {
  red?: SerializedTextureData | null
  green?: SerializedTextureData | null
  blue?: SerializedTextureData | null
  alpha?: SerializedTextureData | null
}): SerializedTextureData {
  const connectedTextures = [
    inputs.red,
    inputs.green,
    inputs.blue,
    inputs.alpha,
  ].filter((texture): texture is SerializedTextureData => Boolean(texture))

  if (connectedTextures.length === 0) {
    throw new Error("Connect at least one channel texture.")
  }

  validateMatchingTextureDimensions(connectedTextures)

  const baseTexture = connectedTextures[0]
  const redPixels = inputs.red ? decodeTexturePixels(inputs.red) : null
  const greenPixels = inputs.green ? decodeTexturePixels(inputs.green) : null
  const bluePixels = inputs.blue ? decodeTexturePixels(inputs.blue) : null
  const alphaPixels = inputs.alpha ? decodeTexturePixels(inputs.alpha) : null
  const combinedPixels = new Uint8ClampedArray(
    baseTexture.width * baseTexture.frameSize * 4 * baseTexture.frames
  )

  for (let index = 0; index < combinedPixels.length; index += 4) {
    combinedPixels[index] = redPixels
      ? Math.round(getChannelTextureValue(inputs.red!, redPixels, index) * 255)
      : 0
    combinedPixels[index + 1] = greenPixels
      ? Math.round(
          getChannelTextureValue(inputs.green!, greenPixels, index) * 255
        )
      : 0
    combinedPixels[index + 2] = bluePixels
      ? Math.round(
          getChannelTextureValue(inputs.blue!, bluePixels, index) * 255
        )
      : 0
    combinedPixels[index + 3] = alphaPixels
      ? Math.round(
          getChannelTextureValue(inputs.alpha!, alphaPixels, index) * 255
        )
      : 255
  }

  return createDerivedTexture(baseTexture, "channels", combinedPixels)
}
