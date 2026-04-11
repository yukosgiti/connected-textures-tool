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

export const useNodeInputs = (id: string) => {
  const nodes = useStore((store) => store.nodes)
  const edges = useStore((store) => store.edges)
  const inputs = React.useMemo(
    () =>
      edges
        .filter((edge) => edge.target === id)
        .map((edge) => {
          const sourceNode = nodes.find((node) => node.id === edge.source)
          return sourceNode
            ? resolveNodeOutputData(sourceNode.data, edge.sourceHandle)
            : null
        })
        .filter((data) => data !== null),
    [edges, id, nodes]
  )
  return inputs
}

export const useNodeInputMap = (id: string) => {
  const nodes = useStore((store) => store.nodes)
  const edges = useStore((store) => store.edges)

  return React.useMemo(() => {
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
  }, [edges, id, nodes])
}

export const useHasNodeInput = (id: string, handleId: string) => {
  const edges = useStore((store) => store.edges)

  return React.useMemo(() => {
    return edges.some(
      (edge) => edge.target === id && edge.targetHandle === handleId
    )
  }, [edges, handleId, id])
}

export const useNodeOutputs = (id: string) => {
  const nodes = useStore((store) => store.nodes)
  const edges = useStore((store) => store.edges)
  const outputs = React.useMemo(
    () =>
      edges
        .filter((edge) => edge.source === id)
        .map((edge) => {
          const targetNode = nodes.find((node) => node.id === edge.target)
          return targetNode ? targetNode.data : null
        })
        .filter((data) => data !== null),
    [edges, id, nodes]
  )
  return outputs
}
