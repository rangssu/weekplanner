import { useRef } from 'react'
import { PreviewStage } from './editor/PreviewStage'
import { createEmptyDoc } from './model/defaults'
import { ScheduleCanvas } from './preview/ScheduleCanvas'

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const doc = createEmptyDoc(2026, 8)

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>월간 스케줄표 만들기</h1>
      <PreviewStage>
        <ScheduleCanvas ref={canvasRef} doc={doc} />
      </PreviewStage>
    </div>
  )
}
