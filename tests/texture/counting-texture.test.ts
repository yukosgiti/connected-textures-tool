import { FRAMES } from "@/lib/utils"
import { createCountingTexture, getTextureFramePixels } from "@/lib/texture"
import { describe, expect, it } from "vitest"

describe("counting texture", () => {
  it("creates one frame per global frame and starts at 1", () => {
    const texture = createCountingTexture()

    expect(texture.frames).toBe(FRAMES)
    expect(texture.sourceFrames).toBe(FRAMES)
    expect(texture.width).toBe(16)
    expect(texture.frameSize).toBe(16)
  })

  it("changes between consecutive frames", () => {
    const texture = createCountingTexture()
    const firstFrame = Array.from(getTextureFramePixels(texture, 0))
    const secondFrame = Array.from(getTextureFramePixels(texture, 1))
    const lastFrame = Array.from(getTextureFramePixels(texture, FRAMES - 1))

    expect(firstFrame).not.toEqual(secondFrame)
    expect(firstFrame).not.toEqual(lastFrame)
  })
})