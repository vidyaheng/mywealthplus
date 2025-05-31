export default function handler(req: any, res: any) {
  // อ่าน PIN ที่อนุญาตจาก environment variable ถ้าไม่กำหนดจะใช้ค่า default
  const allowedPins = (process.env.ACCESS_PINS || '104669,114252,114460,126641,126666,130079,132987')
    .split(',')
    .map(pin => pin.trim());

  // รับ PIN ที่ผู้ใช้ส่งมา (เช่น { "pin": "123456" })
  const { pin } = req.body;

  // ตรวจสอบว่าตรงกับ PIN ที่อนุญาตหรือไม่
  const ok = allowedPins.includes(pin);

  // Log สำหรับ track การเข้าใช้งาน
  console.log({
    time: new Date().toISOString(),
    pin,
    success: ok,
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
  });

  if (ok) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid PIN' });
  }
}