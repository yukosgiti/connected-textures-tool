import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";

import { useNodeData, useNodeInputs } from "@/hooks/store";
import { rotateTexture, type SerializedTextureData } from "@/lib/texture";
import { createConstantValueFrames } from "@/lib/utils";
import useStore from "@/store/graph";
import { Rotate360FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";
import { EmptyTexture, TexturePreview } from "../EmptyTexture";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import { ValueFallbackSlider } from "./ValueFallbackSlider";


type Props = {
    id: string;
}


type TextureNodeData = {
    texture?: SerializedTextureData | null;
}


type ValueNodeData = {
    data?: number[];
}


type RotateTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    fallbackValue?: number;
}

const ROTATION_PRESET_DEGREES = [
    0,
    90,
    180,
    270,
] as const;

function chunkArray<T>(items: readonly T[], chunkSize: number) {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize) as T[]);
    }

    return chunks;
}

function formatRotationValue(value: number) {
    return `${Math.round(value * 360)}°`;
}


export const RotateTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const inputData = useNodeInputs(id);
    const setNode = useStore((store) => store.setNode);
    const edges = useStore((store) => store.edges);
    const textureInput = inputData.find((input) => {
        return Boolean((input as TextureNodeData).texture);
    }) as TextureNodeData | undefined;
    const valueInput = inputData.find((input) => {
        return Array.isArray((input as ValueNodeData).data);
    }) as ValueNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const nodeData = (node?.data as RotateTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const fallbackValue = nodeData.fallbackValue ?? 0;
    const rotationPresetRows = React.useMemo(() => {
        return chunkArray(ROTATION_PRESET_DEGREES, 5);
    }, []);
    const hasValueInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputValue");
    }, [edges, id]);
    const rotationValues = React.useMemo(() => {
        return valueInput?.data ?? createConstantValueFrames(fallbackValue);
    }, [fallbackValue, valueInput?.data]);
    const valueFrames = rotationValues.length;

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });

            return;
        }

        try {
            const rotatedTexture = rotateTexture(inputTexture, rotationValues);
            setNode(id, { texture: rotatedTexture, error: null });
        } catch (rotationError) {
            const message = rotationError instanceof Error
                ? rotationError.message
                : "Could not rotate the texture.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, inputTexture, rotationValues, setNode, valueFrames]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Rotate360FreeIcons} />
                    Rotate Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent >
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                    {hasValueInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputValue" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            Amount
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputValue" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <div className="mb-2 flex flex-col gap-1 nodrag">
                                {rotationPresetRows.map((row, rowIndex) => (
                                    <ButtonGroup key={`rotation-presets-${rowIndex}`} className="w-full flex-wrap1">
                                        {row.map((degrees) => {
                                            const turnValue = degrees / 360;
                                            const isActive = Math.abs(fallbackValue - turnValue) < 0.0001;

                                            return (
                                                <Button
                                                    key={degrees}
                                                    variant={isActive ? "default" : "outline"}
                                                    className="nodrag flex-1 px-1 text-[10px]"
                                                    size="xs"
                                                    onClick={() => setNode(id, { fallbackValue: turnValue })}
                                                >
                                                    {degrees}°
                                                </Button>
                                            );
                                        })}
                                    </ButtonGroup>
                                ))}
                            </div>
                            <ValueFallbackSlider
                                label="Amount"
                                value={fallbackValue}
                                min={-1}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackValue: value })}
                                formatValue={(value) => formatRotationValue(value)}
                            />
                        </div>
                    )}
                </div>
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />

            </BaseNodeContent>
        </BaseNode>
    );
});

RotateTextureNode.displayName = "RotateTextureNode";