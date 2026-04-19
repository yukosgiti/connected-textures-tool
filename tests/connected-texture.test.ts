import {
  CONNECTED_TEXTURE_TEMPLATE_COUNT,
  getConnectedTextureUsageCounts,
} from "@/lib/connected-texture"
import { createDefaultPreviewCells } from "@/store/nodes"
import { describe, expect, it } from "vitest"

describe("getConnectedTextureUsageCounts", () => {
  it("counts every connected texture in the default 21x21 preview layout", () => {
    const gridSize = 21
    const counts = getConnectedTextureUsageCounts(createDefaultPreviewCells(gridSize), gridSize)

    expect(counts).toHaveLength(CONNECTED_TEXTURE_TEMPLATE_COUNT)
    expect(counts.every((count) => count > 0)).toBe(true)
  })

  it("keeps the single centered preview tile mapped to the base connected texture", () => {
    const counts = getConnectedTextureUsageCounts(createDefaultPreviewCells(8), 8)

    expect(counts[0]).toBe(1)
    expect(counts.slice(1).every((count) => count === 0)).toBe(true)
  })
})