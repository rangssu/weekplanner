import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EDITOR_TABS, EditorTabs, TAB_STORAGE_KEY, loadEditorTab, saveEditorTab,
} from './EditorTabs'

beforeEach(() => {
  localStorage.clear()
})

describe('EditorTabs', () => {
  it('탭이 달력·꾸미기·사이드바 셋이다', () => {
    expect(EDITOR_TABS.map((tab) => tab.label)).toEqual(['달력', '꾸미기', '사이드바'])
  })

  it('고른 탭을 눌린 상태로 표시한다', () => {
    render(createElement(EditorTabs, { value: 'decorate', onChange: () => {} }))

    expect(screen.getByRole('tab', { name: '꾸미기' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: '달력' }).getAttribute('aria-selected')).toBe('false')
  })

  it('다른 탭을 누르면 onChange를 부른다', () => {
    const onChange = vi.fn()
    render(createElement(EditorTabs, { value: 'calendar', onChange }))

    fireEvent.click(screen.getByRole('tab', { name: '사이드바' }))

    expect(onChange).toHaveBeenCalledWith('sidebar')
  })
})

describe('탭 저장', () => {
  it('저장한 탭을 다시 읽는다', () => {
    saveEditorTab('sidebar')
    expect(loadEditorTab()).toBe('sidebar')
  })

  it('저장된 것이 없으면 달력 탭이다', () => {
    expect(loadEditorTab()).toBe('calendar')
  })

  it('모르는 값이 들어 있으면 달력 탭으로 떨어진다', () => {
    localStorage.setItem(TAB_STORAGE_KEY, 'nonsense')
    expect(loadEditorTab()).toBe('calendar')
  })
})
