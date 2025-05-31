import React, { useState } from 'react';

// เพิ่มบรรทัดนี้ กำหนด type ของ props
type PinFormProps = {
  onSuccess: () => void;
};

const PinForm: React.FC<PinFormProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const res = await fetch('http://localhost:3001/api/verify-pin', {
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