export type SerializedTextureData = {
  name: string
  width: number
  height: number
  frameSize: number
  frames: number
  sourceFrames: number
  pixels: string
}

export const TEXTURE_BLEND_MODE_LABELS = {
  normal: "Normal",
  darken: "Darken",
  lighten: "Lighten",
  multiply: "Multiply",
  divide: "Divide",
  add: "Add",
  subtract: "Subtract",
  screen: "Screen",
  overlay: "Overlay",
} as const

export type TextureBlendMode = keyof typeof TEXTURE_BLEND_MODE_LABELS

export const FLIP_TEXTURE_MODE_LABELS = {
  horizontal: "Flip X",
  vertical: "Flip Y",
  both: "Flip Both",
} as const

export const TILE_TEXTURE_MODE_LABELS = {
  repeat: "Repeat",
  mirror: "Mirror",
} as const

export const TEXTURE_CHANNEL_OUTPUTS = [
  { handleId: "outputRed", label: "Red" },
  { handleId: "outputGreen", label: "Green" },
  { handleId: "outputBlue", label: "Blue" },
  { handleId: "outputAlpha", label: "Alpha" },
] as const

export type FlipTextureMode = keyof typeof FLIP_TEXTURE_MODE_LABELS
export type TileTextureMode = keyof typeof TILE_TEXTURE_MODE_LABELS
export type TextureChannelOutputHandleId =
  (typeof TEXTURE_CHANNEL_OUTPUTS)[number]["handleId"]
