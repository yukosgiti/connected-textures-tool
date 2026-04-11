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
    TILE_TEXTURE_MODE_LABELS,
    tileTexture,
    type SerializedTextureData,
    type TileTextureMode,
} from "@/lib/texture"
import { createConstantValueFrames } from "@/lib/utils"
import useStore from "@/store/graph"
import { Image01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Handle, Position } from "@xyflow/react"
import React from "react"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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

type TileTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    mode?: TileTextureMode
    fallbackRepeatX?: number
    fallbackRepeatY?: number
}

const DEFAULT_MODE: TileTextureMode = "repeat"

export const TileTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const setNode = useStore((store) => store.setNode)
    const hasRepeatXInput = useHasNodeInput(id, "inputRepeatX")
    const hasRepeatYInput = useHasNodeInput(id, "inputRepeatY")
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const repeatXInput = inputMap.inputRepeatX as ValueNodeData | undefined
    const repeatYInput = inputMap.inputRepeatY as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as TileTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const mode = nodeData.mode ?? DEFAULT_MODE
    const fallbackRepeatX = nodeData.fallbackRepeatX ?? 1
    const fallbackRepeatY = nodeData.fallbackRepeatY ?? 1
    const repeatXValues = React.useMemo(() => {
        return repeatXInput?.data ?? createConstantValueFrames(fallbackRepeatX)
    }, [fallbackRepeatX, repeatXInput?.data])
    const repeatYValues = React.useMemo(() => {
        return repeatYInput?.data ?? createConstantValueFrames(fallbackRepeatY)
    }, [fallbackRepeatY, repeatYInput?.data])

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
            setNode(id, {
                texture: tileTexture(inputTexture, repeatXValues, repeatYValues, mode),
                error: null,
            })
        } catch (tileError) {
            setNode(id, {
                texture: null,
                error:
                    tileError instanceof Error
                        ? tileError.message
                        : "Could not tile the texture.",
            })
        }
    }, [id, inputTexture, mode, repeatXValues, repeatYValues, setNode])

    return (
        <BaseNode className="w-52">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Tile Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <Select
                        value={mode}
                        onValueChange={(value) =>
                            setNode(id, { mode: value as TileTextureMode })
                        }
                    >
                        <SelectTrigger className="nodrag w-full" aria-label="Tile mode">
                            <SelectValue placeholder="Select tile mode" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                                {(
                                    Object.entries(TILE_TEXTURE_MODE_LABELS) as [
                                        TileTextureMode,
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
                    <ValueInputControl
                        handleId="inputRepeatX"
                        label="Repeat X"
                        hasInput={hasRepeatXInput}
                        value={fallbackRepeatX}
                        min={0.25}
                        max={8}
                        step={0.05}
                        onChange={(value) => setNode(id, { fallbackRepeatX: value })}
                    />
                    <ValueInputControl
                        handleId="inputRepeatY"
                        label="Repeat Y"
                        hasInput={hasRepeatYInput}
                        value={fallbackRepeatY}
                        min={0.25}
                        max={8}
                        step={0.05}
                        onChange={(value) => setNode(id, { fallbackRepeatY: value })}
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

TileTextureNode.displayName = "TileTextureNode"
