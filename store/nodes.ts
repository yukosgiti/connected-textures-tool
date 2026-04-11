import { createValueNodeData } from "../lib/value-node";

import { AppNode } from "./types";

export const NODE_TYPE_LABELS = {
  value: "Value",
  texture: "Texture",
  colorTexture: "Color Texture",
  randomTexture: "Random Texture",
  connectedTexture: "Connected Texture",
  connectedTextureSplit: "Connected Texture Split",
  connectedTexturePack: "Textures To Connected Texture",
  rotateTexture: "Rotate Texture",
  translateTexture: "Translate Texture",
  scaleTexture: "Scale Texture",
  reverseTexture: "Reverse Frames",
  speedTexture: "Frame Speed",
  holdTexture: "Hold Frames",
  phaseTexture: "Phase Frames",
  selectTexture: "Select Frame",
  hslTexture: "HSL Texture",
  invertTexture: "Invert Texture",
  opacityTexture: "Opacity Texture",
  mergeTexture: "Merge Texture",
  maskTexture: "Mask Texture",
  preview: "Preview",
  export: "Export",
} as const;

export type AppNodeType = keyof typeof NODE_TYPE_LABELS;

export const DEFAULT_PREVIEW_GRID_SIZE = 8;

function getPreviewCenterIndex(size: number) {
  const center = Math.floor((size - 1) / 2);
  return center * size + center;
}

function createNodeId(type: AppNodeType) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${type}-${crypto.randomUUID()}`;
  }

  return `${type}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

export function createDefaultPreviewCells(size = DEFAULT_PREVIEW_GRID_SIZE) {
  const cells = new Array(size * size).fill(false);
  cells[getPreviewCenterIndex(size)] = true;
  return cells;
}

export function getInitialNodeData(type: AppNodeType) {
  switch (type) {
    case "value":
      return createValueNodeData();
    case "texture":
      return { texture: null, error: null };
    case "colorTexture":
      return { texture: null, error: null, color: "#3b82f6" };
    case "randomTexture":
      return { texture: null, error: null, mode: "grayscale" };
    case "connectedTexture":
      return { texture: null, outputTextures: {}, error: null, debug: false };
    case "connectedTextureSplit":
      return { texture: null, outputTextures: {}, error: null };
    case "connectedTexturePack":
      return { texture: null, outputTextures: {}, error: null };
    case "rotateTexture":
      return { texture: null, error: null, fallbackValue: 0 };
    case "translateTexture":
      return { texture: null, error: null, fallbackX: 0, fallbackY: 0 };
    case "scaleTexture":
      return { texture: null, error: null, fallbackX: 0, fallbackY: 0 };
    case "reverseTexture":
      return { texture: null, error: null };
    case "speedTexture":
      return { texture: null, error: null, fallbackSpeed: 1 };
    case "holdTexture":
      return { texture: null, error: null, fallbackHold: 1 };
    case "phaseTexture":
      return { texture: null, error: null, fallbackFrames: 0 };
    case "selectTexture":
      return { texture: null, error: null, fallbackIndex: 0 };
    case "hslTexture":
      return { texture: null, error: null, fallbackHue: 0, fallbackSaturation: 0, fallbackLightness: 0 };
    case "invertTexture":
      return { texture: null, error: null };
    case "opacityTexture":
      return { texture: null, error: null, fallbackOpacity: 1 };
    case "mergeTexture":
      return { texture: null, error: null, mode: "normal" };
    case "maskTexture":
      return { texture: null, error: null };
    case "preview":
      return {
        texture: null,
        gridSize: DEFAULT_PREVIEW_GRID_SIZE,
        cells: createDefaultPreviewCells(DEFAULT_PREVIEW_GRID_SIZE),
        error: null,
      };
    case "export":
      return { error: null };
  }
}

export function createNode(type: AppNodeType, position: { x: number; y: number }): AppNode {
  return {
    id: createNodeId(type),
    type,
    position,
    data: getInitialNodeData(type),
  } as AppNode;
}

export const initialNodes = [
  { id: 'n1', type: 'value', position: { x: 0, y: 0 }, data: getInitialNodeData('value') },
  { id: 'n2', type: 'value', position: { x: 0, y: 100 }, data: getInitialNodeData('value') },
  { id: 'n3', type: 'texture', position: { x: 300, y: 50 }, data: getInitialNodeData('texture') },
  {
    id: 'n4', type: 'rotateTexture', position: { x: 600, y: 50 }, data: getInitialNodeData('rotateTexture')
  }
] as AppNode[];