// src/components/TopButtons.tsx

import React from "react";
import clsx from 'clsx';

// Import ไอคอนจาก Library ที่ยังใช้งานอยู่
//import { FaCalendarAlt } from 'react-icons/fa';

// Import ไอคอน SVG ของคุณเป็น React Component โดยการเติม ?react
// ตรวจสอบชื่อไฟล์และ Path ให้ถูกต้อง 100%
import PauseIcon from '@/assets/icons/PauseIcon';       // ไม่มี .svg?react
import AddReduceIcon from '@/assets/icons/AddReduceIcon';
import WithdrawalIcon from '@/assets/icons/WithdrawalIcon';
import LumpSumIcon from '@/assets/icons/LumpSumIcon';
import CalendarSwapIcon from '@/assets/icons/CalendarSwapIcon'; // ใช้ไอคอนนี้แทน FaCalendarAlt

// Interface สำหรับแต่ละ Action
interface ActionItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

// ข้อมูลปุ่มทั้งหมด
const topActions: ActionItem[] = [
    { id: "pause", label: "หยุดพักชำระ", icon: PauseIcon },
    { id: "reduceSI", label: "เพิ่ม/ลดทุน", icon: AddReduceIcon },
    { id: "withdrawPlan", label: "แผนถอนเงิน", icon: WithdrawalIcon },
    { id: "changeFreq", label: "งวดชำระ", icon: CalendarSwapIcon },
    { id: "addInvest", label: "ลงทุนเพิ่ม", icon: LumpSumIcon },
];

// Props Interface
interface TopButtonsProps {
    onOpenReduceModal: () => void;
    onOpenChangeFreqModal: () => void;
    onOpenWithdrawalModal: () => void;
    onOpenPauseModal: () => void;
    onOpenAddInvestmentModal: () => void;
    activeActions: Record<string, boolean>; 
}

export default function TopButtons({
    onOpenReduceModal,
    onOpenChangeFreqModal,
    onOpenWithdrawalModal,
    onOpenPauseModal,
    onOpenAddInvestmentModal,
    activeActions 
}: TopButtonsProps) {

    const handleActionClick = (actionId: string) => {
        if (actionId === "reduceSI") onOpenReduceModal();
        else if (actionId === "changeFreq") onOpenChangeFreqModal();
        else if (actionId === "withdrawPlan") onOpenWithdrawalModal();
        else if (actionId === "pause") onOpenPauseModal();
        else if (actionId === "addInvest") onOpenAddInvestmentModal();
    };

    return (
        <div className="flex justify-start items-center gap-2 md:gap-4">
            {topActions.map((action) => {
                const isActive = !!activeActions[action.id]; 

                return (
                    <button
                        key={action.id}
                        onClick={() => handleActionClick(action.id)}
                        className="group flex flex-col items-center gap-1.5 w-16 sm:w-20 focus:outline-none"
                    >
                        <span
                            className={clsx(
                                'text-[10px] sm:text-xs leading-tight text-center transition-colors',
                                isActive ? 'text-purple-800' : 'text-gray-600 group-hover:text-black'
                            )}
                        >
                            {action.label}
                        </span>

                        <div
                            className={clsx(
                                'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200',
                                'group-focus:ring-2 group-focus:ring-offset-2',
                                isActive 
                                    ? 'bg-purple-800 border-2 border-white shadow-lg group-hover:bg-purple-700 group-focus:ring-purple-500'
                                    : 'bg-white border border-gray-200 shadow-sm group-hover:bg-blue-50 group-hover:border-blue-300 group-focus:ring-blue-400'
                            )}
                        >
                            {/* 🔥 ส่วน Render ไอคอนที่แก้ไขใหม่ทั้งหมด */}
                            {React.createElement(action.icon, {
                                className: clsx(
                                    // 1. กำหนดขนาดที่นี่ที่เดียว
                                    'w-6 h-6 sm:w-7 sm:h-7', 
                                    // 2. กำหนดสีที่นี่ที่เดียว
                                    'transition-colors',
                                    isActive ? 'text-white' : 'text-purple-600'
                                )
                            })}
                        </div>

                        
                    </button>
                );
            })}
        </div>
    );
}