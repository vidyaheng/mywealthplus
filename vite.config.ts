import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // --- ส่วนของเดิมที่คุณมีอยู่ ---
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // alias สำหรับ shadcn/ui
      '@': path.resolve(__dirname, './src'),
    },
  },

  // --- ส่วนของ Proxy ที่เพิ่มเข้าไปใหม่ ---
  server: {
    proxy: {
      // เมื่อมีการเรียก path ที่ขึ้นต้นด้วย /api
      '/api': {
        // ให้ส่งต่อไปที่ backend server ของเราที่รันอยู่ที่ port 3001
        target: 'http://localhost:3001',
        // จำเป็นสำหรับการเปลี่ยน host
        changeOrigin: true,
      },
    },
  },
})