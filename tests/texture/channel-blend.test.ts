import {
  blendTextures,
  combineTextureChannels,
  splitTextureChannels,
} from "@/lib/texture"
import { describe, expect, it } from "vitest"

import { createFrame, createTexture, getFramePixels, getPixel, rgba } from "./fixtures"

describe("texture blending and channel ops", () => {
  it("blends textures in normal mode", () => {
    const base = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(255, 0, 0, 255))],
    })
    const blend = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(0, 0, 255, 255))],
    })

    const merged = blendTextures(base, blend, "normal")

    expect(getPixel(getFramePixels(merged), 1, 0, 0)).toEqual([0, 0, 255, 255])
  })

  it("splits texture channels into grayscale outputs", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(10, 20, 30, 40))],
    })

    const split = splitTextureChannels(texture)

    expect(Array.from(getFramePixels(split.outputRed))).toEqual([10, 10, 10, 255])
    expect(Array.from(getFramePixels(split.outputAlpha))).toEqual([40, 40, 40, 255])
  })

  it("combines texture channels back into one texture", () => {
    const red = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(255, 0, 0, 255))],
    })
    const green = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(0, 255, 0, 255))],
    })
    const blue = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(0, 0, 255, 255))],
    })

    const combined = combineTextureChannels({ red, green, blue })

    expect(getPixel(getFramePixels(combined), 1, 0, 0)).toEqual([54, 182, 18, 255])
  })
})
