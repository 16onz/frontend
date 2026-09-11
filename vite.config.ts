import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 백엔드는 4000, 프론트는 5173 에서 돌아간다.
// '/api' 로 시작하는 요청을 백엔드로 넘겨주면 프론트 코드는 상대경로만 쓰면 되고
// (src/api.ts 참고) 배포 환경이 바뀌어도 코드를 고칠 필요가 없다.
// 백엔드가 CORS 를 열어 두었으므로 프록시 없이 직접 호출해도 동작하지만,
// 상대경로 쪽이 브라우저 개발자도구에서 요청을 읽기도 쉽다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
