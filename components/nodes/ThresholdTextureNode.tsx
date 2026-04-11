import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import { thresholdTexture, type SerializedTextureData } from "@/lib/texture"
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

type ThresholdTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackThreshold?: number
}

export const ThresholdTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasThresholdInput = useHasNodeInput(id, "inputThreshold")
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const thresholdInput = inputMap.inputThreshold as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as ThresholdTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackThreshold = nodeData.fallbackThreshold ?? 0.5
    const thresholdValues = React.useMemo(() => {
        return thresholdInput?.data ?? createConstantValueFrames(fallbackThreshold)
    }, [fallbackThreshold, thresholdInput?.data])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, {
                texture: thresholdTexture(inputTexture, thresholdValues),
                error: null,
            })
        } catch (thresholdError) {
            setNode(id, {
                texture: null,
                error:
                    thresholdError instanceof Error
                        ? thresholdError.message
                        : "Could not threshold the texture.",
            })
        }
    }, [id, inputTexture, setNode, thresholdValues])

    return (
        <BaseNode className="w-44">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Threshold
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <ValueInputControl
                        handleId="inputThreshold"
                        label="Threshold"
                        hasInput={hasThresholdInput}
                        value={fallbackThreshold}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackThreshold: value })}
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

ThresholdTextureNode.displayName = "ThresholdTextureNode"
