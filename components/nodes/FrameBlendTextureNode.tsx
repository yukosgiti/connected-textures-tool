import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import { frameBlendTexture, type SerializedTextureData } from "@/lib/texture"
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

type FrameBlendTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackBlend?: number
}

export const FrameBlendTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasBlendInput = useHasNodeInput(id, "inputBlendAmount")
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const blendInput = inputMap.inputBlendAmount as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as FrameBlendTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackBlend = nodeData.fallbackBlend ?? 0.5
    const blendValues = React.useMemo(() => {
        return blendInput?.data ?? createConstantValueFrames(fallbackBlend)
    }, [blendInput?.data, fallbackBlend])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, {
                texture: frameBlendTexture(inputTexture, blendValues),
                error: null,
            })
        } catch (blendError) {
            setNode(id, {
                texture: null,
                error:
                    blendError instanceof Error
                        ? blendError.message
                        : "Could not blend neighboring frames.",
            })
        }
    }, [blendValues, id, inputTexture, setNode])

    return (
        <BaseNode className="w-44">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Frame Blend
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <ValueInputControl
                        handleId="inputBlendAmount"
                        label="Blend"
                        hasInput={hasBlendInput}
                        value={fallbackBlend}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackBlend: value })}
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

FrameBlendTextureNode.displayName = "FrameBlendTextureNode"
