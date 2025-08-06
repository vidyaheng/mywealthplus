import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // --- ส่วนของเดิมที่คุณมีอยู่ ---
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // alias สำหรับ shadcn/ui
      '@': path.resolve(__dirname, './src'),
      // --- [เพิ่ม] polyfill สำหรับ Buffer ---
      'buffer': 'buffer',
    },
  },

  // --- [เพิ่ม] define object ที่จำเป็น ---
  define: {
    'process.env': {}
  },

  // --- ส่วนของ Proxy ที่มีอยู่แล้ว ---
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