"use client";

import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";
import { Button } from "@/components/ui/button";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import { CONNECTED_TEXTURE_INPUT_HANDLE_ID } from "@/lib/connected-texture";
import { downloadConnectedTextureZip, downloadTextureZip } from "@/lib/export-texture";
import { type SerializedTextureData } from "@/lib/texture";
import useStore from "@/store/graph";
import { DownloadCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";

type Props = {
    id: string;
};

type TextureNodeData = {
    texture?: SerializedTextureData | null;
};

type ConnectedTextureNodeData = {
    texture?: SerializedTextureData | null;
    outputTextures?: Record<string, SerializedTextureData | null>;
};

type ExportNodeData = {
    error?: string | null;
};

export const ExportNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const setNode = useStore((store) => store.setNode);
    const nodes = useStore((store) => store.nodes);
    const edges = useStore((store) => store.edges);
    const [isExporting, setIsExporting] = React.useState(false);
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
    const connectedTextureInput = inputMap[CONNECTED_TEXTURE_INPUT_HANDLE_ID] as ConnectedTextureNodeData | undefined;
    const error = ((node?.data as ExportNodeData | undefined) ?? {}).error ?? null;
    const texture = textureInput?.texture ?? null;
    const connectedOutputTextures = connectedTextureInput?.outputTextures ?? {};
    const hasConnectedTexture = Boolean(connectedTextureInput?.texture);
    const hasTexture = Boolean(texture);

    const handleExport = React.useCallback(async () => {
        if (isExporting) {
            return;
        }

        setIsExporting(true);
        setNode(id, { error: null });

        try {
            if (hasConnectedTexture) {
                await downloadConnectedTextureZip(connectedOutputTextures);
            } else if (texture) {
                await downloadTextureZip(texture);
            } else {
                throw new Error("Connect a texture or connected texture to export.");
            }
        } catch (exportError) {
            const message = exportError instanceof Error
                ? exportError.message
                : "Could not export textures.";

            setNode(id, { error: message });
        } finally {
            setIsExporting(false);
        }
    }, [connectedOutputTextures, hasConnectedTexture, id, isExporting, setNode, texture]);

    return (
        <BaseNode className="w-64">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={DownloadCircle01Icon} />
                    Export
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <p>Exports a zipped PNG bundle.</p>
                        <p>{hasConnectedTexture ? "Connected texture: 47 PNGs" : hasTexture ? "Texture: 1 PNG" : "Connect an input to export"}</p>
                        {error && <p className="text-destructive">{error}</p>}
                    </div>

                    <Button
                        className="nodrag"
                        size="sm"
                        onClick={handleExport}
                        disabled={isExporting || (!hasTexture && !hasConnectedTexture)}
                    >
                        <HugeiconsIcon icon={DownloadCircle01Icon} data-icon="inline-start" />
                        {isExporting ? "Exporting..." : "Download Zip"}
                    </Button>
                </div>

                <div className="relative mt-4 text-xs text-secondary-foreground">
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="inputTexture"
                        className="size-3! -left-3! bg-blue-500! border-blue-300!"
                        data-type="texture"
                    />
                    Texture
                </div>

                <div className="relative mt-2 text-xs text-secondary-foreground">
                    <Handle
                        type="target"
                        position={Position.Left}
                        id={CONNECTED_TEXTURE_INPUT_HANDLE_ID}
                        className="size-3! -left-3! bg-indigo-500! border-indigo-300!"
                        data-type="connectedTexture"
                    />
                    Connected Texture
                </div>
            </BaseNodeContent>
        </BaseNode>
    );
});

ExportNode.displayName = "ExportNode";