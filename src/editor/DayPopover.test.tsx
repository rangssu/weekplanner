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
})
