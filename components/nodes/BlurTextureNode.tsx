import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { resolveNodeOutputData, useNodeData } from "@/hooks/store"
import { blurTexture, type SerializedTextureData } from "@/lib/texture"
import { createConstantValueFrames } from "@/lib/utils"
import useStore from "@/store/graph"
import { Image01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Handle, Position } from "@xyflow/react"
import React from "react"
import { EmptyTexture, TexturePreview } from "../EmptyTexture"
import { ValueFallbackSlider } from "./ValueFallbackSlider"

type Props = {
    id: string
}

type TextureNodeData = {
    texture?: SerializedTextureData | null
}

type ValueNodeData = {
    data?: number[]
}

type BlurTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackBlur?: number
}

export const BlurTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const setNode = useStore((store) => store.setNode)
    const nodes = useStore((store) => store.nodes)
    const edges = useStore((store) => store.edges)
    const inputMap = React.useMemo(() => {
        return edges
            .filter((edge) => edge.target === id)
            .reduce<Record<string, unknown>>((accumulator, edge) => {
                const sourceNode = nodes.find(
                    (nodeEntry) => nodeEntry.id === edge.source
                )

                if (sourceNode && edge.targetHandle) {
                    accumulator[edge.targetHandle] = resolveNodeOutputData(
                        sourceNode.data,
                        edge.sourceHandle
                    )
                }

                return accumulator
            }, {})
    }, [edges, id, nodes])
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const blurInput = inputMap.inputBlur as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as BlurTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackBlur = nodeData.fallbackBlur ?? 0
    const hasBlurInput = React.useMemo(() => {
        return edges.some(
            (edge) => edge.target === id && edge.targetHandle === "inputBlur"
        )
    }, [edges, id])
    const blurValues = React.useMemo(() => {
        return blurInput?.data ?? createConstantValueFrames(fallbackBlur)
    }, [blurInput?.data, fallbackBlur])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            const nextTexture = blurTexture(inputTexture, blurValues)
            setNode(id, { texture: nextTexture, error: null })
        } catch (blurError) {
            const message =
                blurError instanceof Error
                    ? blurError.message
                    : "Could not blur the texture."

            setNode(id, { texture: null, error: message })
        }
    }, [blurValues, id, inputTexture, setNode])

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Blur
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    {hasBlurInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle
                                type="target"
                                position={Position.Left}
                                id="inputBlur"
                                className="-left-3! size-3! border-orange-300! bg-orange-500!"
                                data-type="value"
                            />
                            Blur
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle
                                type="target"
                                position={Position.Left}
                                id="inputBlur"
                                className="top-1/2! -left-3! size-3! -translate-y-1/2 border-orange-300! bg-orange-500!"
                                data-type="value"
                            />
                            <ValueFallbackSlider
                                label="Blur"
                                value={fallbackBlur}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackBlur: value })}
                            />
                        </div>
                    )}
                </div>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="inputTexture"
                    className="top-8! size-3! border-blue-300! bg-blue-500!"
                    data-type="texture"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="outputTexture"
                    className="top-8! size-3! border-blue-300! bg-blue-500!"
                    data-type="texture"
                />
            </BaseNodeContent>
        </BaseNode>
    )
})

BlurTextureNode.displayName = "BlurTextureNode"
