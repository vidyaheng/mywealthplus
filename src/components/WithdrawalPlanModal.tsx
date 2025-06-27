// src/components/modals/WithdrawalPlanModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// +++ STEP 1: เปลี่ยนมา Import Store แทนการรับ Props +++
import { useAppStore } from '@/stores/appStore';
import type { WithdrawalPlanRecord } from '@/lib/calculations';

// --- UI Component Imports (เหมือนเดิม) ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import InputFieldGroup from './InputFieldGroup';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';

// --- Type และ Options (เหมือนเดิม) ---
type WithdrawalType = 'single' | 'annual';
const withdrawalTypeOptions: { value: WithdrawalType; label: string }[] = [
    { value: 'single', label: 'ครั้งเดียว' },
    { value: 'annual', label: 'ทุกปี' },
];
type RefType = 'age' | 'year';

export default function WithdrawalPlanModal() {
  // +++ STEP 2: ดึง State และ Actions ทั้งหมดมาจาก useAppStore +++
  const {
    isWithdrawalModalOpen,
    closeWithdrawalModal,
    iWealthyWithdrawalPlan,
    iWealthyAge,
    setIWealthyWithdrawalPlan,
  } = useAppStore();

  const maxPossibleAge = 98;
  const minWithdrawalAge = 45;

  // --- Local State สำหรับฟอร์ม ---
  const [currentType, setCurrentType] = useState<WithdrawalType>('annual');
  const [currentAmount, setCurrentAmount] = useState<number>(10000);
  const [currentRefType, setCurrentRefType] = useState<RefType>('age');
  const [currentStartValue, setCurrentStartValue] = useState<number>(minWithdrawalAge);
  const [currentEndValue, setCurrentEndValue] = useState<number>(maxPossibleAge);
  const [plannedWithdrawals, setPlannedWithdrawals] = useState<WithdrawalPlanRecord[]>([]);

  // +++ STEP 3: useEffect เพื่อ Sync ข้อมูลจาก Store +++
  useEffect(() => {
    if (isWithdrawalModalOpen) {
      const sortedPlan = [...iWealthyWithdrawalPlan].sort((a, b) => a.startAge - b.startAge);
      setPlannedWithdrawals(sortedPlan);

      setCurrentType('annual');
      setCurrentAmount(10000);
      setCurrentRefType('age');
      const lastEndAge = sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) : iWealthyAge;
      const nextStartAge = Math.max(minWithdrawalAge, lastEndAge + 1, iWealthyAge + 1);
      setCurrentStartValue(nextStartAge);
      setCurrentEndValue(maxPossibleAge);
    }
  }, [isWithdrawalModalOpen, iWealthyWithdrawalPlan, iWealthyAge]);

  // +++ STEP 4: เติม Logic ใน useMemo และ Handlers ให้สมบูรณ์ +++
  const startOptions = useMemo(() => {
    const lastEndAge = plannedWithdrawals.length > 0 ? Math.max(...plannedWithdrawals.map(p => p.endAge)) : 0;
    const firstPossibleStartAge = Math.max(minWithdrawalAge, lastEndAge + 1, iWealthyAge + 1);
    if (firstPossibleStartAge > maxPossibleAge) return [];
    if (currentRefType === 'age') {
        return Array.from({ length: maxPossibleAge - firstPossibleStartAge + 1 }, (_, i) => firstPossibleStartAge + i);
    } else { // 'year'
        const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
        const firstPossiblePolicyYear = Math.max(1, firstPossibleStartAge - iWealthyAge + 1);
        if (firstPossiblePolicyYear > maxPolicyYear) return [];
        return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
    }
  }, [iWealthyAge, maxPossibleAge, plannedWithdrawals, currentRefType, minWithdrawalAge]);

  const endOptions = useMemo(() => {
    const firstPossibleEndAge = currentRefType === 'age' ? currentStartValue : iWealthyAge + currentStartValue - 1;
    if (firstPossibleEndAge >= maxPossibleAge) return [maxPossibleAge];
    if (currentRefType === 'age') {
        return Array.from({ length: maxPossibleAge - firstPossibleEndAge + 1 }, (_, i) => firstPossibleEndAge + i);
    } else { // 'year'
        const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
        const firstPossibleEndYear = Math.max(1, firstPossibleEndAge - iWealthyAge + 2);
        if (firstPossibleEndYear > maxPolicyYear) return [];
        return Array.from({ length: maxPolicyYear - firstPossibleEndYear + 1 }, (_, i) => firstPossibleEndYear + i);
    }
  }, [currentStartValue, maxPossibleAge, iWealthyAge, currentRefType]);

  const handleTypeChange = (value: string) => setCurrentType(value as WithdrawalType);
  const handleRefTypeChange = (value: string) => setCurrentRefType(value as RefType);
  const handleStartValueChange = (value: string) => setCurrentStartValue(parseInt(value, 10));
  const handleEndValueChange = (value: string) => setCurrentEndValue(parseInt(value, 10));
  
  const handleAddPeriod = useCallback(() => {
    const startAgeValue = currentRefType === 'age' ? currentStartValue : iWealthyAge + currentStartValue - 1;
    const endAgeValue = currentType === 'single' ? startAgeValue : (currentRefType === 'age' ? currentEndValue : iWealthyAge + currentEndValue - 1);

    if (currentType === 'annual' && startAgeValue >= endAgeValue) {
        alert("อายุเริ่มต้นต้องน้อยกว่าอายุสิ้นสุด"); return;
    }
    if (currentAmount <= 0) {
        alert("กรุณาใส่จำนวนเงินที่ต้องการถอน"); return;
    }

    const newWithdrawal: WithdrawalPlanRecord = {
      id: uuidv4(),
      type: currentType,
      amount: currentAmount,
      startAge: startAgeValue,
      endAge: endAgeValue,
      refType: 'age', // Save as 'age' type for consistency
    };
    setPlannedWithdrawals(prev => [...prev, newWithdrawal].sort((a, b) => a.startAge - b.startAge));
    
    // Reset form for next entry
    const nextStartAge = Math.max(minWithdrawalAge, endAgeValue + 1);
    if(nextStartAge <= maxPossibleAge) {
        setCurrentStartValue(nextStartAge);
        setCurrentEndValue(maxPossibleAge);
        setCurrentAmount(10000);
    }

  }, [currentType, currentAmount, currentRefType, currentStartValue, currentEndValue, iWealthyAge]);

  const handleDeleteLastPeriod = useCallback(() => {
    if (window.confirm("คุณต้องการลบรายการถอนล่าสุดใช่หรือไม่?")) {
        setPlannedWithdrawals(prev => prev.slice(0, -1));
    }
  }, []);

  const handleSavePlan = () => {
    setIWealthyWithdrawalPlan(plannedWithdrawals);
    closeWithdrawalModal();
  };

  return (
    <Dialog open={isWithdrawalModalOpen} onOpenChange={(open) => !open && closeWithdrawalModal()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="ml-4 text-xl font-semibold text-blue-700">วางแผนการถอนเงิน</DialogTitle>
        </DialogHeader>

        {/* --- ส่วนกรอกข้อมูล --- */}
        <div className="space-y-4 pt-4">
          <div className="flex items-end gap-x-4">
            <div className="space-y-1 min-w-[120px]">
              <Label htmlFor="withdrawal-type" className="text-sm">ต้องการถอนเงิน</Label>
              <Select value={currentType} onValueChange={handleTypeChange}>
                <SelectTrigger id="withdrawal-type" className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {withdrawalTypeOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-x-3 ml-auto">
              {currentType === 'annual' && <span className="text-md text-gray-700 pb-1">ปีละ</span>}
              <div className="min-w-[180px]">
                <Label htmlFor="withdrawal-amount" className="text-xs mb-1 block sr-only">จำนวนเงิน</Label>
                <InputFieldGroup inputId="withdrawal-amount" value={currentAmount} onChange={setCurrentAmount} step={1000} min={0} label="" compact/>
              </div>
              <span className="text-sm text-gray-700 pb-1">บาท</span>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <div className="flex items-end gap-2 flex-shrink-0">
              <span className='text-sm text-gray-700 pb-1'>ตั้งแต่</span>
              <div className="flex flex-col space-y-1">
                <Select onValueChange={handleRefTypeChange} value={currentRefType}>
                  <SelectTrigger className="h-8 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                    <SelectItem value="year" className="text-xs">ปีที่</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1">
                <Select onValueChange={handleStartValueChange} value={currentStartValue.toString()} disabled={startOptions.length === 0}>
                  <SelectTrigger className="h-8 text-xs w-[85px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{startOptions.map(opt => (<SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            {currentType === 'annual' && (
              <div className="flex items-end gap-2 flex-shrink-0">
                <span className='text-sm text-gray-700 pb-1'>ถึง</span>
                <div className="flex flex-col space-y-1">
                  <Select onValueChange={handleEndValueChange} value={currentEndValue.toString()} disabled={endOptions.length === 0}>
                    <SelectTrigger className="h-8 text-xs w-[85px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{endOptions.map(opt => (<SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <span className="text-sm text-gray-700 pb-1">ปี</span>
              </div>
            )}
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={handleAddPeriod} disabled={startOptions.length === 0}>
                <Plus size={16} className="mr-1"/> เพิ่มรายการ
              </Button>
            </div>
          </div>
          <div className="space-y-1 pt-2">
            <div className="flex items-center text-xs text-red-600"><AlertCircle size={14} className="mr-1"/>สามารถถอนเงินได้ตั้งแต่อายุ {minWithdrawalAge} ถึง {maxPossibleAge} ปี</div>
            <div className="flex items-center text-xs text-red-600"><AlertCircle size={14} className="mr-1"/>การถอนเงินจะคำนวณจากมูลค่าฯ และจะส่งผลให้ได้รับเงินไม่เท่าเดิม</div>
          </div>
        </div>
        
        {/* --- ส่วนสรุป/ประวัติ --- */}
        <div className="border-t pt-3 mt-4">
          <h3 className="mb-2 font-medium text-sm">เงินที่วางแผนถอน</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {plannedWithdrawals.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีรายการ</p>
            ) : (
              plannedWithdrawals.map((record, index) => (
                <div key={record.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center text-xs px-2 py-1 border-b">
                  <span className='text-right font-medium'>{record.amount.toLocaleString('en-US')} บาท</span>
                  <span className='text-left text-gray-700'>{record.type === 'single' ? `อายุ ${record.startAge} ปี` : `อายุ ${record.startAge} - ${record.endAge} ปี`}</span>
                  <div className="h-5 w-5 flex items-center justify-center">
                    {index === plannedWithdrawals.length - 1 && (
                      <Button variant="ghost" size="icon" className="h-full w-full text-red-500 hover:text-red-700" onClick={handleDeleteLastPeriod}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" onClick={closeWithdrawalModal}>ยกเลิก</Button>
          </DialogClose>
          <Button type="button" size="sm" onClick={handleSavePlan} className='bg-blue-700 hover:bg-blue-500'>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}