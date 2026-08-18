import { useEffect, useRef, useState } from 'react'

/**
 * 서비스 워커를 등록하고 새 버전 감지를 구독한다.
 * 돌려주는 함수를 부르면 새 버전으로 갈아타고 페이지를 다시 띄운다.
 *
 * 이 함수를 주입받는 이유는 진짜 구현이 `virtual:pwa-register`에 있기 때문이다.
 * 그 모듈은 빌드 때만 만들어지는 가상 모듈이라 테스트에서 불러올 수 없다.
 * 등록은 `main.tsx`가 맡고, 이 컴포넌트는 화면만 책임진다.
 */
export type RegisterUpdates = (onNeedRefresh: () => void) => () => void

export type UpdatePromptProps = {
  register: RegisterUpdates
}

const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: 16,
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: 8,
  background: '#18181b',
  color: '#fafafa',
  fontSize: 13,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
  // 편집 팝오버·바텀시트보다 위에 있어야 한다.
  zIndex: 1000,
}

const primaryStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: 0,
  borderRadius: 6,
  background: '#fafafa',
  color: '#18181b',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

const dismissStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  color: '#a1a1aa',
  fontSize: 13,
  cursor: 'pointer',
}

/**
 * 새 버전이 배포되면 배너를 띄운다.
 *
 * 예전에는 감지 즉시 페이지를 새로고침했다(`registerType: 'autoUpdate'`).
 * 자동저장이 400ms 디바운스라 입력은 대개 살아남지만, 일정을 채우던 사람에게는
 * 화면이 이유 없이 초기화된 것으로 보여 버그와 구분되지 않는다.
 * 그래서 갈아타는 시점을 사용자가 정하게 한다.
 *
 * 닫아도 상태를 저장하지 않는다. 다음 방문에 다시 뜨는 편이 맞다 —
 * 새 버전은 계속 기다리고 있고, 언젠가는 알려야 한다.
 */
export function UpdatePrompt({ register }: UpdatePromptProps) {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const updateRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    updateRef.current = register(() => setNeedRefresh(true))
  }, [register])

  if (!needRefresh || dismissed) return null

  return (
    <div style={bannerStyle} role="status">
      <span>새 버전이 있습니다.</span>
      <button type="button" style={primaryStyle} onClick={() => updateRef.current?.()}>
        새로고침
      </button>
      <button type="button" style={dismissStyle} onClick={() => setDismissed(true)}>
        닫기
      </button>
    </div>
  )
}
