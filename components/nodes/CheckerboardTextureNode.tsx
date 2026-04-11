import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { ColorHexInput } from "@/components/nodes/ColorHexInput"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import {
    createCheckerboardTexture,
    type CheckerboardTextureConfig,
} from "@/lib/procedural-texture"
import { type SerializedTextureData } from "@/lib/texture"
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

type ValueNodeData = {
    data?: number[]
}

type CheckerboardTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    colorA?: string
    colorB?: string
    scale?: number
}

const DEFAULT_COLOR_A = "#111827"
const DEFAULT_COLOR_B = "#f8fafc"

export const CheckerboardTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasScaleInput = useHasNodeInput(id, "inputScale")
    const setNode = useStore((store) => store.setNode)
    const scaleInput = inputMap.inputScale as ValueNodeData | undefined
    const nodeData = (node?.data as CheckerboardTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const colorA = nodeData.colorA ?? DEFAULT_COLOR_A
    const colorB = nodeData.colorB ?? DEFAULT_COLOR_B
    const scale = nodeData.scale ?? 4
    const scaleValues = React.useMemo(() => {
        return scaleInput?.data ?? createConstantValueFrames(scale)
    }, [scale, scaleInput?.data])
    const [draftColorA, setDraftColorA] = React.useState(colorA)
    const [draftColorB, setDraftColorB] = React.useState(colorB)

    React.useEffect(() => {
        setDraftColorA(colorA)
    }, [colorA])

    React.useEffect(() => {
        setDraftColorB(colorB)
    }, [colorB])

    React.useEffect(() => {
        const nextData: Partial<CheckerboardTextureNodeData> = {}

        if (!nodeData.colorA) {
            nextData.colorA = DEFAULT_COLOR_A
        }

        if (!nodeData.colorB) {
            nextData.colorB = DEFAULT_COLOR_B
        }

        if (nodeData.scale === undefined) {
            nextData.scale = 4
        }

        if (Object.keys(nextData).length > 0) {
            nextData.error = null
            setNode(id, nextData)
        }
    }, [id, nodeData.colorA, nodeData.colorB, nodeData.scale, setNode])

    React.useEffect(() => {
        try {
            const config: CheckerboardTextureConfig = {
                colorA,
                colorB,
                scale: scaleValues,
            }

            setNode(id, { texture: createCheckerboardTexture(config), error: null })
        } catch (checkerboardError) {
            setNode(id, {
                texture: null,
                error:
                    checkerboardError instanceof Error
                        ? checkerboardError.message
                        : "Could not generate the checkerboard texture.",
            })
        }
    }, [colorA, colorB, id, scaleValues, setNode])

    return (
        <BaseNode className="w-60">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Checkerboard
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    <ColorHexInput
                        label="Color A"
                        color={colorA}
                        draftColor={draftColorA}
                        defaultColor={DEFAULT_COLOR_A}
                        ariaLabel="Checkerboard first color"
                        onDraftColorChange={setDraftColorA}
                        onColorChange={(value) =>
                            setNode(id, { colorA: value, error: null })
                        }
                        onInvalidColor={() => {
                            setDraftColorA(colorA)
                            setNode(id, { error: "Use a valid first color." })
                        }}
                    />
                    <ColorHexInput
                        label="Color B"
                        color={colorB}
                        draftColor={draftColorB}
                        defaultColor={DEFAULT_COLOR_B}
                        ariaLabel="Checkerboard second color"
                        onDraftColorChange={setDraftColorB}
                        onColorChange={(value) =>
                            setNode(id, { colorB: value, error: null })
                        }
                        onInvalidColor={() => {
                            setDraftColorB(colorB)
                            setNode(id, { error: "Use a valid second color." })
                        }}
                    />
                    <ValueInputControl
                        handleId="inputScale"
                        label="Cells"
                        hasInput={hasScaleInput}
                        value={scale}
                        min={1}
                        max={8}
                        step={0.1}
                        onChange={(value) => setNode(id, { scale: value })}
                    />
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
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

CheckerboardTextureNode.displayName = "CheckerboardTextureNode"
