import {
  blobToDataUrl, deleteAsset, getAsset, listAssets, putAsset,
} from '../model/assets'
import { DEFAULT_FONT_ID } from '../model/defaults'

export type FontOption = {
  id: string
  label: string
  /** CSS font-family 값 */
  family: string
  source: 'builtin' | 'user'
  /** builtin이면 null */
  assetId: string | null
}

/**
 * 프로젝트에 함께 넣어둔 폰트.
 *
 * 시스템에 설치된 폰트를 이름으로만 지정하면 화면에는 나오지만 내보낸
 * 이미지에서 빠질 수 있다. 그래서 실제 파일을 번들해 @font-face로 등록한다.
 * (`src/index.css` 참고)
 */
export const BUILTIN_FONTS: FontOption[] = [
  {
    id: 'cafe24dongdong',
    label: '카페24 동동',
    family: "'Cafe24 Dongdong', sans-serif",
    source: 'builtin',
    assetId: null,
  },
  {
    id: 'system',
    label: '시스템 기본',
    family: "system-ui, -apple-system, 'Malgun Gothic', sans-serif",
    source: 'builtin',
    assetId: null,
  },
]

const FORMATS: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

/** 파일 이름에서 CSS `format()` 문자열을 뽑는다. 지원하지 않으면 null. */
export function fontFormatFor(filename: string): string | null {
  const dot = filename.lastIndexOf('.')
  if (dot < 0) return null
  return FORMATS[filename.slice(dot + 1).toLowerCase()] ?? null
}

export function fontFamilyFor(id: string, userFonts: FontOption[]): string {
  const found = [...BUILTIN_FONTS, ...userFonts].find((f) => f.id === id)
  if (found) return found.family
  return BUILTIN_FONTS.find((f) => f.id === DEFAULT_FONT_ID)!.family
}

/**
 * data URL을 그대로 담은 @font-face 규칙.
 *
 * URL이 아니라 data URL을 쓰는 이유: html-to-image가 결과 이미지를 만들 때
 * 이 규칙을 그대로 복사해 넣기 때문에 외부 요청 없이 폰트가 임베딩된다.
 * font-display: block은 폰트가 준비되기 전 대체 글꼴로 잠깐 그려지는 것을 막는다.
 */
export function fontFaceRule(family: string, dataUrl: string, format: string): string {
  return `@font-face { font-family: '${family}'; src: url(${dataUrl}) format('${format}'); font-display: block; }`
}

const STYLE_ELEMENT_ID = 'weekplanner-user-fonts'

function styleElement(): HTMLStyleElement {
  const existing = document.getElementById(STYLE_ELEMENT_ID)
  if (existing) return existing as HTMLStyleElement
  const style = document.createElement('style')
  style.id = STYLE_ELEMENT_ID
  document.head.appendChild(style)
  return style
}

const registered = new Set<string>()

/**
 * 문서에 폰트를 등록한다.
 *
 * FontFace API 대신 <style> 주입을 쓴다. html-to-image는 document.styleSheets를
 * 순회해 @font-face를 찾으므로, FontFace API로 추가한 폰트는 화면에는 나오지만
 * 내보낸 이미지에서 누락된다.
 */
export function registerFontFace(family: string, dataUrl: string, format: string): void {
  if (registered.has(family)) return
  registered.add(family)
  styleElement().appendChild(document.createTextNode(fontFaceRule(family, dataUrl, format)))
}

const familyForAsset = (assetId: string) => `wp-user-${assetId}`
const idForAsset = (assetId: string) => `user-${assetId}`

export async function uploadUserFont(file: File): Promise<FontOption> {
  const format = fontFormatFor(file.name)
  if (!format) {
    throw new Error('지원하지 않는 폰트 형식입니다. ttf, otf, woff, woff2만 쓸 수 있습니다.')
  }

  const assetId = await putAsset({
    kind: 'font',
    name: file.name,
    mime: file.type || 'font/woff2',
    blob: file,
  })

  const family = familyForAsset(assetId)
  registerFontFace(family, await blobToDataUrl(file), format)

  return { id: idForAsset(assetId), label: file.name, family, source: 'user', assetId }
}

/** 저장된 업로드 폰트를 전부 문서에 등록하고 목록을 준다. */
export async function loadUserFonts(): Promise<FontOption[]> {
  const assets = await listAssets('font')
  const options: FontOption[] = []

  for (const asset of assets) {
    const format = fontFormatFor(asset.name)
    if (!format) continue
    const family = familyForAsset(asset.id)
    registerFontFace(family, await blobToDataUrl(asset.blob), format)
    options.push({
      id: idForAsset(asset.id), label: asset.name, family, source: 'user', assetId: asset.id,
    })
  }
  return options
}

export async function removeUserFont(option: FontOption): Promise<void> {
  if (!option.assetId) return
  if (await getAsset(option.assetId)) await deleteAsset(option.assetId)
  // 등록된 @font-face는 남지만 참조가 사라지므로 표시에 영향이 없다.
}
