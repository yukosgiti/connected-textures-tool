"use client";
import useStore from "@/store/graph";
import { createNode, NODE_TYPE_LABELS, type AppNodeType } from "@/store/nodes";
import { Background, ReactFlow, type ReactFlowInstance } from '@xyflow/react';
import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../components/ui/context-menu";

export default function Page() {
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = React.useState<{ x: number; y: number } | null>(null);

  const { nodes, edges, nodeTypes, onNodesChange, onEdgesChange, onConnect, setNodes } = useStore();

  const nodeTypeEntries = React.useMemo(() => {
    return Object.keys(nodeTypes)
      .filter((type): type is AppNodeType => type in NODE_TYPE_LABELS)
      .map((type) => ({
        type,
        label: NODE_TYPE_LABELS[type],
      }));
  }, [nodeTypes]);

  const onContextMenuCapture = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleAddNode = React.useCallback((type: AppNodeType) => {
    if (!reactFlowInstance || !contextMenuPosition) {
      return;
    }

    const position = reactFlowInstance.screenToFlowPosition(contextMenuPosition);
    const nextNode = createNode(type, position);

    setNodes([...useStore.getState().nodes, nextNode]);
  }, [contextMenuPosition, reactFlowInstance, setNodes]);

  return (
    <div className="min-h-svh p-6">
      <div className="flex min-w-0 flex-col gap-6 text-sm leading-loose">
        <div className="max-w-xl">
          <h1 className="font-medium">Shader surface modes</h1>
          <p>The square preview plays through the sprite sheet as an animation.</p>
          <p>The strip preview lays out every frame into one tall image.</p>
        </div>

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="h-[80vh] w-[80vw] border-2 border-red-500 bg-secondary dark:bg-background" onContextMenuCapture={onContextMenuCapture}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                fitView
              >
                <Background />
              </ReactFlow>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Add Node</ContextMenuLabel>
            <ContextMenuSeparator />
            {nodeTypeEntries.map(({ type, label }) => (
              <ContextMenuItem key={type} onSelect={() => handleAddNode(type)}>
                {label}
              </ContextMenuItem>
            ))}
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  )
}
