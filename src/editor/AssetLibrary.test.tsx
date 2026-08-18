import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
