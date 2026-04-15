import { normalizeTextureImage, loadImage } from "./internal"
import { type SerializedTextureData } from "./types"

export async function normalizeTextureFile(
  file: File
): Promise<SerializedTextureData> {
  const image = await loadImage(file)
  return normalizeTextureImage(image, file.name)
}
