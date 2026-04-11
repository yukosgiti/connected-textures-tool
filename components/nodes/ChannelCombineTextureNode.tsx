import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useNodeData, useNodeInputMap } from "@/hooks/store"
import {
    combineTextureChannels,
    type SerializedTextureData,
} from "@/lib/texture"
import useStore from "@/store/graph"
import { Image01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Handle, Position } from "@xyflow/react"
import React from "react"

type Props = {
    id: string
}

type TextureNodeData = {
    texture?: SerializedTextureData | null
}

type ChannelCombineTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
}

const CHANNEL_INPUTS = [
    { handleId: "inputRed", label: "Red" },
    { handleId: "inputGreen", label: "Green" },
    { handleId: "inputBlue", label: "Blue" },
    { handleId: "inputAlpha", label: "Alpha" },
] as const

export const ChannelCombineTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const setNode = useStore((store) => store.setNode)
    const redInput = inputMap.inputRed as TextureNodeData | undefined
    const greenInput = inputMap.inputGreen as TextureNodeData | undefined
    const blueInput = inputMap.inputBlue as TextureNodeData | undefined
    const alphaInput = inputMap.inputAlpha as TextureNodeData | undefined
    const nodeData =
        (node?.data as ChannelCombineTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null

    React.useEffect(() => {
        const inputs = {
            red: redInput?.texture ?? null,
            green: greenInput?.texture ?? null,
            blue: blueInput?.texture ?? null,
            alpha: alphaInput?.texture ?? null,
        }

        if (!inputs.red && !inputs.green && !inputs.blue && !inputs.alpha) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, { texture: combineTextureChannels(inputs), error: null })
        } catch (combineError) {
            setNode(id, {
                texture: null,
                error:
                    combineError instanceof Error
                        ? combineError.message
                        : "Could not combine texture channels.",
            })
        }
    }, [
        alphaInput?.texture,
        blueInput?.texture,
        greenInput?.texture,
        id,
        redInput?.texture,
        setNode,
    ])

    return (
        <BaseNode className="w-48">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Channel Combine
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                </div>
                {CHANNEL_INPUTS.map((input) => (
                    <div
                        key={input.handleId}
                        className="relative text-xs text-secondary-foreground"
                    >
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={input.handleId}
                            className="-left-3! size-3! border-blue-300! bg-blue-500!"
                            data-type="texture"
                        />
                        {input.label}
                    </div>
                ))}
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

ChannelCombineTextureNode.displayName = "ChannelCombineTextureNode"
