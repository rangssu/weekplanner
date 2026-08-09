/** 업로드 이미지의 최대 변 길이. 원본을 그대로 두면 IndexedDB와 메모리를 크게 먹는다. */
export const MAX_IMAGE_EDGE = 2000

export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge || longest === 0) return { width, height }
  const ratio = maxEdge / longest
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

/** 너무 큰 이미지를 줄인다. 한도 안이면 원본 Blob을 그대로 돌려준다. */
export async function resizeImageBlob(blob: Blob, maxEdge = MAX_IMAGE_EDGE): Promise<Blob> {
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    const target = fitWithin(image.naturalWidth, image.naturalHeight, maxEdge)
    if (target.width === image.naturalWidth && target.height === image.naturalHeight) return blob

    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, target.width, target.height)

    const resized = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    )
    return resized ?? blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
