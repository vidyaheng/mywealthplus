import React, { useState, useRef, useEffect } from 'react';

// กำหนด type ของ props
type PinFormProps = {
  onSuccess: () => void;
};

const PinForm: React.FC<PinFormProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<string | null>(null);
  
  // ✨ 1. สร้าง ref เพื่ออ้างอิงไปยัง element ของ input
  const inputRef = useRef<HTMLInputElement>(null);

  // ✨ 2. ใช้ useEffect เพื่อสั่ง focus เมื่อ component ถูก render ครั้งแรก
  useEffect(() => {
    // ตรวจสอบว่า ref ได้ถูกผูกกับ input element แล้ว
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []); // dependency array ว่าง [] หมายถึงให้ effect นี้ทำงานแค่ครั้งเดียวตอน mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const res = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (data.success) {
      setResult(null);
      onSuccess();
    } else {
      setResult('PIN ไม่ถูกต้อง');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center h-screen bg-blue-50">
      <div className="bg-white p-8 rounded shadow-md w-80 flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">กรอกรหัส PIN เพื่อเข้าใช้งาน</h2>
        <input
          // ✨ 3. ผูก ref ที่สร้างไว้กับ input element นี้
          ref={inputRef}
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="รหัส PIN"
          className="border p-2 rounded mb-4 w-full"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
        >
          ยืนยัน
        </button>
        {result && <div className="text-red-500 mt-3">{result}</div>}
      </div>
    </form>
  );
};

export default PinForm;