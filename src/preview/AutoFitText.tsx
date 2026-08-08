import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { chooseFontSize } from './fitText'

export type AutoFitTextProps = {
  text: string
  maxWidth: number
  maxHeight: number
  baseSize: number
  minSize: number
  lineHeight: number
  color: string
  /** 형광펜 색. null이면 그리지 않는다. */
  markerColor: string | null
  onOverflowChange?: (overflow: boolean) => void
}

/**
 * 주어진 상자 안에 텍스트를 중앙 정렬로 채우되, 넘치면 폰트 크기를 줄인다.
 * 상자 크기는 절대 변하지 않는다.
 */
export function AutoFitText(props: AutoFitTextProps) {
  const { text, maxWidth, maxHeight, baseSize, minSize, lineHeight, color, markerColor } = props
  const probeRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(baseSize)
  const [fontEpoch, setFontEpoch] = useState(0)

  // 폰트 로딩이 끝나면 다시 재게 만든다.
  useEffect(() => {
    let alive = true
    void document.fonts.ready.then(() => {
      if (alive) setFontEpoch((n) => n + 1)
    })
    const onDone = () => setFontEpoch((n) => n + 1)
    document.fonts.addEventListener('loadingdone', onDone)
    return () => {
      alive = false
      document.fonts.removeEventListener('loadingdone', onDone)
    }
  }, [])

  useLayoutEffect(() => {
    const probe = probeRef.current
    if (!probe) return

    const result = chooseFontSize({
      measure: (fontSize) => {
        probe.style.fontSize = `${fontSize}px`
        return { width: probe.scrollWidth, height: probe.scrollHeight }
      },
      maxWidth,
      maxHeight,
      baseSize,
      minSize,
    })

    probe.style.fontSize = `${result.size}px`
    setSize(result.size)
    props.onOverflowChange?.(result.overflow)
    // props.onOverflowChange는 의도적으로 의존성에서 뺀다.
    // 부모가 인라인 함수를 넘기면 매 렌더마다 재측정이 돌기 때문이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, maxWidth, maxHeight, baseSize, minSize, lineHeight, fontEpoch])

  const textStyle = {
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    lineHeight,
    textAlign: 'center' as const,
  }

  return (
    <div
      style={{
        width: maxWidth,
        height: maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        color,
      }}
    >
      {/* 측정용. 화면 밖에 두되 같은 폭 제약을 받게 한다. */}
      <div
        ref={probeRef}
        aria-hidden
        style={{
          ...textStyle,
          position: 'absolute',
          left: -99999,
          top: 0,
          width: maxWidth,
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>

      <div style={{ ...textStyle, fontSize: size, width: maxWidth }}>
        {markerColor ? (
          <span
            style={{
              // 글자 아래쪽에만 색이 깔리는 형광펜 느낌
              backgroundImage: `linear-gradient(transparent 55%, ${markerColor} 55%)`,
              paddingInline: size * 0.08,
            }}
          >
            {text}
          </span>
        ) : (
          text
        )}
      </div>
    </div>
  )
}
