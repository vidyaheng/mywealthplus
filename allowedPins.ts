// allowpin.ts

// ตรวจสอบว่ามีค่าจาก Vite (หน้าบ้าน) หรือ Node.js (หลังบ้าน)
const rawPins = 
  (import.meta.env && import.meta.env.VITE_ALLOWED_PINS) || // สำหรับ React/Vite
  (process && process.env && process.env.VITE_ALLOWED_PINS) || // สำหรับ Node.js (Backend)
  "";

export const allowedPins: string[] = rawPins
  .split(',')
  .map((pin: string) => pin.trim())
  .filter((pin: string) => pin !== "");