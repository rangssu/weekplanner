import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import type { ScheduleDoc } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { DayEditor } from './DayEditor'

/**
 * DayEditor는 setDoc(updater)로만 문서를 바꾼다. 실제 훅(useScheduleDoc)은
 * 로컬 저장까지 하지만 이 테스트는 그리기/펼치기 동작만 확인하면 되므로,
 * 상태를 들고 있다가 setDoc이 오면 그 결과로 다시 렌더하는 최소 스텁이면 충분하다.
 */
function makeApi(doc: ScheduleDoc): ScheduleDocApi {
  return {
    doc,
    setDoc: () => {},
    goToMonth: () => {},
    copyFromPreviousMonth: () => 'no-source',
    saveError: null,
  }
}

// DayEditor는 한 달 31일치 블록(입력 두 개 + 아이콘 고르기 + 스와치 세 줄)을
// 통째로 그린다. jsdom에서 이 렌더링 자체가 느려서, 다른 테스트 파일과 함께
// 병렬로 돌 때 기본 5000ms 제한에 걸릴 수 있다. 컴포넌트를 쪼개는 문제가
// 아니라 순수 렌더링 비용이므로 테스트 타임아웃만 넉넉히 늘린다.
const RENDER_TIMEOUT = 20000

describe('DayEditor 아이콘 고르기', () => {
  it('처음에는 3x3 그리드가 문서에 없다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(DayEditor, { api: makeApi(doc) }))

    // 그리드에만 나오는 "아이콘 없애기" 버튼이 아직 없어야 한다.
    expect(screen.queryByText('아이콘 없애기')).toBeNull()
  }, RENDER_TIMEOUT)

  it('하루의 토글을 누르면 아이콘 아홉 개가 나타난다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(DayEditor, { api: makeApi(doc) }))

    fireEvent.click(screen.getByRole('button', { name: '2026-08-01 아이콘 고르기' }))

    expect(screen.queryByText('아이콘 없애기')).not.toBeNull()
    // DAY_ICONS 아홉 개가 label로 걸려 있는지 개수로 확인한다.
    expect(screen.getAllByRole('button', { name: /^(별|게임|영화|합방|메모|그림|저챗|휴방|휴)$/ }))
      .toHaveLength(9)
  }, RENDER_TIMEOUT)

  it('아이콘을 고르면 그리드가 다시 접힌다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(DayEditor, { api: makeApi(doc) }))

    fireEvent.click(screen.getByRole('button', { name: '2026-08-01 아이콘 고르기' }))
    fireEvent.click(screen.getByRole('button', { name: '별' }))

    expect(screen.queryByText('아이콘 없애기')).toBeNull()
  }, RENDER_TIMEOUT)
})
