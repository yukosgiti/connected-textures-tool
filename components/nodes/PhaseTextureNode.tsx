import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { useNodeData, useNodeInputs } from "@/hooks/store";
import { phaseTexture, type SerializedTextureData } from "@/lib/texture";
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

type PhaseTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
}

export const PhaseTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const inputData = useNodeInputs(id);
    const setNode = useStore((store) => store.setNode);
    const textureInput = inputData.find((input) => {
        return Boolean((input as TextureNodeData).texture);
    }) as TextureNodeData | undefined;
    const valueInput = inputData.find((input) => {
        return Array.isArray((input as ValueNodeData).data);
    }) as ValueNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const frameOffsets = valueInput?.data ?? ZERO_VALUE_FRAMES;
    const valueFrames = frameOffsets.length;
    const nodeData = (node?.data as PhaseTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });

            return;
        }

        try {
            const phasedTexture = phaseTexture(inputTexture, frameOffsets);
            setNode(id, { texture: phasedTexture, error: null });
        } catch (phaseError) {
            const message = phaseError instanceof Error
                ? phaseError.message
                : "Could not phase the texture.";

            setNode(id, { texture: null, error: message });
        }
    }, [frameOffsets, id, inputTexture, setNode, valueFrames]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Phase Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputValue" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                    Frames
                </div>
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

PhaseTextureNode.displayName = "PhaseTextureNode";