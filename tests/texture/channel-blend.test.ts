import {
  blendTextures,
  combineTextureChannels,
  splitTextureChannels,
} from "@/lib/texture"
import { describe, expect, it } from "vitest"

import { createFrame, createTexture, getFramePixels, getPixel, rgba } from "./fixtures"

describe("texture blending and channel ops", () => {
  it("rejects blending textures with mismatched dimensions", () => {
    const base = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(255, 0, 0, 255))],
    })
    const blend = createTexture({
      width: 2,
      frameSize: 1,
      frames: [createFrame(rgba(0, 0, 255, 255), rgba(0, 0, 255, 255))],
    })

    expect(() => blendTextures(base, blend, "normal")).toThrow(
      "Textures must have matching dimensions and frame counts."
    )
  })

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

  it("requires at least one connected channel texture", () => {
    expect(() => combineTextureChannels({})).toThrow(
      "Connect at least one channel texture."
    )
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

  it("uses the connected alpha texture when present", () => {
    const red = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(255, 0, 0, 255))],
    })
    const alpha = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(128, 128, 128, 255))],
    })

    const combined = combineTextureChannels({ red, alpha })

    expect(getPixel(getFramePixels(combined), 1, 0, 0)).toEqual([54, 0, 0, 128])
  })
})
