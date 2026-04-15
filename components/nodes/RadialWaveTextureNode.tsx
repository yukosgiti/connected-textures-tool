"use client"

import { memo } from "react"

import { WaveTextureNodeBase } from "./WaveTextureNodeBase"

type Props = {
    id: string
}

export const RadialWaveTextureNode = memo(({ id }: Props) => {
    return (
        <WaveTextureNodeBase
            id={id}
            kind="radial"
            title="Radial Wave Texture"
            defaultCycles={6}
            defaultAmplitude={0}
            defaultThickness={1.25}
            defaultPhase={0}
            showAmplitude={false}
        />
    )
})

RadialWaveTextureNode.displayName = "RadialWaveTextureNode"