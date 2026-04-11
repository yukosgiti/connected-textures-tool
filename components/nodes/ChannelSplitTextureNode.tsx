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
    splitTextureChannels,
    TEXTURE_CHANNEL_OUTPUTS,
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

type ChannelSplitTextureNodeData = {
    texture?: SerializedTextureData | null
    outputTextures?: Record<string, SerializedTextureData | null>
    error?: string | null
}

export const ChannelSplitTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as ChannelSplitTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const outputTextures = nodeData.outputTextures ?? {}
    const error = nodeData.error ?? null

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, outputTextures: {}, error: null })
            return
        }

        try {
            setNode(id, {
                texture: inputTexture,
                outputTextures: splitTextureChannels(inputTexture),
                error: null,
            })
        } catch (splitError) {
            setNode(id, {
                texture: null,
                outputTextures: {},
                error:
                    splitError instanceof Error
                        ? splitError.message
                        : "Could not split texture channels.",
            })
        }
    }, [id, inputTexture, setNode])

    return (
        <BaseNode className="w-72">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Channel Split
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <div className="nodrag flex flex-col gap-1.5 pr-1">
                        {TEXTURE_CHANNEL_OUTPUTS.map((output) => {
                            const outputTexture = outputTextures[output.handleId] ?? null

                            return (
                                <div
                                    key={output.handleId}
                                    className="relative flex items-center justify-end gap-2 pr-3 text-xs text-secondary-foreground"
                                >
                                    <Handle
                                        type="source"
                                        position={Position.Right}
                                        id={output.handleId}
                                        className="-right-3! size-3! border-blue-300! bg-blue-500!"
                                        data-type="texture"
                                    />
                                    <span className="w-10 text-right">{output.label}</span>
                                    {outputTexture ? (
                                        <TexturePreview
                                            texture={outputTexture}
                                            className="size-8"
                                        />
                                    ) : (
                                        <EmptyTexture className="size-8" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="inputTexture"
                    className="top-8! size-3! border-blue-300! bg-blue-500!"
                    data-type="texture"
                />
            </BaseNodeContent>
        </BaseNode>
    )
})

ChannelSplitTextureNode.displayName = "ChannelSplitTextureNode"
