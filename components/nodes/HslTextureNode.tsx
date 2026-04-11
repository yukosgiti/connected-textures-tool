import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { useNodeData } from "@/hooks/store";
import { adjustHslTexture, type SerializedTextureData } from "@/lib/texture";
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

type HslTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    fallbackHue?: number;
    fallbackSaturation?: number;
    fallbackLightness?: number;
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
    const nodeData = (node?.data as HslTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const fallbackHue = nodeData.fallbackHue ?? 0;
    const fallbackSaturation = nodeData.fallbackSaturation ?? 0;
    const fallbackLightness = nodeData.fallbackLightness ?? 0;
    const hasHueInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputHue");
    }, [edges, id]);
    const hasSaturationInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputSaturation");
    }, [edges, id]);
    const hasLightnessInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputLightness");
    }, [edges, id]);
    const hueValues = React.useMemo(() => {
        return hueInput?.data ?? createConstantValueFrames(fallbackHue);
    }, [fallbackHue, hueInput?.data]);
    const saturationValues = React.useMemo(() => {
        return saturationInput?.data ?? createConstantValueFrames(fallbackSaturation);
    }, [fallbackSaturation, saturationInput?.data]);
    const lightnessValues = React.useMemo(() => {
        return lightnessInput?.data ?? createConstantValueFrames(fallbackLightness);
    }, [fallbackLightness, lightnessInput?.data]);

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
                    {hasHueInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputHue" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            Hue
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputHue" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <ValueFallbackSlider
                                label="Hue"
                                value={fallbackHue}
                                min={-1}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackHue: value })}
                            />
                        </div>
                    )}
                    {hasSaturationInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputSaturation" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            Saturation
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputSaturation" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <ValueFallbackSlider
                                label="Saturation"
                                value={fallbackSaturation}
                                min={-1}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackSaturation: value })}
                            />
                        </div>
                    )}
                    {hasLightnessInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputLightness" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            Lightness
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputLightness" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <ValueFallbackSlider
                                label="Lightness"
                                value={fallbackLightness}
                                min={-1}
                                max={1}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackLightness: value })}
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

HslTextureNode.displayName = "HslTextureNode";