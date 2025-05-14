import React from 'react';

// หมายเหตุ: หน้านี้จะ map กับ route "/lifeplan" ใน App.tsx
export default function LifePlanPage() {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">หน้าวางแผนคุ้มครองชีวิต (Life Plan)</h2>
      <p className="text-gray-600">
        (เนื้อหาสำหรับวางแผนคุ้มครองชีวิตจะแสดงที่นี่)
      </p>
      {/* TODO: ใส่เนื้อหาวางแผนคุ้มครองชีวิตที่นี่ */}
    </div>
  );
}