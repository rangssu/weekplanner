import { describe, expect, it } from 'vitest'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'
import { EXPORT_SIZES, exportFileName, type ExportSizeKey } from './exportImage'

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
