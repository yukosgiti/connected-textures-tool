"use client";

import { getTextureFramePixels, type SerializedTextureData } from "@/lib/texture";
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

        const pixels = getTextureFramePixels(texture, frameIndex);
        const imageData = new ImageData(pixels, texture.width, texture.frameSize);

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.putImageData(imageData, 0, 0);
    }, [texture, frameIndex]);

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