import { beforeEach, describe, expect, it } from 'vitest'
import { blobToDataUrl, deleteAsset, getAsset, listAssets, putAsset } from './assets'

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
