import { createValueNodeData } from "../lib/value-node"

import { AppNode } from "./types"

export const NODE_TYPE_LABELS = {
  value: "Value",
  texture: "Texture",
  colorTexture: "Color Texture",
  randomTexture: "Random Texture",
  gradientTexture: "Gradient Texture",
  checkerboardTexture: "Checkerboard Texture",
  radialGradientTexture: "Radial Gradient Texture",
  sineWaveTexture: "Sine Wave Texture",
  squareWaveTexture: "Square Wave Texture",
  radialWaveTexture: "Radial Wave Texture",
  connectedTexture: "Connected Texture",
  connectedTextureSplit: "Connected Texture Split",
  connectedTexturePack: "Textures To Connected Texture",
  rotateTexture: "Rotate Texture",
  swirlTexture: "Swirl Texture",
  skewTexture: "Skew Texture",
  flipTexture: "Flip Texture",
  translateTexture: "Offset Texture",
  scaleTexture: "Scale Texture",
  magnifyTexture: "Magnify / Shrink",
  cropTexture: "Crop Texture",
  tileTexture: "Tile Texture",
  blurTexture: "Blur",
  contrastTexture: "Contrast",
  thresholdTexture: "Threshold",
  brightnessTexture: "Brightness",
  levelsTexture: "Levels",
  grayscaleTexture: "Grayscale",
  reverseTexture: "Reverse Frames",
  speedTexture: "Frame Speed",
  holdTexture: "Hold Frames",
  phaseTexture: "Phase Frames",
  selectTexture: "Select Frame",
  pingPongTexture: "Ping-Pong Frames",
  trimTexture: "Trim Frames",
  frameBlendTexture: "Frame Blend",
  hslTexture: "HSL",
  invertTexture: "Invert Colors",
  opacityTexture: "Opacity",
  mergeTexture: "Blend Textures",
  maskTexture: "Apply Mask",
  channelSplitTexture: "Channel Split",
  channelCombineTexture: "Channel Combine",
  preview: "Preview Node",
  export: "Export Node",
} as const

export type AppNodeType = keyof typeof NODE_TYPE_LABELS

export const DEFAULT_PREVIEW_GRID_SIZE = 8

function getPreviewCenterIndex(size: number) {
  const center = Math.floor((size - 1) / 2)
  return center * size + center
}

function createNodeId(type: AppNodeType) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${type}-${crypto.randomUUID()}`
  }

  return `${type}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`
}

export function createDefaultPreviewCells(size = DEFAULT_PREVIEW_GRID_SIZE) {
  const cells = new Array(size * size).fill(false)
  cells[getPreviewCenterIndex(size)] = true
  return cells
}

export function getInitialNodeData(type: AppNodeType) {
  switch (type) {
    case "value":
      return createValueNodeData()
    case "texture":
      return { texture: null, error: null }
    case "colorTexture":
      return { texture: null, error: null, color: "#3b82f6" }
    case "randomTexture":
      return { texture: null, error: null, mode: "grayscale", fallbackRatio: 1 }
    case "gradientTexture":
      return {
        texture: null,
        error: null,
        startColor: "#0ea5e9",
        endColor: "#f97316",
        startPercentage: 0,
        endPercentage: 100,
        angle: 0,
      }
    case "checkerboardTexture":
      return {
        texture: null,
        error: null,
        colorA: "#111827",
        colorB: "#f8fafc",
        scale: 4,
      }
    case "radialGradientTexture":
      return {
        texture: null,
        error: null,
        innerColor: "#f8fafc",
        outerColor: "#0f172a",
        radius: 1,
      }
    case "sineWaveTexture":
      return {
        texture: null,
        error: null,
        color: "#f97316",
        cycles: 1,
        amplitude: 5,
        thickness: 2,
        phase: 0,
      }
    case "squareWaveTexture":
      return {
        texture: null,
        error: null,
        color: "#f97316",
        cycles: 1,
        amplitude: 5,
        thickness: 2,
        phase: 0,
      }
    case "radialWaveTexture":
      return {
        texture: null,
        error: null,
        color: "#ffffff",
        cycles: 4,
        thickness: 1.25,
        phase: 0,
      }
    case "connectedTexture":
      return { texture: null, outputTextures: {}, error: null, debug: false }
    case "connectedTextureSplit":
      return { texture: null, outputTextures: {}, error: null }
    case "connectedTexturePack":
      return { texture: null, outputTextures: {}, error: null }
    case "rotateTexture":
      return { texture: null, error: null, fallbackValue: 0 }
    case "swirlTexture":
      return { texture: null, error: null, fallbackValue: 0 }
    case "skewTexture":
      return { texture: null, error: null, fallbackX: 0, fallbackY: 0 }
    case "flipTexture":
      return { texture: null, error: null, mode: "horizontal" }
    case "translateTexture":
      return { texture: null, error: null, fallbackX: 0, fallbackY: 0 }
    case "scaleTexture":
      return { texture: null, error: null, fallbackX: 0, fallbackY: 0 }
    case "magnifyTexture":
      return { texture: null, error: null, fallbackValue: 0 }
    case "cropTexture":
      return {
        texture: null,
        error: null,
        fallbackX: 0,
        fallbackY: 0,
        fallbackWidth: 1,
        fallbackHeight: 1,
      }
    case "tileTexture":
      return {
        texture: null,
        error: null,
        mode: "repeat",
        fallbackRepeatX: 1,
        fallbackRepeatY: 1,
      }
    case "blurTexture":
      return { texture: null, error: null, fallbackBlur: 0 }
    case "contrastTexture":
      return { texture: null, error: null, fallbackContrast: 0 }
    case "thresholdTexture":
      return { texture: null, error: null, fallbackThreshold: 0.5 }
    case "brightnessTexture":
      return { texture: null, error: null, fallbackBrightness: 0 }
    case "levelsTexture":
      return {
        texture: null,
        error: null,
        fallbackBlack: 0,
        fallbackWhite: 1,
        fallbackGamma: 1,
      }
    case "grayscaleTexture":
      return { texture: null, error: null }
    case "reverseTexture":
      return { texture: null, error: null }
    case "speedTexture":
      return { texture: null, error: null, fallbackSpeed: 1 }
    case "holdTexture":
      return { texture: null, error: null, fallbackHold: 1 }
    case "phaseTexture":
      return { texture: null, error: null, fallbackFrames: 0 }
    case "selectTexture":
      return { texture: null, error: null, fallbackIndex: 0 }
    case "pingPongTexture":
      return { texture: null, error: null }
    case "trimTexture":
      return {
        texture: null,
        error: null,
        fallbackStart: 0,
        fallbackLength: 60,
      }
    case "frameBlendTexture":
      return { texture: null, error: null, fallbackBlend: 0.5 }
    case "hslTexture":
      return {
        texture: null,
        error: null,
        fallbackHue: 0,
        fallbackSaturation: 0,
        fallbackLightness: 0,
      }
    case "invertTexture":
      return { texture: null, error: null }
    case "opacityTexture":
      return { texture: null, error: null, fallbackOpacity: 1 }
    case "mergeTexture":
      return { texture: null, error: null, mode: "normal" }
    case "maskTexture":
      return { texture: null, error: null }
    case "channelSplitTexture":
      return { texture: null, outputTextures: {}, error: null }
    case "channelCombineTexture":
      return { texture: null, error: null }
    case "preview":
      return {
        texture: null,
        gridSize: DEFAULT_PREVIEW_GRID_SIZE,
        cells: createDefaultPreviewCells(DEFAULT_PREVIEW_GRID_SIZE),
        error: null,
      }
    case "export":
      return { error: null }
  }
}

export function createNode(
  type: AppNodeType,
  position: { x: number; y: number }
): AppNode {
  return {
    id: createNodeId(type),
    type,
    position,
    data: getInitialNodeData(type),
  } as AppNode
}

export const initialNodes = [
  {
    id: "n1",
    type: "value",
    position: { x: 0, y: 0 },
    data: getInitialNodeData("value"),
  },
  {
    id: "n2",
    type: "value",
    position: { x: 0, y: 100 },
    data: getInitialNodeData("value"),
  },
  {
    id: "n3",
    type: "texture",
    position: { x: 300, y: 50 },
    data: getInitialNodeData("texture"),
  },
  {
    id: "n4",
    type: "rotateTexture",
    position: { x: 600, y: 50 },
    data: getInitialNodeData("rotateTexture"),
  },
] as AppNode[]
