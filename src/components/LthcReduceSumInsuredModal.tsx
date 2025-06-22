// src/components/lthc/LthcReduceSumInsuredModal.tsx (Simplified Version)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { SAReductionStrategy } from '@/hooks/useLthcTypes';
import { FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';

interface LthcReduceSumInsuredModalProps {
    isOpen: boolean;
    onClose: () => void;
    // รับ strategy ปัจจุบันมา (ซึ่งจะเป็น manual เสมอเมื่อ modal นี้เปิด)
    strategy: SAReductionStrategy; 
    setStrategy: React.Dispatch<React.SetStateAction<SAReductionStrategy>>;
    entryAge: number;
    maxPolicyAge: number;
}

export default function LthcReduceSumInsuredModal({ isOpen, onClose, strategy, setStrategy, entryAge, maxPolicyAge }: LthcReduceSumInsuredModalProps) {
    // state ชั่วคราวสำหรับแก้ไขใน modal
    const [workingAges, setWorkingAges] = useState<number[]>([]);
    const ageSelectRef = useRef<HTMLSelectElement>(null);

    const availableAgesForDropdown = useMemo(() => {
        let startAge = entryAge + 1;
        if (workingAges.length > 0) {
            startAge = Math.max(...workingAges) + 1;
        }
        if (startAge > maxPolicyAge) return [];
        return Array.from({ length: maxPolicyAge - startAge + 1 }, (_, i) => startAge + i);
    }, [entryAge, maxPolicyAge, workingAges]);
    
    useEffect(() => {
        if (isOpen && strategy.type === 'manual') {
            // เมื่อ modal เปิด, ให้ copy ages จาก strategy มาใส่ state ชั่วคราว
            setWorkingAges(strategy.ages);
        }
    }, [isOpen, strategy]);

    if (!isOpen) {
        return null;
    }

    const handleAddAge = () => {
        const selectedValue = ageSelectRef.current?.value;
        if (!selectedValue) return;
        const ageToAdd = parseInt(selectedValue, 10);
        if (isNaN(ageToAdd)) return;
        const newAges = [...workingAges, ageToAdd].sort((a, b) => a - b);
        setWorkingAges(newAges);
    };
    
    const handleDeleteAge = (ageToDelete: number) => {
        const newAges = workingAges.filter(age => age !== ageToDelete);
        setWorkingAges(newAges);
    };

    const handleSave = () => {
        // บันทึก list อายุที่แก้ไขแล้วกลับไปที่ Planner
        setStrategy({ type: 'manual', ages: workingAges });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">กำหนดอายุที่ต้องการลดทุน</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <select
                            ref={ageSelectRef}
                            className="flex-grow p-2 border border-gray-300 rounded-md bg-white"
                            disabled={availableAgesForDropdown.length === 0}
                        >
                            {availableAgesForDropdown.length > 0 ? (
                                availableAgesForDropdown.map(age => <option key={age} value={age}>{age} ปี</option>)
                            ) : (
                                <option>ไม่มีอายุให้เลือกแล้ว</option>
                            )}
                        </select>
                        <button onClick={handleAddAge}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={availableAgesForDropdown.length === 0}>
                            <FaPlus size={12}/> เพิ่ม
                        </button>
                    </div>
                    
                    {workingAges.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">แผนการลดทุน:</h4>
                            <ul className="space-y-1">
                                {workingAges.map((startAge, index, sortedAges) => {
                                    const nextReductionAge = sortedAges[index + 1];
                                    const endAge = nextReductionAge ? nextReductionAge - 1 : maxPolicyAge;
                                    const rangeText = startAge === endAge ? `${startAge} ปี` : `ช่วงอายุ ${startAge} - ${endAge} ปี`;
                                    return (
                                        <li key={startAge} className="flex items-center justify-between gap-2 bg-blue-100 text-blue-800 text-sm px-3 py-1.5 rounded-md">
                                            <span>{index + 1}. ลดทุนที่ {rangeText}</span>
                                            <button onClick={() => handleDeleteAge(startAge)} className="text-blue-500 hover:text-red-600 hover:scale-110 transition-transform">
                                                <FaTrash size={12} />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="flex justify-end items-center gap-3 p-4 border-t bg-gray-50">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium">ยกเลิก</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md flex items-center gap-2 text-sm font-medium">
                        <FaSave /> บันทึก
                    </button>
                </div>
            </div>
        </div>
    );
}