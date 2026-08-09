import { useState } from 'react'
import { MONTH_NAMES_EN } from '../model/calendar'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type MonthPickerProps = {
  api: ScheduleDocApi
}

const YEAR_MIN = 2020
const YEAR_MAX = 2040

export function MonthPicker({ api }: MonthPickerProps) {
  const { doc, goToMonth, copyFromPreviousMonth } = api
  const [notice, setNotice] = useState('')

  const years = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i)

  const handleCopy = () => {
    const outcome = copyFromPreviousMonth()
    setNotice(
      outcome === 'ok' ? '지난달 내용을 가져왔습니다.' : '지난달에 저장된 내용이 없습니다.',
    )
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>년 · 월</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={fieldLabelStyle} htmlFor="year-select">년</label>
          <select
            id="year-select"
            style={inputStyle}
            value={doc.year}
            onChange={(e) => goToMonth(Number(e.target.value), doc.month)}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={fieldLabelStyle} htmlFor="month-select">월</label>
          <select
            id="month-select"
            style={inputStyle}
            value={doc.month}
            onChange={(e) => goToMonth(doc.year, Number(e.target.value))}
          >
            {MONTH_NAMES_EN.map((name, index) => (
              <option key={name} value={index + 1}>{index + 1}월</option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" style={buttonStyle} onClick={handleCopy}>
        지난달 내용 가져오기
      </button>
      {notice && <p style={{ fontSize: 12, color: '#52525b', marginTop: 8 }}>{notice}</p>}
    </section>
  )
}
