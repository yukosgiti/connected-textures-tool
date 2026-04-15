import {
  cropTexture,
  flipTexture,
  rotateTexture,
  scaleTexture,
  skewTexture,
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
