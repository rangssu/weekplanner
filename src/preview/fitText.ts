export type Measurement = { width: number; height: number }
export type MeasureFn = (fontSize: number) => Measurement

export type FitOptions = {
  measure: MeasureFn
  maxWidth: number
  maxHeight: number
  baseSize: number
  minSize: number
}

export type FitResult = {
  /** 실제로 적용할 폰트 크기(px, 정수) */
  size: number
  /** 최소 크기로도 상자를 넘치는지 */
  overflow: boolean
}

/**
 * 상자에 들어가는 가장 큰 폰트 크기를 이진 탐색으로 찾는다.
 *
 * 크기가 커질수록 측정값도 커진다는 단조성을 가정한다. 텍스트 렌더링에서는
 * 항상 성립한다. 정수 크기만 다루므로 반복 횟수는 log2(baseSize - minSize)로
 * 묶인다 — 44~22 범위면 5회, 200~10 범위면 8회 안쪽이다.
 */
export function chooseFontSize(opts: FitOptions): FitResult {
  const { measure, maxWidth, maxHeight, baseSize, minSize } = opts
  const fits = (size: number) => {
    const m = measure(size)
    return m.width <= maxWidth && m.height <= maxHeight
  }

  if (fits(baseSize)) return { size: baseSize, overflow: false }
  if (baseSize <= minSize) return { size: minSize, overflow: true }
  if (!fits(minSize)) return { size: minSize, overflow: true }

  // minSize는 들어가고 baseSize는 안 들어간다. 그 사이 최대값을 찾는다.
  let lo = minSize // 들어감이 확인된 값
  let hi = baseSize // 안 들어감이 확인된 값
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (fits(mid)) lo = mid
    else hi = mid
  }
  return { size: lo, overflow: false }
}
