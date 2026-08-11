import { useEffect, useRef, type ReactNode } from 'react'
import { clampToRange, type PopoverPlacement, type ScreenRect } from './cellGeometry'

/**
 * 강조 줄이 가장 넓다 — 라벨 56 + 버튼 7개×22 + 간격 6×6 = 246px.
 * 좌우 패딩을 더해 320px. 지금 편집 패널 폭(320~420px)과 비슷해서
 * 폼을 그대로 옮겨도 안 깨진다.
 */
export const POPOVER_WIDTH = 320

/** 칸과 팝오버 사이 간격 */
const GAP = 8

export type DayPopoverProps = {
  /** 고른 칸의 화면 좌표. 미리보기 컨테이너 왼쪽 위가 원점이다. */
  anchor: ScreenRect
  placement: PopoverPlacement
  containerWidth: number
  containerHeight: number
  onClose: () => void
  children: ReactNode
}

/** 고른 칸 옆에 뜨는 편집 상자. 넓은 화면에서만 쓴다. */
export function DayPopover({
  anchor, placement, containerWidth, containerHeight, onClose, children,
}: DayPopoverProps) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const onPointerDown = (event: PointerEvent) => {
      const box = boxRef.current
      if (box && event.target instanceof Node && box.contains(event.target)) return
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [onClose])

  const rawLeft = placement.horizontal === 'right'
    ? anchor.x + anchor.width + GAP
    : anchor.x - POPOVER_WIDTH - GAP
  const left = clampToRange(rawLeft, POPOVER_WIDTH, containerWidth, GAP)

  // 위로 뒤집을 때는 높이를 몰라도 되게 bottom으로 잡는다.
  const vertical = placement.vertical === 'below'
    ? { top: anchor.y + anchor.height + GAP }
    : { bottom: containerHeight - anchor.y + GAP }

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-label="날짜 편집"
      style={{
        position: 'absolute',
        left,
        ...vertical,
        width: POPOVER_WIDTH,
        boxSizing: 'border-box',
        padding: 12,
        borderRadius: 10,
        border: '2px solid #2563eb',
        background: '#ffffff',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: 20,
      }}
    >
      {children}
    </div>
  )
}
