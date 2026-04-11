import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent
} from "@/components/base-node";

import { useNodeData } from "@/hooks/store";
import useStore from "@/store/graph";
import { Handle, Position } from "@xyflow/react";
import { Button } from "../ui/button";



// data: new Array(60).fill(1),
// setLinear: () => set(() => {
//     const newData = new Array(60).fill(1);
//     newData.forEach((_, index) => {
//         newData[index] = index / 60;
//     });
//     return { data: newData };
// }),
// setRandom: () => set(() => {
//     const newData = new Array(60).fill(1);
//     newData.forEach((_, index) => {
//         newData[index] = Math.random();
//     });
//     return { data: newData };
// }),
// setZero: () => set(() => {
//     const newData = new Array(60).fill(0);
//     return { data: newData };
// }),
// setSine: (phase: number) => set(() => {
//     const newData = new Array(60).fill(1);
//     newData.forEach((_, index) => {
//         newData[index] = (Math.sin(index / 60 * Math.PI * 2 + phase) + 1) / 2;
//     });
//     return { data: newData };
// }),
// setInvert: () => set((state) => {
//     const newData = state.data.map(value => 1 - value);
//     return { data: newData };
// })


type Props = {
    id: string;
}


type ValueNodeData = {
    data: number[];
}


export const ValueNode = memo(({ id }: Props) => {
    const nodeData = useNodeData(id);
    const values = ((nodeData?.data as ValueNodeData | undefined)?.data) ?? [];

    function setRandom() {
        const newData = new Array(60).fill(1);
        newData.forEach((_, index) => {
            newData[index] = Math.random();
        });
        useStore.getState().setNode(id, { data: newData });
    }
    function setZero() {
        const newData = new Array(60).fill(0);
        useStore.getState().setNode(id, { data: newData });
    }
    function setSine(phase: number) {
        const newData = new Array(60).fill(1);
        newData.forEach((_, index) => {
            newData[index] = (Math.sin(index / 60 * Math.PI * 2 + phase) + 1) / 2;
        });
        useStore.getState().setNode(id, { data: newData });
    }

    function setInvert() {
        const currentData = ((useStore.getState().getNode(id)?.data as ValueNodeData | undefined)?.data) ?? [];
        const newData = currentData.map((value) => 1 - value);
        useStore.getState().setNode(id, { data: newData });
    }

    function setLinear() {
        const newData = new Array(60).fill(1);
        newData.forEach((_, index) => {
            newData[index] = index / 60;
        });
        useStore.getState().setNode(id, { data: newData });
    }


    return (
        <BaseNode className="w-96">
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <div className="">Value, {nodeData?.type}, {nodeData?.id}</div>
                    <div className="flex items-center gap-2">
                        <Button variant={"outline"} className={"nodrag"} size={"sm"} onClick={() => setLinear()}>
                            Linear
                        </Button>
                        <Button variant={"outline"} className={"nodrag"} size={"sm"} onClick={() => setRandom()}>
                            Random
                        </Button>
                        <Button variant={"outline"} className={"nodrag"} size={"sm"} onClick={() => setZero()}>
                            Zero
                        </Button>
                        <Button variant={"outline"} className={"nodrag"} size={"sm"} onClick={() => setSine(Math.PI / 2)}>
                            Sine
                        </Button>
                        <Button variant={"outline"} className={"nodrag"} size={"sm"} onClick={() => setInvert()}>
                            Invert
                        </Button>

                    </div>
                    <div className="flex  nodrag self-center relative isolate  w-full">
                        {values.map((value, i) => (
                            <span key={i}
                                className="bg-secondary  w-full h-full"
                            >
                                <span className="block bg-transparent " style={{ height: ((1 - value) * 100) }} />
                                <span className="block bg-primary rounded-t-sm" style={{ height: (value * 100) }} />
                            </span>
                        ))}
                    </div>
                </div>
                <Handle type="source" position={Position.Right} id="output" />
            </BaseNodeContent>
        </BaseNode>
    );
});

ValueNode.displayName = "ValueNode";