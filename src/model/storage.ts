import { monthKey } from './calendar'
import { createEmptyDoc, DOC_VERSION } from './defaults'
import type { ScheduleDoc } from './types'

export const DOC_KEY_PREFIX = 'weekplanner:doc:'

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unknown' }

export function saveDoc(doc: ScheduleDoc): SaveResult {
  try {
    localStorage.setItem(`${DOC_KEY_PREFIX}${monthKey(doc.year, doc.month)}`, JSON.stringify(doc))
    return { ok: true }
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    // 브라우저마다 이름이 다르다. Firefox는 NS_ERROR_DOM_QUOTA_REACHED를 쓴다.
    const isQuota = name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    return { ok: false, reason: isQuota ? 'quota' : 'unknown' }
  }
}

export function loadDoc(year: number, month: number): ScheduleDoc | null {
  const raw = localStorage.getItem(`${DOC_KEY_PREFIX}${monthKey(year, month)}`)
  if (raw === null) return null
  try {
    return migrateDoc(JSON.parse(raw))
  } catch {
    return null
  }
}

export function listSavedMonthKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(DOC_KEY_PREFIX)) keys.push(key.slice(DOC_KEY_PREFIX.length))
  }
  return keys.sort()
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * 저장된 데이터를 현재 문서 형태로 맞춘다.
 * 되살릴 수 없으면 null을 준다. 호출부는 null을 "새 문서로 시작"으로 처리한다.
 */
export function migrateDoc(raw: unknown): ScheduleDoc | null {
  if (!isObject(raw)) return null
  if (raw.version !== DOC_VERSION) return null
  if (typeof raw.year !== 'number' || typeof raw.month !== 'number') return null
  if (!isObject(raw.header) || !isObject(raw.days)) return null

  const base = createEmptyDoc(raw.year, raw.month)
  return {
    ...base,
    ...(raw as unknown as ScheduleDoc),
    header: { ...base.header, ...(raw.header as ScheduleDoc['header']) },
    footer: isObject(raw.footer) ? (raw.footer as ScheduleDoc['footer']) : base.footer,
    stickers: Array.isArray(raw.stickers) ? (raw.stickers as ScheduleDoc['stickers']) : [],
  }
}
