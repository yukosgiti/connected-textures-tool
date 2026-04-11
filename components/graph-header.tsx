"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_GRAPH_PRESET_ID } from "@/lib/graph-presets";

export type GraphHeaderPreset = {
    id: string;
    label: string;
};

type GraphHeaderStatus = {
    tone: "default" | "error";
    message: string;
};

type Props = {
    formatVersion: number;
    presets: readonly GraphHeaderPreset[];
    onLoadPreset: (presetId: string) => void;
    onImportFile: (file: File) => Promise<void> | void;
    onExport: () => void;
    status: GraphHeaderStatus | null;
};

export function GraphHeader({
    formatVersion,
    presets,
    onLoadPreset,
    onImportFile,
    onExport,
    status,
}: Props) {
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [selectedPreset, setSelectedPreset] = React.useState<string>(DEFAULT_GRAPH_PRESET_ID);

    const handlePresetChange = React.useCallback((value: string | null) => {
        if (!value) {
            return;
        }

        setSelectedPreset(value);
        onLoadPreset(value);
    }, [onLoadPreset]);

    const handleImportClick = React.useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleImportChange = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            return;
        }

        await onImportFile(file);
        event.target.value = "";
    }, [onImportFile]);

    return (
        <header className="w-[80vw] rounded-3xl border bg-background/80 px-4 py-3 backdrop-blur-sm">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                        <h1 className="font-medium text-sm">Graph Header</h1>
                        <p className="text-muted-foreground text-xs">Import, export, and load preset graph JSON files. Format version v{formatVersion} is required.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={selectedPreset} onValueChange={handlePresetChange}>
                            <SelectTrigger className="w-52" aria-label="Graph preset JSON">
                                <SelectValue placeholder="Select preset JSON" />
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                                <SelectGroup>
                                    <SelectLabel>Preset JSONs</SelectLabel>
                                    {presets.map((preset) => (
                                        <SelectItem key={preset.id} value={preset.id}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Separator orientation="vertical" className="hidden h-8 md:block" />

                        <Button size="sm" variant="outline" onClick={handleImportClick}>
                            Import JSON
                        </Button>
                        <Button size="sm" onClick={onExport}>
                            Export JSON
                        </Button>
                    </div>
                </div>

                {status ? (
                    <p className={status.tone === "error" ? "text-destructive text-xs" : "text-muted-foreground text-xs"}>
                        {status.message}
                    </p>
                ) : null}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportChange}
            />
        </header>
    );
}