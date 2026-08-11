import { CANVAS_HEIGHT, CANVAS_WIDTH, type BoxRect } from '../preview/layout'
import { sampleLuminance } from './luminance'

/** 이미지 로딩이 이만큼 걸리면 포기한다. 폴백이 있으므로 기다릴 이유가 없다. */
const LOAD_TIMEOUT_MS = 5000

function loadImage(dataUrl: string, timeoutMs: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    const timer = setTimeout(() => resolve(null), timeoutMs)
    image.onload = () => {
      clearTimeout(timer)
      resolve(image)
    }
    image.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    image.src = dataUrl
  })
}

/**
 * 배경 이미지의 영역별 평균 밝기. 못 읽으면 null이다.
 *
 * 영역은 **캔버스 좌표**(4000×2250)로 준다. 배경은 backgroundSize로 캔버스를
 * 꽉 채우므로 이미지 크기에 비례 변환하면 된다.
 *
 * **CORS 걱정은 없다.** 배경은 IndexedDB에 담긴 사용자 업로드 파일이고
 * useAssetUrl이 data URL로 바꿔 준다. 외부 URL도 프리셋도 없어 캔버스가
 * 오염될 경로가 없다. 실패는 손상된 파일이나 디코딩 실패다.
 *
 * timeoutMs를 인자로 받는 이유: jsdom은 이미지 load/error 이벤트를 아예 쏘지
 * 않는다. 테스트가 실제 앱 타임아웃(5초)을 그대로 기다리지 않도록 짧은 값을
 * 넘길 수 있게 열어 둔다.
 */
export async function measureRegions(
  dataUrl: string,
  regions: Record<string, BoxRect>,
  timeoutMs: number = LOAD_TIMEOUT_MS,
): Promise<Record<string, number> | null> {
  if (dataUrl === '') return null

  const image = await loadImage(dataUrl, timeoutMs)
  if (image === null) return null

  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  if (width <= 0 || height <= 0) return null

  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (context === null) return null
    context.drawImage(image, 0, 0)

    const scaleX = width / CANVAS_WIDTH
    const scaleY = height / CANVAS_HEIGHT
    const result: Record<string, number> = {}

    for (const [key, rect] of Object.entries(regions)) {
      const x = Math.max(0, Math.floor(rect.x * scaleX))
      const y = Math.max(0, Math.floor(rect.y * scaleY))
      const w = Math.max(1, Math.min(width - x, Math.floor(rect.width * scaleX)))
      const h = Math.max(1, Math.min(height - y, Math.floor(rect.height * scaleY)))
      const data = context.getImageData(x, y, w, h)
      result[key] = sampleLuminance(data.data, w, h)
    }
    return result
  } catch {
    // 디코딩 실패나 손상된 파일. 부르는 쪽이 테마 기본색으로 떨어진다.
    return null
  }
}
