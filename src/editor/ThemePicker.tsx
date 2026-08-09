import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { THEMES } from '../theme/themes'
import { sectionStyle, sectionTitleStyle } from './controls'

export type ThemePickerProps = {
  api: ScheduleDocApi
}

export function ThemePicker({ api }: ThemePickerProps) {
  const { doc, setDoc } = api

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>테마</h2>
      {/*
        열 수를 3으로 고정한다. flex-wrap으로 두면 패널 폭에 따라 4+1처럼
        갈려서, THEMES가 정해둔 파스텔/무채색 묶음이 한 줄에 섞인다.
      */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            aria-pressed={doc.themeId === theme.id}
            onClick={() => setDoc((prev) => ({ ...prev, themeId: theme.id }))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: 6,
              borderRadius: 8,
              cursor: 'pointer',
              background: '#ffffff',
              border: doc.themeId === theme.id ? '2px solid #18181b' : '1px solid #d4d4d8',
            }}
          >
            <span
              style={{
                width: 56,
                height: 32,
                borderRadius: 4,
                background: theme.pageBackground,
                border: `2px solid ${theme.borderColor}`,
              }}
            />
            <span style={{ fontSize: 12 }}>{theme.name}</span>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 8 }}>
        테마를 바꾸면 날짜별 강조에 고를 수 있는 색도 함께 바뀝니다.
      </p>
    </section>
  )
}
