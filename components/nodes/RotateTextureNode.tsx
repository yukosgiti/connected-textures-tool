import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";

import { useNodeData, useNodeInputs } from "@/hooks/store";
import { rotateTexture, type SerializedTextureData } from "@/lib/texture";
import useStore from "@/store/graph";
import { Rotate360FreeIcons } from "@hugeicons/core-free-icons";
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


const EMPTY_VALUES: number[] = [];


type RotateTextureNodeData = {
    texture?: SerializedTextureData | null;
    error?: string | null;
}


export const RotateTextureNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const inputData = useNodeInputs(id);
    const setNode = useStore((store) => store.setNode);
    const textureInput = inputData.find((input) => {
        return Boolean((input as TextureNodeData).texture);
    }) as TextureNodeData | undefined;
    const valueInput = inputData.find((input) => {
        return Array.isArray((input as ValueNodeData).data);
    }) as ValueNodeData | undefined;
    const inputTexture = textureInput?.texture ?? null;
    const rotationValues = valueInput?.data ?? EMPTY_VALUES;
    const valueFrames = rotationValues.length;
    const nodeData = (node?.data as RotateTextureNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const error = nodeData.error ?? null;

    React.useEffect(() => {
        if (!inputTexture || valueFrames === 0) {
            setNode(id, { texture: null, error: null });

            return;
        }

        try {
            const rotatedTexture = rotateTexture(inputTexture, rotationValues);
            setNode(id, { texture: rotatedTexture, error: null });
        } catch (rotationError) {
            const message = rotationError instanceof Error
                ? rotationError.message
                : "Could not rotate the texture.";

            setNode(id, { texture: null, error: message });
        }
    }, [id, inputTexture, rotationValues, setNode, valueFrames]);

    return (
        <BaseNode className="w-40">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={Rotate360FreeIcons} />
                    Rotate Texture
                </BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent >
                <div className="flex flex-col gap-4">
                    {texture ? <TexturePreview texture={texture} /> : <EmptyTexture />}
                    <p className="text-muted-foreground text-xs">
                        {texture ? `${texture.name} · ${texture.frames} frames` : "Connect both inputs"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        {valueFrames > 0 ? `Rotation input: ${valueFrames} samples` : "Connect a value input"}
                    </p>
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </div>
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="target" position={Position.Left} id="inputValue" className="top-16! size-3! bg-orange-500! border-orange-300!" data-type="value" />
                <Handle type="source" position={Position.Right} id="output" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

RotateTextureNode.displayName = "RotateTextureNode";