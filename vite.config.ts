import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path' // <--- ควรเพิ่ม import นี้ด้วย

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // เพิ่ม alias นี้เพื่อความมั่นใจว่าจะทำงานกับ shadcn/ui
      '@': path.resolve(__dirname, './src'),
    },
  },
})