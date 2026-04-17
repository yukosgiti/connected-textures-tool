import React from "react"

import { CONNECTED_TEXTURE_OUTPUT_HANDLE_ID } from "@/lib/connected-texture"
import { type SerializedTextureData } from "@/lib/texture"
import useStore from "@/store/graph"

type TextureOutputNodeData = {
  texture?: SerializedTextureData | null
  outputTextures?: Record<string, SerializedTextureData | null>
}

export const resolveNodeOutputData = <T>(
  nodeData: T,
  sourceHandle?: string | null
): T => {
  if (!sourceHandle || typeof nodeData !== "object" || nodeData === null) {
    return nodeData
  }

  if (sourceHandle === CONNECTED_TEXTURE_OUTPUT_HANDLE_ID) {
    return nodeData
  }

  const textureNodeData = nodeData as TextureOutputNodeData

  if (!textureNodeData.outputTextures) {
    return nodeData
  }

  return {
    ...textureNodeData,
    texture:
      textureNodeData.outputTextures[sourceHandle] ??
      textureNodeData.texture ??
      null,
  } as T
}

export const useNodeData = (id: string) => {
  const nodeData = useStore((store) =>
    store.nodes.find((node) => node.id === id)
  )
  return nodeData
}

function areArraysShallowEqual<T>(left: readonly T[], right: readonly T[]) {
  if (left === right) {
    return true
  }

  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false
    }
  }

  return true
}

function areInputMapsShallowEqual(
  left: Record<string, unknown>,
  right: Record<string, unknown>
) {
  if (left === right) {
    return true
  }

  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  for (const key of leftKeys) {
    if (!(key in right) || left[key] !== right[key]) {
      return false
    }
  }

  return true
}

function getNodeInputs(
  nodes: ReturnType<typeof useStore.getState>["nodes"],
  edges: ReturnType<typeof useStore.getState>["edges"],
  id: string
) {
  return edges
    .filter((edge) => edge.target === id)
    .map((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source)
      return sourceNode
        ? resolveNodeOutputData(sourceNode.data, edge.sourceHandle)
        : null
    })
    .filter((data) => data !== null)
}

function getNodeInputMap(
  nodes: ReturnType<typeof useStore.getState>["nodes"],
  edges: ReturnType<typeof useStore.getState>["edges"],
  id: string
) {
  return edges
    .filter((edge) => edge.target === id)
    .reduce<Record<string, unknown>>((accumulator, edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source)

      if (sourceNode && edge.targetHandle) {
        accumulator[edge.targetHandle] = resolveNodeOutputData(
          sourceNode.data,
          edge.sourceHandle
        )
      }

      return accumulator
    }, {})
}

function getNodeOutputs(
  nodes: ReturnType<typeof useStore.getState>["nodes"],
  edges: ReturnType<typeof useStore.getState>["edges"],
  id: string
) {
  return edges
    .filter((edge) => edge.source === id)
    .map((edge) => {
      const targetNode = nodes.find((node) => node.id === edge.target)
      return targetNode ? targetNode.data : null
    })
    .filter((data) => data !== null)
}

export const useNodeInputs = (id: string) => {
  const nodes = useStore((store) => store.nodes)
  const edges = useStore((store) => store.edges)
  const inputs = React.useMemo(
    () => getNodeInputs(nodes, edges, id),
    [edges, id, nodes]
  )

  const cachedInputs = React.useRef(inputs)

  if (!areArraysShallowEqual(cachedInputs.current, inputs)) {
    cachedInputs.current = inputs
  }

  return cachedInputs.current
}

export const useNodeInputMap = (id: string) => {
  const nodes = useStore((store) => store.nodes)
  const edges = useStore((store) => store.edges)
  const inputMap = React.useMemo(
    () => getNodeInputMap(nodes, edges, id),
    [edges, id, nodes]
  )

  const cachedInputMap = React.useRef(inputMap)

  if (!areInputMapsShallowEqual(cachedInputMap.current, inputMap)) {
    cachedInputMap.current = inputMap
  }

  return cachedInputMap.current
}

export const useHasNodeInput = (id: string, handleId: string) => {
  return useStore((store) => {
    return store.edges.some(
      (edge) => edge.target === id && edge.targetHandle === handleId
    )
  })
}

export const useNodeOutputs = (id: string) => {
  const nodes = useStore((store) => store.nodes)
  const edges = useStore((store) => store.edges)
  const outputs = React.useMemo(
    () => getNodeOutputs(nodes, edges, id),
    [edges, id, nodes]
  )

  const cachedOutputs = React.useRef(outputs)

  if (!areArraysShallowEqual(cachedOutputs.current, outputs)) {
    cachedOutputs.current = outputs
  }

  return cachedOutputs.current
}
