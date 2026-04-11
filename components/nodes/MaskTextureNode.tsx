import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import { maskTexture, type SerializedTextureData } from "@/lib/texture";
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

type MaskTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
}

export const MaskTextureNode = memo(({ id }: Props) => {
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
    const maskInput = inputMap.inputMask as TextureNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const inputMask = maskInput?.texture ?? null;
    const nodeData = (node?.data as MaskTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;

    React.useEffect(() => {
        if (!inputTexture || !inputMask) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const masked = maskTexture(inputTexture, inputMask);
            setNode(id, { texture: masked, error: null });
        } catch (maskError) {
            const message = maskError instanceof Error
                ? maskError.message
                : "Could not apply the texture mask.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, inputMask, inputTexture, setNode]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Mask Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputTexture" className="size-3! -left-3! bg-blue-500! border-blue-300!" data-type="texture" />
                    Texture
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputMask" className="size-3! -left-3! bg-blue-500! border-blue-300!" data-type="texture" />
                    Mask
                </div>
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

MaskTextureNode.displayName = "MaskTextureNode";