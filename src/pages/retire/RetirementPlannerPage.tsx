
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import RetirementNav from '@/components/ret/RetirementNav';

// --- 1. Import สิ่งที่ต้องใช้เพิ่ม ---
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { FaSave, FaFolderOpen } from 'react-icons/fa';
import SaveRecordModal from '@/components/SaveRecordModal';
import LoadRecordModal from '@/components/LoadRecordModal';

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

    // --- 2. ดึง action สำหรับเปิด Modal ---
    const { openSaveModal, openLoadModal } = useAppStore();

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-md border">
            <RetirementNav />
            <div className="flex-grow p-4 overflow-y-auto">
                {/* Outlet คือตำแหน่งที่จะแสดงผลหน้าย่อยๆ ที่เราเลือกจาก Nav Bar */}
                <Outlet />
            </div>
        {/* --- 3. เพิ่มแถบปุ่ม Save/Load ด้านล่าง --- */}
            <div className="flex-shrink-0 flex justify-start items-center px-6 py-3 bg-gray-100/80 backdrop-blur-sm border-t">
                <div className="flex gap-2">
                    <Button variant="outline" size="lg" onClick={openSaveModal} className="text-green-700 border-green-700 hover:bg-green-50 ...">
                        <FaSave className="mr-2" />
                        บันทึก
                    </Button>
                    <Button variant="outline" size="lg" onClick={openLoadModal} className="text-blue-700 border-blue-700 hover:bg-blue-50 ...">
                        <FaFolderOpen className="mr-2" />
                        โหลด
                    </Button>
                </div>
            </div>

            {/* --- 4. Render Modals (ซ่อนไว้รอเรียกใช้) --- */}
            <SaveRecordModal />
            <LoadRecordModal />
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