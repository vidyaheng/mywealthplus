// src/pages/lthc/LthcFormPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type {
    UseLthcPlannerReturn,
    //Gender,
    LifeReadyPaymentTerm,
    IHealthyUltraPlan,
    MEBPlan,
    //PolicyOriginMode,
    //AnnualHealthPremiumDetail,
    //HealthPlanSelections,
    //IHealthyUltraPlanSelection,
    //MEBPlanSelection,
} from '../../hooks/useLthcTypes'; // ตรวจสอบ Path

// Import functions คำนวณเบี้ยสุขภาพโดยตรง
import {
    calculateLifeReadyPremium,
    calculateIHealthyUltraPremium,
    calculateMEBPremium,
} from '../../lib/healthPlanCalculations'; // ตรวจสอบ Path

import { FaBirthdayCake, FaVenusMars } from 'react-icons/fa'; // Import Icons


// Constants
const MIN_LR_SA_NORMAL_MODE = 150000;
const PACKAGE_LR_SA = 50000;
const DEFAULT_LR_PPT_PACKAGE = 99 as LifeReadyPaymentTerm;
const DEFAULT_LR_PPT_NORMAL = 18 as LifeReadyPaymentTerm;

// สมมติว่ามี object นี้สำหรับสี (ถ้ายังใช้)
const iHealthyUltraPlanColors: Record<string, string> = {
    Smart: 'text-green-700',
    Bronze: 'text-yellow-700',
    Silver: 'text-gray-500',
    Gold: 'text-yellow-500',
    Diamond: 'text-blue-400',
    Platinum: 'text-purple-700',
};


export default function LthcFormPage() {
    const context = useOutletContext<UseLthcPlannerReturn>();

    if (!context) {
        return <div className="p-4 text-center text-gray-600">กำลังโหลดข้อมูล Planner...</div>;
    }

    const {
        iWealthyMode, setIWealthyMode,
        manualRpp, setManualRpp,
        manualRtu, setManualRtu,
        manualInvestmentReturn, setManualInvestmentReturn,
        manualIWealthyPPT, setManualIWealthyPPT,
        manualWithdrawalStartAge, setManualWithdrawalStartAge,
        autoInvestmentReturn, setAutoInvestmentReturn,
        autoIWealthyPPT, setAutoIWealthyPPT,
        autoRppRtuRatio, setAutoRppRtuRatio,
        calculatedMinPremium,
        calculatedRpp,
        calculatedRtu,
        isLoading,
        error,
        runCalculation,
        policyholderEntryAge, setPolicyholderEntryAge,
        policyholderGender, setPolicyholderGender,
        selectedHealthPlans, setSelectedHealthPlans,
        // healthPremiums, // healthPremiums จาก context อาจจะไม่จำเป็นต้องใช้โดยตรงที่นี่แล้ว ถ้าเราคำนวณเบี้ยโชว์เอง
        policyOriginMode, setPolicyOriginMode,
        existingPolicyEntryAge, setExistingPolicyEntryAge,
    } = context;

    const [lifeReadyMode, setLifeReadyMode] = useState<'normal' | 'package'>(() => {
        if (selectedHealthPlans.lifeReadySA === PACKAGE_LR_SA && selectedHealthPlans.lifeReadyPPT === DEFAULT_LR_PPT_PACKAGE) {
            return 'package';
        }
        return 'normal';
    });

    useEffect(() => {
        if (policyOriginMode === 'newPolicy') {
            if (lifeReadyMode === 'package') {
                setSelectedHealthPlans(prev => ({
                    ...prev,
                    lifeReadySA: PACKAGE_LR_SA,
                    lifeReadyPPT: DEFAULT_LR_PPT_PACKAGE,
                }));
            } else { // normal mode for new policy
                setSelectedHealthPlans(prev => ({
                    ...prev,
                    lifeReadySA: Math.max(prev.lifeReadySA, MIN_LR_SA_NORMAL_MODE),
                    lifeReadyPPT: prev.lifeReadyPPT === DEFAULT_LR_PPT_PACKAGE ? DEFAULT_LR_PPT_NORMAL : prev.lifeReadyPPT,
                }));
            }
        } else if (policyOriginMode === 'existingPolicy') {
            setLifeReadyMode('normal'); // For existing policies, always treat LR details as 'normal' input mode
        }
    }, [policyOriginMode, lifeReadyMode, setSelectedHealthPlans]);

    useEffect(() => {
        if (policyOriginMode === 'newPolicy') {
            setExistingPolicyEntryAge(undefined);
        }
    }, [policyOriginMode, setExistingPolicyEntryAge]);

    const displayLifeReadySA = (policyOriginMode === 'newPolicy' && lifeReadyMode === 'package')
        ? PACKAGE_LR_SA
        : selectedHealthPlans.lifeReadySA;
    const displayLifeReadyPPT = (policyOriginMode === 'newPolicy' && lifeReadyMode === 'package')
        ? DEFAULT_LR_PPT_PACKAGE
        : selectedHealthPlans.lifeReadyPPT;

    const handleLifeReadySAInput = (inputValue: string) => {
        let value = parseInt(inputValue, 10);
        if (isNaN(value)) value = 0;
        setSelectedHealthPlans(prev => ({ ...prev, lifeReadySA: Math.max(0, value) }));
    };
    const handleLifeReadyPPTChange = (value: LifeReadyPaymentTerm) => {
        setSelectedHealthPlans(prev => ({ ...prev, lifeReadyPPT: value }));
    };
    const handleLifeReadySAInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (policyOriginMode === 'newPolicy' && lifeReadyMode === 'normal') {
            let currentSA = parseInt(e.target.value, 10);
            if (isNaN(currentSA) || (currentSA > 0 && currentSA < MIN_LR_SA_NORMAL_MODE)) {
                setSelectedHealthPlans(prev => ({ ...prev, lifeReadySA: MIN_LR_SA_NORMAL_MODE }));
            } else if (currentSA <= 0 && e.target.value !== "") {
                setSelectedHealthPlans(prev => ({ ...prev, lifeReadySA: MIN_LR_SA_NORMAL_MODE }));
            }
        }
    };

    const [isIHUSelected, setIsIHUSelected] = useState<boolean>(() => selectedHealthPlans.iHealthyUltraPlan !== null);
    const [isMEBSelected, setIsMEBSelected] = useState<boolean>(() => selectedHealthPlans.mebPlan !== null);

    useEffect(() => setIsIHUSelected(selectedHealthPlans.iHealthyUltraPlan !== null), [selectedHealthPlans.iHealthyUltraPlan]);
    useEffect(() => setIsMEBSelected(selectedHealthPlans.mebPlan !== null), [selectedHealthPlans.mebPlan]);

    const handleIHUCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setIsIHUSelected(isChecked);
        setSelectedHealthPlans(prev => ({ ...prev, iHealthyUltraPlan: isChecked ? (prev.iHealthyUltraPlan !== null ? prev.iHealthyUltraPlan : 'Bronze') : null }));
    };
    const handleIHUPlanChange = (value: IHealthyUltraPlan) => { if (isIHUSelected) setSelectedHealthPlans(prev => ({ ...prev, iHealthyUltraPlan: value })); };
    const handleMEBCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setIsMEBSelected(isChecked);
        setSelectedHealthPlans(prev => ({ ...prev, mebPlan: isChecked ? (prev.mebPlan !== null ? prev.mebPlan : 1000) : null }));
    };
    const handleMEBPlanChange = (value: MEBPlan) => { if (isMEBSelected) setSelectedHealthPlans(prev => ({ ...prev, mebPlan: value })); };

    const entryAgeForLrPremiumCalc = useMemo(() => (policyOriginMode === 'existingPolicy' && existingPolicyEntryAge !== undefined) ? existingPolicyEntryAge : policyholderEntryAge, [policyOriginMode, existingPolicyEntryAge, policyholderEntryAge]);
    const currentLrPremium = useMemo(() => calculateLifeReadyPremium(entryAgeForLrPremiumCalc, policyholderGender, displayLifeReadySA, displayLifeReadyPPT), [entryAgeForLrPremiumCalc, policyholderGender, displayLifeReadySA, displayLifeReadyPPT]);
    const currentIhuPremium = useMemo(() => (isIHUSelected && selectedHealthPlans.iHealthyUltraPlan !== null) ? calculateIHealthyUltraPremium(policyholderEntryAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan) : 0, [isIHUSelected, policyholderEntryAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan]);
    const currentMebPremium = useMemo(() => (isMEBSelected && selectedHealthPlans.mebPlan !== null) ? calculateMEBPremium(policyholderEntryAge, selectedHealthPlans.mebPlan) : 0, [isMEBSelected, policyholderEntryAge, policyholderGender, selectedHealthPlans.mebPlan]);
    const totalFirstYearHealthPremium = currentLrPremium + currentIhuPremium + currentMebPremium;

    const ageOptions = useMemo(() => Array.from({ length: 80 }, (_, i) => i + 1), []);
    const existingAgeOptions = useMemo(() => {
        if (policyholderEntryAge <= 1) return [];
        return Array.from({ length: policyholderEntryAge - 1 }, (_, i) => policyholderEntryAge - 1 - i).filter(age => age >= 0);
    }, [policyholderEntryAge]);

    const showIHUWarning = !isIHUSelected; //เงื่อนไขสำหรับแสดงคำเตือน IHU
    

    return (
        <div className="space-y-6 pb-12">
            {/* SECTION 0: ข้อมูลผู้เอาประกัน และ ประเภทการวางแผน */}
            <section className="p-4 border rounded-lg shadow-md bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                    {/* ส่วนซ้าย: ข้อมูลผู้เอาประกัน (ปัจจุบัน) */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">ข้อมูลผู้เอาประกัน</h3>
                        <div className="grid grid-cols-2 gap-x-4 items-end">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <FaBirthdayCake className="text-blue-700 text-sm flex-shrink-0"/>
                                    <label htmlFor="currentEntryAge" className="text-sm font-medium text-gray-700">อายุ (ปัจจุบัน)</label>
                                </div>
                                
                                <select
                                    id="currentEntryAge"
                                    value={policyholderEntryAge}
                                    onChange={(e) => setPolicyholderEntryAge(Math.max(1, Math.min(80, parseInt(e.target.value, 10) || 1)))}
                                    className="mt-1 p-2 w-full border rounded-md shadow-sm text-sm"
                                    style={{maxWidth: '100px'}}
                                >
                                    {ageOptions.map(age => <option key={`current-${age}`} value={age}>{age}</option>)}
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <FaVenusMars className="text-blue-700 text-sm flex-shrink-0" />
                                    <label className="mb-1 text-sm font-medium text-gray-700">เพศ</label>
                                </div>
                                <div className="flex space-x-3 items-center mt-1.5">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="genderForm" value="male" checked={policyholderGender === 'male'} onChange={() => setPolicyholderGender('male')} className="form-radio accent-blue-600 h-4 w-4" />
                                        <span className={`ml-1.5 mb-3 text-sm ${policyholderGender === 'male' ? 'font-bold text-blue-600' : 'text-gray-700'}`}>ชาย</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="genderForm" value="female" checked={policyholderGender === 'female'} onChange={() => setPolicyholderGender('female')} className="form-radio accent-pink-600 h-4 w-4" />
                                        <span className={`ml-1.5 mb-3 text-sm ${policyholderGender === 'female' ? 'font-bold text-pink-600' : 'text-gray-700'}`}>หญิง</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ส่วนขวา: ประเภทการวางแผน */}
                    <div className="space-y-3 flex flex-col items-end">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2 mr-8">แผนสุขภาพที่มีอยู่</h3>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 w-full sm:w-auto justify-end">
                            <button
                                onClick={() => setPolicyOriginMode('newPolicy')}
                                className={`w-full sm:w-auto flex-1 whitespace-nowrap border border-gray-500 px-4 py-2 rounded-l-md font-medium text-sm transition-colors ${policyOriginMode === 'newPolicy' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-sky-50'}`}
                            >
                                เริ่มแผนใหม่
                            </button>
                            <button
                                onClick={() => setPolicyOriginMode('existingPolicy')}
                                className={`w-full sm:w-auto flex-1 whitespace-nowrap border border-gray-500 px-4 py-2 rounded-r-md font-medium text-sm transition-colors ${policyOriginMode === 'existingPolicy' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-orange-50'}`}
                            >
                                มีแผนเดิม
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Layout 3 Columns สำหรับกรอกข้อมูลแผน */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* === COLUMN 1: LifeReady Details === */}
                <section className={`p-4 border rounded-lg shadow-md space-y-4 ${policyOriginMode === 'existingPolicy' ? 'bg-orange-50' : (lifeReadyMode === 'package' ? 'bg-green-50' : 'bg-blue-50')}`}>
                    <h2 className={`text-lg font-semibold ${policyOriginMode === 'existingPolicy' ? 'text-orange-700' : (lifeReadyMode === 'package' ? 'text-green-700' : 'text-blue-700')}`}>
                        1. แผน LifeReady {policyOriginMode === 'existingPolicy' && <span className="text-sm font-normal">(ข้อมูลแผนเดิม)</span>}
                    </h2>

                    {policyOriginMode === 'existingPolicy' && (
                        <div className="animate-fadeIn mb-4 w-full sm:w-auto">
                            <label htmlFor="existingPolicyEntryAge" className="block text-sm font-medium text-gray-700">
                                อายุที่เริ่มทำ LifeReady เดิม:
                            </label>
                            <select
                                id="existingPolicyEntryAge"
                                value={existingPolicyEntryAge || ''}
                                onChange={(e) => setExistingPolicyEntryAge(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                className="mt-1 p-2 w-full border rounded-md shadow-sm text-sm border-orange-300 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">-- เลือกอายุ --</option>
                                {existingAgeOptions.map(age => (
                                    <option key={`existing-${age}`} value={age}>{age}</option>
                                ))}
                            </select>
                            {existingPolicyEntryAge !== undefined && policyholderEntryAge > existingPolicyEntryAge && (
                                <p className="text-xs text-gray-600 mt-1">
                                    (จ่ายเบี้ย LifeReady เดิมมาแล้ว: {policyholderEntryAge - existingPolicyEntryAge} ปี)
                                </p>
                            )}
                            <hr className="my-4 border-orange-200"/>
                        </div>
                    )}

                    {/* ปุ่มเลือกโหมด LifeReady (ปกติ/Package) - แสดงสำหรับแผนใหม่ และ แผนเดิมด้วย */}
                    <div className="flex space-x-2 mb-4">
                       <button
                            onClick={() => setLifeReadyMode('normal')}
                            className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all ${lifeReadyMode === 'normal' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-blue-100'}`}
                        >
                            LifeReady
                        </button>
                        <button
                            onClick={() => setLifeReadyMode('package')}
                            className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all ${lifeReadyMode === 'package' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-green-100'}`}
                        >
                            Package
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label htmlFor="lrSA-form" className="block text-sm font-medium text-gray-700">ทุนประกันภัย:</label>
                            <input
                                id="lrSA-form" type="number"
                                value={displayLifeReadySA}
                                onChange={(e) => handleLifeReadySAInput(e.target.value)}
                                disabled={lifeReadyMode === 'package'} // Disable เมื่อ LifeReady เป็น Package (ไม่ว่าแผนใหม่หรือเดิม)
                                onBlur={handleLifeReadySAInputBlur}
                                className="mt-1 p-2 w-full border rounded-md shadow-sm disabled:bg-gray-200"
                                step="50000" />
                        </div>
                        <div>
                            <label htmlFor="lrPPT-form" className="block text-sm font-medium text-gray-700">ระยะเวลาชำระเบี้ย:</label>
                            <select
                                id="lrPPT-form"
                                value={displayLifeReadyPPT}
                                onChange={(e) => handleLifeReadyPPTChange(Number(e.target.value) as LifeReadyPaymentTerm)}
                                disabled={lifeReadyMode === 'package'} // Disable เมื่อ LifeReady เป็น Package
                                className="mt-1 p-2 w-full border rounded-md shadow-sm disabled:bg-gray-200"
                            >
                                <option value={6}>6 ปี</option> <option value={12}>12 ปี</option>
                                <option value={18}>18 ปี</option> <option value={99}>ถึงอายุ 99 ปี</option>
                            </select>
                        </div>
                        {lifeReadyMode === 'package' && ( // แสดงข้อความนี้เมื่อเป็น Package เสมอ
                            <p className="text-xs text-gray-600 pt-1">Package: ทุน 50,000 บ., ชำระถึงอายุ 99 ปี</p>
                        )}
                         <div className="pt-2">
                            <p className="text-xs text-gray-600">เบี้ยประกัน LifeReady ปีแรก:</p>
                            <p className={`text-md font-semibold ${policyOriginMode === 'existingPolicy' ? 'text-orange-700' : (lifeReadyMode === 'package' ? 'text-green-700' : 'text-blue-700')}`}>
                                {currentLrPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                            </p>
                        </div>
                    </div>
                </section>

                {/* === COLUMN 2: สัญญาเพิ่มเติมสุขภาพ === */}
                <section className="p-4 border rounded-lg shadow-md space-y-4 bg-white">
                    <h2 className="text-lg font-semibold text-slate-700">
                        2. เลือกสัญญาเพิ่มเติมสุขภาพ
                    </h2>
                    {/* iHealthy Ultra */}
                    <div className="p-3 border rounded-md bg-indigo-50">
                        <label className="flex items-center space-x-2 cursor-pointer mb-2">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 rounded accent-indigo-600"
                                   checked={isIHUSelected} onChange={handleIHUCheckboxChange} />
                            <span className="font-medium text-sm text-indigo-700">iHealthy Ultra (ค่ารักษาพยาบาล)</span>
                        </label>
                        {isIHUSelected && (
                            <div className="pl-6 space-y-1 animate-fadeIn">
                                <label htmlFor="ihuPlan-form" className="text-xs text-gray-600 block">เลือกแผน:</label>
                                <select
                                    id="ihuPlan-form"
                                    value={selectedHealthPlans.iHealthyUltraPlan === null ? 'Smart' : selectedHealthPlans.iHealthyUltraPlan}
                                    onChange={(e) => handleIHUPlanChange(e.target.value as IHealthyUltraPlan)}
                                    className={`p-1.5 border rounded-md text-xs w-full ${selectedHealthPlans.iHealthyUltraPlan && iHealthyUltraPlanColors && iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan as string] ? iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan as string] : 'text-gray-700'}`}
                                >
                                    {(['Smart', 'Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum'] as IHealthyUltraPlan[]).map(planName => (
                                        <option key={planName} value={planName} className={iHealthyUltraPlanColors && iHealthyUltraPlanColors[planName] ? iHealthyUltraPlanColors[planName] : ''} >
                                            {planName}
                                        </option>
                                    ))}
                                </select>
                                <div className="pt-1">
                                    <p className="text-xs text-gray-500">เบี้ยประกัน iHealthy Ultra ปีแรก:</p>
                                    <p className={`text-sm font-semibold ${selectedHealthPlans.iHealthyUltraPlan && iHealthyUltraPlanColors && iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan as string] ? iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan as string] : 'text-indigo-700'}`}>
                                        {currentIhuPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* MEB */}
                    <div className="p-3 border rounded-md bg-lime-50">
                         <label className="flex items-center space-x-2 cursor-pointer mb-2">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-lime-600 rounded accent-lime-600"
                                checked={isMEBSelected} onChange={handleMEBCheckboxChange} />
                            <span className="font-medium text-sm text-lime-700">MEB (ค่าชดเชยรายวัน)</span>
                        </label>
                         {isMEBSelected && (
                            <div className="pl-6 space-y-1 animate-fadeIn">
                                <label htmlFor="mebPlanValue-form" className="text-xs text-gray-600 block">เลือกแผน:</label>
                                <select
                                    id="mebPlanValue-form"
                                    value={selectedHealthPlans.mebPlan === null || selectedHealthPlans.mebPlan === null ? 500 : selectedHealthPlans.mebPlan}
                                    onChange={(e) => handleMEBPlanChange(Number(e.target.value) as MEBPlan)}
                                    className="p-1.5 border rounded-md text-xs w-full"
                                >
                                    {( [500, 1000, 2000, 3000, 4000, 5000] as MEBPlan[]).map(planValue => (
                                        <option key={planValue} value={planValue}>
                                            {planValue.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                                <div className="pt-1">
                                    <p className="text-xs text-gray-500">เบี้ยประกัน MEB ปีแรก:</p>
                                    <p className="text-sm font-semibold text-lime-700">
                                        {currentMebPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* === COLUMN 3: ตั้งค่า iWealthy === */}
                <section className={`p-4 border rounded-lg shadow-md space-y-4 ${iWealthyMode === 'manual' ? 'bg-emerald-50' : 'bg-sky-50'}`}>
                    <h2 className={`text-lg font-semibold ${iWealthyMode === 'manual' ? 'text-emerald-700' : 'text-sky-700'}`}>
                        3. ตั้งค่า iWealthy
                    </h2>
                    <div className="flex space-x-2 mb-4">
                        <button onClick={() => setIWealthyMode('automatic')} className={`flex-1 px-3 py-2 rounded-md font-medium text-xs ${iWealthyMode === 'automatic' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-sky-50'}`}>
                            Auto
                        </button>
                        <button onClick={() => setIWealthyMode('manual')} className={`flex-1 px-3 py-2 rounded-md font-medium text-xs ${iWealthyMode === 'manual' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-emerald-50'}`}>
                            Manual
                        </button>
                    </div>
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
                            <div>
                                <label htmlFor="autoRppRtu" className="block text-xs font-medium text-gray-700">สัดส่วน RPP/RTU ที่ต้องการ:</label>
                                <select id="autoRppRtu" value={autoRppRtuRatio} onChange={e => setAutoRppRtuRatio(e.target.value)} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm">
                                    <option value="100/0">RPP 100%</option> <option value="80/20">RPP 80%/RTU 20%</option>
                                    <option value="70/30">RPP 70%/RTU 30%</option> <option value="60/40">RPP 60%/RTU 40%</option>
                                    <option value="50/50">RPP 50%/RTU 50%</option>
                                </select>
                            </div>
                            {/*{calculatedMinPremium !== undefined && (
                                <div className="mt-3 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-xs">
                                    <p>เบี้ย iWealthy ที่แนะนำ: {calculatedMinPremium.toLocaleString()} บ./ปี</p>
                                    <p>(RPP: {calculatedRpp?.toLocaleString()}, RTU: {calculatedRtu?.toLocaleString()})</p>
                                </div>
                            )}*/}
                        </div>
                    )}
                </section>
            </div>

            {/* สรุปเบี้ยสุขภาพปีแรก และ ปุ่มคำนวณหลัก */}
            <section className="mt-6 p-6 border rounded-lg shadow-xl bg-gradient-to-r from-sky-500 to-indigo-600">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-white text-left">
                        <h3 className="text-md font-semibold">เบี้ยประกันสุขภาพรวมปีแรก:</h3>
                        <p className="text-3xl font-bold mt-1">
                            {totalFirstYearHealthPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-medium">บาท/ปี</span>
                        </p>
                    </div>
                    {calculatedMinPremium !== undefined && (
                        <div className="mt-3 p-2 text-white text-left">
                            <h3 className="text-md font-semibold">เบี้ย iWealthy ที่แนะนำ:</h3>
                            <p className="text-3xl font-bold mt-1">    
                                {calculatedMinPremium.toLocaleString()} <span className="text-lg font-medium">บาท/ปี</span>
                            </p>
                            <p>(RPP: {calculatedRpp?.toLocaleString()}, RTU: {calculatedRtu?.toLocaleString()})</p>
                        </div>
                    )}
                    <button
                        onClick={runCalculation}
                        disabled={isLoading || showIHUWarning} // บล็อกถ้า isLoading หรือถ้าไม่เลือก IHU
                        className={`w-full md:w-auto px-10 py-3 bg-green-500 text-white font-bold text-md rounded-lg shadow-lg 
                                   hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 
                                   ${(isLoading || showIHUWarning) ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' : 'transform hover:scale-105'}
                                   transition-all duration-150 ease-in-out`}
                    >
                        {isLoading ? 'กำลังคำนวณ...' : 'คำนวณ LTHC Plan'}
                    </button>
                </div>
                {/* ⭐ ส่วนแสดงข้อความเตือน ถ้า isIHUSelected เป็น false ⭐ */}
                {showIHUWarning && (
                    <div className="mt-3 text-sm text-yellow-300 flex items-center justify-center md:justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.332-.166 3.001-1.742 3.001H4.42c-1.576 0-2.492-1.67-1.742-3.001l5.58-9.92zM10 14a1 1 0 100-2 1 1 0 000 2zm0-7a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        กรุณาเลือกแผน iHealthy Ultra เพื่อความคุ้มครองค่ารักษาพยาบาล
                    </div>
                )}
            </section>

            {/* ส่วนแสดงข้อความ Error จากการคำนวณ */}
            {error && (
                <div className="mt-4 p-4 text-red-800 bg-red-100 border-2 border-red-500 rounded-lg shadow-md">
                    <p className="font-bold text-lg">! เกิดข้อผิดพลาด:</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};