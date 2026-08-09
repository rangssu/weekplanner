import { GOAL_LINE_COUNT, type HeaderConfig } from '../model/types'
import type { Theme } from '../theme/themes'
import {
  BORDER_WIDTH, BOX_CHECKBOX_SIZE, BOX_HINT_SIZE, BOX_TEXT_SIZE,
  GOALS_BOX_RATIO, MEMO_BOX_RATIO, SIDEBAR_HEIGHT, SIDEBAR_WIDTH, TODO_BOX_RATIO,
} from './layout'
import { SidebarBox } from './SidebarBox'

/** 비어 있을 때만 회색으로 보여주는 안내 문구 */
const GOALS_HINT = '한 달 동안 반드시 이뤄야 할 핵심 목표 2~3가지를 적는 칸입니다.'
const MEMO_HINT = '자유롭게 적어두는 칸입니다. 공지나 안내를 적어보세요.'

/** 상자에 온전히 보이는 할 일 개수 */
export const MAX_TODO_ITEMS = 5

function Hint({ text, theme }: { text: string; theme: Theme }) {
  return (
    <div style={{ fontSize: BOX_HINT_SIZE, color: theme.outsideMonthText, lineHeight: 1.4 }}>
      {text}
    </div>
  )
}

export type SidebarProps = {
  header: HeaderConfig
  theme: Theme
}

export function Sidebar({ header, theme }: SidebarProps) {
  const enabled = [header.goals.enabled, header.todo.enabled, header.memo.enabled]
  const shownCount = enabled.filter(Boolean).length
  // 켜진 박스끼리 세로 공간을 나눠 갖는다. 하나만 켜면 그것이 다 쓴다.
  const ratios = [GOALS_BOX_RATIO, TODO_BOX_RATIO, MEMO_BOX_RATIO]
  const shownRatioSum = ratios.reduce((sum, r, i) => sum + (enabled[i] ? r : 0), 0)
  const heightOf = (index: number) =>
    shownRatioSum === 0 ? 0 : Math.floor((SIDEBAR_HEIGHT * ratios[index]) / shownRatioSum)

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
        <SidebarBox label="이번 달의 목표" badge="GOALS" height={heightOf(0)} theme={theme}>
          {!hasGoalText && <Hint text={GOALS_HINT} theme={theme} />}
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
                  color: theme.bodyText,
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
        <SidebarBox label="주요 할 일" badge="TO-DO LIST" height={heightOf(1)} theme={theme}>
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
                      color: theme.bodyText,
                    }}
                  >
                    {item?.checked ? 'V' : ''}
                  </span>
                  <span
                    style={{
                      fontSize: BOX_TEXT_SIZE,
                      color: theme.bodyText,
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
        <SidebarBox label="메모" badge="MEMO" height={heightOf(2)} theme={theme}>
          {header.memo.text.trim() === '' ? (
            <Hint text={MEMO_HINT} theme={theme} />
          ) : (
            <div
              style={{
                fontSize: BOX_TEXT_SIZE,
                color: theme.bodyText,
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
