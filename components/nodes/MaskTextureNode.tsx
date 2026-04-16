import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import { withBasePath } from "@/lib/base-path";
import { maskTexture, normalizeTextureUrl, type SerializedTextureData } from "@/lib/texture";
import { cn } from "@/lib/utils";
import useStore from "@/store/graph";
import { Image01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import Image from "next/image";
import React from "react";
import { EmptyTexture, TexturePreview } from "../EmptyTexture";
import { Button } from "../ui/button";

type Props = {
    id: string;
}

type TextureNodeData = {
    texture?: SerializedTextureData | null;
}

type MaskTextureNodeData = {
    texture?: SerializedTextureData | null;
    presetMask?: SerializedTextureData | null;
    error?: string | null;
}

const MASK_PRESET_ASSETS = [
    { name: "mask-t.png", src: "/assets/mask-t.png" },
    { name: "mask-b.png", src: "/assets/mask-b.png" },
    { name: "mask-l.png", src: "/assets/mask-l.png" },
    { name: "mask-r.png", src: "/assets/mask-r.png" },
    { name: "mask_crn_tl.png", src: "/assets/mask_crn_tl.png" },
    { name: "mask_crn_tr.png", src: "/assets/mask_crn_tr.png" },
    { name: "mask_crn_bl.png", src: "/assets/mask_crn_bl.png" },
    { name: "mask_crn_br.png", src: "/assets/mask_crn_br.png" },
    { name: "mask_inv_crn_tl.png", src: "/assets/mask_inv_crn_tl.png" },
    { name: "mask_inv_crn_tr.png", src: "/assets/mask_inv_crn_tr.png" },
    { name: "mask_inv_crn_bl.png", src: "/assets/mask_inv_crn_bl.png" },
    { name: "mask_inv_crn_br.png", src: "/assets/mask_inv_crn_br.png" },
] as const;

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
    const presetMask = nodeData.presetMask ?? null;
    const error = nodeData.error ?? null;
    const presetMasks = React.useMemo(() => {
        return MASK_PRESET_ASSETS.map((preset) => ({
            ...preset,
            src: withBasePath(preset.src),
        }));
    }, []);
    const effectiveMask = inputMask ?? presetMask;

    const onPresetSelect = React.useCallback(async (name: string, src: string) => {
        try {
            const normalizedTexture = await normalizeTextureUrl(src, name);
            setNode(id, { presetMask: normalizedTexture, error: null });
        } catch (presetError) {
            const message = presetError instanceof Error
                ? presetError.message
                : "Could not process the preset mask.";

            setNode(id, { presetMask: null, texture: null, error: message });
        }
    }, [id, setNode]);

    React.useEffect(() => {
        if (!inputTexture || !effectiveMask) {
            setNode(id, { texture: null, error: null });
            return;
        }

        try {
            const masked = maskTexture(inputTexture, effectiveMask);
            setNode(id, { texture: masked, error: null });
        } catch (maskError) {
            const message = maskError instanceof Error
                ? maskError.message
                : "Could not apply the texture mask.";

            setNode(id, { texture: null, error: message });
        }
    }, [effectiveMask, id, inputTexture, setNode]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Image01FreeIcons} />
                    Apply Mask
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
                <div className="relative flex flex-col gap-2 text-xs text-secondary-foreground">
                    <Handle type="target" position={Position.Left} id="inputMask" className="size-3! -left-3! bg-blue-500! border-blue-300!" data-type="texture" />
                    <span>Mask</span>
                    {!inputMask && (
                        <div className="nodrag flex flex-wrap gap-0.5">
                            {presetMasks.map((preset) => (
                                <Button
                                    key={preset.name}
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "size-4 overflow-hidden rounded-xs bg-transparent p-0",
                                        presetMask?.name === preset.name && "border-primary",
                                    )}
                                    onClick={() => onPresetSelect(preset.name, preset.src)}
                                    title={preset.name}
                                >
                                    <Image
                                        src={preset.src}
                                        alt={preset.name}
                                        width={32}
                                        height={32}
                                        className="size-4 object-cover"
                                        style={{ imageRendering: "pixelated" }}
                                    />
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

MaskTextureNode.displayName = "MaskTextureNode";