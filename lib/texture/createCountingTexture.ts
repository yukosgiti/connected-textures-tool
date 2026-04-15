import { FRAMES, SIZE } from "@/lib/utils"

import { encodeTexturePixels } from "./encodeTexturePixels"
import { type SerializedTextureData } from "./types"

const DIGIT_GLYPHS: Record<string, readonly string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "001", "001", "001"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
}

function setPixel(
  pixels: Uint8ClampedArray,
  frameStart: number,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
  alpha: number
) {
  const index = frameStart + ((y * SIZE + x) * 4)

  pixels[index] = red
  pixels[index + 1] = green
  pixels[index + 2] = blue
  pixels[index + 3] = alpha
}

function fillFrameBackground(pixels: Uint8ClampedArray, frameStart: number) {
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      setPixel(pixels, frameStart, x, y, 0, 0, 0, 255)
    }
  }
}

function drawDigit(
  pixels: Uint8ClampedArray,
  frameStart: number,
  digit: string,
  originX: number,
  originY: number,
  scale: number
) {
  const glyph = DIGIT_GLYPHS[digit]

  if (!glyph) {
    return
  }

  for (let rowIndex = 0; rowIndex < glyph.length; rowIndex += 1) {
    const row = glyph[rowIndex]

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      if (row[columnIndex] !== "1") {
        continue
      }

      for (let offsetY = 0; offsetY < scale; offsetY += 1) {
        for (let offsetX = 0; offsetX < scale; offsetX += 1) {
          const x = originX + (columnIndex * scale) + offsetX
          const y = originY + (rowIndex * scale) + offsetY

          if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) {
            continue
          }

          setPixel(pixels, frameStart, x, y, 255, 255, 255, 255)
        }
      }
    }
  }
}

function renderFrameNumber(
  pixels: Uint8ClampedArray,
  frameStart: number,
  frameNumber: number
) {
  const text = formatCountingFrameNumber(frameNumber)
  const scale = 2
  const glyphWidth = 3
  const glyphHeight = 5
  const gap = scale
  const textWidth = (text.length * glyphWidth * scale) + ((text.length - 1) * gap)
  const textHeight = glyphHeight * scale
  const originX = Math.floor((SIZE - textWidth) / 2)
  const originY = Math.floor((SIZE - textHeight) / 2)

  fillFrameBackground(pixels, frameStart)

  for (let index = 0; index < text.length; index += 1) {
    drawDigit(
      pixels,
      frameStart,
      text[index] ?? "0",
      originX + (index * ((glyphWidth * scale) + gap)),
      originY,
      scale
    )
  }
}

export function formatCountingFrameNumber(frameNumber: number) {
  return `${frameNumber}`.padStart(2, "0")
}

export function createCountingTexture(name = "counting-texture") {
  const frameByteLength = SIZE * SIZE * 4
  const pixels = new Uint8ClampedArray(frameByteLength * FRAMES)

  for (let frameIndex = 0; frameIndex < FRAMES; frameIndex += 1) {
    renderFrameNumber(pixels, frameIndex * frameByteLength, frameIndex + 1)
  }

  return {
    name,
    width: SIZE,
    height: SIZE * FRAMES,
    frameSize: SIZE,
    frames: FRAMES,
    sourceFrames: FRAMES,
    pixels: encodeTexturePixels(pixels),
  } satisfies SerializedTextureData
}