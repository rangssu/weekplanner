import { describe, expect, it } from 'vitest'
import { DAY_ICONS, getDayIcon } from './dayIcons'

describe('DAY_ICONS', () => {
  it('9종을 제공한다', () => {
    expect(DAY_ICONS).toHaveLength(9)
  })

  it('id가 정해진 아홉 개다', () => {
    // 저장된 문서가 이 문자열을 참조한다. 바꾸면 예전 문서의 아이콘이 사라진다.
    expect(DAY_ICONS.map((i) => i.id)).toEqual([
      'star', 'game', 'movie', 'together', 'note', 'pen', 'talk', 'rest-ko', 'rest-hanja',
    ])
  })

  it('id가 중복되지 않는다', () => {
    expect(new Set(DAY_ICONS.map((i) => i.id)).size).toBe(DAY_ICONS.length)
  })

  it('모두 라벨과 자산 경로를 갖는다', () => {
    for (const icon of DAY_ICONS) {
      expect(icon.label.length).toBeGreaterThan(0)
      expect(icon.src.length).toBeGreaterThan(0)
    }
  })
})

describe('getDayIcon', () => {
  it('id로 찾는다', () => {
    expect(getDayIcon('star')?.label).toBe('별')
  })

  it('모르는 id면 undefined다', () => {
    // 깨진 이미지를 결과물에 박느니 아무것도 안 그리는 쪽이 낫다.
    expect(getDayIcon('없는아이콘')).toBeUndefined()
  })

  it('undefined를 받아도 터지지 않는다', () => {
    expect(getDayIcon(undefined)).toBeUndefined()
  })
})
