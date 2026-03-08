// allowpin.ts

// 1. ดึงค่าจาก .env
const envPins: string = import.meta.env.VITE_ALLOWED_PINS || "";

// 2. ระบุ Type ให้ pin เป็น : string เพื่อแก้ error ts(7006)
export const allowedPins: string[] = envPins
  .split(',')
  .map((pin: string) => pin.trim()) // ใส่ : string ตรงนี้
  .filter((pin: string) => pin !== "");