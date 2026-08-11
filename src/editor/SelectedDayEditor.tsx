import { useCallback } from 'react'
import { shiftDateWithinMonth } from '../model/calendar'
import type { DayEntry } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { DAY_ICONS } from '../theme/dayIcons'
import { getTheme, type Theme } from '../theme/themes'
import { fieldLabelStyle, inputStyle, isLikelyOverflowing, updateDay } from './controls'

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

type IconGridProps = {
  value: string | undefined
  onChange: (iconId: string | undefined) => void
}

/**
 * 아이콘 아홉 개를 3×3 그리드로 고른다. **접지 않는다.**
 *
 * 예전에는 접이식이었다. 하루치 편집 블록이 31번 반복되는 패널에서 여러
 * 날짜의 그리드가 동시에 펼쳐지면 감당 못 할 길이가 됐기 때문이다.
 * 한 날짜만 그리게 된 지금은 그 이유가 없어져, 접는 만큼 클릭만 늘어난다.
 */
function IconGrid({ value, onChange }: IconGridProps) {
  return (
    <div style={{ marginTop: 8 }}>
      <span style={{ ...fieldLabelStyle, marginBottom: 4 }}>아이콘</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gap: 4 }}>
        {DAY_ICONS.map((icon) => (
          <button
            key={icon.id}
            type="button"
            aria-label={icon.label}
            aria-pressed={value === icon.id}
            title={icon.label}
            onClick={() => onChange(icon.id)}
            style={{
              width: 46, height: 46, borderRadius: 4, cursor: 'pointer', padding: 3,
              border: value === icon.id ? '2px solid #18181b' : '1px solid #d4d4d8',
              background: '#ffffff',
            }}
          >
            <img src={icon.src} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange(undefined)}
        style={{
          marginTop: 4, width: '100%', padding: '5px 8px', borderRadius: 4,
          cursor: 'pointer', border: '1px solid #d4d4d8', background: '#fafafa',
          fontSize: 12, color: '#3f3f46',
        }}
      >
        아이콘 없애기
      </button>
    </div>
  )
}

const navButtonStyle = {
  width: 26, height: 26, borderRadius: 5, cursor: 'pointer',
  border: '1px solid #d4d4d8', background: '#ffffff', fontSize: 13,
  lineHeight: 1, padding: 0, marginLeft: 4,
} as const

export type SelectedDayEditorProps = {
  api: ScheduleDocApi
  /** "2026-08-08" */
  date: string
  onSelect: (date: string) => void
  onClose: () => void
}

/**
 * 고른 날짜 하나를 편집한다. 껍데기(팝오버/바텀시트)는 밖에서 씌운다.
 *
 * 예전 DayEditor는 이 폼을 31번 반복해 그렸고, 그 때문에 React.memo와
 * useCallback 고정, 아이콘 그리드 열림 상태 관리가 필요했다. 한 날짜만
 * 그리게 되면서 전부 없앴다.
 */
export function SelectedDayEditor({ api, date, onSelect, onClose }: SelectedDayEditorProps) {
  const { doc, setDoc } = api

  const patch = useCallback(
    (next: Partial<DayEntry>) => setDoc((prev) => updateDay(prev, date, next)),
    [setDoc, date],
  )

  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  // 문서가 담고 있는 달 밖의 날짜는 편집 대상이 아니다.
  if (!parsed || Number(parsed[1]) !== doc.year || Number(parsed[2]) !== doc.month) return null

  const theme: Theme = getTheme(doc.themeId)
  const entry = doc.days[date]
  const day = Number(parsed[3])
  const dow = new Date(doc.year, doc.month - 1, day).getDay()
  const prevDate = shiftDateWithinMonth(date, -1)
  const nextDate = shiftDateWithinMonth(date, 1)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 15 }}>{day}일 ({DOW_KO[dow]})</strong>
        <span style={{ marginLeft: 'auto' }}>
          <button
            type="button" aria-label="이전 날" style={navButtonStyle}
            disabled={prevDate === null}
            onClick={() => prevDate && onSelect(prevDate)}
          >
            ‹
          </button>
          <button
            type="button" aria-label="다음 날" style={navButtonStyle}
            disabled={nextDate === null}
            onClick={() => nextDate && onSelect(nextDate)}
          >
            ›
          </button>
          <button type="button" aria-label="닫기" style={navButtonStyle} onClick={onClose}>
            ✕
          </button>
        </span>
      </div>

      <label style={fieldLabelStyle} htmlFor={`day-${date}`}>일정</label>
      <textarea
        id={`day-${date}`}
        style={{ ...inputStyle, minHeight: 52, resize: 'none' }}
        value={entry?.text ?? ''}
        placeholder="일정을 적어주세요"
        onChange={(e) => patch({ text: e.target.value })}
      />
      {isLikelyOverflowing(entry?.text ?? '', entry?.extra) && (
        <p style={{ fontSize: 12, color: '#c0392b', margin: '4px 0 0' }}>
          글자가 너무 많아 칸에서 잘릴 수 있습니다.
        </p>
      )}

      <label style={{ ...fieldLabelStyle, marginTop: 8 }} htmlFor={`extra-${date}`}>추가 문구</label>
      <input
        id={`extra-${date}`}
        type="text"
        style={inputStyle}
        value={entry?.extra ?? ''}
        placeholder="예) 12h"
        onChange={(e) => patch({ extra: e.target.value })}
      />

      <IconGrid value={entry?.icon} onChange={(iconId) => patch({ icon: iconId })} />

      <SwatchRow
        label="칸 배경" colors={theme.accents} value={entry?.cellFill ?? null}
        onChange={(color) => patch({ cellFill: color })}
      />
      <SwatchRow
        label="형광펜" colors={theme.accents} value={entry?.marker ?? null}
        onChange={(color) => patch({ marker: color })}
      />
      <SwatchRow
        label="날짜 색"
        colors={[theme.sundayText, theme.saturdayText, ...theme.accents.slice(0, 4)]}
        value={entry?.dateColor ?? null}
        onChange={(color) => patch({ dateColor: color })}
      />
    </div>
  )
}
