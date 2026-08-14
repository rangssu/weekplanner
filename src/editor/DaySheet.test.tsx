import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DaySheet } from './DaySheet'

function renderSheet(overrides: Record<string, unknown> = {}) {
  const props = {
    onClose: () => {},
    children: createElement('button', null, '삭제'),
    ...overrides,
  }
  return render(createElement(DaySheet, props))
}

describe('DaySheet', () => {
  it('Esc를 누르면 닫는다', () => {
    const onClose = vi.fn()
    renderSheet({ onClose })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('열리면 안쪽 첫 컨트롤로 포커스를 옮긴다', () => {
    renderSheet()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: '삭제' }))
  })

  it('닫히면 열기 전에 포커스가 있던 곳으로 되돌린다', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const { unmount } = renderSheet()
    // 포커스가 실제로 안으로 들어갔는지 먼저 못 박는다. 이게 없으면 포커스가
    // 아예 안 옮겨졌을 때도 opener가 그대로라 테스트가 거짓으로 통과한다.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '삭제' }))

    unmount()

    expect(document.activeElement).toBe(opener)
    opener.remove()
  })
})
