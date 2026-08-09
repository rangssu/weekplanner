import { DOC_KEY_PREFIX, listSavedMonthKeys } from './storage'

const DB_NAME = 'weekplanner'
const DB_VERSION = 1
const STORE = 'assets'

export type AssetKind = 'image' | 'font'

export type AssetRecord = {
  id: string
  kind: AssetKind
  name: string
  mime: string
  blob: Blob
}

/**
 * IndexedDB에 실제로 들어가는 형태.
 *
 * Blob을 그대로 넣지 않고 ArrayBuffer로 풀어서 넣는다. IndexedDB의 Blob 지원은
 * 브라우저마다 편차가 있고, 무엇보다 테스트 환경(fake-indexeddb)에서는
 * structured clone이 Blob을 빈 객체로 만들어 버려 왕복 검증이 아예 불가능하다.
 * ArrayBuffer는 어디서나 안전하게 복제되므로 저장 계층을 테스트할 수 있다.
 * Blob은 경계에서만 만든다.
 */
type StoredAsset = {
  id: string
  kind: AssetKind
  name: string
  mime: string
  data: ArrayBuffer
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('kind', 'kind', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function toRecord(stored: StoredAsset): AssetRecord {
  const { data, ...meta } = stored
  return { ...meta, blob: new Blob([data], { type: stored.mime }) }
}

/**
 * Blob의 바이트를 ArrayBuffer로 읽는다.
 *
 * `blob.arrayBuffer()`를 쓰지 않는다. jsdom의 Blob에는 그 메서드가 없어서
 * 테스트에서 저장 계층 전체가 죽는다. FileReader는 브라우저와 jsdom 모두에서
 * 동작하므로 이쪽으로 통일한다.
 */
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

export async function putAsset(input: Omit<AssetRecord, 'id'>): Promise<string> {
  const stored: StoredAsset = {
    id: newId(),
    kind: input.kind,
    name: input.name,
    mime: input.mime,
    data: await blobToArrayBuffer(input.blob),
  }
  await run('readwrite', (store) => store.put(stored))
  return stored.id
}

export async function getAsset(id: string): Promise<AssetRecord | null> {
  const stored = await run<StoredAsset | undefined>('readonly', (store) => store.get(id))
  return stored ? toRecord(stored) : null
}

export async function deleteAsset(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
}

export async function listAssets(kind?: AssetKind): Promise<AssetRecord[]> {
  const all = await run<StoredAsset[]>('readonly', (store) => store.getAll())
  const filtered = kind ? all.filter((a) => a.kind === kind) : all
  return filtered.map(toRecord)
}

/** html-to-image가 외부 요청 없이 임베딩할 수 있도록 data: URL로 바꾼다. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * 저장된 모든 달의 문서를 훑어 참조 중인 에셋 id를 모은다.
 *
 * 폰트 id는 `user-<assetId>` 형태이므로 접두사를 떼어낸다(theme/fonts.ts 참고).
 * 내장 폰트 id는 이 형태가 아니므로 자연히 걸러진다.
 */
export function collectUsedAssetIds(): Set<string> {
  const used = new Set<string>()

  for (const key of listSavedMonthKeys()) {
    const raw = localStorage.getItem(`${DOC_KEY_PREFIX}${key}`)
    if (!raw) continue
    try {
      const doc = JSON.parse(raw) as {
        backgroundAssetId?: string | null
        stickers?: { assetId?: string }[]
        fontId?: string
      }
      if (doc.backgroundAssetId) used.add(doc.backgroundAssetId)
      for (const sticker of doc.stickers ?? []) {
        if (sticker.assetId) used.add(sticker.assetId)
      }
      if (doc.fontId?.startsWith('user-')) used.add(doc.fontId.slice('user-'.length))
    } catch {
      // 손상된 문서는 건너뛴다. 참조를 모르니 정리 대상에서 뺄 뿐이다.
    }
  }
  return used
}

/** 어떤 문서도 참조하지 않는 에셋을 지운다. 지운 개수를 준다. */
export async function purgeUnusedAssets(): Promise<number> {
  const used = collectUsedAssetIds()
  const all = await listAssets()
  const unused = all.filter((asset) => !used.has(asset.id))
  for (const asset of unused) await deleteAsset(asset.id)
  return unused.length
}
