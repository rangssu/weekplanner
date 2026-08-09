import type { ReactNode } from 'react'
import type { Theme } from '../theme/themes'
import {
  BORDER_WIDTH, BOX_BADGE_SIZE, BOX_HEADER_HEIGHT, BOX_LABEL_KO_SIZE, BOX_PADDING,
} from './layout'

export type SidebarBoxProps = {
  /** 왼쪽 한글 제목 */
  label: string
  /** 오른쪽 회색 배지에 들어갈 영문 */
  badge: string
  height: number
  theme: Theme
  children: ReactNode
}

/**
 * 사이드바의 박스 하나.
 * 위쪽 제목 행(한글 제목 + 영문 배지)과 아래쪽 본문으로 나뉜다.
 * 세 박스가 모두 같은 꼴이라 여기서 한 번만 정의한다.
 */
export function SidebarBox({ label, badge, height, theme, children }: SidebarBoxProps) {
  return (
    <div
      style={{
        height,
        border: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: theme.cellBackground,
      }}
    >
      <div
        style={{
          height: BOX_HEADER_HEIGHT,
          flexShrink: 0,
          borderBottom: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${BOX_PADDING}px`,
          gap: 20,
        }}
      >
        <span
          style={{
            fontSize: BOX_LABEL_KO_SIZE,
            fontWeight: 800,
            color: theme.bodyText,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: BOX_BADGE_SIZE,
            fontWeight: 900,
            letterSpacing: 0.5,
            color: theme.bodyText,
            background: theme.dowHeaderBackground,
            padding: '6px 14px',
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </span>
      </div>

      <div style={{ flex: 1, padding: BOX_PADDING, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}
