import { memo } from "react";

import {
    BaseNode,
    BaseNodeContent,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/base-node";
import { useNodeData, useNodeInputs } from "@/hooks/store";
import { decodeTexturePixels, type SerializedTextureData } from "@/lib/texture";
import { FRAMES } from "@/lib/utils";
import useStore from "@/store/graph";
import { createDefaultPreviewCells } from "@/store/nodes";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position } from "@xyflow/react";
import React from "react";

type Props = {
    id: string;
}

type TextureNodeData = {
    texture?: SerializedTextureData | null;
}

type PreviewNodeData = {
    texture?: SerializedTextureData | null;
    cells?: boolean[];
    error?: string | null;
}

const GRID_SIZE = 8;
const GRID_CELLS = GRID_SIZE * GRID_SIZE;
const DEFAULT_PREVIEW_CELLS = Object.freeze(createDefaultPreviewCells()) as readonly boolean[];
const CHECKER_DARK = "#333333";
const CHECKER_LIGHT = "rgba(0, 0, 0, 0)";

export const PreviewNode = memo(({ id }: Props) => {
    const node = useNodeData(id);
    const inputData = useNodeInputs(id);
    const setNode = useStore((store) => store.setNode);
    const textureInput = inputData.find((input) => {
        return Boolean((input as TextureNodeData).texture);
    }) as TextureNodeData | undefined;
    const nodeData = (node?.data as PreviewNodeData | undefined) ?? {};
    const texture = nodeData.texture ?? null;
    const inputTexture = textureInput?.texture ?? null;
    const error = nodeData.error ?? null;
    const cells = React.useMemo(() => {
        const nextCells = Array.from(DEFAULT_PREVIEW_CELLS);

        for (let index = 0; index < GRID_CELLS; index += 1) {
            nextCells[index] = nodeData.cells?.[index] ?? nextCells[index];
        }

        return nextCells;
    }, [nodeData.cells]);
    const decodedPixels = React.useMemo(() => {
        return texture ? decodeTexturePixels(texture) : null;
    }, [texture]);
    const [frameIndex, setFrameIndex] = React.useState(0);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (nodeData.cells?.length === GRID_CELLS) {
            return;
        }

        setNode(id, { cells: Array.from(DEFAULT_PREVIEW_CELLS) });
    }, [id, nodeData.cells, setNode]);

    React.useEffect(() => {
        if (inputTexture === texture && error === null) {
            return;
        }

        if (!inputTexture) {
            if (texture !== null || error !== null) {
                setNode(id, { texture: null, error: null });
            }

            return;
        }

        setNode(id, { texture: inputTexture, error: null });
    }, [error, id, inputTexture, setNode, texture]);

    React.useEffect(() => {
        if (!texture) {
            setFrameIndex(0);
            return;
        }

        const frameDuration = 1000 / FRAMES;
        const animationStart = performance.now();
        let animationFrameId = 0;

        const tick = (now: number) => {
            const elapsed = now - animationStart;
            const nextFrame = Math.floor(elapsed / frameDuration) % texture.frames;

            setFrameIndex(nextFrame);
            animationFrameId = window.requestAnimationFrame(tick);
        };

        animationFrameId = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [texture]);

    React.useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const tileSize = texture?.frameSize ?? 16;
        const canvasSize = tileSize * GRID_SIZE;

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

        let frameImageData: ImageData | null = null;

        if (texture && decodedPixels) {
            const frameByteLength = texture.width * texture.frameSize * 4;
            const safeFrameIndex = ((frameIndex % texture.frames) + texture.frames) % texture.frames;
            const frameStart = safeFrameIndex * frameByteLength;
            const framePixels = decodedPixels.slice(frameStart, frameStart + frameByteLength);
            frameImageData = new ImageData(framePixels, texture.width, texture.frameSize);
        }

        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = tileSize;
        frameCanvas.height = tileSize;
        const frameContext = frameCanvas.getContext("2d", { willReadFrequently: true });

        if (frameContext && frameImageData) {
            frameContext.imageSmoothingEnabled = false;
            frameContext.putImageData(frameImageData, 0, 0);
        }

        for (let cellIndex = 0; cellIndex < GRID_CELLS; cellIndex += 1) {
            const x = (cellIndex % GRID_SIZE) * tileSize;
            const y = Math.floor(cellIndex / GRID_SIZE) * tileSize;

            if (!cells[cellIndex] || !frameContext || !frameImageData) {
                drawEmptyTile(x, y);
                continue;
            }

            context.drawImage(frameCanvas, x, y, tileSize, tileSize);
        }
    }, [cells, decodedPixels, frameIndex, texture]);

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
        const tileSize = canvas.width / GRID_SIZE;
        const column = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(pixelX / tileSize)));
        const row = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(pixelY / tileSize)));
        const cellIndex = row * GRID_SIZE + column;

        toggleCell(cellIndex);
    }, [toggleCell]);

    return (
        <BaseNode className="w-104">
            <BaseNodeHeader>
                <BaseNodeHeaderTitle>
                    <HugeiconsIcon icon={ViewIcon} />
                    Preview
                </BaseNodeHeaderTitle>
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
                <p className="text-muted-foreground text-xs">
                    {texture ? `${texture.name} · ${GRID_SIZE}x${GRID_SIZE} grid` : "Connect a texture input"}
                </p>
                <p className="text-muted-foreground text-xs">
                    {cells.filter(Boolean).length} of {GRID_CELLS} tiles enabled
                </p>
                {error && <p className="text-destructive text-xs">{error}</p>}
                <Handle type="target" position={Position.Left} id="inputTexture" className="top-8! size-3! bg-blue-500! border-blue-300!" data-type="texture" />
            </BaseNodeContent>
        </BaseNode>
    );
});

PreviewNode.displayName = "PreviewNode";