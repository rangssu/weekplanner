import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteAsset, getAsset, listAssets, putAsset } from '../model/assets'
import { createEmptyDoc } from '../model/defaults'
import { saveDoc } from '../model/storage'
import { AssetLibrary } from './AssetLibrary'

beforeEach(async () => {
  localStorage.clear()
  for (const asset of await listAssets()) await deleteAsset(asset.id)
  vi.restoreAllMocks()
})

const putImage = (name: string) =>
  putAsset({ kind: 'image', name, mime: 'image/png', blob: new Blob(['그림'], { type: 'image/png' }) })

const show = async (props: { onAssetsChange?: () => void } = {}) => {
  const view = render(createElement(AssetLibrary, { onAssetsChange: props.onAssetsChange ?? (() => {}) }))
  fireEvent.click(await screen.findByRole('button', { name: /보관 중인 파일/ }))
  return view
}

describe('AssetLibrary', () => {
  it('펼치기 전에는 파일 목록을 읽지 않는다', async () => {
    await putImage('배경.png')

    render(createElement(AssetLibrary, { onAssetsChange: () => {} }))

    // 접힌 줄에는 개수만 있고 파일 이름은 없다.
    expect(await screen.findByRole('button', { name: /보관 중인 파일 1개/ })).toBeTruthy()
    expect(screen.queryByText('배경.png')).toBeNull()
  })

  /**
   * 배경·폰트는 보관함이 아니라 각자의 섹션에서 올린다. 보관함이 그걸 모르면
   * 접힌 줄이 "0개"인 채로 남아, 방금 올린 파일이 없는 것처럼 보인다.
   */
  it('다른 곳에서 파일을 올리면 접힌 줄의 개수가 따라 바뀐다', async () => {
    render(createElement(AssetLibrary, { onAssetsChange: () => {} }))
    await screen.findByRole('button', { name: /보관 중인 파일 0개/ })

    await act(async () => {
      await putImage('방금올린배경.png')
    })

    expect(await screen.findByRole('button', { name: /보관 중인 파일 1개/ })).toBeTruthy()
  })

  it('보관 중인 것이 없으면 그렇게 알린다', async () => {
    await show()

    expect(await screen.findByText('보관 중인 파일이 없습니다.')).toBeTruthy()
  })

  it('사용 중인 파일에 어느 달에서 쓰이는지 적는다', async () => {
    const id = await putImage('배경.png')
    for (const month of [8, 9]) {
      const doc = createEmptyDoc(2026, month)
      doc.backgroundAssetId = id
      saveDoc(doc)
    }

    await show()

    const meta = await screen.findByText(/에서 사용 중/)
    expect(meta.textContent).toContain('2026-08, 2026-09에서 사용 중')
  })

  it('사용 중인 파일은 확인을 취소하면 지우지 않는다', async () => {
    const id = await putImage('배경.png')
    const doc = createEmptyDoc(2026, 8)
    doc.backgroundAssetId = id
    saveDoc(doc)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    await show()
    await screen.findByText('배경.png')

    fireEvent.click(screen.getByRole('button', { name: '배경.png 지우기' }))

    await waitFor(() => expect(window.confirm).toHaveBeenCalled())
    expect(await getAsset(id)).not.toBeNull()
  })

  it('확인 문구의 조사가 종류에 맞는다', async () => {
    const fontId = await putAsset({
      kind: 'font', name: '손글씨.ttf', mime: 'font/ttf', blob: new Blob(['ㄱ']),
    })
    const doc = createEmptyDoc(2026, 8)
    doc.fontId = `user-${fontId}`
    saveDoc(doc)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await show()
    await screen.findByText('손글씨.ttf')

    fireEvent.click(screen.getByRole('button', { name: '손글씨.ttf 지우기' }))

    // '폰트을'이 아니라 '폰트를'
    expect(confirmSpy.mock.calls[0][0]).toContain('이 폰트를 지우면')
  })

  it('사용 중인 파일도 확인하면 지운다', async () => {
    const id = await putImage('배경.png')
    const doc = createEmptyDoc(2026, 8)
    doc.backgroundAssetId = id
    saveDoc(doc)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onAssetsChange = vi.fn()
    await show({ onAssetsChange })
    await screen.findByText('배경.png')

    fireEvent.click(screen.getByRole('button', { name: '배경.png 지우기' }))

    await waitFor(async () => expect(await getAsset(id)).toBeNull())
    expect(onAssetsChange).toHaveBeenCalled()
  })

  it('사용하지 않는 파일은 묻지 않고 지운다', async () => {
    const id = await putImage('안쓰는배경.png')
    vi.spyOn(window, 'confirm')
    await show()
    await screen.findByText('안쓰는배경.png')

    fireEvent.click(screen.getByRole('button', { name: '안쓰는배경.png 지우기' }))

    await waitFor(async () => expect(await getAsset(id)).toBeNull())
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('미사용 전체 지우기가 사용 중인 파일은 건드리지 않는다', async () => {
    const usedId = await putImage('쓰는배경.png')
    const freeId = await putImage('안쓰는배경.png')
    const doc = createEmptyDoc(2026, 8)
    doc.backgroundAssetId = usedId
    saveDoc(doc)
    await show()
    await screen.findByText('안쓰는배경.png')

    fireEvent.click(screen.getByRole('button', { name: '미사용 전체 지우기' }))

    await waitFor(async () => expect(await getAsset(freeId)).toBeNull())
    expect(await getAsset(usedId)).not.toBeNull()
  })

  /**
   * 목록의 「사용 안 함」 판정은 화면에 그려진 순간의 스냅숏이다. 자동 저장이
   * 400ms 디바운스라, 폰트를 막 올린 직후에는 문서가 아직 저장되지 않아
   * 그 폰트가 미사용으로 보인다. 그 스냅숏을 믿고 지우면 **지금 쓰는 파일이
   * 확인도 없이 사라진다.** 실제로 브라우저에서 이 순서로 재현됐다.
   */
  it('미사용으로 보이던 파일이 그새 쓰이게 됐으면 지우지 않는다', async () => {
    const id = await putImage('방금올린배경.png')
    await show()
    await screen.findByText('방금올린배경.png')

    // 목록을 그린 뒤에 저장이 도착했다.
    const doc = createEmptyDoc(2026, 8)
    doc.backgroundAssetId = id
    saveDoc(doc)

    fireEvent.click(screen.getByRole('button', { name: '방금올린배경.png 지우기' }))

    await waitFor(() =>
      expect(screen.getByText(/지금 쓰고 있어 지우지 않았습니다/)).toBeTruthy(),
    )
    expect(await getAsset(id)).not.toBeNull()
    // 목록도 새로 그려져 이제 사용 중으로 옮겨 간다.
    expect(screen.getByText(/2026-08에서 사용 중/)).toBeTruthy()
  })

  it('파일 크기를 KB로 보여준다', async () => {
    await putAsset({
      kind: 'font',
      name: '손글씨.ttf',
      mime: 'font/ttf',
      blob: new Blob([new Uint8Array(4096)], { type: 'font/ttf' }),
    })

    await show()

    expect(await screen.findByText(/폰트 · 4KB/)).toBeTruthy()
  })
})
