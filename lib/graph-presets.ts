import emptyGraphPreset from "@/presets/empty.graph.json";
import connectedTexturePreset from "@/presets/connected-texture-graph.json";
import connectedTextureWithCustom from "@/presets/connected-texture-with-custom.json";

export const GRAPH_PRESETS = [
  {
    id: "empty",
    label: "Empty Graph",
    document: emptyGraphPreset,
  },
  {
    id: "connected-texture",
    label: "Connected Texture",
    document: connectedTexturePreset,
  },
    {
    id: "connected-texture-with-custom",
    label: "Connected Texture with Custom Texture",
    document: connectedTextureWithCustom,
  },
] as const;

export type GraphPresetId = (typeof GRAPH_PRESETS)[number]["id"];
