import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'buffer': 'buffer',
    },
  },

  // แก้ไขส่วน define ให้รองรับการดึงค่า VITE_ALLOWED_PINS
  define: {
    // แทนที่จะปล่อยว่าง ให้ระบุตัวแปรที่เราต้องการใช้ลงไปครับ
    'process.env.VITE_ALLOWED_PINS': JSON.stringify(process.env.VITE_ALLOWED_PINS),
    'process.env.VITE_ADMIN_PIN': JSON.stringify(process.env.VITE_ADMIN_PIN),
    // คงส่วน global ไว้ตามเดิมของคุณ
    global: {},
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})