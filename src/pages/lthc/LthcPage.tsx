// src/pages/lthc/LthcPage.tsx

import React from 'react';
import {
    useLthcPlanner,
    UseLthcPlannerProps, // Import props type for the hook
    AnnualLTHCOutputRow, // Import for typing illustration data if needed directly
    //HealthPlanSelections, // For initial props
    //LifeReadyPaymentTerm,
    //IHealthyUltraPlan,
    //MEBPlan,
    //Gender,
} from '../../hooks/useLthcPlanner'; // ปรับ path ไปยัง useLthcPlanner.ts ของคุณ

// --- Types และ Functions จาก Health Plan Calculations (lib/healthPlanCalculations.ts) ---
import {
    Gender,
    HealthPlanSelections,
    LifeReadyPaymentTerm,
    IHealthyUltraPlan,
    MEBPlan,                  // <--- เพิ่ม/ตรวจสอบ import นี้
    // getAnnualTotalHealthPremium,  // อาจจะไม่ต้องใช้ใน LthcPage โดยตรง ถ้า Hook จัดการหมดแล้ว
    // calculateLifeReadyPremium,
    // calculateIHealthyUltraPremium,
    // calculateMEBPremium,
} from '../../lib/healthPlanCalculations'; // <--- ตรวจสอบ Path นี้ให้ถูกต้อง

// (ในอนาคต อาจจะสร้าง UI components แยก เช่น LthcManualForm, LthcAutoForm, LthcResultsTable)

// Props ที่ LthcPage อาจจะรับมา (ถ้าไม่ได้ hardcode ค่าเริ่มต้นทั้งหมดใน hook)
interface LthcPageProps {
    // ตัวอย่าง ถ้าต้องการให้หน้านี้รับค่าเริ่มต้นมาจากข้างนอก
    // defaultEntryAge?: number;
    // defaultGender?: Gender;
    // defaultHealthSelections?: HealthPlanSelections;
}

const LthcPage: React.FC<LthcPageProps> = (/*props*/) => {
    // --- 1. ตั้งค่า Props เริ่มต้นสำหรับ useLthcPlanner ---
    // เพื่อความง่ายในการทดสอบ จะ hardcode ค่าเริ่มต้นตรงนี้ก่อน
    // ในการใช้งานจริง ค่าเหล่านี้อาจจะมาจาก Global State, Router State, หรือ User Input ก่อนหน้านี้
    const initialHookProps: UseLthcPlannerProps = {
        initialPolicyholderEntryAge: 30,
        initialPolicyholderGender: 'male' as Gender,
        initialSelectedHealthPlans: {
            lifeReadySA: 150000,
            lifeReadyPPT: 12 as LifeReadyPaymentTerm,
            iHealthyUltraPlan: 'Bronze' as IHealthyUltraPlan,
            mebPlan: 1000 as MEBPlan,
        },
    };

    // --- 2. เรียกใช้ Custom Hook ---
    const {
        lthcMode, setLthcMode,
        manualRpp, setManualRpp,
        manualRtu, setManualRtu,
        manualInvestmentReturn, setManualInvestmentReturn,
        manualIWealthyPPT, setManualIWealthyPPT,
        manualWithdrawalStartAge, setManualWithdrawalStartAge,
        autoInvestmentReturn, setAutoInvestmentReturn,
        autoIWealthyPPT, setAutoIWealthyPPT,
        autoRppRtuRatio, setAutoRppRtuRatio,
        calculatedMinIWealthyPremium,
        calculatedIWealthyRpp,
        calculatedIWealthyRtu,
        lthcIllustrationData,
        isLoading,
        errorMessage,
        runLthcCalculation,
        // States ที่ Hook expose เพิ่มเติม (ถ้าต้องการให้ UI หน้านี้ปรับค่าได้)
        policyholderEntryAge, setPolicyholderEntryAge,
        policyholderGender, setPolicyholderGender,
        selectedHealthPlans, setSelectedHealthPlans,
    } = useLthcPlanner(initialHookProps);


    // --- 3. JSX สำหรับ Render UI ---
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-700">LTHC Planner - วางแผนสุขภาพระยะยาว</h1>
                <p className="text-gray-600">วางแผนการเงิน iWealthy เพื่อรองรับค่าใช้จ่ายสุขภาพในอนาคต</p>
            </header>

            {/* ส่วนแสดงข้อมูลตั้งต้น (อาจจะทำเป็น Component แยก) */}
            <section className="p-4 border rounded-lg shadow bg-slate-50">
                <h2 className="text-xl font-semibold mb-3 text-slate-700">ข้อมูลผู้เอาประกันและแผนสุขภาพ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <label className="font-medium text-gray-700">อายุแรกเข้า: </label>
                        <input
                            type="number"
                            value={policyholderEntryAge}
                            onChange={(e) => setPolicyholderEntryAge(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="p-1 border rounded w-20 ml-2"
                        /> ปี
                    </div>
                    <div>
                        <label className="font-medium text-gray-700">เพศ: </label>
                        <select
                            value={policyholderGender}
                            onChange={(e) => setPolicyholderGender(e.target.value as Gender)}
                            className="p-1 border rounded ml-2"
                        >
                            <option value="male">ชาย</option>
                            <option value="female">หญิง</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 mt-2">
                        <p><span className="font-medium text-gray-700">แผน Life Ready:</span> ทุน {selectedHealthPlans.lifeReadySA.toLocaleString()} บาท, จ่าย {selectedHealthPlans.lifeReadyPPT} ปี</p>
                        <p><span className="font-medium text-gray-700">แผน iHealthy Ultra:</span> {selectedHealthPlans.iHealthyUltraPlan}</p>
                        <p><span className="font-medium text-gray-700">แผน MEB:</span> {selectedHealthPlans.mebPlan.toLocaleString()} บาท/วัน</p>
                        {/* TODO: เพิ่ม UI ให้สามารถแก้ไข selectedHealthPlans ได้ถ้าต้องการ */}
                    </div>
                </div>
            </section>

            {/* ส่วนเลือกโหมดการวางแผน */}
            <section className="p-4 border rounded-lg shadow bg-white">
                <h2 className="text-xl font-semibold mb-3 text-slate-700">1. เลือกโหมดการวางแผน</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setLthcMode('automatic')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${lthcMode === 'automatic' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        อัตโนมัติ (Automatic)
                    </button>
                    <button
                        onClick={() => setLthcMode('manual')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${lthcMode === 'manual' ? 'bg-teal-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        กำหนดเอง (Manual)
                    </button>
                </div>
            </section>

            {/* ส่วน Input ตามโหมดที่เลือก */}
            {lthcMode === 'manual' && (
                <section className="p-4 border rounded-lg shadow bg-teal-50 space-y-4 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-teal-700">2. ตั้งค่า iWealthy (โหมดกำหนดเอง)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div><label className="block text-sm font-medium text-gray-700">RPP (เบี้ยหลักต่อปี):</label><input type="number" step="1000" value={manualRpp} onChange={e => setManualRpp(Number(e.target.value))} className="mt-1 p-2 w-full border rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">RTU (เบี้ยลงทุนต่อปี):</label><input type="number" step="1000" value={manualRtu} onChange={e => setManualRtu(Number(e.target.value))} className="mt-1 p-2 w-full border rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">ผลตอบแทนคาดหวัง (% ต่อปี):</label><input type="number" step="0.5" value={manualInvestmentReturn} onChange={e => setManualInvestmentReturn(Number(e.target.value))} className="mt-1 p-2 w-full border rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">ระยะเวลาจ่ายเบี้ย iWealthy (ปี):</label><input type="number" value={manualIWealthyPPT} onChange={e => setManualIWealthyPPT(Number(e.target.value))} className="mt-1 p-2 w-full border rounded-md shadow-sm" /></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">อายุที่เริ่มถอนเงินจาก iWealthy:</label><input type="number" value={manualWithdrawalStartAge} onChange={e => setManualWithdrawalStartAge(Number(e.target.value))} className="mt-1 p-2 w-full md:w-1/2 border rounded-md shadow-sm" /></div>
                    </div>
                </section>
            )}

            {lthcMode === 'automatic' && (
                 <section className="p-4 border rounded-lg shadow bg-blue-50 space-y-4 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-blue-700">2. ตั้งค่า iWealthy (โหมดอัตโนมัติ)</h2>
                    <p className="text-sm text-gray-600">ระบบจะคำนวณเบี้ย iWealthy (RPP 100%) ที่ต่ำที่สุดที่ทำให้แผนการเงินนี้เป็นไปได้ จากนั้นคุณสามารถปรับสัดส่วน RPP/RTU หรือปัจจัยอื่นๆ แล้วคำนวณใหม่ได้</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div><label className="block text-sm font-medium text-gray-700">ผลตอบแทนคาดหวัง (% ต่อปี):</label><input type="number" step="0.5" value={autoInvestmentReturn} onChange={e => setAutoInvestmentReturn(Number(e.target.value))} className="mt-1 p-2 w-full border rounded-md shadow-sm" /> <span className="text-xs text-gray-500">(Default 5%)</span></div>
                        <div><label className="block text-sm font-medium text-gray-700">ระยะเวลาจ่ายเบี้ย iWealthy (ปี):</label><input type="number" value={autoIWealthyPPT} onChange={e => setAutoIWealthyPPT(Number(e.target.value))} className="mt-1 p-2 w-full border rounded-md shadow-sm" /> <span className="text-xs text-gray-500">(ระบบกำหนดค่าเริ่มต้นตามอายุ)</span></div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">สัดส่วน RPP/RTU (สำหรับการคำนวณรอบถัดไป หากต้องการปรับ):</label>
                            <select value={autoRppRtuRatio} onChange={e => setAutoRppRtuRatio(e.target.value)} className="mt-1 p-2 w-full md:w-1/2 border rounded-md shadow-sm">
                                <option value="100/0">RPP 100% / RTU 0%</option>
                                <option value="80/20">RPP 80% / RTU 20%</option>
                                <option value="70/30">RPP 70% / RTU 30%</option>
                                <option value="60/40">RPP 60% / RTU 40%</option>
                                <option value="50/50">RPP 50% / RTU 50%</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">รอบแรกระบบจะคำนวณโดยใช้ RPP 100% เสมอเพื่อหาเบี้ยตั้งต้น</p>
                        </div>
                    </div>
                    {calculatedMinIWealthyPremium !== null && (
                        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-sm">
                            <h3 className="font-semibold text-yellow-800">ผลการคำนวณเบื้องต้น (RPP 100%):</h3>
                            <p>เบี้ย iWealthy ต่ำสุดที่แนะนำ: {calculatedMinIWealthyPremium.toLocaleString()} บาท/ปี</p>
                            <p>(RPP: {calculatedIWealthyRpp?.toLocaleString()}, RTU: {calculatedIWealthyRtu?.toLocaleString()})</p>
                            <p className="mt-1">คุณสามารถปรับสัดส่วน RPP/RTU ด้านบน, ผลตอบแทน, หรือระยะเวลาชำระเบี้ย แล้วกด "คำนวณ LTHC Plan" อีกครั้งเพื่อดูผลลัพธ์ใหม่</p>
                        </div>
                    )}
                </section>
            )}

            {/* ปุ่มคำนวณหลัก */}
            <section className="text-center mt-8 mb-8">
                <button
                    onClick={runLthcCalculation}
                    disabled={isLoading}
                    className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-lg shadow-xl hover:bg-green-700 disabled:bg-gray-400 transition-transform transform hover:scale-105"
                >
                    {isLoading ? 'กำลังคำนวณ...' : 'คำนวณ LTHC Plan'}
                </button>
            </section>

            {/* ส่วนแสดงผลลัพธ์ */}
            {isLoading && (
                <div className="text-center p-4">
                    {/* <LoadingSpinner /> */}
                    <p className="text-blue-600 font-semibold">กำลังคำนวณผลประโยชน์ กรุณารอสักครู่...</p>
                </div>
            )}
            {errorMessage && (
                <div className="mt-4 p-4 text-red-700 bg-red-100 border border-red-400 rounded-lg shadow-md">
                    <p className="font-bold">เกิดข้อผิดพลาด:</p>
                    <p>{errorMessage}</p>
                </div>
            )}
            
            {lthcIllustrationData && !isLoading && (
                <section className="mt-8 p-4 border rounded-lg shadow-lg bg-white">
                    <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
                        ตารางแสดงผลประโยชน์ LTHC Planner
                    </h2>
                    {/* ในอนาคต ส่วนนี้จะเรียก Component <LHCOutputTable data={lthcIllustrationData} /> 
                        ซึ่ง LHCOutputTable จะมีการจัดการ View 'summary' (เปรียบเทียบ) และ 'full' (รายละเอียด) ภายใน
                        และอาจจะมีปุ่มให้สลับมุมมอง หรือ export ข้อมูล
                    */}
                    <div className="text-sm text-gray-700 mb-2">ตัวอย่างข้อมูลผลลัพธ์ (10 แถวแรก):</div>
                    <div className="overflow-x-auto">
                        <pre className="bg-gray-50 p-4 rounded-md text-xs whitespace-pre-wrap_font-mono">
                            {JSON.stringify(lthcIllustrationData.slice(0, 10), null, 2)}
                        </pre>
                    </div>
                    {lthcIllustrationData.length > 10 && <p className="text-xs text-center mt-2 text-gray-500">... และข้อมูลอื่นๆ อีก {lthcIllustrationData.length - 10} แถว</p>}
                </section>
            )}
        </div>
    );
};

export default LthcPage;
