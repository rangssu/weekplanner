import { afterEach, describe, expect, it, vi } from 'vitest'
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

/**
 * jsdom은 Image의 load/error를 아예 쏘지 않아 measureRegions의 본체
 * (canvas에 그리고 getImageData로 읽는 부분)에 영영 도달하지 못한다.
 * 로딩만 성공했다고 답하는 최소 가짜로 그 문을 연다.
 */
class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 200
  naturalHeight = 200
  width = 200
  height = 200
  set src(_value: string) {
    queueMicrotask(() => this.onload?.())
  }
}

function whiteImageData(w: number, h: number) {
  const data = new Uint8ClampedArray(w * h * 4).fill(255)
  return { data, width: w, height: h } as unknown as ImageData
}

describe('measureRegions — Image를 가짜로 갈아끼운 실제 경로', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const twoRegions = {
    title: { x: 0, y: 0, width: 100, height: 100 },
    body: { x: 200, y: 200, width: 300, height: 150 },
  }

  it('2D 컨텍스트를 못 얻으면 null이다', async () => {
    vi.stubGlobal('Image', FakeImage)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    expect(await measureRegions('data:image/png;base64,AAAA', region, 20)).toBeNull()
  })

  it('흰 이미지의 밝기가 255에 가깝다', async () => {
    vi.stubGlobal('Image', FakeImage)
    const fakeContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => whiteImageData(w, h)),
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeContext as unknown as CanvasRenderingContext2D,
    )

    const result = await measureRegions('data:image/png;base64,AAAA', twoRegions, 20)

    expect(result).not.toBeNull()
    expect(result?.title).toBeCloseTo(255, 0)
    expect(result?.body).toBeCloseTo(255, 0)
    expect(fakeContext.getImageData).toHaveBeenCalledTimes(2)
  })

  it('getImageData가 던지면 null로 떨어진다', async () => {
    vi.stubGlobal('Image', FakeImage)
    const fakeContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => {
        throw new Error('디코딩 실패')
      }),
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeContext as unknown as CanvasRenderingContext2D,
    )

    const result = await measureRegions('data:image/png;base64,AAAA', twoRegions, 20)

    expect(result).toBeNull()
  })
})
