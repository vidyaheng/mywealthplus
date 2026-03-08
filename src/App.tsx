// src/App.tsx

import { BrowserRouter as RouterContainer, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import PinForm from './PinForm';
import { useAppStore } from "./stores/appStore";

// Import Layouts และ Pages หลัก
// เราจะ import แค่ Layout ใหญ่ของแต่ละแผน ไม่ต้อง import หน้าย่อยๆ (form, table, chart) ที่นี่
import IWealthyLayout from "./pages/iwealthy/IWealthyLayout";
import LTHCLayout from './pages/lthc/LTHCLayout';
import CiPlannerPage from "./pages/ci/CiPlannerPage";
import RetirementPlannerPage from "@/pages/retire/RetirementPlannerPage";
// import RetirePage from "./pages/retire/RetirePage";
// import LifePlanPage from "./pages/lifeplan/LifePlanPage";

// --- REMOVED: ไม่ต้อง import สิ่งที่เกี่ยวกับ State ของ iWealthy ที่นี่แล้ว ---
// ไม่ต้องใช้ React Context, useNavigate, useLocation, useState สำหรับ iWealthy,
// และไม่ต้องใช้ handleCalculate หรือ handlers ของ Modal ต่างๆ ในไฟล์นี้อีกต่อไป

// Component Wrapper สำหรับ Router (เหมือนเดิม)
export default function AppWrapper() {
    return (
        <RouterContainer>
            <App />
        </RouterContainer>
    );
}

// Main App Component (ฉบับใหม่ที่สะอาดและเบาลงมาก)
function App() {
    // --- State ที่เหลืออยู่คือ State ที่ไม่เกี่ยวกับ iWealthy หรือ LTHC โดยตรง ---
    //ใช้ Zustand Store แทน
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setPin = useAppStore((state) => state.setPin);

  const handleLoginSuccess = (pinFromForm: string) => {
    setPin(pinFromForm);
  };;

    // แสดงหน้าใส่ PIN ก่อน ถ้ายังไม่ยืนยันตัวตน
    if (!isAuthenticated) {
        return <PinForm onSuccess={handleLoginSuccess} />;
    }

    // เมื่อยืนยันตัวตนแล้ว ให้แสดง Layout หลักของแอป
    return (
        // ไม่ต้องมี AppContext.Provider อีกต่อไป เพราะแต่ละส่วนจะใช้ Zustand Store ของตัวเอง
        <div className="flex flex-col h-screen bg-blue-50 font-sans">
            <header className="bg-white shadow-sm w-full py-2 px-4 flex-shrink-0">
                <h1 className="h-8 flex items-center justify-center text-base sm:text-lg font-semibold text-blue-900">
                    Insurance Planner
                </h1>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 p-3 md:p-4 overflow-y-auto">
                    <Routes>
                        {/* Route เริ่มต้น ให้ไปที่ iWealthy */}
                        <Route path="/" element={<Navigate to="/iwealthy" replace />} />
                        
                        {/* Route สำหรับ iWealthy จะไปเรียก Layout ที่จัดการตัวเองได้ทั้งหมด */}
                        <Route path="/iwealthy/*" element={<IWealthyLayout />} />

                        {/* Route สำหรับ LTHC ก็จะใช้ Layout ของตัวเอง */}
                        <Route path="/lthc/*" element={<LTHCLayout />} />

                        {/* Route อื่นๆ (ถ้ามี) */}
                        <Route path="/ci" element={<CiPlannerPage />} /> 
                        {/* <Route path="/retire" element={<RetirePage />} /> */}
                        <Route path="/retire/*" element={<RetirementPlannerPage />} />
                        {/* <Route path="/lifeplan" element={<LifePlanPage />} /> */}
                        
                        <Route path="*" element={<div>404 - Page Not Found</div>} />
                    </Routes>
                </main>
            </div>
            
            {/* --- REMOVED: ไม่ต้อง Render Modals ที่นี่แล้ว --- */}
            {/* การ Render Modal ทั้งหมดจะถูกย้ายไปอยู่ใน IWealthyLayout.tsx */}
        </div>
    );
}