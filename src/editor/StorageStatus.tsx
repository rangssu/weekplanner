import { useState } from 'react'
import { listAssets, purgeUnusedAssets } from '../model/assets'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

export type StorageStatusProps = {
  api: ScheduleDocApi
}

export function StorageStatus({ api }: StorageStatusProps) {
  const [notice, setNotice] = useState('')

  const handlePurge = async () => {
    const before = (await listAssets()).length
    const removed = await purgeUnusedAssets()
    setNotice(
      removed === 0
        ? `정리할 것이 없습니다. (보관 중 ${before}개)`
        : `사용하지 않는 파일 ${removed}개를 지웠습니다.`,
    )
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>저장 공간</h2>
      {api.saveError === 'quota' && (
        <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 8 }}>
          저장 공간이 가득 찼습니다. 아래 정리를 눌러 보세요.
        </p>
      )}
      <button type="button" style={buttonStyle} onClick={() => void handlePurge()}>
        사용하지 않는 이미지·폰트 정리
      </button>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>
        어떤 달에서도 쓰지 않는 파일만 지웁니다. 지금 쓰는 것은 남습니다.
      </p>
      {notice && <p style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>{notice}</p>}
    </section>
  )
}
