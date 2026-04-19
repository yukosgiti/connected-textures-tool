import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { EmptyTexture, TexturePreview } from "@/components/EmptyTexture";
import { Button } from "@/components/ui/button";
import { resolveNodeOutputData, useNodeData } from "@/hooks/store";
import { withBasePath } from "@/lib/base-path";
import {
    CONNECTED_TEXTURE_INPUT_HANDLE_ID,
    CONNECTED_TEXTURE_OUTPUTS,
    getConnectedTextureUsageCounts,
    getConnectedTextureTemplateIndex,
} from "@/lib/connected-texture";
import { decodeTexturePixels, type SerializedTextureData } from "@/lib/texture";
import { cn, FRAMES } from "@/lib/utils";
import useStore from "@/store/graph";
import { createDefaultPreviewCells, DEFAULT_PREVIEW_GRID_SIZE } from "@/store/nodes";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import Image from "next/image";
import React from "react";
import { ButtonGroup } from "../ui/button-group";

type Props = {
    id: string;
}

type TextureNodeData = {
    texture?: SerializedTextureData | null;
}

type ConnectedTextureNodeData = {
    texture?: SerializedTextureData | null;
    outputTextures?: Record<string, SerializedTextureData | null>;
}

type PreviewNodeData = {
    texture?: SerializedTextureData | null;
    gridSize?: number;
    cells?: boolean[];
    debug?: boolean;
    error?: string | null;
}

const PREVIEW_GRID_OPTIONS = [3, 4, 8, 21] as const;
const CHECKER_DARK = "#333333";
const CHECKER_LIGHT = "rgba(0, 0, 0, 0)";

export const PreviewNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const setNode = useStore((store) => store.setNode);
    const nodes = useStore((store) => store.nodes);
    const edges = useStore((store) => store.edges);
    const inputMap = React.useMemo(() => {
        return edges
            .filter((edge) => edge.target === id)
            .reduce<Record<string, unknown>>((accumulator, edge) => {
                const sourceNode = nodes.find((nodeEntry) => nodeEntry.id === edge.source);

                if (sourceNode && edge.targetHandle) {
                    accumulator[edge.targetHandle] = resolveNodeOutputData(sourceNode.data, edge.sourceHandle);
                }

                return accumulator;
            }, {});
    }, [edges, id, nodes]);
    const textureInput = inputMap.inputTexture as TextureNodeData | undefined;
    const connectedTextureInput = inputMap[CONNECTED_TEXTURE_INPUT_HANDLE_ID] as ConnectedTextureNodeData | undefined;
    const nodeData = (node?.data as PreviewNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const inputTexture = textureInput?.texture ?? null;
    const inputConnectedTexture = connectedTextureInput ?? null;
    const connectedOutputTextures = inputConnectedTexture?.outputTextures ?? {};
    const firstConnectedTexture = React.useMemo(() => {
        return Object.values(connectedOutputTextures).find((outputTexture) => Boolean(outputTexture)) ?? null;
    }, [connectedOutputTextures]);
    const debug = nodeData.debug ?? false;
    const error = nodeData.error ?? null;
    const gridSize = Number.isInteger(nodeData.gridSize) && (nodeData.gridSize ?? 0) > 0
        ? nodeData.gridSize as number
        : DEFAULT_PREVIEW_GRID_SIZE;
    const gridCells = gridSize * gridSize;
    const defaultPreviewCells = React.useMemo(() => {
        return createDefaultPreviewCells(gridSize);
    }, [gridSize]);
    const cells = React.useMemo(() => {
        const nextCells = Array.from(defaultPreviewCells);

        for (let index = 0; index < gridCells; index += 1) {
            nextCells[index] = nodeData.cells?.[index] ?? nextCells[index];
        }

        return nextCells;
    }, [defaultPreviewCells, gridCells, nodeData.cells]);
    const connectedTextureUsageCounts = React.useMemo(() => {
        if (!inputConnectedTexture) {
            return null;
        }

        return getConnectedTextureUsageCounts(cells, gridSize);
    }, [cells, gridSize, inputConnectedTexture]);
    const connectedTextureUsageTotal = React.useMemo(() => {
        return connectedTextureUsageCounts?.reduce((total, count) => total + count, 0) ?? 0;
    }, [connectedTextureUsageCounts]);
    const connectedTextureUsageMax = React.useMemo(() => {
        return connectedTextureUsageCounts ? Math.max(...connectedTextureUsageCounts, 0) : 0;
    }, [connectedTextureUsageCounts]);
    const connectedTextureUsageEntries = React.useMemo(() => {
        if (!connectedTextureUsageCounts) {
            return [];
        }

        return CONNECTED_TEXTURE_OUTPUTS.map((output) => {
            const count = connectedTextureUsageCounts[output.index] ?? 0;
            const ratio = connectedTextureUsageMax > 0 ? count / connectedTextureUsageMax : 0;

            return {
                handleId: output.handleId,
                index: output.index,
                count,
                ratio,
            };
        });
    }, [connectedTextureUsageCounts, connectedTextureUsageMax]);
    const connectedTextureUnusedCount = React.useMemo(() => {
        return connectedTextureUsageEntries.filter((entry) => entry.count === 0).length;
    }, [connectedTextureUsageEntries]);
    const connectedTextureUsedCount = React.useMemo(() => {
        return connectedTextureUsageEntries.length - connectedTextureUnusedCount;
    }, [connectedTextureUsageEntries.length, connectedTextureUnusedCount]);
    const activePreviewTexture = inputConnectedTexture?.texture ?? inputTexture ?? texture;
    const decodedPixels = React.useMemo(() => {
        return activePreviewTexture ? decodeTexturePixels(activePreviewTexture) : null;
    }, [activePreviewTexture]);
    const decodedConnectedTextures = React.useMemo(() => {
        return Object.fromEntries(
            Object.entries(connectedOutputTextures).map(([handleId, outputTexture]) => {
                return [handleId, outputTexture ? decodeTexturePixels(outputTexture) : null];
            }),
        ) as Record<string, Uint8ClampedArray | null>;
    }, [connectedOutputTextures]);
    const [frameIndex, setFrameIndex] = React.useState(0);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (nodeData.gridSize === gridSize && nodeData.cells?.length === gridCells) {
            return;
        }

        setNode(id, {
            gridSize,
            cells: Array.from(defaultPreviewCells),
        });
    }, [defaultPreviewCells, gridCells, gridSize, id, nodeData.cells, nodeData.gridSize, setNode]);

    React.useEffect(() => {
        const nextTexture = inputConnectedTexture?.texture ?? inputTexture;

        if (nextTexture === texture && error === null) {
            return;
        }

        if (!nextTexture) {
            if (texture !== null || error !== null) {
                setNode(id, { texture: null, error: null });
            }

            return;
        }

        setNode(id, { texture: nextTexture, error: null });
    }, [error, id, inputConnectedTexture?.texture, inputTexture, setNode, texture]);

    React.useEffect(() => {
        const animationTexture = firstConnectedTexture ?? activePreviewTexture;

        if (!animationTexture) {
            setFrameIndex(0);
            return;
        }

        const frameDuration = 1000 / FRAMES;
        const animationStart = performance.now();
        let animationFrameId = 0;

        const tick = (now: number) => {
            const elapsed = now - animationStart;
            const nextFrame = Math.floor(elapsed / frameDuration) % animationTexture.frames;

            setFrameIndex(nextFrame);
            animationFrameId = window.requestAnimationFrame(tick);
        };

        animationFrameId = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [activePreviewTexture, firstConnectedTexture]);

    React.useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const tileSize = firstConnectedTexture?.frameSize ?? activePreviewTexture?.frameSize ?? 16;
        const canvasSize = tileSize * gridSize;

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
            return;
        }

        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, canvas.width, canvas.height);

        const drawEmptyTile = (offsetX: number, offsetY: number) => {
            const checkerSize = Math.max(2, Math.floor(tileSize / 4));

            context.fillStyle = CHECKER_LIGHT;
            context.fillRect(offsetX, offsetY, tileSize, tileSize);

            for (let y = 0; y < tileSize; y += checkerSize) {
                for (let x = 0; x < tileSize; x += checkerSize) {
                    const isDark = ((x / checkerSize) + (y / checkerSize)) % 2 === 0;

                    if (!isDark) {
                        continue;
                    }

                    context.fillStyle = CHECKER_DARK;
                    context.fillRect(offsetX + x, offsetY + y, checkerSize, checkerSize);
                }
            }
        };

        if (inputConnectedTexture && firstConnectedTexture) {
            const frameByteLength = firstConnectedTexture.width * firstConnectedTexture.frameSize * 4;

            for (let cellIndex = 0; cellIndex < gridCells; cellIndex += 1) {
                const x = (cellIndex % gridSize) * tileSize;
                const y = Math.floor(cellIndex / gridSize) * tileSize;

                if (!cells[cellIndex]) {
                    drawEmptyTile(x, y);
                    continue;
                }

                const templateIndex = getConnectedTextureTemplateIndex(cells, gridSize, cellIndex);

                if (templateIndex === null) {
                    drawEmptyTile(x, y);
                    continue;
                }

                const outputTexture = connectedOutputTextures[`outputTexture${templateIndex}`] ?? null;
                const decodedTexture = decodedConnectedTextures[`outputTexture${templateIndex}`] ?? null;

                if (!outputTexture || !decodedTexture) {
                    drawEmptyTile(x, y);
                    continue;
                }

                const safeFrameIndex = ((frameIndex % outputTexture.frames) + outputTexture.frames) % outputTexture.frames;
                const frameStart = safeFrameIndex * frameByteLength;
                const framePixels = decodedTexture.slice(frameStart, frameStart + frameByteLength);

                context.putImageData(new ImageData(framePixels, outputTexture.width, outputTexture.frameSize), x, y);
            }

            return;
        }

        let frameImageData: ImageData | null = null;

        if (activePreviewTexture && decodedPixels) {
            const frameByteLength = activePreviewTexture.width * activePreviewTexture.frameSize * 4;
            const safeFrameIndex = ((frameIndex % activePreviewTexture.frames) + activePreviewTexture.frames) % activePreviewTexture.frames;
            const frameStart = safeFrameIndex * frameByteLength;
            const framePixels = decodedPixels.slice(frameStart, frameStart + frameByteLength);
            frameImageData = new ImageData(framePixels, activePreviewTexture.width, activePreviewTexture.frameSize);
        }

        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = tileSize;
        frameCanvas.height = tileSize;
        const frameContext = frameCanvas.getContext("2d", { willReadFrequently: true });

        if (frameContext && frameImageData) {
            frameContext.imageSmoothingEnabled = false;
            frameContext.putImageData(frameImageData, 0, 0);
        }

        for (let cellIndex = 0; cellIndex < gridCells; cellIndex += 1) {
            const x = (cellIndex % gridSize) * tileSize;
            const y = Math.floor(cellIndex / gridSize) * tileSize;

            if (!cells[cellIndex] || !frameContext || !frameImageData) {
                drawEmptyTile(x, y);
                continue;
            }

            context.drawImage(frameCanvas, x, y, tileSize, tileSize);
        }
    }, [activePreviewTexture, cells, connectedOutputTextures, decodedConnectedTextures, decodedPixels, firstConnectedTexture, frameIndex, gridCells, gridSize, inputConnectedTexture]);

    const toggleCell = React.useCallback((cellIndex: number) => {
        const nextCells = cells.map((isEnabled, index) => {
            return index === cellIndex ? !isEnabled : isEnabled;
        });

        setNode(id, { cells: nextCells });
    }, [cells, id, setNode]);

    const onCanvasClick = React.useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const pixelX = (event.clientX - rect.left) * scaleX;
        const pixelY = (event.clientY - rect.top) * scaleY;
        const tileSize = canvas.width / gridSize;
        const column = Math.max(0, Math.min(gridSize - 1, Math.floor(pixelX / tileSize)));
        const row = Math.max(0, Math.min(gridSize - 1, Math.floor(pixelY / tileSize)));
        const cellIndex = row * gridSize + column;

        toggleCell(cellIndex);
    }, [gridSize, toggleCell]);

    const setGridSize = React.useCallback((nextGridSize: typeof PREVIEW_GRID_OPTIONS[number]) => {
        setNode(id, {
            gridSize: nextGridSize,
            cells: createDefaultPreviewCells(nextGridSize),
        });
    }, [id, setNode]);

    const clearCells = React.useCallback(() => {
        setNode(id, { cells: new Array(gridCells).fill(false) });
    }, [gridCells, id, setNode]);

    return (
        <BaseNode className="w-104">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={ViewIcon} />
                    Preview
                </BaseNodeHeaderTitle>
                <div className="flex items-center gap-1">
                    <ButtonGroup>
                        {PREVIEW_GRID_OPTIONS.map((option) => (
                            <Button
                                key={option}
                                size="xs"
                                variant={gridSize === option ? "default" : "outline"}
                                onClick={() => setGridSize(option)}
                                className="nodrag px-1.5 text-[10px]"
                            >
                                {option}x{option}
                            </Button>
                        ))}
                    </ButtonGroup>
                    <ButtonGroup>
                        <Button
                            size="xs"
                            variant={debug ? "default" : "outline"}
                            onClick={() => setNode(id, { debug: !debug })}
                            className="nodrag px-1.5 text-[10px]"
                        >
                            Debug
                        </Button>
                    </ButtonGroup>
                </div>
            </BaseNodeHeader>
            <BaseNodeContent>
                <div className="nodrag overflow-hidden rounded-md border border-border bg-secondary/40 p-1">
                    <canvas
                        ref={canvasRef}
                        aria-label="Preview grid"
                        className="block aspect-square w-full cursor-pointer"
                        onClick={onCanvasClick}
                        style={{ imageRendering: "pixelated" }}
                    />
                </div>

                {debug && inputConnectedTexture && (
                    <div className="nodrag flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground">Connected Texture Usage</span>
                            <div className="flex items-center gap-1">
                                <div className="rounded-full border border-border bg-secondary/20 px-2 py-1 text-[10px] text-muted-foreground">
                                    <span className="tabular-nums text-foreground">{connectedTextureUsageTotal}</span> tiles
                                </div>
                                <Button
                                    size="xs"
                                    variant="destructive"
                                    onClick={clearCells}
                                    className="nodrag"
                                    disabled={connectedTextureUsageTotal === 0}
                                >
                                    Clean
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <div className="rounded-md border border-border bg-secondary/20 px-2 py-1.5">
                                <div className="text-[10px] text-muted-foreground">Used</div>
                                <div className="text-sm font-semibold tabular-nums text-foreground">{connectedTextureUsedCount}</div>
                            </div>
                            <div className="rounded-md border border-destructive/35 bg-destructive/10 px-2 py-1.5">
                                <div className="text-[10px] text-destructive/80">Unused</div>
                                <div className="text-sm font-semibold tabular-nums text-destructive">{connectedTextureUnusedCount}</div>
                            </div>
                            <div className="rounded-md border border-border bg-secondary/20 px-2 py-1.5">
                                <div className="text-[10px] text-muted-foreground">Peak</div>
                                <div className="text-sm font-semibold tabular-nums text-foreground">{connectedTextureUsageMax}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                            {connectedTextureUsageEntries.map((entry) => {
                                const progressWidth = entry.count === 0
                                    ? 100
                                    : Math.max(12, Math.round(entry.ratio * 100));

                                return (
                                    <div
                                        key={entry.index}
                                        className={cn(
                                            "flex min-h-20 flex-col gap-1 rounded-md border px-1.5 py-1.5 transition-colors",
                                            entry.count === 0
                                                ? "border-destructive/40 bg-destructive/10"
                                                : entry.ratio >= 0.75
                                                    ? "border-primary/35 bg-primary/12"
                                                    : entry.ratio >= 0.35
                                                        ? "border-border bg-secondary/35"
                                                        : "border-border/70 bg-secondary/15",
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-1">
                                            <span className={cn(
                                                "text-[10px] tabular-nums",
                                                entry.count === 0 ? "text-destructive" : "text-muted-foreground",
                                            )}>
                                                #{entry.index}
                                            </span>
                                            <span className={cn(
                                                "text-sm font-semibold tabular-nums leading-none",
                                                entry.count === 0 ? "text-destructive" : "text-foreground",
                                            )}>
                                                {entry.count}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Image
                                                src={withBasePath(`/sample/${entry.index}.png`)}
                                                alt={`Sample ${entry.index}`}
                                                width={20}
                                                height={20}
                                                className="size-5 rounded-xs object-cover"
                                                style={{ imageRendering: "pixelated" }}
                                            />
                                            {connectedOutputTextures[entry.handleId] ? (
                                                <TexturePreview
                                                    texture={connectedOutputTextures[entry.handleId] as SerializedTextureData}
                                                    frameIndex={frameIndex}
                                                    className="size-5 rounded-xs"
                                                />
                                            ) : (
                                                <EmptyTexture className="size-5 rounded-xs" />
                                            )}
                                        </div>
                                        <div className={cn(
                                            "mt-auto h-1.5 overflow-hidden rounded-full",
                                            entry.count === 0 ? "bg-destructive/15" : "bg-background/70",
                                        )}>
                                            <div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    entry.count === 0 ? "bg-destructive/75" : "bg-primary",
                                                )}
                                                style={{ width: `${progressWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Unused connected textures are highlighted in red.</p>
                    </div>
                )}

                {debug && !inputConnectedTexture && (
                    <p className="text-[10px] text-muted-foreground">Connect a connected texture to inspect usage counts.</p>
                )}


                {error && <p className="text-destructive text-xs">{error}</p>}
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
                <Handle type="target" position={Position.Left} id={CONNECTED_TEXTURE_INPUT_HANDLE_ID} className="top-14! size-3! bg-indigo-500! border-indigo-300!" data-type="connectedTexture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

PreviewNode.displayName = "PreviewNode";