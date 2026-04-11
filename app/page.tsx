"use client";
import useStore from "@/store/graph";
import { Background, ReactFlow } from '@xyflow/react';

export default function Page() {

  const { nodes, edges, nodeTypes, onNodesChange, onEdgesChange, onConnect } = useStore();

  return (
    <div className="min-h-svh p-6">
      <div className="flex min-w-0 flex-col gap-6 text-sm leading-loose">
        <div className="max-w-xl">
          <h1 className="font-medium">Shader surface modes</h1>
          <p>The square preview plays through the sprite sheet as an animation.</p>
          <p>The strip preview lays out every frame into one tall image.</p>
        </div>

        <div className="w-screen h-screen border-2 border-red-500">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
