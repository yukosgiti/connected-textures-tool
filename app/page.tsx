"use client";
import { CONNECTED_TEXTURE_OUTPUTS, getConnectedTextureTextureInputHandleId } from "@/lib/connected-texture";
import useStore from "@/store/graph";
import { createNode, NODE_TYPE_LABELS, type AppNodeType } from "@/store/nodes";
import {
  ColorPickerIcon,
  DiceIcon,
  DownloadCircle01Icon,
  FunctionSquareIcon,
  Image01FreeIcons,
  Rotate360FreeIcons,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Background, ReactFlow, type ReactFlowInstance } from '@xyflow/react';
import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../components/ui/context-menu";

const NODE_SUBMENU_GROUPS: Array<{ label: string; types: AppNodeType[] }> = [
  {
    label: "Inputs",
    types: ["value", "texture", "colorTexture", "randomTexture"],
  },
  {
    label: "Connected Textures",
    types: ["connectedTexture", "connectedTextureSplit", "connectedTexturePack"],
  },
  {
    label: "Texture Operations",
    types: [
      "rotateTexture",
      "translateTexture",
      "scaleTexture",
      "hslTexture",
      "invertTexture",
      "opacityTexture",
      "mergeTexture",
      "maskTexture",
    ],
  },
  {
    label: "Timeline Operations",
    types: ["phaseTexture", "selectTexture"],
  },
];

const TOP_LEVEL_NODE_TYPES: AppNodeType[] = ["preview", "export"];

const NODE_TYPE_ICONS: Record<AppNodeType, typeof Image01FreeIcons> = {
  value: FunctionSquareIcon,
  texture: Image01FreeIcons,
  colorTexture: ColorPickerIcon,
  randomTexture: DiceIcon,
  connectedTexture: Image01FreeIcons,
  connectedTextureSplit: Image01FreeIcons,
  connectedTexturePack: Image01FreeIcons,
  rotateTexture: Rotate360FreeIcons,
  translateTexture: Image01FreeIcons,
  scaleTexture: Image01FreeIcons,
  phaseTexture: Image01FreeIcons,
  selectTexture: Image01FreeIcons,
  hslTexture: Image01FreeIcons,
  invertTexture: Image01FreeIcons,
  opacityTexture: Image01FreeIcons,
  mergeTexture: Image01FreeIcons,
  maskTexture: Image01FreeIcons,
  preview: ViewIcon,
  export: DownloadCircle01Icon,
};

export default function Page() {
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = React.useState<{ x: number; y: number } | null>(null);

  const { nodes, edges, nodeTypes, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } = useStore();

  const menuEntries = React.useMemo(() => {
    const availableNodeTypes = new Set(
      Object.keys(nodeTypes).filter((type): type is AppNodeType => type in NODE_TYPE_LABELS),
    );

    const groupedEntries = NODE_SUBMENU_GROUPS.map((group) => ({
      label: group.label,
      entries: group.types
        .filter((type) => availableNodeTypes.has(type))
        .map((type) => ({
          type,
          label: NODE_TYPE_LABELS[type],
        })),
    })).filter((group) => group.entries.length > 0);

    const groupedTypes = new Set(groupedEntries.flatMap((group) => group.entries.map((entry) => entry.type)));
    const topLevelEntries = TOP_LEVEL_NODE_TYPES
      .filter((type) => availableNodeTypes.has(type))
      .map((type) => ({
        type,
        label: NODE_TYPE_LABELS[type],
      }));

    const assignedTypes = new Set([...groupedTypes, ...topLevelEntries.map((entry) => entry.type)]);
    const remainingEntries = [...availableNodeTypes]
      .filter((type) => !assignedTypes.has(type))
      .map((type) => ({
        type,
        label: NODE_TYPE_LABELS[type],
      }));

    return {
      groupedEntries,
      topLevelEntries,
      remainingEntries,
    };
  }, [nodeTypes]);

  const onContextMenuCapture = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleAddNode = React.useCallback((type: AppNodeType) => {
    if (!reactFlowInstance || !contextMenuPosition) {
      return;
    }

    const position = reactFlowInstance.screenToFlowPosition(contextMenuPosition);

    if (type === "connectedTextureSplit" || type === "connectedTexturePack") {
      const splitPosition = type === "connectedTextureSplit"
        ? position
        : { x: position.x - 420, y: position.y };
      const packPosition = type === "connectedTexturePack"
        ? position
        : { x: position.x + 420, y: position.y };
      const splitNode = createNode("connectedTextureSplit", splitPosition);
      const packNode = createNode("connectedTexturePack", packPosition);
      const nextEdges = CONNECTED_TEXTURE_OUTPUTS.map((output) => ({
        id: `${splitNode.id}-${packNode.id}-${output.index}`,
        source: splitNode.id,
        sourceHandle: output.handleId,
        target: packNode.id,
        targetHandle: getConnectedTextureTextureInputHandleId(output.index),
      }));

      setNodes([...useStore.getState().nodes, splitNode, packNode]);
      setEdges([...useStore.getState().edges, ...nextEdges]);
      return;
    }

    const nextNode = createNode(type, position);

    setNodes([...useStore.getState().nodes, nextNode]);
  }, [contextMenuPosition, reactFlowInstance, setEdges, setNodes]);

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
            {menuEntries.groupedEntries.map((group, index) => (
              <React.Fragment key={group.label}>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>{group.label}</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuLabel>{group.label}</ContextMenuLabel>
                    <ContextMenuSeparator />
                    <ContextMenuGroup>
                      {group.entries.map(({ type, label }) => (
                        <ContextMenuItem key={type} onSelect={() => handleAddNode(type)}>
                          <HugeiconsIcon icon={NODE_TYPE_ICONS[type]} className="text-muted-foreground size-5 mr-1" />
                          {label}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
                {index === menuEntries.groupedEntries.length - 1 ? null : <ContextMenuSeparator />}
              </React.Fragment>
            ))}
            {menuEntries.topLevelEntries.length > 0 && <ContextMenuSeparator />}
            <ContextMenuGroup>
              {menuEntries.topLevelEntries.map(({ type, label }) => (
                <ContextMenuItem key={type} onSelect={() => handleAddNode(type)}>
                  <HugeiconsIcon icon={NODE_TYPE_ICONS[type]} className="text-muted-foreground size-5 mr-1" />
                  {label}
                </ContextMenuItem>
              ))}
            </ContextMenuGroup>
            {menuEntries.remainingEntries.length > 0 && <ContextMenuSeparator />}
            <ContextMenuGroup>
              {menuEntries.remainingEntries.map(({ type, label }) => (
                <ContextMenuItem key={type} onSelect={() => handleAddNode(type)}>
                  <HugeiconsIcon icon={NODE_TYPE_ICONS[type]} className="text-muted-foreground size-5 mr-1" />
                  {label}
                </ContextMenuItem>
              ))}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  )
}
