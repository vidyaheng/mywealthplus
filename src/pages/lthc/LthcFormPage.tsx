// src/pages/lthc/LthcFormPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { LifeReadyPaymentTerm, IHealthyUltraPlan, MEBPlan } from '../../hooks/useLthcTypes';
import { MAX_POLICY_AGE_TYPE } from '../../hooks/useLthcTypes';
import { calculateLifeReadyPremium, calculateIHealthyUltraPremium, calculateMEBPremium } from '../../lib/healthPlanCalculations';
import { FaBirthdayCake, FaVenusMars } from 'react-icons/fa';
import LthcReduceSumInsuredModal from '@/components/LthcReduceSumInsuredModal';

const MIN_LR_SA_NORMAL_MODE = 150000;
const PACKAGE_LR_SA = 50000;
const DEFAULT_LR_PPT_PACKAGE = 99 as LifeReadyPaymentTerm;
const DEFAULT_LR_PPT_NORMAL = 18 as LifeReadyPaymentTerm;

const iHealthyUltraPlanColors: Record<string, string> = {
    Smart: 'text-green-700', Bronze: 'text-yellow-700', Silver: 'text-gray-500',
    Gold: 'text-yellow-500', Diamond: 'text-blue-400', Platinum: 'text-purple-700',
};

export default function LthcFormPage() {
    const {
        iWealthyMode, setIWealthyMode, manualRpp, setManualRpp, manualRtu, setManualRtu,
        manualInvestmentReturn, setManualInvestmentReturn, manualIWealthyPPT, setManualIWealthyPPT,
        manualWithdrawalStartAge, setManualWithdrawalStartAge, autoInvestmentReturn, setAutoInvestmentReturn,
        autoIWealthyPPT, setAutoIWealthyPPT, autoRppRtuRatio, setAutoRppRtuRatio,
        calculatedMinPremium, calculatedRpp, calculatedRtu, isLoading, error, runCalculation,
        result: _result, policyholderEntryAge, setPolicyholderEntryAge, policyholderGender, setPolicyholderGender,
        selectedHealthPlans, setSelectedHealthPlans, policyOriginMode, setPolicyOriginMode,
        existingPolicyEntryAge, setExistingPolicyEntryAge, saReductionStrategy, setSaReductionStrategy,
    } = useAppStore();

    const [isReduceSaModalOpen, setIsReduceSaModalOpen] = useState(false);
    const [lifeReadyMode, setLifeReadyMode] = useState<'normal' | 'package'>(() => (selectedHealthPlans.lifeReadySA === PACKAGE_LR_SA && selectedHealthPlans.lifeReadyPPT === DEFAULT_LR_PPT_PACKAGE) ? 'package' : 'normal');
    
    {/*const iWealthyReductionStatus = useMemo(() => {
        if (saReductionStrategy.type === 'auto') {
            return <span className="text-xs text-gray-500">(อัตโนมัติ)</span>;
        }
        if (saReductionStrategy.ages.length === 0) {
            return <span className="text-xs text-orange-600">(กำหนดเอง: ไม่มี)</span>;
        }
        return <span className="text-xs text-green-600 font-semibold">(กำหนดเอง: {saReductionStrategy.ages.length} จุด)</span>;
    }, [saReductionStrategy]);*/}

    useEffect(() => {
        if (policyOriginMode === 'newPolicy') {
            if (lifeReadyMode === 'package') {
                setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: PACKAGE_LR_SA, lifeReadyPPT: DEFAULT_LR_PPT_PACKAGE });
            } else {
                setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: Math.max(selectedHealthPlans.lifeReadySA, MIN_LR_SA_NORMAL_MODE), lifeReadyPPT: selectedHealthPlans.lifeReadyPPT === DEFAULT_LR_PPT_PACKAGE ? DEFAULT_LR_PPT_NORMAL : selectedHealthPlans.lifeReadyPPT });
            }
        } else if (policyOriginMode === 'existingPolicy') {
            setLifeReadyMode('normal');
        }
    }, [policyOriginMode, lifeReadyMode]);

    useEffect(() => {
        if (policyOriginMode === 'newPolicy') setExistingPolicyEntryAge(undefined);
    }, [policyOriginMode]);

    const displayLifeReadySA = (policyOriginMode === 'newPolicy' && lifeReadyMode === 'package') ? PACKAGE_LR_SA : selectedHealthPlans.lifeReadySA;
    const displayLifeReadyPPT = (policyOriginMode === 'newPolicy' && lifeReadyMode === 'package') ? DEFAULT_LR_PPT_PACKAGE : selectedHealthPlans.lifeReadyPPT;

    const handleLifeReadySAInput = (inputValue: string) => { let value = parseInt(inputValue, 10); if (isNaN(value)) value = 0; setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: Math.max(0, value) }); };
    const handleLifeReadyPPTChange = (value: LifeReadyPaymentTerm) => setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadyPPT: value });
    const handleLifeReadySAInputBlur = (e: React.FocusEvent<HTMLInputElement>) => { if (policyOriginMode === 'newPolicy' && lifeReadyMode === 'normal') { let currentSA = parseInt(e.target.value, 10); if (isNaN(currentSA) || (currentSA > 0 && currentSA < MIN_LR_SA_NORMAL_MODE)) setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: MIN_LR_SA_NORMAL_MODE }); else if (currentSA <= 0 && e.target.value !== "") setSelectedHealthPlans({ ...selectedHealthPlans, lifeReadySA: MIN_LR_SA_NORMAL_MODE }); } };
    const [isIHUSelected, setIsIHUSelected] = useState<boolean>(() => selectedHealthPlans.iHealthyUltraPlan !== null);
    const [isMEBSelected, setIsMEBSelected] = useState<boolean>(() => selectedHealthPlans.mebPlan !== null);
    useEffect(() => setIsIHUSelected(selectedHealthPlans.iHealthyUltraPlan !== null), [selectedHealthPlans.iHealthyUltraPlan]);
    useEffect(() => setIsMEBSelected(selectedHealthPlans.mebPlan !== null), [selectedHealthPlans.mebPlan]);
    const handleIHUCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setIsIHUSelected(isChecked); setSelectedHealthPlans({ ...selectedHealthPlans, iHealthyUltraPlan: isChecked ? (selectedHealthPlans.iHealthyUltraPlan ?? 'Bronze') : null }); };
    const handleIHUPlanChange = (value: IHealthyUltraPlan) => { if (isIHUSelected) setSelectedHealthPlans({ ...selectedHealthPlans, iHealthyUltraPlan: value }); };
    const handleMEBCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setIsMEBSelected(isChecked); setSelectedHealthPlans({ ...selectedHealthPlans, mebPlan: isChecked ? (selectedHealthPlans.mebPlan ?? 1000) : null }); };
    const handleMEBPlanChange = (value: MEBPlan) => { if (isMEBSelected) setSelectedHealthPlans({ ...selectedHealthPlans, mebPlan: value }); };
    const entryAgeForLrPremiumCalc = useMemo(() => (policyOriginMode === 'existingPolicy' && existingPolicyEntryAge !== undefined) ? existingPolicyEntryAge : policyholderEntryAge, [policyOriginMode, existingPolicyEntryAge, policyholderEntryAge]);
    const currentLrPremium = useMemo(() => calculateLifeReadyPremium(entryAgeForLrPremiumCalc, policyholderGender, displayLifeReadySA, displayLifeReadyPPT), [entryAgeForLrPremiumCalc, policyholderGender, displayLifeReadySA, displayLifeReadyPPT]);
    const currentIhuPremium = useMemo(() => (isIHUSelected && selectedHealthPlans.iHealthyUltraPlan !== null) ? calculateIHealthyUltraPremium(policyholderEntryAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan) : 0, [isIHUSelected, policyholderEntryAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan]);
    const currentMebPremium = useMemo(() => (isMEBSelected && selectedHealthPlans.mebPlan !== null) ? calculateMEBPremium(policyholderEntryAge, selectedHealthPlans.mebPlan) : 0, [isMEBSelected, policyholderEntryAge, selectedHealthPlans.mebPlan]);
    const totalFirstYearHealthPremium = currentLrPremium + currentIhuPremium + currentMebPremium;
    const ageOptions = useMemo(() => Array.from({ length: 80 }, (_, i) => i + 1), []);
    const existingAgeOptions = useMemo(() => { if (policyholderEntryAge <= 1) return []; return Array.from({ length: policyholderEntryAge - 1 }, (_, i) => policyholderEntryAge - 1 - i).filter(age => age >= 0); }, [policyholderEntryAge]);
    const showIHUWarning = !isIHUSelected;
    
    return (
        <div className="space-y-6 pb-12">
            <section className="p-4 border rounded-lg shadow-md bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">ข้อมูลผู้เอาประกัน</h3>
                        <div className="grid grid-cols-2 gap-x-4 items-end">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1"><FaBirthdayCake className="text-blue-700 text-sm flex-shrink-0"/><label htmlFor="currentEntryAge" className="text-sm font-medium text-gray-700">อายุ (ปัจจุบัน)</label></div>
                                <select id="currentEntryAge" value={policyholderEntryAge} onChange={(e) => setPolicyholderEntryAge(Math.max(1, Math.min(80, parseInt(e.target.value, 10) || 1)))} className="mt-1 p-2 w-full border rounded-md shadow-sm text-sm" style={{maxWidth: '100px'}}>{ageOptions.map(age => <option key={`current-${age}`} value={age}>{age}</option>)}</select>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1"><FaVenusMars className="text-blue-700 text-sm flex-shrink-0" /><label className="mb-1 text-sm font-medium text-gray-700">เพศ</label></div>
                                <div className="flex space-x-3 items-center mt-1.5">
                                    <label className="flex items-center cursor-pointer"><input type="radio" name="genderForm" value="male" checked={policyholderGender === 'male'} onChange={() => setPolicyholderGender('male')} className="form-radio accent-blue-600 h-4 w-4" /><span className={`ml-1.5 text-sm ${policyholderGender === 'male' ? 'font-bold text-blue-600' : 'text-gray-700'}`}>ชาย</span></label>
                                    <label className="flex items-center cursor-pointer"><input type="radio" name="genderForm" value="female" checked={policyholderGender === 'female'} onChange={() => setPolicyholderGender('female')} className="form-radio accent-pink-600 h-4 w-4" /><span className={`ml-1.5 text-sm ${policyholderGender === 'female' ? 'font-bold text-pink-600' : 'text-gray-700'}`}>หญิง</span></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3 flex flex-col items-end">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2 mr-8">แผนสุขภาพที่มีอยู่</h3>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 w-full sm:w-auto justify-end">
                            <button onClick={() => setPolicyOriginMode('newPolicy')} className={`w-full sm:w-auto flex-1 whitespace-nowrap border border-gray-500 px-4 py-2 rounded-l-md font-medium text-sm transition-colors ${policyOriginMode === 'newPolicy' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-sky-50'}`}>เริ่มแผนใหม่</button>
                            <button onClick={() => setPolicyOriginMode('existingPolicy')} className={`w-full sm:w-auto flex-1 whitespace-nowrap border border-gray-500 px-4 py-2 rounded-r-md font-medium text-sm transition-colors ${policyOriginMode === 'existingPolicy' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-orange-50'}`}>มีแผนเดิม</button>
                        </div>
                    </div>
                </div>
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className={`p-4 border rounded-lg shadow-md space-y-4 ${policyOriginMode === 'existingPolicy' ? 'bg-orange-50' : (lifeReadyMode === 'package' ? 'bg-green-50' : 'bg-blue-50')}`}>
                    <h2 className={`text-lg font-semibold ${policyOriginMode === 'existingPolicy' ? 'text-orange-700' : (lifeReadyMode === 'package' ? 'text-green-700' : 'text-blue-700')}`}>1. แผน LifeReady {policyOriginMode === 'existingPolicy' && <span className="text-sm font-normal">(ข้อมูลแผนเดิม)</span>}</h2>
                    {policyOriginMode === 'existingPolicy' && (<div className="animate-fadeIn mb-4 w-full sm:w-auto"><label htmlFor="existingPolicyEntryAge" className="block text-sm font-medium text-gray-700">อายุที่เริ่มทำ LifeReady เดิม:</label><select id="existingPolicyEntryAge" value={existingPolicyEntryAge || ''} onChange={(e) => setExistingPolicyEntryAge(e.target.value ? parseInt(e.target.value, 10) : undefined)} className="mt-1 p-2 w-full border rounded-md shadow-sm text-sm border-orange-300 focus:ring-orange-500 focus:border-orange-500"><option value="">-- เลือกอายุ --</option>{existingAgeOptions.map(age => (<option key={`existing-${age}`} value={age}>{age}</option>))}</select>{existingPolicyEntryAge !== undefined && policyholderEntryAge > existingPolicyEntryAge && (<p className="text-xs text-gray-600 mt-1">(จ่ายเบี้ย LifeReady เดิมมาแล้ว: {policyholderEntryAge - existingPolicyEntryAge} ปี)</p>)}<hr className="my-4 border-orange-200"/></div>)}
                    <div className="flex space-x-2 mb-4">
                       <button onClick={() => setLifeReadyMode('normal')} className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all ${lifeReadyMode === 'normal' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-blue-100'}`}>LifeReady</button>
                        <button onClick={() => setLifeReadyMode('package')} className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all ${lifeReadyMode === 'package' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-green-100'}`}>Package</button>
                    </div>
                    <div className="space-y-3">
                        <div><label htmlFor="lrSA-form" className="block text-sm font-medium text-gray-700">ทุนประกันภัย:</label><input id="lrSA-form" type="number" value={displayLifeReadySA} onChange={(e) => handleLifeReadySAInput(e.target.value)} disabled={lifeReadyMode === 'package'} onBlur={handleLifeReadySAInputBlur} className="mt-1 p-2 w-full border rounded-md shadow-sm disabled:bg-gray-200" step="50000" /></div>
                        <div><label htmlFor="lrPPT-form" className="block text-sm font-medium text-gray-700">ระยะเวลาชำระเบี้ย:</label><select id="lrPPT-form" value={displayLifeReadyPPT} onChange={(e) => handleLifeReadyPPTChange(Number(e.target.value) as LifeReadyPaymentTerm)} disabled={lifeReadyMode === 'package'} className="mt-1 p-2 w-full border rounded-md shadow-sm disabled:bg-gray-200"><option value={6}>6 ปี</option><option value={12}>12 ปี</option><option value={18}>18 ปี</option><option value={99}>ถึงอายุ 99 ปี</option></select></div>
                        {lifeReadyMode === 'package' && (<p className="text-xs text-gray-600 pt-1">Package: ทุน 50,000 บ., ชำระถึงอายุ 99 ปี</p>)}
                        <div className="pt-2"><p className="text-xs text-gray-600">เบี้ยประกัน LifeReady ปีแรก:</p><p className={`text-md font-semibold ${policyOriginMode === 'existingPolicy' ? 'text-orange-700' : (lifeReadyMode === 'package' ? 'text-green-700' : 'text-blue-700')}`}>{currentLrPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p></div>
                    </div>
                </section>
                <section className="p-4 border rounded-lg shadow-md space-y-4 bg-white">
                    <h2 className="text-lg font-semibold text-slate-700">2. เลือกสัญญาเพิ่มเติมสุขภาพ</h2>
                    <div className="p-3 border rounded-md bg-indigo-50">
                        <label className="flex items-center space-x-2 cursor-pointer mb-2"><input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 rounded accent-indigo-600" checked={isIHUSelected} onChange={handleIHUCheckboxChange} /><span className="font-medium text-sm text-indigo-700">iHealthy Ultra (ค่ารักษาพยาบาล)</span></label>
                        {isIHUSelected && (<div className="pl-6 space-y-1 animate-fadeIn"><label htmlFor="ihuPlan-form" className="text-xs text-gray-600 block">เลือกแผน:</label><select id="ihuPlan-form" value={selectedHealthPlans.iHealthyUltraPlan ?? 'Smart'} onChange={(e) => handleIHUPlanChange(e.target.value as IHealthyUltraPlan)} className={`p-1.5 border rounded-md text-xs w-full ${selectedHealthPlans.iHealthyUltraPlan && iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan] ? iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan] : 'text-gray-700'}`}>{(['Smart', 'Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum'] as IHealthyUltraPlan[]).map(planName => (<option key={planName} value={planName} className={iHealthyUltraPlanColors[planName] ?? ''}>{planName}</option>))}</select><div className="pt-1"><p className="text-xs text-gray-500">เบี้ยประกัน iHealthy Ultra ปีแรก:</p><p className={`text-sm font-semibold ${selectedHealthPlans.iHealthyUltraPlan && iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan] ? iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan] : 'text-indigo-700'}`}>{currentIhuPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p></div></div>)}
                    </div>
                    <div className="p-3 border rounded-md bg-lime-50">
                        <label className="flex items-center space-x-2 cursor-pointer mb-2"><input type="checkbox" className="form-checkbox h-4 w-4 text-lime-600 rounded accent-lime-600" checked={isMEBSelected} onChange={handleMEBCheckboxChange} /><span className="font-medium text-sm text-lime-700">MEB (ค่าชดเชยรายวัน)</span></label>
                        {isMEBSelected && (<div className="pl-6 space-y-1 animate-fadeIn"><label htmlFor="mebPlanValue-form" className="text-xs text-gray-600 block">เลือกแผน:</label><select id="mebPlanValue-form" value={selectedHealthPlans.mebPlan ?? 500} onChange={(e) => handleMEBPlanChange(Number(e.target.value) as MEBPlan)} className="p-1.5 border rounded-md text-xs w-full">{( [500, 1000, 2000, 3000, 4000, 5000] as MEBPlan[]).map(planValue => (<option key={planValue} value={planValue}>{planValue.toLocaleString()}</option>))}</select><div className="pt-1"><p className="text-xs text-gray-500">เบี้ยประกัน MEB ปีแรก:</p><p className="text-sm font-semibold text-lime-700">{currentMebPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p></div></div>)}
                    </div>
                </section>
                <section className={`p-4 border rounded-lg shadow-md space-y-4 ${iWealthyMode === 'manual' ? 'bg-emerald-50' : 'bg-sky-50'}`}>
                    <h2 className={`text-lg font-semibold ${iWealthyMode === 'manual' ? 'text-emerald-700' : 'text-sky-700'}`}>3. ตั้งค่า iWealthy</h2>
                    <div className="flex space-x-2 mb-4">
                        <button onClick={() => setIWealthyMode('automatic')} className={`flex-1 px-3 py-2 rounded-md font-medium text-xs ${iWealthyMode === 'automatic' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-sky-50'}`}>Auto</button>
                        <button onClick={() => setIWealthyMode('manual')} className={`flex-1 px-3 py-2 rounded-md font-medium text-xs ${iWealthyMode === 'manual' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-emerald-50'}`}>Manual</button>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">รูปแบบการลดทุน</h3>
                        <div className="flex rounded-md shadow-sm">
                            <button type="button" onClick={() => setSaReductionStrategy({ type: 'auto' })} className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border border-gray-300 ${saReductionStrategy.type === 'auto' ? 'bg-blue-600 text-white z-10' : 'bg-white hover:bg-gray-50'}`}>อัตโนมัติ</button>
                            <button type="button" onClick={() => { if (saReductionStrategy.type === 'auto') { setSaReductionStrategy({ type: 'manual', ages: [] }); } setIsReduceSaModalOpen(true); }} className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border border-l-0 border-gray-300 ${saReductionStrategy.type === 'manual' ? 'bg-emerald-600 text-white z-10' : 'bg-white hover:bg-gray-50'}`}>กำหนดเอง...</button>
                        </div>
                        {saReductionStrategy.type === 'manual' && (<p className="text-xs text-right pr-1 text-gray-600">กำหนดไว้ {saReductionStrategy.ages.length} จุด (คลิก 'กำหนดเอง' เพื่อแก้ไข)</p>)}
                    </div>
                    <hr className="my-3"/>
                    {iWealthyMode === 'manual' && (
                        <div className="space-y-3 animate-fadeIn">
                            <div><label htmlFor="manualRpp" className="block text-xs font-medium text-gray-700">RPP (ต่อปี):</label><input id="manualRpp" type="number" step="1000" value={manualRpp} onChange={e => setManualRpp(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                            <div><label htmlFor="manualRtu" className="block text-xs font-medium text-gray-700">RTU (ต่อปี):</label><input id="manualRtu" type="number" step="1000" value={manualRtu} onChange={e => setManualRtu(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                            <div><label htmlFor="manualInvReturn" className="block text-xs font-medium text-gray-700">ผลตอบแทน (%):</label><input id="manualInvReturn" type="number" step="0.5" value={manualInvestmentReturn} onChange={e => setManualInvestmentReturn(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                            <div><label htmlFor="manualIWppt" className="block text-xs font-medium text-gray-700">ระยะเวลาจ่ายเบี้ย iWealthy (ปี):</label><input id="manualIWppt" type="number" value={manualIWealthyPPT} onChange={e => setManualIWealthyPPT(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                            <div><label htmlFor="manualWithdrawStart" className="block text-xs font-medium text-gray-700">อายุเริ่มถอน:</label><input id="manualWithdrawStart" type="number" value={manualWithdrawalStartAge} onChange={e => setManualWithdrawalStartAge(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                        </div>
                    )}
                    {iWealthyMode === 'automatic' && (
                        <div className="space-y-3 animate-fadeIn">
                            <p className="text-xs text-gray-600">ระบบจะคำนวณเบี้ย iWealthy ที่ต่ำที่สุด ตาม Ratio RPP/RTU ที่คุณเลือก</p>
                            <div><label htmlFor="autoInvReturn" className="block text-xs font-medium text-gray-700">ผลตอบแทน (%):</label><input id="autoInvReturn" type="number" step="0.5" value={autoInvestmentReturn} onChange={e => setAutoInvestmentReturn(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                            <div><label htmlFor="autoIWppt" className="block text-xs font-medium text-gray-700">ระยะเวลาชำระเบี้ย iWealthy (ปี):</label><input id="autoIWppt" type="number" value={autoIWealthyPPT} onChange={e => setAutoIWealthyPPT(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                            <div><label htmlFor="autoRppRtu" className="block text-xs font-medium text-gray-700">สัดส่วน RPP/RTU ที่ต้องการ:</label><select id="autoRppRtu" value={autoRppRtuRatio} onChange={e => setAutoRppRtuRatio(e.target.value)} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm"><option value="100/0">RPP 100%</option><option value="80/20">RPP 80%/RTU 20%</option><option value="70/30">RPP 70%/RTU 30%</option><option value="60/40">RPP 60%/RTU 40%</option><option value="50/50">RPP 50%/RTU 50%</option></select></div>
                        </div>
                    )}
                </section>
            </div>
            <section className="mt-6 p-6 border rounded-lg shadow-xl bg-gradient-to-r from-sky-500 to-indigo-600">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-white text-left"><h3 className="text-md font-semibold">เบี้ยประกันสุขภาพรวมปีแรก:</h3><p className="text-3xl font-bold mt-1">{totalFirstYearHealthPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-medium">บาท/ปี</span></p></div>
                    {calculatedMinPremium !== undefined && (<div className="mt-3 p-2 text-white text-left"><h3 className="text-md font-semibold">เบี้ย iWealthy ที่แนะนำ:</h3><p className="text-3xl font-bold mt-1">{calculatedMinPremium.toLocaleString()} <span className="text-lg font-medium">บาท/ปี</span></p><p>(RPP: {calculatedRpp?.toLocaleString()}, RTU: {calculatedRtu?.toLocaleString()})</p></div>)}
                    <button onClick={runCalculation} disabled={isLoading || showIHUWarning} className={`w-full md:w-auto px-10 py-3 bg-green-500 text-white font-bold text-md rounded-lg shadow-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 ${(isLoading || showIHUWarning) ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' : 'transform hover:scale-105'} transition-all duration-150 ease-in-out`}>{isLoading ? 'กำลังคำนวณ...' : 'คำนวณ LTHC Plan'}</button>
                </div>
                {showIHUWarning && (<div className="mt-3 text-sm text-yellow-300 flex items-center justify-center md:justify-start"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.332-.166 3.001-1.742 3.001H4.42c-1.576 0-2.492-1.67-1.742-3.001l5.58-9.92zM10 14a1 1 0 100-2 1 1 0 000 2zm0-7a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>กรุณาเลือกแผน iHealthy Ultra เพื่อความคุ้มครองค่ารักษาพยาบาล</div>)}
            </section>
            {error && (<div className="mt-4 p-4 text-red-800 bg-red-100 border-2 border-red-500 rounded-lg shadow-md"><p className="font-bold text-lg">! เกิดข้อผิดพลาด:</p><p className="text-sm">{error}</p></div>)}
            
            <LthcReduceSumInsuredModal
                isOpen={isReduceSaModalOpen}
                onClose={() => setIsReduceSaModalOpen(false)}
                strategy={saReductionStrategy}
                setStrategy={setSaReductionStrategy}
                entryAge={policyholderEntryAge}
                maxPolicyAge={MAX_POLICY_AGE_TYPE}
            />
        </div>
    );
};