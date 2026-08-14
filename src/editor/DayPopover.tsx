import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { clampToRange, type PopoverPlacement, type ScreenRect } from './cellGeometry'
import { useDialogFocus } from './useDialogFocus'

/**
 * 강조 줄이 가장 넓다 — 라벨 56 + 버튼 7개×22 + 간격 6×6 = 246px.
 * 좌우 패딩을 더해 320px. 지금 편집 패널 폭(320~420px)과 비슷해서
 * 폼을 그대로 옮겨도 안 깨진다.
 */
export const POPOVER_WIDTH = 320

/** 칸과 팝오버 사이 간격 */
const GAP = 8

/**
 * 세로 공간이 아주 좁아져도 폼이 완전히 안 보이는 것보다는 스크롤 가능한
 * 최소 높이라도 남기는 편이 낫다. clamp 상한을 정할 때만 쓴다.
 */
const MIN_HEIGHT = 120

/** 화살표 삼각형 한 변 */
const ARROW_SIZE = 8

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

  useDialogFocus(boxRef)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const onPointerDown = (event: PointerEvent) => {
      const box = boxRef.current
      if (box && event.target instanceof Node && box.contains(event.target)) return
      // 날짜 칸 버튼(wp-day-hit)을 누른 것은 바깥 클릭으로 치지 않는다. 여기서
      // 닫아버리면 뒤이어 오는 click이 이미 selectedDate=null을 보게 되어,
      // 같은 칸을 다시 눌러 껐다가 켜야 할 토글이 "깜빡였다 다시 열림"으로
      // 보인다. click 핸들러(App.handleSelect)가 토글을 제대로 하도록 넘긴다.
      if (event.target instanceof Element && event.target.closest('.wp-day-hit')) return
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

  /**
   * 세로도 컨테이너 범위 안에 머물게 죈다.
   *
   * `below`는 top을 그대로 쓰되 위아래 여백 안으로 민다. `above`는 반대로
   * bottom을 민다 — 내용 높이를 몰라도 되는 `bottom` 앵커링의 장점은
   * 그대로 두고, 상한만 컨테이너 높이에서 구해 maxHeight로 잡는다.
   * 두 갈래 다 "남는 공간이 MIN_HEIGHT보다 작아지면 그 이상은 안으로
   * 밀지 않는다"는 규칙으로 상한을 정해, 작은 컨테이너에서 top/bottom이
   * 극단으로 몰려 높이가 0에 가까워지는 것을 막는다.
   */
  let vertical: CSSProperties
  let maxHeight: number
  if (placement.vertical === 'below') {
    const rawTop = anchor.y + anchor.height + GAP
    const topUpperBound = Math.max(GAP, containerHeight - GAP - MIN_HEIGHT)
    const top = Math.min(Math.max(rawTop, GAP), topUpperBound)
    vertical = { top }
    maxHeight = containerHeight - top - GAP
  } else {
    const rawBottom = containerHeight - anchor.y + GAP
    const bottomUpperBound = Math.max(GAP, containerHeight - GAP - MIN_HEIGHT)
    const bottom = Math.min(Math.max(rawBottom, GAP), bottomUpperBound)
    vertical = { bottom }
    maxHeight = containerHeight - bottom - GAP
  }

  /**
   * 칸을 가리키는 화살표.
   *
   * 가로 방향(horizontal)이 팝오버가 칸의 어느 쪽에 붙는지를 정하므로 화살표
   * 방향(좌/우)과 붙는 변을 거기서 따온다. 세로 방향(vertical)은 그 변 위에서
   * 화살표를 위쪽/아래쪽 중 어디에 둘지만 정한다.
   *
   * **한계**: clamp로 팝오버가 밀리면(작은 컨테이너, 가장자리 칸) 화살표가
   * 실제 칸을 정확히 가리키지 않을 수 있다. 매 렌더 앵커 좌표로 화살표
   * 위치를 다시 계산할 수도 있지만, 화살표는 장식(aria-hidden)이고
   * "이 팝오버가 칸에서 열렸다"는 방향 힌트로 충분해 팝오버 모서리에
   * 고정하는 단순한 방식을 택했다.
   */
  const arrowSide: CSSProperties = placement.horizontal === 'right'
    ? {
        left: -ARROW_SIZE,
        borderRight: `${ARROW_SIZE}px solid #2563eb`,
        borderLeft: 'none',
      }
    : {
        right: -ARROW_SIZE,
        borderLeft: `${ARROW_SIZE}px solid #2563eb`,
        borderRight: 'none',
      }
  const arrowVerticalOffset: CSSProperties = placement.vertical === 'below'
    ? { top: 12 }
    : { bottom: 12 }

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-label="날짜 편집"
      tabIndex={-1}
      style={{
        position: 'absolute',
        left,
        ...vertical,
        width: POPOVER_WIDTH,
        maxHeight,
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: 12,
        borderRadius: 10,
        border: '2px solid #2563eb',
        background: '#ffffff',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: 20,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderTop: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid transparent`,
          ...arrowSide,
          ...arrowVerticalOffset,
        }}
      />
      {children}
    </div>
  )
}
