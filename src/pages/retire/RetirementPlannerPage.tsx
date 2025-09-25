
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import RetirementNav from '@/components/ret/RetirementNav';

// Import หน้าต่างๆ ที่เราจะใช้
import RetirementFormPage from './RetirementFormPage';
import RetirementTablePage from './RetirementTablePage';
import RetirementChartPage from './RetirementChartPage';
import RetirementReportPage from './RetirementReportPage';

/**
 * Component นี้ทำหน้าที่เป็น Layout หลัก
 * มี Navigation Bar อยู่ด้านบน และมีพื้นที่สำหรับแสดงหน้าย่อยๆ (Outlet)
 */
const RetirementLayout = () => {
    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-md border">
            <RetirementNav />
            <div className="flex-grow p-4 overflow-y-auto">
                {/* Outlet คือตำแหน่งที่จะแสดงผลหน้าย่อยๆ ที่เราเลือกจาก Nav Bar */}
                <Outlet />
            </div>
        </div>
    );
}

/**
 * Component นี้ทำหน้าที่เป็น "ศูนย์กลางการนำทาง" (Router)
 * สำหรับทุกหน้าที่อยู่ภายใต้ /retire/
 */
const RetirementPlannerPage = () => {
  return (
    <Routes>
      <Route path="/" element={<RetirementLayout />}>
        {/* Route เริ่มต้น: ถ้าเข้ามาที่ /retire ให้ redirect ไปที่ /retire/form ทันที */}
        <Route index element={<Navigate to="form" replace />} />
        
        {/* Route สำหรับหน้าย่อยต่างๆ */}
        <Route path="form" element={<RetirementFormPage />} />
        <Route path="table" element={<RetirementTablePage />} />
        <Route path="chart" element={<RetirementChartPage />} />
        <Route path="report" element={<RetirementReportPage />} />
      </Route>
    </Routes>
  );
};

export default RetirementPlannerPage;