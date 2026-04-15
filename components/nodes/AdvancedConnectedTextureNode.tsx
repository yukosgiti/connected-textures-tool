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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import { withBasePath } from "@/lib/base-path";
import {
    CONNECTED_TEXTURE_BLEND_MODE_LABELS,
    CONNECTED_TEXTURE_OUTPUT_HANDLE_ID,
    CONNECTED_TEXTURE_OUTPUTS,
    generateAdvancedConnectedTexture,
    getAdvancedConnectedTextureMissingInputs,
    type AdvancedConnectedTextureInputs,
} from "@/lib/connected-texture";
import { type SerializedTextureData, type TextureBlendMode } from "@/lib/texture";
import useStore from "@/store/graph";
import { Image01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import Image from "next/image";
import React from "react";

type Props = {
    id: string;
};

type AdvancedConnectedTextureNodeData = {
    texture?: SerializedTextureData | null;
    outputTextures?: Record<string, SerializedTextureData | null>;
    error?: string | null;
    debug?: boolean;
    mode?: TextureBlendMode;
};

type TextureNodeData = {
    texture?: SerializedTextureData | null;
};

function areTexturesEqual(left: SerializedTextureData | null, right: SerializedTextureData | null) {
    if (left === right) {
        return true;
    }

    if (!left || !right) {
        return false;
    }

    return left.width === right.width
        && left.frameSize === right.frameSize
        && left.frames === right.frames
        && left.sourceFrames === right.sourceFrames
        && left.pixels === right.pixels
        && left.name === right.name;
}

function areOutputTexturesEqual(
    left: Record<string, SerializedTextureData | null>,
    right: Record<string, SerializedTextureData | null>,
) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    return leftKeys.every((key) => areTexturesEqual(left[key] ?? null, right[key] ?? null));
}

const ADVANCED_CONNECTED_TEXTURE_HANDLES = [
    { handleId: "inputTexture", key: "texture", label: "Base" },
    { handleId: "inputSideTop", key: "side_top", label: "Side Top" },
    { handleId: "inputSideRight", key: "side_rt", label: "Side Right" },
    { handleId: "inputSideBottom", key: "side_btm", label: "Side Bottom" },
    { handleId: "inputSideLeft", key: "side_lt", label: "Side Left" },
    { handleId: "inputInnerTopLeft", key: "crn_in_top_lt", label: "Inner Top Left" },
    { handleId: "inputInnerTopRight", key: "crn_in_top_rt", label: "Inner Top Right" },
    { handleId: "inputInnerBottomLeft", key: "crn_in_btm_lt", label: "Inner Bottom Left" },
    { handleId: "inputInnerBottomRight", key: "crn_in_btm_rt", label: "Inner Bottom Right" },
    { handleId: "inputOuterTopLeft", key: "crn_out_top_lt", label: "Outer Top Left" },
    { handleId: "inputOuterTopRight", key: "crn_out_top_rt", label: "Outer Top Right" },
    { handleId: "inputOuterBottomLeft", key: "crn_out_btm_lt", label: "Outer Bottom Left" },
    { handleId: "inputOuterBottomRight", key: "crn_out_btm_rt", label: "Outer Bottom Right" },
] as const;

const DEFAULT_BLEND_MODE: TextureBlendMode = "normal";

function getInputTexture(
    inputMap: Record<string, unknown>,
    handleId: string,
) {
    return (inputMap[handleId] as TextureNodeData | undefined)?.texture ?? null;
}

export const AdvancedConnectedTextureNode = memo(({ id }: Props) => {
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
    const nodeData = (node?.data as AdvancedConnectedTextureNodeData | undefined) ?? {};
    const baseTexture = getInputTexture(inputMap, "inputTexture");
    const sideTopTexture = getInputTexture(inputMap, "inputSideTop");
    const sideRightTexture = getInputTexture(inputMap, "inputSideRight");
    const sideBottomTexture = getInputTexture(inputMap, "inputSideBottom");
    const sideLeftTexture = getInputTexture(inputMap, "inputSideLeft");
    const innerTopLeftTexture = getInputTexture(inputMap, "inputInnerTopLeft");
    const innerTopRightTexture = getInputTexture(inputMap, "inputInnerTopRight");
    const innerBottomLeftTexture = getInputTexture(inputMap, "inputInnerBottomLeft");
    const innerBottomRightTexture = getInputTexture(inputMap, "inputInnerBottomRight");
    const outerTopLeftTexture = getInputTexture(inputMap, "inputOuterTopLeft");
    const outerTopRightTexture = getInputTexture(inputMap, "inputOuterTopRight");
    const outerBottomLeftTexture = getInputTexture(inputMap, "inputOuterBottomLeft");
    const outerBottomRightTexture = getInputTexture(inputMap, "inputOuterBottomRight");
    const texture = nodeData.texture ?? null;
    const outputTextures = nodeData.outputTextures ?? {};
    const outputTextureCount = Object.keys(outputTextures).length;
    const error = nodeData.error ?? null;
    const isCleared = texture === null && error === null && outputTextureCount === 0;
    const debug = nodeData.debug ?? false;
    const mode = nodeData.mode ?? DEFAULT_BLEND_MODE;
    const missingInputs = React.useMemo(() => {
        const inputs: AdvancedConnectedTextureInputs = {
            texture: baseTexture,
            side_top: sideTopTexture,
            side_rt: sideRightTexture,
            side_btm: sideBottomTexture,
            side_lt: sideLeftTexture,
            crn_in_top_lt: innerTopLeftTexture,
            crn_in_top_rt: innerTopRightTexture,
            crn_in_btm_lt: innerBottomLeftTexture,
            crn_in_btm_rt: innerBottomRightTexture,
            crn_out_top_lt: outerTopLeftTexture,
            crn_out_top_rt: outerTopRightTexture,
            crn_out_btm_lt: outerBottomLeftTexture,
            crn_out_btm_rt: outerBottomRightTexture,
        };

        return getAdvancedConnectedTextureMissingInputs(inputs);
    }, [
        baseTexture,
        innerBottomLeftTexture,
        innerBottomRightTexture,
        innerTopLeftTexture,
        innerTopRightTexture,
        outerBottomLeftTexture,
        outerBottomRightTexture,
        outerTopLeftTexture,
        outerTopRightTexture,
        sideBottomTexture,
        sideLeftTexture,
        sideRightTexture,
        sideTopTexture,
    ]);

    React.useEffect(() => {
        if (missingInputs.length > 0) {
            if (isCleared) {
                return;
            }

            setNode(id, { texture: null, outputTextures: {}, error: null });
            return;
        }

        try {
            const nextTexture = generateAdvancedConnectedTexture({
                texture: baseTexture,
                side_top: sideTopTexture,
                side_rt: sideRightTexture,
                side_btm: sideBottomTexture,
                side_lt: sideLeftTexture,
                crn_in_top_lt: innerTopLeftTexture,
                crn_in_top_rt: innerTopRightTexture,
                crn_in_btm_lt: innerBottomLeftTexture,
                crn_in_btm_rt: innerBottomRightTexture,
                crn_out_top_lt: outerTopLeftTexture,
                crn_out_top_rt: outerTopRightTexture,
                crn_out_btm_lt: outerBottomLeftTexture,
                crn_out_btm_rt: outerBottomRightTexture,
            }, mode);

            if (
                error === null
                && areTexturesEqual(texture, nextTexture.texture)
                && areOutputTexturesEqual(outputTextures, nextTexture.outputTextures)
            ) {
                return;
            }

            setNode(id, { texture: nextTexture.texture, outputTextures: nextTexture.outputTextures, error: null });
        } catch (generationError) {
            const message = generationError instanceof Error
                ? generationError.message
                : "Could not generate advanced connected textures.";

            setNode(id, { texture: null, outputTextures: {}, error: message });
        }
    }, [
        baseTexture,
        error,
        id,
        isCleared,
        innerBottomLeftTexture,
        innerBottomRightTexture,
        innerTopLeftTexture,
        innerTopRightTexture,
        missingInputs.length,
        mode,
        outerBottomLeftTexture,
        outerBottomRightTexture,
        outerTopLeftTexture,
        outerTopRightTexture,
        outputTextureCount,
        setNode,
        sideBottomTexture,
        sideLeftTexture,
        sideRightTexture,
        sideTopTexture,
        texture,
    ]);

    return (
        <BaseNode className="w-80">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Advanced Connected Texture
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
                        <Select value={mode} onValueChange={(value) => setNode(id, { mode: value as TextureBlendMode })}>
                            <SelectTrigger className="nodrag w-full" aria-label="Advanced connected texture blend mode">
                                <SelectValue placeholder="Select blend mode" />
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                                <SelectGroup>
                                    {(Object.entries(CONNECTED_TEXTURE_BLEND_MODE_LABELS) as [TextureBlendMode, string][]).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {missingInputs.length > 0 ? (
                            <p>Missing: {missingInputs.map((input) => input.label).join(", ")}</p>
                        ) : null}
                        {error && <p className="text-destructive">{error}</p>}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    {ADVANCED_CONNECTED_TEXTURE_HANDLES.map((entry) => (
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
                </div>

                {debug && (
                    <div className="nodrag mt-4 flex max-h-80 flex-col gap-1.5 overflow-auto pr-1">
                        {CONNECTED_TEXTURE_OUTPUTS.map((output) => {
                            const outputTexture = outputTextures[output.handleId] ?? null;

                            return (
                                <div key={output.handleId} className="flex items-center gap-1 text-[10px] text-secondary-foreground">
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

AdvancedConnectedTextureNode.displayName = "AdvancedConnectedTextureNode";