import type { CSSProperties } from 'react'
import { createEmptyDayEntry, isBlankDayEntry } from '../model/defaults'
import type { DayEntry, ScheduleDoc } from '../model/types'
import {
  CELL_TEXT_LINE_HEIGHT, CELL_TEXT_MIN_SIZE, CELL_TEXT_WIDTH, splitCellText,
} from '../preview/layout'

export const sectionStyle: CSSProperties = {
  border: '1px solid #d4d4d8',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  background: '#ffffff',
}

export const sectionTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 12,
  marginTop: 0,
}

export const fieldLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 4,
  color: '#3f3f46',
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #d4d4d8',
  borderRadius: 6,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

export const buttonStyle: CSSProperties = {
  padding: '6px 12px',
  border: '1px solid #d4d4d8',
  borderRadius: 6,
  background: '#fafafa',
  fontSize: 13,
  cursor: 'pointer',
}

/**
 * 하루 항목의 일부 필드를 바꾼 새 문서를 만든다.
 * 결과가 완전히 빈 항목이면 키 자체를 지운다. 저장 용량을 아끼고
 * "빈 문서인지" 판정을 단순하게 유지하기 위해서다.
 */
export function updateDay(
  doc: ScheduleDoc,
  date: string,
  patch: Partial<DayEntry>,
): ScheduleDoc {
  const next: DayEntry = { ...(doc.days[date] ?? createEmptyDayEntry()), ...patch }
  const days = { ...doc.days }
  if (isBlankDayEntry(next)) delete days[date]
  else days[date] = next
  return { ...doc, days }
}

/**
 * 최소 폰트 크기로도 칸을 넘칠 것 같은지 어림한다.
 *
 * 정확한 판정은 AutoFitText가 DOM을 재서 한다. 하지만 그 결과를 편집 폼으로
 * 끌어오려면 preview/가 editor/의 콜백을 받아야 해서 두 계층의 경계가 무너진다.
 * 경고는 "글자를 좀 줄이세요" 신호일 뿐 정밀할 필요가 없으므로,
 * 레이아웃 상수만으로 계산하는 어림값을 쓴다.
 *
 * 한글은 폰트 크기와 글자 폭이 거의 같으므로 한 줄에 들어가는 글자 수를
 * CELL_TEXT_WIDTH / CELL_TEXT_MIN_SIZE로 본다. 라틴 문자는 이보다 좁아
 * 실제로는 더 들어가지만, 경고가 조금 이르게 뜨는 쪽이 안전하다.
 *
 * extra(추가 문구)가 있으면 본문이 쓸 수 있는 높이가 splitCellText만큼
 * 줄어든다. 이걸 반영하지 않으면 추가 문구가 있는 칸에서 실제로는 잘리는
 * 5번째 줄을 경고 없이 넘겨버린다 — 경고가 늦게 뜨는 쪽이 위험하므로
 * 항상 splitCellText가 주는 실제 본문 높이를 기준으로 삼는다.
 */
export function isLikelyOverflowing(text: string, extra?: string): boolean {
  if (text.trim() === '') return false

  const { bodyHeight } = splitCellText(extra)
  const charsPerLine = Math.max(1, Math.floor(CELL_TEXT_WIDTH / CELL_TEXT_MIN_SIZE))
  const maxLines = Math.max(
    1,
    Math.floor(bodyHeight / (CELL_TEXT_MIN_SIZE * CELL_TEXT_LINE_HEIGHT)),
  )

  const usedLines = text
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)

  return usedLines > maxLines
}
