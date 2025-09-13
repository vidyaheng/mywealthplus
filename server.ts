// server.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import AccessLog from './accessLog';
import { allowedPins } from './allowedPins';
import ProjectData from './projectData';

const app = express();
app.use(cors());
app.use(express.json());

// หาก deploy บน production ที่มี reverse proxy (เช่น nginx, Heroku, Vercel ฯลฯ) ให้เปิด trust proxy เพื่อให้ req.ip ได้ค่า IP จริง
app.set('trust proxy', true);

// --- ⭐ จุดตรวจสอบสำคัญ ⭐ ---
// 1. ดึงค่า MONGODB_URI จาก Environment Variable
const MONGODB_URI = process.env.MONGODB_URI;

// 2. (สำคัญมาก) เพิ่มโค้ดตรวจสอบว่ามี MONGODB_URI หรือไม่
// ถ้าไม่มี ให้ Server หยุดทำงานไปเลย เพื่อป้องกันข้อผิดพลาด
if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in environment variables.');
  process.exit(1); // 1 หมายถึงการออกจากโปรแกรมเพราะมีข้อผิดพลาด
}

// 3. ใช้ค่าที่ดึงมาในการเชื่อมต่อ
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🎉 MongoDB Connected Successfully!');
  })
  .catch(err => {
    console.error('🔥 MongoDB Connection Error:', err);
    process.exit(1);
  });

// ฟัง event เพิ่มเติม
mongoose.connection.on('disconnected', () => {
  console.error('⚠️ MongoDB disconnected!');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected!');
});
// --- ⭐ สิ้นสุดจุดตรวจสอบสำคัญ ⭐ ---

// --- Endpoint เดิมสำหรับ Verify PIN

app.post('/api/verify-pin', async (req: Request, res: Response) => {
  console.log('Request received at /api/verify-pin');
  console.log('Request body:', req.body);
  const pin = typeof req.body === 'object' && req.body ? req.body.pin : undefined;
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
          ip,
          pin,
          success: ok,
          userAgent
        });
        console.log('Log saved!');
    }
  } catch (e) {
    console.error('Save log error:', e);
  }

  res.status(ok ? 200 : 401).json(ok ? { success: true } : { success: false, error: 'Invalid PIN' });
});

// --- ⭐ 2. เพิ่ม Endpoint ใหม่สำหรับบันทึกข้อมูล Project ---
app.post('/api/save-project', async (req: Request, res: Response) => {
  try {
    const { pin, projectName, recordName, data } = req.body;

    // --- ตรวจสอบข้อมูลเบื้องต้น ---
    if (!pin || !projectName || !recordName || !data) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return; // แค่หยุด function ไม่ต้อง return res
    }
    
    // ตรวจสอบว่า pin ที่ส่งมา มีสิทธิ์บันทึกหรือไม่ (ใช้ allowedPins เดิม)
    if (!allowedPins.includes(pin)) {
      res.status(403).json({ success: false, error: 'Forbidden: Invalid PIN' });
      return;
    }


    // --- สร้างข้อมูลใหม่โดยใช้ Model `ProjectData` ---
    const newProjectData = await ProjectData.create({
      pin,
      projectName,
      recordName,
      data
    });
    
    console.log(`🚀 Data saved for project: ${projectName}, PIN: ${pin}`);

    // ส่ง response กลับไปว่าสำเร็จ พร้อมข้อมูลที่เพิ่งบันทึกไป
    res.status(201).json({ success: true, savedData: newProjectData });

  } catch (error) {
    console.error('🔥 Error saving project data:', error);
    // ถ้าเกิด Error (เช่น ข้อมูลที่ส่งมาไม่ตรงตาม Schema) ให้ส่ง 500
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- Endpoint สำหรับ "เรียกดูรายการ" ที่เคยบันทึกไว้ ---
app.get('/api/records/:pin', async (req: Request, res: Response) => {
  try {
    const { pin } = req.params;
    // อ่านค่า ADMIN_PIN จาก .env (ต้องแน่ใจว่ามีใน .env)
    const ADMIN_PIN = process.env.ADMIN_PIN;
    let query = {};

    if (pin === ADMIN_PIN) {
      // ถ้าเป็น Admin, query จะเป็นค่าว่าง ({}) เพื่อดึงข้อมูลทั้งหมด
      console.log(`Admin access by PIN: ${pin}`);
    } else {
      // ถ้าเป็น User ทั่วไป, ให้ query เฉพาะข้อมูลของตัวเอง
      query = { pin: pin };
    }

    const records = await ProjectData.find(query)
      .select('_id recordName projectName createdAt pin')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, records });

  } catch (error) {
    console.error('🔥 Error fetching records:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- Endpoint สำหรับ "โหลดข้อมูล" ของ Record ที่เลือก ---
app.get('/api/record/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userPin = req.headers['x-user-pin'] as string;
    const ADMIN_PIN = process.env.ADMIN_PIN;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid record ID' });
    }

    const record = await ProjectData.findById(id);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    
    // Security Check: อนุญาตให้ Admin หรือเจ้าของข้อมูลเข้าถึงเท่านั้น
    if (userPin !== ADMIN_PIN && userPin !== record.pin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.status(200).json({ success: true, record });

  } catch (error) {
    console.error('🔥 Error fetching single record:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- ⭐ Endpoint ใหม่สำหรับ "ลบข้อมูล" ---
app.delete('/api/record/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userPin = req.headers['x-user-pin'] as string;
    const ADMIN_PIN = process.env.ADMIN_PIN;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid record ID' });
    }
    
    // 1. ค้นหา record ก่อนเพื่อตรวจสอบสิทธิ์
    const record = await ProjectData.findById(id);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // 2. Security Check: อนุญาตให้ Admin หรือเจ้าของข้อมูลเท่านั้นที่ลบได้
    if (userPin !== ADMIN_PIN && userPin !== record.pin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // 3. ถ้ามีสิทธิ์ ให้ทำการลบ
    await ProjectData.findByIdAndDelete(id);

    console.log(`🗑️ Record deleted: ${id} by PIN: ${userPin}`);
    res.status(200).json({ success: true, message: 'Record deleted successfully' });

  } catch (error) {
    console.error('🔥 Error deleting record:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3001; // ใช้ PORT จาก environment variable ถ้ามี
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));