import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import { BOX_DEFAULTS, type HeaderConfig } from '../model/types'
import { getTheme } from '../theme/themes'
import { boxLabel, Sidebar } from './Sidebar'

const header = (patch: Partial<HeaderConfig> = {}): HeaderConfig => ({
  ...createEmptyDoc(2026, 8).header,
  ...patch,
})
const theme = getTheme('white')

describe('boxLabel', () => {
  it('제목이 있으면 그대로 쓴다', () => {
    expect(boxLabel('방송 목표', BOX_DEFAULTS.goals.label)).toBe('방송 목표')
  })

  it('비어 있으면 기본값으로 되돌아간다', () => {
    expect(boxLabel('', BOX_DEFAULTS.goals.label)).toBe(BOX_DEFAULTS.goals.label)
  })

  it('공백만 있어도 되돌아간다', () => {
    expect(boxLabel('   ', BOX_DEFAULTS.todo.label)).toBe(BOX_DEFAULTS.todo.label)
  })

  it('앞뒤에 공백이 붙은 제목은 다듬지 않고 그대로 쓴다', () => {
    // titleText(TitleBar.tsx)와 달리 여기서는 빈 값 판정에만 trim을 쓰고
    // 반환값 자체는 다듬지 않는다. 현재 구현이 실제로 그렇게 동작하므로 고정해둔다.
    expect(boxLabel('  방송 목표  ', BOX_DEFAULTS.goals.label)).toBe('  방송 목표  ')
  })

  it('세 박스의 기본값은 BOX_DEFAULTS와 같다', () => {
    expect(boxLabel('', BOX_DEFAULTS.goals.label)).toBe('이번 달의 목표')
    expect(boxLabel('', BOX_DEFAULTS.todo.label)).toBe('주요 할 일')
    expect(boxLabel('', BOX_DEFAULTS.memo.label)).toBe('메모')
  })
})

describe('Sidebar — 제목과 배지의 비대칭', () => {
  it('빈 제목은 기본값으로 되돌아가지만 빈 배지는 사라진 채로 남는다', () => {
    // 사용자가 명시적으로 요구한 비대칭이다: 제목이 없는 상자는 식별할 수 없으므로
    // boxLabel로 기본값을 채우지만, 배지는 비우면 "사라지는" 것 자체가 기능이라
    // Sidebar.tsx는 badge를 boxLabel에 통과시키지 않는다.
    //
    // 이 테스트는 실제 <Sidebar>를 렌더링해서 확인한다. 만약 나중에 누군가
    // Sidebar.tsx에서 badge={header.goals.badge}를
    // badge={boxLabel(header.goals.badge, BOX_DEFAULTS.goals.badge)}로 잘못 고치면,
    // 화면에 'GOALS'가 다시 나타나 아래 두 번째 assertion이 깨진다.
    render(
      createElement(Sidebar, {
        header: header({
          goals: { ...header().goals, label: '', badge: '' },
          todo: { ...header().todo, enabled: false },
          memo: { ...header().memo, enabled: false },
        }),
        theme,
        bgOpacity: 1,
        textColors: { goal: theme.bodyText, todo: theme.bodyText, memo: theme.bodyText },
      }),
    )

    // 제목은 폴백이 적용되어 기본 한글 제목이 보인다.
    expect(screen.getByText(BOX_DEFAULTS.goals.label)).toBeTruthy()
    // 배지는 폴백이 적용되지 않아 기본 영문 배지('GOALS')가 화면에 없어야 한다.
    expect(screen.queryByText(BOX_DEFAULTS.goals.badge)).toBeNull()
  })

  it('배지를 채우면 그 값 그대로 나온다 (폴백을 거치지 않는다)', () => {
    render(
      createElement(Sidebar, {
        header: header({
          goals: { ...header().goals, label: '방송 목표', badge: 'PLAN' },
          todo: { ...header().todo, enabled: false },
          memo: { ...header().memo, enabled: false },
        }),
        theme,
        bgOpacity: 1,
        textColors: { goal: theme.bodyText, todo: theme.bodyText, memo: theme.bodyText },
      }),
    )

    expect(screen.getByText('방송 목표')).toBeTruthy()
    expect(screen.getByText('PLAN')).toBeTruthy()
  })
})
