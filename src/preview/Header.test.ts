import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import type { HeaderConfig } from '../model/types'
import { headerTitleText } from './Header'

const header = (patch: Partial<HeaderConfig> = {}): HeaderConfig => ({
  ...createEmptyDoc(2026, 8).header,
  ...patch,
})

describe('headerTitleText', () => {
  it('auto 모드는 영문 월 이름을 쓴다', () => {
    expect(headerTitleText(header({ titleMode: 'auto' }), 8)).toBe('AUGUST')
    expect(headerTitleText(header({ titleMode: 'auto' }), 5)).toBe('MAY')
  })

  it('custom 모드는 입력한 제목을 쓴다', () => {
    expect(headerTitleText(header({ titleMode: 'custom', customTitle: '몬몬 8월 스케줄' }), 8))
      .toBe('몬몬 8월 스케줄')
  })

  it('custom인데 비어 있으면 영문 월 이름으로 되돌아간다', () => {
    expect(headerTitleText(header({ titleMode: 'custom', customTitle: '' }), 8)).toBe('AUGUST')
    expect(headerTitleText(header({ titleMode: 'custom', customTitle: '   ' }), 8)).toBe('AUGUST')
  })

  it('custom 제목의 앞뒤 공백을 다듬는다', () => {
    expect(headerTitleText(header({ titleMode: 'custom', customTitle: '  제목  ' }), 8))
      .toBe('제목')
  })

  it('auto 모드는 customTitle이 있어도 무시한다', () => {
    expect(headerTitleText(header({ titleMode: 'auto', customTitle: '무시됨' }), 8)).toBe('AUGUST')
  })
})
