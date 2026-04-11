import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";

import { useNodeData } from "@/hooks/store";
import useStore from "@/store/graph";
import { FunctionSquareIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createValueNodeData, DEFAULT_VALUE_NODE_CONFIG, normalizeValueNodeData, VALUE_MODE_LABELS, type ValueMode, type ValueNodeData } from "../../lib/value-node";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import { Slider } from "../ui/slider";

type Props = {
    id: string;
}

const CONSTANT_PRESETS = [
    { label: "0", value: 0 },
    { label: "0.25", value: 0.25 },
    { label: "0.5", value: 0.5 },
    { label: "1", value: 1 },
    { label: "-0.5", value: -0.5 },
    { label: "-1", value: -1 },
] as const;

const LINEAR_PRESETS = [
    { label: "Rise", slope: 1, intercept: 0 },
    { label: "Fall", slope: -1, intercept: 1 },
    { label: "Center", slope: 2, intercept: -1 },
    { label: "Flat", slope: 0, intercept: 0 },
] as const;

const SINE_CYCLE_PRESETS = [1, 2, 3, 4, 6] as const;
const SINE_PHASE_PRESETS = [
    { label: "-π", value: -1 },
    { label: "-π/2", value: -0.5 },
    { label: "0", value: 0 },
    { label: "π/2", value: 0.5 },
    { label: "π", value: 1 },
] as const;
const SINE_PRESETS = [
    { label: "Loop 0-1", amplitude: 0.5, offset: 0.5, cycles: 1, phasePi: -0.5 },
    { label: "Centered", amplitude: 1, offset: 0, cycles: 1, phasePi: 0 },
    { label: "Bounce", amplitude: 0.5, offset: 0.5, cycles: 2, phasePi: -0.5 },
    { label: "Triplet", amplitude: 0.5, offset: 0.5, cycles: 3, phasePi: -0.5 },
] as const;

const RANDOM_PRESETS = [
    { label: "0..1", min: 0, max: 1 },
    { label: "-1..1", min: -1, max: 1 },
    { label: "0..2", min: 0, max: 2 },
] as const;

const VALUE_PREVIEW_RANGE = 10;
const CHART_HEIGHT_CLASS = "h-44";

function getNextPowerOfTwo(value: number) {
    if (value <= 1) {
        return 1;
    }

    return 2 ** Math.ceil(Math.log2(value));
}

function getChartRange(values: number[]) {
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);

    return {
        minimum: minimum < -1 ? -getNextPowerOfTwo(Math.abs(minimum)) : -1,
        maximum: maximum > 1 ? getNextPowerOfTwo(maximum) : 1,
    };
}


export const ValueNode = memo(({ id }: Props) => {
    const rawNodeData = useNodeData(id)?.data as Partial<ValueNodeData> | undefined;
    const nodeData = React.useMemo(() => normalizeValueNodeData(rawNodeData), [rawNodeData]);
    const values = nodeData.data;
    const chartData = React.useMemo(() => {
        return values.map((value, index) => ({
            frame: index,
            value,
        }));
    }, [values]);
    const graphRange = React.useMemo(() => getChartRange(values), [values]);
    const xAxisTicks = React.useMemo(() => {
        if (chartData.length <= 1) {
            return [0];
        }

        const lastFrame = chartData.length - 1;
        const quarter = Math.round(lastFrame * 0.25);
        const half = Math.round(lastFrame * 0.5);
        const threeQuarter = Math.round(lastFrame * 0.75);

        return Array.from(new Set([0, quarter, half, threeQuarter, lastFrame]));
    }, [chartData.length]);
    const yAxisTicks = React.useMemo(() => {
        return Array.from(new Set([graphRange.minimum, 0, graphRange.maximum]));
    }, [graphRange.maximum, graphRange.minimum]);

    React.useEffect(() => {
        if (!rawNodeData?.mode) {
            useStore.getState().setNode(id, nodeData);
        }
    }, [id, nodeData, rawNodeData?.mode]);

    const updateValueNode = React.useCallback((patch: Partial<Omit<ValueNodeData, "data">>) => {
        const nextNodeData = createValueNodeData({
            ...nodeData,
            ...patch,
        });

        useStore.getState().setNode(id, nextNodeData);
    }, [id, nodeData]);

    const setMode = React.useCallback((mode: ValueMode) => {
        if (mode === "random") {
            updateValueNode({ mode, randomSeed: Math.floor(Math.random() * 1_000_000) });
            return;
        }

        updateValueNode({ mode });
    }, [updateValueNode]);

    const renderPresetButtons = React.useCallback((items: readonly React.ReactNode[], key: string) => {
        return (
            <div className="col-span-2 flex flex-wrap gap-1" key={key}>
                {items}
            </div>
        );
    }, []);

    const renderSlider = React.useCallback((label: string, value: number, min: number, max: number, step: number, onValueChange: (value: number) => void, className?: string) => {
        return (
            <label className={`flex flex-col gap-1 ${className ?? ""}`.trim()} key={label}>
                <span className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>{label}</span>
                    <span>{value.toFixed(2)}</span>
                </span>
                <Slider
                    className="nodrag"
                    value={[value]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={(nextValue) => {
                        const resolvedValue = Array.isArray(nextValue) ? nextValue[0] ?? value : nextValue;
                        onValueChange(resolvedValue);
                    }}
                />
            </label>
        );
    }, []);

    const modeControls = React.useMemo(() => {
        switch (nodeData.mode) {
            case "constant":
                return [
                    renderSlider("Value", nodeData.constantValue, -VALUE_PREVIEW_RANGE, VALUE_PREVIEW_RANGE, 0.01, (value) => updateValueNode({ constantValue: value }), "col-span-2"),
                    renderPresetButtons(CONSTANT_PRESETS.map((preset) => (
                        <Button
                            key={preset.label}
                            variant={Math.abs(nodeData.constantValue - preset.value) < 0.001 ? "default" : "outline"}
                            className="nodrag px-1.5 text-[10px]"
                            size="xs"
                            onClick={() => updateValueNode({ constantValue: preset.value })}
                        >
                            {preset.label}
                        </Button>
                    )), "constant-presets"),
                ];
            case "linear":
                return [
                    renderSlider("Slope (m)", nodeData.linearSlope, -4, 4, 0.01, (value) => updateValueNode({ linearSlope: value }), "col-span-2"),
                    renderSlider("Offset (n)", nodeData.linearIntercept, -2, 2, 0.01, (value) => updateValueNode({ linearIntercept: value }), "col-span-2"),
                    renderPresetButtons(LINEAR_PRESETS.map((preset) => (
                        <Button
                            key={preset.label}
                            variant={Math.abs(nodeData.linearSlope - preset.slope) < 0.001 && Math.abs(nodeData.linearIntercept - preset.intercept) < 0.001 ? "default" : "outline"}
                            className="nodrag px-1.5 text-[10px]"
                            size="xs"
                            onClick={() => updateValueNode({ linearSlope: preset.slope, linearIntercept: preset.intercept })}
                        >
                            {preset.label}
                        </Button>
                    )), "linear-presets"),
                ];
            case "sine":
                return [
                    renderSlider("Amplitude", nodeData.sineAmplitude, 0, 2, 0.01, (value) => updateValueNode({ sineAmplitude: value })),
                    renderSlider("Offset", nodeData.sineOffset, -2, 2, 0.01, (value) => updateValueNode({ sineOffset: value })),
                    renderPresetButtons(SINE_CYCLE_PRESETS.map((cycles) => (
                        <Button
                            key={`cycles-${cycles}`}
                            variant={nodeData.sineCycles === cycles ? "default" : "outline"}
                            className="nodrag px-1.5 text-[10px]"
                            size="xs"
                            onClick={() => updateValueNode({ sineCycles: cycles })}
                        >
                            {cycles}x
                        </Button>
                    )), "sine-cycles"),
                    renderPresetButtons(SINE_PHASE_PRESETS.map((preset) => (
                        <Button
                            key={preset.label}
                            variant={Math.abs(nodeData.sinePhasePi - preset.value) < 0.001 ? "default" : "outline"}
                            className="nodrag px-1.5 text-[10px]"
                            size="xs"
                            onClick={() => updateValueNode({ sinePhasePi: preset.value })}
                        >
                            {preset.label}
                        </Button>
                    )), "sine-phase"),
                    renderPresetButtons(SINE_PRESETS.map((preset) => (
                        <Button
                            key={preset.label}
                            variant={
                                Math.abs(nodeData.sineAmplitude - preset.amplitude) < 0.001
                                    && Math.abs(nodeData.sineOffset - preset.offset) < 0.001
                                    && nodeData.sineCycles === preset.cycles
                                    && Math.abs(nodeData.sinePhasePi - preset.phasePi) < 0.001
                                    ? "default"
                                    : "outline"
                            }
                            className="nodrag px-1.5 text-[10px]"
                            size="xs"
                            onClick={() => updateValueNode({
                                sineAmplitude: preset.amplitude,
                                sineOffset: preset.offset,
                                sineCycles: preset.cycles,
                                sinePhasePi: preset.phasePi,
                            })}
                        >
                            {preset.label}
                        </Button>
                    )), "sine-presets"),
                    <div className="col-span-2 flex justify-end" key="sine-reset">
                        <Button
                            variant="outline"
                            className="nodrag"
                            size="sm"
                            onClick={() => updateValueNode({
                                sineAmplitude: DEFAULT_VALUE_NODE_CONFIG.sineAmplitude,
                                sineCycles: DEFAULT_VALUE_NODE_CONFIG.sineCycles,
                                sinePhasePi: DEFAULT_VALUE_NODE_CONFIG.sinePhasePi,
                                sineOffset: DEFAULT_VALUE_NODE_CONFIG.sineOffset,
                            })}
                        >
                            Reset
                        </Button>
                    </div>,
                ];
            case "random":
                return [
                    renderSlider("Min", nodeData.randomMin, -2, 2, 0.01, (value) => updateValueNode({ randomMin: value })),
                    renderSlider("Max", nodeData.randomMax, -2, 2, 0.01, (value) => updateValueNode({ randomMax: value })),
                    renderPresetButtons(RANDOM_PRESETS.map((preset) => (
                        <Button
                            key={preset.label}
                            variant={Math.abs(nodeData.randomMin - preset.min) < 0.001 && Math.abs(nodeData.randomMax - preset.max) < 0.001 ? "default" : "outline"}
                            className="nodrag px-1.5 text-[10px]"
                            size="xs"
                            onClick={() => updateValueNode({ randomMin: preset.min, randomMax: preset.max })}
                        >
                            {preset.label}
                        </Button>
                    )), "random-presets"),
                    <div className="flex justify-end" key="random-actions">
                        <Button
                            variant="outline"
                            className="nodrag"
                            size="sm"
                            onClick={() => updateValueNode({ randomSeed: Math.floor(Math.random() * 1_000_000) })}
                        >
                            Regenerate
                        </Button>
                    </div>,
                ];
        }
    }, [nodeData, renderPresetButtons, renderSlider, updateValueNode]);

    const previewGraph = React.useMemo(() => {
        const chartDomain: [number, number] = [graphRange.minimum, graphRange.maximum];
        const commonXAxisProps = {
            dataKey: "frame",
            ticks: xAxisTicks,
            tickLine: false,
            axisLine: false,
            tick: { fill: "currentColor", fontSize: 10 },
            label: { value: "Frame", position: "insideBottom", offset: -4, fill: "currentColor", fontSize: 10 },
        } as const;
        const commonYAxisProps = {
            domain: chartDomain,
            ticks: yAxisTicks,
            tickLine: false,
            axisLine: false,
            width: 34,
            tick: { fill: "currentColor", fontSize: 10 },
            tickFormatter: (value: number) => value.toFixed(1),
            label: { value: "Value", angle: -90, position: "insideLeft", fill: "currentColor", fontSize: 10 },
        } as const;
        const commonLegendProps = {
            verticalAlign: "top" as const,
            align: "right" as const,
            iconSize: 10,
            wrapperStyle: { fontSize: "10px", paddingBottom: "4px" },
        };
        const commonTooltipProps = {
            formatter: (value: number | string | ReadonlyArray<number | string> | undefined) => {
                const resolvedValue = Array.isArray(value)
                    ? value[0]
                    : value;
                const numericValue = typeof resolvedValue === "number"
                    ? resolvedValue
                    : Number.parseFloat(`${resolvedValue ?? 0}`);

                return [numericValue.toFixed(3), "Value"];
            },
            labelFormatter: (label: React.ReactNode) => `Frame ${label ?? 0}`,
            contentStyle: {
                borderRadius: "4px",
                border: "1px solid var(--muted)",
                background: "var(--muted)",
                fontSize: "11px",
            },
            cursor: { stroke: "currentColor", strokeOpacity: 0.18 },
        };

        if (nodeData.mode === "random") {
            return (
                <div className={`relative ${CHART_HEIGHT_CLASS} nodrag w-full overflow-hidden rounded-xl border bg-secondary/20 p-2 text-primary`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 12, left: 0 }}>
                            <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                            <XAxis {...commonXAxisProps} />
                            <YAxis {...commonYAxisProps} />
                            <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.2} />
                            <Tooltip {...commonTooltipProps} />
                            <Legend {...commonLegendProps} />
                            <Bar dataKey="value" name="Value" fill="currentColor" fillOpacity={0.9} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        return (
            <div className={`relative ${CHART_HEIGHT_CLASS} nodrag w-full overflow-hidden rounded-xl border bg-secondary/20 p-2 text-primary`}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 4, bottom: 12, left: 0 }}>
                        <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis {...commonXAxisProps} />
                        <YAxis {...commonYAxisProps} />
                        <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.2} />
                        <Tooltip {...commonTooltipProps} />
                        <Legend {...commonLegendProps} />
                        <Line
                            type={nodeData.mode === "linear" ? "linear" : "monotone"}
                            dataKey="value"
                            name="Value"
                            stroke="currentColor"
                            strokeWidth={3}
                            dot={nodeData.mode === "linear" ? { r: 2, fill: "currentColor" } : false}
                            activeDot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
                {nodeData.mode === "sine" && (
                    <div className="absolute right-3 bottom-3 rounded-full border bg-background/90 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {nodeData.sineCycles}x, {nodeData.sinePhasePi}π
                    </div>
                )}
            </div>
        );
    }, [chartData, graphRange.maximum, graphRange.minimum, nodeData.mode, nodeData.sineCycles, nodeData.sinePhasePi, xAxisTicks, yAxisTicks]);


    return (
        <BaseNode className="w-96">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={FunctionSquareIcon} />
                    Value
                </BaseNodeHeaderTitle>
                <ButtonGroup>
                    {(Object.entries(VALUE_MODE_LABELS) as [ValueMode, string][]).map(([mode, label]) => (
                        <Button
                            key={mode}
                            variant={nodeData.mode === mode ? "default" : "outline"}
                            className="nodrag px-1.5 text-[10px]"
                            size="xs"
                            onClick={() => setMode(mode as ValueMode)}
                        >
                            {label}
                        </Button>
                    ))}
                </ButtonGroup>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3 nodrag">
                        {modeControls}
                    </div>
                    {previewGraph}
                </div>
                <Handle type="source" position={Position.Right} id="output" className="size-3!  bg-orange-500! border-orange-300!" data-type="value" />
            </BaseNodeContent>
        </BaseNode>
    );
});

ValueNode.displayName = "ValueNode";