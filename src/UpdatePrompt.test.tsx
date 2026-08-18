import { act, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UpdatePrompt, type RegisterUpdates } from './UpdatePrompt'

/**
 * 서비스 워커 등록을 흉내 낸다.
 *
 * 진짜 등록은 `virtual:pwa-register`에 있는데, 이건 빌드 때만 존재하는
 * 가상 모듈이라 테스트에서 불러올 수 없다. 그래서 컴포넌트는 등록 함수를
 * 주입받고, 여기서는 "새 버전 감지"를 손으로 일으킨다.
 */
function fakeRegister() {
  const update = vi.fn()
  let notify: (() => void) | null = null
  const register: RegisterUpdates = (onNeedRefresh) => {
    notify = onNeedRefresh
    return update
  }
  return {
    register,
    update,
    /** 새 버전이 배포된 상황 */
    detectNewVersion: () => act(() => notify?.()),
  }
}

describe('UpdatePrompt', () => {
  it('새 버전이 없으면 아무것도 보이지 않는다', () => {
    const { register } = fakeRegister()

    const { container } = render(createElement(UpdatePrompt, { register }))

    expect(container.innerHTML).toBe('')
  })

  it('새 버전이 감지되면 안내와 새로고침 버튼을 보여준다', () => {
    const { register, detectNewVersion } = fakeRegister()
    render(createElement(UpdatePrompt, { register }))

    detectNewVersion()

    expect(screen.getByText('새 버전이 있습니다.')).toBeTruthy()
    expect(screen.getByRole('button', { name: '새로고침' })).toBeTruthy()
  })

  it('새로고침을 눌러야만 갱신한다', () => {
    const { register, update, detectNewVersion } = fakeRegister()
    render(createElement(UpdatePrompt, { register }))

    detectNewVersion()
    expect(update).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '새로고침' }))

    expect(update).toHaveBeenCalledTimes(1)
  })

  it('닫으면 배너가 사라지고 갱신하지 않는다', () => {
    const { register, update, detectNewVersion } = fakeRegister()
    const { container } = render(createElement(UpdatePrompt, { register }))
    detectNewVersion()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(container.innerHTML).toBe('')
    expect(update).not.toHaveBeenCalled()
  })
})
