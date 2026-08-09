import type { TodoItem } from '../model/types'
import type { Theme } from '../theme/themes'
import { BORDER_WIDTH } from './layout'

export type TodoBoxProps = {
  items: TodoItem[]
  theme: Theme
}

export function TodoBox({ items, theme }: TodoBoxProps) {
  return (
    <div
      style={{
        width: 900,
        height: 240,
        border: `${BORDER_WIDTH}px solid ${theme.borderColor}`,
        padding: 24,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 800, color: theme.headerText, marginBottom: 12 }}>
        To Do List
      </div>
      {items.map((item, index) => (
        <div
          key={index}
          style={{ display: 'flex', alignItems: 'center', gap: 14, height: 46, fontSize: 28 }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              border: `${BORDER_WIDTH - 2}px solid ${theme.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              lineHeight: 1,
              flexShrink: 0,
              color: theme.bodyText,
            }}
          >
            {item.checked ? 'V' : ''}
          </span>
          <span
            style={{
              color: theme.bodyText,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.text}
          </span>
        </div>
      ))}
    </div>
  )
}
