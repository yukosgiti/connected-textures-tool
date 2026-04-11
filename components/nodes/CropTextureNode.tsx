import { memo } from "react"

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node"
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture"
import { useHasNodeInput, useNodeData, useNodeInputMap } from "@/hooks/store"
import { cropTexture, type SerializedTextureData } from "@/lib/texture"
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

type CropTextureNodeData = {
    texture?: SerializedTextureData | null
    error?: string | null
    fallbackX?: number
    fallbackY?: number
    fallbackWidth?: number
    fallbackHeight?: number
}

export const CropTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id)
    const inputMap = useNodeInputMap(id)
    const setNode = useStore((store) => store.setNode)
    const hasXInput = useHasNodeInput(id, "inputX")
    const hasYInput = useHasNodeInput(id, "inputY")
    const hasWidthInput = useHasNodeInput(id, "inputWidth")
    const hasHeightInput = useHasNodeInput(id, "inputHeight")
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined
    const xInput = inputMap.inputX as ValueNodeData | undefined
    const yInput = inputMap.inputY as ValueNodeData | undefined
    const widthInput = inputMap.inputWidth as ValueNodeData | undefined
    const heightInput = inputMap.inputHeight as ValueNodeData | undefined
    const inputTexture = textureInput?.texture ?? null
    const nodeData = (node?.data as CropTextureNodeData | undefined) ?? {}
    const texture = nodeData.texture ?? null
    const error = nodeData.error ?? null
    const fallbackX = nodeData.fallbackX ?? 0
    const fallbackY = nodeData.fallbackY ?? 0
    const fallbackWidth = nodeData.fallbackWidth ?? 1
    const fallbackHeight = nodeData.fallbackHeight ?? 1
    const xValues = React.useMemo(() => {
        return xInput?.data ?? createConstantValueFrames(fallbackX)
    }, [fallbackX, xInput?.data])
    const yValues = React.useMemo(() => {
        return yInput?.data ?? createConstantValueFrames(fallbackY)
    }, [fallbackY, yInput?.data])
    const widthValues = React.useMemo(() => {
        return widthInput?.data ?? createConstantValueFrames(fallbackWidth)
    }, [fallbackWidth, widthInput?.data])
    const heightValues = React.useMemo(() => {
        return heightInput?.data ?? createConstantValueFrames(fallbackHeight)
    }, [fallbackHeight, heightInput?.data])

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null })
            return
        }

        try {
            setNode(id, {
                texture: cropTexture(
                    inputTexture,
                    xValues,
                    yValues,
                    widthValues,
                    heightValues
                ),
                error: null,
            })
        } catch (cropError) {
            setNode(id, {
                texture: null,
                error:
                    cropError instanceof Error
                        ? cropError.message
                        : "Could not crop the texture.",
            })
        }
    }, [heightValues, id, inputTexture, setNode, widthValues, xValues, yValues])

    return (
        <BaseNode className="w-52">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Crop Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    <ValueInputControl
                        handleId="inputX"
                        label="Left"
                        hasInput={hasXInput}
                        value={fallbackX}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackX: value })}
                    />
                    <ValueInputControl
                        handleId="inputY"
                        label="Top"
                        hasInput={hasYInput}
                        value={fallbackY}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackY: value })}
                    />
                    <ValueInputControl
                        handleId="inputWidth"
                        label="Width"
                        hasInput={hasWidthInput}
                        value={fallbackWidth}
                        min={0.06}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackWidth: value })}
                    />
                    <ValueInputControl
                        handleId="inputHeight"
                        label="Height"
                        hasInput={hasHeightInput}
                        value={fallbackHeight}
                        min={0.06}
                        max={1}
                        step={0.01}
                        onChange={(value) => setNode(id, { fallbackHeight: value })}
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

CropTextureNode.displayName = "CropTextureNode"
