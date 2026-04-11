import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";

import { useNodeInputs } from "@/hooks/store";
import { type SerializedTextureData } from "@/lib/texture";
import { Rotate360FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
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


export const RotateTextureNode = memo(({ id }: Props) => {
    const inputData = useNodeInputs(id);
    const textureInput = inputData.find((input) => {
        return Boolean((input as TextureNodeData).texture);
    }) as TextureNodeData | undefined;
    const valueInput = inputData.find((input) => {
        return Array.isArray((input as ValueNodeData).data);
    }) as ValueNodeData | undefined;
    const frameIndex = 0;
    const texture = textureInput?.texture ?? null;
    const valueFrames = valueInput?.data?.length ?? 0;

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
                    {texture ? <TexturePreview texture={texture} frameIndex={frameIndex} /> : <EmptyTexture />}
                    <p className="text-muted-foreground text-xs">
                        {texture ? `${texture.name} · ${texture.frames} frames` : "Connect a texture input"}
                    </p>
                    {valueFrames > 0 && <p className="text-muted-foreground text-xs">Value input: {valueFrames} samples</p>}
                </div>
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="target" position={Position.Left} id="inputValue" className="top-16! size-3! bg-orange-500! border-orange-300!" data-type="value" />
                <Handle type="source" position={Position.Right} id="output" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

RotateTextureNode.displayName = "RotateTextureNode";