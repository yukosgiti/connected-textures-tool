import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { useNodeData } from "@/hooks/store";
import { scaleTexture, type SerializedTextureData } from "@/lib/texture";
import { createConstantValueFrames } from "@/lib/utils";
import useStore from "@/store/graph";
import { Image01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";
import { EmptyTexture, TexturePreview } from "../EmptyTexture";
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

type ScaleTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    fallbackX?: number;
    fallbackY?: number;
}

export const ScaleTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const setNode = useStore((store) => store.setNode);
    const nodes = useStore((store) => store.nodes);
    const edges = useStore((store) => store.edges);
    const inputMap = React.useMemo(() => {
        return edges
            .filter((edge) => edge.target === id)
            .reduce<Record<string, unknown>>((accumulator, edge) => {
                const sourceNode = nodes.find((nodeEntry) => nodeEntry.id === edge.source);

                if (sourceNode && edge.targetHandle) {
                    accumulator[edge.targetHandle] = sourceNode.data;
                }

                return accumulator;
            }, {});
    }, [edges, id, nodes]);
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined;
    const xInput = inputMap.inputX as ValueNodeData | undefined;
    const yInput = inputMap.inputY as ValueNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const nodeData = (node?.data as ScaleTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const fallbackX = nodeData.fallbackX ?? 0;
    const fallbackY = nodeData.fallbackY ?? 0;
    const hasXInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputX");
    }, [edges, id]);
    const hasYInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputY");
    }, [edges, id]);
    const xValues = React.useMemo(() => {
        return xInput?.data ?? createConstantValueFrames(fallbackX);
    }, [fallbackX, xInput?.data]);
    const yValues = React.useMemo(() => {
        return yInput?.data ?? createConstantValueFrames(fallbackY);
    }, [fallbackY, yInput?.data]);

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const scaledTexture = scaleTexture(inputTexture, xValues, yValues);
            setNode(id, { texture: scaledTexture, error: null });
        } catch (scaleError) {
            const message = scaleError instanceof Error
                ? scaleError.message
                : "Could not scale the texture.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, inputTexture, setNode, xValues, yValues]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Scale Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                    {hasXInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputX" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            X
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputX" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <ValueFallbackSlider
                                label="X"
                                value={fallbackX}
                                min={-1}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackX: value })}
                            />
                        </div>
                    )}
                    {hasYInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputY" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            Y
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputY" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <ValueFallbackSlider
                                label="Y"
                                value={fallbackY}
                                min={-1}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackY: value })}
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

ScaleTextureNode.displayName = "ScaleTextureNode";