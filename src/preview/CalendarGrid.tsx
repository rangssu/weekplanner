import { buildMonthGrid, GRID_COLUMNS } from '../model/calendar'
import type { ScheduleDoc } from '../model/types'
import { withAlpha, type Theme } from '../theme/themes'
import { DayCell } from './DayCell'
import {
  BORDER_WIDTH, DOW_LABEL_SIZE, DOW_ROW_HEIGHT, GRID_AREA_HEIGHT, GRID_AREA_WIDTH,
} from './layout'

export const DOW_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'] as const

export type CalendarGridProps = {
  doc: ScheduleDoc
  theme: Theme
}

export function CalendarGrid({ doc, theme }: CalendarGridProps) {
  const cells = buildMonthGrid(doc.year, doc.month)

  return (
    <div
      style={{
        width: GRID_AREA_WIDTH,
        height: GRID_AREA_HEIGHT,
        border: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        // 테두리가 크기 안쪽으로 들어가야 격자가 캔버스를 넘지 않는다.
        boxSizing: 'border-box',
        // flex 부모가 격자를 눌러 압축하지 못하게 한다.
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', height: DOW_ROW_HEIGHT }}>
        {DOW_LABELS.map((label, index) => (
          <div
            key={label}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: DOW_LABEL_SIZE,
              fontWeight: 700,
              background: withAlpha(theme.dowHeaderBackground, doc.gridOpacity),
              color:
                index === 0
                  ? theme.sundayText
                  : index === 6
                    ? theme.saturdayText
                    : theme.dowHeaderText,
              borderRight:
                index === GRID_COLUMNS - 1 ? 'none' : `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
              borderBottom: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
              boxSizing: 'border-box',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}>
        {cells.map((cell) => (
          <DayCell
            key={cell.date}
            cell={cell}
            entry={doc.days[cell.date]}
            theme={theme}
            bgOpacity={doc.gridOpacity}
          />
        ))}
      </div>
    </div>
  )
}
