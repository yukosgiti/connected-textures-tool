import {
  CONNECTED_TEXTURE_OUTPUTS,
  CONNECTED_TEXTURE_REQUIRED_INPUTS,
  CONNECTED_TEXTURE_TEMPLATE_COUNT,
  createEmptyConnectedTextureInputs,
  generateConnectedTexture,
  getConnectedTextureMissingInputs,
  getConnectedTextureTemplateIndex,
  getConnectedTextureTextureInputHandleId,
  packConnectedTextureOutputs,
} from "@/lib/connected-texture"
import { describe, expect, it } from "vitest"

import {
  createFrame,
  createSolidFrame,
  createTexture,
  getFramePixels,
  getPixel,
  rgba,
} from "./fixtures"

function setPixel(
  framePixels: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  pixel: readonly [number, number, number, number]
) {
  framePixels.set(pixel, (y * width + x) * 4)
}

function createOverlayTexture(options: {
  name: string
  size: number
  pixels: Array<{
    x: number
    y: number
    color: readonly [number, number, number, number]
  }>
}) {
  const frame = createSolidFrame(options.size, options.size, rgba(0, 0, 0, 0))

  for (const pixel of options.pixels) {
    setPixel(frame, options.size, pixel.x, pixel.y, pixel.color)
  }

  return createTexture({
    name: options.name,
    width: options.size,
    frameSize: options.size,
    frames: [frame],
  })
}

describe("connected texture helpers", () => {
  it("exposes required input metadata and handle ids", () => {
    expect(CONNECTED_TEXTURE_REQUIRED_INPUTS.map(({ key }) => key)).toEqual([
      "texture",
      "side_top",
      "crn_in_top_lt",
      "crn_out_top_lt",
    ])
    expect(CONNECTED_TEXTURE_OUTPUTS).toHaveLength(CONNECTED_TEXTURE_TEMPLATE_COUNT)
    expect(getConnectedTextureTextureInputHandleId(12)).toBe("inputTexture12")
  })

  it("reports missing required inputs from an empty input set", () => {
    const inputs = createEmptyConnectedTextureInputs()

    expect(getConnectedTextureMissingInputs(inputs).map(({ key }) => key)).toEqual([
      "texture",
      "side_top",
      "crn_in_top_lt",
      "crn_out_top_lt",
    ])
  })
})

describe("connected texture template lookup", () => {
  it("returns null for empty cells", () => {
    expect(getConnectedTextureTemplateIndex([false], 1, 0)).toBeNull()
  })

  it("maps common neighbor configurations to expected template ids", () => {
    expect(getConnectedTextureTemplateIndex([true], 1, 0)).toBe(0)

    expect(
      getConnectedTextureTemplateIndex(
        [
          false,
          false,
          false,
          true,
          true,
          true,
          false,
          false,
          false,
        ],
        3,
        4
      )
    ).toBe(2)

    expect(getConnectedTextureTemplateIndex([true, true, true, true], 2, 0)).toBe(13)

    expect(
      getConnectedTextureTemplateIndex(
        [true, true, true, true, true, true, true, true, true],
        3,
        4
      )
    ).toBe(26)
  })

  it("maps outer-corner neighbor configurations to the expected template ids", () => {
    expect(
      getConnectedTextureTemplateIndex(
        [
          false,
          true,
          false,
          true,
          true,
          false,
          false,
          false,
          false,
        ],
        3,
        4
      )
    ).toBe(17)

    expect(
      getConnectedTextureTemplateIndex(
        [
          false,
          true,
          false,
          false,
          true,
          true,
          false,
          false,
          false,
        ],
        3,
        4
      )
    ).toBe(16)

    expect(
      getConnectedTextureTemplateIndex(
        [
          false,
          false,
          false,
          true,
          true,
          false,
          false,
          true,
          false,
        ],
        3,
        4
      )
    ).toBe(5)

    expect(
      getConnectedTextureTemplateIndex(
        [
          false,
          false,
          false,
          false,
          true,
          true,
          false,
          true,
          false,
        ],
        3,
        4
      )
    ).toBe(4)
  })
})

describe("connected texture output packing", () => {
  it("requires at least the first output texture", () => {
    expect(() => packConnectedTextureOutputs({})).toThrow(
      "Connected texture outputs are required."
    )
  })

  it("packs all outputs into a preview strip", () => {
    const outputs = Object.fromEntries(
      CONNECTED_TEXTURE_OUTPUTS.map(({ handleId, index }) => [
        handleId,
        createTexture({
          name: `Output ${index}`,
          width: 1,
          frameSize: 1,
          frames: [createFrame(rgba(index, index + 1, index + 2, 255))],
        }),
      ])
    )

    const packed = packConnectedTextureOutputs(outputs, "Packed Connected")

    expect(packed.texture.name).toBe("Packed Connected")
    expect(packed.texture.frames).toBe(CONNECTED_TEXTURE_OUTPUTS.length)
    expect(Array.from(getFramePixels(packed.texture, 0))).toEqual([0, 1, 2, 255])
    expect(Array.from(getFramePixels(packed.texture, 46))).toEqual([46, 47, 48, 255])
  })

  it("requires every output texture to be present", () => {
    const outputs = Object.fromEntries(
      CONNECTED_TEXTURE_OUTPUTS.map(({ handleId, index }) => [
        handleId,
        createTexture({
          name: `Output ${index}`,
          width: 1,
          frameSize: 1,
          frames: [createFrame(rgba(index, 0, 0, 255))],
        }),
      ])
    ) as Partial<Record<string, ReturnType<typeof createTexture> | null>>

    outputs.outputTexture3 = null

    expect(() => packConnectedTextureOutputs(outputs)).toThrow(
      "Missing connected texture output 3."
    )
  })

  it("rejects mismatched output dimensions", () => {
    const outputs = Object.fromEntries(
      CONNECTED_TEXTURE_OUTPUTS.map(({ handleId, index }) => [
        handleId,
        createTexture({
          name: `Output ${index}`,
          width: 1,
          frameSize: 1,
          frames: [createFrame(rgba(index, 0, 0, 255))],
        }),
      ])
    ) as Partial<Record<string, ReturnType<typeof createTexture> | null>>

    outputs.outputTexture7 = createTexture({
      name: "Mismatched",
      width: 2,
      frameSize: 2,
      frames: [createSolidFrame(2, 2, rgba(255, 255, 255, 255))],
    })

    expect(() => packConnectedTextureOutputs(outputs)).toThrow(
      "Connected texture output 7 does not match the other output dimensions."
    )
  })
})

describe("connected texture generation", () => {
  it("requires the base texture input", () => {
    expect(() =>
      generateConnectedTexture({
        side_top: createOverlayTexture({
          name: "Side",
          size: 3,
          pixels: [{ x: 1, y: 0, color: rgba(255, 0, 0, 255) }],
        }),
        crn_in_top_lt: createOverlayTexture({
          name: "Inner",
          size: 3,
          pixels: [{ x: 0, y: 0, color: rgba(0, 255, 0, 255) }],
        }),
        crn_out_top_lt: createOverlayTexture({
          name: "Outer",
          size: 3,
          pixels: [{ x: 0, y: 2, color: rgba(0, 0, 255, 255) }],
        }),
      })
    ).toThrow("Base is required.")
  })

  it("rejects mismatched input dimensions or frame counts", () => {
    const baseTexture = createTexture({
      name: "Base",
      width: 3,
      frameSize: 3,
      frames: [
        createSolidFrame(3, 3, rgba(20, 20, 20, 255)),
        createSolidFrame(3, 3, rgba(30, 30, 30, 255)),
      ],
    })

    expect(() =>
      generateConnectedTexture({
        texture: baseTexture,
        side_top: createOverlayTexture({
          name: "Side",
          size: 3,
          pixels: [{ x: 1, y: 0, color: rgba(255, 0, 0, 255) }],
        }),
        crn_in_top_lt: createOverlayTexture({
          name: "Inner",
          size: 2,
          pixels: [{ x: 0, y: 0, color: rgba(0, 255, 0, 255) }],
        }),
        crn_out_top_lt: createOverlayTexture({
          name: "Outer",
          size: 3,
          pixels: [{ x: 0, y: 2, color: rgba(0, 0, 255, 255) }],
        }),
      })
    ).toThrow("Connected texture inputs must all use the same square dimensions and frame count.")
  })

  it("rejects non-square required textures", () => {
    expect(() =>
      generateConnectedTexture({
        texture: createTexture({
          name: "Base",
          width: 4,
          frameSize: 3,
          frames: [createSolidFrame(4, 3, rgba(10, 20, 30, 255))],
        }),
        side_top: createOverlayTexture({
          name: "Side",
          size: 3,
          pixels: [{ x: 1, y: 0, color: rgba(255, 0, 0, 255) }],
        }),
        crn_in_top_lt: createOverlayTexture({
          name: "Inner",
          size: 3,
          pixels: [{ x: 0, y: 0, color: rgba(0, 255, 0, 255) }],
        }),
        crn_out_top_lt: createOverlayTexture({
          name: "Outer",
          size: 3,
          pixels: [{ x: 0, y: 2, color: rgba(0, 0, 255, 255) }],
        }),
      })
    ).toThrow("Base must be square.")
  })

  it("builds all output textures and rotates derived layers into the right positions", () => {
    const baseTexture = createTexture({
      name: "Base",
      width: 3,
      frameSize: 3,
      frames: [createSolidFrame(3, 3, rgba(10, 20, 30, 255))],
    })
    const result = generateConnectedTexture({
      texture: baseTexture,
      side_top: createOverlayTexture({
        name: "Side",
        size: 3,
        pixels: [{ x: 1, y: 0, color: rgba(255, 0, 0, 255) }],
      }),
      crn_in_top_lt: createOverlayTexture({
        name: "Inner",
        size: 3,
        pixels: [{ x: 0, y: 0, color: rgba(0, 255, 0, 255) }],
      }),
      crn_out_top_lt: createOverlayTexture({
        name: "Outer",
        size: 3,
        pixels: [{ x: 0, y: 2, color: rgba(0, 0, 255, 255) }],
      }),
    })

    expect(Object.keys(result.outputTextures)).toHaveLength(CONNECTED_TEXTURE_OUTPUTS.length)
    expect(result.texture.frames).toBe(CONNECTED_TEXTURE_OUTPUTS.length)

    const outputFive = getFramePixels(result.outputTextures.outputTexture5, 0)

    expect(getPixel(outputFive, 3, 1, 0)).toEqual([255, 0, 0, 255])
    expect(getPixel(outputFive, 3, 2, 1)).toEqual([255, 0, 0, 255])
    expect(getPixel(outputFive, 3, 2, 0)).toEqual([0, 255, 0, 255])
    expect(getPixel(outputFive, 3, 2, 2)).toEqual([0, 0, 255, 255])
    expect(getPixel(outputFive, 3, 0, 1)).toEqual([10, 20, 30, 255])

    expect(Array.from(getFramePixels(result.texture, 5))).toEqual(Array.from(outputFive))
  })
})