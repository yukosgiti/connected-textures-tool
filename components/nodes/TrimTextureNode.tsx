import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import { trimTexture, type SerializedTextureData } from "@/lib/texture"
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

type TrimTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackStart?: number
    fallbackLength?: number
}

export const TrimTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasStartInput = useHasNodeInput(id, "inputStart")
    const hasLengthInput = useHasNodeInput(id, "inputLength")
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const startInput = inputMap.inputStart as ValueNodeData | undefined
    const lengthInput = inputMap.inputLength as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as TrimTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackStart = nodeData.fallbackStart ?? 0
    const fallbackLength = nodeData.fallbackLength ?? 60
    const startValues = React.useMemo(() => {
        return startInput?.data ?? createConstantValueFrames(fallbackStart)
    }, [fallbackStart, startInput?.data])
    const lengthValues = React.useMemo(() => {
        return lengthInput?.data ?? createConstantValueFrames(fallbackLength)
    }, [fallbackLength, lengthInput?.data])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, {
                texture: trimTexture(inputTexture, startValues, lengthValues),
                error: null,
            })
        } catch (trimError) {
            setNode(id, {
                texture: null,
                error:
                    trimError instanceof Error
                        ? trimError.message
                        : "Could not trim the texture.",
            })
        }
    }, [id, inputTexture, lengthValues, setNode, startValues])

    return (
        <BaseNode className="w-48">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Trim Frames
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <ValueInputControl
                        handleId="inputStart"
                        label="Start"
                        hasInput={hasStartInput}
                        value={fallbackStart}
                        min={0}
                        max={59}
                        step={1}
                        onChange={(value) => setNode(id, { fallbackStart: value })}
                    />
                    <ValueInputControl
                        handleId="inputLength"
                        label="Length"
                        hasInput={hasLengthInput}
                        value={fallbackLength}
                        min={1}
                        max={60}
                        step={1}
                        onChange={(value) => setNode(id, { fallbackLength: value })}
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

TrimTextureNode.displayName = "TrimTextureNode"
