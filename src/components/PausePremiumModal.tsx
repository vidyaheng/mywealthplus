// src/components/modals/PausePremiumModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Store & Types
import { useAppStore } from '@/stores/appStore';
import type { PausePeriodRecord } from '@/lib/calculations';

// UI Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// +++ เพิ่มไอคอน AlertTriangle สำหรับคำเตือน
import { CalendarClock, PlusCircle, Trash2, ClipboardList, AlertTriangle } from 'lucide-react';

// Helper function
const ageToPolicyYear = (age: number, entryAge: number) => Math.max(1, age - entryAge + 1);

// --- Sub-component: แสดงรายการพักชำระเบี้ย (ปรับขนาดตัวอักษร) ---
function PausePeriodItem({ record, onDelete }: { record: PausePeriodRecord, onDelete: (id: string | undefined) => void; }) {
  const iWealthyAge = useAppStore.getState().iWealthyAge;

  // ✅ กำหนดสีตาม isAutoAdjusted
  const ageColor = record.isAutoAdjusted ? 'text-orange-600' : 'text-indigo-600';

  // ✅ กำหนดข้อความบรรยายตาม isAutoAdjusted
  const descriptionText = record.isAutoAdjusted
    ? '(ถูกปรับตามอายุเริ่มต้นใหม่โดยอัตโนมัติ)'
    : `(ปีที่ ${ageToPolicyYear(record.startAge, iWealthyAge)} ถึง ${ageToPolicyYear(record.endAge, iWealthyAge)})`;

  return (
    <div className="flex items-center justify-between p-2.5 bg-zinc-50 border rounded-lg hover:bg-zinc-100 transition-colors">
      <div className="flex items-center gap-3">
        <CalendarClock className="w-5 h-5 text-indigo-500" />
        <div>
          <p className="font-medium text-sm text-zinc-800">
            พักชำระช่วงอายุ <span className={ageColor}>{record.startAge} - {record.endAge}</span> ปี
          </p>
          <p className="text-xs text-zinc-500">
            {descriptionText}
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

export default function PausePremiumModal() {
  const {
    isPauseModalOpen, closePauseModal, iWealthyPausePeriods, iWealthyAge, setIWealthyPausePeriods,
  } = useAppStore();

  const maxPossibleAge = 98;

  // --- Local State & Memos (ไม่มีการเปลี่ยนแปลง) ---
  const [plannedPauses, setPlannedPauses] = useState<PausePeriodRecord[]>([]);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [startAge, setStartAge] = useState<number>(iWealthyAge + 1);
  const [endAge, setEndAge] = useState<number>(maxPossibleAge);
  const nextAvailableStartAge = useMemo(() => plannedPauses.length === 0 ? iWealthyAge + 1 : Math.max(...plannedPauses.map(p => p.endAge)) + 1, [plannedPauses, iWealthyAge]);
  const canAddNewPeriod = useMemo(() => nextAvailableStartAge < maxPossibleAge, [nextAvailableStartAge, maxPossibleAge]);
  const isFormValid = useMemo(() => startAge < endAge, [startAge, endAge]);
  const startOptions = useMemo(() => canAddNewPeriod ? Array.from({ length: maxPossibleAge - nextAvailableStartAge }, (_, i) => nextAvailableStartAge + i) : [], [canAddNewPeriod, nextAvailableStartAge, maxPossibleAge]);
  const endOptions = useMemo(() => canAddNewPeriod ? Array.from({ length: maxPossibleAge - (startAge + 1) + 1 }, (_, i) => startAge + 1 + i) : [], [canAddNewPeriod, startAge, maxPossibleAge]);

  // --- Effects & Handlers (ไม่มีการเปลี่ยนแปลง) ---
  useEffect(() => {
    if (isPauseModalOpen) {

      console.log("[PausePremiumModal] 🔎 Modal ถูกเปิดขึ้น");
      console.log("[PausePremiumModal] ข้อมูลจาก Store (iWealthyPausePeriods):", iWealthyPausePeriods);

      const sortedPlan = [...iWealthyPausePeriods].sort((a, b) => a.startAge - b.startAge);
      setPlannedPauses(sortedPlan);

      console.log("[PausePremiumModal] ข้อมูลใน Local State (plannedPauses):", sortedPlan);

      const nextStart = sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) + 1 : iWealthyAge + 1;
      setStartAge(Math.min(nextStart, maxPossibleAge));
      setEndAge(maxPossibleAge);
    }
  }, [isPauseModalOpen, iWealthyPausePeriods, iWealthyAge, maxPossibleAge]);


  const handleStartAgeChange = (value: string) => {
    const newStartAge = parseInt(value, 10);
    setStartAge(newStartAge);
    if (endAge <= newStartAge) setEndAge(Math.min(newStartAge + 1, maxPossibleAge));
  };
  const handleEndAgeChange = (value: string) => setEndAge(parseInt(value, 10));
  const handleAddPeriod = useCallback(() => {
    if (!isFormValid) return;
    const newPause: PausePeriodRecord = { id: uuidv4(), startAge, endAge, type: 'age', isAutoAdjusted: false };
    const updatedPauses = [...plannedPauses, newPause].sort((a, b) => a.startAge - b.startAge);
    setPlannedPauses(updatedPauses);
    const nextStart = endAge + 1;
    setStartAge(Math.min(nextStart, maxPossibleAge));
    setEndAge(maxPossibleAge);
  }, [startAge, endAge, plannedPauses, isFormValid, maxPossibleAge]);
  const confirmDelete = useCallback(() => {
    if (!itemToDeleteId) return;
    const updatedPauses = plannedPauses.filter(p => p.id !== itemToDeleteId);
    setPlannedPauses(updatedPauses);
    const nextStart = updatedPauses.length > 0 ? Math.max(...updatedPauses.map(p => p.endAge)) + 1 : iWealthyAge + 1;
    setStartAge(Math.min(nextStart, maxPossibleAge));
    setEndAge(maxPossibleAge);
    setItemToDeleteId(null);
  }, [itemToDeleteId, plannedPauses, iWealthyAge, maxPossibleAge]);
  const handleSavePlan = () => {
    console.log("[PausePremiumModal] 💾 กำลังบันทึกแผน...");
    console.log("[PausePremiumModal] ข้อมูลที่จะถูกส่งไป Store:", plannedPauses);
    setIWealthyPausePeriods(plannedPauses);
    closePauseModal();
  };

  return (
    <>
      <Dialog open={isPauseModalOpen} onOpenChange={(open) => !open && closePauseModal()}>
        {/* +++ ปรับ max-w และลด p-0 ออก เพราะจะกำหนดในแต่ละส่วนเอง +++ */}
        <DialogContent className="sm:max-w-3xl grid grid-rows-[auto,1fr,auto] max-h-[90vh] rounded-2xl overflow-hidden border-2 border-slate-200">
          
          {/* +++ ลด Padding และขนาด Font +++ */}
          <DialogHeader className="p-4 bg-slate-50 border-b">
            <DialogTitle className="flex items-center text-lg font-bold text-slate-800">
              <CalendarClock className="mr-2 h-5 w-5 text-indigo-500" />
              วางแผนหยุดพักชำระเบี้ย
            </DialogTitle>
          </DialogHeader>

          {iWealthyPausePeriods.some(p => p.isAutoAdjusted) && (
            <div className="!mt-3 flex items-start gap-2.5 p-3 text-amber-900 bg-amber-100/60 rounded-lg border border-amber-200/80">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <p className="text-xs">
                แผนพักชำระเบี้ยถูกปรับอายุโดยอัตโนมัติเพื่อให้สอดคล้องกับอายุเริ่มต้นใหม่ กรุณาตรวจสอบและยืนยันอีกครั้ง
              </p>
            </div>
          )}

          {/* +++ ลด Padding และระยะห่างของ Grid +++ */}
          <div className="overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-x-6 bg-slate-100/50">
            {/* --- คอลัมน์ซ้าย: ฟอร์มเพิ่มรายการ --- */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-indigo-600"/>เพิ่มช่วงเวลา</h3>
              <div className="p-4 bg-white border rounded-xl space-y-4 shadow-md shadow-slate-200/50">
                {/* +++ ห่อหุ้ม Select ทั้งสองด้วย Grid +++ */}
                <div className="grid grid-cols-2 gap-x-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-age" className="text-sm font-normal text-slate-600">1. ตั้งแต่อายุ</Label>
                    <Select onValueChange={handleStartAgeChange} value={startAge.toString()} disabled={!canAddNewPeriod}>
                      <SelectTrigger id="start-age" className="h-10 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {startOptions.map(age => (
                          <SelectItem key={age} value={age.toString()} className="text-sm">
                            อายุ {age} ปี (ปีที่ {age - iWealthyAge + 1})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end-age" className="text-sm font-normal text-slate-600">2. ถึงอายุ</Label>
                    <Select onValueChange={handleEndAgeChange} value={endAge.toString()} disabled={!canAddNewPeriod}>
                      <SelectTrigger id="end-age" className="h-10 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {endOptions.map(age => (
                          <SelectItem key={age} value={age.toString()} className="text-sm">
                            อายุ {age} ปี (ปีที่ {age - iWealthyAge + 1})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddPeriod} disabled={!canAddNewPeriod || !isFormValid} className="w-full h-10 text-base bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  เพิ่มรายการ
                </Button>
              </div>

              {/* +++ เพิ่มส่วนของคำเตือน +++ */}
              <div className="!mt-4 flex items-start gap-2.5 p-3 text-amber-900 bg-amber-100/60 rounded-lg border border-amber-200/80">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <p className="text-xs">
                  <strong>คำเตือน:</strong> การหยุดพักชำระเบี้ยในปีใดๆ จะส่งผลให้ท่านไม่ได้รับเงิน Bonus สำหรับปีนั้น
                </p>
              </div>
            </div>

            {/* --- คอลัมน์ขวา: รายการที่วางแผนไว้ --- */}
            <div className="space-y-3 lg:border-l lg:pl-6">
              <h3 className="font-semibold text-base text-slate-800">แผนการพักชำระเบี้ย</h3>
              {plannedPauses.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-slate-400 h-full pt-8">
                  <ClipboardList className="h-16 w-16 text-slate-300" />
                  <p className="mt-2 font-medium text-sm text-slate-500">แผนของคุณยังว่างอยู่</p>
                  <p className="text-xs">เพิ่มรายการทางด้านซ้าย</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plannedPauses.map(record => (
                    <PausePeriodItem key={record.id || record.startAge} record={record} onDelete={() => setItemToDeleteId(record.id ?? null)} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* +++ ลด Padding ของ Footer +++ */}
          <DialogFooter className="p-4 bg-slate-100 border-t">
            <Button type="button" variant="ghost" onClick={closePauseModal}>ยกเลิก</Button>
            <Button type="button" onClick={handleSavePlan} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
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
              คุณต้องการลบขั้นตอนการพักชำระเบี้ยนี้ใช่หรือไม่?
            </AlertDialogDescription>
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