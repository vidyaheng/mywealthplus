// src/pages/iwealthy/IWealthyLayout.tsx

import { useMemo, useCallback } from 'react'; // เพิ่ม useCallback
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Import Store และ Pages/Modals ที่จำเป็น
import { useAppStore } from '../../stores/appStore';
import IWealthyFormPage from "./iWealthyFormPage";
import IWealthyTablePage from "./iWealthyTablePage";
import IWealthyChartPage from "./iWealthyChartPage";
import { IWealthyReportPage } from './iWealthyReportPage';
import PausePremiumModal from '../../components/PausePremiumModal';
import ReduceSumInsuredModal from '../../components/ReduceSumInsuredModal';
import WithdrawalPlanModal from '../../components/WithdrawalPlanModal';
import ChangeFrequencyModal from '../../components/ChangeFrequencyModal';
import AddInvestmentModal from '../../components/AddInvestmentModal';
import SaveRecordModal from '../../components/SaveRecordModal';
import LoadRecordModal from '../../components/LoadRecordModal';
import { calculateLifeCoverage } from '../../lib/calculations';


// Import Components อื่นๆ
import TopButtons from "../../components/TopButtons"; 
import InvestmentReturnInput from "../../components/InvestmentReturnInput";
import { Button } from '@/components/ui/button';
import { FaSave, FaFolderOpen } from 'react-icons/fa';

const iWealthyTabs = [
    { label: "กรอกข้อมูล", path: "/iwealthy/form" },
    { label: "ตารางแสดงผลประโยชน์", path: "/iwealthy/table" },
    { label: "กราฟแสดงผลประโยชน์", path: "/iwealthy/chart" },
    { label: "รายงานวิเคราะห์โครงการ", path: "/iwealthy/report" },
];

export default function IWealthyLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ดึงทุกอย่างที่ต้องใช้มาจาก Zustand Store
  const {
    activeRecordId,
    pin, openSaveModal, openLoadModal,
    runIWealthyCalculation, iWealthyIsLoading,
    iWealthyInvestmentReturn, setIWealthyInvestmentReturn,
    iWealthyPausePeriods, iWealthySumInsuredReductions, iWealthyWithdrawalPlan,
    iWealthyFrequencyChanges, iWealthyAdditionalInvestments,
    openPauseModal, openReduceModal, openWithdrawalModal, 
    openChangeFreqModal, openAddInvestmentModal,iWealthyReductionsNeedReview,
    iWealthyAge, iWealthyGender, iWealthyPaymentFrequency,
    iWealthyRpp, iWealthyRtu, iWealthySumInsured,
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

  const executeSave = async (recordName: string) => {
    if (!pin) {
        alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลผู้ใช้งาน (PIN)');
        return;
    }

    // --- 1. รวบรวมข้อมูลทั้งหมดที่ต้องใช้ในการบันทึก ---
    const lifeCoverage = calculateLifeCoverage(iWealthySumInsured);
    const totalAnnualPremium = (iWealthyRpp || 0) + (iWealthyRtu || 0);
    const dataToSave = {
        age: iWealthyAge,
        gender: iWealthyGender,
        paymentFrequency: iWealthyPaymentFrequency,
        rpp: iWealthyRpp,
        rtu: iWealthyRtu,
        sumInsured: iWealthySumInsured,
        sumInsuredReductions: iWealthySumInsuredReductions,
        lifeCoverage: lifeCoverage,
        totalAnnualPremium: totalAnnualPremium,
        // เพิ่ม state อื่นๆ ที่เกี่ยวข้องกับโปรเจกต์ iWealthy ที่นี่...
    };

    try {
      let response;
      
      // --- 2. เพิ่ม Logic if/else เพื่อเลือกว่าจะ "สร้างใหม่" หรือ "อัปเดต" ---
      if (activeRecordId) {
        // UPDATE (บันทึกทับ)
        response = await fetch(`/api/record/${activeRecordId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-pin': pin,
          },
          body: JSON.stringify({ recordName, data: dataToSave }),
        });
      } else {
        // CREATE (สร้างใหม่)
        response = await fetch('/api/save-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, projectName: 'iWealthy', recordName, data: dataToSave }),
        });
      }

      const result = await response.json();
      if (response.ok) {
        alert('🎉 บันทึกข้อมูลสำเร็จ!');
      } else {
        alert(`❌ เกิดข้อผิดพลาดในการบันทึก: ${result.error}`);
      }
    } catch (error) {
      alert('❌ ไม่สามารถเชื่อมต่อกับ Server ได้');
    }
  };

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
                <Route path="report" element={<IWealthyReportPage />} />
            </Routes>
        </div>

        <div className="flex justify-between items-center px-6 py-2 bg-blue-50 border-t border-gray-200">
            <div className="flex gap-2">
                <Button variant="outline" size="lg" onClick={openSaveModal} className="text-green-700 border-green-700 hover:bg-green-50 hover:text-green-800 font-semibold py-2 px-4">
                    <FaSave className="mr-2" />
                    บันทึก
                </Button>
                <Button variant="outline" size="lg" onClick={openLoadModal} className="text-blue-700 border-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold py-2 px-4">
                    <FaFolderOpen className="mr-2" />
                    โหลด
                </Button>
            </div>

                {/* ปุ่มคำนวณ (ชิดขวา) */}
                <Button size="lg" onClick={handleCalculateClick} disabled={iWealthyIsLoading} className="bg-blue-800 hover:bg-blue-600 text-lg font-semibold py-2 px-4">
                    {iWealthyIsLoading ? 'กำลังคำนวณ...' : 'คำนวณ'}
                </Button>
                
        </div>
            <PausePremiumModal />
            <ReduceSumInsuredModal />
            <WithdrawalPlanModal />
            <ChangeFrequencyModal />
            <AddInvestmentModal />
            <SaveRecordModal onConfirmSave={executeSave} />
            <LoadRecordModal />
        </div>
    );
}
