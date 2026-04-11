"use client"

import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { resolveNodeOutputData, useNodeData } from "@/hooks/store"
import {
    createRandomTexture,
    createRandomTextureSeed,
    RANDOM_TEXTURE_MODE_LABELS,
    type RandomTextureMode,
} from "@/lib/procedural-texture"
import { type SerializedTextureData } from "@/lib/texture"
import { createConstantValueFrames } from "@/lib/utils"
import useStore from "@/store/graph"
import { DiceIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Handle, Position } from "@xyflow/react"
import React from "react"
import { ValueFallbackSlider } from "./ValueFallbackSlider"

type Props = {
    id: string
}

type RandomTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    mode?: RandomTextureMode
    seed?: number
    fallbackRatio?: number
}

type ValueNodeData = {
    data?: number[]
}

const DEFAULT_RANDOM_TEXTURE_MODE: RandomTextureMode = "grayscale"

export const RandomTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const setNode = useStore((store) => store.setNode)
    const nodes = useStore((store) => store.nodes)
    const edges = useStore((store) => store.edges)
    const inputMap = React.useMemo(() => {
        return edges
            .filter((edge) => edge.target === id)
            .reduce<Record<string, unknown>>((accumulator, edge) => {
                const sourceNode = nodes.find(
                    (nodeEntry) => nodeEntry.id === edge.source
                )

                if (sourceNode && edge.targetHandle) {
                    accumulator[edge.targetHandle] = resolveNodeOutputData(
                        sourceNode.data,
                        edge.sourceHandle
                    )
                }

                return accumulator
            }, {})
    }, [edges, id, nodes])
    const nodeData = (node?.data as RandomTextureNodeData | undefined) ?? {}
    const ratioInput = inputMap.inputRatio as ValueNodeData | undefined
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const mode = nodeData.mode ?? DEFAULT_RANDOM_TEXTURE_MODE
    const initialSeedRef = React.useRef(createRandomTextureSeed())
    const seed = nodeData.seed ?? initialSeedRef.current
    const fallbackRatio = nodeData.fallbackRatio ?? 1
    const hasRatioInput = React.useMemo(() => {
        return edges.some(
            (edge) => edge.target === id && edge.targetHandle === "inputRatio"
        )
    }, [edges, id])
    const ratioValues = React.useMemo(() => {
        return ratioInput?.data ?? createConstantValueFrames(fallbackRatio)
    }, [fallbackRatio, ratioInput?.data])

    React.useEffect(() => {
        if (
            !nodeData.mode ||
            nodeData.seed === undefined ||
            nodeData.fallbackRatio === undefined
        ) {
            setNode(id, { mode, seed, fallbackRatio, error: null })
        }
    }, [
        id,
        fallbackRatio,
        mode,
        nodeData.fallbackRatio,
        nodeData.mode,
        nodeData.seed,
        seed,
        setNode,
    ])

    React.useEffect(() => {
        try {
            const nextTexture = createRandomTexture(mode, seed, ratioValues)
            setNode(id, { texture: nextTexture, error: null })
        } catch (randomError) {
            const message =
                randomError instanceof Error
                    ? randomError.message
                    : "Could not generate the random texture."

            setNode(id, { texture: null, error: message })
        }
    }, [id, mode, ratioValues, seed, setNode])

    return (
        <BaseNode className="w-56">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={DiceIcon} />
                    Random Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-3">
                    <Select
                        value={mode}
                        onValueChange={(value) =>
                            setNode(id, { mode: value as RandomTextureMode })
                        }
                    >
                        <SelectTrigger
                            className="nodrag w-full"
                            aria-label="Random texture mode"
                        >
                            <SelectValue placeholder="Select random mode" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                                {(
                                    Object.entries(RANDOM_TEXTURE_MODE_LABELS) as [
                                        RandomTextureMode,
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

                    <Button
                        className="nodrag"
                        size="sm"
                        variant="outline"
                        onClick={() => setNode(id, { seed: createRandomTextureSeed() })}
                    >
                        <HugeiconsIcon icon={DiceIcon} data-icon="inline-start" />
                        Regenerate
                    </Button>

                    {hasRatioInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle
                                type="target"
                                position={Position.Left}
                                id="inputRatio"
                                className="-left-3! size-3! border-orange-300! bg-orange-500!"
                                data-type="value"
                            />
                            Ratio
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle
                                type="target"
                                position={Position.Left}
                                id="inputRatio"
                                className="top-1/2! -left-3! size-3! -translate-y-1/2 border-orange-300! bg-orange-500!"
                                data-type="value"
                            />
                            <ValueFallbackSlider
                                label="Ratio"
                                value={fallbackRatio}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackRatio: value })}
                            />
                        </div>
                    )}

                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
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

RandomTextureNode.displayName = "RandomTextureNode"
