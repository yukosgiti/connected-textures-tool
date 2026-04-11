import connectedTextureManifest from "@/lib/connected-texture-templates.json";
import {
  encodeTexturePixels,
  getTextureFramePixels,
  type SerializedTextureData,
} from "@/lib/texture";

export type ConnectedTextureInputKey =
  | "texture"
  | "side_top"
  | "crn_in_top_lt"
  | "crn_out_top_lt";

type ConnectedTextureDerivedKey =
  | "side_rt"
  | "side_btm"
  | "side_lt"
  | "crn_in_top_rt"
  | "crn_in_btm_lt"
  | "crn_in_btm_rt"
  | "crn_out_top_rt"
  | "crn_out_btm_lt"
  | "crn_out_btm_rt";

type ConnectedTextureAssetKey = ConnectedTextureInputKey | ConnectedTextureDerivedKey;

type ConnectedTextureTransform = "rotate90" | "rotate180" | "rotate270" | "flipX" | "flipY";

type ConnectedTextureRequiredInput = {
  key: ConnectedTextureInputKey;
  label: string;
  description: string;
};

type ConnectedTextureDerivedInput = {
  key: ConnectedTextureDerivedKey;
  from: ConnectedTextureInputKey;
  transform: ConnectedTextureTransform;
};

type ConnectedTextureTemplate = {
  index: number;
  layers: ConnectedTextureAssetKey[];
};

type ConnectedTextureManifest = {
  frameCount: number;
  requiredInputs: ConnectedTextureRequiredInput[];
  derivedInputs: ConnectedTextureDerivedInput[];
  templates: ConnectedTextureTemplate[];
};

type ConnectedTextureFrames = Uint8ClampedArray[];
type ConnectedTextureNeighbors = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
};

export type ConnectedTextureInputs = Partial<Record<ConnectedTextureInputKey, SerializedTextureData | null>>;
export type ConnectedTextureOutputTextures = Record<string, SerializedTextureData>;
export type ConnectedTextureData = {
  texture: SerializedTextureData;
  outputTextures: ConnectedTextureOutputTextures;
};

const manifest = connectedTextureManifest as ConnectedTextureManifest;

export const CONNECTED_TEXTURE_REQUIRED_INPUTS = manifest.requiredInputs;
export const CONNECTED_TEXTURE_TEMPLATE_COUNT = manifest.frameCount;
export const CONNECTED_TEXTURE_INPUT_HANDLE_ID = "inputConnectedTexture";
export const CONNECTED_TEXTURE_OUTPUT_HANDLE_ID = "outputConnectedTexture";
export const CONNECTED_TEXTURE_OUTPUTS = manifest.templates.map((template) => ({
  handleId: `outputTexture${template.index}`,
  label: `${template.index}`,
  index: template.index,
}));
const CONNECTED_TEXTURE_LAYER_ORDER: ConnectedTextureAssetKey[] = [
  "side_top",
  "side_rt",
  "side_btm",
  "side_lt",
  "crn_in_top_lt",
  "crn_in_top_rt",
  "crn_in_btm_lt",
  "crn_in_btm_rt",
  "crn_out_top_lt",
  "crn_out_top_rt",
  "crn_out_btm_lt",
  "crn_out_btm_rt",
];
const CONNECTED_TEXTURE_LAYER_ORDER_INDEX = new Map(
  CONNECTED_TEXTURE_LAYER_ORDER.map((layerKey, index) => [layerKey, index]),
);
const CONNECTED_TEXTURE_TEMPLATE_LOOKUP = new Map(
  manifest.templates.map((template) => [sortTemplateLayers(template.layers).join("|"), template.index]),
);

export function getConnectedTextureTextureInputHandleId(index: number) {
  return `inputTexture${index}`;
}

export function createEmptyConnectedTextureInputs(): Record<ConnectedTextureInputKey, null> {
  return {
    texture: null,
    side_top: null,
    crn_in_top_lt: null,
    crn_out_top_lt: null,
  };
}

export function getConnectedTextureMissingInputs(inputs: ConnectedTextureInputs) {
  return CONNECTED_TEXTURE_REQUIRED_INPUTS.filter(({ key }) => !inputs[key]);
}

function assertSquareTexture(texture: SerializedTextureData, inputLabel: string) {
  if (texture.width !== texture.frameSize) {
    throw new Error(`${inputLabel} must be square.`);
  }
}

function rotateSquarePixels(
  pixels: Uint8ClampedArray,
  size: number,
  quarterTurns: 1 | 2 | 3,
) {
  const rotated = new Uint8ClampedArray(pixels.length);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sourceIndex = (y * size + x) * 4;
      let targetX = x;
      let targetY = y;

      if (quarterTurns === 1) {
        targetX = size - 1 - y;
        targetY = x;
      } else if (quarterTurns === 2) {
        targetX = size - 1 - x;
        targetY = size - 1 - y;
      } else {
        targetX = y;
        targetY = size - 1 - x;
      }

      const targetIndex = (targetY * size + targetX) * 4;
      rotated.set(pixels.subarray(sourceIndex, sourceIndex + 4), targetIndex);
    }
  }

  return rotated;
}

function flipSquarePixels(
  pixels: Uint8ClampedArray,
  size: number,
  axis: "x" | "y",
) {
  const flipped = new Uint8ClampedArray(pixels.length);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sourceIndex = (y * size + x) * 4;
      const targetX = axis === "x" ? size - 1 - x : x;
      const targetY = axis === "y" ? size - 1 - y : y;
      const targetIndex = (targetY * size + targetX) * 4;

      flipped.set(pixels.subarray(sourceIndex, sourceIndex + 4), targetIndex);
    }
  }

  return flipped;
}

function transformSquarePixels(
  pixels: Uint8ClampedArray,
  size: number,
  transform: ConnectedTextureTransform,
) {
  switch (transform) {
    case "rotate90":
      return rotateSquarePixels(pixels, size, 1);
    case "rotate180":
      return rotateSquarePixels(pixels, size, 2);
    case "rotate270":
      return rotateSquarePixels(pixels, size, 3);
    case "flipX":
      return flipSquarePixels(pixels, size, "x");
    case "flipY":
      return flipSquarePixels(pixels, size, "y");
  }
}

function compositeSourceOver(target: Uint8ClampedArray, overlay: Uint8ClampedArray) {
  for (let index = 0; index < target.length; index += 4) {
    const sourceAlpha = overlay[index + 3] / 255;

    if (sourceAlpha <= 0) {
      continue;
    }

    const targetAlpha = target[index + 3] / 255;
    const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);

    if (outAlpha <= 0) {
      target[index] = 0;
      target[index + 1] = 0;
      target[index + 2] = 0;
      target[index + 3] = 0;
      continue;
    }

    const sourceRed = overlay[index] / 255;
    const sourceGreen = overlay[index + 1] / 255;
    const sourceBlue = overlay[index + 2] / 255;
    const targetRed = target[index] / 255;
    const targetGreen = target[index + 1] / 255;
    const targetBlue = target[index + 2] / 255;

    const outRed = ((sourceRed * sourceAlpha) + (targetRed * targetAlpha * (1 - sourceAlpha))) / outAlpha;
    const outGreen = ((sourceGreen * sourceAlpha) + (targetGreen * targetAlpha * (1 - sourceAlpha))) / outAlpha;
    const outBlue = ((sourceBlue * sourceAlpha) + (targetBlue * targetAlpha * (1 - sourceAlpha))) / outAlpha;

    target[index] = Math.round(outRed * 255);
    target[index + 1] = Math.round(outGreen * 255);
    target[index + 2] = Math.round(outBlue * 255);
    target[index + 3] = Math.round(outAlpha * 255);
  }
}

function getRequiredInputTexture(inputs: ConnectedTextureInputs, key: ConnectedTextureInputKey) {
  const input = inputs[key];

  if (!input) {
    const inputMeta = CONNECTED_TEXTURE_REQUIRED_INPUTS.find((entry) => entry.key === key);
    throw new Error(`${inputMeta?.label ?? key} is required.`);
  }

  return input;
}

function createTextureFrames(texture: SerializedTextureData) {
  const frames: ConnectedTextureFrames = [];

  for (let frameIndex = 0; frameIndex < texture.frames; frameIndex += 1) {
    frames.push(getTextureFramePixels(texture, frameIndex));
  }

  return frames;
}

function transformTextureFrames(
  frames: ConnectedTextureFrames,
  size: number,
  transform: ConnectedTextureTransform,
) {
  return frames.map((framePixels) => transformSquarePixels(framePixels, size, transform));
}

function sortTemplateLayers(layers: ConnectedTextureAssetKey[]) {
  return [...layers].sort((left, right) => {
    return (CONNECTED_TEXTURE_LAYER_ORDER_INDEX.get(left) ?? Number.MAX_SAFE_INTEGER)
      - (CONNECTED_TEXTURE_LAYER_ORDER_INDEX.get(right) ?? Number.MAX_SAFE_INTEGER);
  });
}

function createConnectedTexturePreviewTexture(
  name: string,
  outputTextures: ConnectedTextureOutputTextures,
) {
  const firstOutput = outputTextures[CONNECTED_TEXTURE_OUTPUTS[0]?.handleId ?? ""];

  if (!firstOutput) {
    throw new Error("Connected texture outputs are required.");
  }

  const frameByteLength = firstOutput.frameSize * firstOutput.frameSize * 4;
  const previewPixels = new Uint8ClampedArray(frameByteLength * CONNECTED_TEXTURE_OUTPUTS.length);

  for (const output of CONNECTED_TEXTURE_OUTPUTS) {
    const outputTexture = outputTextures[output.handleId];

    if (!outputTexture) {
      throw new Error(`Missing connected texture output ${output.index}.`);
    }

    previewPixels.set(getTextureFramePixels(outputTexture, 0), output.index * frameByteLength);
  }

  return {
    name,
    width: firstOutput.frameSize,
    height: firstOutput.frameSize * CONNECTED_TEXTURE_OUTPUTS.length,
    frameSize: firstOutput.frameSize,
    frames: CONNECTED_TEXTURE_OUTPUTS.length,
    sourceFrames: CONNECTED_TEXTURE_OUTPUTS.length,
    pixels: encodeTexturePixels(previewPixels),
  };
}

function assertCompatibleConnectedTextureOutput(
  referenceTexture: SerializedTextureData,
  outputTexture: SerializedTextureData,
  index: number,
) {
  if (
    outputTexture.width !== referenceTexture.width
    || outputTexture.frameSize !== referenceTexture.frameSize
    || outputTexture.frames !== referenceTexture.frames
  ) {
    throw new Error(`Connected texture output ${index} does not match the other output dimensions.`);
  }
}

export function packConnectedTextureOutputs(
  partialOutputs: Partial<Record<string, SerializedTextureData | null>>,
  name = "Connected Texture",
): ConnectedTextureData {
  const firstOutputMeta = CONNECTED_TEXTURE_OUTPUTS[0];
  const firstOutput = firstOutputMeta ? partialOutputs[firstOutputMeta.handleId] ?? null : null;

  if (!firstOutput) {
    throw new Error("Connected texture outputs are required.");
  }

  const outputTextures: ConnectedTextureOutputTextures = {};

  for (const output of CONNECTED_TEXTURE_OUTPUTS) {
    const outputTexture = partialOutputs[output.handleId] ?? null;

    if (!outputTexture) {
      throw new Error(`Missing connected texture output ${output.index}.`);
    }

    assertCompatibleConnectedTextureOutput(firstOutput, outputTexture, output.index);
    outputTextures[output.handleId] = outputTexture;
  }

  return {
    texture: createConnectedTexturePreviewTexture(name, outputTextures),
    outputTextures,
  };
}

function getCell(cells: boolean[], gridSize: number, column: number, row: number) {
  if (column < 0 || row < 0 || column >= gridSize || row >= gridSize) {
    return false;
  }

  return cells[(row * gridSize) + column] ?? false;
}

function getConnectedTextureNeighbors(cells: boolean[], gridSize: number, cellIndex: number): ConnectedTextureNeighbors {
  const column = cellIndex % gridSize;
  const row = Math.floor(cellIndex / gridSize);

  return {
    top: getCell(cells, gridSize, column, row - 1),
    right: getCell(cells, gridSize, column + 1, row),
    bottom: getCell(cells, gridSize, column, row + 1),
    left: getCell(cells, gridSize, column - 1, row),
    topLeft: getCell(cells, gridSize, column - 1, row - 1),
    topRight: getCell(cells, gridSize, column + 1, row - 1),
    bottomLeft: getCell(cells, gridSize, column - 1, row + 1),
    bottomRight: getCell(cells, gridSize, column + 1, row + 1),
  };
}

function getConnectedTextureLayersFromNeighbors(neighbors: ConnectedTextureNeighbors) {
  const layers: ConnectedTextureAssetKey[] = [];

  if (!neighbors.top) {
    layers.push("side_top");
  }

  if (!neighbors.right) {
    layers.push("side_rt");
  }

  if (!neighbors.bottom) {
    layers.push("side_btm");
  }

  if (!neighbors.left) {
    layers.push("side_lt");
  }

  if (!neighbors.top && !neighbors.left) {
    layers.push("crn_in_top_lt");
  }

  if (!neighbors.top && !neighbors.right) {
    layers.push("crn_in_top_rt");
  }

  if (!neighbors.bottom && !neighbors.left) {
    layers.push("crn_in_btm_lt");
  }

  if (!neighbors.bottom && !neighbors.right) {
    layers.push("crn_in_btm_rt");
  }

  if (neighbors.top && neighbors.left && !neighbors.topLeft) {
    layers.push("crn_out_top_lt");
  }

  if (neighbors.top && neighbors.right && !neighbors.topRight) {
    layers.push("crn_out_top_rt");
  }

  if (neighbors.bottom && neighbors.left && !neighbors.bottomLeft) {
    layers.push("crn_out_btm_lt");
  }

  if (neighbors.bottom && neighbors.right && !neighbors.bottomRight) {
    layers.push("crn_out_btm_rt");
  }

  return sortTemplateLayers(layers);
}

export function getConnectedTextureTemplateIndex(cells: boolean[], gridSize: number, cellIndex: number) {
  if (!cells[cellIndex]) {
    return null;
  }

  const neighbors = getConnectedTextureNeighbors(cells, gridSize, cellIndex);
  const layers = getConnectedTextureLayersFromNeighbors(neighbors);
  const templateIndex = CONNECTED_TEXTURE_TEMPLATE_LOOKUP.get(layers.join("|"));

  return templateIndex ?? null;
}

function createConnectedTextureOutput(
  baseTexture: SerializedTextureData,
  pixels: Uint8ClampedArray,
  index: number,
  frames: number,
): SerializedTextureData {
  return {
    name: `${baseTexture.name} (connected ${index})`,
    width: baseTexture.frameSize,
    height: baseTexture.frameSize * frames,
    frameSize: baseTexture.frameSize,
    frames,
    sourceFrames: frames,
    pixels: encodeTexturePixels(pixels),
  };
}

export function generateConnectedTexture(inputs: ConnectedTextureInputs): ConnectedTextureData {
  const baseTexture = getRequiredInputTexture(inputs, "texture");
  const textureSize = baseTexture.frameSize;
  const textureFrames = baseTexture.frames;
  const resolvedInputs = new Map<ConnectedTextureAssetKey, ConnectedTextureFrames>();

  for (const inputMeta of CONNECTED_TEXTURE_REQUIRED_INPUTS) {
    const inputTexture = getRequiredInputTexture(inputs, inputMeta.key);

    assertSquareTexture(inputTexture, inputMeta.label);

    if (
      inputTexture.frameSize !== textureSize
      || inputTexture.width !== baseTexture.width
      || inputTexture.frames !== textureFrames
    ) {
      throw new Error("Connected texture inputs must all use the same square dimensions and frame count.");
    }

    resolvedInputs.set(inputMeta.key, createTextureFrames(inputTexture));
  }

  for (const derivedInput of manifest.derivedInputs) {
    const sourceFrames = resolvedInputs.get(derivedInput.from);

    if (!sourceFrames) {
      throw new Error(`${derivedInput.from} is required to derive ${derivedInput.key}.`);
    }

    resolvedInputs.set(
      derivedInput.key,
      transformTextureFrames(sourceFrames, textureSize, derivedInput.transform),
    );
  }

  const frameByteLength = textureSize * textureSize * 4;
  const outputTextures: ConnectedTextureOutputTextures = {};
  const baseFrames = resolvedInputs.get("texture");

  if (!baseFrames) {
    throw new Error("Base texture is required.");
  }

  for (const template of manifest.templates) {
    const layers = sortTemplateLayers(template.layers);
    const outputTexturePixels = new Uint8ClampedArray(frameByteLength * textureFrames);

    for (let frameIndex = 0; frameIndex < textureFrames; frameIndex += 1) {
      const framePixels = new Uint8ClampedArray(baseFrames[frameIndex]);

      for (const layerKey of layers) {
        const layerFrames = resolvedInputs.get(layerKey);

        if (!layerFrames) {
          throw new Error(`Missing template layer: ${layerKey}.`);
        }

        compositeSourceOver(framePixels, layerFrames[frameIndex]);
      }

      outputTexturePixels.set(framePixels, frameIndex * frameByteLength);
    }

    outputTextures[`outputTexture${template.index}`] = createConnectedTextureOutput(
      baseTexture,
      outputTexturePixels,
      template.index,
      textureFrames,
    );
  }

  return packConnectedTextureOutputs(outputTextures, `${baseTexture.name} (connected)`);
}