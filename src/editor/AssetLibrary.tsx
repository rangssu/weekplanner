import { useCallback, useEffect, useState } from 'react'
import {
  collectAssetUsage,
  countAssets,
  deleteAsset,
  deleteUnusedAssets,
  listAssets,
  onAssetsChanged,
  type AssetRecord,
} from '../model/assets'
import { forgetAssetUrl } from '../state/useAssetUrl'
import { objectParticle } from './particle'
import { buttonStyle } from './controls'

export type AssetLibraryProps = {
  /** 파일을 지운 뒤 불린다. 폰트 목록처럼 밖에서 들고 있는 것을 다시 읽는 데 쓴다. */
  onAssetsChange: () => void
}

type Entry = {
  asset: AssetRecord
  /** 이 파일을 참조하는 월 키. 비어 있으면 미사용이다. */
  months: string[]
}

const KIND_LABEL = { image: '이미지', font: '폰트' } as const

/** 1KB 미만도 0KB로 보이지 않게 한다. 목록에서 "0KB"는 빈 파일로 오해된다. */
function sizeText(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 0',
  borderTop: '1px solid #f4f4f5',
}

const groupTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#3f3f46',
  margin: '12px 0 0',
}

const metaStyle: React.CSSProperties = { fontSize: 11, color: '#71717a' }

const deleteStyle: React.CSSProperties = {
  ...buttonStyle,
  fontSize: 12,
  padding: '4px 8px',
  flexShrink: 0,
}

function AssetRow({ entry, onDelete }: { entry: Entry; onDelete: (entry: Entry) => void }) {
  const { asset, months } = entry
  return (
    <div style={rowStyle}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, wordBreak: 'break-all' }}>{asset.name}</div>
        <div style={metaStyle}>
          {KIND_LABEL[asset.kind]} · {sizeText(asset.blob.size)}
          {months.length > 0 && <> · {months.join(', ')}에서 사용 중</>}
        </div>
      </div>
      <button
        type="button"
        style={deleteStyle}
        aria-label={`${asset.name} 지우기`}
        onClick={() => onDelete(entry)}
      >
        삭제
      </button>
    </div>
  )
}

/**
 * 보관 중인 이미지·폰트를 보여주고 지운다.
 *
 * 기본으로 접어 둔다. `listAssets`는 모든 파일의 바이트를 통째로 메모리에
 * 올리는데, 이 영역은 탭과 무관하게 항상 화면에 있다. 접힌 줄이 쓰는
 * `countAssets`는 IndexedDB의 개수만 세므로 바이트를 읽지 않는다.
 * 아이패드에서 내보내기가 탭을 날리는 것과 같은 이유다.
 *
 * 지운 파일의 참조는 문서에서 지우지 않는다. 삭제 한 번이 여러 달의 문서를
 * 되쓰게 만드는 부작용이 더 크고, 배경은 `useAssetUrl`이 없으면 배경 없이,
 * 폰트는 `fontFamilyFor`가 기본 폰트로 폴백한다. 대신 지우기 전에 어느 달이
 * 영향받는지 알려 준다.
 */
export function AssetLibrary({ onAssetsChange }: AssetLibraryProps) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    setCount(await countAssets())
    if (!open) {
      setEntries(null)
      return
    }
    const usage = collectAssetUsage()
    const assets = await listAssets()
    setEntries(assets.map((asset) => ({ asset, months: usage.get(asset.id) ?? [] })))
  }, [open])

  useEffect(() => {
    void refresh()
    // 배경·폰트는 각자의 섹션에서 올린다. 저장소가 알려 주지 않으면 접힌 줄이
    // "0개"인 채로 남아, 방금 올린 파일이 없는 것처럼 보인다.
    return onAssetsChanged(() => void refresh())
  }, [refresh])

  // 목록 갱신은 위 구독이 맡는다. 여기서는 밖에 알리기만 한다.
  const afterDelete = () => onAssetsChange()

  const handleDelete = async (entry: Entry) => {
    const { asset, months } = entry
    setNotice('')

    // 「사용 안 함」은 목록을 그린 순간의 스냅숏이다. 자동 저장이 400ms
    // 디바운스라 방금 고른 배경·폰트는 아직 문서에 없을 수 있다. 그 스냅숏을
    // 믿고 지우면 지금 쓰는 파일이 확인도 없이 사라진다. 지우기 직전에 참조를
    // 다시 계산하는 deleteUnusedAssets에 맡기고, 막혔으면 목록을 새로 그린다.
    if (months.length === 0) {
      const removed = await deleteUnusedAssets([asset.id])
      if (removed === 0) {
        setNotice(`${asset.name}은(는) 지금 쓰고 있어 지우지 않았습니다.`)
      } else {
        forgetAssetUrl(asset.id)
      }
      afterDelete()
      await refresh()
      return
    }

    const what = asset.kind === 'image' ? '그림' : '폰트'
    const ok = window.confirm(
      `이 ${what}${objectParticle(what)} 지우면 ${months.join(', ')}에서 사라집니다. 계속할까요?`,
    )
    if (!ok) return

    await deleteAsset(asset.id)
    forgetAssetUrl(asset.id)
    afterDelete()
  }

  const handleDeleteUnused = async (unused: Entry[]) => {
    const ids = unused.map((entry) => entry.asset.id)
    await deleteUnusedAssets(ids)
    for (const id of ids) forgetAssetUrl(id)
    afterDelete()
  }

  const used = entries?.filter((entry) => entry.months.length > 0) ?? []
  const unused = entries?.filter((entry) => entry.months.length === 0) ?? []

  return (
    <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px dashed #d4d4d8' }}>
      <button
        type="button"
        style={{ ...buttonStyle, fontSize: 12, width: '100%', textAlign: 'left' }}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? '▾' : '▸'} 이미지·폰트 보관함 — 보관 중인 파일 {count ?? 0}개
      </button>

      {open && notice && (
        <p style={{ fontSize: 12, color: '#c0392b', marginTop: 8 }}>{notice}</p>
      )}

      {open && entries !== null && entries.length === 0 && (
        <p style={{ ...metaStyle, marginTop: 8 }}>보관 중인 파일이 없습니다.</p>
      )}

      {open && used.length > 0 && (
        <>
          <h3 style={groupTitleStyle}>사용 중</h3>
          {used.map((entry) => (
            <AssetRow
              key={entry.asset.id}
              entry={entry}
              onDelete={(target) => void handleDelete(target)}
            />
          ))}
        </>
      )}

      {open && unused.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ ...groupTitleStyle, flex: 1 }}>사용 안 함</h3>
            <button
              type="button"
              style={{ ...deleteStyle, marginTop: 12 }}
              onClick={() => void handleDeleteUnused(unused)}
            >
              미사용 전체 지우기
            </button>
          </div>
          {unused.map((entry) => (
            <AssetRow
              key={entry.asset.id}
              entry={entry}
              onDelete={(target) => void handleDelete(target)}
            />
          ))}
        </>
      )}
    </div>
  )
}
