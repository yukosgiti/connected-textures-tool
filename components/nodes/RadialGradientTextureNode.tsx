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
    createRadialGradientTexture,
    type RadialGradientTextureConfig,
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

type RadialGradientTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    innerColor?: string
    outerColor?: string
    radius?: number
}

const DEFAULT_INNER_COLOR = "#f8fafc"
const DEFAULT_OUTER_COLOR = "#0f172a"

export const RadialGradientTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasRadiusInput = useHasNodeInput(id, "inputRadius")
    const setNode = useStore((store) => store.setNode)
    const radiusInput = inputMap.inputRadius as ValueNodeData | undefined
    const nodeData =
        (node?.data as RadialGradientTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const innerColor = nodeData.innerColor ?? DEFAULT_INNER_COLOR
    const outerColor = nodeData.outerColor ?? DEFAULT_OUTER_COLOR
    const radius = nodeData.radius ?? 1
    const radiusValues = React.useMemo(() => {
        return radiusInput?.data ?? createConstantValueFrames(radius)
    }, [radius, radiusInput?.data])
    const [draftInnerColor, setDraftInnerColor] = React.useState(innerColor)
    const [draftOuterColor, setDraftOuterColor] = React.useState(outerColor)

    React.useEffect(() => {
        setDraftInnerColor(innerColor)
    }, [innerColor])

    React.useEffect(() => {
        setDraftOuterColor(outerColor)
    }, [outerColor])

    React.useEffect(() => {
        const nextData: Partial<RadialGradientTextureNodeData> = {}

        if (!nodeData.innerColor) {
            nextData.innerColor = DEFAULT_INNER_COLOR
        }

        if (!nodeData.outerColor) {
            nextData.outerColor = DEFAULT_OUTER_COLOR
        }

        if (nodeData.radius === undefined) {
            nextData.radius = 1
        }

        if (Object.keys(nextData).length > 0) {
            nextData.error = null
            setNode(id, nextData)
        }
    }, [id, nodeData.innerColor, nodeData.outerColor, nodeData.radius, setNode])

    React.useEffect(() => {
        try {
            const config: RadialGradientTextureConfig = {
                innerColor,
                outerColor,
                radius: radiusValues,
            }

            setNode(id, { texture: createRadialGradientTexture(config), error: null })
        } catch (radialError) {
            setNode(id, {
                texture: null,
                error:
                    radialError instanceof Error
                        ? radialError.message
                        : "Could not generate the radial gradient texture.",
            })
        }
    }, [id, innerColor, outerColor, radiusValues, setNode])

    return (
        <BaseNode className="w-60">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Radial Gradient
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    <ColorHexInput
                        label="Inner"
                        color={innerColor}
                        draftColor={draftInnerColor}
                        defaultColor={DEFAULT_INNER_COLOR}
                        ariaLabel="Radial inner color"
                        onDraftColorChange={setDraftInnerColor}
                        onColorChange={(value) =>
                            setNode(id, { innerColor: value, error: null })
                        }
                        onInvalidColor={() => {
                            setDraftInnerColor(innerColor)
                            setNode(id, { error: "Use a valid inner color." })
                        }}
                    />
                    <ColorHexInput
                        label="Outer"
                        color={outerColor}
                        draftColor={draftOuterColor}
                        defaultColor={DEFAULT_OUTER_COLOR}
                        ariaLabel="Radial outer color"
                        onDraftColorChange={setDraftOuterColor}
                        onColorChange={(value) =>
                            setNode(id, { outerColor: value, error: null })
                        }
                        onInvalidColor={() => {
                            setDraftOuterColor(outerColor)
                            setNode(id, { error: "Use a valid outer color." })
                        }}
                    />
                    <ValueInputControl
                        handleId="inputRadius"
                        label="Radius"
                        hasInput={hasRadiusInput}
                        value={radius}
                        min={0.05}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { radius: value })}
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

RadialGradientTextureNode.displayName = "RadialGradientTextureNode"
