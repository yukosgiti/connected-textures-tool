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

export type ConnectedTextureInputs = Partial<Record<ConnectedTextureInputKey, SerializedTextureData | null>>;
export type ConnectedTextureOutputTextures = Record<string, SerializedTextureData>;

const manifest = connectedTextureManifest as ConnectedTextureManifest;

export const CONNECTED_TEXTURE_REQUIRED_INPUTS = manifest.requiredInputs;
export const CONNECTED_TEXTURE_TEMPLATE_COUNT = manifest.frameCount;
export const CONNECTED_TEXTURE_OUTPUTS = manifest.templates.map((template) => ({
  handleId: `outputTexture${template.index}`,
  label: `${template.index}`,
  index: template.index,
}));

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
  const sides = layers.filter((layerKey) => !layerKey.startsWith("crn_"));
  const corners = layers.filter((layerKey) => layerKey.startsWith("crn_"));

  return [...sides, ...corners];
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

export function generateConnectedTexture(inputs: ConnectedTextureInputs) {
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
  const outputPixels = new Uint8ClampedArray(frameByteLength * manifest.templates.length);
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

      if (frameIndex === 0) {
        outputPixels.set(framePixels, template.index * frameByteLength);
      }
    }

    outputTextures[`outputTexture${template.index}`] = createConnectedTextureOutput(
      baseTexture,
      outputTexturePixels,
      template.index,
      textureFrames,
    );
  }

  return {
    texture: {
      name: `${baseTexture.name} (connected)`,
      width: textureSize,
      height: textureSize * manifest.templates.length,
      frameSize: textureSize,
      frames: manifest.templates.length,
      sourceFrames: manifest.templates.length,
      pixels: encodeTexturePixels(outputPixels),
    },
    outputTextures,
  };
}