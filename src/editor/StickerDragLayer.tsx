import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { updateSticker } from '../model/stickers'
import type { Sticker } from '../model/types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'
import type { ScheduleDocApi } from '../state/useScheduleDoc'

export type StickerDragLayerProps = {
  api: ScheduleDocApi
  /** 미리보기 축소 배율. 화면 이동량을 캔버스 좌표로 환산하는 데 쓴다. */
  scale: number
}

type DragState = {
  id: string
  pointerId: number
  startClientX: number
  startClientY: number
  startX: number
  startY: number
}

/**
 * 미리보기 위에 겹쳐 스티커를 끌어 옮기게 한다.
 *
 * preview/는 표시만 하고 조작은 editor/가 맡는다는 경계를 지키기 위해
 * 별도 오버레이로 분리했다.
 */
export function StickerDragLayer({ api, scale }: StickerDragLayerProps) {
  const { doc, setDoc } = api
  const dragRef = useRef<DragState | null>(null)

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>, sticker: Sticker) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      id: sticker.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: sticker.x,
      startY: sticker.y,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || scale <= 0) return
    const dx = (event.clientX - drag.startClientX) / scale
    const dy = (event.clientY - drag.startClientY) / scale
    setDoc((prev) =>
      updateSticker(prev, drag.id, {
        x: Math.round(drag.startX + dx),
        y: Math.round(drag.startY + dy),
      }),
    )
  }

  const endDrag = () => {
    dragRef.current = null
  }

  if (scale <= 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
        pointerEvents: 'none',
      }}
    >
      {doc.stickers.map((sticker) => (
        <div
          key={sticker.id}
          onPointerDown={(e) => onPointerDown(e, sticker)}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: 'absolute',
            left: sticker.x * scale,
            top: sticker.y * scale,
            width: sticker.width * scale,
            // 원본 비율을 모르므로 정사각형 잡이 영역을 쓴다. 끌기에는 충분하다.
            height: sticker.width * scale,
            transform: `rotate(${sticker.rotation}deg)`,
            transformOrigin: 'center center',
            border: '1px dashed rgba(24,24,27,0.5)',
            cursor: 'move',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        />
      ))}
    </div>
  )
}
