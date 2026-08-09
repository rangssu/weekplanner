import { buildMonthGrid } from '../model/calendar'
import type { DayEntry } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { getTheme } from '../theme/themes'
import {
  fieldLabelStyle, inputStyle, isLikelyOverflowing, sectionStyle, sectionTitleStyle, updateDay,
} from './controls'

export type DayEditorProps = {
  api: ScheduleDocApi
}

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

type SwatchRowProps = {
  label: string
  colors: string[]
  value: string | null
  onChange: (color: string | null) => void
}

function SwatchRow({ label, colors, value, onChange }: SwatchRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
      <span style={{ fontSize: 12, color: '#52525b', width: 56, flexShrink: 0 }}>{label}</span>
      <button
        type="button"
        aria-label={`${label} 없음`}
        title="강조 없음"
        onClick={() => onChange(null)}
        style={{
          width: 22, height: 22, borderRadius: 4, cursor: 'pointer',
          border: value === null ? '2px solid #18181b' : '1px solid #d4d4d8',
          background: '#ffffff', fontSize: 12, lineHeight: 1, padding: 0,
        }}
      >
        ×
      </button>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`${label} ${color}`}
          onClick={() => onChange(color)}
          style={{
            width: 22, height: 22, borderRadius: 4, cursor: 'pointer',
            border: value === color ? '2px solid #18181b' : '1px solid #d4d4d8',
            background: color, padding: 0,
          }}
        />
      ))}
    </div>
  )
}

export function DayEditor({ api }: DayEditorProps) {
  const { doc, setDoc } = api
  const theme = getTheme(doc.themeId)
  const cells = buildMonthGrid(doc.year, doc.month).filter((c) => c.inMonth)

  const patch = (date: string, next: Partial<DayEntry>) =>
    setDoc((prev) => updateDay(prev, date, next))

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>날짜별 일정</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {cells.map((cell) => {
          const entry = doc.days[cell.date]
          return (
            <div key={cell.date} style={{ borderTop: '1px solid #e4e4e7', paddingTop: 10 }}>
              <label style={fieldLabelStyle} htmlFor={`day-${cell.date}`}>
                {cell.day}일 ({DOW_KO[cell.dow]})
              </label>
              <textarea
                id={`day-${cell.date}`}
                style={{ ...inputStyle, minHeight: 52, resize: 'none' }}
                value={entry?.text ?? ''}
                placeholder="일정을 적어주세요"
                onChange={(e) => patch(cell.date, { text: e.target.value })}
              />
              {isLikelyOverflowing(entry?.text ?? '', entry?.extra) && (
                <p style={{ fontSize: 12, color: '#c0392b', margin: '4px 0 0' }}>
                  글자가 너무 많아 칸에서 잘릴 수 있습니다.
                </p>
              )}
              <label
                style={{ ...fieldLabelStyle, marginTop: 8 }}
                htmlFor={`extra-${cell.date}`}
              >
                추가 문구
              </label>
              <input
                id={`extra-${cell.date}`}
                type="text"
                style={inputStyle}
                value={entry?.extra ?? ''}
                placeholder="예) 12h"
                onChange={(e) => patch(cell.date, { extra: e.target.value })}
              />
              <SwatchRow
                label="칸 배경"
                colors={theme.accents}
                value={entry?.cellFill ?? null}
                onChange={(color) => patch(cell.date, { cellFill: color })}
              />
              <SwatchRow
                label="형광펜"
                colors={theme.accents}
                value={entry?.marker ?? null}
                onChange={(color) => patch(cell.date, { marker: color })}
              />
              <SwatchRow
                label="날짜 색"
                colors={[theme.sundayText, theme.saturdayText, ...theme.accents.slice(0, 4)]}
                value={entry?.dateColor ?? null}
                onChange={(color) => patch(cell.date, { dateColor: color })}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
