// src/components/modals/WithdrawalPlanModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { WithdrawalPlanRecord } from '@/lib/calculations';

// --- UI Component Imports (ปรับปรุงใหม่) ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Trash2, Banknote, Repeat, TrendingUp, ClipboardList } from 'lucide-react';

// --- Type และ Options (ปรับปรุงใหม่) ---
type WithdrawalType = 'single' | 'annual';

// --- Sub-component สำหรับแสดงรายการใน Timeline ---
function WithdrawalItem({ record, onDelete }: { record: WithdrawalPlanRecord; onDelete: (id: string) => void; }) {
  const isSingle = record.type === 'single';
  return (
    <div className="flex items-start gap-4 p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${isSingle ? 'bg-sky-100 text-sky-600' : 'bg-green-100 text-green-600'}`}>
        {isSingle ? <TrendingUp className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
      </div>
      <div className="flex-grow">
        <p className="font-bold text-lg text-slate-800">{record.amount.toLocaleString()} บาท</p>
        <p className="text-sm text-slate-600">
          {isSingle ? `ถอนครั้งเดียวตอนอายุ ${record.startAge} ปี` : `ถอนทุกปี ตั้งแต่อายุ ${record.startAge} - ${record.endAge} ปี`}
        </p>
      </div>
      {record.id && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(record.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function WithdrawalPlanModal() {
  // --- Store State ---
  const {
    isWithdrawalModalOpen,
    closeWithdrawalModal,
    iWealthyWithdrawalPlan,
    iWealthyAge,
    setIWealthyWithdrawalPlan,
  } = useAppStore();

  const maxPossibleAge = 98;
  const minWithdrawalAge = iWealthyAge + 1;

  // --- Local State ---
  const [plannedWithdrawals, setPlannedWithdrawals] = useState<WithdrawalPlanRecord[]>([]);
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('annual');
  const [amount, setAmount] = useState('10000');
  const [startAge, setStartAge] = useState(minWithdrawalAge);
  const [endAge, setEndAge] = useState(maxPossibleAge);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  
  // --- Effects ---
  useEffect(() => {
    if (isWithdrawalModalOpen) {
      const sortedPlan = [...iWealthyWithdrawalPlan].sort((a, b) => a.startAge - b.startAge);
      setPlannedWithdrawals(sortedPlan);
      // Reset form to default state for a new entry
      const lastEndAge = sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) : 0;
      const nextStartAge = Math.max(minWithdrawalAge, lastEndAge + 1, iWealthyAge + 1);
      setStartAge(nextStartAge);
      setEndAge(maxPossibleAge);
      setAmount('10000');
      setWithdrawalType('annual');
    }
  }, [isWithdrawalModalOpen, iWealthyWithdrawalPlan, iWealthyAge]);

  // --- Derived State & Memos ---
  const startAgeOptions = useMemo(() => {
    const lastEndAge = plannedWithdrawals.length > 0 ? Math.max(...plannedWithdrawals.map(p => p.endAge)) : 0;
    const firstPossibleStartAge = Math.max(minWithdrawalAge, lastEndAge + 1, iWealthyAge + 1);
    if (firstPossibleStartAge > maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - firstPossibleStartAge + 1 }, (_, i) => firstPossibleStartAge + i);
  }, [plannedWithdrawals, iWealthyAge]);

  const endAgeOptions = useMemo(() => {
    if (startAge >= maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - startAge + 1 }, (_, i) => startAge + i);
  }, [startAge]);

  const canAdd = startAgeOptions.length > 0 && Number(amount) > 0;

  // --- Handlers ---
  const handleAddPlan = useCallback(() => {
  const numericAmount = parseInt(amount, 10) || 0;
  if (startAgeOptions.length === 0 || numericAmount <= 0) {
    alert("กรุณาตรวจสอบข้อมูล");
    return;
  }
  if (withdrawalType === 'annual' && startAge >= endAge) {
    alert("อายุเริ่มต้นต้องน้อยกว่าอายุสิ้นสุด");
    return;
  }
  
  const newPlan: WithdrawalPlanRecord = {
    id: uuidv4(),
    type: withdrawalType,
    amount: numericAmount,
    startAge,
    endAge: withdrawalType === 'single' ? startAge : endAge,
    refType: 'age',
  };

  const updatedPlan = [...plannedWithdrawals, newPlan].sort((a, b) => a.startAge - b.startAge);
  setPlannedWithdrawals(updatedPlan);

  // --- ✨ ส่วนที่เพิ่มเข้ามา: รีเซ็ตฟอร์มสำหรับรายการถัดไป ---
  const lastPlanEndAge = withdrawalType === 'single' ? startAge : endAge;
  const nextAvailableStartAge = Math.max(minWithdrawalAge, lastPlanEndAge + 1);

  if (nextAvailableStartAge <= maxPossibleAge) {
    setStartAge(nextAvailableStartAge);
    setEndAge(maxPossibleAge);
    setAmount('10000'); // รีเซ็ตเป็นค่าเริ่มต้น
    setWithdrawalType('annual'); // กลับไปที่ค่าเริ่มต้น
  }
  // -----------------------------------------------------------

}, [withdrawalType, amount, startAge, endAge, plannedWithdrawals, startAgeOptions]);
  
  const confirmDelete = useCallback(() => {
    if (!itemToDeleteId) return;
    setPlannedWithdrawals(prev => prev.filter(p => p.id !== itemToDeleteId));
    setItemToDeleteId(null);
  }, [itemToDeleteId]);
  
  const handleSaveAndClose = () => {
    setIWealthyWithdrawalPlan(plannedWithdrawals);
    closeWithdrawalModal();
  };

  return (
  <>
    <Dialog open={isWithdrawalModalOpen} onOpenChange={(open) => !open && closeWithdrawalModal()}>
      {/* ✨ 1. ปรับขนาด Modal ให้กว้างขึ้นเป็น max-w-5xl เพื่อรองรับ 2 คอลัมน์ */}
      <DialogContent className="sm:max-w-5xl grid grid-rows-[auto,1fr,auto] p-0 max-h-[90vh] rounded-2xl overflow-hidden">
        <DialogHeader className="p-6 bg-slate-50 border-b">
          <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
            <Banknote className="mr-3 h-8 w-8 text-green-600" />
            วางแผนการถอนเงิน
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            สร้างแผนการถอนเงินล่วงหน้าเพื่อความมั่นคงทางการเงินในอนาคตของคุณ
          </DialogDescription>
        </DialogHeader>

        {/* ✨ 2. สร้าง Layout 2 คอลัมน์ด้วย Grid */}
        <div className="overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-x-8 bg-slate-100/60">
          
          {/* --- คอลัมน์ซ้าย: ฟอร์มเพิ่มรายการ --- */}
          <div className="px-6 py-6 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/60 space-y-5">
              <div className="space-y-3">
                <Label className="text-base font-semibold text-slate-700">1. เลือกประเภทการถอน</Label>
                <RadioGroup defaultValue="annual" value={withdrawalType} onValueChange={(v) => setWithdrawalType(v as WithdrawalType)} className="grid grid-cols-2 gap-4">
                  <Label className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${withdrawalType === 'single' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <RadioGroupItem value="single" id="single" className="sr-only" />
                    <TrendingUp className={`mb-3 h-7 w-7 ${withdrawalType === 'single' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-800">ครั้งเดียว</span>
                  </Label>
                  <Label className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${withdrawalType === 'annual' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <RadioGroupItem value="annual" id="annual" className="sr-only" />
                    <Repeat className={`mb-3 h-7 w-7 ${withdrawalType === 'annual' ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-800">ทุกปี</span>
                  </Label>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base font-semibold text-slate-700">2. ระบุจำนวนเงิน</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="เช่น 10000"
                    className="pl-10 h-12 text-lg"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400">฿</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold text-slate-700">3. กำหนดช่วงเวลา</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-age" className="text-sm font-medium">ตั้งแต่</Label>
                    <Select value={startAge.toString()} onValueChange={(v) => setStartAge(Number(v))} disabled={!canAdd}>
                      <SelectTrigger id="start-age" className="h-11"><SelectValue placeholder="เลือกอายุ" /></SelectTrigger>
                      <SelectContent>
                        {startAgeOptions.map(age => <SelectItem key={age} value={age.toString()}>อายุ {age} ปี</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {withdrawalType === 'annual' && (
                    <div className="space-y-2">
                      <Label htmlFor="end-age" className="text-sm font-medium">ถึง</Label>
                      <Select value={endAge.toString()} onValueChange={(v) => setEndAge(Number(v))} disabled={!canAdd}>
                        <SelectTrigger id="end-age" className="h-11"><SelectValue placeholder="เลือกอายุ" /></SelectTrigger>
                        <SelectContent>
                          {endAgeOptions.map(age => <SelectItem key={age} value={age.toString()}>อายุ {age} ปี</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleAddPlan} disabled={!canAdd} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-base font-bold">เพิ่มลงในแผน</Button>
            </div>
          </div>
          
          {/* --- คอลัมน์ขวา: ไทม์ไลน์ --- */}
          <div className="px-6 py-6 space-y-4 lg:border-l lg:bg-slate-100/60">
            <h3 className="font-semibold text-lg text-slate-800">ไทม์ไลน์แผนการถอนเงิน</h3>
            {plannedWithdrawals.length === 0 ? (
              <div className="text-center text-slate-400 pt-16 h-full flex flex-col items-center justify-center">
                <ClipboardList className="h-20 w-20 text-slate-300" />
                <p className="mt-4 font-medium text-slate-500">แผนของคุณยังว่างอยู่</p>
                <p className="text-sm">เริ่มต้นโดยการสร้างรายการด้านซ้าย</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plannedWithdrawals.map(plan => (
                  <WithdrawalItem key={plan.id} record={plan} onDelete={() => setItemToDeleteId(plan.id ?? null)} />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="p-6 bg-slate-100 border-t">
          <Button type="button" variant="ghost" onClick={closeWithdrawalModal}>ยกเลิก</Button>
          <Button type="button" onClick={handleSaveAndClose}>บันทึกแผน</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
          <AlertDialogDescription>คุณต้องการลบรายการถอนเงินนี้ออกจากแผนใช่หรือไม่?</AlertDialogDescription>
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