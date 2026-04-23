"use client";

import { useShader } from "@/hooks/use-shader";
import { useEffect, useRef } from "react";

const size = 16;
const frames = 60;
const scale = 1;

const vsSource = `
    attribute vec2 aVertexPosition;

    varying highp vec2 vUv;

    void main(void) {
      vUv = aVertexPosition;
      gl_Position = vec4(
        aVertexPosition.x * 2.0 - 1.0,
        1.0 - aVertexPosition.y * 2.0,
        0.0,
        1.0
      );
    }
  `;

const fsSource = `
    precision mediump float;

    varying highp vec2 vUv;

    vec3 hsv2rgb(vec3 color) {
        vec3 rgb = clamp(abs(mod(color.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        rgb = rgb * rgb * (3.0 - 2.0 * rgb);
        return color.z * mix(vec3(1.0), rgb, color.y);
    }

    void main(void) {
            float frameCount = ${frames}.0;
            float frameIndex = floor(vUv.y * frameCount);
            float hue = mod(frameIndex / frameCount, 1.0);
            vec3 color = hsv2rgb(vec3(hue, 1.0, 1.0));

            gl_FragColor = vec4(color, 1.0);
    }
  `;

export default function Page() {
    const [canvasRef] = useShader

    return (
        <div>
            <h1>Test</h1>
            <div className="bg-gray-500 w-min h-min p-1 space-y-4">
                <canvas ref={canvasRef} width={size} height={size * frames} className="border border-gray-700 hidden" style={{
                    width: size * scale,
                    height: size * frames * scale,
                    imageRendering: "pixelated"
                }} />

                <SquareAnimateCanvas canvas={canvasRef} fps={frames} />
            </div>
        </div>
    );
}

function SquareAnimateCanvas({
    canvas,
    fps,
}: {
    canvas: React.RefObject<HTMLCanvasElement | null>;
    fps: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null!);

    useEffect(() => {
        const sourceCanvas = canvas.current;
        const targetCanvas = canvasRef.current;
        if (!sourceCanvas || !targetCanvas) {
            return;
        }

        const ctx = targetCanvas.getContext("2d");
        if (!ctx) {
            return;
        }

        ctx.imageSmoothingEnabled = false;

        const frameHeight = sourceCanvas.height / frames;
        const frameWidth = sourceCanvas.width;

        let frame = 0;
        const renderFrame = () => {
            const sourceY = frame * frameHeight;

            ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(
                sourceCanvas,
                0,
                sourceY,
                frameWidth,
                frameHeight,
                0,
                0,
                targetCanvas.width,
                targetCanvas.height,
            );

            frame = (frame + 1) % frames;
        };

        renderFrame();
        const interval = setInterval(renderFrame, 1000 / fps);

        return () => clearInterval(interval);
    }, [canvas, fps]);

    return <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="border border-gray-700"
        style={{
            width: size * scale,
            height: size * scale,
            imageRendering: "pixelated"
        }}
    />
}