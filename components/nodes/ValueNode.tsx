import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle,
} from "@/components/base-node";

import { useNodeData } from "@/hooks/store";
import useStore from "@/store/graph";
import { Handle, Position } from "@xyflow/react";
import React from "react";
import { createValueNodeData, DEFAULT_VALUE_NODE_CONFIG, normalizeValueNodeData, VALUE_MODE_LABELS, type ValueMode, type ValueNodeData } from "../../lib/value-node";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import { Slider } from "../ui/slider";

type Props = {
    id: string;
}

const CONSTANT_PRESETS = [
    { label: "0", value: 0 },
    { label: "π/4", value: Math.PI / 4 },
    { label: "1", value: 1 },
    { label: "π/2", value: Math.PI / 2 },
    { label: "3π/4", value: (3 * Math.PI) / 4 },
    { label: "π", value: Math.PI },
    { label: "3π/2", value: (3 * Math.PI) / 2 },
    { label: "2π", value: Math.PI * 2 },
] as const;

const VALUE_PREVIEW_RANGE = 10;


export const ValueNode = memo(({ id }: Props) => {
    const rawNodeData = useNodeData(id)?.data as Partial<ValueNodeData> | undefined;
    const nodeData = React.useMemo(() => normalizeValueNodeData(rawNodeData), [rawNodeData]);
    const values = nodeData.data;
    const maxAbsValue = VALUE_PREVIEW_RANGE;

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
                    <div className="col-span-2 flex justify-end" key="constant-presets">
                        <ButtonGroup>
                            {CONSTANT_PRESETS.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant={Math.abs(nodeData.constantValue - preset.value) < 0.001 ? "default" : "outline"}
                                    className="nodrag px-1.5 text-[10px]"
                                    size="xs"
                                    onClick={() => updateValueNode({ constantValue: preset.value })}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </div>,
                ];
            case "linear":
                return [
                    renderSlider("Slope (m)", nodeData.linearSlope, -4, 4, 0.01, (value) => updateValueNode({ linearSlope: value }), "col-span-2"),
                    renderSlider("Offset (n)", nodeData.linearIntercept, -2, 2, 0.01, (value) => updateValueNode({ linearIntercept: value }), "col-span-2"),
                ];
            case "sine":
                return [
                    renderSlider("Amplitude", nodeData.sineAmplitude, 0, 2, 0.01, (value) => updateValueNode({ sineAmplitude: value })),
                    renderSlider("Frequency", nodeData.sineFrequency, 0, 3, 0.01, (value) => updateValueNode({ sineFrequency: value })),
                    renderSlider("Phase", nodeData.sinePhase, -Math.PI, Math.PI, 0.01, (value) => updateValueNode({ sinePhase: value })),
                    renderSlider("Offset", nodeData.sineOffset, -2, 2, 0.01, (value) => updateValueNode({ sineOffset: value })),
                    <div className="col-span-2 flex justify-end" key="sine-reset">
                        <Button
                            variant="outline"
                            className="nodrag"
                            size="sm"
                            onClick={() => updateValueNode({
                                sineAmplitude: DEFAULT_VALUE_NODE_CONFIG.sineAmplitude,
                                sineFrequency: DEFAULT_VALUE_NODE_CONFIG.sineFrequency,
                                sinePhase: DEFAULT_VALUE_NODE_CONFIG.sinePhase,
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
    }, [nodeData, renderSlider, updateValueNode]);


    return (
        <BaseNode className="w-96">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
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
                    <div className="relative flex h-28 nodrag self-center isolate w-full items-stretch">
                        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
                        {values.map((value: number, i: number) => (
                            <span key={i}
                                className="relative h-full w-full bg-secondary"
                            >
                                {value >= 0 ? (
                                    <span className="absolute inset-x-0 bottom-1/2 rounded-t-sm bg-primary" style={{ height: `${(value / maxAbsValue) * 50}%` }} />
                                ) : (
                                    <span className="absolute inset-x-0 top-1/2 rounded-b-sm bg-primary" style={{ height: `${(Math.abs(value) / maxAbsValue) * 50}%` }} />
                                )}
                            </span>
                        ))}
                    </div>
                </div>
                <Handle type="source" position={Position.Right} id="output" />
            </BaseNodeContent>
        </BaseNode>
    );
});

ValueNode.displayName = "ValueNode";