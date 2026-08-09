import type { TodoItem } from '../model/types'
import type { Theme } from '../theme/themes'
import { BORDER_WIDTH, TODO_LABEL_SIZE, TODO_TEXT_SIZE } from './layout'

export type TodoBoxProps = {
  items: TodoItem[]
  theme: Theme
}

const TODO_WIDTH = 900
const TODO_HEIGHT = 300
const TODO_ROW_HEIGHT = 46
const TODO_CHECKBOX_SIZE = 32

/**
 * 상자 안에 온전히 보이는 항목 수. 헤더 높이(330)에 맞춰 정한 값이다.
 * 편집 폼도 이 수를 상한으로 쓰므로, 넣을 수는 있는데 안 보이는 일이 없다.
 */
export const MAX_TODO_ITEMS = 4

export function TodoBox({ items, theme }: TodoBoxProps) {
  return (
    <div
      style={{
        width: TODO_WIDTH,
        height: TODO_HEIGHT,
        border: `${BORDER_WIDTH}px solid ${theme.borderColor}`,
        padding: 24,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: TODO_LABEL_SIZE,
          fontWeight: 800,
          color: theme.headerText,
          marginBottom: 12,
        }}
      >
        To Do List
      </div>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            height: TODO_ROW_HEIGHT,
            fontSize: TODO_TEXT_SIZE,
          }}
        >
          <span
            style={{
              width: TODO_CHECKBOX_SIZE,
              height: TODO_CHECKBOX_SIZE,
              border: `${BORDER_WIDTH - 2}px solid ${theme.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: TODO_TEXT_SIZE - 6,
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
