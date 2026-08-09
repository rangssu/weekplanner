import { useEffect, useState } from 'react'
import { blobToDataUrl, getAsset } from '../model/assets'

const cache = new Map<string, string>()

/**
 * IndexedDB 에셋을 data URL로 읽어 준다.
 *
 * blob: URL 대신 data: URL을 쓰는 이유는 html-to-image가 내보내기 시점에
 * blob: URL을 다시 읽지 못하는 경우가 있어 결과 이미지에서 그림이 빠지기 때문이다.
 */
export function useAssetUrl(assetId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    assetId ? (cache.get(assetId) ?? null) : null,
  )

  useEffect(() => {
    if (!assetId) {
      setUrl(null)
      return
    }
    const cached = cache.get(assetId)
    if (cached) {
      setUrl(cached)
      return
    }

    let alive = true
    void getAsset(assetId).then(async (asset) => {
      if (!asset) {
        if (alive) setUrl(null)
        return
      }
      const dataUrl = await blobToDataUrl(asset.blob)
      cache.set(assetId, dataUrl)
      if (alive) setUrl(dataUrl)
    })
    return () => {
      alive = false
    }
  }, [assetId])

  return url
}
