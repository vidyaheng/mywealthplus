// src/components/modals/ReduceSumInsuredModal.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { SumInsuredReductionRecord } from '@/lib/calculations';

// --- UI Component Imports ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

// --- Sub-component: ปรับดีไซน์ให้เหมือนกับ Modal อื่นๆ ---
function ReductionStepItem({ record, endAge, onDelete }: { 
  record: SumInsuredReductionRecord; 
  endAge: number;
  onDelete: (id: string | undefined) => void; 
}) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-zinc-50 border rounded-lg hover:bg-zinc-100 transition-colors">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-medium text-xs text-zinc-800">
            ช่วงอายุ <span className="text-indigo-600">{record.age} - {endAge}</span> ปี
          </p>
          <p className="text-[11px] text-zinc-500">
            ทุนประกันใหม่: <span className="font-semibold">{record.newSumInsured.toLocaleString()}</span> บาท
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
  // --- Store, State, Memos, Effects, Handlers (ไม่มีการเปลี่ยนแปลง) ---
  const { isReduceModalOpen, closeReduceModal, iWealthyRpp, iWealthyAge, iWealthySumInsuredReductions, setIWealthySumInsuredReductions, acknowledgeIWealthyReductionChanges, iWealthyReductionsNeedReview } = useAppStore();
  const maxPossibleAge = 98;
  const [reductions, setReductions] = useState<SumInsuredReductionRecord[]>([]);
  const [selectedAge, setSelectedAge] = useState<number>(iWealthyAge + 1);
  const [reductionAmount, setReductionAmount] = useState<number>(0);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const lastReducedAge = useMemo(() => reductions.length > 0 ? Math.max(...reductions.map(item => item.age)) : iWealthyAge, [reductions, iWealthyAge]);
  const availableAges = useMemo(() => { const firstPossibleAge = lastReducedAge + 1; if (firstPossibleAge > maxPossibleAge) return []; return Array.from({ length: maxPossibleAge - firstPossibleAge + 1 }, (_, i) => firstPossibleAge + i); }, [lastReducedAge, maxPossibleAge]);
  const { min: minAmount, max: maxAmount } = useMemo(() => { const multipliers = getReductionMultipliers(selectedAge); return { min: Math.round(iWealthyRpp * multipliers.min), max: Math.round(iWealthyRpp * multipliers.max), }; }, [selectedAge, iWealthyRpp]);
  useEffect(() => { if (isReduceModalOpen) { const sortedReductions = [...iWealthySumInsuredReductions].sort((a, b) => a.age - b.age); setReductions(sortedReductions); const nextAvailableAge = (sortedReductions.length > 0 ? Math.max(...sortedReductions.map(r => r.age)) : iWealthyAge) + 1; const initialAge = Math.min(nextAvailableAge, maxPossibleAge); setSelectedAge(initialAge); } }, [isReduceModalOpen, iWealthySumInsuredReductions, iWealthyAge]);
  useEffect(() => { const newMultipliers = getReductionMultipliers(selectedAge); const newMinAmount = Math.round(iWealthyRpp * newMultipliers.min); setReductionAmount(newMinAmount); }, [selectedAge, iWealthyRpp]);
  const handleAgeChange = (ageStr: string) => setSelectedAge(Number(ageStr));
  const handleSliderChange = (value: number[]) => setReductionAmount(value[0]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const value = parseInt(e.target.value.replace(/,/g, ''), 10) || 0; setReductionAmount(value); };
  const handleInputBlur = () => { const clampedAmount = Math.max(minAmount, Math.min(maxAmount, reductionAmount)); setReductionAmount(clampedAmount); };
  const handleAddStep = useCallback(() => { const newStep: SumInsuredReductionRecord = { id: uuidv4(), age: selectedAge, newSumInsured: reductionAmount }; const newReductions = [...reductions, newStep].sort((a, b) => a.age - b.age); setReductions(newReductions); const nextAge = selectedAge + 1; if (nextAge <= maxPossibleAge) { setSelectedAge(nextAge); } }, [selectedAge, reductionAmount, reductions, maxPossibleAge]);
  const confirmDelete = useCallback(() => { if (!itemToDeleteId) return; const newReductions = reductions.filter(r => r.id !== itemToDeleteId); setReductions(newReductions); setItemToDeleteId(null); }, [itemToDeleteId, reductions]);
  const handleSaveAndClose = () => { setIWealthySumInsuredReductions(reductions); if(iWealthyReductionsNeedReview) { acknowledgeIWealthyReductionChanges(); } closeReduceModal(); };
  const canAddStep = availableAges.length > 0;
  
  return (
    <>
      <Dialog open={isReduceModalOpen} onOpenChange={(open) => !open && closeReduceModal()}>
        {/* --- ปรับ Layout หลักให้เหมือนกัน --- */}
        <DialogContent className="sm:max-w-3xl grid grid-rows-[auto,1fr,auto] max-h-[90vh] rounded-2xl overflow-hidden border-2 border-slate-200">
          
          <DialogHeader className="p-4 bg-slate-50 border-b">
            <DialogTitle className="flex items-center text-base font-bold text-slate-800">
              <History className="mr-2 h-5 w-5 text-teal-500" />
              วางแผนปรับเปลี่ยนทุนประกัน
            </DialogTitle>
            {iWealthyReductionsNeedReview && (
              <div className="!mt-3 flex items-start gap-2.5 p-3 text-amber-900 bg-amber-100/60 rounded-lg border border-amber-200/80">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <p className="text-xs">การปรับทุนประกันบางรายการอาจถูกปรับค่าอัตโนมัติเนื่องจากการเปลี่ยนแปลงเบี้ยประกัน กรุณาตรวจสอบและยืนยันอีกครั้ง</p>
              </div>
            )}
          </DialogHeader>

          <div className="overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-x-6 bg-slate-100/50">
            {/* --- คอลัมน์ซ้าย: ฟอร์ม (ปรับให้กระชับ) --- */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-teal-600"/>ปรับเปลี่ยนทุนประกัน</h3>
              <div className="p-4 bg-white border rounded-xl space-y-3 shadow-md shadow-slate-200/50">
                <div className="space-y-1.5">
                  <Label htmlFor="age-select" className="text-xs font-normal text-slate-600">1. เลือกอายุที่ต้องการ</Label>
                  <Select onValueChange={handleAgeChange} value={selectedAge.toString()} disabled={!canAddStep}>
                    <SelectTrigger id="age-select" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableAges.map(age => (
                        <SelectItem key={age} value={age.toString()} className="text-xs">
                          อายุ {age} ปี (ปีที่ {age - iWealthyAge + 1})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-slate-600">2. กำหนดทุนประกันใหม่</Label>
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <Input type="text" value={reductionAmount.toLocaleString()} onChange={handleInputChange} onBlur={handleInputBlur}
                        className="text-xl font-bold text-teal-600 border-0 shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent tracking-tight" />
                      <span className="text-xs text-slate-500 font-medium self-end pb-0.5">บาท</span>
                    </div>
                    <Slider value={[reductionAmount]} onValueChange={handleSliderChange} min={minAmount} max={maxAmount} step={1000} disabled={!canAddStep} className="mt-3" />
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                      <span>ต่ำสุด: {minAmount.toLocaleString()}</span>
                      <span>สูงสุด: {maxAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAddStep} disabled={!canAddStep} className="w-full h-10 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold">ปรับเปลี่ยนทุนประกัน</Button>
              </div>
            </div>

            {/* --- คอลัมน์ขวา: รายการ --- */}
            <div className="space-y-2 lg:border-l lg:pl-6">
              <h3 className="font-semibold text-sm text-slate-800">แผนการปรับเปลี่ยนทุนประกัน</h3>
              {reductions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-slate-400 h-full pt-8">
                  <ClipboardList className="h-14 w-14 text-slate-300" />
                  <p className="mt-2 font-medium text-xs text-slate-500">แผนของคุณยังว่างอยู่</p>
                  <p className="text-xs">เพิ่มรายการทางด้านซ้าย</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reductions.map((record, index, allReductions) => {
                    const nextReduction = allReductions[index + 1];
                    const endAge = nextReduction ? nextReduction.age - 1 : maxPossibleAge;
                    return (
                      <ReductionStepItem key={record.id || record.age} record={record} endAge={endAge} onDelete={() => setItemToDeleteId(record.id ?? null)} />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-4 bg-slate-100 border-t">
            <Button type="button" variant="ghost" className="text-sm" onClick={closeReduceModal}>ยกเลิก</Button>
            <Button type="button" onClick={handleSaveAndClose} className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <ShieldCheck className="mr-2 h-4 w-4"/>ยืนยันและบันทึกแผน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">คุณต้องการลบขั้นตอนการลดทุนนี้ใช่หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="text-sm bg-red-600 hover:bg-red-700">ยืนยันการลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}