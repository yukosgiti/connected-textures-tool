import React from "react"

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { normalizeHexColor } from "@/lib/procedural-texture"

type Props = {
    label: string
    color: string
    draftColor: string
    defaultColor: string
    ariaLabel: string
    onDraftColorChange: (value: string) => void
    onColorChange: (value: string) => void
    onInvalidColor: () => void
}

export function ColorHexInput({
    label,
    color,
    draftColor,
    defaultColor,
    ariaLabel,
    onDraftColorChange,
    onColorChange,
    onInvalidColor,
}: Props) {
    const commitDraftColor = React.useCallback(() => {
        const normalizedColor = normalizeHexColor(draftColor)

        if (!normalizedColor) {
            onInvalidColor()
            return
        }

        onDraftColorChange(normalizedColor)
        onColorChange(normalizedColor)
    }, [draftColor, onColorChange, onDraftColorChange, onInvalidColor])

    return (
        <label className="nodrag flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <InputGroup>
                <InputGroupAddon align="inline-start">
                    <label className="flex cursor-pointer items-center">
                        <span
                            className="size-4 rounded-sm border border-border"
                            style={{ backgroundColor: color }}
                        />
                        <input
                            type="color"
                            value={color}
                            className="sr-only"
                            onChange={(event) => {
                                const nextColor =
                                    normalizeHexColor(event.target.value) ?? defaultColor
                                onDraftColorChange(nextColor)
                                onColorChange(nextColor)
                            }}
                        />
                    </label>
                </InputGroupAddon>
                <InputGroupInput
                    value={draftColor}
                    aria-label={ariaLabel}
                    className="uppercase"
                    onChange={(event) => onDraftColorChange(event.target.value)}
                    onBlur={commitDraftColor}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            commitDraftColor()
                        }
                    }}
                />
            </InputGroup>
        </label>
    )
}
