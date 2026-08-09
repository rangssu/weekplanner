import { monthKey } from './calendar'
import { createEmptyDoc, DOC_VERSION } from './defaults'
import type { HeaderConfig, ScheduleDoc } from './types'

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
 * 헤더도 알려진 필드만 골라 만든다.
 * 통째로 병합하면 없앤 기능(예전 `memo`)의 흔적이 계속 딸려 들어온다.
 */
function mergeHeader(base: HeaderConfig, raw: unknown): HeaderConfig {
  if (!isObject(raw)) return base

  const goals = isObject(raw.goals) ? raw.goals : null
  const todo = isObject(raw.todo) ? raw.todo : null
  // 예전에 이 칸은 "우선순위(priorities)"였다. 이름만 바뀌고 성격은 같으므로
  // 예전 데이터를 그대로 물려받는다.
  const memo = isObject(raw.memo) ? raw.memo : isObject(raw.priorities) ? raw.priorities : null

  // 빈 문자열도 문자열이므로 그대로 살아남는다. 배지를 일부러 비운 설정이
  // 새로고침 후에도 유지되려면 truthy 검사가 아니라 타입 검사여야 한다.
  const text = (v: unknown, fallback: string): string =>
    typeof v === 'string' ? v : fallback

  return {
    titleMode: raw.titleMode === 'custom' ? 'custom' : 'auto',
    customTitle: typeof raw.customTitle === 'string' ? raw.customTitle : base.customTitle,
    goals: {
      enabled: typeof goals?.enabled === 'boolean' ? goals.enabled : base.goals.enabled,
      label: text(goals?.label, base.goals.label),
      badge: text(goals?.badge, base.goals.badge),
      // 줄 수가 바뀌어도 항상 GOAL_LINE_COUNT에 맞춘다.
      lines: base.goals.lines.map((fallback, i) => {
        const line = Array.isArray(goals?.lines) ? goals.lines[i] : undefined
        return typeof line === 'string' ? line : fallback
      }),
    },
    todo: {
      enabled: typeof todo?.enabled === 'boolean' ? todo.enabled : base.todo.enabled,
      label: text(todo?.label, base.todo.label),
      badge: text(todo?.badge, base.todo.badge),
      items: Array.isArray(todo?.items) ? (todo.items as HeaderConfig['todo']['items']) : [],
    },
    memo: {
      enabled: typeof memo?.enabled === 'boolean' ? memo.enabled : base.memo.enabled,
      label: text(memo?.label, base.memo.label),
      badge: text(memo?.badge, base.memo.badge),
      text: typeof memo?.text === 'string' ? memo.text : base.memo.text,
    },
  }
}

/**
 * 저장된 데이터를 현재 문서 형태로 맞춘다.
 * 되살릴 수 없으면 null을 준다. 호출부는 null을 "새 문서로 시작"으로 처리한다.
 *
 * 알려진 필드만 골라 새 문서를 만든다. `...raw`로 통째로 퍼뜨리면 예전 버전이
 * 남긴 필드가 그대로 딸려 들어와, 없앤 기능의 흔적이 계속 저장된다.
 */
export function migrateDoc(raw: unknown): ScheduleDoc | null {
  if (!isObject(raw)) return null
  if (raw.version !== DOC_VERSION) return null
  if (typeof raw.year !== 'number' || typeof raw.month !== 'number') return null
  if (!isObject(raw.header) || !isObject(raw.days)) return null

  const base = createEmptyDoc(raw.year, raw.month)
  return {
    version: DOC_VERSION,
    year: raw.year,
    month: raw.month,
    header: mergeHeader(base.header, raw.header),
    days: raw.days as ScheduleDoc['days'],
    themeId: typeof raw.themeId === 'string' ? raw.themeId : base.themeId,
    fontId: typeof raw.fontId === 'string' ? raw.fontId : base.fontId,
    backgroundAssetId:
      typeof raw.backgroundAssetId === 'string' ? raw.backgroundAssetId : null,
    stickers: Array.isArray(raw.stickers) ? (raw.stickers as ScheduleDoc['stickers']) : [],
  }
}
