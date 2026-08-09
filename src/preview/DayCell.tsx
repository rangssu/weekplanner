import type { GridCell } from '../model/calendar'
import type { DayEntry } from '../model/types'
import type { Theme } from '../theme/themes'
import { AutoFitText } from './AutoFitText'
import {
  BORDER_WIDTH, CELL_EXTRA_BASE_SIZE, CELL_EXTRA_HEIGHT, CELL_EXTRA_MIN_SIZE, CELL_HEIGHT, CELL_PADDING, CELL_TEXT_BASE_SIZE, CELL_TEXT_HEIGHT,
  CELL_TEXT_LINE_HEIGHT, CELL_TEXT_MIN_SIZE, CELL_TEXT_WIDTH, CELL_WIDTH,
  DATE_NUMBER_BLOCK, DATE_NUMBER_SIZE,
} from './layout'

/**
 * 날짜 숫자 색을 정한다. 우선순위:
 * 1) 앞뒤 달 칸이면 무조건 흐린 색
 * 2) 항목에 지정한 색이 있으면 그 색 (요일 기본 규칙보다 우선)
 * 3) 일요일/토요일 기본 색
 * 4) 본문 색
 */
export function dateNumberColor(
  cell: GridCell,
  entry: DayEntry | undefined,
  theme: Theme,
): string {
  if (!cell.inMonth) return theme.outsideMonthText
  if (entry?.dateColor) return entry.dateColor
  if (cell.dow === 0) return theme.sundayText
  if (cell.dow === 6) return theme.saturdayText
  return theme.bodyText
}

/**
 * 칸의 텍스트 영역을 본문과 추가 문구가 어떻게 나눠 쓰는지 정한다.
 *
 * 추가 문구가 없으면 본문이 전부 가져간다. 이 경우 기존 결과물과 픽셀 단위로
 * 같아야 하므로 띠를 0으로 두고 요소 자체를 그리지 않는다.
 */
export function splitCellText(extra: string | undefined): {
  bodyHeight: number
  extraHeight: number
} {
  if ((extra ?? '').trim() === '') {
    return { bodyHeight: CELL_TEXT_HEIGHT, extraHeight: 0 }
  }
  return { bodyHeight: CELL_TEXT_HEIGHT - CELL_EXTRA_HEIGHT, extraHeight: CELL_EXTRA_HEIGHT }
}

export type DayCellProps = {
  cell: GridCell
  entry: DayEntry | undefined
  theme: Theme
}

export function DayCell({ cell, entry, theme }: DayCellProps) {
  const text = cell.inMonth ? (entry?.text ?? '') : ''
  const extra = cell.inMonth ? (entry?.extra ?? '') : ''
  const { bodyHeight, extraHeight } = splitCellText(extra)

  return (
    <div
      style={{
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
        boxSizing: 'border-box',
        borderRight: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        borderBottom: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        background: (cell.inMonth && entry?.cellFill) || theme.cellBackground,
        padding: CELL_PADDING,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: DATE_NUMBER_BLOCK,
          fontSize: DATE_NUMBER_SIZE,
          fontWeight: 600,
          lineHeight: 1,
          color: dateNumberColor(cell, entry, theme),
          flexShrink: 0,
        }}
      >
        {/* 앞뒤 달 날짜는 숫자도 적지 않고 칸을 비워 둔다. */}
        {cell.inMonth ? cell.day : ''}
      </div>

      <AutoFitText
        text={text}
        maxWidth={CELL_TEXT_WIDTH}
        maxHeight={bodyHeight}
        baseSize={CELL_TEXT_BASE_SIZE}
        minSize={CELL_TEXT_MIN_SIZE}
        lineHeight={CELL_TEXT_LINE_HEIGHT}
        color={cell.inMonth ? theme.bodyText : theme.outsideMonthText}
        markerColor={cell.inMonth ? (entry?.marker ?? null) : null}
      />

      {extraHeight > 0 && (
        <AutoFitText
          text={extra}
          maxWidth={CELL_TEXT_WIDTH}
          maxHeight={extraHeight}
          baseSize={CELL_EXTRA_BASE_SIZE}
          minSize={CELL_EXTRA_MIN_SIZE}
          lineHeight={CELL_TEXT_LINE_HEIGHT}
          color={theme.bodyText}
          // 형광펜은 본문에만 건다. 강조 수단이 둘로 늘면 조합만 복잡해지고
          // 지금 요구에는 없다.
          markerColor={null}
        />
      )}
    </div>
  )
}
