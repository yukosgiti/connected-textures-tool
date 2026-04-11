import useStore from "@/store/graph";

export const useNodeData = (id: string) => {
    const nodeData = useStore(store => store.nodes.find((node) => node.id === id));
    return nodeData;
}

export const useNodeInputs = (id: string) => {
    const inputs = useStore.getState().edges
        .filter((edge) => edge.target === id)
        .map((edge) => {
            const sourceNode = useStore.getState().nodes.find((node) => node.id === edge.source);
            return sourceNode ? sourceNode.data : null;
        })
        .filter((data) => data !== null);
    return inputs;
}

export const useNodeOutputs = (id: string) => {
    const outputs = useStore.getState().edges
        .filter((edge) => edge.source === id)
        .map((edge) => {
            const targetNode = useStore.getState().nodes.find((node) => node.id === edge.target);
            return targetNode ? targetNode.data : null;
        })
        .filter((data) => data !== null);
    return outputs;
}
