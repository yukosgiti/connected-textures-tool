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
    createLinearGradientTexture,
    type LinearGradientTextureConfig,
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

type GradientTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    startColor?: string
    endColor?: string
    angle?: number
}

const DEFAULT_START_COLOR = "#0ea5e9"
const DEFAULT_END_COLOR = "#f97316"

export const GradientTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasAngleInput = useHasNodeInput(id, "inputAngle")
    const setNode = useStore((store) => store.setNode)
    const angleInput = inputMap.inputAngle as ValueNodeData | undefined
    const nodeData = (node?.data as GradientTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const startColor = nodeData.startColor ?? DEFAULT_START_COLOR
    const endColor = nodeData.endColor ?? DEFAULT_END_COLOR
    const angle = nodeData.angle ?? 0
    const angleValues = React.useMemo(() => {
        return angleInput?.data ?? createConstantValueFrames(angle)
    }, [angle, angleInput?.data])
    const [draftStartColor, setDraftStartColor] = React.useState(startColor)
    const [draftEndColor, setDraftEndColor] = React.useState(endColor)

    React.useEffect(() => {
        setDraftStartColor(startColor)
    }, [startColor])

    React.useEffect(() => {
        setDraftEndColor(endColor)
    }, [endColor])

    React.useEffect(() => {
        const nextData: Partial<GradientTextureNodeData> = {}

        if (!nodeData.startColor) {
            nextData.startColor = DEFAULT_START_COLOR
        }

        if (!nodeData.endColor) {
            nextData.endColor = DEFAULT_END_COLOR
        }

        if (nodeData.angle === undefined) {
            nextData.angle = 0
        }

        if (Object.keys(nextData).length > 0) {
            nextData.error = null
            setNode(id, nextData)
        }
    }, [id, nodeData.angle, nodeData.endColor, nodeData.startColor, setNode])

    React.useEffect(() => {
        try {
            const config: LinearGradientTextureConfig = {
                startColor,
                endColor,
                angle: angleValues,
            }

            setNode(id, { texture: createLinearGradientTexture(config), error: null })
        } catch (gradientError) {
            setNode(id, {
                texture: null,
                error:
                    gradientError instanceof Error
                        ? gradientError.message
                        : "Could not generate the gradient texture.",
            })
        }
    }, [angleValues, endColor, id, setNode, startColor])

    return (
        <BaseNode className="w-60">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Gradient Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    <ColorHexInput
                        label="Start"
                        color={startColor}
                        draftColor={draftStartColor}
                        defaultColor={DEFAULT_START_COLOR}
                        ariaLabel="Gradient start color"
                        onDraftColorChange={setDraftStartColor}
                        onColorChange={(value) =>
                            setNode(id, { startColor: value, error: null })
                        }
                        onInvalidColor={() => {
                            setDraftStartColor(startColor)
                            setNode(id, { error: "Use a valid start color." })
                        }}
                    />
                    <ColorHexInput
                        label="End"
                        color={endColor}
                        draftColor={draftEndColor}
                        defaultColor={DEFAULT_END_COLOR}
                        ariaLabel="Gradient end color"
                        onDraftColorChange={setDraftEndColor}
                        onColorChange={(value) =>
                            setNode(id, { endColor: value, error: null })
                        }
                        onInvalidColor={() => {
                            setDraftEndColor(endColor)
                            setNode(id, { error: "Use a valid end color." })
                        }}
                    />
                    <ValueInputControl
                        handleId="inputAngle"
                        label="Angle"
                        hasInput={hasAngleInput}
                        value={angle}
                        min={-1}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { angle: value })}
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

GradientTextureNode.displayName = "GradientTextureNode"
