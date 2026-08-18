import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'
import {
  EXPORT_SIZES,
  exportFileName,
  exportSchedule,
  needsDownscale,
  type ExportSizeKey,
} from './exportImage'

// 1×1 투명 PNG. renderCanvasPng가 실제로 그리는 일은 jsdom에서 불가능하다.
const STUB_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

vi.mock('html-to-image', () => ({ toPng: () => Promise.resolve(STUB_PNG) }))

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

describe('needsDownscale', () => {
  it('캔버스와 같은 크기는 다시 그리지 않는다', () => {
    expect(needsDownscale(CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(false)
  })

  it('더 작은 크기는 다시 그린다', () => {
    expect(needsDownscale(1920, 1080)).toBe(true)
  })

  it('한 변만 달라도 다시 그린다', () => {
    expect(needsDownscale(CANVAS_WIDTH, CANVAS_HEIGHT - 1)).toBe(true)
    expect(needsDownscale(CANVAS_WIDTH - 1, CANVAS_HEIGHT)).toBe(true)
  })

  it('원본만 건너뛰고 나머지 크기는 전부 다시 그린다', () => {
    const skipped = (Object.keys(EXPORT_SIZES) as ExportSizeKey[]).filter(
      (key) => !needsDownscale(EXPORT_SIZES[key].width, EXPORT_SIZES[key].height),
    )
    expect(skipped).toEqual(['original'])
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

/**
 * 내보내기 경로가 이미지를 다시 디코딩하는지만 본다.
 *
 * jsdom에는 2D 컨텍스트가 없어(canvas 패키지를 안 쓴다) `downscalePng`는
 * 첫 단계인 `new Image()` + `decode()`에서 이미 멈춘다. 그 `img` 생성이
 * 재인코딩 경로에 들어갔다는 신호이자, 실제로 메모리를 잡아먹는 단계다.
 * 결과 픽셀은 여전히 사람이 확인한다.
 */
describe('exportSchedule', () => {
  const createdTags: string[] = []

  beforeEach(() => {
    createdTags.length = 0
    const create = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      createdTags.push(tag)
      const el = create(tag)
      // 내려받기 링크를 실제로 누르면 jsdom이 "navigation not implemented"를 뱉는다.
      if (tag === 'a') el.click = () => {}
      return el
    })
    // jsdom에는 이 둘이 없다. spyOn이 아니라 직접 심어야 한다.
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: () => 'blob:test',
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('원본 크기는 이미지를 다시 디코딩하지 않는다', async () => {
    await exportSchedule(document.createElement('div'), createEmptyDoc(2026, 8), 'original')

    expect(createdTags).not.toContain('img')
    // 그래도 내려받기는 끝까지 간다.
    expect(createdTags).toContain('a')
  })

  it('축소 크기는 이미지를 다시 디코딩한다', async () => {
    // jsdom이 디코딩을 못 해 던지지만, 그 경로에 들어갔다는 것은 남는다.
    await expect(
      exportSchedule(document.createElement('div'), createEmptyDoc(2026, 8), 'hd'),
    ).rejects.toThrow()

    expect(createdTags).toContain('img')
  })
})
