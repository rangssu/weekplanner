import type { CSSProperties } from 'react'
import { buildMonthGrid, GRID_COLUMNS, GRID_ROWS } from '../model/calendar'
import {
  CANVAS_HEIGHT, CANVAS_WIDTH,
  CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y,
} from '../preview/layout'

export type DayClickLayerProps = {
  year: number
  /** 1-12 */
  month: number
  /** 미리보기 축소 배율. 0이면 아직 재기 전이다. */
  scale: number
  selectedDate: string | null
  onSelect: (date: string) => void
}

/**
 * 미리보기 위에 겹쳐 날짜 칸 클릭을 받는다.
 *
 * preview/는 표시만 하고 조작은 editor/가 맡는다는 경계를 지키기 위해 별도
 * 오버레이로 뒀다. StickerDragLayer와 같은 이유다.
 *
 * **좌표를 계산하지 않는다.** 격자 영역에 CalendarGrid와 같은 구조의 CSS
 * 그리드를 놓고 안쪽 7×6 분할은 브라우저에 맡긴다. 칸마다 좌표를 구하면
 * CalendarGrid와 따로 노는 두 번째 계산이 생겨 격자 구조를 손댈 때
 * 조용히 어긋난다.
 *
 * **축소는 루트에 transform 한 번으로 건다.** StickerDragLayer처럼 좌표마다
 * scale을 곱하지 않는다. PreviewStage가 캔버스에 하는 것과 같은 방식이라
 * 정렬이 어긋날 여지가 없다.
 *
 * 이 레이어는 canvasRef 바깥에 있다. html-to-image는 ScheduleCanvas 노드만
 * 직렬화하므로 선택 표시가 내보낸 PNG에 들어갈 수가 없다.
 */
export function DayClickLayer({
  year, month, scale, selectedDate, onSelect,
}: DayClickLayerProps) {
  if (scale <= 0) return null

  const cells = buildMonthGrid(year, month)
  // 테두리도 같이 축소되면 0.3배에서 안 보인다. 화면에서 4px이 되게 되돌린다.
  const hitBorder = Math.max(1, Math.round(4 / scale))

  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0,
        width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: CELL_AREA_X, top: CELL_AREA_Y,
          width: CELL_AREA_WIDTH, height: CELL_AREA_HEIGHT,
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {cells.map((cell) =>
          cell.inMonth ? (
            <button
              key={cell.date}
              type="button"
              aria-label={`${cell.date} 편집`}
              className={`wp-day-hit${cell.date === selectedDate ? ' is-selected' : ''}`}
              onClick={() => onSelect(cell.date)}
              style={{ '--wp-hit-border': `${hitBorder}px` } as CSSProperties}
            />
          ) : (
            <div key={cell.date} />
          ),
        )}
      </div>
    </div>
  )
}
