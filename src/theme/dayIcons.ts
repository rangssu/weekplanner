import game from '../assets/dayIcons/game.png'
import movie from '../assets/dayIcons/movie.png'
import note from '../assets/dayIcons/note.png'
import pen from '../assets/dayIcons/pen.png'
import restHanja from '../assets/dayIcons/rest-hanja.png'
import restKo from '../assets/dayIcons/rest-ko.png'
import star from '../assets/dayIcons/star.png'
import talk from '../assets/dayIcons/talk.png'
import together from '../assets/dayIcons/together.png'

export type DayIcon = {
  /** 저장된 문서가 참조하는 값. 한 번 정하면 바꾸지 않는다. */
  id: string
  /** 고르는 버튼의 aria-label */
  label: string
  /** Vite가 해시를 붙여 내보낸 자산 URL */
  src: string
}

/**
 * 날짜 칸에 찍을 수 있는 아이콘.
 *
 * id를 파일명(1.png…)이 아니라 뜻으로 둔 이유: 나중에 그림을 교체해도
 * 저장된 문서가 그대로 동작하고, 순서를 바꿔도 안전하다.
 */
export const DAY_ICONS: DayIcon[] = [
  { id: 'star', label: '별', src: star },
  { id: 'game', label: '게임', src: game },
  { id: 'movie', label: '영화', src: movie },
  { id: 'together', label: '합방', src: together },
  { id: 'note', label: '메모', src: note },
  { id: 'pen', label: '그림', src: pen },
  { id: 'talk', label: '저챗', src: talk },
  { id: 'rest-ko', label: '휴방', src: restKo },
  { id: 'rest-hanja', label: '휴', src: restHanja },
]

/**
 * id로 아이콘을 찾는다. 모르는 id면 undefined.
 *
 * 예전 문서나 손으로 고친 저장소에 등록되지 않은 id가 들어 있을 수 있다.
 * 그럴 때 깨진 이미지를 결과 PNG에 박느니 아무것도 안 그리는 쪽이 낫다.
 */
export function getDayIcon(id: string | undefined): DayIcon | undefined {
  if (id === undefined) return undefined
  return DAY_ICONS.find((icon) => icon.id === id)
}
