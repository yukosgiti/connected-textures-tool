import React from "react"

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { useAsRef } from "@/hooks/use-as-ref"
import { normalizeHexColor } from "@/lib/procedural-texture"

const COLOR_PICKER_DEDUPE_MS = 50

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
    const colorRef = useAsRef(color)
    const onColorChangeRef = useAsRef(onColorChange)
    const pendingPickerColorRef = React.useRef<string | null>(null)
    const pickerCommitTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearPendingPickerCommit = React.useCallback(() => {
        if (pickerCommitTimeoutRef.current) {
            clearTimeout(pickerCommitTimeoutRef.current)
            pickerCommitTimeoutRef.current = null
        }

        pendingPickerColorRef.current = null
    }, [])

    const commitPickerColor = React.useCallback((nextColor: string) => {
        if (nextColor === colorRef.current) {
            return
        }

        onColorChangeRef.current(nextColor)
    }, [colorRef, onColorChangeRef])

    const schedulePickerColorCommit = React.useCallback((nextColor: string) => {
        pendingPickerColorRef.current = nextColor

        if (pickerCommitTimeoutRef.current) {
            clearTimeout(pickerCommitTimeoutRef.current)
        }

        pickerCommitTimeoutRef.current = setTimeout(() => {
            pickerCommitTimeoutRef.current = null

            const pendingColor = pendingPickerColorRef.current

            if (!pendingColor) {
                return
            }

            pendingPickerColorRef.current = null
            commitPickerColor(pendingColor)
        }, COLOR_PICKER_DEDUPE_MS)
    }, [commitPickerColor])

    const colorInputValue = normalizeHexColor(draftColor) ?? color

    React.useEffect(() => {
        return () => {
            clearPendingPickerCommit()
        }
    }, [clearPendingPickerCommit])

    const commitDraftColor = React.useCallback(() => {
        clearPendingPickerCommit()

        const normalizedColor = normalizeHexColor(draftColor)

        if (!normalizedColor) {
            onInvalidColor()
            return
        }

        onDraftColorChange(normalizedColor)
        onColorChange(normalizedColor)
    }, [clearPendingPickerCommit, draftColor, onColorChange, onDraftColorChange, onInvalidColor])

    return (
        <label className="nodrag flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <InputGroup>
                <InputGroupAddon align="inline-start">
                    <label className="flex cursor-pointer items-center">
                        <span
                            className="size-4 rounded-sm border border-border"
                            style={{ backgroundColor: colorInputValue }}
                        />
                        <input
                            type="color"
                            value={colorInputValue}
                            className="sr-only"
                            onChange={(event) => {
                                const nextColor =
                                    normalizeHexColor(event.target.value) ?? defaultColor
                                onDraftColorChange(nextColor)
                                schedulePickerColorCommit(nextColor)
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
