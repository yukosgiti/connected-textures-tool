import { create } from "zustand"
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react"
import { initialNodes } from "./nodes"
import { initialEdges } from "./edges"
import { AppState } from "./types"
import { PreviewNode } from "@/components/nodes/PreviewNode"
import { ConnectedTextureNode } from "@/components/nodes/ConnectedTextureNode"
import { ConnectedTexturePackNode } from "@/components/nodes/ConnectedTexturePackNode"
import { ConnectedTextureSplitNode } from "@/components/nodes/ConnectedTextureSplitNode"
import { BlurTextureNode } from "@/components/nodes/BlurTextureNode"
import { BrightnessTextureNode } from "@/components/nodes/BrightnessTextureNode"
import { ChannelCombineTextureNode } from "@/components/nodes/ChannelCombineTextureNode"
import { ChannelSplitTextureNode } from "@/components/nodes/ChannelSplitTextureNode"
import { CheckerboardTextureNode } from "@/components/nodes/CheckerboardTextureNode"
import { ContrastTextureNode } from "@/components/nodes/ContrastTextureNode"
import { ColorTextureNode } from "@/components/nodes/ColorTextureNode"
import { CropTextureNode } from "@/components/nodes/CropTextureNode"
import { ExportNode } from "@/components/nodes/ExportNode"
import { FlipTextureNode } from "@/components/nodes/FlipTextureNode"
import { FrameBlendTextureNode } from "@/components/nodes/FrameBlendTextureNode"
import { GradientTextureNode } from "@/components/nodes/GradientTextureNode"
import { GrayscaleTextureNode } from "@/components/nodes/GrayscaleTextureNode"
import { HslTextureNode } from "@/components/nodes/HslTextureNode"
import { InvertTextureNode } from "@/components/nodes/InvertTextureNode"
import { LevelsTextureNode } from "@/components/nodes/LevelsTextureNode"
import { MaskTextureNode } from "@/components/nodes/MaskTextureNode"
import { MergeTextureNode } from "@/components/nodes/MergeTextureNode"
import { OpacityTextureNode } from "@/components/nodes/OpacityTextureNode"
import { PhaseTextureNode } from "@/components/nodes/PhaseTextureNode"
import { PingPongTextureNode } from "@/components/nodes/PingPongTextureNode"
import { RandomTextureNode } from "@/components/nodes/RandomTextureNode"
import { RadialGradientTextureNode } from "@/components/nodes/RadialGradientTextureNode"
import { ReverseTextureNode } from "@/components/nodes/ReverseTextureNode"
import { ScaleTextureNode } from "@/components/nodes/ScaleTextureNode"
import { SelectTextureNode } from "@/components/nodes/SelectTextureNode"
import { SkewTextureNode } from "@/components/nodes/SkewTextureNode"
import { SineWaveTextureNode } from "@/components/nodes/SineWaveTextureNode"
import { SpeedTextureNode } from "@/components/nodes/SpeedTextureNode"
import { SquareWaveTextureNode } from "@/components/nodes/SquareWaveTextureNode"
import { ThresholdTextureNode } from "@/components/nodes/ThresholdTextureNode"
import { TranslateTextureNode } from "@/components/nodes/TranslateTextureNode"
import { TileTextureNode } from "@/components/nodes/TileTextureNode"
import { TrimTextureNode } from "@/components/nodes/TrimTextureNode"
import { ValueNode } from "@/components/nodes/ValueNode"
import { TextureNode } from "@/components/nodes/TextureNode"
import { RotateTextureNode } from "@/components/nodes/RotateTextureNode"
import { HoldTextureNode } from "@/components/nodes/HoldTextureNode"
import { MagnifyTextureNode } from "@/components/nodes/MagnifyTextureNode"
import { type Connection, type Edge } from "@xyflow/react"
import { SwirlTextureNode } from "@/components/nodes/SwirlTextureNode"

type HandleDataType = "value" | "texture" | "connectedTexture" | null

function getHandleDataType(
  nodeType: string | undefined,
  handleId: string | null | undefined,
  direction: "source" | "target"
): HandleDataType {
  switch (nodeType) {
    case "value":
      return direction === "source" ? "value" : null
    case "texture":
    case "colorTexture":
      return direction === "source" ? "texture" : null
    case "randomTexture":
      if (direction === "source") {
        return "texture"
      }

      return handleId === "inputRatio" ? "value" : null
    case "gradientTexture":
      if (direction === "source") {
        return "texture"
      }

      return handleId === "inputAngle" ? "value" : null
    case "checkerboardTexture":
      if (direction === "source") {
        return "texture"
      }

      return handleId === "inputScale" ? "value" : null
    case "radialGradientTexture":
      if (direction === "source") {
        return "texture"
      }

      return handleId === "inputRadius" ? "value" : null
    case "sineWaveTexture":
    case "squareWaveTexture":
      if (direction === "source") {
        return "texture"
      }

      return handleId === "inputCycles" ||
        handleId === "inputAmplitude" ||
        handleId === "inputThickness" ||
        handleId === "inputPhase"
        ? "value"
        : null
    case "connectedTexture":
      return direction === "source" ? "connectedTexture" : "texture"
    case "connectedTextureSplit":
      return direction === "source"
        ? "texture"
        : handleId === "inputConnectedTexture"
          ? "connectedTexture"
          : null
    case "connectedTexturePack":
      return direction === "source"
        ? "connectedTexture"
        : handleId?.startsWith("inputTexture")
          ? "texture"
          : null
    case "preview":
    case "export":
      if (direction !== "target") {
        return null
      }

      if (handleId === "inputConnectedTexture") {
        return "connectedTexture"
      }

      return handleId === "inputTexture" ? "texture" : null
    default:
      if (direction === "source") {
        return "texture"
      }

      if (!handleId) {
        return null
      }

      return handleId.includes("inputValue") ||
        handleId.includes("inputX") ||
        handleId.includes("inputY") ||
        handleId.includes("inputCycles") ||
        handleId.includes("inputAmplitude") ||
        handleId.includes("inputThickness") ||
        handleId.includes("inputPhase") ||
        handleId.includes("inputHue") ||
        handleId.includes("inputSaturation") ||
        handleId.includes("inputLightness") ||
        handleId.includes("inputOpacity") ||
        handleId.includes("inputRatio") ||
        handleId.includes("inputBlur") ||
        handleId.includes("inputContrast") ||
        handleId.includes("inputFrames") ||
        handleId.includes("inputIndex") ||
        handleId.includes("inputSpeed") ||
        handleId.includes("inputHold") ||
        handleId.includes("inputWidth") ||
        handleId.includes("inputHeight") ||
        handleId.includes("inputRepeat") ||
        handleId.includes("inputThreshold") ||
        handleId.includes("inputBrightness") ||
        handleId.includes("inputBlack") ||
        handleId.includes("inputWhite") ||
        handleId.includes("inputGamma") ||
        handleId.includes("inputAngle") ||
        handleId.includes("inputRadius") ||
        handleId.includes("inputScale") ||
        handleId.includes("inputStart") ||
        handleId.includes("inputLength") ||
        handleId.includes("inputBlendAmount")
        ? "value"
        : "texture"
  }
}

function isConnectionTypeValid(
  connection: Connection | Edge,
  edges: Edge[],
  getNode: (id: string) => { type?: string } | undefined
) {
  if (!connection.source || !connection.target) {
    return false
  }

  if (connection.source === connection.target) {
    return false
  }

  if (
    connection.targetHandle &&
    edges.some(
      (edge) =>
        edge.target === connection.target &&
        edge.targetHandle === connection.targetHandle
    )
  ) {
    return false
  }

  const sourceNode = getNode(connection.source)
  const targetNode = getNode(connection.target)

  if (!sourceNode || !targetNode) {
    return false
  }

  const sourceType = getHandleDataType(
    sourceNode.type,
    connection.sourceHandle,
    "source"
  )
  const targetType = getHandleDataType(
    targetNode.type,
    connection.targetHandle,
    "target"
  )

  return sourceType !== null && sourceType === targetType
}

const useStore = create<AppState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  nodeTypes: {
    value: ValueNode,
    texture: TextureNode,
    colorTexture: ColorTextureNode,
    randomTexture: RandomTextureNode,
    gradientTexture: GradientTextureNode,
    checkerboardTexture: CheckerboardTextureNode,
    radialGradientTexture: RadialGradientTextureNode,
    sineWaveTexture: SineWaveTextureNode,
    squareWaveTexture: SquareWaveTextureNode,
    connectedTexture: ConnectedTextureNode,
    connectedTextureSplit: ConnectedTextureSplitNode,
    connectedTexturePack: ConnectedTexturePackNode,
    rotateTexture: RotateTextureNode,
    swirlTexture: SwirlTextureNode,
    skewTexture: SkewTextureNode,
    flipTexture: FlipTextureNode,
    translateTexture: TranslateTextureNode,
    scaleTexture: ScaleTextureNode,
    magnifyTexture: MagnifyTextureNode,
    cropTexture: CropTextureNode,
    tileTexture: TileTextureNode,
    blurTexture: BlurTextureNode,
    contrastTexture: ContrastTextureNode,
    thresholdTexture: ThresholdTextureNode,
    brightnessTexture: BrightnessTextureNode,
    levelsTexture: LevelsTextureNode,
    grayscaleTexture: GrayscaleTextureNode,
    reverseTexture: ReverseTextureNode,
    speedTexture: SpeedTextureNode,
    holdTexture: HoldTextureNode,
    phaseTexture: PhaseTextureNode,
    selectTexture: SelectTextureNode,
    pingPongTexture: PingPongTextureNode,
    trimTexture: TrimTextureNode,
    frameBlendTexture: FrameBlendTextureNode,
    hslTexture: HslTextureNode,
    invertTexture: InvertTextureNode,
    opacityTexture: OpacityTextureNode,
    mergeTexture: MergeTextureNode,
    maskTexture: MaskTextureNode,
    channelSplitTexture: ChannelSplitTextureNode,
    channelCombineTexture: ChannelCombineTextureNode,
    preview: PreviewNode,
    export: ExportNode,
  },
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },
  isValidConnection: (connection) => {
    return isConnectionTypeValid(connection, get().edges, get().getNode)
  },
  onConnect: (connection) => {
    if (!get().isValidConnection(connection)) {
      return
    }

    set({
      edges: addEdge(connection, get().edges),
    })
  },
  setNodes: (nodes) => {
    set({ nodes })
  },
  setEdges: (edges) => {
    set({ edges })
  },
  setNode: (id, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      ),
    }))
  },
  getNode: (id) => get().nodes.find((node) => node.id === id),
}))

export default useStore
