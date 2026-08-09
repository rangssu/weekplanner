import { MONTH_NAMES_EN } from '../model/calendar'
import type { HeaderConfig } from '../model/types'
import type { Theme } from '../theme/themes'
import { TITLE_EN_SIZE, TITLE_KO_SIZE, TITLE_ROW_HEIGHT } from './layout'

/**
 * 왼쪽에 크게 들어가는 제목.
 * custom 모드인데 내용이 비었으면 "8월"로 되돌아간다.
 * 그래야 제목이 통째로 사라지는 일이 없다.
 */
export function titleText(header: HeaderConfig, month: number): string {
  if (header.titleMode === 'custom') {
    const trimmed = header.customTitle.trim()
    if (trimmed.length > 0) return trimmed
  }
  return `${month}월`
}

export type TitleBarProps = {
  header: HeaderConfig
  month: number
  theme: Theme
}

export function TitleBar({ header, month, theme }: TitleBarProps) {
  const title = titleText(header, month)
  // 긴 커스텀 제목이 오른쪽 영문 월과 부딪히지 않게 줄인다.
  const koSize = title.length <= 6 ? TITLE_KO_SIZE : Math.round(TITLE_KO_SIZE * 0.68)

  return (
    <div
      style={{
        height: TITLE_ROW_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 60,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: koSize,
          fontWeight: 900,
          lineHeight: 1,
          color: theme.headerText,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>

      {header.showEnglishMonth && (
        <div
          style={{
            fontSize: TITLE_EN_SIZE,
            fontWeight: 400,
            letterSpacing: 2,
            lineHeight: 1,
            color: theme.headerText,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {MONTH_NAMES_EN[month - 1]}
        </div>
      )}
    </div>
  )
}
