import { Handle, Position } from "@xyflow/react"

import { ValueFallbackSlider } from "./ValueFallbackSlider"

type Props = {
    handleId: string
    label: string
    hasInput: boolean
    value: number
    min: number
    max: number
    step: number
    onChange: (value: number) => void
}

export function ValueInputControl({
    handleId,
    label,
    hasInput,
    value,
    min,
    max,
    step,
    onChange,
}: Props) {
    if (hasInput) {
        return (
            <div className="relative text-xs text-secondary-foreground">
                <Handle
                    type="target"
                    position={Position.Left}
                    id={handleId}
                    className="-left-3! size-3! border-orange-300! bg-orange-500!"
                    data-type="value"
                />
                {label}
            </div>
        )
    }

    return (
        <div className="relative">
            <Handle
                type="target"
                position={Position.Left}
                id={handleId}
                className="top-1/2! -left-3! size-3! -translate-y-1/2 border-orange-300! bg-orange-500!"
                data-type="value"
            />
            <ValueFallbackSlider
                label={label}
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={onChange}
            />
        </div>
    )
}
