import { FRAMES, SIZE } from "@/lib/utils"

export type SerializedTextureData = {
  name: string
  width: number
  height: number
  frameSize: number
  frames: number
  sourceFrames: number
  pixels: string
}

export const TEXTURE_BLEND_MODE_LABELS = {
  normal: "Normal",
  darken: "Darken",
  lighten: "Lighten",
  multiply: "Multiply",
  divide: "Divide",
  add: "Add",
  subtract: "Subtract",
  screen: "Screen",
  overlay: "Overlay",
} as const

export type TextureBlendMode = keyof typeof TEXTURE_BLEND_MODE_LABELS

export const FLIP_TEXTURE_MODE_LABELS = {
  horizontal: "Flip X",
  vertical: "Flip Y",
  both: "Flip Both",
} as const

export const TILE_TEXTURE_MODE_LABELS = {
  repeat: "Repeat",
  mirror: "Mirror",
} as const

export const TEXTURE_CHANNEL_OUTPUTS = [
  { handleId: "outputRed", label: "Red" },
  { handleId: "outputGreen", label: "Green" },
  { handleId: "outputBlue", label: "Blue" },
  { handleId: "outputAlpha", label: "Alpha" },
] as const

export type FlipTextureMode = keyof typeof FLIP_TEXTURE_MODE_LABELS
export type TileTextureMode = keyof typeof TILE_TEXTURE_MODE_LABELS
export type TextureChannelOutputHandleId =
  (typeof TEXTURE_CHANNEL_OUTPUTS)[number]["handleId"]

function encodeBase64(bytes: Uint8ClampedArray) {
  let binary = ""
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

function decodeBase64(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8ClampedArray(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

export function decodeTexturePixels(texture: SerializedTextureData) {
  return decodeBase64(texture.pixels)
}

export function encodeTexturePixels(pixels: Uint8ClampedArray) {
  return encodeBase64(pixels)
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true })

  if (!context) {
    throw new Error("Could not create a 2D canvas context.")
  }

  return context
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Could not read the uploaded image."))
    }

    image.src = objectUrl
  })
}

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve(image)
    }

    image.onerror = () => {
      reject(new Error("Could not read the preset image."))
    }

    image.src = url
  })
}

function normalizeTextureImage(
  image: HTMLImageElement,
  name: string
): SerializedTextureData {
  if (image.width !== SIZE) {
    throw new Error(`Texture width must be exactly ${SIZE}px.`)
  }

  if (image.height % SIZE !== 0) {
    throw new Error(`Texture height must be a multiple of ${SIZE}px.`)
  }

  const sourceFrames = image.height / SIZE

  if (FRAMES % sourceFrames !== 0) {
    throw new Error(
      `Texture height maps to ${sourceFrames} frame(s), which must divide ${FRAMES}.`
    )
  }

  const sourceCanvas = createCanvas(SIZE, image.height)
  const sourceContext = getCanvasContext(sourceCanvas)
  sourceContext.drawImage(image, 0, 0)

  const sourcePixels = sourceContext.getImageData(0, 0, SIZE, image.height).data
  const frameByteLength = SIZE * SIZE * 4
  const framesPerSourceFrame = FRAMES / sourceFrames
  const normalizedPixels = new Uint8ClampedArray(frameByteLength * FRAMES)

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    const sourceFrameIndex = Math.floor(frameIndex / framesPerSourceFrame)
    const sourceStart = sourceFrameIndex * frameByteLength
    const sourceEnd = sourceStart + frameByteLength
    const targetStart = frameIndex * frameByteLength

    normalizedPixels.set(
      sourcePixels.slice(sourceStart, sourceEnd),
      targetStart
    )
  }

  return {
    name,
    width: SIZE,
    height: SIZE * FRAMES,
    frameSize: SIZE,
    frames: FRAMES,
    sourceFrames,
    pixels: encodeBase64(normalizedPixels),
  }
}

export async function normalizeTextureFile(
  file: File
): Promise<SerializedTextureData> {
  const image = await loadImage(file)
  return normalizeTextureImage(image, file.name)
}

export async function normalizeTextureUrl(
  url: string,
  name: string
): Promise<SerializedTextureData> {
  const image = await loadImageFromUrl(url)
  return normalizeTextureImage(image, name)
}

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

export function translateTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const translatedPixels = new Uint8ClampedArray(
    frameByteLength * texture.frames
  )

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const offsetX = Math.round((xValues[frameIndex] ?? 0) * width)
    const offsetY = Math.round((yValues[frameIndex] ?? 0) * height)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sourceX = (((x - offsetX) % width) + width) % width
        const sourceY = (((y - offsetY) % height) + height) % height
        const sourceIndex = frameStart + (sourceY * width + sourceX) * 4
        const targetIndex = frameStart + (y * width + x) * 4

        translatedPixels[targetIndex] = decodedPixels[sourceIndex]
        translatedPixels[targetIndex + 1] = decodedPixels[sourceIndex + 1]
        translatedPixels[targetIndex + 2] = decodedPixels[sourceIndex + 2]
        translatedPixels[targetIndex + 3] = decodedPixels[sourceIndex + 3]
      }
    }
  }

  return {
    name: `${texture.name} (translated)`,
    width,
    height: texture.height,
    frameSize: height,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(translatedPixels),
  }
}

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

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2

  if (max === min) {
    return {
      hue: 0,
      saturation: 0,
      lightness,
    }
  }

  const delta = max - min
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)

  let hue = 0

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0)
      break
    case g:
      hue = (b - r) / delta + 2
      break
    default:
      hue = (r - g) / delta + 4
      break
  }

  return {
    hue: hue / 6,
    saturation,
    lightness,
  }
}

function hueToRgb(p: number, q: number, t: number) {
  let value = t

  if (value < 0) {
    value += 1
  }

  if (value > 1) {
    value -= 1
  }

  if (value < 1 / 6) {
    return p + (q - p) * 6 * value
  }

  if (value < 1 / 2) {
    return q
  }

  if (value < 2 / 3) {
    return p + (q - p) * (2 / 3 - value) * 6
  }

  return p
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  if (saturation === 0) {
    const value = Math.round(lightness * 255)

    return {
      red: value,
      green: value,
      blue: value,
    }
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q

  return {
    red: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    green: Math.round(hueToRgb(p, q, hue) * 255),
    blue: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  }
}

export function adjustHslTexture(
  texture: SerializedTextureData,
  hueValues: readonly number[],
  saturationValues: readonly number[],
  lightnessValues: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(decodedPixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const hueShift = hueValues[frameIndex] ?? 0
    const saturationShift = saturationValues[frameIndex] ?? 0
    const lightnessShift = lightnessValues[frameIndex] ?? 0

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset
      const red = decodedPixels[pixelIndex]
      const green = decodedPixels[pixelIndex + 1]
      const blue = decodedPixels[pixelIndex + 2]
      const alpha = decodedPixels[pixelIndex + 3]
      const hsl = rgbToHsl(red, green, blue)
      const hue = (((hsl.hue + hueShift) % 1) + 1) % 1
      const saturation = Math.max(
        0,
        Math.min(1, hsl.saturation + saturationShift)
      )
      const lightness = Math.max(0, Math.min(1, hsl.lightness + lightnessShift))
      const rgb = hslToRgb(hue, saturation, lightness)

      adjustedPixels[pixelIndex] = rgb.red
      adjustedPixels[pixelIndex + 1] = rgb.green
      adjustedPixels[pixelIndex + 2] = rgb.blue
      adjustedPixels[pixelIndex + 3] = alpha
    }
  }

  return {
    name: `${texture.name} (hsl)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(adjustedPixels),
  }
}

export function adjustOpacityTexture(
  texture: SerializedTextureData,
  opacityValues: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(decodedPixels)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const opacity = Math.max(0, Math.min(1, opacityValues[frameIndex] ?? 1))

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const alphaIndex = frameStart + offset + 3
      adjustedPixels[alphaIndex] = Math.round(
        decodedPixels[alphaIndex] * opacity
      )
    }
  }

  return {
    name: `${texture.name} (opacity)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(adjustedPixels),
  }
}

export function adjustContrastTexture(
  texture: SerializedTextureData,
  contrastValues: readonly number[]
): SerializedTextureData {
  const decodedPixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(decodedPixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const contrast = Math.max(-1, Math.min(1, contrastValues[frameIndex] ?? 0))
    const contrastFactor = 1 + contrast

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset
      const red = decodedPixels[pixelIndex] / 255
      const green = decodedPixels[pixelIndex + 1] / 255
      const blue = decodedPixels[pixelIndex + 2] / 255

      adjustedPixels[pixelIndex] = Math.round(
        clampUnit((red - 0.5) * contrastFactor + 0.5) * 255
      )
      adjustedPixels[pixelIndex + 1] = Math.round(
        clampUnit((green - 0.5) * contrastFactor + 0.5) * 255
      )
      adjustedPixels[pixelIndex + 2] = Math.round(
        clampUnit((blue - 0.5) * contrastFactor + 0.5) * 255
      )
      adjustedPixels[pixelIndex + 3] = decodedPixels[pixelIndex + 3]
    }
  }

  return {
    name: `${texture.name} (contrast)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(adjustedPixels),
  }
}

export function blurTexture(
  texture: SerializedTextureData,
  blurValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const blurredPixels = new Uint8ClampedArray(sourcePixels.length)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4

  const wrapIndex = (value: number, size: number) =>
    ((value % size) + size) % size

  const buildKernel = (sigma: number) => {
    const radius = Math.max(1, Math.ceil(sigma * 3))
    const weights = new Float32Array(radius * 2 + 1)
    let total = 0

    for (let offset = -radius; offset <= radius; offset += 1) {
      const weight = Math.exp(-(offset * offset) / (2 * sigma * sigma))
      weights[offset + radius] = weight
      total += weight
    }

    for (let index = 0; index < weights.length; index += 1) {
      weights[index] /= total
    }

    return { radius, weights }
  }

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const blurAmount = Math.max(0, Math.min(1, blurValues[frameIndex] ?? 0))
    const sigma = blurAmount * 4

    if (sigma < 0.01) {
      blurredPixels.set(
        sourcePixels.subarray(frameStart, frameStart + frameByteLength),
        frameStart
      )
      continue
    }

    const { radius, weights } = buildKernel(sigma)
    const horizontalPixels = new Float32Array(frameByteLength)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let premultipliedRed = 0
        let premultipliedGreen = 0
        let premultipliedBlue = 0
        let alphaSum = 0

        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const weight = weights[offsetX + radius]
          const sampleX = wrapIndex(x + offsetX, width)
          const sampleIndex = frameStart + (y * width + sampleX) * 4
          const alpha = sourcePixels[sampleIndex + 3] / 255

          premultipliedRed += sourcePixels[sampleIndex] * alpha * weight
          premultipliedGreen += sourcePixels[sampleIndex + 1] * alpha * weight
          premultipliedBlue += sourcePixels[sampleIndex + 2] * alpha * weight
          alphaSum += alpha * weight
        }

        const targetIndex = (y * width + x) * 4

        horizontalPixels[targetIndex] = premultipliedRed
        horizontalPixels[targetIndex + 1] = premultipliedGreen
        horizontalPixels[targetIndex + 2] = premultipliedBlue
        horizontalPixels[targetIndex + 3] = alphaSum
      }
    }

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let premultipliedRed = 0
        let premultipliedGreen = 0
        let premultipliedBlue = 0
        let alphaSum = 0

        for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
          const weight = weights[offsetY + radius]
          const sampleY = wrapIndex(y + offsetY, height)
          const sampleIndex = (sampleY * width + x) * 4

          premultipliedRed += horizontalPixels[sampleIndex] * weight
          premultipliedGreen += horizontalPixels[sampleIndex + 1] * weight
          premultipliedBlue += horizontalPixels[sampleIndex + 2] * weight
          alphaSum += horizontalPixels[sampleIndex + 3] * weight
        }

        const targetIndex = frameStart + (y * width + x) * 4

        if (alphaSum <= 0.0001) {
          blurredPixels[targetIndex] = 0
          blurredPixels[targetIndex + 1] = 0
          blurredPixels[targetIndex + 2] = 0
          blurredPixels[targetIndex + 3] = 0
          continue
        }

        blurredPixels[targetIndex] = Math.round(
          Math.max(0, Math.min(255, premultipliedRed / alphaSum))
        )
        blurredPixels[targetIndex + 1] = Math.round(
          Math.max(0, Math.min(255, premultipliedGreen / alphaSum))
        )
        blurredPixels[targetIndex + 2] = Math.round(
          Math.max(0, Math.min(255, premultipliedBlue / alphaSum))
        )
        blurredPixels[targetIndex + 3] = Math.round(
          Math.max(0, Math.min(1, alphaSum)) * 255
        )
      }
    }
  }

  return {
    name: `${texture.name} (blurred)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(blurredPixels),
  }
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value))
}

function blendChannel(base: number, blend: number, mode: TextureBlendMode) {
  switch (mode) {
    case "normal":
      return blend
    case "darken":
      return Math.min(base, blend)
    case "lighten":
      return Math.max(base, blend)
    case "multiply":
      return base * blend
    case "divide":
      return clampUnit(blend <= 0 ? 1 : base / blend)
    case "add":
      return clampUnit(base + blend)
    case "subtract":
      return clampUnit(base - blend)
    case "screen":
      return 1 - (1 - base) * (1 - blend)
    case "overlay":
      return base < 0.5 ? 2 * base * blend : 1 - 2 * (1 - base) * (1 - blend)
  }
}

export function blendTextures(
  baseTexture: SerializedTextureData,
  blendTexture: SerializedTextureData,
  mode: TextureBlendMode
): SerializedTextureData {
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

export function invertTexture(
  texture: SerializedTextureData
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const invertedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let index = 0; index < sourcePixels.length; index += 4) {
    invertedPixels[index] = 255 - sourcePixels[index]
    invertedPixels[index + 1] = 255 - sourcePixels[index + 1]
    invertedPixels[index + 2] = 255 - sourcePixels[index + 2]
    invertedPixels[index + 3] = sourcePixels[index + 3]
  }

  return {
    name: `${texture.name} (inverted)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(invertedPixels),
  }
}

function normalizeFrameIndex(frameIndex: number, frameCount: number) {
  return ((frameIndex % frameCount) + frameCount) % frameCount
}

export function reverseTexture(
  texture: SerializedTextureData
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const reversedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const sourceFrameIndex = texture.frames - 1 - frameIndex
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    reversedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return {
    name: `${texture.name} (reversed)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(reversedPixels),
  }
}

export function speedTexture(
  texture: SerializedTextureData,
  speedValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const retimedPixels = new Uint8ClampedArray(sourcePixels.length)
  let playbackPosition = 0

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const sourceFrameIndex = normalizeFrameIndex(
      Math.floor(playbackPosition),
      texture.frames
    )
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    retimedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )

    playbackPosition += speedValues[frameIndex] ?? 1
  }

  return {
    name: `${texture.name} (retimed)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(retimedPixels),
  }
}

export function holdTexture(
  texture: SerializedTextureData,
  holdValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const heldPixels = new Uint8ClampedArray(sourcePixels.length)
  let sourceFrameCursor = 0
  let outputFrameIndex = 0

  while (outputFrameIndex < texture.frames) {
    const holdLength = Math.max(
      1,
      Math.round(holdValues[sourceFrameCursor] ?? 1)
    )
    const sourceFrameIndex = normalizeFrameIndex(
      sourceFrameCursor,
      texture.frames
    )
    const sourceStart = sourceFrameIndex * frameByteLength

    for (
      let repeatIndex = 0;
      repeatIndex < holdLength && outputFrameIndex < texture.frames;
      repeatIndex += 1
    ) {
      const targetStart = outputFrameIndex * frameByteLength

      heldPixels.set(
        sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
        targetStart
      )

      outputFrameIndex += 1
    }

    sourceFrameCursor += 1
  }

  return {
    name: `${texture.name} (held)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(heldPixels),
  }
}

export function phaseTexture(
  texture: SerializedTextureData,
  frameOffsets: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const phasedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameOffset = Math.round(frameOffsets[frameIndex] ?? 0)
    const sourceFrameIndex = normalizeFrameIndex(
      frameIndex + frameOffset,
      texture.frames
    )
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    phasedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return {
    name: `${texture.name} (phased)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(phasedPixels),
  }
}

export function selectTextureFrames(
  texture: SerializedTextureData,
  frameIndices: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const selectedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const selectedFrame = Math.round(frameIndices[frameIndex] ?? 0)
    const sourceFrameIndex = normalizeFrameIndex(selectedFrame, texture.frames)
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    selectedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return {
    name: `${texture.name} (selected)`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames: texture.frames,
    pixels: encodeTexturePixels(selectedPixels),
  }
}

function createDerivedTexture(
  texture: SerializedTextureData,
  nameSuffix: string,
  pixels: Uint8ClampedArray,
  sourceFrames = texture.frames
): SerializedTextureData {
  return {
    name: `${texture.name} (${nameSuffix})`,
    width: texture.width,
    height: texture.height,
    frameSize: texture.frameSize,
    frames: texture.frames,
    sourceFrames,
    pixels: encodeTexturePixels(pixels),
  }
}

function wrapRepeatIndex(value: number, size: number) {
  return ((value % size) + size) % size
}

function wrapMirrorIndex(value: number, size: number) {
  if (size <= 1) {
    return 0
  }

  const period = size * 2
  const wrapped = ((value % period) + period) % period

  return wrapped < size ? wrapped : period - wrapped - 1
}

function samplePixel(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  frameStart: number,
  sourceX: number,
  sourceY: number,
  wrapMode: TileTextureMode = "repeat"
) {
  const roundedX = Math.round(sourceX)
  const roundedY = Math.round(sourceY)
  const resolvedX =
    wrapMode === "mirror"
      ? wrapMirrorIndex(roundedX, width)
      : wrapRepeatIndex(roundedX, width)
  const resolvedY =
    wrapMode === "mirror"
      ? wrapMirrorIndex(roundedY, height)
      : wrapRepeatIndex(roundedY, height)
  const sourceIndex = frameStart + (resolvedY * width + resolvedX) * 4

  return {
    red: pixels[sourceIndex],
    green: pixels[sourceIndex + 1],
    blue: pixels[sourceIndex + 2],
    alpha: pixels[sourceIndex + 3],
  }
}

function sampleClampedPixel(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  frameStart: number,
  sourceX: number,
  sourceY: number
) {
  const resolvedX = Math.max(0, Math.min(width - 1, Math.round(sourceX)))
  const resolvedY = Math.max(0, Math.min(height - 1, Math.round(sourceY)))
  const sourceIndex = frameStart + (resolvedY * width + resolvedX) * 4

  return {
    red: pixels[sourceIndex],
    green: pixels[sourceIndex + 1],
    blue: pixels[sourceIndex + 2],
    alpha: pixels[sourceIndex + 3],
  }
}

function getChannelTextureValue(
  texture: SerializedTextureData,
  pixels: Uint8ClampedArray,
  index: number
) {
  const red = pixels[index] / 255
  const green = pixels[index + 1] / 255
  const blue = pixels[index + 2] / 255
  const alpha = pixels[index + 3] / 255
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue

  if (texture.pixels.length === 0) {
    return 0
  }

  return clampUnit(luminance * alpha + luminance * (1 - alpha))
}

function validateMatchingTextureDimensions(textures: SerializedTextureData[]) {
  const [baseTexture, ...rest] = textures

  if (!baseTexture) {
    return
  }

  for (const texture of rest) {
    if (
      texture.width !== baseTexture.width ||
      texture.frameSize !== baseTexture.frameSize ||
      texture.frames !== baseTexture.frames
    ) {
      throw new Error(
        "Textures must have matching dimensions and frame counts."
      )
    }
  }
}

export function skewTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const skewedPixels = new Uint8ClampedArray(sourcePixels.length)
  const centerX = width / 2
  const centerY = height / 2

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const skewX = Math.max(-1, Math.min(1, xValues[frameIndex] ?? 0))
    const skewY = Math.max(-1, Math.min(1, yValues[frameIndex] ?? 0))
    const determinant = 1 - skewX * skewY
    const safeDeterminant =
      Math.abs(determinant) < 0.05
        ? 0.05 * (determinant < 0 ? -1 : 1)
        : determinant

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offsetX = x + 0.5 - centerX
        const offsetY = y + 0.5 - centerY
        const sourceOffsetX = (offsetX - skewX * offsetY) / safeDeterminant
        const sourceOffsetY = (offsetY - skewY * offsetX) / safeDeterminant
        const sample = samplePixel(
          sourcePixels,
          width,
          height,
          frameStart,
          sourceOffsetX + centerX - 0.5,
          sourceOffsetY + centerY - 0.5
        )
        const targetIndex = frameStart + (y * width + x) * 4

        skewedPixels[targetIndex] = sample.red
        skewedPixels[targetIndex + 1] = sample.green
        skewedPixels[targetIndex + 2] = sample.blue
        skewedPixels[targetIndex + 3] = sample.alpha
      }
    }
  }

  return createDerivedTexture(texture, "skewed", skewedPixels)
}

export function flipTexture(
  texture: SerializedTextureData,
  mode: FlipTextureMode
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const flippedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sourceX =
          mode === "horizontal" || mode === "both" ? width - 1 - x : x
        const sourceY =
          mode === "vertical" || mode === "both" ? height - 1 - y : y
        const sourceIndex = frameStart + (sourceY * width + sourceX) * 4
        const targetIndex = frameStart + (y * width + x) * 4

        flippedPixels[targetIndex] = sourcePixels[sourceIndex]
        flippedPixels[targetIndex + 1] = sourcePixels[sourceIndex + 1]
        flippedPixels[targetIndex + 2] = sourcePixels[sourceIndex + 2]
        flippedPixels[targetIndex + 3] = sourcePixels[sourceIndex + 3]
      }
    }
  }

  return createDerivedTexture(
    texture,
    FLIP_TEXTURE_MODE_LABELS[mode],
    flippedPixels
  )
}

export function cropTexture(
  texture: SerializedTextureData,
  xValues: readonly number[],
  yValues: readonly number[],
  widthValues: readonly number[],
  heightValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const width = texture.width
  const height = texture.frameSize
  const frameByteLength = width * height * 4
  const croppedPixels = new Uint8ClampedArray(sourcePixels.length)
  const minWidth = 1 / width
  const minHeight = 1 / height

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const cropWidth = Math.max(
      minWidth,
      Math.min(1, widthValues[frameIndex] ?? 1)
    )
    const cropHeight = Math.max(
      minHeight,
      Math.min(1, heightValues[frameIndex] ?? 1)
    )
    const originX = Math.max(
      0,
      Math.min(1 - cropWidth, xValues[frameIndex] ?? 0)
    )
    const originY = Math.max(
      0,
      Math.min(1 - cropHeight, yValues[frameIndex] ?? 0)
    )

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const normalizedX = (x + 0.5) / width
        const normalizedY = (y + 0.5) / height
        const sample = sampleClampedPixel(
          sourcePixels,
          width,
          height,
          frameStart,
          (originX + normalizedX * cropWidth) * width - 0.5,
          (originY + normalizedY * cropHeight) * height - 0.5
        )
        const targetIndex = frameStart + (y * width + x) * 4

        croppedPixels[targetIndex] = sample.red
        croppedPixels[targetIndex + 1] = sample.green
        croppedPixels[targetIndex + 2] = sample.blue
        croppedPixels[targetIndex + 3] = sample.alpha
      }
    }
  }

  return createDerivedTexture(texture, "cropped", croppedPixels)
}

function mirrorUnit(value: number) {
  const wrapped = ((value % 2) + 2) % 2

  return wrapped <= 1 ? wrapped : 2 - wrapped
}

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

export function thresholdTexture(
  texture: SerializedTextureData,
  thresholdValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const thresholdedPixels = new Uint8ClampedArray(sourcePixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const threshold = clampUnit(thresholdValues[frameIndex] ?? 0.5)

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset
      const red = sourcePixels[pixelIndex] / 255
      const green = sourcePixels[pixelIndex + 1] / 255
      const blue = sourcePixels[pixelIndex + 2] / 255
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
      const value = luminance >= threshold ? 255 : 0

      thresholdedPixels[pixelIndex] = value
      thresholdedPixels[pixelIndex + 1] = value
      thresholdedPixels[pixelIndex + 2] = value
      thresholdedPixels[pixelIndex + 3] = sourcePixels[pixelIndex + 3]
    }
  }

  return createDerivedTexture(texture, "threshold", thresholdedPixels)
}

export function adjustBrightnessTexture(
  texture: SerializedTextureData,
  brightnessValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(sourcePixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const brightness = Math.max(
      -1,
      Math.min(1, brightnessValues[frameIndex] ?? 0)
    )

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset

      adjustedPixels[pixelIndex] = Math.round(
        clampUnit(sourcePixels[pixelIndex] / 255 + brightness) * 255
      )
      adjustedPixels[pixelIndex + 1] = Math.round(
        clampUnit(sourcePixels[pixelIndex + 1] / 255 + brightness) * 255
      )
      adjustedPixels[pixelIndex + 2] = Math.round(
        clampUnit(sourcePixels[pixelIndex + 2] / 255 + brightness) * 255
      )
      adjustedPixels[pixelIndex + 3] = sourcePixels[pixelIndex + 3]
    }
  }

  return createDerivedTexture(texture, "brightness", adjustedPixels)
}

export function adjustLevelsTexture(
  texture: SerializedTextureData,
  blackValues: readonly number[],
  whiteValues: readonly number[],
  gammaValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const adjustedPixels = new Uint8ClampedArray(sourcePixels.length)
  const frameByteLength = texture.width * texture.frameSize * 4

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const frameStart = frameIndex * frameByteLength
    const blackPoint = clampUnit(blackValues[frameIndex] ?? 0)
    const whitePoint = Math.max(
      blackPoint + 0.01,
      clampUnit(whiteValues[frameIndex] ?? 1)
    )
    const gamma = Math.max(0.1, Math.min(4, gammaValues[frameIndex] ?? 1))

    for (let offset = 0; offset < frameByteLength; offset += 4) {
      const pixelIndex = frameStart + offset

      for (let channelOffset = 0; channelOffset < 3; channelOffset += 1) {
        const channelValue = sourcePixels[pixelIndex + channelOffset] / 255
        const normalized = clampUnit(
          (channelValue - blackPoint) / (whitePoint - blackPoint)
        )

        adjustedPixels[pixelIndex + channelOffset] = Math.round(
          clampUnit(normalized ** (1 / gamma)) * 255
        )
      }

      adjustedPixels[pixelIndex + 3] = sourcePixels[pixelIndex + 3]
    }
  }

  return createDerivedTexture(texture, "levels", adjustedPixels)
}

export function grayscaleTexture(
  texture: SerializedTextureData
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const grayscalePixels = new Uint8ClampedArray(sourcePixels.length)

  for (let index = 0; index < sourcePixels.length; index += 4) {
    const luminance = Math.round(
      0.2126 * sourcePixels[index] +
        0.7152 * sourcePixels[index + 1] +
        0.0722 * sourcePixels[index + 2]
    )

    grayscalePixels[index] = luminance
    grayscalePixels[index + 1] = luminance
    grayscalePixels[index + 2] = luminance
    grayscalePixels[index + 3] = sourcePixels[index + 3]
  }

  return createDerivedTexture(texture, "grayscale", grayscalePixels)
}

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

export function pingPongTexture(
  texture: SerializedTextureData
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const pingPongPixels = new Uint8ClampedArray(sourcePixels.length)
  const baseFrameCount = Math.max(
    1,
    Math.min(texture.frames, texture.sourceFrames || texture.frames)
  )
  const sequenceLength = baseFrameCount <= 1 ? 1 : baseFrameCount * 2 - 2

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const sequenceIndex = frameIndex % sequenceLength
    const sourceFrameIndex =
      sequenceIndex < baseFrameCount
        ? sequenceIndex
        : sequenceLength - sequenceIndex
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    pingPongPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return createDerivedTexture(
    texture,
    "ping-pong",
    pingPongPixels,
    baseFrameCount
  )
}

export function trimTexture(
  texture: SerializedTextureData,
  startValues: readonly number[],
  lengthValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const trimmedPixels = new Uint8ClampedArray(sourcePixels.length)
  const baseFrameCount = Math.max(
    1,
    Math.min(texture.frames, texture.sourceFrames || texture.frames)
  )

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const start = normalizeFrameIndex(
      Math.round(startValues[frameIndex] ?? 0),
      baseFrameCount
    )
    const length = Math.max(
      1,
      Math.min(
        baseFrameCount,
        Math.round(lengthValues[frameIndex] ?? baseFrameCount)
      )
    )
    const sourceFrameIndex = (start + (frameIndex % length)) % baseFrameCount
    const sourceStart = sourceFrameIndex * frameByteLength
    const targetStart = frameIndex * frameByteLength

    trimmedPixels.set(
      sourcePixels.subarray(sourceStart, sourceStart + frameByteLength),
      targetStart
    )
  }

  return createDerivedTexture(texture, "trimmed", trimmedPixels, baseFrameCount)
}

export function frameBlendTexture(
  texture: SerializedTextureData,
  blendValues: readonly number[]
): SerializedTextureData {
  const sourcePixels = decodeTexturePixels(texture)
  const frameByteLength = texture.width * texture.frameSize * 4
  const blendedPixels = new Uint8ClampedArray(sourcePixels.length)

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    const nextFrameIndex = normalizeFrameIndex(frameIndex + 1, texture.frames)
    const blendAmount = clampUnit(blendValues[frameIndex] ?? 0)
    const frameStart = frameIndex * frameByteLength
    const nextFrameStart = nextFrameIndex * frameByteLength

    for (let offset = 0; offset < frameByteLength; offset += 1) {
      blendedPixels[frameStart + offset] = Math.round(
        sourcePixels[frameStart + offset] * (1 - blendAmount) +
          sourcePixels[nextFrameStart + offset] * blendAmount
      )
    }
  }

  return createDerivedTexture(texture, "frame blend", blendedPixels)
}
