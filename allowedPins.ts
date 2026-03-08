// allowpin.ts

// ใช้การเช็คผ่าน process.env อย่างเดียว ซึ่งปลอดภัยทั้งบน Node.js และ Vite (บน Vercel)
const getRawPins = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_ALLOWED_PINS || "";
  }
  return "";
};

const rawPins = getRawPins();

export const allowedPins: string[] = rawPins
  .split(',')
  .map((pin: string) => pin.trim())
  .filter((pin: string) => pin !== "");