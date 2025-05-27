// src/pages/lthc/LTHCLayout.tsx

//import React from 'react';
import { Outlet, useNavigate, useLocation, } from 'react-router-dom';

// Import Custom Hook และ Types ที่จำเป็น
import {
    useLthcPlanner,
     // Import props type for the hook
    // AnnualLTHCOutputRow, // LthcTablePage จะ import เองถ้าต้องการ type โดยตรง
} from '../../hooks/useLthcPlanner'; // ปรับ path ให้ถูกต้อง

import type {
    UseLthcPlannerProps,    // <--- ✅ Import จาก useLthcTypes.ts
    Gender,
    //HealthPlanSelections,     // <--- ✅ Import จาก useLthcTypes.ts
    LifeReadyPaymentTerm,
    IHealthyUltraPlanSelection, // <--- ✅ Import Selection Type
    MEBPlanSelection,           // <--- ✅ Import Selection Type
    //PolicyOriginMode,         // <--- ✅ Import Type ใหม่
    //IWealthyMode                  // <--- ✅ Import Type นี้สำหรับ iWealthyMode
    // AnnualLTHCOutputRow, // LthcTablePage หรือ LthcFormPage อาจจะ import เองถ้าต้องการ
} from '../../hooks/useLthcTypes';   // หรือ path ที่ถูกต้องไปยัง useLthcTypes.ts

// (อาจจะ Import UI Components สำหรับ Tab Bar จาก @/components/ui/tabs หรือที่คล้ายกัน)

const lthcTabs = [
    { label: "1. กรอกข้อมูล & วางแผน", path: "/lthc/form" },
    { label: "2. ตารางผลประโยชน์", path: "/lthc/table" },
    { label: "3. กราฟแสดงผล", path: "/lthc/chart" }, // สำหรับอนาคต
];

export default function LTHCLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // --- 1. ตั้งค่า Props เริ่มต้นสำหรับ useLthcPlanner ---
    // (ค่าเริ่มต้นเหล่านี้อาจจะมาจาก global state/context หรือ hardcode ชั่วคราว)
    const initialHookProps: UseLthcPlannerProps = {
        initialPolicyholderEntryAge: 30,
        initialPolicyholderGender: 'male' as Gender,
        initialSelectedHealthPlans: {
            lifeReadySA: 150000,
            lifeReadyPPT: 18 as LifeReadyPaymentTerm,
            iHealthyUltraPlan: 'Bronze' as IHealthyUltraPlanSelection,
            mebPlan: 1000 as MEBPlanSelection,
        },
        initialPolicyOriginMode: 'newPolicy',
        initialIWealthyMode: 'automatic',
    };

    // --- 2. เรียกใช้ Custom Hook ---
    // State และ Functions ทั้งหมดจะถูกจัดการโดย useLthcPlanner
    // และจะถูกส่งต่อไปให้ Outlet (LthcFormPage, LthcTablePage) ผ่าน context prop ของ Outlet
    const lthcPlannerStateAndFunctions = useLthcPlanner(initialHookProps);

    return (
        <div className="flex flex-col h-auto p-2 md:p-4 lg:p-6 bg-slate-50 min-h-screen">
            <header className="text-center mb-6">
                <h1 className="text-2xl font-bold text-sky-700">LTHC Planner - วางแผนสุขภาพแบบครบวงจร</h1>
            </header>

            {/* === ส่วน Tab Bar สำหรับ LTHC === */}
            <div className="flex justify-start ml-4">
                <div className="flex space-x-1">
                    {lthcTabs.map((tab) => {
                        const isActive = location.pathname === tab.path || (location.pathname === "/lthc" && tab.path === "/lthc/form");
                        return (
                            <button
                                key={tab.path}
                                onClick={() => navigate(tab.path)}
                                className={`
                                    px-4 py-2 text-sm font-semibold rounded-t-md 
                                    transition-all duration-200 ease-in-out
                                    focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50
                                    ${isActive
                                        ? 'bg-sky-600 text-white shadow-md scale-105'
                                        : 'bg-white text-sky-700 hover:bg-sky-50 hover:text-sky-800'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* === ส่วน Content Area สำหรับแต่ละ Tab ย่อย === */}
            <div className="flex-1 bg-white p-4 md:p-6 rounded-lg shadow-xl">
                {/* ส่ง lthcPlannerStateAndFunctions ทั้งหมดผ่าน context prop ของ Outlet */}
                <Outlet context={lthcPlannerStateAndFunctions} />
            </div>

            {/* (อาจจะมี Footer หรือส่วนอื่นๆ ที่ใช้ร่วมกันใน LTHC Layout) */}
        </div>
    );
}