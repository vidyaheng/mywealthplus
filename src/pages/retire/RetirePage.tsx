// src/pages/retire/RetirePage.tsx
import React from 'react';

// เปลี่ยนชื่อ function เป็น RetirePage
export default function RetirePage() {
  return (
    <div className="p-4 bg-white rounded shadow">
      {/* อาจจะปรับ H2 เล็กน้อยถ้าต้องการ */}
      <h2 className="text-xl font-semibold mb-2">หน้าวางแผนเกษียณ (Retirement Planning)</h2>
      <p className="text-gray-600">
        (เนื้อหาสำหรับวางแผนเกษียณ / บำนาญ จะแสดงที่นี่)
      </p>
      {/* TODO: ใส่เนื้อหาวางแผนเกษียณที่นี่ */}
    </div>
  );
}