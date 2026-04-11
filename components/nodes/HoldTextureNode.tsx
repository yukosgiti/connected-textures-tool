import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";
import { useNodeInputs } from "@/hooks/store";
import { holdTexture, type SerializedTextureData } from "@/lib/texture";
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

type HoldTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    fallbackHold?: number;
}

export const HoldTextureNode = memo(({ id }: Props) => {
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
    const nodeData = useStore((store) => store.getNode(id)?.data as HoldTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const fallbackHold = nodeData.fallbackHold ?? 1;
    const hasHoldInput = React.useMemo(() => {
        return edges.some((edge) => edge.target === id && edge.targetHandle === "inputHold");
    }, [edges, id]);
    const holdValues = React.useMemo(() => {
        return valueInput?.data ?? createConstantValueFrames(fallbackHold);
    }, [fallbackHold, valueInput?.data]);
    const valueFrames = holdValues.length;

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const heldTexture = holdTexture(inputTexture, holdValues);
            setNode(id, { texture: heldTexture, error: null });
        } catch (holdError) {
            const message = holdError instanceof Error
                ? holdError.message
                : "Could not hold the texture frames.";

            setNode(id, { texture: null, error: message });
        }
    }, [holdValues, id, inputTexture, setNode, valueFrames]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Hold Frames
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                    {hasHoldInput ? (
                        <div className="relative text-xs text-secondary-foreground">
                            <Handle type="target" position={Position.Left} id="inputHold" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                            Hold
                        </div>
                    ) : (
                        <div className="relative">
                            <Handle type="target" position={Position.Left} id="inputHold" className="size-3! -left-3! top-1/2! -translate-y-1/2 bg-orange-500! border-orange-300!" data-type="value" />
                            <ValueFallbackSlider
                                label="Hold"
                                value={fallbackHold}
                                min={1}
                                max={16}
                                step={1}
                                onChange={(value) => setNode(id, { fallbackHold: value })}
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

HoldTextureNode.displayName = "HoldTextureNode";