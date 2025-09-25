import React, { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { FaBirthdayCake, FaVenusMars, FaBullseye, FaMoneyBillWave, FaBalanceScale } from 'react-icons/fa';
import type { WithdrawalPlanRecord } from '@/lib/calculations';

// Import sub-components
import PensionOptionsCard from '@/components/ret/pensionOptionsCard';
import IWealthyOptionsCard from '@/components/ret/iWealthyOptionsCard';
import ResultsDisplay from '@/components/ret/ResultsDisplay';
import RetirementWithdrawalModal from '@/components/ret/RetirementWithdrawalModal';

// --- Helper Components ---
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 border rounded-lg shadow-md bg-white space-y-4 ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) => (
    <h2 className="text-base font-semibold flex items-center gap-2 text-slate-700">
        {icon}
        {children}
    </h2>
);

const ModeButton = ({ label, isActive, onClick, className = '' }: { label: string, isActive: boolean, onClick: () => void, className?: string }) => (
    <button onClick={onClick} className={`flex-1 px-3 py-2 rounded-md font-medium text-sm transition-all ${isActive ? `${className} text-white shadow-sm` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
        {label}
    </button>
);


const RetirementFormPage = () => {
    const {
        // Main controls
        retirementPlanningMode, setRetirementPlanningMode,
        retirementPlanningAge, setRetirementPlanningAge,
        retirementGender, setRetirementGender,
        retirementDesiredAge, setRetirementDesiredAge,
        // Strategy
        retirementFundingMix, setRetirementFundingMix,
        // Goal-Based specific
        retirementDesiredAnnualPension, setRetirementDesiredAnnualPension,
        retirementAssumedInflationRate, setRetirementAssumedInflationRate,
        // Withdrawal Plan
        retirementIWealthyWithdrawalPlan, setRetirementIWealthyWithdrawalPlan,
        // Actions
        runRetirementCalculation, retirementIsLoading,
    } = useAppStore();
    
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

    const handleSaveWithdrawalPlan = (newPlan: WithdrawalPlanRecord[]) => {
        setRetirementIWealthyWithdrawalPlan(newPlan);
    };

    const ageOptions = Array.from({ length: 55 }, (_, i) => i + 20); // อายุ 20-74
    const isHybrid = retirementFundingMix === 'hybrid';
    const gridColsClass = isHybrid ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

    return (
        <div className="space-y-6">
            {/* --- Section 1: ข้อมูลเบื้องต้น (แถวยาวด้านบน) --- */}
            <Card>
                <SectionTitle>ข้อมูลเบื้องต้น</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="planningAge" className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                            <FaBirthdayCake className="text-blue-600" />
                            <span>อายุ ณ ปัจจุบัน</span>
                        </label>
                        <select id="planningAge" value={retirementPlanningAge} onChange={(e) => setRetirementPlanningAge(Number(e.target.value))} className="p-2 w-28 border rounded-md shadow-sm text-sm">
                            {ageOptions.map(age => <option key={age} value={age}>{age} ปี</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1 ml-3"><FaVenusMars className="text-gray-500" /><span>เพศ</span></label>
                        <div className="flex space-x-4 items-center mt-1 pt-1">
                             <label className="flex items-center cursor-pointer mb-3 ml-3">
                                <input type="radio" name="gender" value="male" checked={retirementGender === 'male'} onChange={() => setRetirementGender('male')} className="form-radio accent-blue-600 h-4 w-4" />
                                <span className={`ml-2 text-sm ${retirementGender === 'male' ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>ชาย</span>
                            </label>
                            <label className="flex items-center cursor-pointer mb-3">
                                <input type="radio" name="gender" value="female" checked={retirementGender === 'female'} onChange={() => setRetirementGender('female')} className="form-radio accent-pink-600 h-4 w-4" />
                                <span className={`ml-2 text-sm ${retirementGender === 'female' ? 'font-semibold text-pink-600' : 'text-gray-700'}`}>หญิง</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="retireAge" className="block text-xs font-medium text-gray-700 mb-1">อายุที่ต้องการเกษียณ</label>
                        <select id="retireAge" value={retirementDesiredAge} onChange={(e) => setRetirementDesiredAge(Number(e.target.value))} className="p-2 w-28 border rounded-md shadow-sm text-sm">
                            {Array.from({ length: 21 }, (_, i) => i + 55).map(age => <option key={age} value={age}>{age} ปี</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            {/* --- Section 2: ส่วนการวางแผน --- */}
            <div className={`grid grid-cols-1 ${gridColsClass} gap-6 items-stretch`}>
                {/* --- คอลัมน์ที่ 1: ตัวควบคุมหลัก --- */}
                <div className="lg:col-span-1">
                    <Card className="h-full"> 
                        <div className="space-y-3">
                            <SectionTitle icon={retirementPlanningMode === 'goalBased' ? <FaBullseye className="text-green-600" /> : <FaMoneyBillWave className="text-purple-600" />}>
                                รูปแบบการวางแผน
                            </SectionTitle>
                            <div className="flex space-x-2">
                                <ModeButton label="ตามเป้าหมาย" isActive={retirementPlanningMode === 'goalBased'} onClick={() => setRetirementPlanningMode('goalBased')} className="bg-green-600 hover:bg-green-700" />
                                <ModeButton label="ตามงบประมาณ" isActive={retirementPlanningMode === 'premiumBased'} onClick={() => setRetirementPlanningMode('premiumBased')} className="bg-purple-600 hover:bg-purple-600" />
                            </div>
                            {retirementPlanningMode === 'goalBased' && (
                                <div className="space-y-3 pt-2 animate-fadeIn">
                                    <div>
                                        <label htmlFor="desiredPension" className="block text-xs font-medium text-gray-700 mb-1">บำนาญที่คาดหวัง/ปี (มูลค่าปัจจุบัน)</label>
                                        <input id="desiredPension" type="number" value={retirementDesiredAnnualPension} onChange={(e) => setRetirementDesiredAnnualPension(Number(e.target.value))} className="p-2 w-full border rounded-md shadow-sm text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="inflationRate" className="block text-xs font-medium text-gray-700 mb-1">เงินเฟ้อคาดการณ์ (% ต่อปี)</label>
                                        <input id="inflationRate" type="number" value={retirementAssumedInflationRate} onChange={(e) => setRetirementAssumedInflationRate(Number(e.target.value))} className="p-2 w-full border rounded-md shadow-sm text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <hr />
                        <div className="space-y-3">
                            <SectionTitle icon={<FaBalanceScale className="text-orange-600" />}>กลยุทธ์การลงทุน</SectionTitle>
                            <select value={retirementFundingMix} onChange={(e) => setRetirementFundingMix(e.target.value as any)} className="p-2 w-full border rounded-md shadow-sm text-sm">
                                <option value="hybrid">Hybrid (บำนาญ + iWealthy)</option>
                                <option value="iWealthyOnly">iWealthy อย่างเดียว</option>
                                <option value="pensionOnly">แผนบำนาญอย่างเดียว</option>
                            </select>
                        </div>
                    </Card>
                </div>

                {/* --- คอลัมน์ที่ 2 & 3: ตัวเลือกตามกลยุทธ์ --- */}
                {(retirementFundingMix === 'iWealthyOnly' || retirementFundingMix === 'hybrid') && (
                    <div className="lg:col-span-1">
                        <IWealthyOptionsCard onOpenWithdrawalModal={() => setIsWithdrawalModalOpen(true)} />
                    </div>
                )}
                {(retirementFundingMix === 'pensionOnly' || retirementFundingMix === 'hybrid') && (
                    <div className="lg:col-span-1">
                        <PensionOptionsCard />
                    </div>
                )}
            </div>

            {/* --- Section 3: ส่วนปุ่มคำนวณและแสดงผล --- */}
            <div className="space-y-6">
                <button
                    onClick={runRetirementCalculation}
                    disabled={retirementIsLoading}
                    className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all disabled:bg-gray-400 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-lg"
                >
                    {retirementIsLoading ? 'กำลังคำนวณ...' : 'คำนวณแผนเกษียณ'}
                </button>
                <ResultsDisplay />
            </div>

            <RetirementWithdrawalModal 
                isOpen={isWithdrawalModalOpen}
                onClose={() => setIsWithdrawalModalOpen(false)}
                currentPlan={retirementIWealthyWithdrawalPlan}
                onSave={handleSaveWithdrawalPlan}
                retirementAge={retirementDesiredAge}
            />
        </div>
    );
};

export default RetirementFormPage;