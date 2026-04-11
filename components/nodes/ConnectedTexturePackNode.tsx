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
import {
    CONNECTED_TEXTURE_OUTPUT_HANDLE_ID,
    CONNECTED_TEXTURE_OUTPUTS,
    getConnectedTextureTextureInputHandleId,
    packConnectedTextureOutputs,
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

type PackNodeData = {
    texture?: SerializedTextureData | null;
    outputTextures?: Record<string, SerializedTextureData | null>;
    error?: string | null;
};

type TextureNodeData = {
    texture?: SerializedTextureData | null;
};

export const ConnectedTexturePackNode = memo(({ id }: Props) => {
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
    const nodeData = (node?.data as PackNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const outputTextures = nodeData.outputTextures ?? {};
    const packedInputs = React.useMemo(() => {
        return CONNECTED_TEXTURE_OUTPUTS.reduce<Record<string, SerializedTextureData | null>>((accumulator, output) => {
            const inputHandleId = getConnectedTextureTextureInputHandleId(output.index);
            const inputTexture = (inputMap[inputHandleId] as TextureNodeData | undefined)?.texture ?? null;

            accumulator[output.handleId] = inputTexture;
            return accumulator;
        }, {});
    }, [inputMap]);
    const missingCount = CONNECTED_TEXTURE_OUTPUTS.filter((output) => !packedInputs[output.handleId]).length;
    const hasMatchingOutputs = React.useMemo(() => {
        return CONNECTED_TEXTURE_OUTPUTS.every((output) => {
            return outputTextures[output.handleId] === packedInputs[output.handleId];
        });
    }, [outputTextures, packedInputs]);

    React.useEffect(() => {
        if (missingCount > 0) {
            if (texture === null && error === null && Object.keys(outputTextures).length === 0) {
                return;
            }

            setNode(id, { texture: null, outputTextures: {}, error: null });
            return;
        }

        if (hasMatchingOutputs && texture !== null && error === null) {
            return;
        }

        try {
            const packedConnectedTexture = packConnectedTextureOutputs(packedInputs, "Packed Connected Texture");
            setNode(id, {
                texture: packedConnectedTexture.texture,
                outputTextures: packedConnectedTexture.outputTextures,
                error: null,
            });
        } catch (packError) {
            const message = packError instanceof Error
                ? packError.message
                : "Could not pack connected texture outputs.";

            setNode(id, { texture: null, outputTextures: {}, error: message });
        }
    }, [error, hasMatchingOutputs, id, missingCount, outputTextures, packedInputs, setNode, texture]);

    return (
        <BaseNode className="w-72">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Textures To Connected Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <p>Requires {CONNECTED_TEXTURE_OUTPUTS.length} textures.</p>
                        {missingCount > 0 && <p>Missing: {missingCount}</p>}
                        {error && <p className="text-destructive">{error}</p>}
                    </div>
                </div>

                <div className="nodrag flex  flex-col gap-1.5  pr-1">
                    {CONNECTED_TEXTURE_OUTPUTS.map((output) => {
                        const inputHandleId = getConnectedTextureTextureInputHandleId(output.index);
                        const inputTexture = packedInputs[output.handleId] ?? null;

                        return (
                            <div key={inputHandleId} className="relative flex items-center gap-1 pl-3 text-[10px] text-secondary-foreground">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={inputHandleId}
                                    className="size-3! -left-3! bg-blue-500! border-blue-300!"
                                    data-type="texture"
                                />
                                <span className="w-5 text-right tabular-nums">{output.index}</span>
                                <Image
                                    src={`/sample/${output.index}.png`}
                                    alt={`Sample ${output.index}`}
                                    width={32}
                                    height={32}
                                    className="size-8 object-cover"
                                    style={{ imageRendering: "pixelated" }}
                                />
                                {inputTexture ? (
                                    <TexturePreview texture={inputTexture} className="size-8" />
                                ) : (
                                    <EmptyTexture className="size-8" />
                                )}
                            </div>
                        );
                    })}
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    id={CONNECTED_TEXTURE_OUTPUT_HANDLE_ID}
                    className="top-8! size-3! bg-indigo-500! border-indigo-300!"
                    data-type="connectedTexture"
                />
            </BaseNodeContent>
        </BaseNode>
    );
});

ConnectedTexturePackNode.displayName = "ConnectedTexturePackNode";