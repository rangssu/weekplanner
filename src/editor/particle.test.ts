import { describe, expect, it } from 'vitest'
import { objectParticle } from './particle'

describe('objectParticle', () => {
  it('받침이 있으면 을이다', () => {
    expect(objectParticle('그림')).toBe('을')
    expect(objectParticle('사진')).toBe('을')
  })

  it('받침이 없으면 를이다', () => {
    expect(objectParticle('폰트')).toBe('를')
    expect(objectParticle('스티커')).toBe('를')
  })

  it('받침이 ㅇ이어도 받침으로 센다', () => {
    // (last - 0xAC00) % 28 === 0만 받침 없음이다. ㅇ은 0이 아니다.
    expect(objectParticle('배경')).toBe('을')
  })

  it('한글이 아닌 글자로 끝나면 를로 둔다', () => {
    // 파일 이름을 그대로 넣는 경우가 생기면 최소한 문장이 되게 한다.
    expect(objectParticle('star.png')).toBe('를')
    expect(objectParticle('')).toBe('를')
  })
})
