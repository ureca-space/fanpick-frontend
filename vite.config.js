import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 브라우저의 CORS 차단을 피하기 위해 개발 서버가 API 요청을 대신 전달합니다.
      "/football-api": {
        target: "https://api.football-data.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/football-api/, ""),
      },
    },
  },
});
