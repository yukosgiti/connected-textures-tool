import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  NodeTypes,
} from '@xyflow/react';
 
export type AppNode = Node;
 
export type AppState = {
  nodes: AppNode[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setNode: (id: string, newData: any) => void;
  getNode: (id: string) => AppNode | undefined;
  getNodeInputs: (id: string) =>  Record<string, unknown>[];
  getNodeOutputs: (id: string) => Record<string, unknown>[];
};
