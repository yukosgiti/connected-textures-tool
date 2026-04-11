import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";

import { useNodeData, useNodeInputs, useNodeOutputs } from "@/hooks/store";
import { Rotate360FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import { EmptyTexture } from "../EmptyTexture";


type Props = {
    id: string;
}


export const RotateTextureNode = memo(({ id }: Props) => {
    const nodeData = useNodeData(id);
    const inputData = useNodeInputs(id);
    const outputData = useNodeOutputs(id);

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
                    <EmptyTexture />
                </div>
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="target" position={Position.Left} id="inputValue" className="top-16! size-3! bg-orange-500! border-orange-300!" data-type="value" />
                <Handle type="source" position={Position.Right} id="output" data-type="texture" />

                <pre>
                    {JSON.stringify({
                        inputData,
                        outputData
                    }, null, 1)}
                </pre>
            </BaseNodeContent>
        </BaseNode>
    );
});

RotateTextureNode.displayName = "RotateTextureNode";