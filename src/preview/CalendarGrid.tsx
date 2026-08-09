import { buildMonthGrid, GRID_COLUMNS } from '../model/calendar'
import type { ScheduleDoc } from '../model/types'
import type { Theme } from '../theme/themes'
import { DayCell } from './DayCell'
import { BORDER_WIDTH, DOW_ROW_HEIGHT, GRID_WIDTH } from './layout'

export const DOW_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

export type CalendarGridProps = {
  doc: ScheduleDoc
  theme: Theme
}

export function CalendarGrid({ doc, theme }: CalendarGridProps) {
  const cells = buildMonthGrid(doc.year, doc.month)

  return (
    <div
      style={{
        width: GRID_WIDTH,
        border: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        boxSizing: 'content-box',
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
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: 2,
              background: theme.dowHeaderBackground,
              color:
                index === 0
                  ? theme.sundayText
                  : index === 6
                    ? theme.saturdayText
                    : theme.dowHeaderText,
              borderRight:
                index === GRID_COLUMNS - 1 ? 'none' : `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
              boxSizing: 'border-box',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}>
        {cells.map((cell) => (
          <DayCell key={cell.date} cell={cell} entry={doc.days[cell.date]} theme={theme} />
        ))}
      </div>
    </div>
  )
}
