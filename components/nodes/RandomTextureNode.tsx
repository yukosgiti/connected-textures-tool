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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNodeData } from "@/hooks/store";
import {
    createRandomTexture,
    createRandomTextureSeed,
    RANDOM_TEXTURE_MODE_LABELS,
    type RandomTextureMode,
} from "@/lib/procedural-texture";
import { type SerializedTextureData } from "@/lib/texture";
import useStore from "@/store/graph";
import { DiceIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";

type Props = {
    id: string;
};

type RandomTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
    mode?: RandomTextureMode;
    seed?: number;
};

const DEFAULT_RANDOM_TEXTURE_MODE: RandomTextureMode = "grayscale";

export const RandomTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const setNode = useStore((store) => store.setNode);
    const nodeData = (node?.data as RandomTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;
    const mode = nodeData.mode ?? DEFAULT_RANDOM_TEXTURE_MODE;
    const initialSeedRef = React.useRef(createRandomTextureSeed());
    const seed = nodeData.seed ?? initialSeedRef.current;

    React.useEffect(() => {
        if (!nodeData.mode || nodeData.seed === undefined) {
            setNode(id, { mode, seed, error: null });
        }
    }, [id, mode, nodeData.mode, nodeData.seed, seed, setNode]);

    React.useEffect(() => {
        try {
            const nextTexture = createRandomTexture(mode, seed);
            setNode(id, { texture: nextTexture, error: null });
        } catch (randomError) {
            const message = randomError instanceof Error
                ? randomError.message
                : "Could not generate the random texture.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, mode, seed, setNode]);

    return (
        <BaseNode className="w-56">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={DiceIcon} />
                    Random Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-3">
                    <Select value={mode} onValueChange={(value) => setNode(id, { mode: value as RandomTextureMode })}>
                        <SelectTrigger className="nodrag w-full" aria-label="Random texture mode">
                            <SelectValue placeholder="Select random mode" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                                {(Object.entries(RANDOM_TEXTURE_MODE_LABELS) as [RandomTextureMode, string][]).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Button className="nodrag" size="sm" variant="outline" onClick={() => setNode(id, { seed: createRandomTextureSeed() })}>
                        <HugeiconsIcon icon={DiceIcon} data-icon="inline-start" />
                        Regenerate
                    </Button>

                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>

                <Handle type="source" position={Position.Right} id="outputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

RandomTextureNode.displayName = "RandomTextureNode";