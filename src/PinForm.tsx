// src/components/PinForm.tsx

import React, { useState, useRef, useEffect } from 'react';

// กำหนด type ของ props
type PinFormProps = {
  onSuccess: () => void;
};

const PinForm: React.FC<PinFormProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // เพิ่ม state สำหรับจัดการสถานะ loading
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // ป้องกันการกดซ้ำ

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      // --- จุดที่แก้ไข 1: ตรวจสอบสถานะการตอบกลับก่อน ---
      // res.ok จะเป็น true ถ้า HTTP status คือ 200-299 (สำเร็จ)
      if (!res.ok) {
        // ถ้าเซิร์ฟเวอร์มีปัญหา (เช่น 500 error) ให้โยน Error เพื่อให้ catch จัดการ
        throw new Error(`เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${res.status}`);
      }
      
      // --- จุดที่แก้ไข 2: แยกส่วนการอ่าน JSON ---
      // ถ้า res.ok เป็น true เรามั่นใจได้ว่าเซิร์ฟเวอร์ส่งข้อมูลมาถูกต้อง
      const data = await res.json();
      
      if (data.success) {
        setResult(null);
        onSuccess();
      } else {
        setResult('PIN ไม่ถูกต้อง');
      }

    } catch (error) {
      // --- จุดที่แก้ไข 3: ดักจับ Error ทั้งหมดที่เกิดขึ้น ---
      console.error('เกิดข้อผิดพลาดในการยืนยัน PIN:', error);
      // แสดงข้อความที่เป็นมิตรกับผู้ใช้
      setResult('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      // ไม่ว่าจะสำเร็จหรือล้มเหลว ให้หยุด loading เสมอ
      setIsLoading(false);
      // ล้างค่า pin หลังจากพยายามแล้ว เพื่อความปลอดภัย
      setPin(''); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center h-screen bg-blue-50">
      <div className="bg-white p-8 rounded shadow-md w-80 flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">กรอกรหัส PIN เพื่อเข้าใช้งาน</h2>
        <input
          ref={inputRef}
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="รหัส PIN"
          className="border p-2 rounded mb-4 w-full"
          disabled={isLoading} // ปิด input ตอนกำลังโหลด
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full disabled:bg-gray-400"
          disabled={isLoading} // ปิดปุ่มตอนกำลังโหลด
        >
          {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยัน'}
        </button>
        {result && <div className="text-red-500 mt-3">{result}</div>}
      </div>
    </form>
  );
};

export default PinForm;