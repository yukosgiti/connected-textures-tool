import { type SerializedTextureData } from "./types"
import { clampUnit } from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

export function maskTexture(
  texture: SerializedTextureData,
  mask: SerializedTextureData
): SerializedTextureData {
  if (
    texture.width !== mask.width ||
    texture.frameSize !== mask.frameSize ||
    texture.frames !== mask.frames
  ) {
    throw new Error("Textures must have matching dimensions and frame counts.")
  }

  const texturePixels = decodeTexturePixels(texture)
  const maskPixels = decodeTexturePixels(mask)
  const maskedPixels = new Uint8ClampedArray(texturePixels)

  for (let index = 0; index < texturePixels.length; index += 4) {
    const maskRed = maskPixels[index] / 255
    const maskGreen = maskPixels[index + 1] / 255
    const maskBlue = maskPixels[index + 2] / 255
    const maskAlpha = maskPixels[index + 3] / 255
    const maskLuminance =
      0.2126 * maskRed + 0.7152 * maskGreen + 0.0722 * maskBlue
    const opacity = clampUnit(maskLuminance * maskAlpha)

    maskedPixels[index + 3] = Math.round(texturePixels[index + 3] * opacity)
  }

  return {
    name: `${texture.name} (masked by ${mask.name})`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(maskedPixels),
  }
}
