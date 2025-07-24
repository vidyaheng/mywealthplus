// src/components/lthc/LthcReduceSumInsuredModal.tsx (Minimalist Edition)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { SAReductionStrategy } from '@/hooks/useLthcTypes';
import { X, Save, Info } from 'lucide-react';

// --- Props Interface (เหมือนเดิม) ---
interface LthcReduceSumInsuredModalProps {
    isOpen: boolean;
    onClose: () => void;
    strategy: SAReductionStrategy;
    setStrategy: React.Dispatch<React.SetStateAction<SAReductionStrategy>>;
    entryAge: number;
    maxPolicyAge: number;
}

// 🎨 Minimalist Components (จำลอง)
const MinimalBadge = ({ children, onRemove }: { children: React.ReactNode, onRemove?: () => void }) => (
    <span className="inline-flex items-center gap-1.5 py-1 pl-2.5 pr-1 text-sm font-medium bg-slate-100 text-slate-700 rounded">
        {children}
        {onRemove && <button onClick={onRemove} className="p-0.5 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800"><X size={13} /></button>}
    </span>
);

export default function LthcReduceSumInsuredModal({ isOpen, onClose, strategy, setStrategy, entryAge, maxPolicyAge }: LthcReduceSumInsuredModalProps) {
    const [workingStrategy, setWorkingStrategy] = useState<SAReductionStrategy>(strategy);
    const ageSelectRef = useRef<HTMLSelectElement>(null);

    // --- Logic ส่วนใหญ่เหมือนเดิม ---
    const availableAgesForDropdown = useMemo(() => {
        let startAge = entryAge + 1;
        if (workingStrategy.type === 'manual' && workingStrategy.ages.length > 0) {
            startAge = Math.max(...workingStrategy.ages) + 1;
        }
        if (startAge > maxPolicyAge) return [];
        return Array.from({ length: maxPolicyAge - startAge + 1 }, (_, i) => startAge + i);
    }, [entryAge, maxPolicyAge, workingStrategy]);
    
    useEffect(() => {
        if (isOpen) setWorkingStrategy(strategy);
    }, [isOpen, strategy]);

    if (!isOpen) return null;

    const handleStrategyTypeChange = (type: 'auto' | 'manual' | 'none') => {
        setWorkingStrategy(prev => {
            if (type === 'manual') {
                const currentAges = prev.type === 'manual' ? prev.ages : [];
                return { type: 'manual', ages: currentAges };
            }
            return { type };
        });
    };
    
    const handleAddAgeFromSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const ageToAdd = parseInt(e.target.value, 10);
        if (isNaN(ageToAdd) || workingStrategy.type !== 'manual') return;

        const newAges = [...workingStrategy.ages, ageToAdd].sort((a, b) => a - b);
        setWorkingStrategy({ type: 'manual', ages: newAges });
        
        if(ageSelectRef.current) ageSelectRef.current.value = "";
    };
    
    const handleDeleteAge = (ageToDelete: number) => {
        if (workingStrategy.type !== 'manual') return;
        const newAges = workingStrategy.ages.filter(age => age !== ageToDelete);
        setWorkingStrategy({ type: 'manual', ages: newAges });
    };

    const handleSave = () => {
        setStrategy(workingStrategy.type === 'manual' && workingStrategy.ages.length === 0 ? { type: 'none' } : workingStrategy);
        onClose();
    };

    // 🎨 โครงสร้าง Modal สไตล์ Minimal
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4 backdrop-blur-[2px] animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
                
                {/* === Header === */}
                <div className="flex justify-between items-center p-6">
                    <h2 className="text-lg font-semibold text-slate-800">ตั้งค่าการลดทุน</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                
                {/* === Content === */}
                <div className="px-6 pb-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">รูปแบบการลดทุน</label>
                        <div className="flex items-center p-1 bg-slate-100 rounded-lg">
                           {(['auto', 'manual', 'none'] as const).map(type => (
                               <button 
                                 key={type} 
                                 onClick={() => handleStrategyTypeChange(type)}
                                 className={`w-full py-1.5 text-sm font-medium rounded-md transition-colors ${workingStrategy.type === type ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                               >
                                   {type === 'auto' && 'อัตโนมัติ'}
                                   {type === 'manual' && 'กำหนดเอง'}
                                   {type === 'none' && 'ไม่ลดทุน'}
                               </button>
                           ))}
                        </div>
                    </div>
                    
                    {/* === Section: Auto === */}
                    {workingStrategy.type === 'auto' && (
                        <div className="flex items-start gap-3 text-slate-600 animate-fadeIn">
                            <Info size={18} className="mt-0.5 flex-shrink-0 text-slate-400"/>
                            <p className="text-sm">ระบบจะลดทุนโดยอัตโนมัติในปีที่เหมาะสมเพื่อให้เกิดประโยชน์สูงสุด</p>
                        </div>
                    )}
                    
                    {/* === Section: Manual === */}
                    {workingStrategy.type === 'manual' && (
                        <div className="space-y-4 animate-fadeIn">
                            <hr className="border-slate-100" />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">กำหนดอายุที่เริ่มลดทุน</label>
                                 <select 
                                    ref={ageSelectRef} 
                                    value=""
                                    onChange={handleAddAgeFromSelect}
                                    className="w-full p-2 border border-slate-200 rounded-md bg-white text-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50 disabled:text-slate-400"
                                    disabled={availableAgesForDropdown.length === 0}
                                >
                                    <option value="" disabled>
                                        {availableAgesForDropdown.length > 0 ? "— เลือกอายุ —" : "ไม่มีอายุให้เลือกแล้ว"}
                                    </option>
                                    {availableAgesForDropdown.map(age => <option key={age} value={age}>{age} ปี</option>)}
                                </select>
                            </div>
                            
                            {workingStrategy.ages.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">แผนการลดทุน</h4>
                                    <div className="flex flex-wrap gap-2">
                                       {workingStrategy.ages.map(age => (
                                            <MinimalBadge key={age} onRemove={() => handleDeleteAge(age)}>
                                                อายุ {age} ปี
                                            </MinimalBadge>
                                       ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* === Footer === */}
                <div className="flex justify-end items-center gap-3 p-4 bg-slate-50/70 border-t border-slate-100 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-md text-sm font-medium transition-colors">ยกเลิก</button>
                    <button onClick={handleSave} className="px-5 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 shadow-sm shadow-sky-600/20 focus:ring-4 focus:ring-sky-200 flex items-center gap-2 text-sm font-medium transition-all">
                        <Save size={16} /> บันทึก
                    </button>
                </div>
            </div>
        </div>
    );
}