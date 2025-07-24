// src/components/modals/ChangeFrequencyModal.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { FrequencyChangeRecord } from '@/lib/calculations';

// --- UI Component Imports ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash2, Calendar, CalendarClock, CalendarDays, CalendarRange, PlusCircle, ClipboardList } from 'lucide-react';

// --- Type และ Options ---
type PaymentFrequencyOption = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
const frequencyOptions: { value: PaymentFrequencyOption; label: string; icon: React.ElementType }[] = [
  { value: 'monthly', label: 'รายเดือน', icon: Calendar },
  { value: 'quarterly', label: 'ราย 3 เดือน', icon: CalendarDays },
  { value: 'semi-annual', label: 'ราย 6 เดือน', icon: CalendarClock },
  { value: 'annual', label: 'รายปี', icon: CalendarRange },
];

// --- Sub-component: ปรับดีไซน์ให้เหมือนกับ Modal อื่นๆ ---
function FrequencyChangeItem({ record, onDelete }: { record: FrequencyChangeRecord; onDelete: (id: string | undefined) => void; }) {
  const option = frequencyOptions.find(opt => opt.value === record.frequency);
  const Icon = option?.icon || Calendar;

  return (
    <div className="flex items-center justify-between p-2.5 bg-zinc-50 border rounded-lg hover:bg-zinc-100 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-violet-500" />
        <div>
          <p className="font-medium text-xs text-zinc-800">
            ชำระแบบ <span className="text-violet-600">{option?.label || record.frequency}</span>
          </p>
          <p className="text-[11px] text-zinc-500">
            ช่วงอายุ {record.startAge} - {record.endAge} ปี
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

export default function ChangeFrequencyModal() {
  // --- Store State & Local State (ไม่มีการเปลี่ยนแปลง) ---
  const { isChangeFreqModalOpen, closeChangeFreqModal, iWealthyFrequencyChanges, iWealthyAge, setIWealthyFrequencyChanges } = useAppStore();
  const maxPossibleAge = 98;
  const [plannedChanges, setPlannedChanges] = useState<FrequencyChangeRecord[]>([]);
  const [newFrequency, setNewFrequency] = useState<PaymentFrequencyOption>('annual');
  const [startAge, setStartAge] = useState<number>(iWealthyAge + 1);
  const [endAge, setEndAge] = useState<number>(maxPossibleAge);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // --- Logic (Memos, Effects, Handlers) - ไม่มีการเปลี่ยนแปลงในส่วน Logic ---
  const lastEndAge = useMemo(() => plannedChanges.length > 0 ? Math.max(...plannedChanges.map(item => item.endAge)) : iWealthyAge, [plannedChanges, iWealthyAge]);
  const availableStartAges = useMemo(() => { const firstPossibleAge = lastEndAge + 1; if (firstPossibleAge > maxPossibleAge) return []; return Array.from({ length: maxPossibleAge - firstPossibleAge + 1 }, (_, i) => firstPossibleAge + i); }, [lastEndAge, maxPossibleAge]);
  const availableEndAges = useMemo(() => { if (startAge > maxPossibleAge) return []; return Array.from({ length: maxPossibleAge - startAge + 1 }, (_, i) => startAge + i); }, [startAge, maxPossibleAge]);
  const canAdd = availableStartAges.length > 0;

  useEffect(() => {
    if (isChangeFreqModalOpen) {
      const sortedPlan = [...iWealthyFrequencyChanges].sort((a, b) => a.startAge - b.startAge);
      setPlannedChanges(sortedPlan);
      const nextStartAge = (sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) : iWealthyAge) + 1;
      setStartAge(Math.min(nextStartAge, maxPossibleAge));
      setEndAge(maxPossibleAge);
      setNewFrequency('annual');
    }
  }, [isChangeFreqModalOpen, iWealthyFrequencyChanges, iWealthyAge]);

  const handleStartAgeChange = (v: string) => { const newStart = Number(v); setStartAge(newStart); if (endAge <= newStart) { setEndAge(maxPossibleAge); } };
  const handleAddChange = useCallback(() => {
    if (!canAdd || startAge >= endAge) return;
    const newRecord: FrequencyChangeRecord = { id: uuidv4(), startAge, endAge, frequency: newFrequency, type: 'age' };
    const newList = [...plannedChanges, newRecord].sort((a,b) => a.startAge - b.startAge);
    setPlannedChanges(newList);
    const nextStart = endAge + 1;
    if(nextStart <= maxPossibleAge) { setStartAge(nextStart); setEndAge(maxPossibleAge); }
  }, [newFrequency, startAge, endAge, canAdd, plannedChanges]);
  
  const confirmDelete = useCallback(() => { if (!itemToDeleteId) return; setPlannedChanges(prev => prev.filter(p => p.id !== itemToDeleteId)); setItemToDeleteId(null); }, [itemToDeleteId]);
  const handleSaveAndClose = () => { setIWealthyFrequencyChanges(plannedChanges); closeChangeFreqModal(); };
  const ageToPolicyYear = (age: number) => Math.max(1, age - iWealthyAge + 1);

  return (
    <>
      <Dialog open={isChangeFreqModalOpen} onOpenChange={(open) => !open && closeChangeFreqModal()}>
        {/* --- ปรับ Layout หลักให้เหมือนกัน --- */}
        <DialogContent className="sm:max-w-3xl grid grid-rows-[auto,1fr,auto] max-h-[90vh] rounded-2xl overflow-hidden border-2 border-slate-200">
          
          <DialogHeader className="p-4 bg-slate-50 border-b">
            <DialogTitle className="flex items-center text-base font-bold text-slate-800">
              <CalendarClock className="mr-2 h-5 w-5 text-violet-600" />
              เปลี่ยนงวดการชำระเบี้ย
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-x-6 bg-slate-100/50">
            
            {/* --- คอลัมน์ซ้าย: ฟอร์ม (ปรับให้กระชับ) --- */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-violet-600"/>สร้างรายการใหม่</h3>
              <div className="p-4 bg-white border rounded-xl space-y-3 shadow-md shadow-slate-200/50">
                
                {/* 1. เลือกงวด */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-slate-600">1. เลือกงวดที่ต้องการ</Label>
                  {/* ปรับขนาด ToggleGroup ให้เล็กกระทัดรัด */}
                  <ToggleGroup type="single" value={newFrequency} onValueChange={(value) => {if (value) setNewFrequency(value as PaymentFrequencyOption)}} className="grid grid-cols-4 gap-2">
                    {frequencyOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <ToggleGroupItem key={opt.value} value={opt.value} aria-label={opt.label} className="flex flex-col h-14 gap-1 data-[state=on]:bg-violet-500 data-[state=on]:text-white">
                          <Icon className="h-4 w-4" />
                          <span className="text-[11px]">{opt.label}</span>
                        </ToggleGroupItem>
                      )})}
                  </ToggleGroup>
                </div>
                
                {/* 2. กำหนดช่วงเวลา */}
                <div className="grid grid-cols-2 gap-x-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-age" className="text-xs font-normal text-slate-600">2. ตั้งแต่อายุ</Label>
                    <Select value={startAge.toString()} onValueChange={handleStartAgeChange} disabled={!canAdd}>
                      <SelectTrigger id="start-age" className="h-9 text-xs">
                        <SelectValue>{`อายุ ${startAge} (ปีที่ ${ageToPolicyYear(startAge)})`}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableStartAges.map(age => (
                          <SelectItem key={age} value={age.toString()} className="text-xs">
                            {`อายุ ${age} (ปีที่ ${ageToPolicyYear(age)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-1.5">
                    <Label htmlFor="end-age" className="text-xs font-normal text-slate-600">ถึงอายุ</Label>
                    <Select value={endAge.toString()} onValueChange={v => setEndAge(Number(v))} disabled={!canAdd}>
                      <SelectTrigger id="end-age" className="h-9 text-xs">
                         <SelectValue>{`อายุ ${endAge} (ปีที่ ${ageToPolicyYear(endAge)})`}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableEndAges.map(age => (
                          <SelectItem key={age} value={age.toString()} className="text-xs">
                            {`อายุ ${age} (ปีที่ ${ageToPolicyYear(age)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleAddChange} disabled={!canAdd} className="w-full h-10 text-sm bg-violet-600 hover:bg-violet-700 text-white font-semibold">เพิ่มลงในแผน</Button>
              </div>
            </div>
            
            {/* --- คอลัมน์ขวา: รายการ --- */}
            <div className="space-y-2 lg:border-l lg:pl-6">
              <h3 className="font-semibold text-sm text-slate-800">แผนการชำระเบี้ย</h3>
              {plannedChanges.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-slate-400 h-full pt-8">
                  <ClipboardList className="h-14 w-14 text-slate-300" />
                  <p className="mt-2 font-medium text-xs text-slate-500">ยังไม่มีการเปลี่ยนแปลง</p>
                  <p className="text-xs">แผนเริ่มต้นคือ "รายปี"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plannedChanges.map(change => (
                    <FrequencyChangeItem key={change.id || change.startAge} record={change} onDelete={() => setItemToDeleteId(change.id ?? null)} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-4 bg-slate-100 border-t">
            <Button type="button" variant="ghost" className="text-sm" onClick={closeChangeFreqModal}>ยกเลิก</Button>
            <Button type="button" onClick={handleSaveAndClose} className="text-sm bg-violet-600 hover:bg-violet-700 text-white font-semibold">บันทึกแผน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- AlertDialog (ปรับขนาด Font) --- */}
      <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">คุณต้องการลบรายการเปลี่ยนแปลงงวดนี้ใช่หรือไม่?</AlertDialogDescription>
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