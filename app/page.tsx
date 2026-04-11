"use client"
import { GraphHeader } from "@/components/graph-header"
import {
  CONNECTED_TEXTURE_OUTPUTS,
  getConnectedTextureTextureInputHandleId,
} from "@/lib/connected-texture"
import {
  createGraphDocument,
  downloadGraphDocument,
  GRAPH_JSON_VERSION,
  parseGraphDocument,
} from "@/lib/graph-json"
import { DEFAULT_GRAPH_PRESET_ID, GRAPH_PRESETS } from "@/lib/graph-presets"
import useStore from "@/store/graph"
import { createNode, NODE_TYPE_LABELS, type AppNodeType } from "@/store/nodes"
import {
  ColorPickerIcon,
  DiceIcon,
  DownloadCircle01Icon,
  FunctionSquareIcon,
  Image01FreeIcons,
  Rotate360FreeIcons,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Background, ReactFlow, type ReactFlowInstance } from "@xyflow/react"
import React from "react"
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
} from "../components/ui/context-menu"

const NODE_SUBMENU_GROUPS: Array<{ label: string; types: AppNodeType[] }> = [
  {
    label: "Inputs",
    types: [
      "value",
      "texture",
      "colorTexture",
      "randomTexture",
      "sineWaveTexture",
      "squareWaveTexture",
    ],
  },

  {
    label: "Transform Operations",
    types: ["rotateTexture", "translateTexture", "scaleTexture"],
  },
  {
    label: "Color Operations",
    types: [
      "blurTexture",
      "contrastTexture",
      "hslTexture",
      "invertTexture",
      "opacityTexture",
    ],
  },
  {
    label: "Compositing",
    types: ["mergeTexture", "maskTexture"],
  },
  {
    label: "Frame Operations",
    types: [
      "reverseTexture",
      "speedTexture",
      "holdTexture",
      "phaseTexture",
      "selectTexture",
    ],
  },
  {
    label: "Connected Textures",
    types: [
      "connectedTexture",
      "connectedTextureSplit",
      "connectedTexturePack",
    ],
  },
]

const TOP_LEVEL_NODE_TYPES: AppNodeType[] = ["preview", "export"]

const NODE_TYPE_ICONS: Record<AppNodeType, typeof Image01FreeIcons> = {
  value: FunctionSquareIcon,
  texture: Image01FreeIcons,
  colorTexture: ColorPickerIcon,
  randomTexture: DiceIcon,
  sineWaveTexture: Image01FreeIcons,
  squareWaveTexture: Image01FreeIcons,
  connectedTexture: Image01FreeIcons,
  connectedTextureSplit: Image01FreeIcons,
  connectedTexturePack: Image01FreeIcons,
  rotateTexture: Rotate360FreeIcons,
  translateTexture: Image01FreeIcons,
  scaleTexture: Image01FreeIcons,
  blurTexture: Image01FreeIcons,
  contrastTexture: Image01FreeIcons,
  reverseTexture: Image01FreeIcons,
  speedTexture: Image01FreeIcons,
  holdTexture: Image01FreeIcons,
  phaseTexture: Image01FreeIcons,
  selectTexture: Image01FreeIcons,
  hslTexture: Image01FreeIcons,
  invertTexture: Image01FreeIcons,
  opacityTexture: Image01FreeIcons,
  mergeTexture: Image01FreeIcons,
  maskTexture: Image01FreeIcons,
  preview: ViewIcon,
  export: DownloadCircle01Icon,
}

export default function Page() {
  const [reactFlowInstance, setReactFlowInstance] =
    React.useState<ReactFlowInstance | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = React.useState<{
    x: number
    y: number
  } | null>(null)
  const [graphStatus, setGraphStatus] = React.useState<{
    tone: "default" | "error"
    message: string
  } | null>(null)

  const {
    nodes,
    edges,
    nodeTypes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
  } = useStore()

  const menuEntries = React.useMemo(() => {
    const availableNodeTypes = new Set(
      Object.keys(nodeTypes).filter(
        (type): type is AppNodeType => type in NODE_TYPE_LABELS
      )
    )

    const groupedEntries = NODE_SUBMENU_GROUPS.map((group) => ({
      label: group.label,
      entries: group.types
        .filter((type) => availableNodeTypes.has(type))
        .map((type) => ({
          type,
          label: NODE_TYPE_LABELS[type],
        })),
    })).filter((group) => group.entries.length > 0)

    const groupedTypes = new Set(
      groupedEntries.flatMap((group) =>
        group.entries.map((entry) => entry.type)
      )
    )
    const topLevelEntries = TOP_LEVEL_NODE_TYPES.filter((type) =>
      availableNodeTypes.has(type)
    ).map((type) => ({
      type,
      label: NODE_TYPE_LABELS[type],
    }))

    const assignedTypes = new Set([
      ...groupedTypes,
      ...topLevelEntries.map((entry) => entry.type),
    ])
    const remainingEntries = [...availableNodeTypes]
      .filter((type) => !assignedTypes.has(type))
      .map((type) => ({
        type,
        label: NODE_TYPE_LABELS[type],
      }))

    return {
      groupedEntries,
      topLevelEntries,
      remainingEntries,
    }
  }, [nodeTypes])

  const onContextMenuCapture = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setContextMenuPosition({ x: event.clientX, y: event.clientY })
    },
    []
  )

  const fitGraphView = React.useCallback(() => {
    requestAnimationFrame(() => {
      reactFlowInstance?.fitView()
    })
  }, [reactFlowInstance])

  const applyGraphDocument = React.useCallback(
    (rawDocument: unknown, sourceLabel: string) => {
      const document = parseGraphDocument(rawDocument)

      setNodes(document.nodes)
      setEdges(document.edges)
      setGraphStatus({
        tone: "default",
        message: `Loaded ${document.name ?? sourceLabel} (v${document.version}).`,
      })
      fitGraphView()
    },
    [fitGraphView, setEdges, setNodes]
  )

  const handleLoadPreset = React.useCallback(
    (presetId: string) => {
      const preset = GRAPH_PRESETS.find((entry) => entry.id === presetId)

      if (!preset) {
        setGraphStatus({
          tone: "error",
          message: "Selected preset JSON was not found.",
        })
        return
      }

      try {
        applyGraphDocument(preset.document, preset.label)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not load the preset JSON."
        setGraphStatus({ tone: "error", message })
      }
    },
    [applyGraphDocument]
  )

  const handleImportFile = React.useCallback(
    async (file: File) => {
      try {
        const fileContent = await file.text()
        const parsed = JSON.parse(fileContent) as unknown

        applyGraphDocument(parsed, file.name)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not import the graph JSON."
        setGraphStatus({ tone: "error", message })
      }
    },
    [applyGraphDocument]
  )

  const handleExport = React.useCallback(() => {
    try {
      const document = createGraphDocument(nodes, edges, "graph")

      downloadGraphDocument(document)
      setGraphStatus({
        tone: "default",
        message: `Exported ${document.name ?? "graph"} as v${document.version} JSON.`,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not export the graph JSON."
      setGraphStatus({ tone: "error", message })
    }
  }, [edges, nodes])

  React.useEffect(() => {
    const defaultPreset = GRAPH_PRESETS.find(
      (preset) => preset.id === DEFAULT_GRAPH_PRESET_ID
    )

    if (!defaultPreset) {
      return
    }

    try {
      applyGraphDocument(defaultPreset.document, defaultPreset.label)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load the default preset JSON."
      setGraphStatus({ tone: "error", message })
    }
  }, [applyGraphDocument])

  const handleAddNode = React.useCallback(
    (type: AppNodeType) => {
      if (!reactFlowInstance || !contextMenuPosition) {
        return
      }

      const position =
        reactFlowInstance.screenToFlowPosition(contextMenuPosition)

      if (type === "connectedTextureSplit" || type === "connectedTexturePack") {
        const splitPosition =
          type === "connectedTextureSplit"
            ? position
            : { x: position.x - 420, y: position.y }
        const packPosition =
          type === "connectedTexturePack"
            ? position
            : { x: position.x + 420, y: position.y }
        const splitNode = createNode("connectedTextureSplit", splitPosition)
        const packNode = createNode("connectedTexturePack", packPosition)
        const nextEdges = CONNECTED_TEXTURE_OUTPUTS.map((output) => ({
          id: `${splitNode.id}-${packNode.id}-${output.index}`,
          source: splitNode.id,
          sourceHandle: output.handleId,
          target: packNode.id,
          targetHandle: getConnectedTextureTextureInputHandleId(output.index),
        }))

        setNodes([...useStore.getState().nodes, splitNode, packNode])
        setEdges([...useStore.getState().edges, ...nextEdges])
        return
      }

      const nextNode = createNode(type, position)

      setNodes([...useStore.getState().nodes, nextNode])
    },
    [contextMenuPosition, reactFlowInstance, setEdges, setNodes]
  )

  return (
    <div className="min-h-svh p-6">
      <div className="flex min-w-0 flex-col gap-6 text-sm leading-loose">
        <GraphHeader
          formatVersion={GRAPH_JSON_VERSION}
          presets={GRAPH_PRESETS.map(({ id, label }) => ({ id, label }))}
          onLoadPreset={handleLoadPreset}
          onImportFile={handleImportFile}
          onExport={handleExport}
          status={graphStatus}
        />

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className="h-[80vh] w-[80vw] rounded-lg border-2 border-secondary bg-secondary dark:bg-background"
              onContextMenuCapture={onContextMenuCapture}
            >
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
                        <ContextMenuItem
                          key={type}
                          onSelect={() => handleAddNode(type)}
                        >
                          <HugeiconsIcon
                            icon={NODE_TYPE_ICONS[type]}
                            className="mr-1 size-5 text-muted-foreground"
                          />
                          {label}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
                {index === menuEntries.groupedEntries.length - 1 ? null : (
                  <ContextMenuSeparator />
                )}
              </React.Fragment>
            ))}
            {menuEntries.topLevelEntries.length > 0 && <ContextMenuSeparator />}
            <ContextMenuGroup>
              {menuEntries.topLevelEntries.map(({ type, label }) => (
                <ContextMenuItem
                  key={type}
                  onSelect={() => handleAddNode(type)}
                >
                  <HugeiconsIcon
                    icon={NODE_TYPE_ICONS[type]}
                    className="mr-1 size-5 text-muted-foreground"
                  />
                  {label}
                </ContextMenuItem>
              ))}
            </ContextMenuGroup>
            {menuEntries.remainingEntries.length > 0 && (
              <ContextMenuSeparator />
            )}
            <ContextMenuGroup>
              {menuEntries.remainingEntries.map(({ type, label }) => (
                <ContextMenuItem
                  key={type}
                  onSelect={() => handleAddNode(type)}
                >
                  <HugeiconsIcon
                    icon={NODE_TYPE_ICONS[type]}
                    className="mr-1 size-5 text-muted-foreground"
                  />
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
