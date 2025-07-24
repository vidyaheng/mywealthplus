// src/components/modals/WithdrawalPlanModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { WithdrawalPlanRecord } from '@/lib/calculations';

// --- UI Component Imports ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Trash2, Banknote, Repeat, TrendingUp, ClipboardList, PlusCircle } from 'lucide-react';

type WithdrawalType = 'single' | 'annual';

// --- Sub-component: ปรับดีไซน์ให้เหมือน PausePeriodItem ---
function WithdrawalItem({ record, onDelete }: { record: WithdrawalPlanRecord; onDelete: (id: string | undefined) => void; }) {
  const isSingle = record.type === 'single';
  return (
    <div className="flex items-center justify-between p-2.5 bg-zinc-50 border rounded-lg hover:bg-zinc-100 transition-colors">
      <div className="flex items-center gap-3">
        {isSingle 
          ? <TrendingUp className="w-5 h-5 text-sky-500" /> 
          : <Repeat className="w-5 h-5 text-green-500" />}
        <div>
          <p className="font-medium text-xs text-zinc-800">
            ถอน <span className={isSingle ? 'text-sky-600' : 'text-green-600'}>{record.amount.toLocaleString()}</span> บาท
          </p>
          <p className="text-[11px] text-zinc-500">
            {isSingle ? `ตอนอายุ ${record.startAge} ปี` : `ช่วงอายุ ${record.startAge} - ${record.endAge} ปี`}
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

export default function WithdrawalPlanModal() {
  // --- Store State ---
  const { isWithdrawalModalOpen, closeWithdrawalModal, iWealthyWithdrawalPlan, iWealthyAge, setIWealthyWithdrawalPlan } = useAppStore();
  const maxPossibleAge = 98;
  const minWithdrawalAge = iWealthyAge + 1;

  // --- Local State ---
  const [plannedWithdrawals, setPlannedWithdrawals] = useState<WithdrawalPlanRecord[]>([]);
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('annual');
  const [amount, setAmount] = useState('10000');
  const [startAge, setStartAge] = useState(minWithdrawalAge);
  const [endAge, setEndAge] = useState(maxPossibleAge);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // --- Logic (Effects, Memos, Handlers) - ไม่มีการเปลี่ยนแปลงในส่วน Logic ---
  useEffect(() => {
    if (isWithdrawalModalOpen) {
      const sortedPlan = [...iWealthyWithdrawalPlan].sort((a, b) => a.startAge - b.startAge);
      setPlannedWithdrawals(sortedPlan);
      const lastEndAge = sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) : iWealthyAge;
      const nextStartAge = Math.max(minWithdrawalAge, lastEndAge + 1);
      setStartAge(nextStartAge);
      setEndAge(maxPossibleAge);
      setAmount('10000');
      setWithdrawalType('annual');
    }
  }, [isWithdrawalModalOpen, iWealthyWithdrawalPlan, iWealthyAge]);

  const startAgeOptions = useMemo(() => {
    const lastEndAge = plannedWithdrawals.length > 0 ? Math.max(...plannedWithdrawals.map(p => p.endAge)) : iWealthyAge;
    const firstPossibleStartAge = Math.max(minWithdrawalAge, lastEndAge + 1);
    if (firstPossibleStartAge > maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - firstPossibleStartAge + 1 }, (_, i) => firstPossibleStartAge + i);
  }, [plannedWithdrawals, iWealthyAge]);

  const endAgeOptions = useMemo(() => {
    if (startAge >= maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - startAge }, (_, i) => startAge + 1 + i);
  }, [startAge]);

  const canAdd = startAgeOptions.length > 0 && Number(amount) > 0;

  const handleAddPlan = useCallback(() => {
    const numericAmount = parseInt(amount.replace(/,/g, ''), 10) || 0;
    if (!canAdd || (withdrawalType === 'annual' && startAge >= endAge)) return;
    const newPlan: WithdrawalPlanRecord = { id: uuidv4(), type: withdrawalType, amount: numericAmount, startAge, endAge: withdrawalType === 'single' ? startAge : endAge, refType: 'age' };
    const updatedPlan = [...plannedWithdrawals, newPlan].sort((a, b) => a.startAge - b.startAge);
    setPlannedWithdrawals(updatedPlan);
    const lastPlanEndAge = withdrawalType === 'single' ? startAge : endAge;
    const nextAvailableStartAge = Math.max(minWithdrawalAge, lastPlanEndAge + 1);
    if (nextAvailableStartAge <= maxPossibleAge) {
      setStartAge(nextAvailableStartAge);
      setEndAge(maxPossibleAge);
      setAmount('10000');
    }
  }, [withdrawalType, amount, startAge, endAge, plannedWithdrawals, canAdd]);

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
        {/* --- ปรับ Layout หลักให้เหมือนกัน --- */}
        <DialogContent className="sm:max-w-3xl grid grid-rows-[auto,1fr,auto] max-h-[90vh] rounded-2xl overflow-hidden border-2 border-slate-200">
          
          <DialogHeader className="p-4 bg-slate-50 border-b">
            <DialogTitle className="flex items-center text-base font-bold text-slate-800">
              <Banknote className="mr-2 h-5 w-5 text-green-600" />
              วางแผนการถอนเงิน
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-x-6 bg-slate-100/50">
            
            {/* --- คอลัมน์ซ้าย: ฟอร์ม (ปรับให้กระชับ) --- */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-green-600"/>สร้างรายการถอนเงิน</h3>
              <div className="p-4 bg-white border rounded-xl space-y-3 shadow-md shadow-slate-200/50">
                
                {/* 1. ประเภทการถอน */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-slate-600">1. เลือกประเภท</Label>
                  <RadioGroup value={withdrawalType} onValueChange={(v) => setWithdrawalType(v as WithdrawalType)} className="grid grid-cols-2 gap-2">
                    <Label className={`flex items-center justify-center rounded-md border p-2 cursor-pointer transition-all ${withdrawalType === 'single' ? 'border-sky-500 bg-sky-50/70' : 'border-slate-200 hover:border-slate-300'}`}>
                      <RadioGroupItem value="single" className="sr-only" />
                      <TrendingUp className={`mr-2 h-4 w-4 ${withdrawalType === 'single' ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-medium text-slate-800">ครั้งเดียว</span>
                    </Label>
                    <Label className={`flex items-center justify-center rounded-md border p-2 cursor-pointer transition-all ${withdrawalType === 'annual' ? 'border-green-500 bg-green-50/70' : 'border-slate-200 hover:border-slate-300'}`}>
                      <RadioGroupItem value="annual" className="sr-only" />
                      <Repeat className={`mr-2 h-4 w-4 ${withdrawalType === 'annual' ? 'text-green-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-medium text-slate-800">ทุกปี</span>
                    </Label>
                  </RadioGroup>
                </div>
                
                {/* 2. จำนวนเงิน */}
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-normal text-slate-600">2. ระบุจำนวนเงิน</Label>
                  <div className="relative">
                    <Input id="amount" type="text" inputMode="numeric" 
                      value={Number(amount).toLocaleString()}
                      onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      className="pl-7 pr-8 h-9 text-xs" />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">฿</span>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">บาท</span>
                  </div>
                </div>

                {/* 3. ช่วงเวลา */}
                <div className="grid grid-cols-2 gap-x-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-age" className="text-xs font-normal text-slate-600">{withdrawalType === 'single' ? '3. ที่อายุ' : '3. ตั้งแต่อายุ'}</Label>
                    <Select value={startAge.toString()} onValueChange={(v) => setStartAge(Number(v))} disabled={!canAdd}>
                      <SelectTrigger id="start-age" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {startAgeOptions.map(age => <SelectItem key={age} value={age.toString()} className="text-xs">อายุ {age} ปี</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {withdrawalType === 'annual' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="end-age" className="text-xs font-normal text-slate-600">ถึงอายุ</Label>
                      <Select value={endAge.toString()} onValueChange={(v) => setEndAge(Number(v))} disabled={!canAdd}>
                        <SelectTrigger id="end-age" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {endAgeOptions.map(age => <SelectItem key={age} value={age.toString()} className="text-xs">อายุ {age} ปี</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button onClick={handleAddPlan} disabled={!canAdd} className="w-full h-10 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold">เพิ่มลงในแผน</Button>
              </div>
            </div>
            
            {/* --- คอลัมน์ขวา: รายการ --- */}
            <div className="space-y-2 lg:border-l lg:pl-6">
              <h3 className="font-semibold text-sm text-slate-800">แผนการถอนเงิน</h3>
              {plannedWithdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-slate-400 h-full pt-8">
                  <ClipboardList className="h-14 w-14 text-slate-300" />
                  <p className="mt-2 font-medium text-xs text-slate-500">แผนของคุณยังว่างอยู่</p>
                  <p className="text-xs">เพิ่มรายการทางด้านซ้าย</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plannedWithdrawals.map(plan => (
                    <WithdrawalItem key={plan.id} record={plan} onDelete={() => setItemToDeleteId(plan.id ?? null)} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-4 bg-slate-100 border-t">
            <Button type="button" variant="ghost" className="text-sm" onClick={closeWithdrawalModal}>ยกเลิก</Button>
            <Button type="button" onClick={handleSaveAndClose} className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold">ยืนยันและบันทึกแผน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- AlertDialog (ปรับขนาด Font) --- */}
      <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">คุณต้องการลบรายการถอนเงินนี้ออกจากแผนใช่หรือไม่?</AlertDialogDescription>
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