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