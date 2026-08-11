import { BOX_DEFAULTS, GOAL_LINE_COUNT, type HeaderConfig } from '../model/types'
import { withAlpha, type Theme } from '../theme/themes'
import {
  BORDER_WIDTH, BOX_CHECKBOX_SIZE, BOX_HINT_SIZE, BOX_TEXT_SIZE,
  sidebarBoxRects, SIDEBAR_HEIGHT, SIDEBAR_WIDTH,
} from './layout'
import { SidebarBox } from './SidebarBox'

/** 비어 있을 때만 회색으로 보여주는 안내 문구 */
const GOALS_HINT = '한 달 동안 반드시 이뤄야 할 핵심 목표 2~3가지를 적는 칸입니다.'
const MEMO_HINT = '자유롭게 적어두는 칸입니다. 공지나 안내를 적어보세요.'

/** 상자에 온전히 보이는 할 일 개수 */
export const MAX_TODO_ITEMS = 5

/**
 * 제목이 비면 기본값으로 되돌린다. 박스 제목이 없으면 상자를 식별할 수 없다.
 *
 * 배지에는 절대 쓰지 않는다 — 배지는 비우면 사라지는 게 요구사항이라 폴백이
 * 있으면 안 된다. export하는 이유도 이 비대칭을 테스트로 못박기 위함이다.
 */
export const boxLabel = (value: string, fallback: string): string =>
  value.trim() === '' ? fallback : value

/** 비어 있을 때 보이는 안내 문구. 상자가 비면 이것만 화면에 남으므로, 그
 * 영역의 자동 글자색을 흐리게 써서(0.55) 자동 글자색이 실제로 적용된 채로
 * 남게 한다 — 고정색이면 배경이 바뀌어도 힌트가 안 따라와 그 상자만 안
 * 읽히는 채로 남을 수 있다. */
function Hint({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ fontSize: BOX_HINT_SIZE, color: withAlpha(color, 0.55), lineHeight: 1.4 }}>
      {text}
    </div>
  )
}

export type SidebarProps = {
  header: HeaderConfig
  theme: Theme
  /** 사이드바 박스·배지 배경 불투명도. */
  bgOpacity: number
  /** 상자별 본문 글자색. App이 계산해 넘긴다. */
  textColors: { goal: string; todo: string; memo: string }
}

export function Sidebar({ header, theme, bgOpacity, textColors }: SidebarProps) {
  const enabled: [boolean, boolean, boolean] = [
    header.goals.enabled, header.todo.enabled, header.memo.enabled,
  ]
  const shownCount = enabled.filter(Boolean).length
  // 상자 높이는 layout.ts가 정한다. 배경 밝기를 재는 쪽과 같은 값을 써야
  // 재는 자리와 그리는 자리가 어긋나지 않는다.
  const rects = sidebarBoxRects(enabled)
  const heightOf = (index: number) => rects[index]?.height ?? 0

  if (shownCount === 0) return <div style={{ width: SIDEBAR_WIDTH, flexShrink: 0 }} />

  const goalLines = header.goals.lines.slice(0, GOAL_LINE_COUNT)
  const hasGoalText = goalLines.some((line) => line.trim() !== '')

  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        height: SIDEBAR_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {header.goals.enabled && (
        <SidebarBox
          label={boxLabel(header.goals.label, BOX_DEFAULTS.goals.label)}
          badge={header.goals.badge}
          height={heightOf(0)}
          theme={theme}
          bgOpacity={bgOpacity}
          textColor={textColors.goal}
        >
          {!hasGoalText && <Hint text={GOALS_HINT} color={textColors.goal} />}
          <div
            style={{
              marginTop: hasGoalText ? 0 : 34,
              display: 'flex',
              flexDirection: 'column',
              gap: 34,
            }}
          >
            {goalLines.map((line, index) => (
              <div
                key={index}
                style={{
                  borderBottom: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
                  paddingBottom: 10,
                  fontSize: BOX_TEXT_SIZE,
                  lineHeight: 1.2,
                  color: textColors.goal,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: BOX_TEXT_SIZE + 16,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </SidebarBox>
      )}

      {header.todo.enabled && (
        <SidebarBox
          label={boxLabel(header.todo.label, BOX_DEFAULTS.todo.label)}
          badge={header.todo.badge}
          height={heightOf(1)}
          theme={theme}
          bgOpacity={bgOpacity}
          textColor={textColors.todo}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: MAX_TODO_ITEMS }, (_, index) => {
              const item = header.todo.items[index]
              return (
                <div
                  key={index}
                  style={{ display: 'flex', alignItems: 'center', gap: 20, height: BOX_TEXT_SIZE + 8 }}
                >
                  <span
                    style={{
                      width: BOX_CHECKBOX_SIZE,
                      height: BOX_CHECKBOX_SIZE,
                      border: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: BOX_CHECKBOX_SIZE - 10,
                      lineHeight: 1,
                      flexShrink: 0,
                      color: textColors.todo,
                    }}
                  >
                    {item?.checked ? 'V' : ''}
                  </span>
                  <span
                    style={{
                      fontSize: BOX_TEXT_SIZE,
                      color: textColors.todo,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item?.text ?? ''}
                  </span>
                </div>
              )
            })}
          </div>
        </SidebarBox>
      )}

      {header.memo.enabled && (
        <SidebarBox
          label={boxLabel(header.memo.label, BOX_DEFAULTS.memo.label)}
          badge={header.memo.badge}
          height={heightOf(2)}
          theme={theme}
          bgOpacity={bgOpacity}
          textColor={textColors.memo}
        >
          {header.memo.text.trim() === '' ? (
            <Hint text={MEMO_HINT} color={textColors.memo} />
          ) : (
            <div
              style={{
                fontSize: BOX_TEXT_SIZE,
                color: textColors.memo,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {header.memo.text}
            </div>
          )}
        </SidebarBox>
      )}
    </div>
  )
}
