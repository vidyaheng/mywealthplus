// src/pages/iwealthy/IWealthyLayout.tsx

// --- ส่วนที่ 1: Imports ---
//import React from 'react';
// Import Hooks และ Component ที่จำเป็นจาก React Router DOM
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// Import Hook และ Type สำหรับ Context ที่สร้างไว้ใน App.tsx (ปรับ Path ตามต้องการ)
import { useAppOutletContext } from '../../App';
import {Button} from '@/components/ui/button'
import TopButtons from "../../components/TopButtons"; 
import InvestmentReturnInput from "../../components/InvestmentReturnInput"; 
// --- จบ ส่วนที่ 1 ---

// --- ส่วนที่ 2: ข้อมูลสำหรับสร้าง Tabs ---
/**
 * คอนฟิกูเรชันสำหรับแท็บย่อยในหน้า iWealthy
 * แต่ละแท็บประกอบด้วย:
 * - label: ข้อความที่แสดงบนแท็บ
 * - path: URL path สำหรับการนำทาง
 */
const iWealthyTabs = [
 { label: "กรอกข้อมูล", path: "/iwealthy/form" },
 { label: "ตารางสรุปผลประโยชน์", path: "/iwealthy/table" },
 { label: "กราฟแสดงผลประโยชน์", path: "/iwealthy/chart" },
];
// --- จบ ส่วนที่ 2 ---


// --- ส่วนที่ 3: Component หลัก ---
export default function IWealthyLayout() {
  // --- ส่วนที่ 3.1: เรียกใช้ Hooks ---
  const navigate = useNavigate(); // Hook สำหรับเปลี่ยนหน้า
  const location = useLocation(); // Hook สำหรับดู URL ปัจจุบัน
  // *** เรียกใช้ Hook เพื่อรับ Context ที่ส่งมาจาก App.tsx ***
  const context = useAppOutletContext(); // <-- สำคัญ: รับ Context มาเก็บไว้
  // --- จบ ส่วนที่ 3.1 ---

  // --- ส่วนที่ 3.2: ส่วน JSX สำหรับ Render UI ---
  return (
    // Container หลักของ Layout นี้ (ใช้โครงสร้างและ Style เดิมของคุณ)
    <div className="flex flex-col h-auto -mt-2"> {/* พิจารณาเอา -mt-10 ออกถ้าไม่ต้องการ */}

      {/* === ส่วน Tab Bar === */}
      <div className="flex bg-blue-50 px-4 relative">
        {/* วน Loop สร้างปุ่ม Tab แต่ละอัน */}
        {iWealthyTabs.map((tab) => {
          // ตรวจสอบว่า Tab ปัจจุบัน Active หรือไม่
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              // กำหนด Class ตามสถานะ Active (ใช้ Style เดิมของคุณ)
              className={`
                relative px-4 py-2
                text-sm font-medium rounded-t-md
                transition-colors duration-200 focus:outline-none
                ${
                  isActive
                    ? 'text-blue-600 bg-white border-t border-l border-r border-gray-300 text-base font-extrabold' // Active Style
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-b border-gray-300' // Inactive Style
                }
              `}
            >
              {/* ข้อความบนปุ่ม Tab */}
              {tab.label}

              {/* เส้นใต้ปุ่ม Tab (แสดงเมื่อ Active) */}
              {isActive && (
                <div className="absolute bottom-[-1px] left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-blue-500 rounded-full"></div>
              )}
            </button>
          );
        })}
        {/* ส่วนเติมเต็มพื้นที่ว่างทางขวาของ Tab Bar */}
        <div className="flex-grow bg-blue-50 border-b border-gray-300"></div> {/* แก้ไข border ให้ตรงกับ inactive tab */}
      </div>
      {/* === จบ ส่วน Tab Bar === */}

      {/* ===================================================================== */}
            {/* >>>>> ใส่ TopButtons และ InvestmentReturnInput ตรงนี้ได้เลยครับ <<<<< */}
            {/* ===================================================================== */}
            <div className="flex-shrink-0 px-4 pt-3 pb-1 bg-blue-50"> {/* อาจจะเพิ่ม bg-blue-50 ให้เข้ากับ tab bar */}
                <TopButtons
                    onOpenReduceModal={context.openReduceModal}
                    onOpenChangeFreqModal={context.openChangeFreqModal}
                    onOpenWithdrawalModal={context.openWithdrawalModal}
                    onOpenPauseModal={context.openPauseModal}
                    onOpenAddInvestmentModal={context.openAddInvestmentModal}
                />
            </div>
            <div className="flex justify-end px-4 py-2 bg-blue-50 flex-shrink-0"> {/* อาจจะเพิ่ม bg-blue-50 */}
                <div className="w-full max-w-xs">
                    <InvestmentReturnInput
                        value={context.investmentReturn}
                        onChange={context.handleChangeInvestmentReturn}
                        showInputField={true}
                    />
                </div>
            </div>
            {/* >>>>> สิ้นสุดส่วนที่เพิ่มเข้ามา <<<<< */}

      {/* เส้นขอบคั่น (อาจจะไม่จำเป็น ถ้า Tab Bar จัดการเส้นขอบแล้ว) */}
      {/* <div className="border-b border-gray-300"></div> */}


      {/* === ส่วน Content Area === */}
      {/* พื้นที่แสดงเนื้อหาหลักของแต่ละหน้าย่อย */}
      {/* เอา overflow-auto ออก ถ้าต้องการให้ App.tsx จัดการ Scroll */}
      <div className="flex-1 bg-white p-4 md:p-6"> {/* ลด Padding ถ้าต้องการพื้นที่เพิ่ม */}
         {/* *** ส่งต่อ context ที่ได้รับมา ให้กับ Outlet นี้ *** */}
        <Outlet context={context} /> {/* <--- สำคัญ: ส่ง Context ต่อให้ลูก */}
      </div>
      {/* === จบ ส่วน Content Area === */}

      {/* === ปุ่มคำนวณ === */}
      <div className="flex justify-end mr-6 px-4 py-2 bg-blue-50">
        <Button 
          size="lg" 
          onClick={context.handleCalculate}
          variant="default" // หรือ "primary" แล้วแต่ธีมที่ตั้งค่า
          className="bg-blue-800 hover:bg-blue-600 text-lg font-semibold py-2 px-4 mr-4" // เพิ่มสีน้ำเงิน
        >
          คำนวณ
        </Button>
      </div>
      {/* === จบ ปุ่มคำนวณ === */}

    </div> // ปิด Container หลัก
  );
  // --- จบ ส่วนที่ 3.2 ---
}
// --- จบ ส่วนที่ 3 ---