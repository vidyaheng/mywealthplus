// src/components/modals/ChangeFrequencyModal.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { FrequencyChangeRecord } from '@/lib/calculations';

// --- UI Component Imports (ปรับปรุงใหม่) ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash2, Calendar, CalendarClock, CalendarDays, CalendarRange } from 'lucide-react';

// --- Type และ Options ---
type PaymentFrequencyOption = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
const frequencyOptions: { value: PaymentFrequencyOption; label: string; icon: React.ElementType }[] = [
  { value: 'monthly', label: 'รายเดือน', icon: Calendar },
  { value: 'quarterly', label: 'ราย 3 เดือน', icon: CalendarDays },
  { value: 'semi-annual', label: 'ราย 6 เดือน', icon: CalendarClock },
  { value: 'annual', label: 'รายปี', icon: CalendarRange },
];

// --- Sub-component สำหรับแสดงรายการใน Timeline ---
function FrequencyChangeItem({ record, onDelete }: { record: FrequencyChangeRecord; onDelete: (id: string | undefined) => void; }) {
  const option = frequencyOptions.find(opt => opt.value === record.frequency);
  const Icon = option?.icon || Calendar;

  return (
    <div className="flex items-center gap-4 p-3 bg-white border rounded-xl shadow-sm hover:border-violet-300 transition-colors">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-violet-100 text-violet-600">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-grow">
        <p className="font-bold text-lg text-slate-800">{option?.label || record.frequency}</p>
        <p className="text-sm text-slate-600">ช่วงอายุ {record.startAge} - {record.endAge} ปี</p>
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
  // --- Store State ---
  const {
    isChangeFreqModalOpen,
    closeChangeFreqModal,
    iWealthyFrequencyChanges,
    iWealthyAge,
    setIWealthyFrequencyChanges,
  } = useAppStore();
  
  const maxPossibleAge = 98;

  // --- Local State ---
  const [plannedChanges, setPlannedChanges] = useState<FrequencyChangeRecord[]>([]);
  const [newFrequency, setNewFrequency] = useState<PaymentFrequencyOption>('monthly');
  const [startAge, setStartAge] = useState<number>(iWealthyAge + 1);
  const [endAge, setEndAge] = useState<number>(maxPossibleAge);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  
  // --- Derived State & Memos ---
  const lastEndAge = useMemo(() => 
    plannedChanges.length > 0 ? Math.max(...plannedChanges.map(item => item.endAge)) : iWealthyAge,
    [plannedChanges, iWealthyAge]
  );
  
  const availableStartAges = useMemo(() => {
    const firstPossibleAge = lastEndAge + 1;
    if (firstPossibleAge > maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - firstPossibleAge + 1 }, (_, i) => firstPossibleAge + i);
  }, [lastEndAge, maxPossibleAge]);
  
  const availableEndAges = useMemo(() => {
    if (startAge > maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - startAge + 1 }, (_, i) => startAge + i);
  }, [startAge, maxPossibleAge]);

  const canAdd = availableStartAges.length > 0;

  // --- Effects ---
  useEffect(() => {
    if (isChangeFreqModalOpen) {
      const sortedPlan = [...iWealthyFrequencyChanges].sort((a, b) => a.startAge - b.startAge);
      setPlannedChanges(sortedPlan);
      
      const nextStartAge = (sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) : iWealthyAge) + 1;
      setStartAge(Math.min(nextStartAge, maxPossibleAge));
      setEndAge(maxPossibleAge);
      setNewFrequency('monthly');
    }
  }, [isChangeFreqModalOpen, iWealthyFrequencyChanges, iWealthyAge]);

  // --- Handlers ---
  const handleAddChange = useCallback(() => {
    if (!canAdd || startAge >= endAge) {
      alert("กรุณาตรวจสอบช่วงอายุให้ถูกต้อง");
      return;
    }
    const newRecord: FrequencyChangeRecord = {
      id: uuidv4(),
      startAge,
      endAge,
      frequency: newFrequency,
      type: 'age',
    };
    const newList = [...plannedChanges, newRecord].sort((a,b) => a.startAge - b.startAge);
    setPlannedChanges(newList);
    
    const nextStart = endAge + 1;
    if(nextStart <= maxPossibleAge) {
      setStartAge(nextStart);
      setEndAge(maxPossibleAge);
    }

  }, [newFrequency, startAge, endAge, canAdd, plannedChanges]);

  const confirmDelete = useCallback(() => {
    if (!itemToDeleteId) return;
    setPlannedChanges(prev => prev.filter(p => p.id !== itemToDeleteId));
    setItemToDeleteId(null);
  }, [itemToDeleteId]);

  const handleSaveAndClose = () => {
    setIWealthyFrequencyChanges(plannedChanges);
    closeChangeFreqModal();
  };

  const ageToPolicyYear = (age: number) => Math.max(1, age - iWealthyAge + 1);

  return (
    <>
      <Dialog open={isChangeFreqModalOpen} onOpenChange={(open) => !open && closeChangeFreqModal()}>
        <DialogContent className="sm:max-w-4xl grid grid-rows-[auto,1fr,auto] p-0 max-h-[90vh] rounded-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <CalendarClock className="mr-3 h-8 w-8 text-violet-600" />
              เปลี่ยนงวดการชำระเบี้ย
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              วางแผนปรับเปลี่ยนงวดการชำระเบี้ยประกันของคุณสำหรับช่วงอายุต่างๆ ได้ล่วงหน้า
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-x-2 bg-slate-100/60">
            {/* --- คอลัมน์ซ้าย: ฟอร์ม --- */}
            <div className="px-4 py-6 space-y-6 ml-2">
              <h3 className="font-semibold text-lg text-slate-800">สร้างรายการเปลี่ยนแปลงใหม่</h3>
              <div className="p-4 bg-white rounded-xl space-y-5 shadow-sm">
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-700">1. เลือกงวดที่ต้องการ</Label>
                  <ToggleGroup type="single" value={newFrequency} onValueChange={(value) => {if (value) setNewFrequency(value as PaymentFrequencyOption)}} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {frequencyOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                      <ToggleGroupItem key={opt.value} value={opt.value} aria-label={opt.label} className="flex flex-col h-20 gap-1 data-[state=on]:bg-violet-500 data-[state=on]:text-white">
                        <Icon className="h-6 w-6" />
                        <span>{opt.label}</span>
                      </ToggleGroupItem>
                    )})}
                  </ToggleGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-700">2. กำหนดช่วงเวลา</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="start-age" className="text-sm">อายุเริ่มต้น</Label>
                      <Select value={startAge.toString()} onValueChange={v => setStartAge(Number(v))} disabled={!canAdd}>
                        <SelectTrigger id="start-age" className="h-11">
                          <SelectValue>อายุ {startAge} (ปีที่ {ageToPolicyYear(startAge)})</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableStartAges.map(age => (
                            <SelectItem key={age} value={age.toString()}>
                              อายุ {age} (ปีที่ {ageToPolicyYear(age)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="flex-1 space-y-1">
                      <Label htmlFor="end-age" className="text-sm">อายุสิ้นสุด</Label>
                      <Select value={endAge.toString()} onValueChange={v => setEndAge(Number(v))} disabled={!canAdd}>
                        <SelectTrigger id="end-age" className="h-11">
                          <SelectValue>อายุ {endAge} (ปีที่ {ageToPolicyYear(endAge)})</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableEndAges.map(age => (
                            <SelectItem key={age} value={age.toString()}>
                              อายุ {age} (ปีที่ {ageToPolicyYear(age)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button onClick={handleAddChange} disabled={!canAdd} className="w-full bg-violet-600 hover:bg-violet-700 text-base py-5 font-semibold">เพิ่มลงในแผน</Button>
              </div>
            </div>

            {/* --- คอลัมน์ขวา: ไทม์ไลน์ --- */}
            <div className="px-6 py-6 space-y-4 lg:border-l lg:bg-white/70">
              <h3 className="font-semibold text-lg text-slate-800">ไทม์ไลน์แผนการชำระเบี้ย</h3>
              {plannedChanges.length === 0 ? (
                <div className="text-center text-slate-400 pt-16 h-full flex flex-col items-center justify-center">
                  <p className="font-medium text-slate-500">ยังไม่มีการเปลี่ยนแปลง</p>
                  <p className="text-sm">แผนการชำระเบี้ยของคุณยังเป็น "รายปี" ตลอดสัญญา</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plannedChanges.map(change => (
                    <FrequencyChangeItem
                      // ✨ 1. ถ้า id ไม่มี ให้ใช้ startAge เป็น key สำรอง
                      key={change.id || change.startAge}
                      record={change}
                      // ✨ 2. เรียกใช้ onDelete โดยตรงได้เลย
                      onDelete={() => setItemToDeleteId(change.id ?? null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-6 bg-slate-100 border-t">
            <Button type="button" variant="ghost" onClick={closeChangeFreqModal}>ยกเลิก</Button>
            <Button type="button" onClick={handleSaveAndClose} className="bg-violet-600 hover:bg-violet-700 text-white">บันทึกแผน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการลบรายการเปลี่ยนแปลงงวดนี้ใช่หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">ยืนยันการลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}