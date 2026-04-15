import { loadImageFromUrl, normalizeTextureImage } from "./internal"
import { type SerializedTextureData } from "./types"

export async function normalizeTextureUrl(
  url: string,
  name: string
): Promise<SerializedTextureData> {
  const image = await loadImageFromUrl(url)
  return normalizeTextureImage(image, name)
}
