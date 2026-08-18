import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 하위 경로 배포에서도 자산 경로가 깨지지 않게 한다.
  base: './',
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate'는 새 버전을 감지하는 즉시 묻지 않고 새로고침한다. 일정을
      // 채우던 사람에게는 화면이 이유 없이 초기화된 것으로 보인다. 갈아타는
      // 시점은 UpdatePrompt가 사용자에게 묻는다.
      registerType: 'prompt',
      // 등록 코드를 플러그인이 따로 주입하지 않게 한다. main.tsx가 직접
      // registerSW를 부르므로, 켜 두면 등록 경로가 둘이 된다.
      injectRegister: null,
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '월간 스케줄표 만들기',
        short_name: '스케줄표',
        description: '년·월을 고르고 일정을 채우면 스케줄표 이미지를 만들어 줍니다.',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f4f4f5',
        theme_color: '#18181b',
        // 편집 화면이 가로로 넓을수록 쓰기 편하지만, 폰 세로도 쓸 수 있게 열어둔다.
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 번들된 한국어 폰트가 400KB라 기본 한도(2MB)로는 충분하지만
        // 나중에 폰트를 더 넣어도 캐시에서 빠지지 않도록 여유를 둔다.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
