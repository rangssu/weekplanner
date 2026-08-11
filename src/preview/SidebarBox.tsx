import type { ReactNode } from 'react'
import { withAlpha, type Theme } from '../theme/themes'
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
  /** 박스·배지 배경 불투명도. */
  bgOpacity: number
  /** 상자 라벨·배지 글자색. App이 계산해 넘긴다. 배지 배경도 bgOpacity로 함께
   * 투명해지므로(theme.dowHeaderBackground에 withAlpha) 고정색으로 두면
   * 불투명도가 낮을 때 배경과 함께 흐려져 안 보인다. */
  textColor: string
  children: ReactNode
}

/**
 * 사이드바의 박스 하나.
 * 위쪽 제목 행(한글 제목 + 영문 배지)과 아래쪽 본문으로 나뉜다.
 * 세 박스가 모두 같은 꼴이라 여기서 한 번만 정의한다.
 */
export function SidebarBox({
  label, badge, height, theme, bgOpacity, textColor, children,
}: SidebarBoxProps) {
  return (
    <div
      style={{
        height,
        border: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: withAlpha(theme.cellBackground, bgOpacity),
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
            color: textColor,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        {badge.trim() !== '' && (
          <span
            style={{
              fontSize: BOX_BADGE_SIZE,
              fontWeight: 900,
              letterSpacing: 0.5,
              color: textColor,
              background: withAlpha(theme.dowHeaderBackground, bgOpacity),
              padding: '6px 14px',
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div style={{ flex: 1, padding: BOX_PADDING, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}
