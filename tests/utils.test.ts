import { FRAMES, createConstantValueFrames } from "@/lib/utils"
import { describe, expect, it } from "vitest"

describe("utils", () => {
  it("creates constant value frames", () => {
    const frames = createConstantValueFrames(2.5)

    expect(frames).toHaveLength(FRAMES)
    expect(frames.every((value) => value === 2.5)).toBe(true)
  })
})