"use client";
import { Button } from "@/components/ui/button";
import { applyHSLTexture } from "@/nodes/HSLTexture";
import { Suspense, useRef, useTransition } from "react";


export default function Page() {
    const [isPending, startTransition] = useTransition()
    const canvasRef = useRef<HTMLCanvasElement>(null!);

    return <div>
        <Button
            onClick={() => {
                startTransition(async () => {
                    const nextCanvas = await applyHSLTexture()
                    console.log("Received canvas from applyHSLTexture:", nextCanvas);
                    const ctx = canvasRef.current.getContext("2d")!;
                    ctx.imageSmoothingEnabled = false;
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.drawImage(nextCanvas, 0, 0, canvasRef.current.width, canvasRef.current.height);
                })

            }}
            disabled={isPending}
        >
            Test
        </Button>
        <Suspense>
            <canvas width={16 * 10} height={16 * 60 * 10} className="border border-gray-700" style={{ imageRendering: "pixelated" }}
                ref={canvasRef}
            />
        </Suspense>
    </div >
}