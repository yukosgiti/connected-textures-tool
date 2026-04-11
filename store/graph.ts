
import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { initialNodes } from './nodes';
import { initialEdges } from './edges';
import { AppState } from './types';
import { ValueNode } from '@/components/nodes/ValueNode';
import { TextureNode } from '@/components/nodes/TextureNode';
import { RotateTextureNode } from '@/components/nodes/RotateTextureNode';
 
const useStore = create<AppState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  nodeTypes: {
    value: ValueNode,
    texture: TextureNode,
    rotateTexture: RotateTextureNode,
  },
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (nodes) => {
    set({ nodes });
  },
  setEdges: (edges) => {
    set({ edges });
  },
  setNode: (id: string, newData: any) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      ),
    }));
  },
  getNode: (id: string) => {
    const node = get().nodes.find((node) => node.id === id);
    return node;
  },
  getNodeInputs: (id: string) => {
    const inputData = get().edges
      .filter((edge) => edge.target === id)
      .map((edge) => {
        const sourceNode = get().nodes.find((node) => node.id === edge.source);
        return sourceNode ? sourceNode.data : null;
      })
      .filter((data) => data !== null);
    return inputData;
  },
  getNodeOutputs: (id: string) => {
    const outputData = get().edges
      .filter((edge) => edge.source === id)
      .map((edge) => {
        const targetNode = get().nodes.find((node) => node.id === edge.target);
        return targetNode ? targetNode.data : null;
      })
      .filter((data) => data !== null);
    return outputData;
  },
}));


 
export default useStore;