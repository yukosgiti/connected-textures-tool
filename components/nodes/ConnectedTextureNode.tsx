"use client";

import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import {
    CONNECTED_TEXTURE_OUTPUT_HANDLE_ID,
    CONNECTED_TEXTURE_OUTPUTS,
    generateConnectedTexture,
    getConnectedTextureMissingInputs
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
    debug?: boolean;
};

type TextureNodeData = {
    texture?: SerializedTextureData | null;
};

const CONNECTED_TEXTURE_HANDLES = [
    { handleId: "inputTexture", key: "texture", label: "Base" },
    { handleId: "inputSideTop", key: "side_top", label: "Side Top" },
    { handleId: "inputInnerTopLeft", key: "crn_in_top_lt", label: "Inner Top Left" },
    { handleId: "inputOuterTopLeft", key: "crn_out_top_lt", label: "Outer Top Left" },
] as const;

export const ConnectedTextureNode = memo(({ id }: Props) => {
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
    const nodeData = (node?.data as ConnectedTextureNodeData | undefined) ?? {};
    const baseTexture = (inputMap.inputTexture as TextureNodeData | undefined)?.texture ?? null;
    const sideTopTexture = (inputMap.inputSideTop as TextureNodeData | undefined)?.texture ?? null;
    const innerTopLeftTexture = (inputMap.inputInnerTopLeft as TextureNodeData | undefined)?.texture ?? null;
    const outerTopLeftTexture = (inputMap.inputOuterTopLeft as TextureNodeData | undefined)?.texture ?? null;
    const inputs = React.useMemo(() => {
        return {
            texture: baseTexture,
            side_top: sideTopTexture,
            crn_in_top_lt: innerTopLeftTexture,
            crn_out_top_lt: outerTopLeftTexture,
        };
    }, [baseTexture, innerTopLeftTexture, outerTopLeftTexture, sideTopTexture]);
    const texture = nodeData.texture ?? null;
    const outputTextures = nodeData.outputTextures ?? {};
    const error = nodeData.error ?? null;
    const debug = nodeData.debug ?? false;
    const missingInputs = getConnectedTextureMissingInputs(inputs);

    React.useEffect(() => {
        if (missingInputs.length > 0) {
            setNode(id, { texture: null, outputTextures: {}, error: null });
            return;
        }

        try {
            const nextTexture = generateConnectedTexture(inputs);
            setNode(id, { texture: nextTexture.texture, outputTextures: nextTexture.outputTextures, error: null });
        } catch (generationError) {
            const message = generationError instanceof Error
                ? generationError.message
                : "Could not generate connected textures.";

            setNode(id, { texture: null, outputTextures: {}, error: message });
        }
    }, [id, inputs, missingInputs.length, setNode]);

    return (
        <BaseNode className="w-72">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Connected Texture
                </BaseNodeHeaderTitle>
                <ButtonGroup>
                    <Button
                        variant={debug ? "default" : "outline"}
                        className="nodrag px-1.5 text-[10px]"
                        size="xs"
                        onClick={() => setNode(id, { debug: !debug })}
                    >
                        Debug
                    </Button>
                </ButtonGroup>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">

                        {error && <p className="text-destructive">{error}</p>}
                    </div>
                </div>

                {CONNECTED_TEXTURE_HANDLES.map((entry) => (
                    <div key={entry.handleId} className="relative text-xs text-secondary-foreground">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={entry.handleId}
                            className="size-3! -left-3! bg-blue-500! border-blue-300!"
                            data-type="texture"
                        />
                        {entry.label}
                    </div>
                ))}

                {debug && (
                    <div className="nodrag flex max-h-80 flex-col gap-1.5 overflow-auto pr-1">
                        {CONNECTED_TEXTURE_OUTPUTS.map((output) => {
                            const outputTexture = outputTextures[output.handleId] ?? null;

                            return (
                                <div key={output.handleId} className="flex items-center gap-1 text-[10px] text-secondary-foreground">
                                    <span className="w-5 text-right tabular-nums">{output.index}</span>
                                    <Image
                                        src={`/sample/${output.index}.png`}
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
                )}
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

ConnectedTextureNode.displayName = "ConnectedTextureNode";