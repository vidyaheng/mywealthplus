// allowpin.ts

// 1. สร้างฟังก์ชันเพื่อดึงค่าอย่างปลอดภัย
const getPins = (): string => {
  // ลองดึงจาก process.env (สำหรับ Node.js / Vercel Backend)
  if (typeof process !== 'undefined' && process.env && process.env.VITE_ALLOWED_PINS) {
    return process.env.VITE_ALLOWED_PINS;
  }
  
  // ลองดึงจาก Vite (สำหรับ React Frontend)
  // ใช้ @ts-ignore เพื่อไม่ให้ TypeScript บ่น และใช้เช็คตัวแปรแบบ String เพื่อเลี่ยง SyntaxError
  try {
    // @ts-ignore
    return import.meta.env.VITE_ALLOWED_PINS || "";
  } catch (e) {
    return "";
  }
};

const rawPins = getPins();

export const allowedPins: string[] = rawPins
  .split(',')
  .map((pin: string) => pin.trim())
  .filter((pin: string) => pin !== "");