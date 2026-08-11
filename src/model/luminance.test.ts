import { describe, expect, it } from 'vitest'
import {
  LUMINANCE_THRESHOLD, blendLuminance, hexLuminance, pickTextTone, sampleLuminance,
} from './luminance'

/** width×height 크기의 단색 RGBA 버퍼를 만든다. */
function solid(width: number, height: number, r: number, g: number, b: number) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = 255
  }
  return data
}

describe('hexLuminance', () => {
  it('순백은 255다', () => {
    expect(hexLuminance('#ffffff')).toBeCloseTo(255, 5)
  })

  it('순흑은 0이다', () => {
    expect(hexLuminance('#000000')).toBeCloseTo(0, 5)
  })

  it('사람 눈이 초록을 가장 밝게 본다', () => {
    expect(hexLuminance('#00ff00')).toBeGreaterThan(hexLuminance('#ff0000'))
    expect(hexLuminance('#ff0000')).toBeGreaterThan(hexLuminance('#0000ff'))
  })

  it('공식 그대로다', () => {
    // 0.299*255 = 76.245
    expect(hexLuminance('#ff0000')).toBeCloseTo(76.245, 3)
  })

  it('형식이 틀리면 중간값을 준다', () => {
    expect(hexLuminance('rgba(0,0,0,0.5)')).toBe(128)
  })
})

describe('sampleLuminance', () => {
  it('단색 이미지는 그 색의 밝기를 준다', () => {
    expect(sampleLuminance(solid(40, 40, 255, 255, 255), 40, 40)).toBeCloseTo(255, 5)
    expect(sampleLuminance(solid(40, 40, 0, 0, 0), 40, 40)).toBeCloseTo(0, 5)
  })

  it('샘플 수를 줄여도 단색이면 값이 같다', () => {
    const data = solid(200, 200, 100, 100, 100)
    const full = sampleLuminance(data, 200, 200, 40000)
    const sparse = sampleLuminance(data, 200, 200, 100)
    expect(sparse).toBeCloseTo(full, 5)
  })

  it('반은 희고 반은 검으면 중간값이 나온다', () => {
    const width = 40
    const height = 40
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const v = y < height / 2 ? 255 : 0
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 255
      }
    }
    expect(sampleLuminance(data, width, height)).toBeCloseTo(127.5, 0)
  })

  it('빈 버퍼는 중간값을 준다', () => {
    expect(sampleLuminance(new Uint8ClampedArray(0), 0, 0)).toBe(128)
  })
})

describe('blendLuminance', () => {
  it('불투명도가 0이면 이미지 밝기 그대로다', () => {
    expect(blendLuminance(30, '#ffffff', 0)).toBeCloseTo(30, 5)
  })

  it('불투명도가 1이면 덮는 색의 밝기가 된다', () => {
    expect(blendLuminance(30, '#ffffff', 1)).toBeCloseTo(255, 5)
  })

  it('절반이면 중간이다', () => {
    expect(blendLuminance(0, '#ffffff', 0.5)).toBeCloseTo(127.5, 5)
  })
})

describe('pickTextTone', () => {
  it('임계치는 140이다', () => {
    expect(LUMINANCE_THRESHOLD).toBe(140)
  })

  it('임계치보다 밝으면 어두운 글자를 고른다', () => {
    expect(pickTextTone(141)).toBe('dark')
  })

  it('임계치와 같거나 어두우면 밝은 글자를 고른다', () => {
    expect(pickTextTone(140)).toBe('light')
    expect(pickTextTone(139)).toBe('light')
  })
})
