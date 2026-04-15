import {
  adjustBrightnessTexture,
  adjustContrastTexture,
  adjustHslTexture,
  adjustLevelsTexture,
  adjustOpacityTexture,
  blurTexture,
  grayscaleTexture,
  invertTexture,
  maskTexture,
  thresholdTexture,
} from "@/lib/texture"
import { describe, expect, it } from "vitest"

import { createFrame, createTexture, getFramePixels, getPixel, rgba } from "./fixtures"

describe("texture color effects", () => {
  it("adjusts hue shifts", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(255, 0, 0, 255))],
    })
    const adjusted = adjustHslTexture(texture, [1 / 3], [0], [0])

    expect(getPixel(getFramePixels(adjusted), 1, 0, 0)).toEqual([0, 255, 0, 255])
  })

  it("adjusts opacity", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(10, 20, 30, 200))],
    })
    const adjusted = adjustOpacityTexture(texture, [0.5])

    expect(getPixel(getFramePixels(adjusted), 1, 0, 0)).toEqual([10, 20, 30, 100])
  })

  it("keeps contrast identity at zero", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(64, 128, 192, 255))],
    })
    const adjusted = adjustContrastTexture(texture, [0])

    expect(Array.from(getFramePixels(adjusted))).toEqual(Array.from(getFramePixels(texture)))
  })

  it("keeps blur identity at zero", () => {
    const texture = createTexture({
      width: 2,
      frameSize: 1,
      frames: [createFrame(rgba(255, 0, 0, 255), rgba(0, 0, 255, 255))],
    })
    const blurred = blurTexture(texture, [0])

    expect(Array.from(getFramePixels(blurred))).toEqual(Array.from(getFramePixels(texture)))
  })

  it("masks alpha by luminance", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(10, 20, 30, 255))],
    })
    const mask = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(0, 0, 0, 255))],
    })
    const masked = maskTexture(texture, mask)

    expect(getPixel(getFramePixels(masked), 1, 0, 0)).toEqual([10, 20, 30, 0])
  })

  it("inverts rgb channels", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(10, 20, 30, 255))],
    })
    const inverted = invertTexture(texture)

    expect(getPixel(getFramePixels(inverted), 1, 0, 0)).toEqual([245, 235, 225, 255])
  })

  it("thresholds luminance", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(255, 255, 255, 255))],
    })
    const thresholded = thresholdTexture(texture, [0.5])

    expect(getPixel(getFramePixels(thresholded), 1, 0, 0)).toEqual([255, 255, 255, 255])
  })

  it("adjusts brightness", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(128, 128, 128, 255))],
    })
    const brightened = adjustBrightnessTexture(texture, [0.25])

    expect(getPixel(getFramePixels(brightened), 1, 0, 0)).toEqual([192, 192, 192, 255])
  })

  it("keeps levels identity at defaults", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(32, 96, 160, 255))],
    })
    const adjusted = adjustLevelsTexture(texture, [0], [1], [1])

    expect(Array.from(getFramePixels(adjusted))).toEqual(Array.from(getFramePixels(texture)))
  })

  it("converts texture to grayscale", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(255, 0, 0, 255))],
    })
    const grayscale = grayscaleTexture(texture)

    expect(getPixel(getFramePixels(grayscale), 1, 0, 0)).toEqual([54, 54, 54, 255])
  })
})
