import {
  CONNECTED_TEXTURE_TEMPLATE_COUNT,
  getConnectedTextureTemplateIndex,
} from "@/lib/connected-texture"
import { createDefaultPreviewCells } from "@/store/nodes"
import { describe, expect, it } from "vitest"

describe("createDefaultPreviewCells", () => {
  it("uses the all-templates layout for 21x21 previews", () => {
    const gridSize = 21
    const cells = createDefaultPreviewCells(gridSize)
    const coveredTemplates = new Set<number>()

    for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 1) {
      const templateIndex = getConnectedTextureTemplateIndex(cells, gridSize, cellIndex)

      if (templateIndex !== null) {
        coveredTemplates.add(templateIndex)
      }
    }

    expect(cells).toHaveLength(gridSize * gridSize)
    expect(cells.filter(Boolean)).toHaveLength(235)
    expect(coveredTemplates.size).toBe(CONNECTED_TEXTURE_TEMPLATE_COUNT)
    expect([...coveredTemplates].sort((left, right) => left - right)).toEqual(
      Array.from({ length: CONNECTED_TEXTURE_TEMPLATE_COUNT }, (_, index) => index),
    )
  })

  it("keeps smaller previews centered by default", () => {
    const cells = createDefaultPreviewCells(8)

    expect(cells.filter(Boolean)).toHaveLength(1)
    expect(cells[3 * 8 + 3]).toBe(true)
  })
})