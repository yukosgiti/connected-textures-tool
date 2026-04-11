"use client"

import { memo } from "react"

import { WaveTextureNodeBase } from "./WaveTextureNodeBase"

type Props = {
    id: string
}

export const SineWaveTextureNode = memo(({ id }: Props) => {
    return <WaveTextureNodeBase id={id} kind="sine" title="Sine Wave Texture" />
})

SineWaveTextureNode.displayName = "SineWaveTextureNode"
