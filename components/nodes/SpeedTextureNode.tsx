import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";
import { useNodeInputs } from "@/hooks/store";
import { speedTexture, type SerializedTextureData } from "@/lib/texture";
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

type SpeedTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    fallbackSpeed?: number;
}

export const SpeedTextureNode = memo(({ id }: Props) => {
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
    const nodeData = useStore((store) => store.getNode(id)?.data as SpeedTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const fallbackSpeed = nodeData.fallbackSpeed ?? 1;
    const hasSpeedInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputSpeed");
    }, [edges, id]);
    const speedValues = React.useMemo(() => {
        return valueInput?.data ?? createConstantValueFrames(fallbackSpeed);
    }, [fallbackSpeed, valueInput?.data]);
    const valueFrames = speedValues.length;

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const retimedTexture = speedTexture(inputTexture, speedValues);
            setNode(id, { texture: retimedTexture, error: null });
        } catch (speedError) {
            const message = speedError instanceof Error
                ? speedError.message
                : "Could not retime the texture.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, inputTexture, setNode, speedValues, valueFrames]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Frame Speed
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                    {hasSpeedInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputSpeed" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            Speed
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputSpeed" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <ValueFallbackSlider
                                label="Speed"
                                value={fallbackSpeed}
                                min={-4}
                                max={4}
                                step={0.01}
                                onChange={(value) => setNode(id, { fallbackSpeed: value })}
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

SpeedTextureNode.displayName = "SpeedTextureNode";