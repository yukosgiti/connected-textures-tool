"use client";

import { decodeTexturePixels, type SerializedTextureData } from "@/lib/texture";
import { FRAMES } from "@/lib/utils";
import React from "react";

export const EmptyTexture = () => {
    return (
        <div className="size-32 p-0 rounded-none border-none" style={{
            backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333)`,
            backgroundSize: "16px 16px, 16px 16px",
            backgroundPosition: "0 0, 8px 8px",
            imageRendering: "pixelated"
        }} />
    )
}


type TexturePreviewProps = {
    texture: SerializedTextureData;
    frameIndex?: number;
    className?: string;
}


export const TexturePreview = ({ texture, frameIndex = 0, className }: TexturePreviewProps) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const decodedPixels = React.useMemo(() => decodeTexturePixels(texture), [texture]);

    React.useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        canvas.width = texture.width;
        canvas.height = texture.frameSize;

        const context = canvas.getContext("2d");

        if (!context) {
            return;
        }

        const frameByteLength = texture.width * texture.frameSize * 4;
        const frameDuration = 1000 / FRAMES;
        let animationFrameId = 0;
        let lastDrawnFrame = -1;

        const drawFrame = (nextFrameIndex: number) => {
            if (nextFrameIndex === lastDrawnFrame) {
                return;
            }

            const safeFrameIndex = ((nextFrameIndex % texture.frames) + texture.frames) % texture.frames;
            const frameStart = safeFrameIndex * frameByteLength;
            const pixels = decodedPixels.slice(frameStart, frameStart + frameByteLength);
            const imageData = new ImageData(pixels, texture.width, texture.frameSize);

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.putImageData(imageData, 0, 0);
            lastDrawnFrame = nextFrameIndex;
        };

        const animationStart = performance.now();

        const tick = (now: number) => {
            const elapsed = now - animationStart;
            const animatedFrame = Math.floor(elapsed / frameDuration) % texture.frames;

            drawFrame(frameIndex + animatedFrame);
            animationFrameId = window.requestAnimationFrame(tick);
        };

        drawFrame(frameIndex);
        animationFrameId = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [decodedPixels, texture, frameIndex]);

    return (
        <div className={className ?? "size-32 overflow-hidden p-0 rounded-none border-none"} style={{
            backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333)`,
            backgroundSize: "16px 16px, 16px 16px",
            backgroundPosition: "0 0, 8px 8px",
        }}>
            <canvas
                ref={canvasRef}
                aria-label={texture.name}
                className="size-full object-cover"
                style={{ imageRendering: "pixelated" }}
            />
        </div>
    )
}