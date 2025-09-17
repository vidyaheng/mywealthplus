// src/pages/lthc/LTHCLayout.tsx

import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// +++ Import Pages/Modals ที่จำเป็นสำหรับ LTHC +++
// ไม่จำเป็นต้อง import useAppStore ที่นี่แล้ว เพราะปุ่มคำนวณถูกนำออกไปแล้ว
// import { useAppStore } from '../../stores/appStore'; 
import LthcFormPage from './LthcFormPage';
import LthcTablePage from './LthcTablePage';
import LthcChartPage from './LthcChartPage';
import { LthcReportPage } from './LthcReportPage';
import { useAppStore } from '../../stores/appStore';
import { Button } from '@/components/ui/button';
import { FaSave, FaFolderOpen } from 'react-icons/fa';
import SaveRecordModal from '../../components/SaveRecordModal';
import LoadRecordModal from '../../components/LoadRecordModal';

// (ถ้า LTHC มี TopButtons หรือ InvestmentReturnInput ของตัวเอง ก็ import มาที่นี่)
// import TopButtons from "../../components/TopButtons"; 
// import InvestmentReturnInput from "../../components/InvestmentReturnInput";

// ข้อมูลสำหรับสร้าง Tabs ของ LTHC
const lthcTabs = [
    { label: "กรอกข้อมูล LTHC", path: "/lthc/form" },
    { label: "ตาราง LTHC", path: "/lthc/table" },
    { label: "กราฟ LTHC", path: "/lthc/chart" },
    { label: "สรุปรายงาน", path: "/lthc/report" },
];

export default function LTHCLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
        pin,
        isLoading,
        runCalculation,
        openSaveModal,
        openLoadModal,
        // ดึง state ทั้งหมดของ LTHC มาเพื่อใช้ในการ Save
        policyholderEntryAge, policyholderGender, selectedHealthPlans, 
        policyOriginMode, existingPolicyEntryAge, fundingSource, 
        iWealthyMode, pensionMode, pensionFundingOptions, manualPensionPremium, 
        manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT, 
        manualWithdrawalStartAge, autoInvestmentReturn, autoIWealthyPPT, 
        autoRppRtuRatio, saReductionStrategy
    } = useAppStore();

    // --- ฟังก์ชันสำหรับบันทึกข้อมูล LTHC ---
    const executeLthcSave = async (recordName: string) => {
        if (!pin) { return alert('Error: Not logged in.'); }

        const dataToSave = {
            policyholderEntryAge, policyholderGender, selectedHealthPlans, 
            policyOriginMode, existingPolicyEntryAge, fundingSource, 
            iWealthyMode, pensionMode, pensionFundingOptions, manualPensionPremium, 
            manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT, 
            manualWithdrawalStartAge, autoInvestmentReturn, autoIWealthyPPT, 
            autoRppRtuRatio, saReductionStrategy
        };

        try {
            const response = await fetch('/api/save-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin,
                    projectName: 'LTHC', // <--- ระบุว่าเป็นโปรเจกต์ LTHC
                    recordName,
                    data: dataToSave,
                }),
            });
            const result = await response.json();
            if (response.ok) { alert('🎉 บันทึกข้อมูล LTHC สำเร็จ!'); }
            else { alert(`❌ เกิดข้อผิดพลาด: ${result.error}`); }
        } catch (error) { alert('❌ ไม่สามารถเชื่อมต่อกับ Server ได้'); }
    };

  return (
    // Container หลักของ Layout
    <div className="flex flex-col h-auto -mt-2">
        {/* ถ้า LTHC มี TopBar ของตัวเอง สามารถเพิ่ม JSX เข้ามาในส่วนนี้ได้
          <div className="flex justify-between items-center px-4 py-3 bg-gray-100 flex-shrink-0">
             ...
          </div>
        */}
        
        <header className="bg-blue-50 p-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-green-600 bg-clip-text text-transparent">
                การวางแผนสุขภาพแบบยั่งยืน
            </h1>
            <p className="text-sm font-medium text-slate-500 tracking-wider uppercase mt-1">
                Long-Term Health Care
            </p>
        </header>

        {/* ส่วนของ Tab Bar */}
        <div className="flex bg-blue-50 px-4 relative">
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
            <div className="flex-grow bg-blue-50 border-b border-gray-300"></div>
        </div>

        {/* ส่วนแสดงเนื้อหาของแต่ละหน้า */}
        <div className="flex-1 bg-white p-4 md:p-6">
            <Routes>
                <Route index element={<Navigate to="form" replace />} />
                <Route path="form" element={<LthcFormPage />} />
                <Route path="table" element={<LthcTablePage />} />
                <Route path="chart" element={<LthcChartPage />} />
                <Route path="report" element={<LthcReportPage />} />
            </Routes>
        </div>

        {/* --- เพิ่มแถบปุ่มควบคุมด้านล่าง --- */}
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
            <Button size="lg" onClick={runCalculation} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-lg ...">
                    {isLoading ? 'กำลังคำนวณ...' : 'คำนวณ LTHC'}
            </Button>
        </div>
            
        {/* --- Render Modals สำหรับ Save/Load --- */}
        <SaveRecordModal onConfirmSave={executeLthcSave} />
        <LoadRecordModal />
    </div>
  );
}
