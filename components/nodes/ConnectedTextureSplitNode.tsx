"use client";

import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import { withBasePath } from "@/lib/base-path";
import {
    CONNECTED_TEXTURE_INPUT_HANDLE_ID,
    CONNECTED_TEXTURE_OUTPUTS
} from "@/lib/connected-texture";
import { type SerializedTextureData } from "@/lib/texture";
import useStore from "@/store/graph";
import { Image01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import Image from "next/image";
import React from "react";

type Props = {
    id: string;
};

type ConnectedTextureNodeData = {
    texture?: SerializedTextureData | null;
    outputTextures?: Record<string, SerializedTextureData | null>;
    error?: string | null;
};

export const ConnectedTextureSplitNode = memo(({ id }: Props) => {
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
    const connectedTextureInput = inputMap[CONNECTED_TEXTURE_INPUT_HANDLE_ID] as ConnectedTextureNodeData | undefined;
    const nodeData = (node?.data as ConnectedTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const outputTextures = nodeData.outputTextures ?? {};

    React.useEffect(() => {
        if (!connectedTextureInput) {
            if (texture === null && nodeData.error === null && Object.keys(outputTextures).length === 0) {
                return;
            }

            setNode(id, { texture: null, outputTextures: {}, error: null });
            return;
        }

        if (
            texture === (connectedTextureInput.texture ?? null)
            && outputTextures === (connectedTextureInput.outputTextures ?? {})
            && nodeData.error === null
        ) {
            return;
        }

        setNode(id, {
            texture: connectedTextureInput.texture ?? null,
            outputTextures: connectedTextureInput.outputTextures ?? {},
            error: null,
        });
    }, [connectedTextureInput, id, nodeData.error, outputTextures, setNode, texture]);

    return (
        <BaseNode className="w-72">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Connected Texture Split
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <div className="text-xs text-muted-foreground">
                        Outputs {CONNECTED_TEXTURE_OUTPUTS.length} textures.
                    </div>
                </div>

                <Handle
                    type="target"
                    position={Position.Left}
                    id={CONNECTED_TEXTURE_INPUT_HANDLE_ID}
                    className="top-8! size-3! bg-indigo-500! border-indigo-300!"
                    data-type="connectedTexture"
                />

                <div className="nodrag flex  flex-col gap-1.5  pr-1">
                    {CONNECTED_TEXTURE_OUTPUTS.map((output) => {
                        const outputTexture = outputTextures[output.handleId] ?? null;

                        return (
                            <div key={output.handleId} className="relative flex items-center justify-end gap-1 pr-3 text-[10px] text-secondary-foreground">
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={output.handleId}
                                    className="size-3! -right-3! bg-blue-500! border-blue-300!"
                                    data-type="texture"
                                />
                                <span className="w-5 text-right tabular-nums">{output.index}</span>
                                <Image
                                    src={withBasePath(`/sample/${output.index}.png`)}
                                    alt={`Sample ${output.index}`}
                                    width={32}
                                    height={32}
                                    className="size-8 object-cover"
                                    style={{ imageRendering: "pixelated" }}
                                />
                                {outputTexture ? (
                                    <TexturePreview texture={outputTexture} className="size-8" />
                                ) : (
                                    <EmptyTexture className="size-8" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </BaseNodeContent>
        </BaseNode>
    );
});

ConnectedTextureSplitNode.displayName = "ConnectedTextureSplitNode";