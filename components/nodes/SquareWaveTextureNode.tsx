"use client"

import { memo } from "react"

import { WaveTextureNodeBase } from "./WaveTextureNodeBase"

type Props = {
    id: string
}

export const SquareWaveTextureNode = memo(({ id }: Props) => {
    return (
        <WaveTextureNodeBase id={id} kind="square" title="Square Wave Texture" />
    )
})

SquareWaveTextureNode.displayName = "SquareWaveTextureNode"
