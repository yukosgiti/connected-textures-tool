import React from "react";
import useStore from "@/store/graph";

export const useNodeData = (id: string) => {
    const nodeData = useStore(store => store.nodes.find((node) => node.id === id));
    return nodeData;
}

export const useNodeInputs = (id: string) => {
    const nodes = useStore((store) => store.nodes);
    const edges = useStore((store) => store.edges);
    const inputs = React.useMemo(() => edges
        .filter((edge) => edge.target === id)
        .map((edge) => {
            const sourceNode = nodes.find((node) => node.id === edge.source);
            return sourceNode ? sourceNode.data : null;
        })
        .filter((data) => data !== null), [edges, id, nodes]);
    return inputs;
}

export const useNodeOutputs = (id: string) => {
    const nodes = useStore((store) => store.nodes);
    const edges = useStore((store) => store.edges);
    const outputs = React.useMemo(() => edges
        .filter((edge) => edge.source === id)
        .map((edge) => {
            const targetNode = nodes.find((node) => node.id === edge.target);
            return targetNode ? targetNode.data : null;
        })
        .filter((data) => data !== null), [edges, id, nodes]);
    return outputs;
}
