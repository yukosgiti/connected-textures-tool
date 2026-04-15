import { decodeTexturePixels } from "./decodeTexturePixels"
import { createDerivedTexture } from "./internal"
import {
  type SerializedTextureData,
  type TextureChannelOutputHandleId,
} from "./types"

export function splitTextureChannels(texture: SerializedTextureData) {
  const sourcePixels = decodeTexturePixels(texture)
  const redPixels = new Uint8ClampedArray(sourcePixels.length)
  const greenPixels = new Uint8ClampedArray(sourcePixels.length)
  const bluePixels = new Uint8ClampedArray(sourcePixels.length)
  const alphaPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let index = 0; index < sourcePixels.length; index += 4) {
    const red = sourcePixels[index]
    const green = sourcePixels[index + 1]
    const blue = sourcePixels[index + 2]
    const alpha = sourcePixels[index + 3]

    redPixels[index] = red
    redPixels[index + 1] = red
    redPixels[index + 2] = red
    redPixels[index + 3] = 255

    greenPixels[index] = green
    greenPixels[index + 1] = green
    greenPixels[index + 2] = green
    greenPixels[index + 3] = 255

    bluePixels[index] = blue
    bluePixels[index + 1] = blue
    bluePixels[index + 2] = blue
    bluePixels[index + 3] = 255

    alphaPixels[index] = alpha
    alphaPixels[index + 1] = alpha
    alphaPixels[index + 2] = alpha
    alphaPixels[index + 3] = 255
  }

  return {
    outputRed: createDerivedTexture(texture, "red", redPixels),
    outputGreen: createDerivedTexture(texture, "green", greenPixels),
    outputBlue: createDerivedTexture(texture, "blue", bluePixels),
    outputAlpha: createDerivedTexture(texture, "alpha", alphaPixels),
  } satisfies Record<TextureChannelOutputHandleId, SerializedTextureData>
}
