import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import {
    blendTextures,
    TEXTURE_BLEND_MODE_LABELS,
    type SerializedTextureData,
    type TextureBlendMode,
} from "@/lib/texture";
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

type MergeTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    mode?: TextureBlendMode;
}

const DEFAULT_BLEND_MODE: TextureBlendMode = "normal";

export const MergeTextureNode = memo(({ id }: Props) => {
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
    const baseTextureInput = inputMap.inputBase as TextureNodeData | undefined;
    const blendTextureInput = inputMap.inputBlend as TextureNodeData | undefined;
    const inputBaseTexture = baseTextureInput?.texture ?? null;
    const inputBlendTexture = blendTextureInput?.texture ?? null;
    const nodeData = (node?.data as MergeTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const mode = nodeData.mode ?? DEFAULT_BLEND_MODE;

    React.useEffect(() => {
        if (!nodeData.mode) {
            setNode(id, { mode });
        }
    }, [id, mode, nodeData.mode, setNode]);

    React.useEffect(() => {
        if (!inputBaseTexture || !inputBlendTexture) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const mergedTexture = blendTextures(inputBaseTexture, inputBlendTexture, mode);
            setNode(id, { texture: mergedTexture, error: null });
        } catch (mergeError) {
            const message = mergeError instanceof Error
                ? mergeError.message
                : "Could not merge the textures.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, inputBaseTexture, inputBlendTexture, mode, setNode]);

    return (
        <BaseNode className="w-52">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Merge Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-3">
                    <Select value={mode} onValueChange={(value) => setNode(id, { mode: value as TextureBlendMode })}>
                        <SelectTrigger className="nodrag w-full" aria-label="Merge mode">
                            <SelectValue placeholder="Select merge mode" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                                {(Object.entries(TEXTURE_BLEND_MODE_LABELS) as [TextureBlendMode, string][]).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputBase" className="size-3! -left-3! bg-blue-500! border-blue-300!" data-type="texture" />
                    Base
                </div>
                <div className="relative text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputBlend" className="size-3! -left-3! bg-blue-500! border-blue-300!" data-type="texture" />
                    Blend
                </div>
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

MergeTextureNode.displayName = "MergeTextureNode";