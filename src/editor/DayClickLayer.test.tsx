import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DayClickLayer } from './DayClickLayer'

const base = { year: 2026, month: 8, scale: 0.3, selectedDate: null, onSelect: () => {} }

describe('DayClickLayer', () => {
  it('그 달 날짜만 누를 수 있는 버튼으로 그린다', () => {
    render(createElement(DayClickLayer, base))

    // 2026년 8월은 31일까지다. 앞뒤 달 칸은 버튼이 아니다.
    expect(screen.getAllByRole('button')).toHaveLength(31)
  })

  it('칸을 누르면 그 날짜로 onSelect를 부른다', () => {
    const onSelect = vi.fn()
    render(createElement(DayClickLayer, { ...base, onSelect }))

    fireEvent.click(screen.getByRole('button', { name: '2026-08-08 편집' }))

    expect(onSelect).toHaveBeenCalledWith('2026-08-08')
  })

  it('앞뒤 달 날짜는 버튼으로 그리지 않는다', () => {
    render(createElement(DayClickLayer, base))

    // 2026-08-01은 토요일이라 앞에 7월 26~31일이 놓인다.
    expect(screen.queryByRole('button', { name: '2026-07-31 편집' })).toBeNull()
  })

  it('고른 칸에만 표시가 붙는다', () => {
    render(createElement(DayClickLayer, { ...base, selectedDate: '2026-08-08' }))

    expect(screen.getByRole('button', { name: '2026-08-08 편집' }).className)
      .toContain('is-selected')
    expect(screen.getByRole('button', { name: '2026-08-09 편집' }).className)
      .not.toContain('is-selected')
  })

  it('배율을 아직 재지 못했으면 아무것도 안 그린다', () => {
    const { container } = render(createElement(DayClickLayer, { ...base, scale: 0 }))

    expect(container.firstChild).toBeNull()
  })
})
