import { memo, useCallback, useState } from 'react'
import { buildMonthGrid } from '../model/calendar'
import type { DayEntry } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { getTheme, type Theme } from '../theme/themes'
import { DAY_ICONS, getDayIcon } from '../theme/dayIcons'
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

type IconPickerProps = {
  /** 스크린리더가 31개의 동일한 "고르기" 버튼을 구별할 수 있게 하는 값 */
  date: string
  value: string | undefined
  isOpen: boolean
  onToggle: () => void
  onChange: (iconId: string | undefined) => void
}

/**
 * 아이콘 아홉 개를 접이식 3x3 그리드로 고른다.
 *
 * 예전에는 지우기 버튼 + 아이콘 아홉 개를 한 줄에 늘어놓았는데, 28px로는
 * 그림이 서로 잘 구별되지 않고 ~300px 패널 폭에 열 개가 다 안 들어가
 * 두 줄로 줄바꿈됐다. 이 컴포넌트는 접힌 상태(현재 고른 아이콘 미리보기 한 줄)와
 * 펼친 상태(46px 그리드)를 나눠서, 평소엔 한 줄만 차지하고 고를 때만 커지게 한다.
 *
 * 고르거나 지우면 곧바로 접는다 — 펼친 채로 두면 하루치 편집 블록이 31번
 * 반복되는 패널에서 다른 날짜의 그리드까지 계속 스크롤에 끼어 있게 되므로,
 * 고르는 순간이 곧 "다 봤다"는 신호로 보고 접는다.
 */
function IconPicker({ date, value, isOpen, onToggle, onChange }: IconPickerProps) {
  const selected = getDayIcon(value)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8 }}>
      <span style={{ fontSize: 12, color: '#52525b', width: 56, flexShrink: 0, marginTop: 5 }}>
        아이콘
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={`${date} 아이콘 고르기`}
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%', boxSizing: 'border-box',
            padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
            border: '1px solid #d4d4d8', background: '#ffffff',
          }}
        >
          {selected ? (
            <img
              src={selected.src}
              alt=""
              style={{ width: 24, height: 24, display: 'block', flexShrink: 0 }}
            />
          ) : (
            <span
              aria-hidden="true"
              style={{
                width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                border: '1px dashed #d4d4d8', background: '#fafafa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: '#a1a1aa',
              }}
            >
              없음
            </span>
          )}
          <span style={{ fontSize: 13, flex: 1, textAlign: 'left', color: '#18181b' }}>
            {selected ? selected.label : '고르기'}
          </span>
          <span aria-hidden="true" style={{ fontSize: 10, color: '#71717a' }}>▾</span>
        </button>
        {isOpen && (
          <div style={{ marginTop: 4 }}>
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
                  <img
                    src={icon.src}
                    alt=""
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  />
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
        )}
      </div>
    </div>
  )
}

type DayBlockProps = {
  date: string
  day: number
  dow: number
  entry: DayEntry | undefined
  theme: Theme
  isIconPickerOpen: boolean
  onPatch: (date: string, next: Partial<DayEntry>) => void
  onToggleIconPicker: (date: string) => void
  onIconChange: (date: string, iconId: string | undefined) => void
}

/**
 * 하루치 편집 블록. React.memo로 감싼 이유: 부모(DayEditor)는 아이콘
 * 그리드 열림 상태를 자기 state로 들고 있는데, 그 state가 바뀔 때마다
 * DayEditor 함수 전체가 다시 실행된다. memo가 없으면 31일치 블록이 전부
 * 다시 그려진다 — 정작 바뀐 건 열렸다/닫힌 날짜 한둘뿐인데도. props를
 * (date, day, dow 같은 원시값 / doc.days[date]·theme 같은 안정적 참조 /
 * useCallback으로 고정한 콜백)으로만 구성해서, 관련 없는 날짜는 isOpen이
 * false→false로 그대로라 얕은 비교에서 걸러진다.
 */
const DayBlock = memo(function DayBlock({
  date, day, dow, entry, theme, isIconPickerOpen, onPatch, onToggleIconPicker, onIconChange,
}: DayBlockProps) {
  return (
    <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 10 }}>
      <label style={fieldLabelStyle} htmlFor={`day-${date}`}>
        {day}일 ({DOW_KO[dow]})
      </label>
      <textarea
        id={`day-${date}`}
        style={{ ...inputStyle, minHeight: 52, resize: 'none' }}
        value={entry?.text ?? ''}
        placeholder="일정을 적어주세요"
        onChange={(e) => onPatch(date, { text: e.target.value })}
      />
      {isLikelyOverflowing(entry?.text ?? '', entry?.extra) && (
        <p style={{ fontSize: 12, color: '#c0392b', margin: '4px 0 0' }}>
          글자가 너무 많아 칸에서 잘릴 수 있습니다.
        </p>
      )}
      <label style={{ ...fieldLabelStyle, marginTop: 8 }} htmlFor={`extra-${date}`}>
        추가 문구
      </label>
      <input
        id={`extra-${date}`}
        type="text"
        style={inputStyle}
        value={entry?.extra ?? ''}
        placeholder="예) 12h"
        onChange={(e) => onPatch(date, { extra: e.target.value })}
      />
      <IconPicker
        date={date}
        value={entry?.icon}
        isOpen={isIconPickerOpen}
        onToggle={() => onToggleIconPicker(date)}
        onChange={(iconId) => onIconChange(date, iconId)}
      />
      <SwatchRow
        label="칸 배경"
        colors={theme.accents}
        value={entry?.cellFill ?? null}
        onChange={(color) => onPatch(date, { cellFill: color })}
      />
      <SwatchRow
        label="형광펜"
        colors={theme.accents}
        value={entry?.marker ?? null}
        onChange={(color) => onPatch(date, { marker: color })}
      />
      <SwatchRow
        label="날짜 색"
        colors={[theme.sundayText, theme.saturdayText, ...theme.accents.slice(0, 4)]}
        value={entry?.dateColor ?? null}
        onChange={(color) => onPatch(date, { dateColor: color })}
      />
    </div>
  )
})

export function DayEditor({ api }: DayEditorProps) {
  const { doc, setDoc } = api
  const theme = getTheme(doc.themeId)
  const cells = buildMonthGrid(doc.year, doc.month).filter((c) => c.inMonth)

  // 한 번에 하나의 날짜만 아이콘 그리드를 펼친다. 31개 블록이 각자 열려
  // 있으면 패널이 감당 못 할 길이가 되므로, 새로 열면 이전 것을 밀어낸다.
  const [openIconPicker, setOpenIconPicker] = useState<string | null>(null)

  // setDoc(useScheduleDoc이 useCallback으로 고정해 준 값)에만 의존해야
  // patch 자체가 매 렌더마다 새로 만들어지지 않는다. DayBlock에 그대로
  // 넘기는 콜백이라 여기서 안 고정하면 memo가 무력화된다.
  const patch = useCallback(
    (date: string, next: Partial<DayEntry>) => setDoc((prev) => updateDay(prev, date, next)),
    [setDoc],
  )

  const handleToggleIconPicker = useCallback(
    (date: string) => setOpenIconPicker((prev) => (prev === date ? null : date)),
    [],
  )

  const handleIconChange = useCallback(
    (date: string, iconId: string | undefined) => {
      patch(date, { icon: iconId })
      setOpenIconPicker(null)
    },
    [patch],
  )

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>날짜별 일정</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {cells.map((cell) => (
          <DayBlock
            key={cell.date}
            date={cell.date}
            day={cell.day}
            dow={cell.dow}
            entry={doc.days[cell.date]}
            theme={theme}
            isIconPickerOpen={openIconPicker === cell.date}
            onPatch={patch}
            onToggleIconPicker={handleToggleIconPicker}
            onIconChange={handleIconChange}
          />
        ))}
      </div>
    </section>
  )
}
