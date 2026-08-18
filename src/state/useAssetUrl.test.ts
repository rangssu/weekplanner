import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { deleteAsset, listAssets, putAsset } from '../model/assets'
import { forgetAssetUrl, useAssetUrl } from './useAssetUrl'

beforeEach(async () => {
  for (const asset of await listAssets()) await deleteAsset(asset.id)
})

const put = () =>
  putAsset({
    kind: 'image',
    name: '배경.png',
    mime: 'image/png',
    blob: new Blob(['그림'], { type: 'image/png' }),
  })

describe('useAssetUrl', () => {
  it('저장된 에셋을 data URL로 준다', async () => {
    const id = await put()

    const { result } = renderHook(() => useAssetUrl(id))

    await waitFor(() => expect(result.current?.startsWith('data:image/png')).toBe(true))
  })

  it('없는 에셋은 null이다', async () => {
    const { result } = renderHook(() => useAssetUrl('없음'))

    await waitFor(() => expect(result.current).toBeNull())
  })

  /**
   * 캐시가 있어서 지운 뒤에도 화면에 남는 것이 이 훅의 함정이었다.
   * 보관함에서 배경을 지웠는데 계속 보이면 사용자는 삭제가 실패한 줄 안다.
   */
  it('지웠다고 알리면 보고 있던 화면에서도 사라진다', async () => {
    const id = await put()
    const { result } = renderHook(() => useAssetUrl(id))
    await waitFor(() => expect(result.current).not.toBeNull())

    await deleteAsset(id)
    forgetAssetUrl(id)

    await waitFor(() => expect(result.current).toBeNull())
  })

  it('다른 에셋을 지운 것은 영향을 주지 않는다', async () => {
    const id = await put()
    const { result } = renderHook(() => useAssetUrl(id))
    await waitFor(() => expect(result.current).not.toBeNull())

    forgetAssetUrl('다른-것')

    expect(result.current).not.toBeNull()
  })
})
