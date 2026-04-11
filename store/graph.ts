
import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { initialNodes } from './nodes';
import { initialEdges } from './edges';
import { AppState } from './types';
import { PreviewNode } from '@/components/nodes/PreviewNode';
import { ConnectedTextureNode } from '@/components/nodes/ConnectedTextureNode';
import { ConnectedTexturePackNode } from '@/components/nodes/ConnectedTexturePackNode';
import { ConnectedTextureSplitNode } from '@/components/nodes/ConnectedTextureSplitNode';
import { HslTextureNode } from '@/components/nodes/HslTextureNode';
import { InvertTextureNode } from '@/components/nodes/InvertTextureNode';
import { MaskTextureNode } from '@/components/nodes/MaskTextureNode';
import { MergeTextureNode } from '@/components/nodes/MergeTextureNode';
import { OpacityTextureNode } from '@/components/nodes/OpacityTextureNode';
import { PhaseTextureNode } from '@/components/nodes/PhaseTextureNode';
import { ScaleTextureNode } from '@/components/nodes/ScaleTextureNode';
import { TranslateTextureNode } from '@/components/nodes/TranslateTextureNode';
import { ValueNode } from '@/components/nodes/ValueNode';
import { TextureNode } from '@/components/nodes/TextureNode';
import { RotateTextureNode } from '@/components/nodes/RotateTextureNode';
import { type Connection } from '@xyflow/react';

type HandleDataType = 'value' | 'texture' | 'connectedTexture' | null;

function getHandleDataType(nodeType: string | undefined, handleId: string | null | undefined, direction: 'source' | 'target'): HandleDataType {
  switch (nodeType) {
    case 'value':
      return direction === 'source' ? 'value' : null;
    case 'texture':
      return direction === 'source' ? 'texture' : null;
    case 'connectedTexture':
      return direction === 'source' ? 'connectedTexture' : 'texture';
    case 'connectedTextureSplit':
      return direction === 'source'
        ? 'texture'
        : handleId === 'inputConnectedTexture'
          ? 'connectedTexture'
          : null;
    case 'connectedTexturePack':
      return direction === 'source'
        ? 'connectedTexture'
        : handleId?.startsWith('inputTexture')
          ? 'texture'
          : null;
    case 'preview':
      if (direction !== 'target') {
        return null;
      }

      if (handleId === 'inputConnectedTexture') {
        return 'connectedTexture';
      }

      return handleId === 'inputTexture' ? 'texture' : null;
    default:
      if (direction === 'source') {
        return 'texture';
      }

      if (!handleId) {
        return null;
      }

      return handleId.includes('inputValue')
        || handleId.includes('inputX')
        || handleId.includes('inputY')
        || handleId.includes('inputHue')
        || handleId.includes('inputSaturation')
        || handleId.includes('inputLightness')
        || handleId.includes('inputOpacity')
        || handleId.includes('inputFrames')
        ? 'value'
        : 'texture';
  }
}

function isConnectionTypeValid(connection: Connection, getNode: (id: string) => { type?: string } | undefined) {
  if (!connection.source || !connection.target) {
    return false;
  }

  const sourceNode = getNode(connection.source);
  const targetNode = getNode(connection.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  const sourceType = getHandleDataType(sourceNode.type, connection.sourceHandle, 'source');
  const targetType = getHandleDataType(targetNode.type, connection.targetHandle, 'target');

  return sourceType !== null && sourceType === targetType;
}
 
const useStore = create<AppState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  nodeTypes: {
    value: ValueNode,
    texture: TextureNode,
    connectedTexture: ConnectedTextureNode,
    connectedTextureSplit: ConnectedTextureSplitNode,
    connectedTexturePack: ConnectedTexturePackNode,
    rotateTexture: RotateTextureNode,
    translateTexture: TranslateTextureNode,
    scaleTexture: ScaleTextureNode,
    phaseTexture: PhaseTextureNode,
    hslTexture: HslTextureNode,
    invertTexture: InvertTextureNode,
    opacityTexture: OpacityTextureNode,
    mergeTexture: MergeTextureNode,
    maskTexture: MaskTextureNode,
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
    if (!isConnectionTypeValid(connection, get().getNode)) {
      return;
    }

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