import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { useNodeData } from "@/hooks/store";
import { adjustHslTexture, type SerializedTextureData } from "@/lib/texture";
import { ZERO_VALUE_FRAMES } from "@/lib/utils";
import useStore from "@/store/graph";
import { Image01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";
import { EmptyTexture, TexturePreview } from "../EmptyTexture";

type Props = {
    id: string;
}

type TextureNodeData = {
    texture?: SerializedTextureData | null;
}

type ValueNodeData = {
    data?: number[];
}

type HslTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
}

export const HslTextureNode = memo(({ id }: Props) => {
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
    const hueInput = inputMap.inputHue as ValueNodeData | undefined;
    const saturationInput = inputMap.inputSaturation as ValueNodeData | undefined;
    const lightnessInput = inputMap.inputLightness as ValueNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const hueValues = hueInput?.data ?? ZERO_VALUE_FRAMES;
    const saturationValues = saturationInput?.data ?? ZERO_VALUE_FRAMES;
    const lightnessValues = lightnessInput?.data ?? ZERO_VALUE_FRAMES;
    const nodeData = (node?.data as HslTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const adjustedTexture = adjustHslTexture(
                inputTexture,
                hueValues,
                saturationValues,
                lightnessValues,
            );
            setNode(id, { texture: adjustedTexture, error: null });
        } catch (hslError) {
            const message = hslError instanceof Error
                ? hslError.message
                : "Could not update the texture HSL values.";

            setNode(id, { texture: null, error: message });
        }
    }, [hueValues, id, inputTexture, lightnessValues, saturationValues, setNode]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    HSL Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputHue" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                    Hue
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputSaturation" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                    Saturation
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputLightness" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                    Lightness
                </div>
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

HslTextureNode.displayName = "HslTextureNode";