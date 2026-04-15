import { FRAMES } from "@/lib/utils"
import { createValueNodeData } from "@/lib/value-node"
import { describe, expect, it } from "vitest"

describe("value node generators", () => {
  it("generates a sawtooth ramp", () => {
    const node = createValueNodeData({
      mode: "sawtooth",
      sawtoothAmplitude: 0.5,
      sawtoothOffset: 0.5,
      sawtoothCycles: 1,
      sawtoothPhasePi: 0,
    })

    expect(node.data[0]).toBeCloseTo(0, 5)
    expect(node.data[Math.floor(FRAMES / 2)]).toBeCloseTo(0.5, 1)
    expect(node.data[FRAMES - 1]).toBeGreaterThan(0.9)
  })

  it("generates a triangle wave", () => {
    const node = createValueNodeData({
      mode: "triangle",
      triangleAmplitude: 0.5,
      triangleOffset: 0.5,
      triangleCycles: 1,
      trianglePhasePi: 0,
    })

    expect(node.data[0]).toBeCloseTo(0, 5)
    expect(node.data[Math.floor(FRAMES / 2)]).toBeCloseTo(1, 1)
    expect(node.data[FRAMES - 1]).toBeLessThan(0.1)
  })

  it("generates a square wave with two plateaus", () => {
    const node = createValueNodeData({
      mode: "square",
      squareAmplitude: 0.5,
      squareOffset: 0.5,
      squareCycles: 1,
      squarePhasePi: 0,
    })

    expect(Math.min(...node.data)).toBeCloseTo(0, 5)
    expect(Math.max(...node.data)).toBeCloseTo(1, 5)
    expect(new Set(node.data.map((value) => value.toFixed(5))).size).toBe(2)
  })
})