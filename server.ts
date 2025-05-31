// server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import AccessLog from './accessLog';

const app = express();
app.use(cors());
app.use(express.json());

// หาก deploy บน production ที่มี reverse proxy (เช่น nginx, Heroku, Vercel ฯลฯ) ให้เปิด trust proxy เพื่อให้ req.ip ได้ค่า IP จริง
app.set('trust proxy', true);

// --- ⭐ จุดตรวจสอบสำคัญ ⭐ ---
const MONGODB_URI = 'mongodb+srv://vidyah:KpKf%400713@mywealthyplusagentcode.rxhm0mh.mongodb.net/iwealthy?retryWrites=true&w=majority&appName=myWealthyPlusAgentCode';

mongoose.connect(MONGODB_URI)
  .then(() => {
    // ถ้าเชื่อมต่อสำเร็จ จะแสดงข้อความนี้ใน Console ของ Server
    console.log('🎉 MongoDB Connected Successfully!');
  })
  .catch(err => {
    // ถ้าเชื่อมต่อล้มเหลว จะแสดง Error นี้ใน Console ของ Server
    console.error('🔥 MongoDB Connection Error:', err);
    // ในบางกรณีที่ร้ายแรง อาจจะต้องการให้ server หยุดทำงานไปเลย
    // process.exit(1);
  });
// --- ⭐ สิ้นสุดจุดตรวจสอบสำคัญ ⭐ ---

const allowedPins = ['104669','114252','114460','126641','126666','130079','132987',"094373"];

app.post('/api/verify-pin', async (req: Request, res: Response) => {
  console.log('Request received at /api/verify-pin');
  console.log('Request body:', req.body);
  const { pin } = req.body || {};
  console.log('Extracted PIN:', pin);
  const ok = allowedPins.includes(pin);

  // ใช้ req.ip เสมอ (Express จะจัดการ x-forwarded-for ให้เองถ้า set trust proxy)
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';


  try {
    // ตรวจสอบสถานะการเชื่อมต่อก่อนพยายามเขียน (optional แต่ช่วย debug)
    if (mongoose.connection.readyState !== 1) { // 1 คือ connected
        console.warn('MongoDB not connected. Skipping log save.');
        // คุณอาจจะเลือกที่จะไม่โยน error ที่นี่ แต่แค่ log คำเตือน
        // หรือจะโยน error เพื่อให้ client รู้ว่ามีปัญหาภายในก็ได้
    } else {
        await AccessLog.create({
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          pin,
          success: ok,
          userAgent: req.headers['user-agent'] || '',
        });
        console.log('Log saved!');
    }
  } catch (e) {
    console.error('Save log error:', e);
  }

  res.status(ok ? 200 : 401).json(ok ? { success: true } : { success: false, error: 'Invalid PIN' });
});

const PORT = process.env.PORT || 3001; // ใช้ PORT จาก environment variable ถ้ามี
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));