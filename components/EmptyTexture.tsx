"use client";

import { decodeTexturePixels, type SerializedTextureData } from "@/lib/texture";
import { FRAMES } from "@/lib/utils";
import React from "react";

const previewContainerClass = "size-32 overflow-hidden p-0 rounded-none border-none";
const previewBackgroundStyle = {
    backgroundImage: "linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333)",
    backgroundSize: "16px 16px, 16px 16px",
    backgroundPosition: "0 0, 8px 8px",
} as const;

const rotateVertexShader = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = (aPosition + 1.0) * 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const rotateFragmentShader = `
precision highp float;
#define PI 3.1415926535

varying vec2 vUv;
uniform sampler2D t;
uniform float uFrames;
uniform float uFrameIndex;
uniform float uAngleTurns;

mat2 rotate2d(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void main() {
  vec2 st = vUv - 0.5;
  st = rotate2d(uAngleTurns * PI * 2.0) * st;
  st += 0.5;

    st = fract(st);

  vec2 sampleUv = vec2(st.x, 1.0 - ((uFrameIndex + (1.0 - st.y)) / uFrames));
  gl_FragColor = texture2D(t, sampleUv);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);

    if (!shader) {
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }

    gl.deleteShader(shader);
    return null;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
        if (vertexShader) {
            gl.deleteShader(vertexShader);
        }

        if (fragmentShader) {
            gl.deleteShader(fragmentShader);
        }

        return null;
    }

    const program = gl.createProgram();

    if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }

    gl.deleteProgram(program);
    return null;
}

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
        <div className={className ?? previewContainerClass} style={previewBackgroundStyle}>
            <canvas
                ref={canvasRef}
                aria-label={texture.name}
                className="size-full object-cover"
                style={{ imageRendering: "pixelated" }}
            />
        </div>
    )
}


type RotatedTexturePreviewProps = {
    texture: SerializedTextureData;
    values: number[];
    className?: string;
}


export const RotatedTexturePreview = ({ texture, values, className }: RotatedTexturePreviewProps) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const decodedPixels = React.useMemo(() => decodeTexturePixels(texture), [texture]);
    const rotationValues = React.useMemo(() => {
        const nextValues = new Array(FRAMES).fill(0);

        for (let index = 0; index < FRAMES; index += 1) {
            nextValues[index] = values[index] ?? 0;
        }

        return nextValues;
    }, [values]);

    React.useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        canvas.width = texture.width;
        canvas.height = texture.frameSize;

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            premultipliedAlpha: false,
        });

        if (!gl) {
            return;
        }

        const program = createProgram(gl, rotateVertexShader, rotateFragmentShader);

        if (!program) {
            return;
        }

        const positionLocation = gl.getAttribLocation(program, "aPosition");
        const framesLocation = gl.getUniformLocation(program, "uFrames");
        const frameIndexLocation = gl.getUniformLocation(program, "uFrameIndex");
        const angleLocation = gl.getUniformLocation(program, "uAngleTurns");
        const textureLocation = gl.getUniformLocation(program, "t");
        const positionBuffer = gl.createBuffer();
        const textureHandle = gl.createTexture();

        if (
            positionLocation < 0
            || !framesLocation
            || !frameIndexLocation
            || !angleLocation
            || !textureLocation
            || !positionBuffer
            || !textureHandle
        ) {
            if (positionBuffer) {
                gl.deleteBuffer(positionBuffer);
            }

            if (textureHandle) {
                gl.deleteTexture(textureHandle);
            }

            gl.deleteProgram(program);
            return;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1, -1,
                1, -1,
                -1, 1,
                1, 1,
            ]),
            gl.STATIC_DRAW,
        );

        gl.bindTexture(gl.TEXTURE_2D, textureHandle);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            texture.width,
            texture.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            decodedPixels,
        );

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(framesLocation, texture.frames);
        gl.uniform1i(textureLocation, 0);
        gl.clearColor(0, 0, 0, 0);

        const frameDuration = 1000 / FRAMES;
        const animationStart = performance.now();
        let animationFrameId = 0;

        const renderFrame = (frame: number) => {
            const safeFrame = ((frame % texture.frames) + texture.frames) % texture.frames;
            const angleTurns = rotationValues[safeFrame] ?? 0;

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform1f(frameIndexLocation, safeFrame);
            gl.uniform1f(angleLocation, angleTurns);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };

        const tick = (now: number) => {
            const elapsed = now - animationStart;
            const nextFrame = Math.floor(elapsed / frameDuration) % texture.frames;

            renderFrame(nextFrame);
            animationFrameId = window.requestAnimationFrame(tick);
        };

        renderFrame(0);
        animationFrameId = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            gl.deleteTexture(textureHandle);
            gl.deleteBuffer(positionBuffer);
            gl.deleteProgram(program);
        };
    }, [decodedPixels, rotationValues, texture]);

    return (
        <div className={className ?? previewContainerClass} style={previewBackgroundStyle}>
            <canvas
                ref={canvasRef}
                aria-label={`${texture.name} rotated preview`}
                className="size-full object-cover"
                style={{ imageRendering: "pixelated" }}
            />
        </div>
    )
}