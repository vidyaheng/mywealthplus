// server.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import AccessLog from '../accessLog'; // <-- ตรวจสอบ Path ให้ถูกต้อง
import { allowedPins } from '../allowedPins'; // <-- ตรวจสอบ Path ให้ถูกต้อง
import ProjectData from '../projectData'; // <-- ตรวจสอบ Path ให้ถูกต้อง

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

// --- ส่วนของการเชื่อมต่อ MongoDB (ทำงานครั้งเดียวตอนเปิด Server) ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in environment variables.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🎉 MongoDB Connected Successfully!');
  })
  .catch(err => {
    console.error('🔥 MongoDB Connection Error:', err);
    process.exit(1);
  });

// --- Endpoint สำหรับ Verify PIN (แก้ไขแล้ว) ---
app.post('/api/verify-pin', async (req: Request, res: Response) => {
  // --- 1. Log เริ่มต้นการทำงาน ---
  console.log('--- [Vercel Log] Verify PIN Endpoint Start ---');

  const pin = typeof req.body === 'object' && req.body ? req.body.pin : undefined;
  const ok = allowedPins.includes(pin);
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';

  // --- 2. Log สถานะการเชื่อมต่อ MongoDB (สำคัญที่สุด!) ---
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  console.log(`[Vercel Log] Mongoose connection readyState: ${mongoose.connection.readyState}`);

  try {
    // --- 3. Log ก่อนที่จะสั่งเขียน DB ---
    console.log('[Vercel Log] Attempting to call AccessLog.create...');
    
    await AccessLog.create({
      ip,
      pin,
      success: ok,
      userAgent
    });

    // --- 4. Log เมื่อคำสั่งเขียน DB ทำงานจบ (โดยไม่ Error) ---
    console.log('[Vercel Log] SUCCESS: AccessLog.create completed without error.');

  } catch (e) {
    // --- 5. Log Error แบบละเอียด หากเกิดปัญหาขึ้นจริงๆ ---
    console.error('[Vercel Log] CRITICAL: Save log error was caught!', e);
  }

  // --- 6. Log ตอนจบการทำงาน ---
  console.log('--- [Vercel Log] Verify PIN Endpoint End ---');

  res.status(ok ? 200 : 401).json(ok ? { success: true } : { success: false, error: 'Invalid PIN' });
});

// --- Endpoint ใหม่สำหรับบันทึกข้อมูล Project ---
app.post('/api/save-project', async (req: Request, res: Response) => {
  try {
    const { pin, projectName, recordName, data } = req.body;

    if (!pin || !projectName || !recordName || !data) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    if (!allowedPins.includes(pin)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Invalid PIN' });
    }

    const newProjectData = await ProjectData.create({
      pin,
      projectName,
      recordName,
      data
    });
    
    console.log(`🚀 Data saved for project: ${projectName}, PIN: ${pin}`);
    res.status(201).json({ success: true, savedData: newProjectData });

  } catch (error) {
    console.error('🔥 Error saving project data:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- Endpoint สำหรับ "เรียกดูรายการ" ที่เคยบันทึกไว้ ---
app.get('/api/records/:pin', async (req: Request, res: Response) => {
  try {
    const { pin } = req.params;
    const ADMIN_PIN = process.env.ADMIN_PIN;
    let query = {};

    if (pin === ADMIN_PIN) {
      console.log(`Admin access by PIN: ${pin}`);
    } else {
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
    
    if (userPin !== ADMIN_PIN && userPin !== record.pin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.status(200).json({ success: true, record });

  } catch (error) {
    console.error('🔥 Error fetching single record:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- Endpoint สำหรับ "ลบข้อมูล" ---
app.delete('/api/record/:id', async (req: Request, res: Response) => {
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

    if (userPin !== ADMIN_PIN && userPin !== record.pin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await ProjectData.findByIdAndDelete(id);

    console.log(`🗑️ Record deleted: ${id} by PIN: ${userPin}`);
    res.status(200).json({ success: true, message: 'Record deleted successfully' });

  } catch (error) {
    console.error('🔥 Error deleting record:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- Endpoint สำหรับ "อัปเดต/บันทึกทับ" ข้อมูล ---
app.put('/api/record/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userPin = req.headers['x-user-pin'] as string;
    const ADMIN_PIN = process.env.ADMIN_PIN;
    
    // ข้อมูลใหม่ที่จะอัปเดต
    const { recordName, data } = req.body;

    // --- ตรวจสอบข้อมูลเบื้องต้น ---
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid record ID' });
    }
    if (!recordName || !data) {
        return res.status(400).json({ success: false, error: 'Missing required fields for update' });
    }
    
    // 1. ค้นหา record เดิมก่อนเพื่อตรวจสอบสิทธิ์
    const record = await ProjectData.findById(id);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // 2. Security Check: อนุญาตให้ Admin หรือเจ้าของข้อมูลเท่านั้นที่แก้ไขได้
    if (userPin !== ADMIN_PIN && userPin !== record.pin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // 3. ถ้ามีสิทธิ์ ให้ทำการอัปเดต
    const updatedRecord = await ProjectData.findByIdAndUpdate(
      id,
      {
        recordName, // อัปเดตชื่อ
        data        // อัปเดตข้อมูลโปรเจกต์
      },
      { new: true } // Option นี้เพื่อให้ Mongoose ส่งข้อมูลที่อัปเดตแล้วกลับมา
    );

    console.log(`📝 Record updated: ${id} by PIN: ${userPin}`);
    res.status(200).json({ success: true, updatedRecord });

  } catch (error) {
    console.error('🔥 Error updating record:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// --- ส่วนของการ Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));