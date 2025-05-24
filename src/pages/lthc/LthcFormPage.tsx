// src/pages/lthc/LthcFormPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';

// Import Types ที่ LthcFormPage.tsx จำเป็นต้องใช้โดยตรง
// Types เหล่านี้ควรถูก export จาก useLthcTypes.ts
import type {
    UseLthcPlannerReturn,
    //Gender,
    LifeReadyPaymentTerm,
    IHealthyUltraPlan,
    //IHealthyUltraPlanSelection,
    MEBPlan,
    HealthPlanSelections, // อาจจะจำเป็นถ้าสร้าง object health plan ชั่วคราว
    // AnnualHealthPremiumDetail, // ไม่จำเป็นต้อง import ถ้า healthPremiums จาก context มี type ที่ชัดเจนแล้ว
} from '../../hooks/useLthcTypes'; // ตรวจสอบ Path นี้ให้ถูกต้อง

// Import functions คำนวณเบี้ยสุขภาพโดยตรง ถ้าจะใช้คำนวณเบี้ยโชว์ทันที
import {
    calculateLifeReadyPremium,
    calculateIHealthyUltraPremium,
    calculateMEBPremium,
} from '../../lib/healthPlanCalculations'; // ตรวจสอบ Path นี้ให้ถูกต้อง


export default function LthcFormPage() {
    const context = useOutletContext<UseLthcPlannerReturn>();

    if (!context) {
        return <div className="p-4 text-center text-gray-600">กำลังโหลดข้อมูล Planner หรือ Context ไม่พร้อมใช้งาน...</div>;
    }

    const {
        mode: iWealthyMode,
        setMode: setIWealthyMode,
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
        //healthPremiums, // ดึง healthPremiums (ที่เป็น array ที่คำนวณแล้ว) มาจาก context
    } = context;

    const [lifeReadyMode, setLifeReadyMode] = useState<'normal' | 'package'>('normal');
    const iHealthyUltraPlanColors: Record<IHealthyUltraPlan, string> = {
    Smart: 'text-ihu-smart',
    Bronze: 'text-ihu-bronze',
    Silver: 'text-ihu-silver',
    Gold: 'text-ihu-gold',
    Diamond: 'text-ihu-diamond',
    Platinum: 'text-ihu-platinum',
};

    useEffect(() => {
        if (lifeReadyMode === 'package') {
            setSelectedHealthPlans(prevPlans => ({
                ...prevPlans,
                lifeReadySA: 50000,
                lifeReadyPPT: 99 as LifeReadyPaymentTerm,
                iHealthyUltraPlan: 'None' as IHealthyUltraPlan, // 'Smart' หมายถึงไม่เลือก
                mebPlan: 0 as MEBPlan, // 0 หมายถึงไม่เลือก
            }));
            // เมื่อเป็น package mode, ปิดการเลือก IHU และ MEB ด้วย
            setIsIHUSelected(false);
            setIsMEBSelected(false);
        }
        // เมื่อเปลี่ยนกลับเป็น 'normal', selectedHealthPlans จะยังคงค่าเดิม
        // ผู้ใช้สามารถเลือกใหม่ได้ หรืออาจจะ reset เป็น default ของ normal mode
    }, [lifeReadyMode, setSelectedHealthPlans]);

    const displayLifeReadySA = lifeReadyMode === 'package' ? 50000 : selectedHealthPlans.lifeReadySA;
    const displayLifeReadyPPT = lifeReadyMode === 'package' ? (99 as LifeReadyPaymentTerm) : selectedHealthPlans.lifeReadyPPT;

    // ใช้ handleHealthPlanChange ที่รับ key และ value เพื่อลดความซ้ำซ้อน
    const handleHealthPlanSelectionChange = <K extends keyof HealthPlanSelections>(
        field: K,
        value: HealthPlanSelections[K]
    ) => {
        // อนุญาตให้แก้ไขเฉพาะเมื่อ lifeReadyMode เป็น 'normal' สำหรับ LifeReady fields และ Riders
        if (lifeReadyMode === 'normal') {
            setSelectedHealthPlans(prev => ({ ...prev, [field]: value }));
        } else if (lifeReadyMode === 'package' && (field !== 'lifeReadySA' && field !== 'lifeReadyPPT')) {
            // ในโหมด Package, ไม่อนุญาตให้เปลี่ยน Riders (จะถูกตั้งเป็น "ไม่เลือก" โดย useEffect)
            // แต่ถ้าต้องการให้ยังเปลี่ยนได้ ก็ลบเงื่อนไขนี้ออก
        }
    };


    const [isIHUSelected, setIsIHUSelected] = useState<boolean>(() =>
        lifeReadyMode === 'normal' && selectedHealthPlans.iHealthyUltraPlan !== 'NONE'
    );
    const [isMEBSelected, setIsMEBSelected] = useState<boolean>(() =>
        lifeReadyMode === 'normal' && selectedHealthPlans.mebPlan !== 0 // สมมติ 0 คือไม่เลือก
    );

    useEffect(() => {
        // Sync checkbox state with selectedHealthPlans, but only if in normal mode
        // In package mode, riders are effectively deselected by the useEffect for lifeReadyMode
        if (lifeReadyMode === 'normal') {
            setIsIHUSelected(selectedHealthPlans.iHealthyUltraPlan !== 'NONE');
            setIsMEBSelected(selectedHealthPlans.mebPlan !== 0);
        } else {
            setIsIHUSelected(false);
            setIsMEBSelected(false);
        }
    }, [selectedHealthPlans.iHealthyUltraPlan, selectedHealthPlans.mebPlan, lifeReadyMode]);

    const handleIHUCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setIsIHUSelected(isChecked); // อัปเดต UI ทันที
        if (lifeReadyMode === 'normal') {
            handleHealthPlanSelectionChange('iHealthyUltraPlan', isChecked ? 'Smart' : 'NONE');
        }
    };
    const handleIHUPlanChange = (value: IHealthyUltraPlan) => { // Dropdown ส่งค่าแผนจริงๆ มา
        if (lifeReadyMode === 'normal' && isIHUSelected) {
            setSelectedHealthPlans(prev => ({ ...prev, iHealthyUltraPlan: value }));
        }
    };


    const handleMEBCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setIsMEBSelected(isChecked); // อัปเดต UI ทันที
        if (lifeReadyMode === 'normal') {
            handleHealthPlanSelectionChange('mebPlan', isChecked ? 500 : 0);
        }
    };
    const handleMEBPlanChange = (value: MEBPlan) => { // Dropdown ส่งค่าแผนจริงๆ มา
        if (lifeReadyMode === 'normal' && isMEBSelected) {
            setSelectedHealthPlans(prev => ({ ...prev, mebPlan: value }));
        }
    };

    const currentLrPremium = useMemo(() =>
        calculateLifeReadyPremium(policyholderEntryAge, policyholderGender, displayLifeReadySA, displayLifeReadyPPT)
    , [policyholderEntryAge, policyholderGender, displayLifeReadySA, displayLifeReadyPPT]);

    const currentIhuPremium = useMemo(() => {
        // ตรวจสอบเงื่อนไขทั้งหมด:
        // 1. Checkbox IHU ถูกเลือก (isIHUSelected)
        // 2. LifeReady Mode เป็น 'normal'
        // 3. แผน IHU ที่เลือกไว้ใน selectedHealthPlans ไม่ใช่ 'NONE'
        if (isIHUSelected && lifeReadyMode === 'normal' && selectedHealthPlans.iHealthyUltraPlan !== 'NONE') {
            return calculateIHealthyUltraPremium(
                policyholderEntryAge,
                policyholderGender,
                selectedHealthPlans.iHealthyUltraPlan as IHealthyUltraPlan // ✅ Cast เป็น IHealthyUltraPlan หลังจากตรวจสอบแล้ว
            );
        }
        return 0; // ถ้าเงื่อนไขไม่ผ่าน ให้เบี้ยเป็น 0
    }, [isIHUSelected, lifeReadyMode, policyholderEntryAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan]);

   const currentMebPremium = useMemo(() => {
        // ตรวจสอบเงื่อนไขทั้งหมด:
        // 1. Checkbox MEB ถูกเลือก (isMEBSelected)
        // 2. LifeReady Mode เป็น 'normal'
        // 3. แผน MEB ที่เลือกไว้ใน selectedHealthPlans ไม่ใช่ค่าที่หมายถึง "ไม่เลือก" (เช่น ไม่ใช่ 0 หรือ null)
        if (isMEBSelected && lifeReadyMode === 'normal' && selectedHealthPlans.mebPlan !== 0 && selectedHealthPlans.mebPlan !== null) { // เพิ่มการตรวจสอบ null ถ้า MEBPlanSelection เป็น MEBPlanOriginal | null
            return calculateMEBPremium(
                policyholderEntryAge, // หรือ attainedAge ถ้า MEB คำนวณตาม attainedAge
                selectedHealthPlans.mebPlan as MEBPlan // ✅ Cast เป็น MEBPlan (ที่ไม่มี 0 หรือ null) หลังจากตรวจสอบแล้ว
            );
        }
        return 0; // ถ้าเงื่อนไขไม่ผ่าน ให้เบี้ยเป็น 0
    }, [isMEBSelected, lifeReadyMode, policyholderEntryAge, policyholderGender, selectedHealthPlans.mebPlan]);
    // หมายเหตุ: policyholderGender อาจจะไม่จำเป็นใน dependency array นี้ ถ้า calculateMEBPremium ไม่ได้ใช้

    const totalFirstYearHealthPremium = currentLrPremium + currentIhuPremium + currentMebPremium;

    const ageOptions = Array.from({ length: 80 }, (_, i) => i + 1);

    return (
        <div className="space-y-6 pb-12">
            {/* Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* === COLUMN 1: ข้อมูลผู้เอาประกัน และ LifeReady === */}
                <section className={`p-4 border rounded-lg shadow-md space-y-4 ${lifeReadyMode === 'package' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <div>
                        <h2 className="text-lg font-semibold mb-3 text-slate-700">ข้อมูลผู้เอาประกัน</h2>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-center mb-4">
                            <div>
                                <label htmlFor="entryAge" className="block text-xs font-medium text-gray-600 mb-0.5">อายุ (ปี)</label>
                                <select
                                    id="entryAge"
                                    value={policyholderEntryAge}
                                    onChange={(e) => setPolicyholderEntryAge(Math.max(1, Math.min(80, parseInt(e.target.value, 10) || 1)))}
                                    className="p-2 w-full border rounded-md shadow-sm text-sm"
                                >
                                    {ageOptions.map(age => <option key={age} value={age}>{age}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">เพศ</label>
                                <div className="flex space-x-3 items-center mt-1">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="gender" value="male" checked={policyholderGender === 'male'} onChange={() => setPolicyholderGender('male')} className="form-radio accent-blue-600 h-4 w-4" />
                                        <span className={`ml-1.5 text-sm ${policyholderGender === 'male' ? 'font-bold text-blue-600' : 'text-gray-700'}`}>ชาย</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="gender" value="female" checked={policyholderGender === 'female'} onChange={() => setPolicyholderGender('female')} className="form-radio accent-pink-600 h-4 w-4" />
                                        <span className={`ml-1.5 text-sm ${policyholderGender === 'female' ? 'font-bold text-pink-600' : 'text-gray-700'}`}>หญิง</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr className="my-3"/>
                    <div>
                        <h2 className={`text-lg font-semibold mb-3 ${lifeReadyMode === 'package' ? 'text-green-700' : 'text-blue-700'}`}>
                            แผน LifeReady
                        </h2>
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
                                    id="lrSA-form" type="number" value={displayLifeReadySA}
                                    onChange={(e) => handleHealthPlanSelectionChange('lifeReadySA', Number(e.target.value))}
                                    disabled={lifeReadyMode === 'package'}
                                    className="mt-1 p-2 w-full border rounded-md shadow-sm disabled:bg-gray-200 disabled:text-gray-500"
                                    step="50000"
                                />
                            </div>
                            <div>
                                <label htmlFor="lrPPT-form" className="block text-sm font-medium text-gray-700">ระยะเวลาชำระเบี้ย:</label>
                                <select
                                    id="lrPPT-form" value={displayLifeReadyPPT}
                                    onChange={(e) => handleHealthPlanSelectionChange('lifeReadyPPT', Number(e.target.value) as LifeReadyPaymentTerm)}
                                    disabled={lifeReadyMode === 'package'}
                                    className="mt-1 p-2 w-full border rounded-md shadow-sm disabled:bg-gray-200 disabled:text-gray-500"
                                >
                                    <option value={6}>6 ปี</option> <option value={12}>12 ปี</option>
                                    <option value={18}>18 ปี</option> <option value={99}>ถึงอายุ 99 ปี</option>
                                </select>
                            </div>
                            {lifeReadyMode === 'package' && (
                                <p className="text-xs text-gray-600 pt-1">
                                    Package: ทุน 50,000 บาท, ชำระถึงอายุ 99 ปี (ไม่รวมสัญญาเพิ่มเติมอื่น)
                                </p>
                            )}
                             <div className="pt-2">
                                <p className="text-xs text-gray-600">เบี้ยประกัน LifeReady ปีแรก:</p>
                                <p className={`text-md font-semibold ${lifeReadyMode === 'package' ? 'text-green-700' : 'text-blue-700'}`}>
                                    {currentLrPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* === COLUMN 2: สัญญาเพิ่มเติมสุขภาพ === */}
                <section className={`p-4 border rounded-lg shadow-md space-y-4 bg-white ${lifeReadyMode === 'package' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h2 className="text-lg font-semibold text-slate-700">
                        เลือกสัญญาเพิ่มเติม {lifeReadyMode === 'package' ? '(Package ไม่รวมส่วนนี้)' : ''}
                    </h2>
                    <div className="p-3 border rounded-md bg-indigo-50">
                        <label className="flex items-center space-x-2 cursor-pointer mb-2">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 rounded disabled:opacity-70"
                                   checked={isIHUSelected} onChange={handleIHUCheckboxChange} disabled={lifeReadyMode === 'package'} />
                            <span className={`font-medium text-sm ${lifeReadyMode === 'package' ? 'text-gray-500' : 'text-indigo-700'}`}>iHealthy Ultra</span>
                        </label>
                        {isIHUSelected && lifeReadyMode === 'normal' && (
                            <div className="pl-6 space-y-1 animate-fadeIn">
                                <label htmlFor="ihuPlan-form" className="text-xs text-gray-600 block">เลือกแผน:</label>
                                <select id="ihuPlan-form" value={selectedHealthPlans.iHealthyUltraPlan}
                                    onChange={(e) => handleIHUPlanChange(e.target.value as IHealthyUltraPlan)}
                                    // ⭐ เพิ่ม className ให้กับ select เพื่อให้ option ที่ถูกเลือกมีสี (ถ้า browser รองรับ) ⭐
                                    className={`p-1.5 border rounded-md text-xs w-full ${selectedHealthPlans.iHealthyUltraPlan && selectedHealthPlans.iHealthyUltraPlan !== 'NONE' ? iHealthyUltraPlanColors[selectedHealthPlans.iHealthyUltraPlan] : ''}`}
                                >
                                    {(['Smart', 'Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum'] as IHealthyUltraPlan[]).map(planName => (
                                        <option
                                            key={planName}
                                            value={planName}
                                            className={iHealthyUltraPlanColors[planName]} // กำหนด class สีให้แต่ละ option
                                        >
                                            {planName}
                                        </option>
                                    ))}
                                </select>
                                <div className="pt-1">
                                    <p className="text-xs text-gray-500">เบี้ยประกัน IHU ปีแรก:</p>
                                    <p className="text-sm font-semibold text-indigo-700">{currentIhuPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-3 border rounded-md bg-lime-50">
                         <label className="flex items-center space-x-2 cursor-pointer mb-2">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-lime-600 rounded disabled:opacity-70"
                                checked={isMEBSelected} onChange={handleMEBCheckboxChange} disabled={lifeReadyMode === 'package'} />
                            <span className={`font-medium text-sm ${lifeReadyMode === 'package' ? 'text-gray-500' : 'text-lime-700'}`}>MEB (ชดเชยรายวัน)</span>
                        </label>
                         {isMEBSelected && lifeReadyMode === 'normal' && (
                            <div className="pl-6 space-y-1 animate-fadeIn">
                                <label htmlFor="mebPlanValue-form" className="text-xs text-gray-600 block">เลือกจำนวนเงิน:</label>
                                <select id="mebPlanValue-form" value={selectedHealthPlans.mebPlan}
                                    onChange={(e) => handleMEBPlanChange(Number(e.target.value) as MEBPlan)}
                                    className="p-1.5 border rounded-md text-xs w-full">
                                    <option value={500}>500</option>
                                    <option value={1000}>1000</option>
                                    <option value={2000}>2000</option>
                                    <option value={3000}>3000</option>
                                    <option value={4000}>4000</option>
                                    <option value={5000}>5000</option>
                                </select>
                                <div className="pt-1">
                                    <p className="text-xs text-gray-500">เบี้ยประกัน MEB ปีแรก:</p>
                                    <p className="text-sm font-semibold text-lime-700">{currentMebPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* === COLUMN 3: ตั้งค่า iWealthy === */}
                <section className={`p-4 border rounded-lg shadow-md space-y-4 ${iWealthyMode === 'manual' ? 'bg-emerald-50' : 'bg-sky-50'}`}>
                    <h2 className={`text-lg font-semibold ${iWealthyMode === 'manual' ? 'text-emerald-700' : 'text-sky-700'}`}>3. ตั้งค่า iWealthy</h2>
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
                            <p className="text-xs text-gray-600">ระบบจะคำนวณเบี้ย iWealthy ที่ต่ำที่สุด โดยสามารถปรับ Ratio RPP/RTU ได้</p>
                            <div><label htmlFor="autoInvReturn" className="block text-xs font-medium text-gray-700">ผลตอบแทน (%):</label><input id="autoInvReturn" type="number" step="0.5" value={autoInvestmentReturn} onChange={e => setAutoInvestmentReturn(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                            <div><label htmlFor="autoIWppt" className="block text-xs font-medium text-gray-700">ระยะเวลาจ่ายเบี้ย iWealthy (ปี):</label><input id="autoIWppt" type="number" value={autoIWealthyPPT} onChange={e => setAutoIWealthyPPT(Number(e.target.value))} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm" /></div>
                            <div>
                                <label htmlFor="autoRppRtu" className="block text-xs font-medium text-gray-700">สัดส่วน RPP/RTU (หลังคำนวณครั้งแรก):</label>
                                <select id="autoRppRtu" value={autoRppRtuRatio} onChange={e => setAutoRppRtuRatio(e.target.value)} className="mt-0.5 p-2 w-full border rounded-md shadow-sm text-sm">
                                    <option value="100/0">RPP 100%</option> <option value="80/20">RPP 80%/RTU 20%</option>
                                    <option value="70/30">RPP 70%/RTU 30%</option> <option value="60/40">RPP 60%/RTU 40%</option>
                                    <option value="50/50">RPP 50%/RTU 50%</option>
                                </select>
                            </div>
                            {calculatedMinPremium !== undefined && (
                                <div className="mt-3 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-xs">
                                    <p>เบี้ยรวม iWealthy ที่แนะนำ: {calculatedMinPremium.toLocaleString()} บ./ปี</p>
                                    <p>(RPP: {calculatedRpp?.toLocaleString()}, RTU: {calculatedRtu?.toLocaleString()})</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* สรุปเบี้ยสุขภาพปีแรก และ ปุ่มคำนวณหลัก */}
            <section className="mt-6 p-6 border rounded-lg shadow-xl bg-gradient-to-r from-sky-500 to-indigo-600">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-white text-center md:text-left">
                        <h3 className="text-md font-semibold">เบี้ยประกันสุขภาพรวมปีแรก:</h3>
                        <p className="text-3xl font-bold mt-1">
                            {totalFirstYearHealthPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-medium">บาท/ปี</span>
                        </p>
                    </div>
                    <button
                        onClick={runCalculation}
                        disabled={isLoading}
                        className="w-full md:w-auto px-10 py-3 bg-green-500 text-white font-bold text-md rounded-lg shadow-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-gray-400 transition-all duration-150 ease-in-out transform hover:scale-105"
                    >
                        {isLoading ? 'กำลังคำนวณ...' : 'คำนวณ LTHC Plan'}
                    </button>
                </div>
            </section>

            {/* ส่วนแสดงข้อความ Error */}
            {error && (
                <div className="mt-4 p-4 text-red-800 bg-red-100 border-2 border-red-500 rounded-lg shadow-md">
                    <p className="font-bold text-lg">! เกิดข้อผิดพลาด:</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};