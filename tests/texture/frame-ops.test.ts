import {
  frameBlendTexture,
  holdTexture,
  phaseTexture,
  pingPongTexture,
  reverseTexture,
  selectTextureFrames,
  speedTexture,
  trimTexture,
} from "@/lib/texture"
import { describe, expect, it } from "vitest"

import { createFrame, createTexture, getFramePixels, rgba } from "./fixtures"

function createThreeFrameTexture() {
  return createTexture({
    width: 1,
    frameSize: 1,
    frames: [
      createFrame(rgba(255, 0, 0, 255)),
      createFrame(rgba(0, 255, 0, 255)),
      createFrame(rgba(0, 0, 255, 255)),
    ],
  })
}

describe("texture frame operations", () => {
  it("reverses frame order", () => {
    const reversed = reverseTexture(createThreeFrameTexture())

    expect(Array.from(getFramePixels(reversed, 0))).toEqual([0, 0, 255, 255])
    expect(Array.from(getFramePixels(reversed, 2))).toEqual([255, 0, 0, 255])
  })

  it("retimes frames by speed", () => {
    const sped = speedTexture(createThreeFrameTexture(), [2, 2, 2])

    expect(Array.from(getFramePixels(sped, 0))).toEqual([255, 0, 0, 255])
    expect(Array.from(getFramePixels(sped, 1))).toEqual([0, 0, 255, 255])
    expect(Array.from(getFramePixels(sped, 2))).toEqual([0, 255, 0, 255])
  })

  it("holds source frames", () => {
    const held = holdTexture(createThreeFrameTexture(), [2, 1, 1])

    expect(Array.from(getFramePixels(held, 0))).toEqual([255, 0, 0, 255])
    expect(Array.from(getFramePixels(held, 1))).toEqual([255, 0, 0, 255])
    expect(Array.from(getFramePixels(held, 2))).toEqual([0, 255, 0, 255])
  })

  it("phases frames by offset", () => {
    const phased = phaseTexture(createThreeFrameTexture(), [1, 1, 1])

    expect(Array.from(getFramePixels(phased, 0))).toEqual([0, 255, 0, 255])
  })

  it("selects explicit frame indices", () => {
    const selected = selectTextureFrames(createThreeFrameTexture(), [2, 0, 1])

    expect(Array.from(getFramePixels(selected, 0))).toEqual([0, 0, 255, 255])
    expect(Array.from(getFramePixels(selected, 1))).toEqual([255, 0, 0, 255])
  })

  it("builds a ping-pong sequence from source frames", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [
        createFrame(rgba(255, 0, 0, 255)),
        createFrame(rgba(0, 255, 0, 255)),
        createFrame(rgba(0, 0, 255, 255)),
        createFrame(rgba(0, 0, 0, 255)),
      ],
      sourceFrames: 3,
    })
    const pingPong = pingPongTexture(texture)

    expect(Array.from(getFramePixels(pingPong, 0))).toEqual([255, 0, 0, 255])
    expect(Array.from(getFramePixels(pingPong, 1))).toEqual([0, 255, 0, 255])
    expect(Array.from(getFramePixels(pingPong, 2))).toEqual([0, 0, 255, 255])
    expect(Array.from(getFramePixels(pingPong, 3))).toEqual([0, 255, 0, 255])
  })

  it("trims to a moving frame window", () => {
    const trimmed = trimTexture(createThreeFrameTexture(), [1, 1, 1], [2, 2, 2])

    expect(Array.from(getFramePixels(trimmed, 0))).toEqual([0, 255, 0, 255])
    expect(Array.from(getFramePixels(trimmed, 1))).toEqual([0, 0, 255, 255])
    expect(Array.from(getFramePixels(trimmed, 2))).toEqual([0, 255, 0, 255])
  })

  it("blends consecutive frames", () => {
    const blended = frameBlendTexture(createThreeFrameTexture(), [0.5, 0, 0])

    expect(Array.from(getFramePixels(blended, 0))).toEqual([128, 128, 0, 255])
  })
})
