import { useRef } from 'react'
import { PreviewStage } from './editor/PreviewStage'
import { createEmptyDoc } from './model/defaults'
import { ScheduleCanvas } from './preview/ScheduleCanvas'

function sampleDoc() {
  const doc = createEmptyDoc(2026, 8)
  doc.days['2026-08-01'] = {
    text: '저챗\n20:00', dateColor: null, cellFill: null, marker: null,
  }
  doc.days['2026-08-03'] = {
    text: '발로란트 랭크 올리기 방송\n플래티넘 찍을 때까지 안 잠',
    dateColor: null, cellFill: null, marker: '#ffe680',
  }
  doc.days['2026-08-06'] = {
    text: '신작 게임', dateColor: '#e2445c', cellFill: '#ffd6e0', marker: null,
  }
  doc.header.memo = { enabled: true, text: '8월은 휴방이 많아요\n양해 부탁드립니다' }
  doc.header.todo = {
    enabled: true,
    items: [
      { text: '신작 게임 리스트 정리', checked: true },
      { text: '합방 일정 확정', checked: false },
      { text: '썸네일 새로 만들기', checked: false },
    ],
  }
  doc.footer = { enabled: true, text: '*방송 일정은 사정에 따라 변경될 수 있어요 :D' }
  return doc
}

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const doc = sampleDoc()

  return (
    <div style={{ padding: 24, maxWidth: 1900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>월간 스케줄표 만들기</h1>
      <PreviewStage>
        <ScheduleCanvas ref={canvasRef} doc={doc} />
      </PreviewStage>
    </div>
  )
}
