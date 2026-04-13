"use client";

import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useNodeData } from "@/hooks/store";
import { useAsRef } from "@/hooks/use-as-ref";
import { createColorTexture, normalizeHexColor } from "@/lib/procedural-texture";
import { type SerializedTextureData } from "@/lib/texture";
import useStore from "@/store/graph";
import { ColorPickerIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";

type Props = {
    id: string;
};

type ColorTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    color?: string;
};

const DEFAULT_COLOR = "#3b82f6";
const COLOR_PICKER_DEDUPE_MS = 50;

export const ColorTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const setNode = useStore((store) => store.setNode);
    const nodeData = (node?.data as ColorTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const color = nodeData.color ?? DEFAULT_COLOR;
    const [draftColor, setDraftColor] = React.useState(color);
    const colorRef = useAsRef(color);
    const pendingPickerColorRef = React.useRef<string | null>(null);
    const pickerCommitTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearPendingPickerCommit = React.useCallback(() => {
        if (pickerCommitTimeoutRef.current) {
            clearTimeout(pickerCommitTimeoutRef.current);
            pickerCommitTimeoutRef.current = null;
        }

        pendingPickerColorRef.current = null;
    }, []);

    const commitPickerColor = React.useCallback((nextColor: string) => {
        if (nextColor === colorRef.current) {
            setNode(id, { error: null });
            return;
        }

        setNode(id, { color: nextColor, error: null });
    }, [colorRef, id, setNode]);

    const schedulePickerColorCommit = React.useCallback((nextColor: string) => {
        pendingPickerColorRef.current = nextColor;

        if (pickerCommitTimeoutRef.current) {
            clearTimeout(pickerCommitTimeoutRef.current);
        }

        pickerCommitTimeoutRef.current = setTimeout(() => {
            pickerCommitTimeoutRef.current = null;

            const pendingColor = pendingPickerColorRef.current;

            if (!pendingColor) {
                return;
            }

            pendingPickerColorRef.current = null;
            commitPickerColor(pendingColor);
        }, COLOR_PICKER_DEDUPE_MS);
    }, [commitPickerColor]);

    const colorInputValue = normalizeHexColor(draftColor) ?? color;

    React.useEffect(() => {
        setDraftColor(color);
    }, [color]);

    React.useEffect(() => () => {
        clearPendingPickerCommit();
    }, [clearPendingPickerCommit]);

    React.useEffect(() => {
        if (!nodeData.color) {
            setNode(id, { color: DEFAULT_COLOR, error: null });
        }
    }, [id, nodeData.color, setNode]);

    React.useEffect(() => {
        try {
            const nextTexture = createColorTexture(color);
            setNode(id, { texture: nextTexture, error: null });
        } catch (colorError) {
            const message = colorError instanceof Error
                ? colorError.message
                : "Could not generate the color texture.";

            setNode(id, { texture: null, error: message });
        }
    }, [color, id, setNode]);

    const commitDraftColor = React.useCallback(() => {
        clearPendingPickerCommit();

        const normalizedColor = normalizeHexColor(draftColor);

        if (!normalizedColor) {
            setDraftColor(color);
            setNode(id, { error: "Use a valid hex color." });
            return;
        }

        setDraftColor(normalizedColor);
        setNode(id, { color: normalizedColor, error: null });
    }, [clearPendingPickerCommit, color, draftColor, id, setNode]);

    return (
        <BaseNode className="w-48">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={ColorPickerIcon} />
                    Color Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}

                    <InputGroup className="nodrag">
                        <InputGroupAddon align="inline-start">
                            <label className="flex cursor-pointer items-center">
                                <span className="size-4 rounded-sm border border-border" style={{ backgroundColor: colorInputValue }} />
                                <input
                                    type="color"
                                    value={colorInputValue}
                                    className="sr-only"
                                    onChange={(event) => {
                                        const nextColor = normalizeHexColor(event.target.value) ?? DEFAULT_COLOR;
                                        setDraftColor(nextColor);
                                        schedulePickerColorCommit(nextColor);
                                    }}
                                />
                            </label>
                        </InputGroupAddon>
                        <InputGroupInput
                            value={draftColor}
                            aria-label="Color hex"
                            className="nodrag uppercase"
                            onChange={(event) => setDraftColor(event.target.value)}
                            onBlur={commitDraftColor}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    commitDraftColor();
                                }
                            }}
                        />
                    </InputGroup>

                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>

                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

ColorTextureNode.displayName = "ColorTextureNode";