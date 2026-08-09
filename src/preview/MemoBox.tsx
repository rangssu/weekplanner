import type { Theme } from '../theme/themes'
import { BORDER_WIDTH } from './layout'

export type MemoBoxProps = {
  text: string
  theme: Theme
}

const MEMO_WIDTH = 620
const MEMO_BODY_HEIGHT = 190
const MEMO_LINE_COUNT = 4
const MEMO_LINE_GAP = MEMO_BODY_HEIGHT / MEMO_LINE_COUNT

export function MemoBox({ text, theme }: MemoBoxProps) {
  return (
    <div style={{ width: MEMO_WIDTH, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 38, fontWeight: 800, color: theme.headerText }}>MEMO</div>
      <div style={{ position: 'relative', height: MEMO_BODY_HEIGHT }}>
        {Array.from({ length: MEMO_LINE_COUNT }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (i + 1) * MEMO_LINE_GAP - BORDER_WIDTH,
              height: BORDER_WIDTH,
              background: theme.borderColor,
            }}
          />
        ))}
        <div
          style={{
            fontSize: 30,
            lineHeight: `${MEMO_LINE_GAP}px`,
            color: theme.bodyText,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden',
            height: MEMO_BODY_HEIGHT,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}
