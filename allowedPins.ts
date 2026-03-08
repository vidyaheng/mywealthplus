// allowpin.ts

/**
 * วิธีที่ปลอดภัยที่สุดสำหรับ Vercel (รองรับทั้ง Next.js API และ React)
 * เราจะหลีกเลี่ยงการใช้คำว่า 'import.meta' ตรงๆ เพื่อไม่ให้ Node.js ฟ้อง SyntaxError
 */

const getRawPins = (): string => {
  // 1. ลองดึงจาก process.env (วิธีมาตรฐานของ Node.js และ Vercel)
  if (typeof process !== 'undefined' && process.env && process.env.VITE_ALLOWED_PINS) {
    return process.env.VITE_ALLOWED_PINS;
  }

  // 2. สำหรับ Vite ในช่วง Build Time บางครั้งจะมองเห็นตัวแปรผ่าน global
  // หรือใช้การเช็คแบบอ้อมๆ เพื่อไม่ให้ SyntaxError ตอน Runtime
  try {
    // ใช้เครื่องหมาย [] เพื่อหลีกเลี่ยงการโดน Static Analysis ของ Node.js จับได้
    // @ts-ignore
    return (import.meta['env']?.VITE_ALLOWED_PINS) || "";
  } catch (e) {
    return "";
  }
};

const rawPins = getRawPins();

export const allowedPins: string[] = rawPins
  .split(',')
  .map((pin: string) => pin.trim())
  .filter((pin: string) => pin !== "");