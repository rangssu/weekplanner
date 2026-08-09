import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import type { HeaderConfig } from '../model/types'
import { TITLE_KO_SIZE, TITLE_ROW_HEIGHT } from './layout'
import { titleKoSize, titleText } from './TitleBar'

const header = (patch: Partial<HeaderConfig> = {}): HeaderConfig => ({
  ...createEmptyDoc(2026, 8).header,
  ...patch,
})

describe('titleText', () => {
  it('auto 모드는 "8월"처럼 한글 월 이름을 쓴다', () => {
    expect(titleText(header({ titleMode: 'auto' }), 8)).toBe('8월')
    expect(titleText(header({ titleMode: 'auto' }), 12)).toBe('12월')
  })

  it('custom 모드는 입력한 제목을 쓴다', () => {
    expect(titleText(header({ titleMode: 'custom', customTitle: '몬몬 8월 스케줄' }), 8))
      .toBe('몬몬 8월 스케줄')
  })

  it('custom인데 비어 있으면 한글 월 이름으로 되돌아간다', () => {
    expect(titleText(header({ titleMode: 'custom', customTitle: '' }), 8)).toBe('8월')
    expect(titleText(header({ titleMode: 'custom', customTitle: '   ' }), 8)).toBe('8월')
  })

  it('custom 제목의 앞뒤 공백을 다듬는다', () => {
    expect(titleText(header({ titleMode: 'custom', customTitle: '  제목  ' }), 8)).toBe('제목')
  })

  it('auto 모드는 customTitle이 있어도 무시한다', () => {
    expect(titleText(header({ titleMode: 'auto', customTitle: '무시됨' }), 8)).toBe('8월')
  })
})

describe('titleKoSize', () => {
  it('짧은 제목은 가장 큰 크기를 쓴다', () => {
    expect(titleKoSize('8월')).toBe(TITLE_KO_SIZE)
    expect(titleKoSize('12월')).toBe(TITLE_KO_SIZE)
  })

  it('길수록 작아지되 단조롭게 줄어든다', () => {
    const short = titleKoSize('8월')
    const mid = titleKoSize('몬몬 8월 스케줄')
    const long = titleKoSize('아주아주 긴 제목을 넣어보는 경우입니다')
    expect(short).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(long)
  })

  it('아무리 길어도 최소 크기 아래로는 내려가지 않는다', () => {
    // 더 줄이면 사이드바 본문 글자(54)와 비슷해져 제목의 위계가 무너진다.
    expect(titleKoSize('가'.repeat(200))).toBe(80)
  })

  it('가장 큰 제목도 제목 줄 높이 안에 들어간다', () => {
    expect(TITLE_KO_SIZE).toBeLessThanOrEqual(TITLE_ROW_HEIGHT)
  })
})
