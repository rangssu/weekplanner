import type { Sticker } from '../model/types'
import { useAssetUrl } from '../state/useAssetUrl'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './layout'

function StickerImage({ sticker }: { sticker: Sticker }) {
  const url = useAssetUrl(sticker.assetId)
  if (!url) return null

  return (
    <img
      src={url}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        left: sticker.x,
        top: sticker.y,
        width: sticker.width,
        height: 'auto',
        transform: `rotate(${sticker.rotation}deg)`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  )
}

export type StickerLayerProps = {
  stickers: Sticker[]
}

export function StickerLayer({ stickers }: StickerLayerProps) {
  const ordered = [...stickers].sort((a, b) => a.z - b.z)

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {ordered.map((sticker) => (
        <StickerImage key={sticker.id} sticker={sticker} />
      ))}
    </div>
  )
}
