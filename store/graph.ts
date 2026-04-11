
import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { initialNodes } from './nodes';
import { initialEdges } from './edges';
import { AppState } from './types';
import { PreviewNode } from '@/components/nodes/PreviewNode';
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
    preview: PreviewNode,
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
  setNode: (id, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      ),
    }));
  },
  getNode: (id) => get().nodes.find((node) => node.id === id),
}));


 
export default useStore;