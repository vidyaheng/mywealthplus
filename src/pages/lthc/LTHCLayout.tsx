// src/pages/lthc/LTHCLayout.tsx

import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// +++ Import Pages/Modals ที่จำเป็นสำหรับ LTHC +++
// ไม่จำเป็นต้อง import useAppStore ที่นี่แล้ว เพราะปุ่มคำนวณถูกนำออกไปแล้ว
// import { useAppStore } from '../../stores/appStore'; 
import LthcFormPage from './LthcFormPage';
import LthcTablePage from './LthcTablePage';
import LthcChartPage from './LthcChartPage';

// (ถ้า LTHC มี TopButtons หรือ InvestmentReturnInput ของตัวเอง ก็ import มาที่นี่)
// import TopButtons from "../../components/TopButtons"; 
// import InvestmentReturnInput from "../../components/InvestmentReturnInput";

// ข้อมูลสำหรับสร้าง Tabs ของ LTHC
const lthcTabs = [
    { label: "กรอกข้อมูล LTHC", path: "/lthc/form" },
    { label: "ตาราง LTHC", path: "/lthc/table" },
    { label: "กราฟ LTHC", path: "/lthc/chart" },
];

export default function LTHCLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- REMOVED: ไม่ต้องดึง State จาก Store ใน Layout นี้แล้ว ---
  // const {
  //   runCalculation,
  //   isLoading,
  // } = useAppStore();

  return (
    // Container หลักของ Layout
    <div className="flex flex-col h-auto -mt-2">
        {/* ถ้า LTHC มี TopBar ของตัวเอง สามารถเพิ่ม JSX เข้ามาในส่วนนี้ได้
          <div className="flex justify-between items-center px-4 py-3 bg-gray-100 flex-shrink-0">
             ...
          </div>
        */}
        
        {/* ส่วนของ Tab Bar */}
        <div className="flex bg-gray-100 px-4 relative">
            {lthcTabs.map((tab) => {
                const isActive = location.pathname.startsWith(tab.path);
                return (
                    <button 
                        key={tab.path} 
                        onClick={() => navigate(tab.path)} 
                        className={`relative px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 focus:outline-none ${
                            isActive 
                                ? 'text-green-700 bg-white border-t border-l border-r border-gray-300' // สีสำหรับ LTHC
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-b border-gray-300'
                        } `}
                    >
                        {tab.label}
                    </button>
                );
            })}
            <div className="flex-grow bg-gray-100 border-b border-gray-300"></div>
        </div>

        {/* ส่วนแสดงเนื้อหาของแต่ละหน้า */}
        <div className="flex-1 bg-white p-4 md:p-6">
            <Routes>
                <Route index element={<Navigate to="form" replace />} />
                <Route path="form" element={<LthcFormPage />} />
                <Route path="table" element={<LthcTablePage />} />
                <Route path="chart" element={<LthcChartPage />} />
            </Routes>
        </div>

        {/* --- REMOVED: ลบส่วนปุ่มคำนวณออกไปแล้ว --- */}
        
        {/* LTHC ไม่มี Modal เหมือน iWealthy จึงไม่ต้อง Render ที่นี่ */}
    </div>
  );
}
