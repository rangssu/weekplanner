import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import type { ResolvedTextColors } from '../model/textColors'
import type { ScheduleDoc } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { TextColorPicker } from './TextColorPicker'

function makeApi(doc: ScheduleDoc, setDoc: ScheduleDocApi['setDoc'] = () => {}): ScheduleDocApi {
  return { doc, setDoc, goToMonth: () => {}, copyFromPreviousMonth: () => 'no-source', saveError: null }
}

function makeResolved(color = '#000000'): ResolvedTextColors {
  return { title: color, goal: color, todo: color, memo: color, calendar: color }
}

describe('TextColorPicker', () => {
  it('자동일 때 테마 기본색이 아니라 지금 실제로 쓰이는 색을 보여준다', () => {
    // 어두운 사진 위에서는 자동이 흰 글자를 고른다. 견본이 테마 기본색(거의
    // 검정)을 보여주면, 사용자가 그 견본을 그대로 확정했을 때 어두운 사진 위에
    // 검정 글자가 박혀 글자가 사라진다.
    render(createElement(TextColorPicker, {
      api: makeApi(createEmptyDoc(2026, 8)),
      resolved: makeResolved('#ffffff'),
    }))

    expect((screen.getByLabelText('달력 글자색') as HTMLInputElement).value).toBe('#ffffff')
  })

  it('영역 다섯 개를 보여준다', () => {
    render(createElement(TextColorPicker, {
      api: makeApi(createEmptyDoc(2026, 8)), resolved: makeResolved(),
    }))

    for (const label of ['제목', '목표 상자', '할 일 상자', '메모 상자', '달력']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it('처음에는 전 영역이 자동이다', () => {
    render(createElement(TextColorPicker, {
      api: makeApi(createEmptyDoc(2026, 8)), resolved: makeResolved(),
    }))

    expect(screen.getAllByRole('button', { name: /자동으로 되돌리기$/ })
      .every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })

  it('색을 고르면 그 영역만 수동이 된다', () => {
    const doc = createEmptyDoc(2026, 8)
    const setDoc = vi.fn()
    render(createElement(TextColorPicker, { api: makeApi(doc, setDoc), resolved: makeResolved() }))

    fireEvent.change(screen.getByLabelText('달력 글자색'), { target: { value: '#123456' } })

    const updater = setDoc.mock.calls[0][0] as (prev: ScheduleDoc) => ScheduleDoc
    const next = updater(doc)
    expect(next.textColors!.calendar).toEqual({ mode: 'manual', color: '#123456' })
    expect(next.textColors!.memo.mode).toBe('auto')
  })

  it('자동으로 되돌리면 색이 지워진다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.textColors!.memo = { mode: 'manual', color: '#123456' }
    const setDoc = vi.fn()
    render(createElement(TextColorPicker, { api: makeApi(doc, setDoc), resolved: makeResolved() }))

    fireEvent.click(screen.getByRole('button', { name: '메모 상자 자동으로 되돌리기' }))

    const updater = setDoc.mock.calls[0][0] as (prev: ScheduleDoc) => ScheduleDoc
    expect(updater(doc).textColors!.memo).toEqual({ mode: 'auto', color: null })
  })
})
