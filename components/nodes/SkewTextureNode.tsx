import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import { skewTexture, type SerializedTextureData } from "@/lib/texture"
import { createConstantValueFrames } from "@/lib/utils"
import useStore from "@/store/graph"
import { Image01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Handle, Position } from "@xyflow/react"
import React from "react"

import { ValueInputControl } from "./ValueInputControl"

type Props = {
    id: string
}

type TextureNodeData = {
    texture?: SerializedTextureData | null
}

type ValueNodeData = {
    data?: number[]
}

type SkewTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackX?: number
    fallbackY?: number
}

export const SkewTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasXInput = useHasNodeInput(id, "inputX")
    const hasYInput = useHasNodeInput(id, "inputY")
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const xInput = inputMap.inputX as ValueNodeData | undefined
    const yInput = inputMap.inputY as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as SkewTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackX = nodeData.fallbackX ?? 0
    const fallbackY = nodeData.fallbackY ?? 0
    const xValues = React.useMemo(() => {
        return xInput?.data ?? createConstantValueFrames(fallbackX)
    }, [fallbackX, xInput?.data])
    const yValues = React.useMemo(() => {
        return yInput?.data ?? createConstantValueFrames(fallbackY)
    }, [fallbackY, yInput?.data])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, {
                texture: skewTexture(inputTexture, xValues, yValues),
                error: null,
            })
        } catch (skewError) {
            setNode(id, {
                texture: null,
                error:
                    skewError instanceof Error
                        ? skewError.message
                        : "Could not skew the texture.",
            })
        }
    }, [id, inputTexture, setNode, xValues, yValues])

    return (
        <BaseNode className="w-48">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Skew Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <ValueInputControl
                        handleId="inputX"
                        label="Skew X"
                        hasInput={hasXInput}
                        value={fallbackX}
                        min={-1}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackX: value })}
                    />
                    <ValueInputControl
                        handleId="inputY"
                        label="Skew Y"
                        hasInput={hasYInput}
                        value={fallbackY}
                        min={-1}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackY: value })}
                    />
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

SkewTextureNode.displayName = "SkewTextureNode"
