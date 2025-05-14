// components/TopButtons.tsx (ฉบับเต็ม รองรับ 2 Callbacks)

import React from "react";
// Import icons ที่ต้องการใช้งาน
import {
  FaPlusCircle,    // สำหรับ เพิ่ม/ลดทุน
  FaCalendarAlt,   // สำหรับ เปลี่ยนงวดชำระ (ตัวอย่าง)
  FaPauseCircle,   // สำหรับ หยุดพักชำระ
  FaHandHoldingUsd,// สำหรับ วางแผนถอนเงิน
  FaMoneyBillWave  // สำหรับ ลงทุนเพิ่ม
} from 'react-icons/fa';

// ข้อมูลปุ่ม พร้อม ID ที่ไม่ซ้ำกัน
const topActions = [
  { id: "reduceSI", label: "เพิ่ม/ลดทุน", icon: FaPlusCircle },
  { id: "changeFreq", label: "เปลี่ยนงวดชำระ", icon: FaCalendarAlt }, // ปุ่มใหม่
  { id: "pause", label: "หยุดพักชำระ", icon: FaPauseCircle },
  { id: "withdrawPlan", label: "วางแผนถอนเงิน", icon: FaHandHoldingUsd },
  { id: "addInvest", label: "ลงทุนเพิ่ม", icon: FaMoneyBillWave },
];

// --- 1. Interface สำหรับ Props ---
// กำหนดว่า Component นี้รับฟังก์ชันอะไรมาบ้างจาก Parent (App.tsx)
interface TopButtonsProps {
  onOpenReduceModal: () => void;       // ฟังก์ชันเปิด Modal ลดทุน
  onOpenChangeFreqModal: () => void;  // ฟังก์ชันเปิด Modal เปลี่ยนงวด
  onOpenWithdrawalModal: () => void; // ฟังก์ชันเปิด Modal ถอนเงิน
  onOpenPauseModal: () => void;  // ฟังก์ชันเปิด Modal หยุดพักชำระเบี้ย
  onOpenAddInvestmentModal: () => void; // ฟังก์ชันเปิด Modal ลงทุนเพิ่ม
  // สามารถเพิ่ม Props สำหรับปุ่มอื่นๆ ได้ตามต้องการ
}
// --- ---

// --- 2. Component Function รับ Props ---
export default function TopButtons({
  onOpenReduceModal,
  onOpenChangeFreqModal,
  onOpenWithdrawalModal,
  onOpenPauseModal,
  onOpenAddInvestmentModal
}: TopButtonsProps) {
// --- ---

  // --- 3. Handler สำหรับจัดการการกดปุ่ม ---
  const handleActionClick = (actionId: string) => {
    // ตรวจสอบ ID ของปุ่มที่ถูกกด
    if (actionId === "reduceSI") {onOpenReduceModal();} // เรียกฟังก์ชันเปิด Modal ลดทุนที่รับมา 
      else if (actionId === "changeFreq") {onOpenChangeFreqModal();} // เรียกฟังก์ชันเปิด Modal เปลี่ยนงวดที่รับมา
      else if (actionId === "withdrawPlan") { onOpenWithdrawalModal();} // เรียกฟังก์ชันเปิด Modal ถอนเงินที่รับมา
      else if (actionId === "pause") {onOpenPauseModal();} // เรียกฟังก์ชั่นเปิด Modal หยุดพักชำระเบี้ย
      else if (actionId === "addInvest") { onOpenAddInvestmentModal(); } // เรียกฟังก์ชั่นเปิด Modal ลงทุนเพิ่ม
      else {
      // จัดการ Action ของปุ่มอื่นๆ (ถ้ามี)
      console.log("Clicked Top Button:", actionId);
    }
  };
  // --- ---

  // --- 4. JSX สำหรับ Render ปุ่ม ---
  return (
    // Container จัดชิดขวา, กำหนดพื้นหลัง, padding, gap
    // (ปรับแก้ className ตามต้องการเพื่อให้ Layout สวยงามเมื่อมี 5 ปุ่ม)
    <div className="flex justify-end gap-2 p-2 bg-blue-50"> {/* อาจจะลด p / gap */}
      {/* วน Loop สร้างปุ่มจาก Array topActions */}
      {topActions.map((action) => (
        <button
          key={action.id} // ใช้ id เป็น key
          // กำหนด Style ของปุ่ม (อาจจะต้องปรับ w- หรือ font ให้เล็กลงถ้า 5 ปุ่มเบียดกัน)
          className="flex flex-col items-center gap-0.5 p-1 text-[10px] sm:text-xs text-blue-700 rounded hover:bg-blue-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300 w-16 text-center"
          // กำหนด onClick ให้เรียก handler พร้อมส่ง id
          onClick={() => handleActionClick(action.id)}
        >
          {/* ไอคอน */}
          <div className="text-lg sm:text-xl text-blue-600 h-5 sm:h-6 flex items-center justify-center">
             {React.createElement(action.icon)}
          </div>
          {/* ข้อความ Label */}
          <span className="font-medium leading-tight">{action.label}</span>
        </button>
      ))}
    </div>
  );
  // --- จบ ส่วน JSX ---
}