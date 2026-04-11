import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import {
    adjustBrightnessTexture,
    type SerializedTextureData,
} from "@/lib/texture"
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

type BrightnessTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackBrightness?: number
}

export const BrightnessTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasBrightnessInput = useHasNodeInput(id, "inputBrightness")
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const brightnessInput = inputMap.inputBrightness as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as BrightnessTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackBrightness = nodeData.fallbackBrightness ?? 0
    const brightnessValues = React.useMemo(() => {
        return (
            brightnessInput?.data ?? createConstantValueFrames(fallbackBrightness)
        )
    }, [brightnessInput?.data, fallbackBrightness])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, {
                texture: adjustBrightnessTexture(inputTexture, brightnessValues),
                error: null,
            })
        } catch (brightnessError) {
            setNode(id, {
                texture: null,
                error:
                    brightnessError instanceof Error
                        ? brightnessError.message
                        : "Could not adjust brightness.",
            })
        }
    }, [brightnessValues, id, inputTexture, setNode])

    return (
        <BaseNode className="w-44">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Brightness
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <ValueInputControl
                        handleId="inputBrightness"
                        label="Brightness"
                        hasInput={hasBrightnessInput}
                        value={fallbackBrightness}
                        min={-1}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackBrightness: value })}
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

BrightnessTextureNode.displayName = "BrightnessTextureNode"
