import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { GridCell } from '../model/calendar'
import type { DayEntry } from '../model/types'
import { getTheme } from '../theme/themes'
import { DayCell } from './DayCell'

// DayCell.test.ts는 dateNumberColor/splitCellText 같은 순수 함수만 다뤄서
// .ts로 충분했다. 이 파일은 JSX로 실제로 그려 봐야 하는 렌더링 테스트라
// .tsx로 분리한다.

const theme = getTheme('white')
const cell: GridCell = { date: '2026-08-03', day: 3, dow: 1, inMonth: true }
const entry = (icon: string | undefined): DayEntry => ({
  text: '', dateColor: null, cellFill: null, marker: null, icon,
})

describe('DayCell 아이콘 렌더링', () => {
  it('icon이 있으면 이미지를 정확히 하나 그린다', () => {
    const { container } = render(
      createElement(DayCell, { cell, entry: entry('star'), theme, bgOpacity: 1, textColor: theme.bodyText }),
    )
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('icon이 없으면 이미지를 그리지 않는다', () => {
    // 아이콘 기능이 들어오기 전과 똑같이, 이미지가 하나도 없어야 한다.
    const { container } = render(
      createElement(DayCell, { cell, entry: entry(undefined), theme, bgOpacity: 1, textColor: theme.bodyText }),
    )
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('모르는 id면 깨진 이미지 대신 아무것도 그리지 않는다', () => {
    const { container } = render(
      createElement(DayCell, { cell, entry: entry('없는아이콘'), theme, bgOpacity: 1, textColor: theme.bodyText }),
    )
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })
})
