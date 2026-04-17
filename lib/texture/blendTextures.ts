import { type SerializedTextureData, type TextureBlendMode } from "./types"
import {
  blendChannel,
  clampUnit,
  memoizeTexturePairValueOperation,
} from "./internal"
import { decodeTexturePixels } from "./decodeTexturePixels"
import { encodeTexturePixels } from "./encodeTexturePixels"

const computeBlendTextures = (
  baseTexture: SerializedTextureData,
  blendTexture: SerializedTextureData,
  mode: TextureBlendMode
): SerializedTextureData => {
  if (
    baseTexture.width !== blendTexture.width ||
    baseTexture.frameSize !== blendTexture.frameSize ||
    baseTexture.frames !== blendTexture.frames
  ) {
    throw new Error("Textures must have matching dimensions and frame counts.")
  }

  const basePixels = decodeTexturePixels(baseTexture)
  const blendPixels = decodeTexturePixels(blendTexture)
  const mergedPixels = new Uint8ClampedArray(basePixels.length)

  for (let index = 0; index < basePixels.length; index += 4) {
    const baseRed = basePixels[index] / 255
    const baseGreen = basePixels[index + 1] / 255
    const baseBlue = basePixels[index + 2] / 255
    const baseAlpha = basePixels[index + 3] / 255
    const blendRed = blendPixels[index] / 255
    const blendGreen = blendPixels[index + 1] / 255
    const blendBlue = blendPixels[index + 2] / 255
    const blendAlpha = blendPixels[index + 3] / 255
    const outAlpha = blendAlpha + baseAlpha * (1 - blendAlpha)

    const mergedRed = blendChannel(baseRed, blendRed, mode)
    const mergedGreen = blendChannel(baseGreen, blendGreen, mode)
    const mergedBlue = blendChannel(baseBlue, blendBlue, mode)

    const outRed =
      outAlpha === 0
        ? 0
        : ((1 - blendAlpha) * baseRed * baseAlpha + blendAlpha * mergedRed) /
          outAlpha
    const outGreen =
      outAlpha === 0
        ? 0
        : ((1 - blendAlpha) * baseGreen * baseAlpha +
            blendAlpha * mergedGreen) /
          outAlpha
    const outBlue =
      outAlpha === 0
        ? 0
        : ((1 - blendAlpha) * baseBlue * baseAlpha + blendAlpha * mergedBlue) /
          outAlpha

    mergedPixels[index] = Math.round(clampUnit(outRed) * 255)
    mergedPixels[index + 1] = Math.round(clampUnit(outGreen) * 255)
    mergedPixels[index + 2] = Math.round(clampUnit(outBlue) * 255)
    mergedPixels[index + 3] = Math.round(clampUnit(outAlpha) * 255)
  }

  return {
    name: `${baseTexture.name} (${mode} ${blendTexture.name})`,
    width: baseTexture.width,
    height: baseTexture.height,
    frameSize: baseTexture.frameSize,
    frames: baseTexture.frames,
    sourceFrames: baseTexture.frames,
    pixels: encodeTexturePixels(mergedPixels),
  }
}

export const blendTextures = memoizeTexturePairValueOperation(
  computeBlendTextures
)
