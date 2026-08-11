import { toPng } from 'html-to-image'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'
import { EXPORT_SIZES, exportFileName, exportSchedule, type ExportSizeKey } from './exportImage'

// exportImage.ts가 `import { toPng } from 'html-to-image'`라는 명명 임포트를 쓰기 때문에
// 네임스페이스 객체가 없어 vi.spyOn을 걸 수 없다. 모듈 전체를 목으로 바꾼다.
vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
}))

const mockToPng = vi.mocked(toPng)

beforeEach(() => {
  mockToPng.mockReset()
})

describe('EXPORT_SIZES', () => {
  it('네 가지 크기를 제공한다', () => {
    expect(Object.keys(EXPORT_SIZES).sort()).toEqual(['4k', 'fhd', 'hd', 'original'])
  })

  it('원본은 캔버스 크기와 정확히 같다', () => {
    expect(EXPORT_SIZES.original.width).toBe(CANVAS_WIDTH)
    expect(EXPORT_SIZES.original.height).toBe(CANVAS_HEIGHT)
  })

  it('스펙에 적힌 크기와 일치한다', () => {
    expect(EXPORT_SIZES.original).toMatchObject({ width: 4000, height: 2250 })
    expect(EXPORT_SIZES['4k']).toMatchObject({ width: 3840, height: 2160 })
    expect(EXPORT_SIZES.fhd).toMatchObject({ width: 1920, height: 1080 })
    expect(EXPORT_SIZES.hd).toMatchObject({ width: 1280, height: 720 })
  })

  it('전부 16:9다', () => {
    for (const size of Object.values(EXPORT_SIZES)) {
      expect(size.width / size.height).toBeCloseTo(16 / 9, 10)
    }
  })

  it('모두 이름과 파일명 접미사를 갖는다', () => {
    for (const size of Object.values(EXPORT_SIZES)) {
      expect(size.label.length).toBeGreaterThan(0)
      expect(size.suffix.length).toBeGreaterThan(0)
    }
  })
})

describe('exportFileName', () => {
  it('년-월과 크기 이름을 담는다', () => {
    expect(exportFileName(2026, 8, 'original')).toBe('2026-08_스케줄_원본.png')
    expect(exportFileName(2026, 8, '4k')).toBe('2026-08_스케줄_4K.png')
    expect(exportFileName(2026, 8, 'fhd')).toBe('2026-08_스케줄_FHD.png')
    expect(exportFileName(2026, 8, 'hd')).toBe('2026-08_스케줄_HD.png')
  })

  it('월을 두 자리로 채운다', () => {
    expect(exportFileName(2026, 3, 'hd')).toBe('2026-03_스케줄_HD.png')
  })

  it('모든 크기 키가 이름을 만든다', () => {
    for (const key of Object.keys(EXPORT_SIZES) as ExportSizeKey[]) {
      expect(exportFileName(2026, 8, key).endsWith('.png')).toBe(true)
    }
  })
})

describe('색 전환 끄기', () => {
  // exportSchedule은 toPng 뒤에 downscalePng(이미지 디코딩·캔버스 렌더링)와
  // 다운로드 트리거까지 실제로 돈다. jsdom에는 캔버스 백엔드가 없어
  // image.decode가 속성 자체가 없고, getContext는 null을 주고, toBlob·
  // URL.createObjectURL/revokeObjectURL은 "not implemented"로 던진다.
  // 실제로 픽셀을 그릴 필요는 없으니 이 지점들만 최소로 채워 통과시킨다.
  // decode는 원래 없던 속성이라 끝나면 delete로 지운다.
  type WithDecode = { decode?: () => Promise<void> }

  beforeEach(() => {
    ;(HTMLImageElement.prototype as WithDecode).decode = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['png']))
    })
    // jsdom에는 URL.createObjectURL/revokeObjectURL이 런타임에 아예 없어
    // vi.spyOn을 걸 대상이 없다. 타입 선언은 lib.dom.d.ts에 있으니 직접 채운다.
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    delete (HTMLImageElement.prototype as WithDecode).decode
    vi.restoreAllMocks()
  })

  it('캡처하는 동안 transition이 꺼져 있고 끝나면 되돌아온다', async () => {
    const node = document.createElement('div')
    node.style.transition = 'color 150ms linear'

    let duringCapture = ''
    mockToPng.mockImplementation(async () => {
      duringCapture = node.style.transition
      return 'data:image/png;base64,AAAA'
    })

    await exportSchedule(node, createEmptyDoc(2026, 8), 'original')

    expect(duringCapture).toBe('none')
    expect(node.style.transition).toBe('color 150ms linear')
  })

  it('캡처가 실패해도 transition을 되돌린다', async () => {
    const node = document.createElement('div')
    node.style.transition = 'color 150ms linear'

    mockToPng.mockRejectedValue(new Error('실패'))

    await expect(exportSchedule(node, createEmptyDoc(2026, 8), 'original')).rejects.toThrow()
    expect(node.style.transition).toBe('color 150ms linear')
  })
})
