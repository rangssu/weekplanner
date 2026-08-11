import { toPng } from 'html-to-image'
import type { ScheduleDoc } from '../model/types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'

export type ExportSizeKey = 'original' | '4k' | 'fhd' | 'hd'

export const EXPORT_SIZES: Record<
  ExportSizeKey,
  { label: string; suffix: string; width: number; height: number }
> = {
  original: { label: '원본', suffix: '원본', width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  '4k': { label: '4K', suffix: '4K', width: 3840, height: 2160 },
  fhd: { label: 'Full HD', suffix: 'FHD', width: 1920, height: 1080 },
  hd: { label: 'HD', suffix: 'HD', width: 1280, height: 720 },
}

export function exportFileName(year: number, month: number, key: ExportSizeKey): string {
  return `${year}-${String(month).padStart(2, '0')}_스케줄_${EXPORT_SIZES[key].suffix}.png`
}

/**
 * 캡처하는 동안 CSS 전환을 끈다.
 *
 * html-to-image는 캡처 시점의 getComputedStyle을 읽는다. 글자색 전환이
 * 진행 중이면 **중간 색이 PNG에 박힌다.** transition을 없애면 진행 중이던
 * 전환이 취소되고 목표 색이 곧바로 계산값이 되므로 그 경로가 사라진다.
 */
async function withoutTransition<T>(node: HTMLElement, run: () => Promise<T>): Promise<T> {
  const saved = node.style.transition
  node.style.transition = 'none'
  try {
    return await run()
  } finally {
    node.style.transition = saved
  }
}

/**
 * 미리보기 노드를 4000×2250 PNG data URL로 만든다.
 *
 * 두 번 렌더링하고 두 번째 결과를 쓴다. html-to-image는 첫 호출에서 폰트나
 * 이미지가 아직 준비되지 않아 빠진 채로 그려지는 알려진 문제가 있다.
 * document.fonts.ready만으로는 부족한 브라우저가 있어 이중으로 막는다.
 *
 * cacheBust는 반드시 꺼 둔다. 자산 파일명은 Vite가 이미 내용 해시를 붙이므로
 * 바이트가 바뀌면 파일명도 같이 바뀌어 별도 캐시 무효화가 필요 없다. 켜면
 * 요청에 `?시각` 쿼리가 붙는데, 서비스 워커의 precache 매칭은 쿼리가 다르면
 * 못 찾아 네트워크로 새 요청이 나간다. 오프라인이면 그 요청이 실패하고
 * html-to-image는 실패한 이미지를 빈 문자열로 모듈 캐시에 박아 버려서, 이후
 * 내보내기마다 아이콘이 조용히 빠진 채로 나온다. 다시 켜지 말 것.
 */
export async function renderCanvasPng(node: HTMLElement): Promise<string> {
  await document.fonts.ready

  const options = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    pixelRatio: 1,
    cacheBust: false,
    skipFonts: false,
  }

  return withoutTransition(node, async () => {
    await toPng(node, options)
    return toPng(node, options)
  })
}

/** 원본 PNG를 지정 크기로 줄인다. 모두 같은 16:9라 비율은 그대로다. */
export async function downscalePng(
  dataUrl: string,
  width: number,
  height: number,
): Promise<Blob> {
  const image = new Image()
  image.src = dataUrl
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 만들 수 없습니다.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('이미지를 만들지 못했습니다.')
  return blob
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // 클릭 직후 해제하면 일부 브라우저에서 다운로드가 취소된다.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function exportSchedule(
  node: HTMLElement,
  doc: ScheduleDoc,
  key: ExportSizeKey,
): Promise<void> {
  const dataUrl = await renderCanvasPng(node)
  const size = EXPORT_SIZES[key]
  const blob = await downscalePng(dataUrl, size.width, size.height)
  triggerDownload(blob, exportFileName(doc.year, doc.month, key))
}
