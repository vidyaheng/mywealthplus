// src/components/modals/PausePremiumModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// +++ STEP 1: เปลี่ยนมา Import Store แทนการรับ Props +++
import { useAppStore } from '@/stores/appStore';
import type { PausePeriodRecord } from '@/lib/calculations';

// --- UI Component Imports (เหมือนเดิม) ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
//import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function PausePremiumModal() {
  // +++ STEP 2: ดึง State และ Actions ทั้งหมดมาจาก useAppStore (ถูกต้องแล้ว) +++
  const {
    isPauseModalOpen,
    closePauseModal,
    iWealthyPausePeriods,
    iWealthyAge,
    setIWealthyPausePeriods,
  } = useAppStore();
  
  const maxPossibleAge = 98;

  // --- State ภายใน Modal (Local State) (ถูกต้องแล้ว) ---
  const [refType, setRefType] = useState<'age' | 'year'>('age');
  const [startValue, setStartValue] = useState<number>(iWealthyAge + 1);
  const [endValue, setEndValue] = useState<number>(maxPossibleAge);
  const [plannedPauses, setPlannedPauses] = useState<PausePeriodRecord[]>([]);
  const [canAddNewPeriod, setCanAddNewPeriod] = useState(true);
  
  // +++ STEP 3: ปรับแก้ useEffect ให้ Sync ข้อมูลจาก Store (ถูกต้องแล้ว) +++
  useEffect(() => {
    if (isPauseModalOpen) {
      const sortedPlan = [...iWealthyPausePeriods].sort((a, b) => a.startAge - b.startAge);
      setPlannedPauses(sortedPlan);

      const lastEndAge = sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) : iWealthyAge;
      const defaultStartAge = Math.min(Math.max(lastEndAge + 1, iWealthyAge + 1), maxPossibleAge);
      
      setRefType('age');
      if (defaultStartAge >= maxPossibleAge) {
        setCanAddNewPeriod(false);
        setStartValue(maxPossibleAge);
        setEndValue(maxPossibleAge);
      } else {
        setCanAddNewPeriod(true);
        setStartValue(defaultStartAge);
        setEndValue(maxPossibleAge);
      }
    }
  }, [isPauseModalOpen, iWealthyPausePeriods, iWealthyAge]);

  const firstPossibleStartAge = useMemo(() => {
    const lastEndAge = plannedPauses.length > 0 ? Math.max(...plannedPauses.map(p => p.endAge)) : iWealthyAge;
    return Math.min(Math.max(lastEndAge + 1, iWealthyAge + 1), maxPossibleAge);
  }, [plannedPauses, iWealthyAge, maxPossibleAge]);
  
  const startOptions = useMemo(() => {
    if (!canAddNewPeriod || firstPossibleStartAge >= maxPossibleAge) return [];
    if (refType === 'age') {
      return Array.from({ length: maxPossibleAge - firstPossibleStartAge + 1 }, (_, i) => firstPossibleStartAge + i);
    } else { // 'year'
      const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
      const firstPossiblePolicyYear = Math.max(1, firstPossibleStartAge - iWealthyAge + 1);
      if (firstPossiblePolicyYear > maxPolicyYear) return [];
      return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
    }
  }, [firstPossibleStartAge, maxPossibleAge, iWealthyAge, refType, canAddNewPeriod]);

  const endOptions = useMemo(() => {
    if (!canAddNewPeriod) return [];
    const firstPossibleEnd = refType === 'age' ? startValue : iWealthyAge + startValue -1;
    if (firstPossibleEnd >= maxPossibleAge) return [];
    if (refType === 'age') {
      return Array.from({ length: maxPossibleAge - firstPossibleEnd + 1 }, (_, i) => firstPossibleEnd + i);
    } else { // 'year'
      const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
      const firstPossibleEndYear = Math.max(1, firstPossibleEnd - iWealthyAge + 2);
       if (firstPossibleEndYear > maxPolicyYear) return [];
      return Array.from({ length: maxPolicyYear - firstPossibleEndYear + 1 }, (_, i) => firstPossibleEndYear + i);
    }
  }, [startValue, maxPossibleAge, iWealthyAge, refType, canAddNewPeriod]);

  // +++ STEP 4: เติม Logic ใน Handlers ที่ย่อไว้ให้สมบูรณ์ +++
  const handleRefTypeChange = (value: string) => {
    const newRefType = value as 'age' | 'year';
    setRefType(newRefType);
    
    // Reset start/end value to defaults based on the new type
    const defaultStartAge = firstPossibleStartAge;
    const finalMaxAge = maxPossibleAge;

    if (newRefType === 'age') {
        setStartValue(defaultStartAge);
        setEndValue(finalMaxAge);
    } else { // 'year'
        const startYear = Math.max(1, defaultStartAge - iWealthyAge + 1);
        const endYear = Math.max(1, finalMaxAge - iWealthyAge + 1);
        setStartValue(startYear);
        setEndValue(endYear);
    }
  };

  const handleStartValueChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setStartValue(numValue);

    // If the current end value is now less than the new start value, reset the end value
    if (endValue < numValue) {
        setEndValue(numValue);
    }
  };

  const handleEndValueChange = (value: string) => setEndValue(parseInt(value, 10));

  const handleAddPeriod = useCallback(() => {
    const startAge = refType === 'age' ? startValue : iWealthyAge + startValue - 1;
    const endAge = refType === 'age' ? endValue : iWealthyAge + endValue - 1;

    if (startAge >= endAge) {
      alert("อายุเริ่มต้นต้องน้อยกว่าอายุสิ้นสุด");
      return;
    }
    const newPause: PausePeriodRecord = { id: uuidv4(), startAge, endAge, type: 'age' };
    setPlannedPauses(prev => [...prev, newPause].sort((a, b) => a.startAge - b.startAge));
    
    const nextStartAge = endAge + 1;
    if (nextStartAge >= maxPossibleAge) {
      setCanAddNewPeriod(false);
    } else {
        if (refType === 'age') {
            setStartValue(nextStartAge);
            setEndValue(maxPossibleAge);
        } else {
            setStartValue(nextStartAge - iWealthyAge + 1);
            setEndValue(maxPossibleAge - iWealthyAge + 1);
        }
    }
  }, [refType, startValue, endValue, iWealthyAge, maxPossibleAge]);

  const handleDeleteLastPeriod = useCallback(() => {
    if (window.confirm("คุณต้องการลบรายการล่าสุดใช่หรือไม่?")) {
        const newList = plannedPauses.slice(0, -1);
        setPlannedPauses(newList);
        
        const lastEndAge = newList.length > 0 ? Math.max(...newList.map(p => p.endAge)) : iWealthyAge;
        const nextStartAge = Math.max(lastEndAge + 1, iWealthyAge + 1);

        if (refType === 'age') {
            setStartValue(nextStartAge);
            setEndValue(maxPossibleAge);
        } else {
            setStartValue(nextStartAge - iWealthyAge + 1);
            setEndValue(maxPossibleAge - iWealthyAge + 1);
        }
        setCanAddNewPeriod(nextStartAge < maxPossibleAge);
    }
  }, [plannedPauses, iWealthyAge, refType]);

  const handleSavePlan = () => {
    setIWealthyPausePeriods(plannedPauses);
    closePauseModal();
  };
  
  const handleClose = () => {
    closePauseModal();
  };

  return (
    <Dialog open={isPauseModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-700 ml-4">หยุดพักชำระเบี้ย</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 pt-4">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <span className='text-sm text-gray-700 pb-1'>ตั้งแต่</span>
            <div className="flex flex-col space-y-1">
                <Select onValueChange={handleRefTypeChange} value={refType} disabled={!canAddNewPeriod}>
                    <SelectTrigger className="h-8 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                        <SelectItem value="year" className="text-xs">ปีที่</SelectItem> 
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col space-y-1">
                <Select onValueChange={handleStartValueChange} value={startValue.toString()} disabled={!canAddNewPeriod || startOptions.length === 0}>
                    <SelectTrigger className="h-8 text-xs w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{startOptions.map(opt => <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <span className='text-sm text-gray-700 pb-1'>ถึง</span>
            <div className="flex flex-col space-y-1">
                <Select onValueChange={handleEndValueChange} value={endValue.toString()} disabled={!canAddNewPeriod || endOptions.length === 0}>
                    <SelectTrigger className="h-8 text-xs w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{endOptions.map(opt => <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <span className="text-sm text-gray-700 pb-1">ปี</span>
            <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={handleAddPeriod} disabled={!canAddNewPeriod}>
                    <Plus size={16} className="mr-1"/>เพิ่มช่วงเวลา
                </Button>
            </div>
          </div>
          <div className="space-y-1 pt-2">
            <div className="flex items-center text-xs text-red-600"><AlertCircle size={14} className="mr-1"/>สามารถหยุดพักชำระเบี้ยได้ถึงอายุ {maxPossibleAge} ปี</div>
            <div className="flex items-center text-xs text-red-600"><AlertCircle size={14} className="mr-1"/>การหยุดพักชำระเบี้ยจะส่งผลให้ไม่ได้รับ Bonus ในปีนั้นๆ</div>
          </div>
        </div>
        
        <div className="border-t pt-3 mt-4">
          <div className='flex justify-between items-center mb-2'>
            <h3 className="font-medium text-md text-blue-800">รายการหยุดพักชำระเบี้ย</h3>
            <span className='text-xs text-gray-500'>รายการทั้งหมด {plannedPauses.length}</span>
          </div>
          {plannedPauses.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">ยังไม่มีรายการ</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {plannedPauses.map((record, index) => (
                <div key={record.id} className="grid grid-cols-[auto,1fr,auto] gap-2 items-center text-sm px-2 py-1 border rounded bg-gray-50">
                  <span className='font-mono text-gray-500'>{index + 1}.</span>
                  <span className='text-left text-gray-700'>พักชำระช่วงอายุ {record.startAge} - {record.endAge} ปี</span>
                  <div className="h-5 w-5 flex items-center justify-center">
                    {index === plannedPauses.length - 1 && (
                      <Button variant="ghost" size="icon" className="h-full w-full text-red-500 hover:text-red-700" onClick={handleDeleteLastPeriod}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>ยกเลิก</Button>
          </DialogClose>
          <Button type="button" size="sm" onClick={handleSavePlan} className='bg-blue-700 hover:bg-blue-500'>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}