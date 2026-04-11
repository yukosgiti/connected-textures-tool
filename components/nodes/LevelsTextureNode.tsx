import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import { adjustLevelsTexture, type SerializedTextureData } from "@/lib/texture"
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

type LevelsTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackBlack?: number
    fallbackWhite?: number
    fallbackGamma?: number
}

export const LevelsTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const hasBlackInput = useHasNodeInput(id, "inputBlack")
    const hasWhiteInput = useHasNodeInput(id, "inputWhite")
    const hasGammaInput = useHasNodeInput(id, "inputGamma")
    const setNode = useStore((store) => store.setNode)
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const blackInput = inputMap.inputBlack as ValueNodeData | undefined
    const whiteInput = inputMap.inputWhite as ValueNodeData | undefined
    const gammaInput = inputMap.inputGamma as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as LevelsTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackBlack = nodeData.fallbackBlack ?? 0
    const fallbackWhite = nodeData.fallbackWhite ?? 1
    const fallbackGamma = nodeData.fallbackGamma ?? 1
    const blackValues = React.useMemo(() => {
        return blackInput?.data ?? createConstantValueFrames(fallbackBlack)
    }, [blackInput?.data, fallbackBlack])
    const whiteValues = React.useMemo(() => {
        return whiteInput?.data ?? createConstantValueFrames(fallbackWhite)
    }, [fallbackWhite, whiteInput?.data])
    const gammaValues = React.useMemo(() => {
        return gammaInput?.data ?? createConstantValueFrames(fallbackGamma)
    }, [fallbackGamma, gammaInput?.data])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, {
                texture: adjustLevelsTexture(
                    inputTexture,
                    blackValues,
                    whiteValues,
                    gammaValues
                ),
                error: null,
            })
        } catch (levelsError) {
            setNode(id, {
                texture: null,
                error:
                    levelsError instanceof Error
                        ? levelsError.message
                        : "Could not adjust levels.",
            })
        }
    }, [blackValues, gammaValues, id, inputTexture, setNode, whiteValues])

    return (
        <BaseNode className="w-48">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Levels
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <ValueInputControl
                        handleId="inputBlack"
                        label="Black"
                        hasInput={hasBlackInput}
                        value={fallbackBlack}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackBlack: value })}
                    />
                    <ValueInputControl
                        handleId="inputWhite"
                        label="White"
                        hasInput={hasWhiteInput}
                        value={fallbackWhite}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackWhite: value })}
                    />
                    <ValueInputControl
                        handleId="inputGamma"
                        label="Gamma"
                        hasInput={hasGammaInput}
                        value={fallbackGamma}
                        min={0.1}
                        max={4}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackGamma: value })}
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

LevelsTextureNode.displayName = "LevelsTextureNode"
