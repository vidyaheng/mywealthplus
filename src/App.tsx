// App.tsx (แก้ไข - คำนวณเมื่อกดปุ่ม + Navigate)

// --- ส่วนที่ 0: Imports ---
import React, { useState, useMemo, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as RouterContainer, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
//import TopButtons from "./components/TopButtons";
//import InvestmentReturnInput from './components/InvestmentReturnInput';
import ReduceSumInsuredModal from './components/ReduceSumInsuredModal';
import ChangeFrequencyModal from './components/ChangeFrequencyModal';
import WithdrawalPlanModal from './components/WithdrawalPlanModal';
import PausePremiumModal from './components/PausePremiumModal';
import AddInvestmentModal from './components/AddInvestmentModal';
// import FullViewModal from './components/FullViewModal';
import IWealthyLayout from "./pages/iwealthy/IWealthyLayout";
import IWealthyFormPage from "./pages/iwealthy/iWealthyFormPage";
import IWealthyTablePage from "./pages/iwealthy/iWealthyTablePage";
import IWealthyChartPage from "./pages/iwealthy/iWealthyChartPage";
//import LthcPage from "./pages/lthc/LthcPage";
import CiPlannerPage from "./pages/ci/CiPlannerPage";
import RetirePage from "./pages/retire/RetirePage";
import LifePlanPage from "./pages/lifeplan/LifePlanPage";
import PinForm from './PinForm';
import {
    getSumInsuredFactor,
    generateIllustrationTables,
    MonthlyCalculationOutputRow,
    AnnualCalculationOutputRow,
    CalculationInput,
    PausePeriodRecord,
    SumInsuredReductionRecord,
    AddInvestmentRecord,
    FrequencyChangeRecord,
    WithdrawalPlanRecord,
    ReductionHistoryRecord,
    PaymentFrequency,
    Gender
} from './lib/calculations'; // ตรวจสอบว่า path ถูกต้อง
import LTHCLayout from './pages/lthc/LTHCLayout'; // Import LTHCLayout
import LthcFormPage from './pages/lthc/LthcFormPage';
import LthcTablePage from './pages/lthc/LthcTablePage';
import LthcChartPage from './pages/lthc/LthcChartPage';
import { v4 as uuidv4 } from 'uuid';

// --- ส่วนที่ 1: Context Type, ค่าเริ่มต้น, Context Object, และ Hook Helper ---
export interface YourIllustrationResultType {
    monthly: MonthlyCalculationOutputRow[];
    annual: AnnualCalculationOutputRow[];
}

export const appInitialDefaults = {
    age: 30,
    gender: 'male' as Gender,
    paymentFrequency: 'annual' as PaymentFrequency,
    rpp: 100000,
    rtu: 0,
    investmentReturn: 5,
};

export interface AppContextType {
    age: number; setAge: React.Dispatch<React.SetStateAction<number>>;
    gender: Gender; setGender: React.Dispatch<React.SetStateAction<Gender>>;
    paymentFrequency: PaymentFrequency; setPaymentFrequency: React.Dispatch<React.SetStateAction<PaymentFrequency>>;
    rpp: number; setRpp: React.Dispatch<React.SetStateAction<number>>;
    rtu: number; setRtu: React.Dispatch<React.SetStateAction<number>>;
    sumInsured: number; setSumInsured: React.Dispatch<React.SetStateAction<number>>;
    rppPercent: number; setRppPercent: React.Dispatch<React.SetStateAction<number>>;

    investmentReturn: number;
    setInvestmentReturn: React.Dispatch<React.SetStateAction<number>>;

    handlePercentChange: (newPercent: number) => void;
    handleChangeInvestmentReturn: (newRate: number) => void;

    // ฟังก์ชันคำนวณหลัก (จะถูกเรียกโดยปุ่ม หรือ Modal)
    handleCalculate: () => void;
    illustrationData: YourIllustrationResultType | null; // ผลลัพธ์การคำนวณ
    setIllustrationData: React.Dispatch<React.SetStateAction<YourIllustrationResultType | null>>;

    // Modal States and Handlers (เหมือนเดิม)
    isReduceModalOpen: boolean; openReduceModal: () => void; reductionHistory: ReductionHistoryRecord[]; handleUpdateReduction: (data: { age: number; amount: number; }) => void; handleDeleteReduction: (idToDelete: string) => void;
    isChangeFreqModalOpen: boolean; openChangeFreqModal: () => void; frequencyChanges: FrequencyChangeRecord[]; handleAddFrequencyChange: (data: Omit<FrequencyChangeRecord, "id">) => void; handleDeleteFrequencyChange: (idToDelete: string) => void;
    isWithdrawalModalOpen: boolean; openWithdrawalModal: () => void; withdrawalPlan: WithdrawalPlanRecord[]; handleSaveWithdrawalPlan: (plan: WithdrawalPlanRecord[]) => void;
    isPauseModalOpen: boolean; openPauseModal: () => void; pausePeriods: PausePeriodRecord[]; handleSavePausePlan: (plan: PausePeriodRecord[]) => void;
    isAddInvestmentModalOpen: boolean; openAddInvestmentModal: () => void; addInvestmentPlan: AddInvestmentRecord[]; handleSaveAddInvestmentPlan: (plan: AddInvestmentRecord[]) => void;

    // State สำหรับ FullViewModal (ตัวอย่าง)
    // isFullViewModalOpen: boolean;
    // openFullViewModal: () => void;
    // closeFullViewModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppOutletContext(): AppContextType {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppOutletContext must be used within an AppContextProvider');
    }
    return context;
}
// --- จบส่วนที่ 1 ---

// Component Wrapper สำหรับ Router
export default function AppWrapper() {
    return (
        <RouterContainer>
            <App />
        </RouterContainer>
    );
}

// Main App Component
function App() {
    const navigate = useNavigate(); // <<< ต้องใช้ navigate
    const location = useLocation(); // <<< ต้องใช้ location

    // --- State Management หลัก (Individual States) ---
    const [age, setAge] = useState<number>(appInitialDefaults.age);
    const [gender, setGender] = useState<Gender>(appInitialDefaults.gender);
    const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(appInitialDefaults.paymentFrequency);
    const [rpp, setRpp] = useState<number>(appInitialDefaults.rpp);
    const [rtu, setRtu] = useState<number>(appInitialDefaults.rtu);
    const [investmentReturn, setInvestmentReturn] = useState<number>(appInitialDefaults.investmentReturn);

    // State สำหรับ Sum Insured
    const [sumInsured, setSumInsured] = useState<number>(() => {
        const factor = getSumInsuredFactor(appInitialDefaults.age);
        return Math.round(appInitialDefaults.rpp * factor);
    });

    // State สำหรับ % RPP/RTU
    const [rppPercent, setRppPercent] = useState<number>(() => {
        const totalInitial = appInitialDefaults.rpp + appInitialDefaults.rtu;
        return totalInitial > 0 ? Math.round((appInitialDefaults.rpp / totalInitial) * 100) : 100;
    });

    // State สำหรับเก็บผลลัพธ์การคำนวณ
    const [illustrationData, setIllustrationData] = useState<YourIllustrationResultType | null>(null);

    // Modal states
    const [isReduceModalOpen, setIsReduceModalOpen] = useState(false);
    const [reductionHistory, setReductionHistory] = useState<ReductionHistoryRecord[]>([]);
    const [isChangeFreqModalOpen, setIsChangeFreqModalOpen] = useState(false);
    const [frequencyChanges, setFrequencyChanges] = useState<FrequencyChangeRecord[]>([]);
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
    const [withdrawalPlan, setWithdrawalPlan] = useState<WithdrawalPlanRecord[]>([]);
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [pausePeriods, setPausePeriods] = useState<PausePeriodRecord[]>([]);
    const [isAddInvestmentModalOpen, setIsAddInvestmentModalOpen] = useState(false);
    const [addInvestmentPlan, setAddInvestmentPlan] = useState<AddInvestmentRecord[]>([]);

    // --- Handlers ---

    // Handler หลักสำหรับการคำนวณ + Navigate
    const handleCalculate = useCallback(() => {
        console.log("[App.tsx] handleCalculate triggered.");
        const typedReductionHistory: SumInsuredReductionRecord[] = reductionHistory.map(h => ({
            age: h.age, newSumInsured: h.amount
        }));

        const currentInputData: CalculationInput = {
            policyholderAge: age,
            policyholderGender: gender,
            initialPaymentFrequency: paymentFrequency,
            initialSumInsured: sumInsured,
            rppPerYear: rpp,
            rtuPerYear: rtu,
            assumedInvestmentReturnRate: investmentReturn / 100,
            premiumPayingTermYears: 0,
            pausePeriods: pausePeriods,
            sumInsuredReductions: typedReductionHistory,
            additionalInvestments: addInvestmentPlan,
            frequencyChanges: frequencyChanges,
            withdrawalPlan: withdrawalPlan,
        };
        console.log("[App.tsx] Calculating with Input:", JSON.parse(JSON.stringify(currentInputData)));

        try {
            const results = generateIllustrationTables(currentInputData);
            setIllustrationData(results);
            console.log("[App.tsx] Calculation successful. Illustration data updated.");

            // --- เพิ่ม Logic การ Navigate กลับเข้ามา ---
            const currentPath = location.pathname.toLowerCase(); // ใช้ lowercase เพื่อความแน่นอน
            if (currentPath.includes('/iwealthy/form') || currentPath.includes('/iwealthy/table')) {
                 console.log(`[App.tsx] Navigating from ${currentPath} to /iwealthy/table`);
                 navigate('/iwealthy/table');
            } else if (currentPath.includes('/iwealthy/chart')) {
                 console.log(`[App.tsx] Staying on /iwealthy/chart after calculation`);
                 // อาจจะไม่ต้องทำอะไร หรือจะ navigate('/iwealthy/chart') เพื่อ force refresh ถ้าต้องการ
                 // navigate('/iwealthy/chart'); // เอา comment ออกถ้าต้องการ refresh หน้า chart
            } else {
                 console.log(`[App.tsx] Calculation done on path ${currentPath}, navigating to /iwealthy/table by default.`);
                 // สำหรับ path อื่นๆ ที่อาจจะมีการคำนวณ (ถ้ามี) ให้ไปหน้า table เป็น default
                 navigate('/iwealthy/table');
            }
            // --- จบ Logic การ Navigate ---

        } catch (error) {
            console.error("Calculation failed:", error);
            setIllustrationData(null);
        }
    }, [
        // Dependencies: ค่า Input + navigate และ location สำหรับการเปลี่ยนหน้า
        age, gender, paymentFrequency, sumInsured, rpp, rtu, investmentReturn,
        pausePeriods, reductionHistory, addInvestmentPlan, frequencyChanges, withdrawalPlan,
        navigate, location.pathname // <<< เพิ่ม navigate และ location.pathname
    ]);

    // Handler สำหรับการเปลี่ยนแปลง Investment Return
    const handleChangeInvestmentReturn = useCallback((newRate: number) => {
        if (investmentReturn !== newRate) {
            console.log(`[App.tsx] Investment Return state changing from ${investmentReturn} to ${newRate}`);
            setInvestmentReturn(newRate);
        }
    }, [investmentReturn]);

    // Handler สำหรับการเปลี่ยนแปลง % RPP/RTU
    const handlePercentChange = useCallback((newPercentValue: number) => {
        const currentTotal = (rpp || 0) + (rtu || 0);
        const newPercent = Math.round(newPercentValue);
        console.log(`[App.tsx] RPP/RTU Percent changing to: ${newPercent}%`);
        if (currentTotal > 0) {
            const newRpp = Math.round(currentTotal * (newPercent / 100));
            const newRtu = currentTotal - newRpp;
            if (rppPercent !== newPercent) setRppPercent(newPercent);
            if (rpp !== newRpp) setRpp(newRpp);
            if (rtu !== newRtu) setRtu(newRtu);
        } else {
            if (rppPercent !== newPercent) setRppPercent(newPercent);
            if (rpp !== 0) setRpp(0);
            if (rtu !== 0) setRtu(0);
        }
    }, [rpp, rtu, rppPercent]);

    // --- Modal Handlers (เหมือนเดิม - ไม่มีการเรียก handleCalculate อัตโนมัติ) ---
    const openReduceModal = useCallback(() => setIsReduceModalOpen(true), []);
    const handleUpdateReduction = useCallback((data: { age: number; amount: number }) => {
        const newRecord: ReductionHistoryRecord = { id: uuidv4(), age: data.age, amount: Math.round(data.amount) };
        setReductionHistory(prev => [...prev, newRecord].sort((a, b) => a.age - b.age));
    }, []);
    const handleDeleteReduction = useCallback((id: string) => {
        setReductionHistory(prev => prev.filter(r => r.id !== id));
    }, []);

    const openChangeFreqModal = useCallback(() => setIsChangeFreqModalOpen(true), []);
    const handleAddFrequencyChange = useCallback((data: Omit<FrequencyChangeRecord, 'id'>) => {
        const newRecord: FrequencyChangeRecord = { ...data, id: uuidv4() };
        setFrequencyChanges(prev => [...prev, newRecord].sort((a,b) => a.startAge - b.startAge));
    }, []);
    const handleDeleteFrequencyChange = useCallback((id: string) => {
        setFrequencyChanges(prev => prev.filter(record => record.id !== id));
    }, []);

    const openWithdrawalModal = useCallback(() => setIsWithdrawalModalOpen(true), []);
    const handleSaveWithdrawalPlan = useCallback((plan: WithdrawalPlanRecord[]) => {
        setWithdrawalPlan(plan.sort((a,b) => a.startAge - b.startAge));
        setIsWithdrawalModalOpen(false);
    }, []);

    const openPauseModal = useCallback(() => setIsPauseModalOpen(true), []);
    const handleSavePausePlan = useCallback((plan: PausePeriodRecord[]) => {
        setPausePeriods(plan.sort((a,b) => a.startAge - b.startAge));
        setIsPauseModalOpen(false);
    }, []);

    const openAddInvestmentModal = useCallback(() => setIsAddInvestmentModalOpen(true), []);
    const handleSaveAddInvestmentPlan = useCallback((plan: AddInvestmentRecord[]) => {
        setAddInvestmentPlan(plan.sort((a,b) => a.startAge - b.startAge));
        setIsAddInvestmentModalOpen(false);
    }, []);
    // --- จบส่วน Handlers ---

    // --- ส่วน Effects ---
    // Effect สำหรับอัปเดต % RPP/RTU
    useEffect(() => {
        const total = (rpp || 0) + (rtu || 0);
        const newCalculatedPercent = total > 0 ? Math.round(((rpp || 0) / total) * 100) : 100;
        if (newCalculatedPercent !== rppPercent) {
            setRppPercent(newCalculatedPercent);
        }
    }, [rpp, rtu, rppPercent]);

    // Effect สำหรับอัปเดต Sum Insured อัตโนมัติ
    useEffect(() => {
        const factor = getSumInsuredFactor(age);
        if (factor <= 0) {
            if (sumInsured !== 0) setSumInsured(0);
            return;
        }
        const newCalculatedSumInsured = rpp * factor;
        const roundedSI = Math.round(newCalculatedSumInsured);
        if (roundedSI !== sumInsured) {
            console.log(`[App.tsx Effect SI] Updating Sum Insured from ${sumInsured} to ${roundedSI} based on age ${age} and rpp ${rpp}`);
            setSumInsured(roundedSI);
        }
    }, [age, rpp, sumInsured]);
    // --- จบส่วน Effects ---

    // --- ส่วนสร้าง Context Value ---
    const contextValue: AppContextType = useMemo(() => ({
        age, setAge, gender, setGender, paymentFrequency, setPaymentFrequency,
        rpp, setRpp, rtu, setRtu, sumInsured, setSumInsured,
        rppPercent, setRppPercent,
        investmentReturn, setInvestmentReturn,
        handleChangeInvestmentReturn,
        handlePercentChange,
        handleCalculate, // <<< ส่ง handleCalculate ที่มี navigate แล้ว
        illustrationData,
        setIllustrationData,

        // Modal states and handlers
        isReduceModalOpen, openReduceModal, reductionHistory, handleUpdateReduction, handleDeleteReduction,
        isChangeFreqModalOpen, openChangeFreqModal, frequencyChanges, handleAddFrequencyChange, handleDeleteFrequencyChange,
        isWithdrawalModalOpen, openWithdrawalModal, withdrawalPlan, handleSaveWithdrawalPlan,
        isPauseModalOpen, openPauseModal, pausePeriods, handleSavePausePlan,
        isAddInvestmentModalOpen, openAddInvestmentModal, addInvestmentPlan, handleSaveAddInvestmentPlan,

    }), [
        // Dependencies
        age, gender, paymentFrequency, rpp, rtu, sumInsured, rppPercent, investmentReturn,
        illustrationData,
        isReduceModalOpen, reductionHistory, isChangeFreqModalOpen, frequencyChanges,
        isWithdrawalModalOpen, withdrawalPlan, isPauseModalOpen, pausePeriods,
        isAddInvestmentModalOpen, addInvestmentPlan,

        // Setters และ Handlers (รวม handleCalculate ที่อัปเดตแล้ว)
        setAge, setGender, setPaymentFrequency, setRpp, setRtu, setSumInsured, setRppPercent,
        setInvestmentReturn, setIllustrationData,
        handleChangeInvestmentReturn, handlePercentChange, handleCalculate, // <<< handleCalculate อัปเดตแล้ว
        openReduceModal, handleUpdateReduction, handleDeleteReduction,
        openChangeFreqModal, handleAddFrequencyChange, handleDeleteFrequencyChange,
        openWithdrawalModal, handleSaveWithdrawalPlan,
        openPauseModal, handleSavePausePlan,
        openAddInvestmentModal, handleSaveAddInvestmentPlan,
    ]);

    const [isAuthenticated, setIsAuthenticated] = useState(false);

        if (!isAuthenticated) {
            // ยังไม่ได้ใส่ PIN หรือ PIN ไม่ถูกต้อง
            return <PinForm onSuccess={() => setIsAuthenticated(true)} />;
        }
    // --- จบส่วน Context Value ---

    // --- ส่วน JSX Layout ---
    return (
        
        <AppContext.Provider value={contextValue}>
            <div className="flex flex-col h-screen bg-blue-50 font-sans">
                <header className="bg-white shadow-sm w-full py-2 px-4 flex-shrink-0">
                    <h1 className="h-8 flex items-center justify-center text-base sm:text-lg font-semibold text-blue-900">
                        แผนการเงิน iWealthy
                    </h1>
                </header>
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/*<div className="flex-shrink-0">
                            <TopButtons
                                onOpenReduceModal={openReduceModal}
                                onOpenChangeFreqModal={openChangeFreqModal}
                                onOpenWithdrawalModal={openWithdrawalModal}
                                onOpenPauseModal={openPauseModal}
                                onOpenAddInvestmentModal={openAddInvestmentModal}
                                // สมมติว่าปุ่มคำนวณหลักของคุณอยู่ที่นี่ หรือใน IWealthyFormPage
                                // ถ้าปุ่มคำนวณหลักอยู่ใน Component อื่น ให้เรียก handleCalculate จาก Context ที่นั่น
                            />
                        </div>
                        <div className="flex justify-end px-4 py-1 flex-shrink-0">
                            <div className="w-full max-w-xs">
                                <InvestmentReturnInput
                                    value={investmentReturn}
                                    onChange={handleChangeInvestmentReturn}
                                    showInputField={true}
                                />
                            </div>
                        </div>
                        {/* --- ลบปุ่มคำนวณตัวอย่างออก --- */}
                        {/* <div className="px-4 pb-2 flex justify-center flex-shrink-0">
                             <button
                                onClick={handleCalculate}
                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                            >
                                คำนวณผล
                            </button>
                        </div> */}
                        <main className="flex-1 p-3 md:p-4 overflow-y-auto">
                            <Routes>
                                <Route path="/" element={<Navigate to="/iwealthy/form" replace />} />
                                <Route path="/iwealthy" element={<IWealthyLayout />}>
                                    <Route index element={<Navigate to="form" replace />} />
                                    {/* IWealthyFormPage อาจจะมีปุ่มคำนวณที่เรียก handleCalculate จาก context */}
                                    <Route path="form" element={<IWealthyFormPage />} />
                                    <Route path="table" element={<IWealthyTablePage />} />
                                    <Route path="chart" element={<IWealthyChartPage />} />
                                </Route>
                                <Route path="/lthc" element={<LTHCLayout />}>
                                    <Route index element={<Navigate to="form" replace />} />
                                    <Route path="form" element={<LthcFormPage />} />
                                    <Route path="table" element={<LthcTablePage />} />
                                    <Route path="chart" element={<LthcChartPage />} />
                                </Route>
                                <Route path="/ci" element={<CiPlannerPage />} />
                                <Route path="/retire" element={<RetirePage />} />
                                <Route path="/lifeplan" element={<LifePlanPage />} />
                                <Route path="*" element={<div>404 - Page Not Found</div>} />
                            </Routes>
                        </main>
                    </div> 
                </div>
            </div>
            {/* Modals */}
            <ReduceSumInsuredModal isOpen={isReduceModalOpen} onClose={() => setIsReduceModalOpen(false)} onUpdate={handleUpdateReduction} currentRpp={rpp} currentAge={age} currentSumInsured={sumInsured} history={reductionHistory} onDeleteReduction={handleDeleteReduction} />
            <ChangeFrequencyModal isOpen={isChangeFreqModalOpen} onClose={() => setIsChangeFreqModalOpen(false)} onAddChange={handleAddFrequencyChange} history={frequencyChanges} onDeleteChange={handleDeleteFrequencyChange} currentAge={age} />
            <WithdrawalPlanModal isOpen={isWithdrawalModalOpen} onClose={() => setIsWithdrawalModalOpen(false)} onSave={handleSaveWithdrawalPlan} initialPlan={withdrawalPlan} currentAge={age} />
            <PausePremiumModal isOpen={isPauseModalOpen} onClose={() => setIsPauseModalOpen(false)} onSave={handleSavePausePlan} initialPlan={pausePeriods} currentAge={age} />
            <AddInvestmentModal isOpen={isAddInvestmentModalOpen} onClose={() => setIsAddInvestmentModalOpen(false)} onSave={handleSaveAddInvestmentPlan} initialPlan={addInvestmentPlan} currentAge={age} />
        </AppContext.Provider>
    );
}

// --- จบ App Component ---
