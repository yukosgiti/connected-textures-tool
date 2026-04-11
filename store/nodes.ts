import { ZERO_VALUE_FRAMES } from "@/lib/utils";

import { AppNode } from "./types";

export const NODE_TYPE_LABELS = {
  value: "Value",
  texture: "Texture",
  rotateTexture: "Rotate Texture",
  preview: "Preview",
} as const;

export type AppNodeType = keyof typeof NODE_TYPE_LABELS;

const PREVIEW_GRID_SIZE = 8;
const PREVIEW_CENTER_INDEX = (PREVIEW_GRID_SIZE / 2 - 1) * PREVIEW_GRID_SIZE + (PREVIEW_GRID_SIZE / 2 - 1);

function createNodeId(type: AppNodeType) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${type}-${crypto.randomUUID()}`;
  }

  return `${type}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

export function createDefaultPreviewCells() {
  const cells = new Array(PREVIEW_GRID_SIZE * PREVIEW_GRID_SIZE).fill(false);
  cells[PREVIEW_CENTER_INDEX] = true;
  return cells;
}

export function getInitialNodeData(type: AppNodeType) {
  switch (type) {
    case "value":
      return { data: Array.from(ZERO_VALUE_FRAMES) };
    case "texture":
      return { texture: null, error: null };
    case "rotateTexture":
      return { texture: null, error: null };
    case "preview":
      return { texture: null, cells: createDefaultPreviewCells(), error: null };
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