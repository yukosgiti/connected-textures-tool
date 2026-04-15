import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import { magnifyTexture, type SerializedTextureData } from "@/lib/texture"
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

type MagnifyTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackValue?: number
}

export const MagnifyTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasValueInput = useHasNodeInput(id, "inputValue")
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const valueInput = inputMap.inputValue as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as MagnifyTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackValue = nodeData.fallbackValue ?? 0
    const magnifyValues = React.useMemo(() => {
        return valueInput?.data ?? createConstantValueFrames(fallbackValue)
    }, [fallbackValue, valueInput?.data])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, {
                texture: magnifyTexture(inputTexture, magnifyValues),
                error: null,
            })
        } catch (magnifyError) {
            setNode(id, {
                texture: null,
                error:
                    magnifyError instanceof Error
                        ? magnifyError.message
                        : "Could not magnify the texture.",
            })
        }
    }, [id, inputTexture, magnifyValues, setNode])

    return (
        <BaseNode className="w-48">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Magnify / Shrink
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <ValueInputControl
                        handleId="inputValue"
                        label="Amount"
                        hasInput={hasValueInput}
                        value={fallbackValue}
                        min={-1}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackValue: value })}
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

MagnifyTextureNode.displayName = "MagnifyTextureNode"