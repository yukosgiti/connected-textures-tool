import { createGraphDocument, parseGraphDocument } from "@/lib/graph-json"

import { describe, expect, it } from "vitest"

import { createTexture, createFrame, rgba } from "./texture/fixtures"

describe("graph json persistence", () => {
  it("round-trips connected texture corner override settings and mask preset selections", () => {
    const presetMask = createTexture({
      name: "mask-border.png",
      width: 1,
      frameSize: 1,
      frames: [createFrame(rgba(255, 255, 255, 255))],
    })

    const document = createGraphDocument(
      [
        {
          id: "connected-node",
          type: "connectedTexture",
          position: { x: 10, y: 20 },
          data: {
            texture: null,
            outputTextures: {},
            error: null,
            debug: false,
            mode: "normal",
            overrideCornerTransparency: true,
          },
        },
        {
          id: "advanced-node",
          type: "advancedConnectedTexture",
          position: { x: 30, y: 40 },
          data: {
            texture: null,
            outputTextures: {},
            error: null,
            debug: false,
            mode: "normal",
            overrideCornerTransparency: true,
          },
        },
        {
          id: "mask-node",
          type: "maskTexture",
          position: { x: 50, y: 60 },
          data: {
            texture: null,
            error: null,
            presetMask,
          },
        },
      ],
      [],
      "connected-texture-settings",
    )

    expect(document.nodes[0]?.data).toEqual({ overrideCornerTransparency: true })
    expect(document.nodes[1]?.data).toEqual({ overrideCornerTransparency: true })
    expect(document.nodes[2]?.data).toEqual({ presetMask })

    const parsed = parseGraphDocument(document)

    expect(parsed.nodes[0]?.data).toMatchObject({ overrideCornerTransparency: true })
    expect(parsed.nodes[1]?.data).toMatchObject({ overrideCornerTransparency: true })
    expect(parsed.nodes[2]?.data).toMatchObject({ presetMask })
  })
})