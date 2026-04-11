import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import { adjustContrastTexture, type SerializedTextureData } from "@/lib/texture";
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

type ContrastTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    fallbackContrast?: number;
}

export const ContrastTextureNode = memo(({ id }: Props) => {
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
                    accumulator[edge.targetHandle] = resolveNodeOutputData(sourceNode.data, edge.sourceHandle);
                }

                return accumulator;
            }, {});
    }, [edges, id, nodes]);
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined;
    const contrastInput = inputMap.inputContrast as ValueNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const nodeData = (node?.data as ContrastTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const fallbackContrast = nodeData.fallbackContrast ?? 0;
    const hasContrastInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputContrast");
    }, [edges, id]);
    const contrastValues = React.useMemo(() => {
        return contrastInput?.data ?? createConstantValueFrames(fallbackContrast);
    }, [contrastInput?.data, fallbackContrast]);

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const adjustedTexture = adjustContrastTexture(inputTexture, contrastValues);
            setNode(id, { texture: adjustedTexture, error: null });
        } catch (contrastError) {
            const message = contrastError instanceof Error
                ? contrastError.message
                : "Could not update the texture contrast.";

            setNode(id, { texture: null, error: message });
        }
    }, [contrastValues, id, inputTexture, setNode]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Adjust Contrast
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                    {hasContrastInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputContrast" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            Contrast
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputContrast" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <ValueFallbackSlider
                                label="Contrast"
                                value={fallbackContrast}
                                min={-1}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackContrast: value })}
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

ContrastTextureNode.displayName = "ContrastTextureNode";