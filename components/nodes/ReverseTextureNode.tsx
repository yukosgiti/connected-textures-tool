import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";
import { useNodeInputs } from "@/hooks/store";
import { reverseTexture, type SerializedTextureData } from "@/lib/texture";
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

type ReverseTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
}

export const ReverseTextureNode = memo(({ id }: Props) => {
    const inputData = useNodeInputs(id);
    const setNode = useStore((store) => store.setNode);
    const textureInput = inputData.find((input) => {
        return Boolean((input as TextureNodeData).texture);
    }) as TextureNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const nodeData = useStore((store) => store.getNode(id)?.data as ReverseTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const reversedTexture = reverseTexture(inputTexture);
            setNode(id, { texture: reversedTexture, error: null });
        } catch (reverseError) {
            const message = reverseError instanceof Error
                ? reverseError.message
                : "Could not reverse the texture.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, inputTexture, setNode]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Reverse Frames
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

ReverseTextureNode.displayName = "ReverseTextureNode";