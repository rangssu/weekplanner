import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DayPopover, POPOVER_WIDTH } from './DayPopover'

const anchor = { x: 100, y: 200, width: 170, height: 100 }

function renderPopover(overrides: Record<string, unknown> = {}) {
  const props = {
    anchor,
    placement: { horizontal: 'right', vertical: 'below' } as const,
    containerWidth: 1200,
    containerHeight: 675,
    onClose: () => {},
    children: createElement('p', null, '내용'),
    ...overrides,
  }
  return render(createElement(DayPopover, props))
}

describe('DayPopover', () => {
  it('폭이 320px이다', () => {
    expect(POPOVER_WIDTH).toBe(320)
  })

  it('아래로 펼치면 칸 아래에 놓인다', () => {
    renderPopover()
    const box = screen.getByRole('dialog')
    expect(box.style.top).toBe(`${anchor.y + anchor.height + 8}px`)
    expect(box.style.bottom).toBe('')
  })

  it('위로 뒤집으면 bottom으로 잡는다', () => {
    renderPopover({ placement: { horizontal: 'right', vertical: 'above' } })
    const box = screen.getByRole('dialog')
    expect(box.style.bottom).toBe(`${675 - anchor.y + 8}px`)
    expect(box.style.top).toBe('')
  })

  it('왼쪽으로 뒤집으면 칸 왼쪽에 붙는다', () => {
    renderPopover({
      anchor: { x: 900, y: 200, width: 170, height: 100 },
      placement: { horizontal: 'left', vertical: 'below' },
    })
    expect(screen.getByRole('dialog').style.left).toBe(`${900 - POPOVER_WIDTH - 8}px`)
  })

  it('오른쪽으로 넘치면 화면 안으로 민다', () => {
    renderPopover({
      anchor: { x: 1000, y: 200, width: 170, height: 100 },
      placement: { horizontal: 'right', vertical: 'below' },
    })
    expect(screen.getByRole('dialog').style.left).toBe(`${1200 - POPOVER_WIDTH - 8}px`)
  })

  it('Esc를 누르면 닫는다', () => {
    const onClose = vi.fn()
    renderPopover({ onClose })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('바깥을 누르면 닫는다', () => {
    const onClose = vi.fn()
    renderPopover({ onClose })

    fireEvent.pointerDown(document.body)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('안을 누르면 닫지 않는다', () => {
    const onClose = vi.fn()
    renderPopover({ onClose })

    fireEvent.pointerDown(screen.getByText('내용'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('날짜 칸 버튼을 누른 것은 바깥 클릭으로 치지 않는다', () => {
    const onClose = vi.fn()
    // 칸 버튼과 같은 클래스를 가진 요소를 팝오버 바깥에 둔다.
    const cell = document.createElement('button')
    cell.className = 'wp-day-hit'
    document.body.appendChild(cell)

    renderPopover({ onClose })
    fireEvent.pointerDown(cell)

    expect(onClose).not.toHaveBeenCalled()
    cell.remove()
  })

  it('컨테이너가 낮으면 팝오버가 세로 범위 안에 머문다', () => {
    renderPopover({
      anchor: { x: 100, y: 400, width: 170, height: 100 },
      placement: { horizontal: 'right', vertical: 'below' },
      containerHeight: 495,
    })
    const box = screen.getByRole('dialog')
    // 내용이 넘치면 안에서 스크롤한다.
    expect(box.style.overflowY).toBe('auto')
    expect(parseFloat(box.style.maxHeight)).toBeLessThanOrEqual(495)
  })
})
