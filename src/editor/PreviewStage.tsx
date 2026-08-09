import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'

export type PreviewStageProps = {
  children: ReactNode
  /**
   * 미리보기 위아래로 화면에서 빼둘 여백(px).
   * 제목줄·패딩처럼 미리보기가 쓸 수 없는 세로 공간을 뜻한다.
   */
  verticalChrome?: number
}

/**
 * 4000×2250 캔버스를 화면 폭에 맞춰 축소해 보여준다.
 *
 * 축소는 이 래퍼가 담당하고 캔버스 자신은 원본 크기를 유지한다. 그래야
 * html-to-image가 캔버스 노드를 4000×2250 그대로 직렬화한다.
 *
 * **높이를 measure한 배율로 계산하면 안 된다.** 그러면 배율 변경 → 높이 변경 →
 * 페이지 높이 변경 → 스크롤바 출현/소멸 → 폭 변경 → 배율 변경으로 이어지는
 * ResizeObserver 피드백 루프가 생겨 렌더러가 멈춘다. 실제로 그렇게 됐었다.
 * 높이는 CSS `aspect-ratio`가 폭으로부터 유도하게 두고, 상태로는 레이아웃에
 * 영향을 주지 않는 `transform`만 바꾼다.
 */
export function PreviewStage({ children, verticalChrome = 140 }: PreviewStageProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return

    const update = () => {
      const next = host.clientWidth / CANVAS_WIDTH
      // 같은 값으로 setState하면 React가 렌더를 건너뛰지만,
      // 관찰 콜백이 매번 도는 것 자체를 줄이기 위해 명시적으로 거른다.
      setScale((prev) => (Math.abs(prev - next) < 0.0001 ? prev : next))
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={hostRef}
      style={{
        width: '100%',
        // 폭과 높이 중 더 빡빡한 쪽에 맞춘다. 폭에만 맞추면 세로로 긴 캔버스가
        // 화면 아래로 잘려 나간다. editor/에서는 vh를 써도 된다.
        maxWidth: `calc((100vh - ${verticalChrome}px) * ${CANVAS_WIDTH} / ${CANVAS_HEIGHT})`,
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          // 배율을 재기 전에는 원본 크기가 잠깐 보이므로 감춘다.
          visibility: scale === 0 ? 'hidden' : 'visible',
        }}
      >
        {children}
      </div>
    </div>
  )
}
