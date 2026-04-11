import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useNodeData, useNodeInputMap } from "@/hooks/store"
import {
    FLIP_TEXTURE_MODE_LABELS,
    flipTexture,
    type FlipTextureMode,
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

type FlipTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    mode?: FlipTextureMode
}

const DEFAULT_MODE: FlipTextureMode = "horizontal"

export const FlipTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as FlipTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const mode = nodeData.mode ?? DEFAULT_MODE

    React.useEffect(() => {
        if (!nodeData.mode) {
            setNode(id, { mode })
        }
    }, [id, mode, nodeData.mode, setNode])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, { texture: flipTexture(inputTexture, mode), error: null })
        } catch (flipError) {
            setNode(id, {
                texture: null,
                error:
                    flipError instanceof Error
                        ? flipError.message
                        : "Could not flip the texture.",
            })
        }
    }, [id, inputTexture, mode, setNode])

    return (
        <BaseNode className="w-48">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Flip Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-3">
                    <Select
                        value={mode}
                        onValueChange={(value) =>
                            setNode(id, { mode: value as FlipTextureMode })
                        }
                    >
                        <SelectTrigger className="nodrag w-full" aria-label="Flip mode">
                            <SelectValue placeholder="Select flip mode" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                                {(
                                    Object.entries(FLIP_TEXTURE_MODE_LABELS) as [
                                        FlipTextureMode,
                                        string,
                                    ][]
                                ).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
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

FlipTextureNode.displayName = "FlipTextureNode"
