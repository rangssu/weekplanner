import type { HeaderConfig } from '../model/types'
import type { Theme } from '../theme/themes'
import { TITLE_KO_SIZE_STEPS, TITLE_ROW_HEIGHT } from './layout'

/** 제목 길이에 따른 글자 크기. 단계가 완만해야 남는 여백이 튀지 않는다. */
export function titleKoSize(title: string): number {
  return TITLE_KO_SIZE_STEPS.find((step) => title.length <= step.maxLength)!.size
}

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
  const koSize = titleKoSize(title)

  return (
    <div
      style={{
        height: TITLE_ROW_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        // 세로 중앙 정렬. 아래쪽 정렬로 두면 제목이 작아질 때 남는 공간이
        // 전부 위로 몰려 위쪽 여백만 도드라진다.
        alignItems: 'center',
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
    </div>
  )
}
