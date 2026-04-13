import { Slider } from "@/components/ui/slider";

type Props = {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    formatValue?: (value: number, step: number) => string;
};

function defaultFormatValue(value: number, step: number) {
    if (step >= 1) {
        return value.toFixed(0);
    }

    return value.toFixed(2);
}

export function ValueFallbackSlider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    formatValue = defaultFormatValue,
}: Props) {
    return (
        <label className="flex flex-col gap-1 nodrag">
            <span className="flex items-center justify-between text-muted-foreground text-xs">
                <span>{label}</span>
                <span>{formatValue(value, step)}</span>
            </span>
            <Slider
                className="nodrag"
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={(nextValue) => {
                    const resolvedValue = Array.isArray(nextValue) ? nextValue[0] ?? value : nextValue;
                    onChange(resolvedValue);
                }}
            />
        </label>
    );
}