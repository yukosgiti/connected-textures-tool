import { encodeTexturePixels, type SerializedTextureData } from "@/lib/texture"
import { FRAMES, SIZE } from "@/lib/utils"

export const RANDOM_TEXTURE_MODE_LABELS = {
  grayscale: "Grayscale Noise",
  rgb: "RGB Noise",
  binary: "Binary Noise",
  pastel: "Pastel Noise",
} as const

export const WAVE_TEXTURE_KIND_LABELS = {
  sine: "Sine Wave",
  square: "Square Wave",
} as const

export type RandomTextureMode = keyof typeof RANDOM_TEXTURE_MODE_LABELS
export type WaveTextureKind = keyof typeof WAVE_TEXTURE_KIND_LABELS

export type WaveTextureConfig = {
  color: string
  cycles: readonly number[]
  amplitude: readonly number[]
  thickness: readonly number[]
  phase: readonly number[]
}

export type LinearGradientTextureConfig = {
  startColor: string
  endColor: string
  startPercentage: readonly number[]
  endPercentage: readonly number[]
  angle: readonly number[]
}

export type CheckerboardTextureConfig = {
  colorA: string
  colorB: string
  scale: readonly number[]
}

export type RadialGradientTextureConfig = {
  innerColor: string
  outerColor: string
  radius: readonly number[]
}

const HEX_COLOR_REGEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
const TAU = Math.PI * 2

type Point = {
  x: number
  y: number
}

type Segment = {
  from: Point
  to: Point
}

function createSerializedTexture(
  name: string,
  pixels: Uint8ClampedArray,
  sourceFrames: number
) {
  return {
    name,
    width: SIZE,
    height: SIZE * FRAMES,
    frameSize: SIZE,
    frames: FRAMES,
    sourceFrames,
    pixels: encodeTexturePixels(pixels),
  } satisfies SerializedTextureData
}

function createMulberry32(seed: number) {
  let value = seed >>> 0

  return () => {
    value += 0x6d2b79f5
    let result = Math.imul(value ^ (value >>> 15), value | 1)

    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function parseHexColor(hexColor: string) {
  const normalizedHex = normalizeHexColor(hexColor)

  if (!normalizedHex) {
    throw new Error("Use a valid hex color.")
  }

  const red = Number.parseInt(normalizedHex.slice(1, 3), 16)
  const green = Number.parseInt(normalizedHex.slice(3, 5), 16)
  const blue = Number.parseInt(normalizedHex.slice(5, 7), 16)

  return { red, green, blue }
}

export function normalizeHexColor(value: string) {
  const match = value.trim().match(HEX_COLOR_REGEX)

  if (!match) {
    return null
  }

  let hex = match[1].toLowerCase()

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")
  }

  return `#${hex}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function lerpChannel(start: number, end: number, amount: number) {
  return Math.round(start + (end - start) * amount)
}

function createTextureFromFrame(name: string, framePixels: Uint8ClampedArray) {
  const pixels = new Uint8ClampedArray(framePixels.length * FRAMES)

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    pixels.set(framePixels, frameIndex * framePixels.length)
  }

  return createSerializedTexture(name, pixels, 1)
}

function getFrameValue(
  values: readonly number[],
  frameIndex: number,
  fallback: number
) {
  return values[frameIndex] ?? values[0] ?? fallback
}

function hasAnimatedValues(values: readonly number[]) {
  if (values.length <= 1) {
    return false
  }

  const firstValue = values[0]

  return values.some((value) => value !== firstValue)
}

function renderWaveFrame(
  kind: WaveTextureKind,
  red: number,
  green: number,
  blue: number,
  cycles: number,
  amplitude: number,
  thickness: number,
  phase: number
) {
  const safeCycles = clamp(cycles, 0.25, 8)
  const safeAmplitude = clamp(amplitude, 0, (SIZE - 1) / 2)
  const safeThickness = clamp(thickness, 1, SIZE)
  const safePhase = clamp(phase, -1, 1)
  const radius = Math.max(safeThickness / 2, 0.5)
  const segments = createWaveSegments(
    kind,
    safeCycles,
    safeAmplitude,
    safePhase
  )
  const framePixels = new Uint8ClampedArray(SIZE * SIZE * 4)

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let minDistance = Number.POSITIVE_INFINITY

      for (const segment of segments) {
        minDistance = Math.min(minDistance, getDistanceToSegment(x, y, segment))
      }

      if (minDistance > radius) {
        continue
      }

      const pixelOffset = (y * SIZE + x) * 4
      framePixels[pixelOffset] = red
      framePixels[pixelOffset + 1] = green
      framePixels[pixelOffset + 2] = blue
      framePixels[pixelOffset + 3] = 255
    }
  }

  return framePixels
}

function getWaveY(
  kind: WaveTextureKind,
  x: number,
  cycles: number,
  amplitude: number,
  phase: number
) {
  const normalizedX = SIZE <= 1 ? 0 : x / (SIZE - 1)
  const angle = phase * TAU + normalizedX * cycles * TAU
  const signal =
    kind === "square" ? (Math.sin(angle) >= 0 ? 1 : -1) : Math.sin(angle)
  const centerY = (SIZE - 1) / 2

  return centerY - signal * amplitude
}

function createWaveSegments(
  kind: WaveTextureKind,
  cycles: number,
  amplitude: number,
  phase: number
) {
  if (kind === "square") {
    const segments: Segment[] = []
    let currentY = getWaveY(kind, 0, cycles, amplitude, phase)

    for (let x = 0; x < SIZE - 1; x += 1) {
      const nextY = getWaveY(kind, x + 1, cycles, amplitude, phase)

      segments.push({
        from: { x, y: currentY },
        to: { x: x + 1, y: currentY },
      })

      if (Math.abs(nextY - currentY) > Number.EPSILON) {
        segments.push({
          from: { x: x + 1, y: currentY },
          to: { x: x + 1, y: nextY },
        })
      }

      currentY = nextY
    }

    return segments
  }

  return Array.from({ length: SIZE - 1 }, (_, index) => ({
    from: { x: index, y: getWaveY(kind, index, cycles, amplitude, phase) },
    to: {
      x: index + 1,
      y: getWaveY(kind, index + 1, cycles, amplitude, phase),
    },
  }))
}

function getDistanceToSegment(x: number, y: number, segment: Segment) {
  const deltaX = segment.to.x - segment.from.x
  const deltaY = segment.to.y - segment.from.y
  const lengthSquared = deltaX * deltaX + deltaY * deltaY

  if (lengthSquared === 0) {
    return Math.hypot(x - segment.from.x, y - segment.from.y)
  }

  const projection =
    ((x - segment.from.x) * deltaX + (y - segment.from.y) * deltaY) /
    lengthSquared
  const clampedProjection = clamp(projection, 0, 1)
  const closestX = segment.from.x + clampedProjection * deltaX
  const closestY = segment.from.y + clampedProjection * deltaY

  return Math.hypot(x - closestX, y - closestY)
}

export function createRandomTextureSeed() {
  return Math.floor(Math.random() * 1_000_000_000)
}

export function createColorTexture(hexColor: string) {
  const { red, green, blue } = parseHexColor(hexColor)
  const frameByteLength = SIZE * SIZE * 4
  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES)

  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = red
    pixels[index + 1] = green
    pixels[index + 2] = blue
    pixels[index + 3] = 255
  }

  return createSerializedTexture(
    `Color Texture ${hexColor.toUpperCase()}`,
    pixels,
    1
  )
}

export function createWaveTexture(
  kind: WaveTextureKind,
  config: WaveTextureConfig
) {
  const { red, green, blue } = parseHexColor(config.color)
  const isAnimated =
    hasAnimatedValues(config.cycles) ||
    hasAnimatedValues(config.amplitude) ||
    hasAnimatedValues(config.thickness) ||
    hasAnimatedValues(config.phase)

  if (!isAnimated) {
    const framePixels = renderWaveFrame(
      kind,
      red,
      green,
      blue,
      getFrameValue(config.cycles, 0, 1),
      getFrameValue(config.amplitude, 0, 5),
      getFrameValue(config.thickness, 0, 2),
      getFrameValue(config.phase, 0, 0)
    )

    return createTextureFromFrame(
      `${WAVE_TEXTURE_KIND_LABELS[kind]} Texture`,
      framePixels
    )
  }

  const frameByteLength = SIZE * SIZE * 4
  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES)

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    const framePixels = renderWaveFrame(
      kind,
      red,
      green,
      blue,
      getFrameValue(config.cycles, frameIndex, 1),
      getFrameValue(config.amplitude, frameIndex, 5),
      getFrameValue(config.thickness, frameIndex, 2),
      getFrameValue(config.phase, frameIndex, 0)
    )

    pixels.set(framePixels, frameIndex * frameByteLength)
  }

  return createSerializedTexture(
    `${WAVE_TEXTURE_KIND_LABELS[kind]} Texture`,
    pixels,
    FRAMES
  )
}

function renderRandomFrame(
  mode: RandomTextureMode,
  basePixels: Uint8ClampedArray,
  ratio: number
) {
  const framePixels = new Uint8ClampedArray(basePixels.length)
  const safeRatio = clamp(ratio, 0, 1)

  for (let index = 0; index < basePixels.length; index += 4) {
    let red = 0
    let green = 0
    let blue = 0

    switch (mode) {
      case "binary": {
        const value = basePixels[index] < safeRatio * 256 ? 255 : 0
        red = value
        green = value
        blue = value
        break
      }
      case "grayscale":
      case "rgb":
      case "pastel":
        red = Math.round(basePixels[index] * safeRatio)
        green = Math.round(basePixels[index + 1] * safeRatio)
        blue = Math.round(basePixels[index + 2] * safeRatio)
        break
    }

    framePixels[index] = red
    framePixels[index + 1] = green
    framePixels[index + 2] = blue
    framePixels[index + 3] = 255
  }

  return framePixels
}

export function createRandomTexture(
  mode: RandomTextureMode,
  seed: number,
  ratioValues: readonly number[]
) {
  const frameByteLength = SIZE * SIZE * 4
  const basePixels = new Uint8ClampedArray(frameByteLength)
  const random = createMulberry32(seed)

  for (let index = 0; index < basePixels.length; index += 4) {
    let red = 0
    let green = 0
    let blue = 0

    switch (mode) {
      case "grayscale": {
        const value = Math.round(random() * 255)
        red = value
        green = value
        blue = value
        break
      }
      case "rgb":
        red = Math.round(random() * 255)
        green = Math.round(random() * 255)
        blue = Math.round(random() * 255)
        break
      case "binary": {
        const value = Math.floor(random() * 256)
        red = value
        green = value
        blue = value
        break
      }
      case "pastel":
        red = 128 + Math.round(random() * 127)
        green = 128 + Math.round(random() * 127)
        blue = 128 + Math.round(random() * 127)
        break
    }

    basePixels[index] = red
    basePixels[index + 1] = green
    basePixels[index + 2] = blue
    basePixels[index + 3] = 255
  }

  const isAnimated = hasAnimatedValues(ratioValues)

  if (!isAnimated) {
    const framePixels = renderRandomFrame(
      mode,
      basePixels,
      getFrameValue(ratioValues, 0, 1)
    )

    return createTextureFromFrame(
      `Random Texture ${RANDOM_TEXTURE_MODE_LABELS[mode]}`,
      framePixels
    )
  }

  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES)

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    const framePixels = renderRandomFrame(
      mode,
      basePixels,
      getFrameValue(ratioValues, frameIndex, 1)
    )

    pixels.set(framePixels, frameIndex * frameByteLength)
  }

  return createSerializedTexture(
    `Random Texture ${RANDOM_TEXTURE_MODE_LABELS[mode]}`,
    pixels,
    FRAMES
  )
}

function renderLinearGradientFrame(
  startColor: ReturnType<typeof parseHexColor>,
  endColor: ReturnType<typeof parseHexColor>,
  startPercentage: number,
  endPercentage: number,
  angleTurns: number
) {
  const radians = angleTurns * TAU
  const directionX = Math.cos(radians)
  const directionY = Math.sin(radians)
  const framePixels = new Uint8ClampedArray(SIZE * SIZE * 4)
  const center = (SIZE - 1) / 2
  const maxDistance = Math.max(center, 1)
  const safeStart = clamp(startPercentage, 0, 100) / 100
  const safeEnd = clamp(endPercentage, safeStart * 100, 100) / 100
  const gradientSpan = Math.max(safeEnd - safeStart, Number.EPSILON)

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const normalizedX = (x - center) / maxDistance
      const normalizedY = (y - center) / maxDistance
      const gradientAmount = clamp(
        (normalizedX * directionX + normalizedY * directionY + 1) / 2,
        0,
        1
      )
      const amount = clamp(
        (gradientAmount - safeStart) / gradientSpan,
        0,
        1
      )
      const pixelIndex = (y * SIZE + x) * 4

      framePixels[pixelIndex] = lerpChannel(
        startColor.red,
        endColor.red,
        amount
      )
      framePixels[pixelIndex + 1] = lerpChannel(
        startColor.green,
        endColor.green,
        amount
      )
      framePixels[pixelIndex + 2] = lerpChannel(
        startColor.blue,
        endColor.blue,
        amount
      )
      framePixels[pixelIndex + 3] = 255
    }
  }

  return framePixels
}

export function createLinearGradientTexture(
  config: LinearGradientTextureConfig
) {
  const startColor = parseHexColor(config.startColor)
  const endColor = parseHexColor(config.endColor)
  const isAnimated =
    hasAnimatedValues(config.angle) ||
    hasAnimatedValues(config.startPercentage) ||
    hasAnimatedValues(config.endPercentage)

  if (!isAnimated) {
    return createTextureFromFrame(
      "Linear Gradient Texture",
      renderLinearGradientFrame(
        startColor,
        endColor,
        getFrameValue(config.startPercentage, 0, 0),
        getFrameValue(config.endPercentage, 0, 100),
        getFrameValue(config.angle, 0, 0)
      )
    )
  }

  const frameByteLength = SIZE * SIZE * 4
  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES)

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    pixels.set(
      renderLinearGradientFrame(
        startColor,
        endColor,
        getFrameValue(config.startPercentage, frameIndex, 0),
        getFrameValue(config.endPercentage, frameIndex, 100),
        getFrameValue(config.angle, frameIndex, 0)
      ),
      frameIndex * frameByteLength
    )
  }

  return createSerializedTexture("Linear Gradient Texture", pixels, FRAMES)
}

function renderCheckerboardFrame(
  colorA: ReturnType<typeof parseHexColor>,
  colorB: ReturnType<typeof parseHexColor>,
  scale: number
) {
  const safeScale = clamp(scale, 1, 8)
  const cellSize = SIZE / safeScale
  const framePixels = new Uint8ClampedArray(SIZE * SIZE * 4)

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const useFirstColor =
        (Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2 === 0
      const color = useFirstColor ? colorA : colorB
      const pixelIndex = (y * SIZE + x) * 4

      framePixels[pixelIndex] = color.red
      framePixels[pixelIndex + 1] = color.green
      framePixels[pixelIndex + 2] = color.blue
      framePixels[pixelIndex + 3] = 255
    }
  }

  return framePixels
}

export function createCheckerboardTexture(config: CheckerboardTextureConfig) {
  const colorA = parseHexColor(config.colorA)
  const colorB = parseHexColor(config.colorB)
  const isAnimated = hasAnimatedValues(config.scale)

  if (!isAnimated) {
    return createTextureFromFrame(
      "Checkerboard Texture",
      renderCheckerboardFrame(colorA, colorB, getFrameValue(config.scale, 0, 4))
    )
  }

  const frameByteLength = SIZE * SIZE * 4
  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES)

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    pixels.set(
      renderCheckerboardFrame(
        colorA,
        colorB,
        getFrameValue(config.scale, frameIndex, 4)
      ),
      frameIndex * frameByteLength
    )
  }

  return createSerializedTexture("Checkerboard Texture", pixels, FRAMES)
}

function renderRadialGradientFrame(
  innerColor: ReturnType<typeof parseHexColor>,
  outerColor: ReturnType<typeof parseHexColor>,
  radius: number
) {
  const safeRadius = clamp(radius, 0.05, 1)
  const framePixels = new Uint8ClampedArray(SIZE * SIZE * 4)
  const center = (SIZE - 1) / 2
  const maxDistance = Math.max(center * safeRadius, 0.0001)

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const distance = Math.hypot(x - center, y - center)
      const amount = clamp(distance / maxDistance, 0, 1)
      const pixelIndex = (y * SIZE + x) * 4

      framePixels[pixelIndex] = lerpChannel(
        innerColor.red,
        outerColor.red,
        amount
      )
      framePixels[pixelIndex + 1] = lerpChannel(
        innerColor.green,
        outerColor.green,
        amount
      )
      framePixels[pixelIndex + 2] = lerpChannel(
        innerColor.blue,
        outerColor.blue,
        amount
      )
      framePixels[pixelIndex + 3] = 255
    }
  }

  return framePixels
}

export function createRadialGradientTexture(
  config: RadialGradientTextureConfig
) {
  const innerColor = parseHexColor(config.innerColor)
  const outerColor = parseHexColor(config.outerColor)
  const isAnimated = hasAnimatedValues(config.radius)

  if (!isAnimated) {
    return createTextureFromFrame(
      "Radial Gradient Texture",
      renderRadialGradientFrame(
        innerColor,
        outerColor,
        getFrameValue(config.radius, 0, 1)
      )
    )
  }

  const frameByteLength = SIZE * SIZE * 4
  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES)

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    pixels.set(
      renderRadialGradientFrame(
        innerColor,
        outerColor,
        getFrameValue(config.radius, frameIndex, 1)
      ),
      frameIndex * frameByteLength
    )
  }

  return createSerializedTexture("Radial Gradient Texture", pixels, FRAMES)
}
