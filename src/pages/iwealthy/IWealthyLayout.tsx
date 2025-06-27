// src/pages/iwealthy/IWealthyLayout.tsx

import { useMemo, useCallback } from 'react'; // เพิ่ม useCallback
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Import Store และ Pages/Modals ที่จำเป็น
import { useAppStore } from '../../stores/appStore';
import IWealthyFormPage from "./iWealthyFormPage";
import IWealthyTablePage from "./iWealthyTablePage";
import IWealthyChartPage from "./iWealthyChartPage";
import PausePremiumModal from '../../components/PausePremiumModal';
import ReduceSumInsuredModal from '../../components/ReduceSumInsuredModal';
import WithdrawalPlanModal from '../../components/WithdrawalPlanModal';
import ChangeFrequencyModal from '../../components/ChangeFrequencyModal';
import AddInvestmentModal from '../../components/AddInvestmentModal';

// Import Components อื่นๆ
import TopButtons from "../../components/TopButtons"; 
import InvestmentReturnInput from "../../components/InvestmentReturnInput";
import { Button } from '@/components/ui/button';

const iWealthyTabs = [
    { label: "กรอกข้อมูล", path: "/iwealthy/form" },
    { label: "ตารางแสดงผลประโยชน์", path: "/iwealthy/table" },
    { label: "กราฟแสดงผลประโยชน์", path: "/iwealthy/chart" },
];

export default function IWealthyLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ดึงทุกอย่างที่ต้องใช้มาจาก Zustand Store
  const {
    runIWealthyCalculation, iWealthyIsLoading,
    iWealthyInvestmentReturn, setIWealthyInvestmentReturn,
    iWealthyPausePeriods, iWealthySumInsuredReductions, iWealthyWithdrawalPlan,
    iWealthyFrequencyChanges, iWealthyAdditionalInvestments,
    openPauseModal, openReduceModal, openWithdrawalModal, 
    openChangeFreqModal, openAddInvestmentModal,iWealthyReductionsNeedReview,
  } = useAppStore();

  const activeActions = useMemo(() => ({
    pause: iWealthyPausePeriods.length > 0,
    reduceSI: iWealthySumInsuredReductions.length > 0,
    withdrawPlan: iWealthyWithdrawalPlan.length > 0,
    changeFreq: iWealthyFrequencyChanges.length > 0,
    addInvest: iWealthyAdditionalInvestments.length > 0,
  }), [iWealthyPausePeriods, iWealthySumInsuredReductions, iWealthyWithdrawalPlan, iWealthyFrequencyChanges, iWealthyAdditionalInvestments]);

  const needsReviewActions = useMemo(() => ({
    reduceSI: iWealthyReductionsNeedReview,
    // (ในอนาคตถ้ามีแผนอื่นที่ต้องตรวจสอบ ก็เพิ่มที่นี่)
    // pause: someOtherReviewFlag, 
  }), [iWealthyReductionsNeedReview]);

  // +++ จุดที่แก้ไข +++
  // สร้าง Handler ใหม่สำหรับปุ่มคำนวณโดยเฉพาะ
  const handleCalculateClick = useCallback(async () => {
    // 1. เก็บ path ปัจจุบันไว้ก่อนที่จะเริ่มคำนวณ
    const fromPath = location.pathname;

    // 2. เรียกและรอให้การคำนวณใน Store เสร็จสิ้น
    await runIWealthyCalculation();

    // 3. หลังจากคำนวณเสร็จแล้ว ให้ตรวจสอบว่าเรามาจากหน้าฟอร์มหรือไม่
    if (fromPath.includes('/iwealthy/form')) {
      // 4. ถ้าใช่ ให้เปลี่ยนไปที่หน้ากราฟ
      navigate('/iwealthy/chart');
    }
    // ถ้าไม่ได้มาจากหน้าฟอร์ม (เช่น กดคำนวณซ้ำจากหน้าตาราง/กราฟ) ก็ไม่ต้องทำอะไร
  }, [location.pathname, runIWealthyCalculation, navigate]);


  return (
    <div className="flex flex-col h-auto -mt-2">
        {/* ส่วน Top Bar และ Tab Bar (เหมือนเดิม) */}
        <div className="flex justify-between items-center px-4 py-3 bg-blue-50 flex-shrink-0">
            <TopButtons
                onOpenPauseModal={openPauseModal}
                onOpenReduceModal={openReduceModal}
                onOpenWithdrawalModal={openWithdrawalModal}
                onOpenChangeFreqModal={openChangeFreqModal}
                onOpenAddInvestmentModal={openAddInvestmentModal}
                activeActions={activeActions}
                needsReviewActions={needsReviewActions}
            />
            <div className="w-full max-w-xs">
                <InvestmentReturnInput
                    value={iWealthyInvestmentReturn}
                    onChange={setIWealthyInvestmentReturn}
                    showInputField={true}
                />
            </div>
        </div>
        <div className="flex bg-blue-50 px-4 relative">
            {iWealthyTabs.map((tab) => {
                const isActive = location.pathname.startsWith(tab.path);
                return (
                    <button key={tab.path} onClick={() => navigate(tab.path)} className={`relative px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 focus:outline-none ${isActive ? 'text-blue-600 bg-white border-t border-l border-r border-gray-300' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-b border-gray-300'} `}>
                        {tab.label}
                    </button>
                );
            })}
            <div className="flex-grow bg-blue-50 border-b border-gray-300"></div>
        </div>

        {/* ส่วนแสดงเนื้อหาของแต่ละหน้า */}
        <div className="flex-1 bg-white p-4 md:p-6">
            <Routes>
                <Route index element={<Navigate to="form" replace />} />
                <Route path="form" element={<IWealthyFormPage />} />
                <Route path="table" element={<IWealthyTablePage />} />
                <Route path="chart" element={<IWealthyChartPage />} />
            </Routes>
        </div>

        {/* ส่วนปุ่มคำนวณ */}
        <div className="flex justify-end mr-6 px-4 py-2 bg-blue-50">
            {/* +++ จุดที่แก้ไข: เปลี่ยน onClick ให้เรียก Handler ตัวใหม่ +++ */}
            <Button size="lg" onClick={handleCalculateClick} disabled={iWealthyIsLoading} className="bg-blue-800 hover:bg-blue-600 text-lg font-semibold py-2 px-4 mr-4">
                {iWealthyIsLoading ? 'กำลังคำนวณ...' : 'คำนวณ'}
            </Button>
        </div>

        {/* Render Modals ทั้งหมดไว้ที่นี่ */}
        <PausePremiumModal />
        <ReduceSumInsuredModal />
        <WithdrawalPlanModal />
        <ChangeFrequencyModal />
        <AddInvestmentModal />
    </div>
  );
}
