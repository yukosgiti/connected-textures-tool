import { FRAMES, SIZE } from "@/lib/utils"

import {
  type SerializedTextureData,
  FLIP_TEXTURE_MODE_LABELS,
  type TextureBlendMode,
  TILE_TEXTURE_MODE_LABELS,
  type TileTextureMode,
} from "./types"

export function encodeBase64(bytes: Uint8ClampedArray) {
  let binary = ""
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export function decodeBase64(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8ClampedArray(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

export function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true })

  if (!context) {
    throw new Error("Could not create a 2D canvas context.")
  }

  return context
}

export function loadImage(file: File) {
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

export function loadImageFromUrl(url: string) {
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

export function normalizeTextureImage(
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

export function rgbToHsl(red: number, green: number, blue: number) {
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

export function hueToRgb(p: number, q: number, t: number) {
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

export function hslToRgb(hue: number, saturation: number, lightness: number) {
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

export function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function blendChannel(
  base: number,
  blend: number,
  mode: TextureBlendMode
) {
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

export function normalizeFrameIndex(frameIndex: number, frameCount: number) {
  return ((frameIndex % frameCount) + frameCount) % frameCount
}

export function createDerivedTexture(
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
    pixels: encodeBase64(pixels),
  }
}

export function memoizeTextureFrameValueOperation(
  operation: (
    texture: SerializedTextureData,
    values: readonly number[]
  ) => SerializedTextureData
) {
  const cache = new WeakMap<
    SerializedTextureData,
    WeakMap<readonly number[], SerializedTextureData>
  >()

  return (texture: SerializedTextureData, values: readonly number[]) => {
    let textureCache = cache.get(texture)

    if (!textureCache) {
      textureCache = new WeakMap()
      cache.set(texture, textureCache)
    }

    const cached = textureCache.get(values)

    if (cached) {
      return cached
    }

    const result = operation(texture, values)
    textureCache.set(values, result)
    return result
  }
}

export function memoizeTextureFramePairOperation(
  operation: (
    texture: SerializedTextureData,
    firstValues: readonly number[],
    secondValues: readonly number[]
  ) => SerializedTextureData
) {
  const cache = new WeakMap<
    SerializedTextureData,
    WeakMap<readonly number[], WeakMap<readonly number[], SerializedTextureData>>
  >()

  return (
    texture: SerializedTextureData,
    firstValues: readonly number[],
    secondValues: readonly number[]
  ) => {
    let textureCache = cache.get(texture)

    if (!textureCache) {
      textureCache = new WeakMap()
      cache.set(texture, textureCache)
    }

    let firstValuesCache = textureCache.get(firstValues)

    if (!firstValuesCache) {
      firstValuesCache = new WeakMap()
      textureCache.set(firstValues, firstValuesCache)
    }

    const cached = firstValuesCache.get(secondValues)

    if (cached) {
      return cached
    }

    const result = operation(texture, firstValues, secondValues)
    firstValuesCache.set(secondValues, result)
    return result
  }
}

export function memoizeTexturePairOperation(
  operation: (
    texture: SerializedTextureData,
    otherTexture: SerializedTextureData
  ) => SerializedTextureData
) {
  const cache = new WeakMap<
    SerializedTextureData,
    WeakMap<SerializedTextureData, SerializedTextureData>
  >()

  return (
    texture: SerializedTextureData,
    otherTexture: SerializedTextureData
  ) => {
    let textureCache = cache.get(texture)

    if (!textureCache) {
      textureCache = new WeakMap()
      cache.set(texture, textureCache)
    }

    const cached = textureCache.get(otherTexture)

    if (cached) {
      return cached
    }

    const result = operation(texture, otherTexture)
    textureCache.set(otherTexture, result)
    return result
  }
}

export function memoizeTexturePairValueOperation<TKey>(
  operation: (
    texture: SerializedTextureData,
    otherTexture: SerializedTextureData,
    value: TKey
  ) => SerializedTextureData
) {
  const cache = new WeakMap<
    SerializedTextureData,
    WeakMap<SerializedTextureData, Map<TKey, SerializedTextureData>>
  >()

  return (
    texture: SerializedTextureData,
    otherTexture: SerializedTextureData,
    value: TKey
  ) => {
    let textureCache = cache.get(texture)

    if (!textureCache) {
      textureCache = new WeakMap()
      cache.set(texture, textureCache)
    }

    let otherTextureCache = textureCache.get(otherTexture)

    if (!otherTextureCache) {
      otherTextureCache = new Map()
      textureCache.set(otherTexture, otherTextureCache)
    }

    const cached = otherTextureCache.get(value)

    if (cached) {
      return cached
    }

    const result = operation(texture, otherTexture, value)
    otherTextureCache.set(value, result)
    return result
  }
}

export function wrapRepeatIndex(value: number, size: number) {
  return ((value % size) + size) % size
}

export function wrapMirrorIndex(value: number, size: number) {
  if (size <= 1) {
    return 0
  }

  const period = size * 2
  const wrapped = ((value % period) + period) % period

  return wrapped < size ? wrapped : period - wrapped - 1
}

export function samplePixel(
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

export function sampleClampedPixel(
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

export function mirrorUnit(value: number) {
  const wrapped = ((value % 2) + 2) % 2

  return wrapped <= 1 ? wrapped : 2 - wrapped
}

export function getChannelTextureValue(
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

export function validateMatchingTextureDimensions(
  textures: SerializedTextureData[]
) {
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

export { FLIP_TEXTURE_MODE_LABELS, TILE_TEXTURE_MODE_LABELS }
