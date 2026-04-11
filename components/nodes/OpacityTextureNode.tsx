import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { useNodeData } from "@/hooks/store";
import { adjustOpacityTexture, type SerializedTextureData } from "@/lib/texture";
import { ONE_VALUE_FRAMES } from "@/lib/utils";
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

type OpacityTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
}

export const OpacityTextureNode = memo(({ id }: Props) => {
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
    const opacityInput = inputMap.inputOpacity as ValueNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const opacityValues = opacityInput?.data ?? ONE_VALUE_FRAMES;
    const nodeData = (node?.data as OpacityTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;

    React.useEffect(() => {
        if (!inputTexture) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const adjustedTexture = adjustOpacityTexture(inputTexture, opacityValues);
            setNode(id, { texture: adjustedTexture, error: null });
        } catch (opacityError) {
            const message = opacityError instanceof Error
                ? opacityError.message
                : "Could not update the texture opacity.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, inputTexture, opacityValues, setNode]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Opacity Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputOpacity" className="size-3! -left-3! bg-orange-500! border-orange-300!" data-type="value" />
                    Opacity
                </div>
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

OpacityTextureNode.displayName = "OpacityTextureNode";