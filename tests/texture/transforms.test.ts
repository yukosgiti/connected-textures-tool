import {
  cropTexture,
  flipTexture,
  magnifyTexture,
  rotateTexture,
  scaleTexture,
  skewTexture,
  swirlTexture,
  tileTexture,
  translateTexture,
} from "@/lib/texture"
import { describe, expect, it } from "vitest"

import { createFrame, createTexture, getFramePixels, getPixel, rgba } from "./fixtures"

function createQuadTexture() {
  return createTexture({
    width: 2,
    frameSize: 2,
    frames: [
      createFrame(
        rgba(255, 0, 0, 255),
        rgba(0, 255, 0, 255),
        rgba(0, 0, 255, 255),
        rgba(255, 255, 255, 255)
      ),
    ],
  })
}

function createCoordinateTexture(width = 5, height = 5) {
  const framePixels = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4

      framePixels[index] = x * 40
      framePixels[index + 1] = y * 40
      framePixels[index + 2] = 0
      framePixels[index + 3] = 255
    }
  }

  return createTexture({
    width,
    frameSize: height,
    frames: [framePixels],
  })
}

function expectFramesToDiffer(
  left: Uint8ClampedArray,
  right: Uint8ClampedArray
) {
  expect(Array.from(left)).not.toEqual(Array.from(right))
}

describe("texture transforms", () => {
  it("rotates texture pixels", () => {
    const rotated = rotateTexture(createQuadTexture(), [0.25])
    const frame = getFramePixels(rotated)

    expect(getPixel(frame, 2, 0, 0)).toEqual([0, 0, 255, 255])
    expect(getPixel(frame, 2, 1, 0)).toEqual([255, 0, 0, 255])
  })

  it("translates texture pixels", () => {
    const translated = translateTexture(createQuadTexture(), [0.5], [0])
    const frame = getFramePixels(translated)

    expect(getPixel(frame, 2, 0, 0)).toEqual([0, 255, 0, 255])
    expect(getPixel(frame, 2, 1, 0)).toEqual([255, 0, 0, 255])
  })

  it("keeps scale identity at zero offsets", () => {
    const texture = createQuadTexture()
    const scaled = scaleTexture(texture, [0], [0])

    expect(Array.from(getFramePixels(scaled))).toEqual(Array.from(getFramePixels(texture)))
  })

  it("keeps skew identity at zero offsets", () => {
    const texture = createQuadTexture()
    const skewed = skewTexture(texture, [0], [0])

    expect(Array.from(getFramePixels(skewed))).toEqual(Array.from(getFramePixels(texture)))
  })

  it("swirls pixels around the center", () => {
    const texture = createCoordinateTexture()
    const original = getFramePixels(texture)
    const swirled = swirlTexture(texture, [0.25])
    const frame = getFramePixels(swirled)

    expect(getPixel(frame, 5, 2, 2)).toEqual(getPixel(original, 5, 2, 2))
    expect(getPixel(frame, 5, 2, 1)).toEqual(getPixel(original, 5, 1, 1))
  })

  it("extends swirl influence to the texture corners at high values", () => {
    const texture = createCoordinateTexture()
    const original = getFramePixels(texture)
    const swirled = getFramePixels(swirlTexture(texture, [1]))

    expectFramesToDiffer(swirled, original)
    expect(getPixel(swirled, 5, 0, 0)).not.toEqual(getPixel(original, 5, 0, 0))
  })

  it("magnifies and shrinks around the center", () => {
    const texture = createCoordinateTexture()
    const original = getFramePixels(texture)
    const magnified = getFramePixels(magnifyTexture(texture, [1]))
    const shrunken = getFramePixels(magnifyTexture(texture, [-1]))

    expect(getPixel(magnified, 5, 2, 2)).toEqual(getPixel(original, 5, 2, 2))
    expect(getPixel(magnified, 5, 0, 2)).toEqual(getPixel(original, 5, 1, 2))
    expect(getPixel(shrunken, 5, 4, 2)).toEqual(getPixel(original, 5, 0, 2))
  })

  it("extends magnify and shrink across the full texture", () => {
    const texture = createCoordinateTexture()
    const original = getFramePixels(texture)
    const magnified = getFramePixels(magnifyTexture(texture, [1]))
    const shrunken = getFramePixels(magnifyTexture(texture, [-1]))

    expectFramesToDiffer(magnified, original)
    expectFramesToDiffer(shrunken, original)
    expect(getPixel(magnified, 5, 2, 0)).not.toEqual(getPixel(original, 5, 2, 0))
    expect(getPixel(shrunken, 5, 2, 0)).not.toEqual(getPixel(original, 5, 2, 0))
  })

  it("flips texture horizontally", () => {
    const flipped = flipTexture(createQuadTexture(), "horizontal")
    const frame = getFramePixels(flipped)

    expect(getPixel(frame, 2, 0, 0)).toEqual([0, 255, 0, 255])
    expect(getPixel(frame, 2, 1, 0)).toEqual([255, 0, 0, 255])
  })

  it("crops a quarter region and stretches it", () => {
    const cropped = cropTexture(createQuadTexture(), [0], [0], [0.5], [0.5])
    const frame = getFramePixels(cropped)

    expect(getPixel(frame, 2, 0, 0)).toEqual([255, 0, 0, 255])
    expect(getPixel(frame, 2, 1, 1)).toEqual([255, 0, 0, 255])
  })

  it("keeps tile identity at 1x repeat", () => {
    const texture = createQuadTexture()
    const tiled = tileTexture(texture, [1], [1], "repeat")

    expect(Array.from(getFramePixels(tiled))).toEqual(Array.from(getFramePixels(texture)))
  })
})
