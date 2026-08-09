import { MONTH_NAMES_EN } from '../model/calendar'
import type { HeaderConfig } from '../model/types'
import type { Theme } from '../theme/themes'
import { HEADER_HEIGHT } from './layout'
import { MemoBox } from './MemoBox'
import { TodoBox } from './TodoBox'

/**
 * 표시할 제목 문자열을 정한다.
 * custom 모드인데 내용이 비었으면 영문 월 이름으로 되돌아간다.
 * 그래야 제목이 통째로 사라지는 일이 없다.
 */
export function headerTitleText(header: HeaderConfig, month: number): string {
  if (header.titleMode === 'custom') {
    const trimmed = header.customTitle.trim()
    if (trimmed.length > 0) return trimmed
  }
  return MONTH_NAMES_EN[month - 1]
}

export type HeaderProps = {
  header: HeaderConfig
  year: number
  month: number
  theme: Theme
}

export function Header({ header, year, month, theme }: HeaderProps) {
  const title = headerTitleText(header, month)
  const titleSize = title.length <= 10 ? 170 : 110

  return (
    <div
      style={{
        height: HEADER_HEIGHT,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 60,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {header.showYearMonth && (
          <div style={{ fontSize: 44, fontWeight: 600, color: theme.headerText, lineHeight: 1.2 }}>
            {year}.{String(month).padStart(2, '0')}
          </div>
        )}
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1.05,
            color: theme.headerText,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 60, alignItems: 'flex-start', flexShrink: 0 }}>
        {header.memo.enabled && <MemoBox text={header.memo.text} theme={theme} />}
        {header.todo.enabled && <TodoBox items={header.todo.items} theme={theme} />}
      </div>
    </div>
  )
}
