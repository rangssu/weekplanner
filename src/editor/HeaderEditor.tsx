import type { HeaderConfig, TodoItem } from '../model/types'
import { MAX_TODO_ITEMS } from '../preview/TodoBox'
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

  const patchTodoItems = (items: TodoItem[]) =>
    patchHeader({ todo: { ...header.todo, items } })

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>헤더</h2>

      <label style={fieldLabelStyle} htmlFor="title-mode">제목</label>
      <select
        id="title-mode"
        style={inputStyle}
        value={header.titleMode}
        onChange={(e) => patchHeader({ titleMode: e.target.value as 'auto' | 'custom' })}
      >
        <option value="auto">자동 (영문 월 이름)</option>
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

      <label style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={header.showYearMonth}
          onChange={(e) => patchHeader({ showYearMonth: e.target.checked })}
        />
        년·월 표기 ({doc.year}.{String(doc.month).padStart(2, '0')})
      </label>

      <label style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={header.memo.enabled}
          onChange={(e) => patchHeader({ memo: { ...header.memo, enabled: e.target.checked } })}
        />
        MEMO 표시
      </label>
      {header.memo.enabled && (
        <textarea
          style={{ ...inputStyle, minHeight: 64, marginTop: 6, resize: 'vertical' }}
          value={header.memo.text}
          placeholder="자유롭게 적어주세요"
          onChange={(e) => patchHeader({ memo: { ...header.memo, text: e.target.value } })}
        />
      )}

      <label style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={header.todo.enabled}
          onChange={(e) => patchHeader({ todo: { ...header.todo, enabled: e.target.checked } })}
        />
        To Do List 표시
      </label>
      {header.todo.enabled && (
        <div style={{ marginTop: 6 }}>
          {header.todo.items.map((item, index) => (
            <div
              key={index}
              style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) =>
                  patchTodoItems(
                    header.todo.items.map((it, i) =>
                      i === index ? { ...it, checked: e.target.checked } : it,
                    ),
                  )
                }
              />
              <input
                style={inputStyle}
                value={item.text}
                placeholder="할 일"
                onChange={(e) =>
                  patchTodoItems(
                    header.todo.items.map((it, i) =>
                      i === index ? { ...it, text: e.target.value } : it,
                    ),
                  )
                }
              />
              <button
                type="button"
                style={buttonStyle}
                onClick={() => patchTodoItems(header.todo.items.filter((_, i) => i !== index))}
              >
                삭제
              </button>
            </div>
          ))}
          {header.todo.items.length < MAX_TODO_ITEMS ? (
            <button
              type="button"
              style={{ ...buttonStyle, marginTop: 8 }}
              onClick={() => patchTodoItems([...header.todo.items, { text: '', checked: false }])}
            >
              항목 추가
            </button>
          ) : (
            <p style={{ fontSize: 12, color: '#71717a', marginTop: 8 }}>
              상자에 보이는 최대 개수({MAX_TODO_ITEMS}개)입니다.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
