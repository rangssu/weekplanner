import { useEffect, useState } from 'react'

/**
 * 좁은 화면으로 보는 기준. index.css의 미디어쿼리와 **같은 값이어야 한다.**
 * 그 폭에서 미리보기와 편집 패널이 위아래로 쌓이는데, 날짜 편집기도 같은
 * 지점에서 팝오버 대신 바텀시트로 바뀌어야 한다.
 */
export const NARROW_MAX_WIDTH = 900

/** 화면이 좁은지 알려준다. 창 크기가 바뀌면 따라 바뀐다. */
export function useIsNarrow(maxWidth: number = NARROW_MAX_WIDTH): boolean {
  const query = `(max-width: ${maxWidth}px)`
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setNarrow(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return narrow
}
