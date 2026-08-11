import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import type { ScheduleDoc } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { SelectedDayEditor } from './SelectedDayEditor'

function makeApi(doc: ScheduleDoc, setDoc: ScheduleDocApi['setDoc'] = () => {}): ScheduleDocApi {
  return {
    doc,
    setDoc,
    goToMonth: () => {},
    copyFromPreviousMonth: () => 'no-source',
    saveError: null,
  }
}

const noop = () => {}

describe('SelectedDayEditor', () => {
  it('고른 날짜의 요일을 제목에 보여준다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    // 2026-08-08은 토요일이다.
    expect(screen.getByText('8일 (토)')).toBeTruthy()
  })

  it('저장된 일정을 입력칸에 채운다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.days['2026-08-08'] = {
      text: '합방 21시', dateColor: null, cellFill: null, marker: null,
    }
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    expect(screen.getByDisplayValue('합방 21시')).toBeTruthy()
  })

  it('일정을 입력하면 그 날짜만 바뀐 문서를 만든다', () => {
    const doc = createEmptyDoc(2026, 8)
    const setDoc = vi.fn()
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc, setDoc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    fireEvent.change(screen.getByLabelText('일정'), { target: { value: '게임 방송' } })

    expect(setDoc).toHaveBeenCalledTimes(1)
    const updater = setDoc.mock.calls[0][0] as (prev: ScheduleDoc) => ScheduleDoc
    expect(updater(doc).days['2026-08-08'].text).toBe('게임 방송')
  })

  it('아이콘 아홉 개가 접히지 않고 처음부터 보인다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    expect(screen.getAllByRole('button', { name: /^(별|게임|영화|합방|메모|그림|저챗|휴방|휴)$/ }))
      .toHaveLength(9)
  })

  it('다음 날 버튼을 누르면 다음 날짜를 고른다', () => {
    const doc = createEmptyDoc(2026, 8)
    const onSelect = vi.fn()
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect, onClose: noop,
    }))

    fireEvent.click(screen.getByRole('button', { name: '다음 날' }))

    expect(onSelect).toHaveBeenCalledWith('2026-08-09')
  })

  it('1일에서는 이전 날 버튼이 꺼져 있다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-01', onSelect: noop, onClose: noop,
    }))

    expect(screen.getByRole('button', { name: '이전 날' })).toHaveProperty('disabled', true)
  })

  it('말일에서는 다음 날 버튼이 꺼져 있다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-31', onSelect: noop, onClose: noop,
    }))

    expect(screen.getByRole('button', { name: '다음 날' })).toHaveProperty('disabled', true)
  })

  it('닫기 버튼을 누르면 onClose를 부른다', () => {
    const doc = createEmptyDoc(2026, 8)
    const onClose = vi.fn()
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose,
    }))

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('글자가 너무 많으면 경고를 띄운다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.days['2026-08-08'] = {
      text: '가'.repeat(200), dateColor: null, cellFill: null, marker: null,
    }
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    expect(screen.getByText('글자가 너무 많아 칸에서 잘릴 수 있습니다.')).toBeTruthy()
  })

  it('그 달에 없는 날짜를 주면 아무것도 안 그린다', () => {
    const doc = createEmptyDoc(2026, 8)
    const { container } = render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-09-01', onSelect: noop, onClose: noop,
    }))

    expect(container.firstChild).toBeNull()
  })
})
