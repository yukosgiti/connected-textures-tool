"use client"

import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { resolveNodeOutputData, useNodeData } from "@/hooks/store"
import {
    createWaveTexture,
    normalizeHexColor,
    type WaveTextureKind,
} from "@/lib/procedural-texture"
import { type SerializedTextureData } from "@/lib/texture"
import { createConstantValueFrames } from "@/lib/utils"
import useStore from "@/store/graph"
import { Image01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Handle, Position } from "@xyflow/react"
import React from "react"

import { ValueFallbackSlider } from "./ValueFallbackSlider"

type Props = {
    id: string
    kind: WaveTextureKind
    title: string
    defaultColor?: string
    defaultCycles?: number
    defaultAmplitude?: number
    defaultThickness?: number
    defaultPhase?: number
    showAmplitude?: boolean
}

type WaveTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    color?: string
    cycles?: number
    amplitude?: number
    thickness?: number
    phase?: number
}

type ValueNodeData = {
    data?: number[]
}

const FALLBACK_COLOR = "#f97316"

export const WaveTextureNodeBase = memo(
    ({
        id,
        kind,
        title,
        defaultColor = FALLBACK_COLOR,
        defaultCycles = 1,
        defaultAmplitude = 5,
        defaultThickness = 2,
        defaultPhase = 0,
        showAmplitude = true,
    }: Props) => {
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
        const nodeData = (node?.data as WaveTextureNodeData | undefined) ?? {}
        const cyclesInput = inputMap.inputCycles as ValueNodeData | undefined
        const amplitudeInput = inputMap.inputAmplitude as ValueNodeData | undefined
        const thicknessInput = inputMap.inputThickness as ValueNodeData | undefined
        const phaseInput = inputMap.inputPhase as ValueNodeData | undefined
        const texture = nodeData.texture ?? null
        const error = nodeData.error ?? null
        const color = nodeData.color ?? defaultColor
        const cycles = nodeData.cycles ?? defaultCycles
        const amplitude = nodeData.amplitude ?? defaultAmplitude
        const thickness = nodeData.thickness ?? defaultThickness
        const phase = nodeData.phase ?? defaultPhase
        const hasCyclesInput = React.useMemo(() => {
            return edges.some(
                (edge) => edge.target === id && edge.targetHandle === "inputCycles"
            )
        }, [edges, id])
        const hasAmplitudeInput = React.useMemo(() => {
            return edges.some(
                (edge) => edge.target === id && edge.targetHandle === "inputAmplitude"
            )
        }, [edges, id])
        const hasThicknessInput = React.useMemo(() => {
            return edges.some(
                (edge) => edge.target === id && edge.targetHandle === "inputThickness"
            )
        }, [edges, id])
        const hasPhaseInput = React.useMemo(() => {
            return edges.some(
                (edge) => edge.target === id && edge.targetHandle === "inputPhase"
            )
        }, [edges, id])
        const cyclesValues = React.useMemo(() => {
            return cyclesInput?.data ?? createConstantValueFrames(cycles)
        }, [cycles, cyclesInput?.data])
        const amplitudeValues = React.useMemo(() => {
            return amplitudeInput?.data ?? createConstantValueFrames(amplitude)
        }, [amplitude, amplitudeInput?.data])
        const thicknessValues = React.useMemo(() => {
            return thicknessInput?.data ?? createConstantValueFrames(thickness)
        }, [thickness, thicknessInput?.data])
        const phaseValues = React.useMemo(() => {
            return phaseInput?.data ?? createConstantValueFrames(phase)
        }, [phase, phaseInput?.data])
        const [draftColor, setDraftColor] = React.useState(color)

        React.useEffect(() => {
            setDraftColor(color)
        }, [color])

        React.useEffect(() => {
            const nextData: WaveTextureNodeData = {}

            if (!nodeData.color) {
                nextData.color = defaultColor
            }

            if (nodeData.cycles === undefined) {
                nextData.cycles = defaultCycles
            }

            if (nodeData.amplitude === undefined) {
                nextData.amplitude = defaultAmplitude
            }

            if (nodeData.thickness === undefined) {
                nextData.thickness = defaultThickness
            }

            if (nodeData.phase === undefined) {
                nextData.phase = defaultPhase
            }

            if (Object.keys(nextData).length > 0) {
                nextData.error = null
                setNode(id, nextData)
            }
        }, [
            defaultAmplitude,
            defaultColor,
            defaultCycles,
            defaultPhase,
            defaultThickness,
            id,
            nodeData.amplitude,
            nodeData.color,
            nodeData.cycles,
            nodeData.phase,
            nodeData.thickness,
            setNode,
        ])

        React.useEffect(() => {
            try {
                const nextTexture = createWaveTexture(kind, {
                    color,
                    cycles: cyclesValues,
                    amplitude: amplitudeValues,
                    thickness: thicknessValues,
                    phase: phaseValues,
                })

                setNode(id, { texture: nextTexture, error: null })
            } catch (waveError) {
                const message =
                    waveError instanceof Error
                        ? waveError.message
                        : "Could not generate the wave texture."

                setNode(id, { texture: null, error: message })
            }
        }, [
            amplitudeValues,
            color,
            cyclesValues,
            id,
            kind,
            phaseValues,
            setNode,
            thicknessValues,
        ])

        const commitDraftColor = React.useCallback(() => {
            const normalizedColor = normalizeHexColor(draftColor)

            if (!normalizedColor) {
                setDraftColor(color)
                setNode(id, { error: "Use a valid hex color." })
                return
            }

            setDraftColor(normalizedColor)
            setNode(id, { color: normalizedColor, error: null })
        }, [color, draftColor, id, setNode])

        return (
            <BaseNode className="w-56">
                <BaseNodeHeader>
                    <BaseNodeHeaderTitle>
                        <HugeiconsIcon icon={Image01FreeIcons} />
                        {title}
                    </BaseNodeHeaderTitle>
                </BaseNodeHeader>
                <BaseNodeContent>
                    <div className="flex flex-col gap-4">
                        {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}

                        <InputGroup className="nodrag">
                            <InputGroupAddon align="inline-start">
                                <label className="flex cursor-pointer items-center">
                                    <span
                                        className="size-4 rounded-sm border border-border"
                                        style={{ backgroundColor: color }}
                                    />
                                    <input
                                        type="color"
                                        value={color}
                                        className="sr-only"
                                        onChange={(event) => {
                                            const nextColor =
                                                normalizeHexColor(event.target.value) ?? defaultColor
                                            setDraftColor(nextColor)
                                            setNode(id, { color: nextColor, error: null })
                                        }}
                                    />
                                </label>
                            </InputGroupAddon>
                            <InputGroupInput
                                value={draftColor}
                                aria-label={`${title} color hex`}
                                className="nodrag uppercase"
                                onChange={(event) => setDraftColor(event.target.value)}
                                onBlur={commitDraftColor}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        commitDraftColor()
                                    }
                                }}
                            />
                        </InputGroup>

                        {hasCyclesInput ? (
                            <div className="relative text-xs text-secondary-foreground">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id="inputCycles"
                                    className="-left-3! size-3! border-orange-300! bg-orange-500!"
                                    data-type="value"
                                />
                                Cycles
                            </div>
                        ) : (
                            <div className="relative">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id="inputCycles"
                                    className="top-1/2! -left-3! size-3! -translate-y-1/2 border-orange-300! bg-orange-500!"
                                    data-type="value"
                                />
                                <ValueFallbackSlider
                                    label="Cycles"
                                    value={cycles}
                                    min={0.25}
                                    max={4}
                                    step={0.01}
                                    onChange={(value) => setNode(id, { cycles: value })}
                                />
                            </div>
                        )}
                        {showAmplitude &&
                            (hasAmplitudeInput ? (
                                <div className="relative text-xs text-secondary-foreground">
                                    <Handle
                                        type="target"
                                        position={Position.Left}
                                        id="inputAmplitude"
                                        className="-left-3! size-3! border-orange-300! bg-orange-500!"
                                        data-type="value"
                                    />
                                    Amplitude
                                </div>
                            ) : (
                                <div className="relative">
                                    <Handle
                                        type="target"
                                        position={Position.Left}
                                        id="inputAmplitude"
                                        className="top-1/2! -left-3! size-3! -translate-y-1/2 border-orange-300! bg-orange-500!"
                                        data-type="value"
                                    />
                                    <ValueFallbackSlider
                                        label="Amplitude"
                                        value={amplitude}
                                        min={0}
                                        max={7.5}
                                        step={0.25}
                                        onChange={(value) => setNode(id, { amplitude: value })}
                                    />
                                </div>
                            ))}
                        {hasThicknessInput ? (
                            <div className="relative text-xs text-secondary-foreground">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id="inputThickness"
                                    className="-left-3! size-3! border-orange-300! bg-orange-500!"
                                    data-type="value"
                                />
                                Thickness
                            </div>
                        ) : (
                            <div className="relative">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id="inputThickness"
                                    className="top-1/2! -left-3! size-3! -translate-y-1/2 border-orange-300! bg-orange-500!"
                                    data-type="value"
                                />
                                <ValueFallbackSlider
                                    label="Thickness"
                                    value={thickness}
                                    min={1}
                                    max={6}
                                    step={0.25}
                                    onChange={(value) => setNode(id, { thickness: value })}
                                />
                            </div>
                        )}
                        {hasPhaseInput ? (
                            <div className="relative text-xs text-secondary-foreground">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id="inputPhase"
                                    className="-left-3! size-3! border-orange-300! bg-orange-500!"
                                    data-type="value"
                                />
                                Phase
                            </div>
                        ) : (
                            <div className="relative">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id="inputPhase"
                                    className="top-1/2! -left-3! size-3! -translate-y-1/2 border-orange-300! bg-orange-500!"
                                    data-type="value"
                                />
                                <ValueFallbackSlider
                                    label="Phase"
                                    value={phase}
                                    min={-1}
                                    max={1}
                                    step={0.01}
                                    onChange={(value) => setNode(id, { phase: value })}
                                />
                            </div>
                        )}

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
    }
)

WaveTextureNodeBase.displayName = "WaveTextureNodeBase"
