import { FRAMES } from "@/lib/utils";

export const VALUE_MODE_LABELS = {
  constant: "Constant",
  linear: "Linear",
  sine: "Sinus",
  random: "Random",
} as const;

export type ValueMode = keyof typeof VALUE_MODE_LABELS;

export type ValueNodeData = {
  data: number[];
  mode: ValueMode;
  constantValue: number;
  linearSlope: number;
  linearIntercept: number;
  sineAmplitude: number;
  sineCycles: number;
  sinePhasePi: number;
  sineOffset: number;
  randomSeed: number;
  randomMin: number;
  randomMax: number;
};

export const DEFAULT_VALUE_NODE_CONFIG = {
  mode: "constant" as ValueMode,
  constantValue: 0,
  linearSlope: 1,
  linearIntercept: 0,
  sineAmplitude: 0.5,
  sineCycles: 1,
  sinePhasePi: -0.5,
  sineOffset: 0.5,
  randomSeed: 1,
  randomMin: 0,
  randomMax: 1,
};

type ValueNodeConfig = Omit<ValueNodeData, "data">;

function createRng(seed: number) {
  let currentSeed = seed >>> 0;

  return () => {
    currentSeed += 0x6d2b79f5;
    let value = currentSeed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getFrameRatio(index: number) {
  return FRAMES <= 1 ? 0 : index / (FRAMES - 1);
}

function getLoopFrameRatio(index: number) {
  return FRAMES <= 0 ? 0 : index / FRAMES;
}

export function generateValueFrames(config: ValueNodeConfig) {
  switch (config.mode) {
    case "constant":
      return new Array(FRAMES).fill(config.constantValue);
    case "linear":
      return new Array(FRAMES).fill(0).map((_, index) => {
        const x = getFrameRatio(index);
        return config.linearSlope * x + config.linearIntercept;
      });
    case "sine":
      return new Array(FRAMES).fill(0).map((_, index) => {
        const x = getLoopFrameRatio(index);
        return config.sineOffset + config.sineAmplitude * Math.sin((x * config.sineCycles * Math.PI * 2) + (config.sinePhasePi * Math.PI));
      });
    case "random": {
      const rng = createRng(config.randomSeed);
      const min = Math.min(config.randomMin, config.randomMax);
      const max = Math.max(config.randomMin, config.randomMax);

      return new Array(FRAMES).fill(0).map(() => min + (max - min) * rng());
    }
  }
}

function inferLegacyMode(data: number[]): Partial<ValueNodeConfig> {
  if (data.length === 0) {
    return {};
  }

  const epsilon = 1e-6;
  const first = data[0] ?? 0;
  const isConstant = data.every((value) => Math.abs(value - first) < epsilon);

  if (isConstant) {
    return {
      mode: "constant",
      constantValue: first,
    };
  }

  const last = data[data.length - 1] ?? first;
  const slope = last - first;
  const isLinear = data.every((value, index) => {
    const x = getFrameRatio(index);
    return Math.abs(value - (slope * x + first)) < 1e-3;
  });

  if (isLinear) {
    return {
      mode: "linear",
      linearSlope: slope,
      linearIntercept: first,
    };
  }

  return {
    mode: "random",
    randomMin: Math.min(...data),
    randomMax: Math.max(...data),
  };
}

export function createValueNodeData(overrides: Partial<ValueNodeConfig> = {}): ValueNodeData {
  const config: ValueNodeConfig = {
    ...DEFAULT_VALUE_NODE_CONFIG,
    ...overrides,
  };

  return {
    ...config,
    data: generateValueFrames(config),
  };
}

export function normalizeValueNodeData(rawData?: Partial<ValueNodeData>): ValueNodeData {
  const legacyOverrides = !rawData?.mode && Array.isArray(rawData?.data)
    ? inferLegacyMode(rawData.data)
    : {};

  const legacySineRaw = rawData as (Partial<ValueNodeData> & {
    sineFrequency?: number;
    sinePhase?: number;
  }) | undefined;
  const legacySineOverrides = legacySineRaw && (
    legacySineRaw.sineFrequency !== undefined || legacySineRaw.sinePhase !== undefined
  )
    ? {
      sineCycles: legacySineRaw.sineCycles ?? legacySineRaw.sineFrequency ?? DEFAULT_VALUE_NODE_CONFIG.sineCycles,
      sinePhasePi: legacySineRaw.sinePhasePi ?? ((legacySineRaw.sinePhase ?? (DEFAULT_VALUE_NODE_CONFIG.sinePhasePi * Math.PI)) / Math.PI),
    }
    : {};

  return createValueNodeData({
    ...legacyOverrides,
    ...legacySineOverrides,
    ...rawData,
  });
}