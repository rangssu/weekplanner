import { BOX_DEFAULTS, GOAL_LINE_COUNT, type HeaderConfig, type TodoItem } from '../model/types'
import { MAX_TODO_ITEMS } from '../preview/Sidebar'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type HeaderEditorProps = {
  api: ScheduleDocApi
}

const checkboxRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 12,
  fontSize: 13,
} as const

export function HeaderEditor({ api }: HeaderEditorProps) {
  const { doc, setDoc } = api
  const { header } = doc

  const patchHeader = (patch: Partial<HeaderConfig>) =>
    setDoc((prev) => ({ ...prev, header: { ...prev.header, ...patch } }))

  const patchTodoItems = (items: TodoItem[]) => patchHeader({ todo: { ...header.todo, items } })

  const itemAt = (index: number): TodoItem => header.todo.items[index] ?? { text: '', checked: false }
  const setItemAt = (index: number, patch: Partial<TodoItem>) => {
    const items = Array.from({ length: MAX_TODO_ITEMS }, (_, i) => itemAt(i))
    items[index] = { ...items[index], ...patch }
    patchTodoItems(items)
  }

  return (
    <>
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>제목</h2>

        <label style={fieldLabelStyle} htmlFor="title-mode">왼쪽 큰 제목</label>
        <select
          id="title-mode"
          style={inputStyle}
          value={header.titleMode}
          onChange={(e) => patchHeader({ titleMode: e.target.value as 'auto' | 'custom' })}
        >
          <option value="auto">자동 ({doc.month}월)</option>
          <option value="custom">직접 입력</option>
        </select>

        {header.titleMode === 'custom' && (
          <input
            style={{ ...inputStyle, marginTop: 6 }}
            value={header.customTitle}
            placeholder="예: 몬몬 8월 스케줄"
            onChange={(e) => patchHeader({ customTitle: e.target.value })}
          />
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>목표 상자</h2>
        <label style={{ ...checkboxRowStyle, marginTop: 0 }}>
          <input
            type="checkbox"
            checked={header.goals.enabled}
            onChange={(e) => patchHeader({ goals: { ...header.goals, enabled: e.target.checked } })}
          />
          표시
        </label>
        {header.goals.enabled && (
          <>
            <label style={{ ...fieldLabelStyle, marginTop: 8 }} htmlFor="goals-label">제목</label>
            <input
              id="goals-label"
              style={inputStyle}
              value={header.goals.label}
              placeholder={BOX_DEFAULTS.goals.label}
              onChange={(e) =>
                patchHeader({ goals: { ...header.goals, label: e.target.value } })
              }
            />
            <label style={{ ...fieldLabelStyle, marginTop: 6 }} htmlFor="goals-badge">배지</label>
            <input
              id="goals-badge"
              style={inputStyle}
              value={header.goals.badge}
              placeholder="비우면 배지가 사라집니다"
              onChange={(e) =>
                patchHeader({ goals: { ...header.goals, badge: e.target.value } })
              }
            />
          </>
        )}
        {header.goals.enabled &&
          Array.from({ length: GOAL_LINE_COUNT }, (_, index) => (
            <input
              key={index}
              style={{ ...inputStyle, marginTop: 6 }}
              value={header.goals.lines[index] ?? ''}
              placeholder={`목표 ${index + 1}`}
              onChange={(e) =>
                patchHeader({
                  goals: {
                    ...header.goals,
                    lines: header.goals.lines.map((line, i) =>
                      i === index ? e.target.value : line,
                    ),
                  },
                })
              }
            />
          ))}
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>할 일 상자</h2>
        <label style={{ ...checkboxRowStyle, marginTop: 0 }}>
          <input
            type="checkbox"
            checked={header.todo.enabled}
            onChange={(e) => patchHeader({ todo: { ...header.todo, enabled: e.target.checked } })}
          />
          표시
        </label>
        {header.todo.enabled && (
          <>
            <label style={{ ...fieldLabelStyle, marginTop: 8 }} htmlFor="todo-label">제목</label>
            <input
              id="todo-label"
              style={inputStyle}
              value={header.todo.label}
              placeholder={BOX_DEFAULTS.todo.label}
              onChange={(e) =>
                patchHeader({ todo: { ...header.todo, label: e.target.value } })
              }
            />
            <label style={{ ...fieldLabelStyle, marginTop: 6 }} htmlFor="todo-badge">배지</label>
            <input
              id="todo-badge"
              style={inputStyle}
              value={header.todo.badge}
              placeholder="비우면 배지가 사라집니다"
              onChange={(e) =>
                patchHeader({ todo: { ...header.todo, badge: e.target.value } })
              }
            />
            {Array.from({ length: MAX_TODO_ITEMS }, (_, index) => (
              <div
                key={index}
                style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}
              >
                <input
                  type="checkbox"
                  checked={itemAt(index).checked}
                  onChange={(e) => setItemAt(index, { checked: e.target.checked })}
                />
                <input
                  style={inputStyle}
                  value={itemAt(index).text}
                  placeholder={`할 일 ${index + 1}`}
                  onChange={(e) => setItemAt(index, { text: e.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              style={{ ...buttonStyle, marginTop: 8 }}
              onClick={() => patchTodoItems([])}
            >
              전부 비우기
            </button>
          </>
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>메모 상자</h2>
        <label style={{ ...checkboxRowStyle, marginTop: 0 }}>
          <input
            type="checkbox"
            checked={header.memo.enabled}
            onChange={(e) =>
              patchHeader({ memo: { ...header.memo, enabled: e.target.checked } })
            }
          />
          표시
        </label>
        {header.memo.enabled && (
          <>
            <label style={{ ...fieldLabelStyle, marginTop: 8 }} htmlFor="memo-label">제목</label>
            <input
              id="memo-label"
              style={inputStyle}
              value={header.memo.label}
              placeholder={BOX_DEFAULTS.memo.label}
              onChange={(e) =>
                patchHeader({ memo: { ...header.memo, label: e.target.value } })
              }
            />
            <label style={{ ...fieldLabelStyle, marginTop: 6 }} htmlFor="memo-badge">배지</label>
            <input
              id="memo-badge"
              style={inputStyle}
              value={header.memo.badge}
              placeholder="비우면 배지가 사라집니다"
              onChange={(e) =>
                patchHeader({ memo: { ...header.memo, badge: e.target.value } })
              }
            />
          </>
        )}
        {header.memo.enabled && (
          <textarea
            style={{ ...inputStyle, minHeight: 72, marginTop: 6, resize: 'none' }}
            value={header.memo.text}
            placeholder="자유롭게 적어주세요"
            onChange={(e) =>
              patchHeader({ memo: { ...header.memo, text: e.target.value } })
            }
          />
        )}
      </section>
    </>
  )
}
