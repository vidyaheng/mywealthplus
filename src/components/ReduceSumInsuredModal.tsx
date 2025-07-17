// src/components/modals/ReduceSumInsuredModal.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { SumInsuredReductionRecord } from '@/lib/calculations';

// --- UI Component Imports (เพิ่ม Slider และไอคอนใหม่) ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Trash2, AlertTriangle, ShieldCheck, PlusCircle, History, ClipboardList } from 'lucide-react';

// --- Helper Function (เหมือนเดิม) ---
function getReductionMultipliers(age: number): { min: number; max: number } {
  if (age >= 1 && age <= 40) return { min: 40, max: 60 };
  if (age >= 41 && age <= 50) return { min: 30, max: 50 };
  if (age >= 51 && age <= 60) return { min: 20, max: 20 };
  if (age >= 61 && age <= 65) return { min: 15, max: 15 };
  if (age >= 66) return { min: 5, max: 5 };
  return { min: 0, max: 0 };
}

// --- Sub-component สำหรับแสดงรายการในประวัติ ---
function ReductionStepItem({ record, onDelete }: { record: SumInsuredReductionRecord, onDelete: (id: string | undefined) => void; }) {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-50 border rounded-lg hover:bg-zinc-100 transition-colors">
      <div className="flex items-center gap-4">
        <ShieldCheck className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-medium text-zinc-800">
            ตั้งแต่อายุ <span className="text-indigo-600">{record.age}</span> ปี
          </p>
          <p className="text-sm text-zinc-600">
            จำนวนเงินเอาประกันใหม่: <span className="font-semibold">{record.newSumInsured.toLocaleString()}</span> บาท
          </p>
        </div>
      </div>
      {record.id && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(record.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function ReduceSumInsuredModal() {
  // --- Store State ---
  const {
    isReduceModalOpen,
    closeReduceModal,
    iWealthyRpp,
    iWealthyAge,
    iWealthySumInsuredReductions,
    setIWealthySumInsuredReductions,
    acknowledgeIWealthyReductionChanges,
    iWealthyReductionsNeedReview,
  } = useAppStore();
  
  const maxPossibleAge = 98;

  // --- Local State (ออกแบบใหม่) ---
  const [reductions, setReductions] = useState<SumInsuredReductionRecord[]>([]);
  const [selectedAge, setSelectedAge] = useState<number>(iWealthyAge + 1);
  const [reductionAmount, setReductionAmount] = useState<number>(0);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // --- Derived State & Memos (ปรับปรุงใหม่) ---
  const lastReducedAge = useMemo(() =>
    reductions.length > 0 ? Math.max(...reductions.map(item => item.age)) : iWealthyAge,
    [reductions, iWealthyAge]
  );
  const nextAvailableAge = lastReducedAge + 1;
  
  const availableAges = useMemo(() => {
    const firstPossibleAge = lastReducedAge + 1;
    if (firstPossibleAge > maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - firstPossibleAge + 1 }, (_, i) => firstPossibleAge + i);
  }, [lastReducedAge, maxPossibleAge]);
  
  const { min: minAmount, max: maxAmount } = useMemo(() => {
    const multipliers = getReductionMultipliers(selectedAge);
    return {
      min: Math.round(iWealthyRpp * multipliers.min),
      max: Math.round(iWealthyRpp * multipliers.max),
    };
  }, [selectedAge, iWealthyRpp]);
  
  // --- Effects ---
  useEffect(() => {
    if (isReduceModalOpen) {
      const sortedReductions = [...iWealthySumInsuredReductions].sort((a, b) => a.age - b.age);
      setReductions(sortedReductions);
      
      const nextAvailableAge = (sortedReductions.length > 0 ? Math.max(...sortedReductions.map(r => r.age)) : iWealthyAge) + 1;
      const initialAge = Math.min(nextAvailableAge, maxPossibleAge);
      setSelectedAge(initialAge);
    }
  }, [isReduceModalOpen, iWealthySumInsuredReductions, iWealthyAge]);

  useEffect(() => {
    const newMultipliers = getReductionMultipliers(selectedAge);
    const newMinAmount = Math.round(iWealthyRpp * newMultipliers.min);
    setReductionAmount(newMinAmount);
  }, [selectedAge, iWealthyRpp]);
  
  // --- Handlers (ออกแบบใหม่) ---
  const handleAgeChange = (ageStr: string) => setSelectedAge(Number(ageStr));
  
  const handleSliderChange = (value: number[]) => setReductionAmount(value[0]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
    setReductionAmount(value);
  };

  const handleInputBlur = () => {
    const clampedAmount = Math.max(minAmount, Math.min(maxAmount, reductionAmount));
    setReductionAmount(clampedAmount);
  };

  const handleAddStep = useCallback(() => {
    const newStep: SumInsuredReductionRecord = {
      id: uuidv4(),
      age: selectedAge,
      newSumInsured: reductionAmount,
    };
    const newReductions = [...reductions, newStep].sort((a, b) => a.age - b.age);
    setReductions(newReductions);
    
    const nextAge = reductionAmount > 0 ? selectedAge + 1 : lastReducedAge + 1;
    if (nextAge <= maxPossibleAge) {
      setSelectedAge(nextAge);
    }
  }, [selectedAge, reductionAmount, reductions, lastReducedAge, maxPossibleAge]);
  
  const confirmDelete = useCallback(() => {
    if (!itemToDeleteId) return;
    const newReductions = reductions.filter(r => r.id !== itemToDeleteId);
    setReductions(newReductions);
    setItemToDeleteId(null);
  }, [itemToDeleteId, reductions]);

  const handleSaveAndClose = () => {
    setIWealthySumInsuredReductions(reductions);
    if(iWealthyReductionsNeedReview) {
      acknowledgeIWealthyReductionChanges();
    }
    closeReduceModal();
  };
  
  const canAddStep = availableAges.length > 0;

  return (
  <>
    <Dialog open={isReduceModalOpen} onOpenChange={(open) => !open && closeReduceModal()}>
      <DialogContent className="sm:max-w-4xl grid grid-rows-[auto,1fr,auto] p-0 max-h-[90vh] rounded-2xl overflow-hidden border-2 border-slate-200">
        
        <DialogHeader className="p-6 bg-slate-50 border-b">
          <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
            <History className="mr-3 h-8 w-8 text-teal-500" />
            วางแผนปรับเปลี่ยนจำนวนเงินเอาประกัน
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            ปรับเปลี่ยนความคุ้มครองล่วงหน้าให้เหมาะสมกับแต่ละช่วงชีวิตของคุณได้อย่างง่ายดายและเห็นภาพชัดเจน
          </DialogDescription>
          {iWealthyReductionsNeedReview && (
            <div className="flex items-center gap-3 mt-3 px-4 py-2 bg-amber-100/60 text-amber-900 text-sm rounded-lg border border-amber-300/80">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <span>การปรับทุนประกันถูกปรับค่าอัตโนมัติ กรุณาตรวจสอบและกดยืนยัน</span>
            </div>
          )}
        </DialogHeader>

        <div className="overflow-y-auto px-6 grid grid-cols-1 lg:grid-cols-[2fr,3fr] gap-x-8 gap-y-6 bg-slate-100/50">
          {/* --- คอลัมน์ซ้าย: ฟอร์มเพิ่มรายการ --- */}
          <div className="py-6 space-y-6">
            <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-teal-600"/>ปรับเปลี่ยนทุนประกัน</h3>
            <div className="p-5 bg-white border rounded-xl space-y-5 shadow-lg shadow-slate-200/50">
              <div className="space-y-2">
                <Label htmlFor="age-select" className="font-medium text-slate-700 text-base">1. เลือกอายุที่ต้องการ</Label>
                <Select onValueChange={handleAgeChange} value={selectedAge.toString()} disabled={!canAddStep}>
                  <SelectTrigger id="age-select" className="py-6 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableAges.map(age => (
                      <SelectItem key={age} value={age.toString()} className="text-base">
                        อายุ {age} ปี (ปีที่ {age - iWealthyAge + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium text-slate-700 text-base">2. กำหนดทุนประกันใหม่</Label>
                <div className="p-4 bg-slate-50 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <Input
                      type="text"
                      value={reductionAmount.toLocaleString()}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="text-3xl font-bold text-teal-600 border-0 shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent tracking-tighter"
                    />
                     <span className="text-slate-500 font-medium self-end pb-1">บาท</span>
                  </div>
                  <Slider
                    value={[reductionAmount]}
                    onValueChange={handleSliderChange}
                    min={minAmount}
                    max={maxAmount}
                    step={1000}
                    disabled={!canAddStep}
                    className="mt-4"
                  />
                  <div className="text-xs text-slate-500 mt-2 flex justify-between">
                    <span>ต่ำสุด: {minAmount.toLocaleString()}</span>
                    <span>สูงสุด: {maxAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleAddStep} disabled={!canAddStep} className="w-full text-lg py-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all transform hover:scale-[1.02]">
                ปรับเปลี่ยนทุนประกัน
              </Button>
            </div>
            {nextAvailableAge >= 66 && nextAvailableAge <= maxPossibleAge && (
              <div className="text-sm text-center text-green-800 bg-green-100/60 p-3 rounded-lg border border-green-200/80 mt-4">
                <p className="font-semibold">ถึงช่วงที่ลดทุนประกันได้ต่ำที่สุดแล้ว</p>
                <p className="text-xs">(ที่อายุ 66 ปีหรือมากกว่า)</p>
              </div>
            )}
            {nextAvailableAge > maxPossibleAge && (
              <div className="text-sm text-center text-zinc-500 mt-4">
                <p>คุณได้วางแผนลดทุนจนถึงอายุสูงสุดแล้ว</p>
              </div>
            )}
          </div>

          {/* --- คอลัมน์ขวา: ประวัติ --- */}
          <div className="py-6 space-y-4 lg:border-l lg:pl-8">
            <h3 className="font-semibold text-lg text-slate-800">แผนการปรับเปลี่ยนทุนประกัน</h3>
            {reductions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-slate-400 h-full">
                <ClipboardList className="h-24 w-24 text-slate-300" />
                <p className="mt-4 font-medium text-slate-500">แผนของคุณยังว่างอยู่</p>
                <p className="text-sm">เริ่มต้นโดยการเพิ่มขั้นตอนทางด้านซ้าย</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reductions.map(record => (
                  <ReductionStepItem
                    key={record.id || record.age}
                    record={record}
                    onDelete={() => setItemToDeleteId(record.id ?? null)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="p-6 bg-slate-100 border-t">
          <Button type="button" variant="ghost" onClick={closeReduceModal}>ยกเลิก</Button>
          <Button type="button" onClick={handleSaveAndClose} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <ShieldCheck className="mr-2 h-4 w-4"/>
            ยืนยันและบันทึกแผน
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบขั้นตอนการลดทุนนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
            ยืนยันการลบ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
);
}