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

  it('열리면 안쪽 첫 컨트롤로 포커스를 옮긴다', () => {
    // role="dialog"는 "열리면 포커스가 안으로 들어온다"를 함의한다. 안 옮기면
    // 팝오버가 DOM상 날짜 칸 버튼 31개 뒤에 있어, 키보드로는 남은 칸을 모두
    // 지나야 폼에 닿는다.
    renderPopover({ children: createElement('button', null, '삭제') })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '삭제' }))
  })

  it('닫히면 열기 전에 포커스가 있던 곳으로 되돌린다', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const { unmount } = renderPopover({ children: createElement('button', null, '삭제') })
    // 포커스가 실제로 안으로 들어갔는지 먼저 못 박는다. 이게 없으면 포커스가
    // 아예 안 옮겨졌을 때도 opener가 그대로라 테스트가 거짓으로 통과한다.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '삭제' }))

    unmount()

    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('포커스가 이미 바깥으로 나갔으면 닫힐 때 도로 뺏지 않는다', () => {
    // 마우스로 바깥 컨트롤을 눌러 닫는 경우다. 여기서 되돌리면 방금 누른
    // 컨트롤에서 포커스가 달력으로 튕겨 나간다.
    const opener = document.createElement('button')
    const outside = document.createElement('button')
    document.body.append(opener, outside)
    opener.focus()

    const { unmount } = renderPopover({ children: createElement('button', null, '삭제') })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '삭제' }))

    outside.focus()
    unmount()

    expect(document.activeElement).toBe(outside)
    opener.remove()
    outside.remove()
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
