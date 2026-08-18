import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { UpdatePrompt, type RegisterUpdates } from './UpdatePrompt'
import './index.css'

/**
 * 서비스 워커 등록은 여기서만 한다.
 *
 * `virtual:pwa-register`는 빌드 때 만들어지는 가상 모듈이라 테스트 환경에는
 * 존재하지 않는다. 그래서 이 모듈을 아무도 import하지 않게 두고, 화면은
 * 주입받은 함수만 쓴다. 모듈 수준 상수인 이유는 매 렌더마다 새 함수가 되면
 * 등록이 반복되기 때문이다.
 *
 * 갱신 함수의 인자는 vite-plugin-pwa 0.13.2부터 쓰이지 않는다. 부르면
 * 새 서비스 워커로 갈아타고 페이지를 다시 띄운다.
 */
const register: RegisterUpdates = (onNeedRefresh) => registerSW({ onNeedRefresh })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdatePrompt register={register} />
  </StrictMode>,
)
