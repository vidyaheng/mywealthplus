// src/components/modals/PausePremiumModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Store
import { useAppStore } from '@/stores/appStore';
import type { PausePeriodRecord } from '@/lib/calculations';

// UI Components
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Trash2, CalendarClock } from 'lucide-react';

// --- Helper Functions & Sub-components for better readability ---

// ✨ UX/UI Improvement: Helper function to reduce code repetition
const ageToPolicyYear = (age: number, entryAge: number) => Math.max(1, age - entryAge + 1);

// ✨ UX/UI Improvement: Sub-component for a cleaner list display
function PausePeriodItem({ record, onDelete }: { record: PausePeriodRecord, onDelete: (id: string) => void }) {
  
  // สร้างฟังก์ชัน Handle การคลิกขึ้นมาเพื่อเพิ่มเงื่อนไข
  const handleDelete = () => {
    // 1. ตรวจสอบก่อนว่า record.id มีค่าหรือไม่
    if (record.id) {
      // 2. ถ้ามีค่า ถึงจะเรียก onDelete
      onDelete(record.id);
    }
    // ถ้าไม่มีค่า ก็ไม่ต้องทำอะไรเลย
  };

  return (
    <div className="grid grid-cols-[1fr,auto] gap-3 items-center text-sm px-3 py-2 border rounded-lg bg-slate-50">
      <span className='text-slate-700 text-left'>
        พักชำระช่วงอายุ {record.startAge} - {record.endAge} ปี
      </span>
      {/* 3. เพิ่ม disabled ให้ปุ่ม ถ้า record.id ไม่มีค่า ปุ่มจะถูกปิดการใช้งาน */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" 
        onClick={handleDelete}
        disabled={!record.id} 
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function PausePremiumModal() {
  const {
    isPauseModalOpen,
    closePauseModal,
    iWealthyPausePeriods,
    iWealthyAge,
    setIWealthyPausePeriods,
  } = useAppStore();

  const maxPossibleAge = 98;

  // --- Local State ---
  const [plannedPauses, setPlannedPauses] = useState<PausePeriodRecord[]>([]);
  const [itemToDelete, setItemToDelete] = useState<PausePeriodRecord | null>(null);

  // State for the "add new" form
  const [startAge, setStartAge] = useState<number>(iWealthyAge + 1);
  const [endAge, setEndAge] = useState<number>(maxPossibleAge);
  
  // --- Derived State & Memos ---

  // Find the next available age to start a new pause period
  const nextAvailableStartAge = useMemo(() => {
    if (plannedPauses.length === 0) return iWealthyAge + 1;
    const lastEndAge = Math.max(...plannedPauses.map(p => p.endAge));
    return lastEndAge + 1;
  }, [plannedPauses, iWealthyAge]);

  const canAddNewPeriod = useMemo(() => nextAvailableStartAge < maxPossibleAge, [nextAvailableStartAge, maxPossibleAge]);
  const isFormValid = useMemo(() => startAge < endAge, [startAge, endAge]);

  // Options for dropdowns
  const startOptions = useMemo(() => {
    if (!canAddNewPeriod) return [];
    return Array.from({ length: maxPossibleAge - nextAvailableStartAge }, (_, i) => nextAvailableStartAge + i);
  }, [canAddNewPeriod, nextAvailableStartAge, maxPossibleAge]);

  const endOptions = useMemo(() => {
    if (!canAddNewPeriod) return [];
    const firstPossibleEnd = startAge + 1;
    return Array.from({ length: maxPossibleAge - firstPossibleEnd + 1 }, (_, i) => firstPossibleEnd + i);
  }, [canAddNewPeriod, startAge, maxPossibleAge]);

  // --- Effects ---

  // Sync state from store and reset form when modal opens
  useEffect(() => {
    if (isPauseModalOpen) {
      // Sort once from the store
      const sortedPlan = [...iWealthyPausePeriods].sort((a, b) => a.startAge - b.startAge);
      setPlannedPauses(sortedPlan);

      // Calculate the next available start age based on the newly synced data
      const nextStart = sortedPlan.length > 0
        ? Math.max(...sortedPlan.map(p => p.endAge)) + 1
        : iWealthyAge + 1;

      // Reset the form to default values
      setStartAge(Math.min(nextStart, maxPossibleAge));
      setEndAge(maxPossibleAge);
    }
  }, [isPauseModalOpen, iWealthyPausePeriods, iWealthyAge, maxPossibleAge]);


  // --- Handlers ---
  const handleStartAgeChange = (value: string) => {
    const newStartAge = parseInt(value, 10);
    setStartAge(newStartAge);
    // Auto-adjust end age if it becomes invalid
    if (endAge <= newStartAge) {
      setEndAge(Math.min(newStartAge + 1, maxPossibleAge));
    }
  };

  const handleEndAgeChange = (value: string) => {
    setEndAge(parseInt(value, 10));
  };
  
  const handleAddPeriod = useCallback(() => {
    if (!isFormValid) return;
    const newPause: PausePeriodRecord = { id: uuidv4(), startAge, endAge, type: 'age' };
    const updatedPauses = [...plannedPauses, newPause].sort((a, b) => a.startAge - b.startAge);
    setPlannedPauses(updatedPauses);
    
    // Reset form for the next entry
    const nextStart = endAge + 1;
    setStartAge(Math.min(nextStart, maxPossibleAge));
    setEndAge(maxPossibleAge);
  }, [startAge, endAge, plannedPauses, isFormValid, maxPossibleAge]);

  // ✨ UX/UI Improvement: Use AlertDialog for safer deletion
  const handleDeleteClick = (id: string | undefined) => {
    // เพิ่มบรรทัดนี้: ถ้าไม่มี id ก็ไม่ต้องทำอะไรต่อ
    if (!id) return; 

    const item = plannedPauses.find(p => p.id === id);
    if (item) {
      setItemToDelete(item);
    }
  };
  
  const confirmDelete = useCallback(() => {
    if (!itemToDelete) return;
    const updatedPauses = plannedPauses.filter(p => p.id !== itemToDelete.id);
    setPlannedPauses(updatedPauses);
    
    // Recalculate and set the next available start age after deletion
    const nextStart = updatedPauses.length > 0
      ? Math.max(...updatedPauses.map(p => p.endAge)) + 1
      : iWealthyAge + 1;
    setStartAge(Math.min(nextStart, maxPossibleAge));
    setEndAge(maxPossibleAge);
    
    setItemToDelete(null); // Close the dialog
  }, [itemToDelete, plannedPauses, iWealthyAge, maxPossibleAge]);

  const handleSavePlan = () => {
    setIWealthyPausePeriods(plannedPauses);
    closePauseModal();
  };

  return (
    <>
      <Dialog open={isPauseModalOpen} onOpenChange={(open) => !open && closePauseModal()}>
        {/* ✨ 1. เพิ่มเงาและปรับปรุง Layout เล็กน้อย */}
        <DialogContent className="sm:max-w-xl grid grid-rows-[auto,1fr,auto] p-0 max-h-[90vh] drop-shadow-2xl">
          
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center text-xl text-slate-800">
              {/* ✨ 2. ปรับสีไอคอนเป็น Indigo */}
              <CalendarClock size={20} className="mr-3 text-indigo-600"/>
              วางแผนหยุดพักชำระเบี้ย
            </DialogTitle>
            {/*<DialogDescription className="text-zinc-600">
              กำหนดช่วงเวลาที่คุณต้องการหยุดพักการชำระเบี้ย โดยการหยุดพักจะส่งผลต่อเงินปันผลในปีนั้นๆ
            </DialogDescription>*/}
          </DialogHeader>
          
          <div className="overflow-y-auto px-6 space-y-6 border-t">
            {/* --- Section for Adding New Period --- */}
            <div className="space-y-4 pt-5">
              {/* ✨ 3. ปรับสีพื้นหลังและเส้นขอบของกล่องเพิ่มรายการ */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] items-end gap-3 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="start-age" className="text-slate-700 font-medium">ตั้งแต่ อายุ (ปีที่)</Label>
                  <Select onValueChange={handleStartAgeChange} value={startAge.toString()} disabled={!canAddNewPeriod}>
                    <SelectTrigger id="start-age" className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {startOptions.map(age => (
                        <SelectItem key={age} value={age.toString()}>
                          {age} (ปีที่ {ageToPolicyYear(age, iWealthyAge)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="end-age" className="text-slate-700 font-medium">ถึง อายุ (ปีที่)</Label>
                  <Select onValueChange={handleEndAgeChange} value={endAge.toString()} disabled={!canAddNewPeriod}>
                    <SelectTrigger id="end-age" className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {endOptions.map(age => (
                        <SelectItem key={age} value={age.toString()}>
                          {age} (ปีที่ {ageToPolicyYear(age, iWealthyAge)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* ✨ 4. ปรับสีปุ่ม 'เพิ่ม' เป็น Indigo */}
                <Button size="sm" onClick={handleAddPeriod} disabled={!canAddNewPeriod || !isFormValid} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus size={16} className="mr-1"/>เพิ่ม
                </Button>
              </div>
              
              {!canAddNewPeriod && (
                <p className="text-sm text-center text-indigo-700 font-medium">คุณได้วางแผนพักชำระเบี้ยเต็มช่วงเวลาสูงสุดแล้ว</p>
              )}

              {/* ✨ 5. ปรับสีกล่องแจ้งเตือนเป็นสีเหลืองอำพัน (Amber) */}
              <div className="space-y-2 text-sm text-amber-800 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
                <div className="flex items-start"><AlertCircle size={16} className="mr-2 mt-0.5 text-amber-500 shrink-0"/><span>สามารถหยุดพักชำระเบี้ยได้ถึงอายุ {maxPossibleAge} ปี</span></div>
                <div className="flex items-start"><AlertCircle size={16} className="mr-2 mt-0.5 text-amber-500 shrink-0"/><span>การหยุดพักชำระเบี้ยจะส่งผลให้ไม่ได้รับเงินปันผล (Bonus) ในปีนั้นๆ</span></div>
              </div>
            </div>
            
            {/* --- Section for Displaying Planned Periods --- */}
            <div className="pt-2 pb-4">
              <div className='flex justify-between items-center mb-3'>
                <h3 className="font-medium text-md text-slate-700">รายการที่วางแผนไว้</h3>
                <span className='text-xs text-slate-500'>ทั้งหมด {plannedPauses.length} รายการ</span>
              </div>
              {plannedPauses.length === 0 ? (
                <p className="text-sm text-zinc-500 italic text-center py-6 border-2 border-dashed rounded-lg">ยังไม่มีรายการ</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {plannedPauses.map((record) => (
                    <PausePeriodItem key={record.id || record.startAge} record={record} onDelete={() => handleDeleteClick(record.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                ยกเลิก
              </Button>
            </DialogClose>
            {/* ✨ 6. ปรับสีปุ่มหลัก 'บันทึกแผน' เป็น Indigo */}
            <Button type="button" size="sm" onClick={handleSavePlan} className="bg-indigo-600 hover:bg-indigo-700">
              บันทึกแผน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรายการ?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบช่วงเวลาพักชำระเบี้ยอายุ {itemToDelete?.startAge} - {itemToDelete?.endAge} ปี ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            {/* ✨ 7. ทำให้ปุ่มยืนยันการลบเป็นสีแดง (Destructive) */}
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}