"use client"

import { memo } from "react"

import { WaveTextureNodeBase } from "./WaveTextureNodeBase"

type Props = {
    id: string
}

export const LinearWaveTextureNode = memo(({ id }: Props) => {
    return (
        <WaveTextureNodeBase
            id={id}
            kind="linear"
            title="Linear Wave Texture"
            defaultColor="#ffffff"
            defaultCycles={4}
            defaultAmplitude={0}
            defaultThickness={1.25}
            defaultPhase={0}
            showAmplitude={false}
        />
    )
})

LinearWaveTextureNode.displayName = "LinearWaveTextureNode"