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

  it('모두 라벨을 갖고, 자산 경로는 자기 id로 만든 파일을 가리킨다', () => {
    // src만 비어 있지 않은지 보면 game인데 movie 그림을 잘못 짝지어도 통과한다.
    // 각 아이콘 파일은 <id>.png로 저장되어 있고 Vite가 원래 파일명을 살려
    // 해시를 붙이므로, src에 자기 id가 들어 있는지까지 확인해야 그런
    // 복붙 실수를 잡는다. (아홉 id 중 서로의 파일명에 부분 문자열로
    // 끼어드는 조합은 없음을 별도로 확인했다.)
    for (const icon of DAY_ICONS) {
      expect(icon.label.length).toBeGreaterThan(0)
      expect(icon.src).toContain(icon.id)
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
