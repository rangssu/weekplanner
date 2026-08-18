const HANGUL_FIRST = 0xac00
const HANGUL_LAST = 0xd7a3
/** 한글 음절 하나는 종성 28가지를 돈다. 나머지가 0이면 받침이 없다. */
const JONGSEONG_COUNT = 28

/**
 * 목적격 조사를 고른다 — 받침이 있으면 `을`, 없으면 `를`.
 *
 * 문구에 `${명사}을`처럼 박아 두면 "폰트을 지우면"처럼 깨진다. 안내 문구에
 * 들어가는 명사가 하나로 고정되지 않는 자리에서는 이걸 쓴다.
 *
 * 한글이 아닌 글자로 끝나면 `를`로 둔다. 정답이 없는 경우라, 적어도 문장이
 * 되는 쪽을 고른다.
 */
export function objectParticle(word: string): '을' | '를' {
  const last = word.codePointAt(word.length - 1)
  if (last === undefined || last < HANGUL_FIRST || last > HANGUL_LAST) return '를'
  return (last - HANGUL_FIRST) % JONGSEONG_COUNT === 0 ? '를' : '을'
}
