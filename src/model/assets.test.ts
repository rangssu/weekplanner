import { beforeEach, describe, expect, it } from 'vitest'
import {
  blobToDataUrl, collectUsedAssetIds, deleteAsset, getAsset, listAssets, purgeUnusedAssets, putAsset,
} from './assets'
import { createEmptyDoc } from './defaults'
import { saveDoc } from './storage'

const makeBlob = (text: string, mime = 'image/png') => new Blob([text], { type: mime })

beforeEach(async () => {
  for (const asset of await listAssets()) await deleteAsset(asset.id)
})

describe('assets', () => {
  it('저장한 에셋을 메타데이터와 바이트까지 그대로 되돌려준다', async () => {
    const original = makeBlob('데이터')
    const id = await putAsset({
      kind: 'image', name: '캐릭터.png', mime: 'image/png', blob: original,
    })
    const got = await getAsset(id)

    expect(got?.name).toBe('캐릭터.png')
    expect(got?.kind).toBe('image')
    expect(got?.mime).toBe('image/png')
    expect(got?.blob.type).toBe('image/png')
    expect(got?.blob.size).toBe(original.size)
    // 바이트가 정확히 같은지는 data URL로 환원해 비교한다.
    // jsdom Blob에는 text()/arrayBuffer()가 없어 FileReader 경로만 쓸 수 있다.
    expect(await blobToDataUrl(got!.blob)).toBe(await blobToDataUrl(original))
  })

  it('없는 id는 null이다', async () => {
    expect(await getAsset('없음')).toBeNull()
  })

  it('저장할 때마다 다른 id를 만든다', async () => {
    const a = await putAsset({ kind: 'image', name: 'a', mime: 'image/png', blob: makeBlob('a') })
    const b = await putAsset({ kind: 'image', name: 'b', mime: 'image/png', blob: makeBlob('b') })
    expect(a).not.toBe(b)
  })

  it('종류로 거를 수 있다', async () => {
    await putAsset({ kind: 'image', name: 'i', mime: 'image/png', blob: makeBlob('i') })
    await putAsset({ kind: 'font', name: 'f', mime: 'font/woff2', blob: makeBlob('f', 'font/woff2') })

    expect(await listAssets('image')).toHaveLength(1)
    expect(await listAssets('font')).toHaveLength(1)
    expect(await listAssets()).toHaveLength(2)
  })

  it('삭제하면 사라진다', async () => {
    const id = await putAsset({ kind: 'image', name: 'x', mime: 'image/png', blob: makeBlob('x') })
    await deleteAsset(id)
    expect(await getAsset(id)).toBeNull()
  })

  it('없는 id를 삭제해도 예외가 없다', async () => {
    await expect(deleteAsset('없음')).resolves.toBeUndefined()
  })
})

describe('blobToDataUrl', () => {
  it('data: URL을 만든다', async () => {
    const url = await blobToDataUrl(makeBlob('안녕', 'text/plain'))
    expect(url.startsWith('data:text/plain;base64,')).toBe(true)
  })
})

describe('사용하지 않는 에셋 정리', () => {
  beforeEach(() => localStorage.clear())

  it('문서에서 참조 중인 에셋 id를 모은다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.backgroundAssetId = 'bg-1'
    doc.stickers = [
      { id: 's1', assetId: 'st-1', x: 0, y: 0, width: 400, rotation: 0, z: 0 },
      { id: 's2', assetId: 'st-2', x: 0, y: 0, width: 400, rotation: 0, z: 1 },
    ]
    doc.fontId = 'user-f1'
    saveDoc(doc)

    const used = collectUsedAssetIds()
    expect(used.has('bg-1')).toBe(true)
    expect(used.has('st-1')).toBe(true)
    expect(used.has('st-2')).toBe(true)
    expect(used.has('f1')).toBe(true)
  })

  it('내장 폰트 id는 에셋으로 오해하지 않는다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.fontId = 'cafe24dongdong'
    saveDoc(doc)
    expect(collectUsedAssetIds().size).toBe(0)
  })

  it('여러 달의 참조를 모두 모은다', () => {
    const august = createEmptyDoc(2026, 8)
    august.backgroundAssetId = 'bg-8'
    saveDoc(august)
    const september = createEmptyDoc(2026, 9)
    september.backgroundAssetId = 'bg-9'
    saveDoc(september)

    const used = collectUsedAssetIds()
    expect(used.has('bg-8')).toBe(true)
    expect(used.has('bg-9')).toBe(true)
  })

  it('참조되지 않는 에셋만 지운다', async () => {
    const keepId = await putAsset({
      kind: 'image', name: 'keep', mime: 'image/png', blob: makeBlob('keep'),
    })
    const dropId = await putAsset({
      kind: 'image', name: 'drop', mime: 'image/png', blob: makeBlob('drop'),
    })

    const doc = createEmptyDoc(2026, 8)
    doc.backgroundAssetId = keepId
    saveDoc(doc)

    expect(await purgeUnusedAssets()).toBe(1)
    expect(await getAsset(keepId)).not.toBeNull()
    expect(await getAsset(dropId)).toBeNull()
  })

  it('지울 게 없으면 0을 준다', async () => {
    expect(await purgeUnusedAssets()).toBe(0)
  })
})
