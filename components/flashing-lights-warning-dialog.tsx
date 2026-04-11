"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"

const FLASHING_LIGHTS_WARNING_KEY = "flashing-lights-warning-dismissed"

function FlashingLightsWarningDialog() {
    const [hasDismissedWarning, setHasDismissedWarning, hasLoaded] =
        useLocalStorageState(FLASHING_LIGHTS_WARNING_KEY, false)
    const [isOpen, setIsOpen] = React.useState(false)

    React.useEffect(() => {
        if (!hasLoaded || hasDismissedWarning) {
            return
        }

        setIsOpen(true)
    }, [hasDismissedWarning, hasLoaded])

    const handleOpenChange = React.useCallback(
        (nextOpen: boolean) => {
            setIsOpen(nextOpen)

            if (!nextOpen) {
                setHasDismissedWarning(true)
            }
        },
        [setHasDismissedWarning]
    )

    if (!hasLoaded) {
        return null
    }

    return (
        <Dialog
            open={isOpen}
            onOpenChange={handleOpenChange}
            disablePointerDismissal
        >
            <DialogContent showCloseButton={false} className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Heads up!</DialogTitle>
                    <DialogDescription className="leading-relaxed">
                        This app can create <strong>flashing lights</strong> and
                        quick visual changes. If that kind of thing tends to
                        bother you, take it easy or skip it.

                        <br />
                        <br />
                        Also, only import graph JSON files you made yourself or
                        got from someone you trust.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose render={<Button />}>Got it</DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export { FlashingLightsWarningDialog }
