import { createEmptyTextColors } from '../model/defaults'
import { themeTextColor } from '../model/textColors'
import { TEXT_COLOR_AREAS, type TextColorArea } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { getTheme } from '../theme/themes'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

const AREA_LABELS: Record<TextColorArea, string> = {
  title: '제목',
  goal: '목표 상자',
  todo: '할 일 상자',
  memo: '메모 상자',
  calendar: '달력',
}

/**
 * 5영역을 한 자리에 모아 놓는다.
 *
 * 목표·할 일·메모가 「사이드바」 탭과 관련이 깊지만 여기 둔다 — 5영역을
 * 서로 비교하면서 정하는 일이라 흩어 놓으면 탭을 오가야 한다.
 */
export function TextColorPicker({ api }: { api: ScheduleDocApi }) {
  const { doc, setDoc } = api
  const theme = getTheme(doc.themeId)
  const settings = doc.textColors ?? createEmptyTextColors()

  const setArea = (area: TextColorArea, color: string | null) => {
    setDoc((prev) => {
      const base = prev.textColors ?? createEmptyTextColors()
      return {
        ...prev,
        textColors: {
          ...base,
          [area]: color === null
            ? { mode: 'auto' as const, color: null }
            : { mode: 'manual' as const, color },
        },
      }
    })
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>글자색</h2>
      <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 10px' }}>
        자동은 배경 이미지 밝기에 맞춰 고릅니다. 배경 이미지가 없으면 테마 색을 씁니다.
      </p>

      {TEXT_COLOR_AREAS.map((area) => {
        const setting = settings[area]
        const isAuto = setting.mode !== 'manual' || setting.color === null
        const shown = isAuto ? themeTextColor(area, theme) : setting.color!

        return (
          <div
            key={area}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}
          >
            <span style={{ fontSize: 13, width: 72, flexShrink: 0 }}>{AREA_LABELS[area]}</span>
            <input
              type="color"
              aria-label={`${AREA_LABELS[area]} 글자색`}
              value={shown}
              onChange={(e) => setArea(area, e.target.value)}
              style={{
                width: 34, height: 28, padding: 0, border: '1px solid #d4d4d8',
                borderRadius: 5, background: '#ffffff', cursor: 'pointer',
                transition: 'background-color 150ms linear',
              }}
            />
            <span style={{ fontSize: 12, color: isAuto ? '#16a34a' : '#71717a' }}>
              {isAuto ? '자동' : '직접'}
            </span>
            <button
              type="button"
              aria-label={`${AREA_LABELS[area]} 자동으로 되돌리기`}
              disabled={isAuto}
              onClick={() => setArea(area, null)}
              style={{ ...buttonStyle, fontSize: 12, marginLeft: 'auto', opacity: isAuto ? 0.4 : 1 }}
            >
              자동으로
            </button>
          </div>
        )
      })}
    </section>
  )
}
