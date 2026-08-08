import { describe, expect, it } from 'vitest'

describe('테스트 환경', () => {
  it('Vitest가 동작한다', () => {
    expect(1 + 1).toBe(2)
  })

  it('jsdom 환경이다', () => {
    expect(typeof document).toBe('object')
  })

  it('fake-indexeddb가 로드되어 있다', () => {
    expect(typeof indexedDB).toBe('object')
  })
})
