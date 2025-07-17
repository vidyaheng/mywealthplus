// src/components/lthc/LthcReduceSumInsuredModal.tsx (ฉบับแก้ไข)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { SAReductionStrategy } from '@/hooks/useLthcTypes';
import { FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';

interface LthcReduceSumInsuredModalProps {
    isOpen: boolean;
    onClose: () => void;
    strategy: SAReductionStrategy;
    setStrategy: React.Dispatch<React.SetStateAction<SAReductionStrategy>>;
    entryAge: number;
    maxPolicyAge: number;
}

export default function LthcReduceSumInsuredModal({ isOpen, onClose, strategy, setStrategy, entryAge, maxPolicyAge }: LthcReduceSumInsuredModalProps) {
    const [workingStrategy, setWorkingStrategy] = useState<SAReductionStrategy>(strategy);
    const ageSelectRef = useRef<HTMLSelectElement>(null);

    // ... (useMemo และ useEffect เหมือนเดิม) ...
    const availableAgesForDropdown = useMemo(() => {
        let startAge = entryAge + 1;
        if (workingStrategy.type === 'manual' && workingStrategy.ages.length > 0) {
            startAge = Math.max(...workingStrategy.ages) + 1;
        }
        if (startAge > maxPolicyAge) return [];
        return Array.from({ length: maxPolicyAge - startAge + 1 }, (_, i) => startAge + i);
    }, [entryAge, maxPolicyAge, workingStrategy]);
    
    useEffect(() => {
        if (isOpen) {
            setWorkingStrategy(strategy);
        }
    }, [isOpen, strategy]);

    if (!isOpen) {
        return null;
    }


    const handleStrategyTypeChange = (type: 'auto' | 'manual' | 'none') => {
        if (type === 'auto') {
            setWorkingStrategy({ type: 'auto' });
        } else if (type === 'manual') {
            const currentAges = workingStrategy.type === 'manual' ? workingStrategy.ages : [];
            setWorkingStrategy({ type: 'manual', ages: currentAges });
        } else if (type === 'none') {
            setWorkingStrategy({ type: 'none' });
        }
    };

    const handleAddAge = () => {
        const selectedValue = ageSelectRef.current?.value;
        if (!selectedValue) return;
        const ageToAdd = parseInt(selectedValue, 10);
        if (isNaN(ageToAdd)) return;
        if (workingStrategy.type === 'manual') {
            const newAges = [...workingStrategy.ages, ageToAdd].sort((a, b) => a - b);
            setWorkingStrategy({ type: 'manual', ages: newAges });
        }
    };
    
    const handleDeleteAge = (ageToDelete: number) => {
        if (workingStrategy.type === 'manual') {
            const newAges = workingStrategy.ages.filter(age => age !== ageToDelete);
            setWorkingStrategy({ type: 'manual', ages: newAges });
        }
    };

    const handleSave = () => {
        if (workingStrategy.type === 'manual' && workingStrategy.ages.length === 0) {
            setStrategy({ type: 'none' });
        } else {
            setStrategy(workingStrategy);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">ตั้งค่าการลดทุน iWealthy</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
                </div>
                <div className="p-5 space-y-6">
                    <div>
                        <label className="font-medium text-gray-700">รูปแบบการลดทุน</label>
                        {/* ✅ เพิ่มปุ่ม "ไม่ลดทุน" */}
                        <div className="mt-2 grid grid-cols-3 rounded-md shadow-sm">
                            <button type="button" onClick={() => handleStrategyTypeChange('auto')}
                                className={`px-4 py-2 text-sm font-medium rounded-l-md border border-gray-300 ${workingStrategy.type === 'auto' ? 'bg-blue-600 text-white z-10' : 'bg-white hover:bg-gray-50'}`}>
                                อัตโนมัติ
                            </button>
                            <button type="button" onClick={() => handleStrategyTypeChange('manual')}
                                className={`px-4 py-2 text-sm font-medium border-t border-b border-gray-300 ${workingStrategy.type === 'manual' ? 'bg-blue-600 text-white z-10' : 'bg-white hover:bg-gray-50'}`}>
                                กำหนดเอง
                            </button>
                            <button type="button" onClick={() => handleStrategyTypeChange('none')}
                                className={`px-4 py-2 text-sm font-medium rounded-r-md border border-l-0 border-gray-300 ${workingStrategy.type === 'none' ? 'bg-blue-600 text-white z-10' : 'bg-white hover:bg-gray-50'}`}>
                                ไม่ลดทุน
                            </button>
                        </div>
                    </div>
                    
                    {workingStrategy.type === 'manual' && (
                        <div className="p-4 border rounded-md bg-gray-50 space-y-3 animate-fadeIn">
                            <label className="font-medium text-gray-700 text-sm">กำหนดอายุที่ต้องการลดทุน</label>
                            <div className="flex items-center gap-2">
                                <select ref={ageSelectRef} className="flex-grow p-2 border border-gray-300 rounded-md bg-white"
                                    disabled={availableAgesForDropdown.length === 0}>
                                    {availableAgesForDropdown.length > 0 ? (
                                        availableAgesForDropdown.map(age => <option key={age} value={age}>{age} ปี</option>)
                                    ) : ( <option>ไม่มีอายุให้เลือกแล้ว</option> )}
                                </select>
                                <button onClick={handleAddAge}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={availableAgesForDropdown.length === 0}>
                                    <FaPlus size={12}/> เพิ่ม
                                </button>
                            </div>
                            
                            {workingStrategy.ages.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">แผนการลดทุน:</h4>
                                    <ul className="space-y-1">
                                        {workingStrategy.ages.map((startAge, index, sortedAges) => {
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
                    )}

                    {workingStrategy.type === 'auto' && (
                         <div className="p-4 border border-dashed rounded-md bg-blue-50 text-center text-sm text-blue-700">
                             ระบบจะลดทุนในปีที่ 2 และที่อายุ 41, 51, 61, 66 (ถ้ามี) โดยอัตโนมัติ
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