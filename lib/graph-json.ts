import { type Edge } from "@xyflow/react"

import {
  getInitialNodeData,
  NODE_TYPE_LABELS,
  type AppNodeType,
} from "@/store/nodes"
import { type AppNode } from "@/store/types"
import { normalizeValueNodeData, type ValueNodeData } from "@/lib/value-node"

export const GRAPH_JSON_VERSION = 1

export type GraphDocument = {
  version: number
  name?: string
  nodes: AppNode[]
  edges: Edge[]
}

type JsonRecord = Record<string, unknown>

const VALUE_NODE_PERSISTED_KEYS = [
  "mode",
  "constantValue",
  "linearSlope",
  "linearIntercept",
  "sineAmplitude",
  "sineCycles",
  "sinePhasePi",
  "sineOffset",
  "sawtoothAmplitude",
  "sawtoothCycles",
  "sawtoothPhasePi",
  "sawtoothOffset",
  "triangleAmplitude",
  "triangleCycles",
  "trianglePhasePi",
  "triangleOffset",
  "squareAmplitude",
  "squareCycles",
  "squarePhasePi",
  "squareOffset",
  "randomSeed",
  "randomMin",
  "randomMax",
] as const

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isAppNodeType(value: unknown): value is AppNodeType {
  return typeof value === "string" && value in NODE_TYPE_LABELS
}

function areJsonValuesEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false
    }

    return left.every((value, index) => areJsonValuesEqual(value, right[index]))
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)

    if (leftKeys.length !== rightKeys.length) {
      return false
    }

    return leftKeys.every((key) => areJsonValuesEqual(left[key], right[key]))
  }

  return false
}

function pickDefinedValues(source: JsonRecord, keys: readonly string[]) {
  return keys.reduce<JsonRecord>((accumulator, key) => {
    if (source[key] !== undefined) {
      accumulator[key] = source[key]
    }

    return accumulator
  }, {})
}

function omitDefaultValues(type: AppNodeType, data: JsonRecord) {
  const initialData = getInitialNodeData(type) as JsonRecord

  return Object.entries(data).reduce<JsonRecord>(
    (accumulator, [key, value]) => {
      if (!areJsonValuesEqual(value, initialData[key])) {
        accumulator[key] = value
      }

      return accumulator
    },
    {}
  )
}

function getPersistentNodeData(type: AppNodeType, data: JsonRecord) {
  switch (type) {
    case "value":
      return pickDefinedValues(data, VALUE_NODE_PERSISTED_KEYS)
    case "texture":
      return pickDefinedValues(data, ["texture"])
    case "colorTexture":
      return pickDefinedValues(data, ["color"])
    case "randomTexture":
      return pickDefinedValues(data, ["mode", "seed", "fallbackRatio"])
    case "gradientTexture":
      return pickDefinedValues(data, [
        "startColor",
        "endColor",
        "startPercentage",
        "endPercentage",
        "angle",
      ])
    case "checkerboardTexture":
      return pickDefinedValues(data, ["colorA", "colorB", "scale"])
    case "radialGradientTexture":
      return pickDefinedValues(data, ["innerColor", "outerColor", "radius"])
    case "sineWaveTexture":
    case "squareWaveTexture":
      return pickDefinedValues(data, [
        "color",
        "cycles",
        "amplitude",
        "thickness",
        "phase",
      ])
    case "radialWaveTexture":
      return pickDefinedValues(data, [
        "color",
        "cycles",
        "thickness",
        "phase",
      ])
    case "connectedTexture":
      return pickDefinedValues(data, ["debug"])
    case "connectedTextureSplit":
    case "connectedTexturePack":
    case "reverseTexture":
    case "invertTexture":
    case "maskTexture":
    case "grayscaleTexture":
    case "channelSplitTexture":
    case "channelCombineTexture":
    case "pingPongTexture":
    case "export":
      return {}
    case "rotateTexture":
    case "swirlTexture":
    case "magnifyTexture":
      return pickDefinedValues(data, ["fallbackValue"])
    case "skewTexture":
      return pickDefinedValues(data, ["fallbackX", "fallbackY"])
    case "flipTexture":
      return pickDefinedValues(data, ["mode"])
    case "translateTexture":
    case "scaleTexture":
      return pickDefinedValues(data, ["fallbackX", "fallbackY"])
    case "cropTexture":
      return pickDefinedValues(data, [
        "fallbackX",
        "fallbackY",
        "fallbackWidth",
        "fallbackHeight",
      ])
    case "tileTexture":
      return pickDefinedValues(data, [
        "mode",
        "fallbackRepeatX",
        "fallbackRepeatY",
      ])
    case "blurTexture":
      return pickDefinedValues(data, ["fallbackBlur"])
    case "contrastTexture":
      return pickDefinedValues(data, ["fallbackContrast"])
    case "thresholdTexture":
      return pickDefinedValues(data, ["fallbackThreshold"])
    case "brightnessTexture":
      return pickDefinedValues(data, ["fallbackBrightness"])
    case "levelsTexture":
      return pickDefinedValues(data, [
        "fallbackBlack",
        "fallbackWhite",
        "fallbackGamma",
      ])
    case "speedTexture":
      return pickDefinedValues(data, ["fallbackSpeed"])
    case "holdTexture":
      return pickDefinedValues(data, ["fallbackHold"])
    case "phaseTexture":
      return pickDefinedValues(data, ["fallbackFrames"])
    case "selectTexture":
      return pickDefinedValues(data, ["fallbackIndex"])
    case "trimTexture":
      return pickDefinedValues(data, ["fallbackStart", "fallbackLength"])
    case "frameBlendTexture":
      return pickDefinedValues(data, ["fallbackBlend"])
    case "hslTexture":
      return pickDefinedValues(data, [
        "fallbackHue",
        "fallbackSaturation",
        "fallbackLightness",
      ])
    case "opacityTexture":
      return pickDefinedValues(data, ["fallbackOpacity"])
    case "mergeTexture":
      return pickDefinedValues(data, ["mode"])
    case "preview":
      return pickDefinedValues(data, ["gridSize", "cells"])
  }
}

function createImportedNodeData(type: AppNodeType, data: unknown) {
  if (type === "value") {
    return normalizeValueNodeData(
      isRecord(data) ? (data as Partial<ValueNodeData>) : undefined
    )
  }

  const persistedData = isRecord(data) ? getPersistentNodeData(type, data) : {}

  return {
    ...getInitialNodeData(type),
    ...persistedData,
  }
}

function sanitizeGraphFileName(name: string) {
  const safeName = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return `${safeName || "graph"}.json`
}

function createGraphFileName(name = "graph", date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  const hours = `${date.getHours()}`.padStart(2, "0")
  const minutes = `${date.getMinutes()}`.padStart(2, "0")
  const seconds = `${date.getSeconds()}`.padStart(2, "0")

  return sanitizeGraphFileName(
    `${name}-v${GRAPH_JSON_VERSION}-${year}${month}${day}-${hours}${minutes}${seconds}`
  )
}

function parseNode(node: unknown, index: number): AppNode {
  if (!isRecord(node)) {
    throw new Error(`Node ${index} must be an object.`)
  }

  const { id, type, position, data } = node

  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`Node ${index} is missing a valid id.`)
  }

  if (!isAppNodeType(type)) {
    throw new Error(`Node ${id} has an unknown type.`)
  }

  if (
    !isRecord(position) ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    throw new Error(`Node ${id} is missing a valid position.`)
  }

  return {
    id,
    type,
    position: { x: position.x, y: position.y },
    data: createImportedNodeData(type, data),
  } as AppNode
}

function parseEdge(edge: unknown, index: number): Edge {
  if (!isRecord(edge)) {
    throw new Error(`Edge ${index} must be an object.`)
  }

  const {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type,
    animated,
    label,
    data,
  } = edge

  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`Edge ${index} is missing a valid id.`)
  }

  if (
    typeof source !== "string" ||
    source.length === 0 ||
    typeof target !== "string" ||
    target.length === 0
  ) {
    throw new Error(`Edge ${id} is missing a valid source or target.`)
  }

  return {
    id,
    source,
    target,
    ...(typeof sourceHandle === "string" ? { sourceHandle } : {}),
    ...(typeof targetHandle === "string" ? { targetHandle } : {}),
    ...(typeof type === "string" ? { type } : {}),
    ...(typeof animated === "boolean" ? { animated } : {}),
    ...(typeof label === "string" || typeof label === "number"
      ? { label }
      : {}),
    ...(isRecord(data) ? { data } : {}),
  }
}

function sanitizeNode(node: AppNode): AppNode {
  const rawData = isRecord(node.data) ? node.data : {}
  const data = omitDefaultValues(
    node.type as AppNodeType,
    getPersistentNodeData(node.type as AppNodeType, rawData)
  )

  return {
    id: node.id,
    type: node.type,
    position: {
      x: node.position.x,
      y: node.position.y,
    },
    data,
  } as AppNode
}

function sanitizeEdge(edge: Edge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
    ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {}),
    ...(edge.type ? { type: edge.type } : {}),
    ...(edge.animated !== undefined ? { animated: edge.animated } : {}),
    ...(edge.label !== undefined ? { label: edge.label } : {}),
    ...(edge.data !== undefined ? { data: edge.data } : {}),
  }
}

export function createGraphDocument(
  nodes: AppNode[],
  edges: Edge[],
  name = "graph"
): GraphDocument {
  return {
    version: GRAPH_JSON_VERSION,
    name,
    nodes: nodes.map(sanitizeNode),
    edges: edges.map(sanitizeEdge),
  }
}

export function parseGraphDocument(raw: unknown): GraphDocument {
  if (!isRecord(raw)) {
    throw new Error("Graph JSON must be an object.")
  }

  if (!("version" in raw)) {
    throw new Error("Graph JSON must include a version field.")
  }

  if (typeof raw.version !== "number") {
    throw new Error("Graph JSON version must be a number.")
  }

  if (raw.version !== GRAPH_JSON_VERSION) {
    throw new Error(
      `Unsupported graph JSON version ${raw.version}. Expected version ${GRAPH_JSON_VERSION}.`
    )
  }

  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    throw new Error("Graph JSON must include nodes and edges arrays.")
  }

  const nodes = raw.nodes.map((node, index) => parseNode(node, index))
  const edges = raw.edges.map((edge, index) => parseEdge(edge, index))
  const nodeIds = new Set(nodes.map((node) => node.id))

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Edge ${edge.id} references a missing node.`)
    }
  }

  return {
    version: GRAPH_JSON_VERSION,
    name: typeof raw.name === "string" ? raw.name : undefined,
    nodes,
    edges,
  }
}

export function downloadGraphDocument(graphDocument: GraphDocument) {
  const blob = new Blob([JSON.stringify(graphDocument, null, 2)], {
    type: "application/json",
  })
  const objectUrl = URL.createObjectURL(blob)
  const link = window.document.createElement("a")

  link.href = objectUrl
  link.download = createGraphFileName(graphDocument.name)
  link.click()

  URL.revokeObjectURL(objectUrl)
}
