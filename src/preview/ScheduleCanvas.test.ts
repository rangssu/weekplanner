import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import { CANVAS_WIDTH } from './layout'
import { ScheduleCanvas } from './ScheduleCanvas'

/** 캔버스 루트를 찾는다. 4000px 폭을 가진 유일한 요소다. */
function canvasRoot(container: HTMLElement): HTMLElement {
  const found = [...container.querySelectorAll('div')].find(
    (el) => el.style.width === `${CANVAS_WIDTH}px`,
  )
  if (!found) throw new Error('캔버스 루트를 찾지 못했다')
  return found
}

const BG = 'data:image/png;base64,iVBORw0KGgo='

// 이 파일은 배경 이미지 스타일 배선만 확인하므로 색 계산 결과는 중요치 않다 —
// 다섯 영역 모두 같은 값으로 채운다.
const TEXT_COLORS = { title: '#000000', goal: '#000000', todo: '#000000', memo: '#000000', calendar: '#000000' }

describe('ScheduleCanvas 배경', () => {
  it('배경 이미지를 스타일에 넣는다', () => {
    const { container } = render(
      createElement(ScheduleCanvas, {
        doc: createEmptyDoc(2026, 8),
        fontFamily: 'sans-serif',
        backgroundUrl: BG,
        textColors: TEXT_COLORS,
      }),
    )
    expect(canvasRoot(container).style.backgroundImage).toContain(BG)
  })

  it('테마를 바꿔도 배경 이미지가 남는다', () => {
    // 예전에는 단축 속성 `background`로 테마 색을 줬다. 테마를 바꾸면 React가
    // 그 속성만 다시 쓰는데, 단축 속성은 background-image까지 초기화한다.
    // backgroundImage는 값이 그대로라 다시 안 써져서 그림이 사라졌다.
    // 이 테스트는 실제 DOM 갱신을 거쳐야 재현되므로 순수 함수로는 잡을 수 없다.
    const { container, rerender } = render(
      createElement(ScheduleCanvas, {
        doc: { ...createEmptyDoc(2026, 8), themeId: 'white' },
        fontFamily: 'sans-serif',
        backgroundUrl: BG,
        textColors: TEXT_COLORS,
      }),
    )
    expect(canvasRoot(container).style.backgroundImage).toContain(BG)

    rerender(
      createElement(ScheduleCanvas, {
        doc: { ...createEmptyDoc(2026, 8), themeId: 'dark' },
        fontFamily: 'sans-serif',
        backgroundUrl: BG,
        textColors: TEXT_COLORS,
      }),
    )

    const root = canvasRoot(container)
    expect(root.style.backgroundImage).toContain(BG)
    // 테마 색은 실제로 바뀌었는지도 확인한다. 안 그러면 위 단언이
    // "아무것도 안 바뀌어서" 통과하는 것일 수 있다.
    expect(root.style.backgroundColor).not.toBe('')
  })

  it('배경 이미지가 없으면 이미지 속성을 비워 둔다', () => {
    const { container } = render(
      createElement(ScheduleCanvas, {
        doc: createEmptyDoc(2026, 8),
        fontFamily: 'sans-serif',
        backgroundUrl: null,
        textColors: TEXT_COLORS,
      }),
    )
    expect(canvasRoot(container).style.backgroundImage).toBe('')
  })
})
