import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { LifeReadyPaymentTerm, IHealthyUltraPlan, MEBPlan, PensionPlanType } from '../../hooks/useLthcTypes';
import { MAX_POLICY_AGE_TYPE } from '../../hooks/useLthcTypes';
import { calculateLifeReadyPremium, calculateIHealthyUltraPremium, calculateMEBPremium } from '../../lib/healthPlanCalculations';
import { FaBirthdayCake, FaVenusMars, FaShieldAlt, FaHandHoldingUsd, FaCog, FaExclamationTriangle } from 'react-icons/fa';
import LthcReduceSumInsuredModal from '@/components/LthcReduceSumInsuredModal';

// --- Constants ---
const MIN_LR_SA_NORMAL_MODE = 150000;
const PACKAGE_LR_SA = 50000;
const DEFAULT_LR_PPT_PACKAGE = 99 as LifeReadyPaymentTerm;
const DEFAULT_LR_PPT_NORMAL = 18 as LifeReadyPaymentTerm;

const iHealthyUltraPlanColors: Record<string, string> = {
    Smart: 'text-green-700', Bronze: 'text-yellow-700', Silver: 'text-gray-500',
    Gold: 'text-yellow-500', Diamond: 'text-blue-400', Platinum: 'text-purple-700',
};

// --- Helper Components (ปรับลดขนาด) ---
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <section className={`p-3 border rounded-lg shadow-md bg-white space-y-3 ${className}`}>
        {children}
    </section>
);

const SectionTitle = ({ children, icon, className }: { children: React.ReactNode, icon?: React.ReactNode, className?: string }) => (
    <h2 className={`text-base font-semibold flex items-center gap-2 ${className}`}>
        {icon}
        {children}
    </h2>
);

const ModeButton = ({ label, isActive, onClick, className = 'bg-blue-600 hover:bg-blue-700' }: { label: string, isActive: boolean, onClick: () => void, className?: string }) => (
     <button onClick={onClick} className={`flex-1 px-2.5 py-1.5 rounded-md font-medium text-xs transition-all ${isActive ? `${className} text-white shadow-sm` : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
        {label}
    </button>
);

// --- Main Component ---
export default function LthcFormPage() {
    // --- All store logic, state, effects, and handlers remain the same ---
    const { policyholderEntryAge, setPolicyholderEntryAge, policyholderGender, setPolicyholderGender, policyOriginMode, setPolicyOriginMode, existingPolicyEntryAge, setExistingPolicyEntryAge, selectedHealthPlans, setSelectedHealthPlans, fundingSource, setFundingSource, iWealthyMode, setIWealthyMode, autoInvestmentReturn, setAutoInvestmentReturn, autoIWealthyPPT, setAutoIWealthyPPT, autoRppRtuRatio, setAutoRppRtuRatio, manualRpp, setManualRpp, manualRtu, setManualRtu, manualInvestmentReturn, setManualInvestmentReturn, manualIWealthyPPT, setManualIWealthyPPT, manualWithdrawalStartAge, setManualWithdrawalStartAge, pensionMode, setPensionMode, pensionFundingOptions, setPensionFundingOptions, manualPensionPremium, setManualPensionPremium, isLoading, error, runCalculation, solvedPensionSA, solvedPensionPremium, calculatedMinPremium, calculatedRpp, calculatedRtu, saReductionStrategy, setSaReductionStrategy } = useAppStore();
    const [isReduceSaModalOpen, setIsReduceSaModalOpen] = useState(false);
    const [lifeReadyMode, setLifeReadyMode] = useState<'normal' | 'package'>(() => (selectedHealthPlans.lifeReadySA === PACKAGE_LR_SA && selectedHealthPlans.lifeReadyPPT === DEFAULT_LR_PPT_PACKAGE) ? 'package' : 'normal');
    const [isIHUSelected, setIsIHUSelected] = useState<boolean>(() => selectedHealthPlans.iHealthyUltraPlan !== null);
    const [isMEBSelected, setIsMEBSelected] = useState<boolean>(() => selectedHealthPlans.mebPlan !== null);
    const [isFundingEnabled, setIsFundingEnabled] = useState(() => fundingSource !== 'none');
    useEffect(() => { if (isFundingEnabled && fundingSource === 'none') { setFundingSource('iWealthy'); } else if (!isFundingEnabled && fundingSource !== 'none') { setFundingSource('none'); } }, [isFundingEnabled, fundingSource, setFundingSource]);
    useEffect(() => { if (policyOriginMode === 'newPolicy') { if (lifeReadyMode === 'package') { setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: PACKAGE_LR_SA, lifeReadyPPT: DEFAULT_LR_PPT_PACKAGE }); } else { setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: Math.max(selectedHealthPlans.lifeReadySA, MIN_LR_SA_NORMAL_MODE), lifeReadyPPT: selectedHealthPlans.lifeReadyPPT === DEFAULT_LR_PPT_PACKAGE ? DEFAULT_LR_PPT_NORMAL : selectedHealthPlans.lifeReadyPPT }); } } else if (policyOriginMode === 'existingPolicy') { setLifeReadyMode('normal'); } }, [policyOriginMode, lifeReadyMode, setSelectedHealthPlans]);
    useEffect(() => { if (policyOriginMode === 'newPolicy') setExistingPolicyEntryAge(undefined); }, [policyOriginMode, setExistingPolicyEntryAge]);
    useEffect(() => setIsIHUSelected(selectedHealthPlans.iHealthyUltraPlan !== null), [selectedHealthPlans.iHealthyUltraPlan]);
    useEffect(() => setIsMEBSelected(selectedHealthPlans.mebPlan !== null), [selectedHealthPlans.mebPlan]);
    const handleLifeReadySAInput = (inputValue: string) => { let value = parseInt(inputValue, 10); if (isNaN(value)) value = 0; setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: Math.max(0, value) }); };
    const handleLifeReadyPPTChange = (value: LifeReadyPaymentTerm) => setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadyPPT: value });
    const handleLifeReadySAInputBlur = (e: React.FocusEvent<HTMLInputElement>) => { if (policyOriginMode === 'newPolicy' && lifeReadyMode === 'normal') { let currentSA = parseInt(e.target.value, 10); if (isNaN(currentSA) || (currentSA > 0 && currentSA < MIN_LR_SA_NORMAL_MODE)) setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: MIN_LR_SA_NORMAL_MODE }); else if (currentSA <= 0 && e.target.value !== "") setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: MIN_LR_SA_NORMAL_MODE }); } };
    const handleIHUCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setIsIHUSelected(isChecked); setSelectedHealthPlans({ ...selectedHealthPlans, iHealthyUltraPlan: isChecked ? (selectedHealthPlans.iHealthyUltraPlan ?? 'Bronze') : null }); };
    const handleIHUPlanChange = (value: IHealthyUltraPlan) => { if (isIHUSelected) setSelectedHealthPlans({ ...selectedHealthPlans, iHealthyUltraPlan: value }); };
    const handleMEBCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setIsMEBSelected(isChecked); setSelectedHealthPlans({ ...selectedHealthPlans, mebPlan: isChecked ? (selectedHealthPlans.mebPlan ?? 1000) : null }); };
    const handleMEBPlanChange = (value: MEBPlan) => { if (isMEBSelected) setSelectedHealthPlans({ ...selectedHealthPlans, mebPlan: value }); };
    const displayLifeReadySA = (policyOriginMode === 'newPolicy' && lifeReadyMode === 'package') ? PACKAGE_LR_SA : selectedHealthPlans.lifeReadySA;
    const displayLifeReadyPPT = (policyOriginMode === 'newPolicy' && lifeReadyMode === 'package') ? DEFAULT_LR_PPT_PACKAGE : selectedHealthPlans.lifeReadyPPT;
    const entryAgeForLrPremiumCalc = useMemo(() => (policyOriginMode === 'existingPolicy' && existingPolicyEntryAge !== undefined) ? existingPolicyEntryAge : policyholderEntryAge, [policyOriginMode, existingPolicyEntryAge, policyholderEntryAge]);
    const currentLrPremium = useMemo(() => calculateLifeReadyPremium(entryAgeForLrPremiumCalc, policyholderGender, displayLifeReadySA, displayLifeReadyPPT), [entryAgeForLrPremiumCalc, policyholderGender, displayLifeReadySA, displayLifeReadyPPT]);
    const currentIhuPremium = useMemo(() => (isIHUSelected && selectedHealthPlans.iHealthyUltraPlan !== null) ? calculateIHealthyUltraPremium(policyholderEntryAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan) : 0, [isIHUSelected, policyholderEntryAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan]);
    const currentMebPremium = useMemo(() => (isMEBSelected && selectedHealthPlans.mebPlan !== null) ? calculateMEBPremium(policyholderEntryAge, selectedHealthPlans.mebPlan) : 0, [isMEBSelected, policyholderEntryAge, selectedHealthPlans.mebPlan]);
    const totalFirstYearHealthPremium = currentLrPremium + currentIhuPremium + currentMebPremium;
    const ageOptions = useMemo(() => Array.from({ length: 80 }, (_, i) => i + 1), []);
    const existingAgeOptions = useMemo(() => { if (policyholderEntryAge <= 1) return []; return Array.from({ length: policyholderEntryAge - 1 }, (_, i) => policyholderEntryAge - 1 - i).filter(age => age >= 0); }, [policyholderEntryAge]);
    const showIHUWarning = !isIHUSelected;

    const renderFundingOptions = () => {
        switch (fundingSource) {
            case 'iWealthy': return (
                <div className="animate-fadeIn space-y-3">
                    <div className="flex space-x-2"><ModeButton label="Auto" isActive={iWealthyMode === 'automatic'} onClick={() => setIWealthyMode('automatic')} className="bg-sky-600 hover:bg-sky-700"/><ModeButton label="Manual" isActive={iWealthyMode === 'manual'} onClick={() => setIWealthyMode('manual')} className="bg-emerald-600 hover:bg-emerald-700"/></div>
                    <div className="space-y-1.5 pt-1">
                        <h3 className="text-xs font-medium text-slate-600">รูปแบบการลดทุน</h3>
                        <div className="grid grid-cols-2 rounded-md shadow-sm">
                            <button type="button" onClick={() => setSaReductionStrategy({ type: 'auto' })} className={`px-3 py-1.5 text-xs font-medium rounded-l-md border border-gray-300 transition-colors ${saReductionStrategy.type === 'auto' ? 'bg-blue-600 text-white z-10' : 'bg-white hover:bg-gray-50'}`}>อัตโนมัติ (แนะนำ)</button>
                            <button type="button" onClick={() => setIsReduceSaModalOpen(true)} className={`px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-b border-r border-gray-300 transition-colors ${saReductionStrategy.type !== 'auto' ? 'bg-emerald-600 text-white z-10' : 'bg-white hover:bg-gray-50'}`}>กำหนดเอง...</button>
                        </div>
                        {saReductionStrategy.type === 'manual' && (<p className="text-[11px] text-right pr-1 text-gray-600">กำหนดเอง ({saReductionStrategy.ages.length} ช่วงอายุ)</p>)}
                        {saReductionStrategy.type === 'none' && (<p className="text-[11px] text-right pr-1 text-gray-600">ตั้งค่าเป็น: ไม่ลดทุน</p>)}
                    </div>
                    <hr className="!my-2"/>
                    {iWealthyMode === 'automatic' ? (
                        <div className="space-y-2 p-2 bg-gray-50 rounded-md border">
                            <div><label className="block text-xs font-medium text-gray-700">ผลตอบแทน (%):</label><input type="number" step="0.5" value={autoInvestmentReturn} onChange={e => setAutoInvestmentReturn(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                            <div><label className="block text-xs font-medium text-gray-700">ระยะเวลาชำระเบี้ย iWealthy (ปี):</label><input type="number" value={autoIWealthyPPT} onChange={e => setAutoIWealthyPPT(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                            <div><label className="block text-xs font-medium text-gray-700">สัดส่วน RPP/RTU:</label><select value={autoRppRtuRatio} onChange={e => setAutoRppRtuRatio(e.target.value)} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs"><option value="100/0">RPP 100%</option><option value="80/20">RPP 80%/RTU 20%</option><option value="70/30">RPP 70%/RTU 30%</option><option value="60/40">RPP 60%/RTU 40%</option><option value="50/50">RPP 50%/RTU 50%</option></select></div>
                        </div>
                    ) : (
                        <div className="space-y-2 p-2 bg-gray-50 rounded-md border">
                            <div><label className="block text-[11px] font-medium text-gray-700">RPP (ต่อปี):</label><input type="number" step="1000" value={manualRpp} onChange={e => setManualRpp(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-gray-700">RTU (ต่อปี):</label><input type="number" step="1000" value={manualRtu} onChange={e => setManualRtu(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-gray-700">ผลตอบแทน (%):</label><input type="number" step="0.5" value={manualInvestmentReturn} onChange={e => setManualInvestmentReturn(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-gray-700">ระยะเวลาจ่ายเบี้ย iWealthy (ปี):</label><input type="number" value={manualIWealthyPPT} onChange={e => setManualIWealthyPPT(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-gray-700">อายุเริ่มถอน:</label><input type="number" value={manualWithdrawalStartAge} onChange={e => setManualWithdrawalStartAge(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                        </div>
                    )}
                </div>
            );
            case 'pension': return (
                <div className="animate-fadeIn space-y-3">
                    <div className="flex space-x-2"><ModeButton label="Auto" isActive={pensionMode === 'automatic'} onClick={() => setPensionMode('automatic')} className="bg-sky-600 hover:bg-sky-700"/><ModeButton label="Manual" isActive={pensionMode === 'manual'} onClick={() => setPensionMode('manual')} className="bg-emerald-600 hover:bg-emerald-700"/></div>
                    <div className="space-y-2 p-2 bg-gray-50 rounded-md border">
                        <div><label className="block text-[11px] font-medium text-gray-700">เลือกแผนบำนาญ:</label><select value={pensionFundingOptions.planType} onChange={e => setPensionFundingOptions({ planType: e.target.value as PensionPlanType })} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs"><option value="pension8">บำนาญ 8 (จ่ายเบี้ย 8 ปี)</option><option value="pension60">บำนาญ 60 (จ่ายเบี้ยถึงอายุ 60)</option></select></div>
                        {pensionMode === 'manual' && (<div className="animate-fadeIn pt-2"><label className="block text-[11px] font-medium text-gray-700">เบี้ยบำนาญที่ต้องการ (ต่อปี):</label><input type="number" step="1000" value={manualPensionPremium} onChange={e => setManualPensionPremium(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>)}
                    </div>
                </div>
            );
            case 'hybrid': return (
                <div className="animate-fadeIn space-y-3">
                     <div className="space-y-2 p-2 bg-teal-50 rounded-md border border-teal-200">
                           <h3 className="font-semibold text-teal-800 text-sm">ส่วนของแผนบำนาญ</h3>
                           <div><label className="block text-[11px] font-medium text-gray-700">เลือกแผนบำนาญ:</label><select value={pensionFundingOptions.planType} onChange={e => setPensionFundingOptions({ planType: e.target.value as PensionPlanType })} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs"><option value="pension8">บำนาญ 8</option><option value="pension60">บำนาญ 60</option></select></div>
                           <div><label className="block text-[11px] font-medium text-gray-700">เบี้ยบำนาญ (ต่อปี):</label><input type="number" step="1000" value={manualPensionPremium} onChange={e => setManualPensionPremium(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                     </div>
                     <div className="space-y-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                         <h3 className="font-semibold text-blue-800 text-sm">ส่วนของ iWealthy</h3>
                         <p className="text-[11px] text-gray-600">iWealthy จะคำนวณส่วนต่างอัตโนมัติ</p>
                         <div><label className="block text-[11px] font-medium text-gray-700">ผลตอบแทน (%):</label><input type="number" step="0.5" value={autoInvestmentReturn} onChange={e => setAutoInvestmentReturn(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                         <div><label className="block text-[11px] font-medium text-gray-700">ระยะเวลาชำระเบี้ย iWealthy (ปี):</label><input type="number" value={autoIWealthyPPT} onChange={e => setAutoIWealthyPPT(Number(e.target.value))} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs" /></div>
                     </div>
                </div>
            );
            default: return null;
        }
    };
    
    const renderResultsSummary = () => {
        if (isLoading) return null;
        if (fundingSource === 'pension') {
            return (
                <div className="text-white text-left animate-fadeIn">
                    <h3 className="text-sm font-semibold">เบี้ยบำนาญที่คำนวณได้:</h3>
                    <p className="text-2xl font-bold">{solvedPensionPremium?.toLocaleString() ?? '-'} <span className="text-base font-medium">บาท/ปี</span></p>
                    <p className="text-[11px]">(ทุน: {solvedPensionSA?.toLocaleString() ?? '-'})</p>
                </div>
            );
        }
        if (fundingSource === 'iWealthy' && iWealthyMode === 'automatic') {
             return (
                <div className="text-white text-left animate-fadeIn">
                    <h3 className="text-sm font-semibold">เบี้ย iWealthy ที่แนะนำ:</h3>
                    <p className="text-2xl font-bold">{calculatedMinPremium?.toLocaleString() ?? '-'} <span className="text-base font-medium">บาท/ปี</span></p>
                    <p className="text-[11px]">(RPP: {calculatedRpp?.toLocaleString() ?? '-'}, RTU: {calculatedRtu?.toLocaleString() ?? '-'})</p>
                </div>
            );
        }
         if (fundingSource === 'hybrid') {
             return (
                <div className="text-white text-left animate-fadeIn">
                    <h3 className="text-sm font-semibold">เบี้ยที่คำนวณได้ (Hybrid):</h3>
                    <p className="text-lg font-bold">บำนาญ: {manualPensionPremium?.toLocaleString() ?? '-'} บ.</p>
                    <p className="text-lg font-bold">iWealthy: {calculatedMinPremium?.toLocaleString() ?? '-'} บ.</p>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="space-y-4 pb-12">
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 items-start">
                    <div className="space-y-2 md:col-span-2">
                        <SectionTitle className="text-slate-700">ข้อมูลผู้เอาประกัน</SectionTitle>
                        <div className="grid grid-cols-2 gap-x-4 items-end pt-1">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1"><FaBirthdayCake className="text-blue-700 text-xs"/><label htmlFor="currentEntryAge" className="text-xs font-medium text-gray-700">อายุ (ปัจจุบัน)</label></div>
                                <select id="currentEntryAge" value={policyholderEntryAge} onChange={(e) => setPolicyholderEntryAge(Math.max(1, Math.min(80, parseInt(e.target.value, 10) || 1)))} className="p-1.5 w-24 border rounded-md shadow-sm text-xs">{ageOptions.map(age => <option key={`current-${age}`} value={age}>{age}</option>)}</select>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1"><FaVenusMars className="text-blue-700 text-xs" /><label className="text-xs font-medium text-gray-700">เพศ</label></div>
                                <div className="flex space-x-3 items-center mt-1">
                                    <label className="flex items-center cursor-pointer"><input type="radio" name="genderForm" value="male" checked={policyholderGender === 'male'} onChange={() => setPolicyholderGender('male')} className="form-radio accent-blue-600 h-3.5 w-3.5" /><span className={`ml-1.5 text-xs ${policyholderGender === 'male' ? 'font-bold text-blue-600' : 'text-gray-700'}`}>ชาย</span></label>
                                    <label className="flex items-center cursor-pointer"><input type="radio" name="genderForm" value="female" checked={policyholderGender === 'female'} onChange={() => setPolicyholderGender('female')} className="form-radio accent-pink-600 h-3.5 w-3.5" /><span className={`ml-1.5 text-xs ${policyholderGender === 'female' ? 'font-bold text-pink-600' : 'text-gray-700'}`}>หญิง</span></label>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2 md:col-span-1">
                        <SectionTitle icon={<FaShieldAlt className="text-orange-600" />} className="text-slate-700">สถานะแผน</SectionTitle>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 w-full pt-1">
                            <ModeButton label="เริ่มแผนใหม่" isActive={policyOriginMode === 'newPolicy'} onClick={() => setPolicyOriginMode('newPolicy')} className="bg-sky-600 hover:bg-sky-700"/>
                            <ModeButton label="มีแผนเดิม" isActive={policyOriginMode === 'existingPolicy'} onClick={() => setPolicyOriginMode('existingPolicy')} className="bg-orange-500 hover:bg-orange-600"/>
                        </div>
                         {policyOriginMode === 'existingPolicy' && (<div className="animate-fadeIn mt-2"><label className="block text-xs font-medium text-gray-700">อายุที่เริ่มทำ LifeReady เดิม:</label><select value={existingPolicyEntryAge || ''} onChange={(e) => setExistingPolicyEntryAge(e.target.value ? parseInt(e.target.value, 10) : undefined)} className="mt-1 p-1.5 w-full border rounded-md shadow-sm text-xs"><option value="">-- เลือกอายุ --</option>{existingAgeOptions.map(age => (<option key={`existing-${age}`} value={age}>{age}</option>))}</select></div>)}
                    </div>
                </div>
            </Card>

            <div className={`grid grid-cols-1 lg:grid-cols-${isFundingEnabled ? '3' : '2'} gap-4`}>
                <Card>
                    <SectionTitle icon={<FaShieldAlt className="text-blue-700" />} className="text-slate-700">1. สัญญาหลัก</SectionTitle>
                    <div className={`p-2 border rounded-md ${policyOriginMode === 'existingPolicy' ? 'bg-orange-50' : (lifeReadyMode === 'package' ? 'bg-green-50' : 'bg-blue-50')}`}>
                        <h3 className="font-medium text-xs text-slate-700">LifeReady</h3>
                        {policyOriginMode === 'newPolicy' && <div className="flex space-x-2 my-2"><ModeButton label="ปกติ" isActive={lifeReadyMode === 'normal'} onClick={() => setLifeReadyMode('normal')} className="bg-blue-500 hover:bg-blue-600"/><ModeButton label="Package" isActive={lifeReadyMode === 'package'} onClick={() => setLifeReadyMode('package')} className="bg-green-500 hover:bg-green-600"/></div>}
                        <div className="space-y-1.5 mt-2">
                            <div><label className="block text-xs font-medium text-gray-700">ทุนประกันภัย:</label><input type="number" value={displayLifeReadySA} onChange={(e) => handleLifeReadySAInput(e.target.value)} disabled={lifeReadyMode === 'package'} onBlur={handleLifeReadySAInputBlur} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs disabled:bg-gray-200" step="50000" /></div>
                            <div><label className="block text-xs font-medium text-gray-700">ระยะเวลาชำระเบี้ย:</label><select value={displayLifeReadyPPT} onChange={(e) => handleLifeReadyPPTChange(Number(e.target.value) as LifeReadyPaymentTerm)} disabled={lifeReadyMode === 'package'} className="mt-0.5 p-1.5 w-full border rounded-md shadow-sm text-xs disabled:bg-gray-200"><option value={6}>6 ปี</option><option value={12}>12 ปี</option><option value={18}>18 ปี</option><option value={99}>ถึงอายุ 99 ปี</option></select></div>
                            <div className="pt-1"><p className="text-xs text-gray-500">เบี้ยปีแรก:</p><p className={`text-xs font-semibold`}>{currentLrPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p></div>
                        </div>
                    </div>
                    <hr className="!my-2"/>
                    <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-medium text-sm text-gray-700">วางแผนการเงิน LTHC</span>
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={isFundingEnabled} onChange={() => setIsFundingEnabled(prev => !prev)} />
                                <div className={`block w-9 h-5 rounded-full ${isFundingEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isFundingEnabled ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </Card>

                <Card>
                    <SectionTitle icon={<FaShieldAlt className="text-green-600" />} className="text-slate-700">2. สัญญาเพิ่มเติม</SectionTitle>
                    <div className="p-2 border rounded-md bg-indigo-50">
                        <label className="flex items-center space-x-2 cursor-pointer mb-1.5"><input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-indigo-600 rounded" checked={isIHUSelected} onChange={handleIHUCheckboxChange} /><span className="font-medium text-xs text-indigo-700">iHealthy Ultra</span></label>
                        {isIHUSelected && (<div className="pl-5 space-y-1 animate-fadeIn"><label className="text-xs text-gray-600 block">เลือกแผน:</label><select value={selectedHealthPlans.iHealthyUltraPlan ?? 'Bronze'} onChange={(e) => handleIHUPlanChange(e.target.value as IHealthyUltraPlan)} className={`p-1 border rounded-md text-md w-full ${selectedHealthPlans.iHealthyUltraPlan && iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan] ? iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan] : 'text-gray-700'}`}>{(['Smart', 'Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum'] as IHealthyUltraPlan[]).map(planName => (<option key={planName} value={planName} className={iHealthyUltraPlanColors[planName] ?? ''}>{planName}</option>))}</select><div className="pt-1"><p className="text-xs text-gray-500">เบี้ยปีแรก:</p><p className={`text-xs font-semibold`}>{currentIhuPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p></div></div>)}
                    </div>
                    <div className="p-2 border rounded-md bg-lime-50">
                        <label className="flex items-center space-x-2 cursor-pointer mb-1.5"><input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-lime-600 rounded" checked={isMEBSelected} onChange={handleMEBCheckboxChange} /><span className="font-medium text-xs text-lime-700">MEB (ค่าชดเชย)</span></label>
                        {isMEBSelected && (<div className="pl-5 space-y-1 animate-fadeIn"><label className="text-xs text-gray-600 block">เลือกแผน:</label><select value={selectedHealthPlans.mebPlan ?? 1000} onChange={(e) => handleMEBPlanChange(Number(e.target.value) as MEBPlan)} className="p-1 border rounded-md text-md w-full">{( [500, 1000, 2000, 3000, 4000, 5000] as MEBPlan[]).map(planValue => (<option key={planValue} value={planValue}>{planValue.toLocaleString()}</option>))}</select><div className="pt-1"><p className="text-xs text-gray-500">เบี้ยปีแรก:</p><p className="text-xs font-semibold text-lime-700">{currentMebPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p></div></div>)}
                    </div>
                </Card>

                {isFundingEnabled && (
                    <Card>
                        <SectionTitle icon={<FaHandHoldingUsd className="text-purple-600" />} className="text-slate-700">3. วางแผน LTHC</SectionTitle>
                        <div className="flex rounded-md shadow-sm" role="group">
                            <button type="button" onClick={() => setFundingSource('iWealthy')} className={`relative inline-flex items-center justify-center flex-1 px-3 py-1.5 text-xs font-medium rounded-l-md border border-gray-300 transition-colors ${ fundingSource === 'iWealthy' ? 'bg-blue-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50' }`}>iWealthy</button>
                            <button type="button" onClick={() => setFundingSource('pension')} className={`relative inline-flex items-center justify-center flex-1 px-3 py-1.5 text-xs font-medium -ml-px border border-gray-300 transition-colors ${ fundingSource === 'pension' ? 'bg-teal-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50' }`}>บำนาญ</button>
                            <button type="button" onClick={() => setFundingSource('hybrid')} className={`relative inline-flex items-center justify-center flex-1 px-3 py-1.5 text-xs font-medium rounded-r-md -ml-px border border-gray-300 transition-colors ${ fundingSource === 'hybrid' ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50' }`}>Hybrid</button>
                        </div>
                        <hr className="!my-2"/>
                        <SectionTitle icon={<FaCog className="text-gray-600" />} className="text-slate-700 text-sm">ตั้งค่า</SectionTitle>
                        {renderFundingOptions()}
                    </Card>
                )}
            </div>

            <div className="mt-4 p-4 border rounded-lg shadow-xl bg-gradient-to-r from-sky-500 to-indigo-600">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-white text-left">
                        <h3 className="text-sm font-semibold">เบี้ยสุขภาพรวมปีแรก:</h3>
                        <p className="text-2xl font-bold">{totalFirstYearHealthPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-medium">บาท/ปี</span></p>
                    </div>
                    {renderResultsSummary()}
                    <button onClick={runCalculation} disabled={isLoading || showIHUWarning} className={`w-full md:w-auto px-8 py-2.5 bg-green-500 text-white font-bold text-sm rounded-lg shadow-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 ${(isLoading || showIHUWarning) ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' : 'transform hover:scale-105'} transition-all duration-150 ease-in-out`}>
                        {isLoading ? 'กำลังคำนวณ...' : 'คำนวณ LTHC Plan'}
                    </button>
                 </div>
                 {showIHUWarning && (<div className="mt-2 text-xs text-yellow-300 flex items-center justify-center md:justify-start gap-2"><FaExclamationTriangle />กรุณาเลือกแผน iHealthy Ultra เพื่อความคุ้มครองค่ารักษาพยาบาล</div>)}
            </div>
            {error && <div className="mt-4 p-3 text-red-800 bg-red-100 border-2 border-red-500 rounded-lg text-sm"><p className="font-bold">! เกิดข้อผิดพลาด:</p><p>{error}</p></div>}
            
            <LthcReduceSumInsuredModal isOpen={isReduceSaModalOpen} onClose={() => setIsReduceSaModalOpen(false)} strategy={saReductionStrategy} setStrategy={setSaReductionStrategy} entryAge={policyholderEntryAge} maxPolicyAge={MAX_POLICY_AGE_TYPE} />
        </div>
    );
}