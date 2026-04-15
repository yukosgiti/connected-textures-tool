import { FRAMES, SIZE } from "@/lib/utils"
import {
  decodeTexturePixels,
  encodeTexturePixels,
  getTextureFramePixels,
  normalizeTextureFile,
  normalizeTextureUrl,
  textureFrameToDataUrl,
} from "@/lib/texture"
import { afterEach, describe, expect, it } from "vitest"

import {
  createFrame,
  createSolidFrame,
  createTexture,
  getFramePixels,
  rgba,
} from "./fixtures"
import { installTextureDomStubs } from "./dom-stubs"

describe("texture encoding and image IO", () => {
  let restoreDom: (() => void) | null = null

  afterEach(() => {
    restoreDom?.()
    restoreDom = null
  })

  it("round-trips encoded texture pixels", () => {
    const pixels = createFrame(rgba(1, 2, 3, 4), rgba(5, 6, 7, 8))
    const texture = createTexture({
      width: 1,
      frameSize: 2,
      frames: [pixels],
    })

    expect(encodeTexturePixels(pixels)).toBe(texture.pixels)
    expect(Array.from(decodeTexturePixels(texture))).toEqual(Array.from(pixels))
  })

  it("returns the requested frame pixels", () => {
    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [
        createFrame(rgba(10, 20, 30, 255)),
        createFrame(rgba(40, 50, 60, 255)),
      ],
    })

    expect(Array.from(getTextureFramePixels(texture, 1))).toEqual([
      40, 50, 60, 255,
    ])
  })

  it("normalizes a texture URL into the fixed frame strip", async () => {
    const sourcePixels = new Uint8ClampedArray([
      ...createSolidFrame(SIZE, SIZE, rgba(255, 0, 0, 255)),
      ...createSolidFrame(SIZE, SIZE, rgba(0, 0, 255, 255)),
    ])

    restoreDom = installTextureDomStubs({
      "/preset.png": {
        width: SIZE,
        height: SIZE * 2,
        pixels: sourcePixels,
      },
    })

    const texture = await normalizeTextureUrl("/preset.png", "preset")

    expect(texture.name).toBe("preset")
    expect(texture.frames).toBe(FRAMES)
    expect(texture.sourceFrames).toBe(2)
    expect(Array.from(getFramePixels(texture, 0).slice(0, 4))).toEqual([
      255, 0, 0, 255,
    ])
    expect(Array.from(getFramePixels(texture, 30).slice(0, 4))).toEqual([
      0, 0, 255, 255,
    ])
  })

  it("normalizes an uploaded texture file", async () => {
    const sourcePixels = createSolidFrame(SIZE, SIZE, rgba(12, 34, 56, 255))

    restoreDom = installTextureDomStubs({
      "blob:mock": {
        width: SIZE,
        height: SIZE,
        pixels: sourcePixels,
      },
    })

    const file = new File([new Uint8Array([1, 2, 3])], "upload.png")
    const texture = await normalizeTextureFile(file)

    expect(texture.name).toBe("upload.png")
    expect(texture.sourceFrames).toBe(1)
    expect(Array.from(getFramePixels(texture, 0).slice(0, 4))).toEqual([
      12, 34, 56, 255,
    ])
  })

  it("renders a frame to a data URL using the canvas path", () => {
    restoreDom = installTextureDomStubs({})

    const texture = createTexture({
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(9, 8, 7, 255))],
    })

    expect(textureFrameToDataUrl(texture)).toBe("data:mock,9,8,7,255")
  })
})
