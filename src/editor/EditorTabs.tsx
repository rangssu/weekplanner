export type EditorTabId = 'calendar' | 'decorate' | 'sidebar'

export const EDITOR_TABS: ReadonlyArray<{ id: EditorTabId; label: string }> = [
  { id: 'calendar', label: '달력' },
  { id: 'decorate', label: '꾸미기' },
  { id: 'sidebar', label: '사이드바' },
]

// 옛 이름을 그대로 쓰는 이유는 storage.ts의 DOC_KEY_PREFIX 주석에 있다.
export const TAB_STORAGE_KEY = 'weekplanner:editor-tab'

const isTabId = (value: string | null): value is EditorTabId =>
  EDITOR_TABS.some((tab) => tab.id === value)

/**
 * 마지막에 보던 탭. ScheduleDoc에 넣지 않는다 — 결과 이미지에 영향을 주지
 * 않는 편집기 상태라 문서에 들어가면 마이그레이션이 이 값을 알아야 한다.
 */
export function loadEditorTab(): EditorTabId {
  try {
    const raw = localStorage.getItem(TAB_STORAGE_KEY)
    return isTabId(raw) ? raw : 'calendar'
  } catch {
    return 'calendar'
  }
}

export function saveEditorTab(id: EditorTabId): void {
  try {
    localStorage.setItem(TAB_STORAGE_KEY, id)
  } catch {
    // 저장에 실패해도 이번 세션 동작에는 지장이 없다.
  }
}

export type EditorTabsProps = {
  value: EditorTabId
  onChange: (id: EditorTabId) => void
}

export function EditorTabs({ value, onChange }: EditorTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="편집 항목"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}
    >
      {EDITOR_TABS.map((tab) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
              fontWeight: selected ? 700 : 400,
              border: `1px solid ${selected ? '#18181b' : '#d4d4d8'}`,
              background: selected ? '#18181b' : '#ffffff',
              color: selected ? '#ffffff' : '#3f3f46',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
