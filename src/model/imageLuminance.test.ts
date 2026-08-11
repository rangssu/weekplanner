import { describe, expect, it, vi } from 'vitest'
import { measureRegions } from './imageLuminance'

const region = { title: { x: 0, y: 0, width: 100, height: 100 } }

describe('measureRegions', () => {
  it('이미지를 못 읽으면 null을 준다', async () => {
    // jsdom은 이미지 디코딩을 하지 않아 onload가 오지 않는다.
    // 손상된 파일을 올린 것과 같은 경로다.
    // timeoutMs=20: 기본값(5000ms)을 쓰면 jsdom에서 load/error가 오지
    // 않아 테스트가 그 시간만큼 그대로 멈춘다.
    const result = await measureRegions('data:image/png;base64,보나마나틀린값', region, 20)
    expect(result).toBeNull()
  })

  it('빈 문자열이면 곧바로 null이다', async () => {
    expect(await measureRegions('', region, 20)).toBeNull()
  })

  it('getImageData가 던져도 null로 떨어진다', async () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const result = await measureRegions('data:image/png;base64,AAAA', region, 20)
    expect(result).toBeNull()
    spy.mockRestore()
  })
})
