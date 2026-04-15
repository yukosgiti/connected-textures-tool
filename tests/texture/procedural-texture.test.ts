import {
  createCheckerboardTexture,
  createColorTexture,
  createLinearGradientTexture,
  createRadialGradientTexture,
  createRandomTexture,
  createRandomTextureSeed,
  createWaveTexture,
  normalizeHexColor,
} from "@/lib/procedural-texture"
import { FRAMES } from "@/lib/utils"
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
  it("normalizes valid hex colors and rejects invalid ones", () => {
    expect(normalizeHexColor("fff")).toBe("#ffffff")
    expect(normalizeHexColor("#AbC")).toBe("#aabbcc")
    expect(normalizeHexColor("#112233")).toBe("#112233")
    expect(normalizeHexColor("nope")).toBeNull()
  })

  it("creates a solid color texture", () => {
    const texture = createColorTexture("#ff00aa")
    const frame = getTextureFramePixels(texture, 0)

    expect(getPixel(frame, texture.width, 0, 0)).toEqual([255, 0, 170, 255])
    expect(texture.sourceFrames).toBe(1)
  })

  it("creates a deterministic random seed in range", () => {
    const seed = createRandomTextureSeed()

    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThan(1_000_000_000)
  })

  it("creates grayscale random textures with static and animated ratios", () => {
    const staticTexture = createRandomTexture("grayscale", 123, [1])
    const animatedTexture = createRandomTexture("grayscale", 123, [0.25, 1])

    expect(staticTexture.sourceFrames).toBe(1)
    expect(animatedTexture.sourceFrames).toBe(FRAMES)
    expect(Array.from(getTextureFramePixels(animatedTexture, 0))).not.toEqual(
      Array.from(getTextureFramePixels(animatedTexture, 1))
    )
  })

  it("creates binary and pastel random textures", () => {
    const binary = createRandomTexture("binary", 42, [0.5])
    const pastel = createRandomTexture("pastel", 42, [1])
    const binaryFrame = getTextureFramePixels(binary, 0)
    const pastelFrame = getTextureFramePixels(pastel, 0)

    expect(getPixel(binaryFrame, binary.width, 0, 0)[0]).toBeOneOf?.([0, 255])
    expect(getPixel(pastelFrame, pastel.width, 0, 0)[0]).toBeGreaterThanOrEqual(128)
  })

  it("creates a linear gradient texture and animates angle changes", () => {
    const texture = createLinearGradientTexture({
      startColor: "#000000",
      endColor: "#ffffff",
      startPercentage: [0],
      endPercentage: [100],
      angle: [0, 0.25],
    })

    expect(texture.sourceFrames).toBe(FRAMES)
    expect(Array.from(getTextureFramePixels(texture, 0))).not.toEqual(
      Array.from(getTextureFramePixels(texture, 1))
    )
  })

  it("creates a checkerboard texture and animates scale", () => {
    const texture = createCheckerboardTexture({
      colorA: "#000000",
      colorB: "#ffffff",
      scale: [2, 4],
    })

    expect(texture.sourceFrames).toBe(FRAMES)
    expect(Array.from(getTextureFramePixels(texture, 0))).not.toEqual(
      Array.from(getTextureFramePixels(texture, 1))
    )
  })

  it("creates a radial gradient texture and animates radius", () => {
    const texture = createRadialGradientTexture({
      innerColor: "#ffffff",
      outerColor: "#000000",
      radius: [1, 0.25],
    })

    expect(texture.sourceFrames).toBe(FRAMES)
    expect(Array.from(getTextureFramePixels(texture, 0))).not.toEqual(
      Array.from(getTextureFramePixels(texture, 1))
    )
  })

  it("creates non-radial wave textures and rejects invalid colors", () => {
    const squareTexture = createWaveTexture("square", {
      color: "#ffffff",
      cycles: [2],
      amplitude: [4],
      thickness: [1],
      phase: [0],
    })

    expect(squareTexture.sourceFrames).toBe(1)
    expect(() =>
      createWaveTexture("sine", {
        color: "invalid",
        cycles: [1],
        amplitude: [1],
        thickness: [1],
        phase: [0],
      })
    ).toThrow("Use a valid hex color.")
  })

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