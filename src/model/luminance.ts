/**
 * 배경 밝기로 글자색을 고르는 계산. React도 DOM도 모른다.
 *
 * 밝기는 0~255다. 사람 눈이 색마다 다르게 느끼는 밝기를 반영한
 * 표준 가중치를 쓴다 — 같은 값의 초록이 파랑보다 훨씬 밝게 보인다.
 */

const R_WEIGHT = 0.299
const G_WEIGHT = 0.587
const B_WEIGHT = 0.114

/** 이보다 밝은 배경에는 어두운 글자를 얹는다. */
export const LUMINANCE_THRESHOLD = 140

/** 밝기를 알 수 없을 때 쓰는 중간값. 어느 쪽으로도 치우치지 않는다. */
const UNKNOWN_LUMINANCE = 128

const luma = (r: number, g: number, b: number): number =>
  R_WEIGHT * r + G_WEIGHT * g + B_WEIGHT * b

/**
 * `#rrggbb` 색의 밝기. 다른 형식이면 중간값을 준다.
 *
 * 테마 색은 전부 6자리 hex다(withAlpha도 같은 형식만 받는다).
 */
export function hexLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (match === null) return UNKNOWN_LUMINANCE
  const value = parseInt(match[1], 16)
  return luma((value >> 16) & 255, (value >> 8) & 255, value & 255)
}

/**
 * RGBA 버퍼의 평균 밝기.
 *
 * **전부 읽지 않는다.** 4000×2250 캔버스 전체는 900만 픽셀이라 배경을 바꿀
 * 때마다 눈에 띄게 멈춘다. 격자 간격을 벌려 최대 maxSamples개만 읽는다.
 * 평균을 내는 것이라 성긴 표본으로도 충분히 정확하다.
 */
export function sampleLuminance(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  maxSamples = 2000,
): number {
  const total = width * height
  if (total <= 0 || data.length < total * 4) return UNKNOWN_LUMINANCE

  const step = Math.max(1, Math.floor(Math.sqrt(total / maxSamples)))
  let sum = 0
  let count = 0
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      sum += luma(data[i], data[i + 1], data[i + 2])
      count++
    }
  }
  return count === 0 ? UNKNOWN_LUMINANCE : sum / count
}

/**
 * 배경 이미지 위에 반투명한 색이 덮일 때 **실제로 글자가 얹히는** 밝기.
 *
 * 이걸 빼먹으면 기능이 틀린다. 불투명도가 1이면 배경 이미지는 아예 안
 * 보이는데, 이미지 밝기로 글자색을 정하면 어두운 사진을 깔았다는 이유로
 * 흰 배경 위에 흰 글자가 나온다.
 */
export function blendLuminance(imageLuma: number, overlayHex: string, opacity: number): number {
  const clamped = Math.min(1, Math.max(0, opacity))
  return imageLuma * (1 - clamped) + hexLuminance(overlayHex) * clamped
}

/** 'dark'는 어두운 글자를 얹으라는 뜻이다. */
export function pickTextTone(
  luma: number,
  threshold: number = LUMINANCE_THRESHOLD,
): 'dark' | 'light' {
  return luma > threshold ? 'dark' : 'light'
}
