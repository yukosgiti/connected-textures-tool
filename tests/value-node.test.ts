import { FRAMES } from "@/lib/utils"
import {
  DEFAULT_VALUE_NODE_CONFIG,
  createValueNodeData,
  generateValueFrames,
  normalizeValueNodeData,
} from "@/lib/value-node"
import { describe, expect, it } from "vitest"

describe("value node generators", () => {
  it("creates default value node data", () => {
    const node = createValueNodeData()

    expect(node.mode).toBe(DEFAULT_VALUE_NODE_CONFIG.mode)
    expect(node.constantValue).toBe(DEFAULT_VALUE_NODE_CONFIG.constantValue)
    expect(node.data).toHaveLength(FRAMES)
    expect(node.data.every((value) => value === 0)).toBe(true)
  })

  it("generates constant frames", () => {
    const frames = generateValueFrames({
      ...DEFAULT_VALUE_NODE_CONFIG,
      mode: "constant",
      constantValue: 1.25,
    })

    expect(frames).toHaveLength(FRAMES)
    expect(frames.every((value) => value === 1.25)).toBe(true)
  })

  it("generates linear frames from intercept to slope plus intercept", () => {
    const frames = generateValueFrames({
      ...DEFAULT_VALUE_NODE_CONFIG,
      mode: "linear",
      linearSlope: 2,
      linearIntercept: -1,
    })

    expect(frames[0]).toBeCloseTo(-1, 5)
    expect(frames[Math.floor((FRAMES - 1) / 2)]).toBeCloseTo(0, 1)
    expect(frames[FRAMES - 1]).toBeCloseTo(1, 5)
  })

  it("generates sine frames with expected offset and amplitude", () => {
    const frames = generateValueFrames({
      ...DEFAULT_VALUE_NODE_CONFIG,
      mode: "sine",
      sineAmplitude: 0.5,
      sineOffset: 0.5,
      sineCycles: 1,
      sinePhasePi: -0.5,
    })

    expect(frames[0]).toBeCloseTo(0, 5)
    expect(Math.max(...frames)).toBeCloseTo(1, 2)
    expect(Math.min(...frames)).toBeCloseTo(0, 2)
  })

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

  it("generates deterministic random values within the provided range", () => {
    const framesA = generateValueFrames({
      ...DEFAULT_VALUE_NODE_CONFIG,
      mode: "random",
      randomSeed: 12345,
      randomMin: -2,
      randomMax: 3,
    })
    const framesB = generateValueFrames({
      ...DEFAULT_VALUE_NODE_CONFIG,
      mode: "random",
      randomSeed: 12345,
      randomMin: -2,
      randomMax: 3,
    })

    expect(framesA).toEqual(framesB)
    expect(Math.min(...framesA)).toBeGreaterThanOrEqual(-2)
    expect(Math.max(...framesA)).toBeLessThanOrEqual(3)
  })

  it("normalizes legacy constant frame data", () => {
    const node = normalizeValueNodeData({
      data: new Array(FRAMES).fill(0.75),
    })

    expect(node.mode).toBe("constant")
    expect(node.constantValue).toBe(0.75)
    expect(node.data.every((value) => value === 0.75)).toBe(true)
  })

  it("normalizes legacy linear frame data", () => {
    const data = Array.from({ length: FRAMES }, (_, index) => {
      const ratio = FRAMES <= 1 ? 0 : index / (FRAMES - 1)
      return (1.5 * ratio) - 0.25
    })
    const node = normalizeValueNodeData({ data })

    expect(node.mode).toBe("linear")
    expect(node.linearSlope).toBeCloseTo(1.5, 3)
    expect(node.linearIntercept).toBeCloseTo(-0.25, 3)
  })

  it("normalizes unmatched legacy frame data as random range", () => {
    const node = normalizeValueNodeData({
      data: [0, 1, 0.25, 0.75],
    })

    expect(node.mode).toBe("random")
    expect(node.randomMin).toBe(0)
    expect(node.randomMax).toBe(1)
  })

  it("normalizes legacy sineFrequency and sinePhase values", () => {
    const node = normalizeValueNodeData({
      mode: "sine",
      sineAmplitude: 1,
      sineOffset: 0,
      sineFrequency: 2,
      sinePhase: Math.PI / 2,
    } as Parameters<typeof normalizeValueNodeData>[0])

    expect(node.sineCycles).toBe(2)
    expect(node.sinePhasePi).toBeCloseTo(0.5, 5)
  })

  it("returns defaults for empty normalization input", () => {
    const node = normalizeValueNodeData()

    expect(node.mode).toBe(DEFAULT_VALUE_NODE_CONFIG.mode)
    expect(node.data).toHaveLength(FRAMES)
  })
})