import { createWaveTexture } from "@/lib/procedural-texture"
import { getTextureFramePixels } from "@/lib/texture"
import { describe, expect, it } from "vitest"

function getPixel(
  framePixels: Uint8ClampedArray,
  width: number,
  x: number,
  y: number
) {
  const start = (y * width + x) * 4

  return Array.from(framePixels.slice(start, start + 4))
}

describe("procedural textures", () => {
  it("creates concentric radial wave rings", () => {
    const texture = createWaveTexture("radial", {
      color: "#ff0000",
      cycles: [6],
      amplitude: [0],
      thickness: [1.25],
      phase: [0],
    })
    const frame = getTextureFramePixels(texture, 0)
    const lowerCenter = texture.width / 2 - 1
    const upperCenter = texture.width / 2

    expect(getPixel(frame, texture.width, lowerCenter, lowerCenter)).toEqual([0, 0, 0, 0])
    expect(getPixel(frame, texture.width, upperCenter, upperCenter)).toEqual([0, 0, 0, 0])
    expect(getPixel(frame, texture.width, lowerCenter, lowerCenter - 1)).toEqual([255, 0, 0, 255])
    expect(getPixel(frame, texture.width, lowerCenter - 1, lowerCenter)).toEqual(
      getPixel(frame, texture.width, lowerCenter, lowerCenter - 1)
    )
  })

  it("animates radial wave rings with phase changes", () => {
    const texture = createWaveTexture("radial", {
      color: "#00ff00",
      cycles: [6, 6],
      amplitude: [0, 0],
      thickness: [1.25, 1.25],
      phase: [0, 0.5],
    })

    expect(Array.from(getTextureFramePixels(texture, 0))).not.toEqual(
      Array.from(getTextureFramePixels(texture, 1))
    )
  })
})