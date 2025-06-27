// src/components/modals/AddInvestmentModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// +++ STEP 1: เปลี่ยนมา Import Store และ Types ที่ถูกต้อง +++
import { useAppStore } from '@/stores/appStore';
import type { AddInvestmentRecord } from '@/lib/calculations';

// --- UI Component Imports (เหมือนเดิม) ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import InputFieldGroup from './InputFieldGroup';
import { Plus, Trash2 } from 'lucide-react';

// --- Type และ Options (เหมือนเดิม) ---
type InvestmentType = 'single' | 'annual';
const investmentTypeOptions: { value: InvestmentType; label: string }[] = [
    { value: 'single', label: 'ครั้งเดียว' },
    { value: 'annual', label: 'ทุกปี' },
];
type RefType = 'age' | 'year';

export default function AddInvestmentModal() {
  // +++ STEP 2: ดึง State และ Actions ทั้งหมดมาจาก useAppStore +++
  const {
    isAddInvestmentModalOpen,
    closeAddInvestmentModal,
    iWealthyAdditionalInvestments,
    iWealthyAge,
    setIWealthyAdditionalInvestments,
  } = useAppStore();

  const maxPossibleAge = 98;

  // --- Local State สำหรับฟอร์ม ---
  const [investmentType, setInvestmentType] = useState<InvestmentType>('single');
  const [investmentAmount, setInvestmentAmount] = useState<number>(10000);
  const [refType, setRefType] = useState<RefType>('age');
  const [startValue, setStartValue] = useState<number>(iWealthyAge);
  const [endValue, setEndValue] = useState<number>(maxPossibleAge);
  const [plannedInvestments, setPlannedInvestments] = useState<AddInvestmentRecord[]>([]);
  const [canAddNewPeriod, setCanAddNewPeriod] = useState(true);

  // +++ STEP 3: ปรับแก้ Hooks ให้ทำงานกับ Store State +++
  const firstPossibleStartAge = useMemo(() => {
    const lastEndAge = plannedInvestments.length > 0 ? Math.max(...plannedInvestments.map(p => p.endAge)) : iWealthyAge - 1;
    return Math.max(lastEndAge + 1, iWealthyAge, 1);
  }, [plannedInvestments, iWealthyAge]);

  useEffect(() => {
    if (isAddInvestmentModalOpen) {
      const sortedPlan = [...iWealthyAdditionalInvestments].sort((a, b) => a.startAge - b.startAge);
      setPlannedInvestments(sortedPlan);
      
      setInvestmentType('single');
      setInvestmentAmount(10000);
      setRefType('age');
      
      const lastEndAge = sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) : iWealthyAge - 1;
      const defaultStartAge = Math.max(lastEndAge + 1, iWealthyAge, 1);
      
      if (defaultStartAge > maxPossibleAge) {
        setCanAddNewPeriod(false);
      } else {
        setCanAddNewPeriod(true);
        setStartValue(defaultStartAge);
        setEndValue(maxPossibleAge);
      }
    }
  }, [isAddInvestmentModalOpen, iWealthyAdditionalInvestments, iWealthyAge, maxPossibleAge]);

  // +++ STEP 4: เติม Logic ใน useMemo และ Handlers ให้สมบูรณ์ +++
  const startOptions = useMemo(() => {
    if (!canAddNewPeriod) return [];
    const start = firstPossibleStartAge;
    if (start > maxPossibleAge) return [];
    if (refType === 'age') {
        return Array.from({ length: maxPossibleAge - start + 1 }, (_, i) => start + i);
    } else { // 'year'
        const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
        const firstPossiblePolicyYear = Math.max(1, start - iWealthyAge + 1);
        if (firstPossiblePolicyYear > maxPolicyYear) return [];
        return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
    }
  }, [firstPossibleStartAge, maxPossibleAge, iWealthyAge, refType, canAddNewPeriod]);

  const endOptions = useMemo(() => {
    if (!canAddNewPeriod) return [];
    const firstPossibleEndAge = refType === 'age' ? startValue : iWealthyAge + startValue -1;
    if (firstPossibleEndAge >= maxPossibleAge) return [maxPossibleAge];
    if (refType === 'age') {
        return Array.from({ length: maxPossibleAge - firstPossibleEndAge + 1 }, (_, i) => firstPossibleEndAge + i);
    } else { // 'year'
        const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
        const firstPossibleEndYear = Math.max(1, firstPossibleEndAge - iWealthyAge + 2);
        if (firstPossibleEndYear > maxPolicyYear) return [];
        return Array.from({ length: maxPolicyYear - firstPossibleEndYear + 1 }, (_, i) => firstPossibleEndYear + i);
    }
  }, [startValue, maxPossibleAge, iWealthyAge, refType, canAddNewPeriod]);
  
  const handleTypeChange = (value: string) => setInvestmentType(value as InvestmentType);
  const handleRefTypeChange = (value: string) => setRefType(value as RefType);
  const handleStartValueChange = (value: string) => setStartValue(parseInt(value, 10));
  const handleEndValueChange = (value: string) => setEndValue(parseInt(value, 10));

  const handleAddInvestmentPeriod = useCallback(() => {
    const startAgeValue = refType === 'age' ? startValue : iWealthyAge + startValue - 1;
    const endAgeValue = investmentType === 'single' ? startAgeValue : (refType === 'age' ? endValue : iWealthyAge + endValue - 1);

    if (!investmentAmount || investmentAmount <= 0) {
        alert("กรุณาใส่จำนวนเงินลงทุนให้ถูกต้อง"); return;
    }
    if (investmentType === 'annual' && startAgeValue >= endAgeValue) {
        alert("อายุเริ่มต้นต้องน้อยกว่าอายุสิ้นสุด"); return;
    }

    const newInvestment: AddInvestmentRecord = {
      id: uuidv4(),
      type: investmentType,
      amount: investmentAmount,
      startAge: startAgeValue,
      endAge: endAgeValue,
      refType: 'age',
    };
    setPlannedInvestments(prev => [...prev, newInvestment].sort((a, b) => a.startAge - b.startAge));

    // Reset Form
    const nextStartAge = Math.max(iWealthyAge, endAgeValue + 1);
    if (nextStartAge <= maxPossibleAge) {
        setStartValue(nextStartAge);
        setEndValue(maxPossibleAge);
        setInvestmentAmount(10000);
        setCanAddNewPeriod(true);
    } else {
        setCanAddNewPeriod(false);
    }
  }, [investmentType, investmentAmount, refType, startValue, endValue, iWealthyAge, maxPossibleAge]);
  
  const handleDeleteLastInvestment = useCallback(() => {
    if (window.confirm("คุณต้องการลบรายการลงทุนเพิ่มล่าสุดใช่หรือไม่?")) {
        const newList = plannedInvestments.slice(0, -1);
        setPlannedInvestments(newList);
        // Reset form based on the new last item
        const lastEndAge = newList.length > 0 ? Math.max(...newList.map(p => p.endAge)) : iWealthyAge - 1;
        const nextStartAge = Math.max(iWealthyAge, lastEndAge + 1);
        setStartValue(nextStartAge);
        setEndValue(maxPossibleAge);
        setCanAddNewPeriod(nextStartAge <= maxPossibleAge);
    }
  }, [plannedInvestments, iWealthyAge, maxPossibleAge]);

  const handleSavePlan = () => {
    setIWealthyAdditionalInvestments(plannedInvestments);
    closeAddInvestmentModal();
  };

  return (
    <Dialog open={isAddInvestmentModalOpen} onOpenChange={(open) => !open && closeAddInvestmentModal()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>วางแผนการลงทุนเพิ่ม</DialogTitle>
        </DialogHeader>

        {/* --- ส่วนกรอกข้อมูล --- */}
        <div className="space-y-3 pt-4">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <div className="flex flex-col space-y-1 min-w-[120px]">
              <Label htmlFor="investment-type" className="text-xs">ประเภทการลงทุน</Label>
              <Select value={investmentType} onValueChange={handleTypeChange} disabled={!canAddNewPeriod}>
                <SelectTrigger id="investment-type" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{investmentTypeOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label htmlFor="investment-amount" className="text-xs mb-1 block">จำนวนเงินลงทุนเพิ่ม</Label>
              <InputFieldGroup inputId="investment-amount" value={investmentAmount} onChange={setInvestmentAmount} step={1000} min={1} label="" compact disabled={!canAddNewPeriod}/>
            </div>
            <span className="text-sm text-gray-700 pb-1">บาท / ครั้ง</span>
          </div>

          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <span className='text-sm text-gray-700 pb-1'>ตั้งแต่</span>
            <div className="flex flex-col space-y-1">
              <Select onValueChange={handleRefTypeChange} value={refType} disabled={!canAddNewPeriod}>
                <SelectTrigger className="h-8 text-xs w-[80px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                  <SelectItem value="year" className="text-xs">ปีที่</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1">
              <Select onValueChange={handleStartValueChange} value={startValue.toString()} disabled={!canAddNewPeriod || startOptions.length === 0}>
                <SelectTrigger className="h-8 text-xs w-[80px]"><SelectValue /></SelectTrigger>
                <SelectContent>{startOptions.map(opt => (<SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {investmentType === 'annual' && (
              <>
                <span className='text-sm text-gray-700 pb-1'>ถึง</span>
                <div className="flex flex-col space-y-1">
                  <Select onValueChange={handleEndValueChange} value={endValue.toString()} disabled={!canAddNewPeriod || endOptions.length === 0}>
                    <SelectTrigger className="h-8 text-xs w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{endOptions.map(opt => (<SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <span className="text-sm text-gray-700 pb-1">ปี</span>
              </>
            )}
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={handleAddInvestmentPeriod} disabled={!canAddNewPeriod}>
                <Plus size={16} className="mr-1"/> เพิ่มรายการ
              </Button>
            </div>
          </div>
        </div>

        {/* --- ส่วนสรุป/ประวัติ --- */}
        <div className="border-t pt-3 mt-4">
          <h3 className="font-medium text-sm">รายการลงทุนเพิ่มเติม</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {plannedInvestments.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีรายการ</p>
            ) : (
              plannedInvestments.map((record, index) => (
                <div key={record.id} className="grid grid-cols-[auto,auto,1fr,auto,auto] gap-2 items-center text-xs px-2 py-1 border rounded bg-gray-50">
                  <span className='font-mono text-gray-500'>{index + 1}.</span>
                  <span className='text-left font-medium text-green-700 w-14 truncate'>{record.type === 'single' ? 'ครั้งเดียว' : 'ทุกปี'}</span>
                  <span className='text-right font-medium'>{record.amount.toLocaleString('en-US')} บาท</span>
                  <span className='text-center text-gray-600 w-24'>{record.type === 'single' ? `อายุ ${record.startAge} ปี` : `อายุ ${record.startAge} - ${record.endAge} ปี`}</span>
                  <div className="h-5 w-5 flex items-center justify-center">
                    {index === plannedInvestments.length - 1 ? (<Button variant="ghost" size="icon" className="h-full w-full text-red-500" onClick={handleDeleteLastInvestment}><Trash2 className="h-3.5 w-3.5" /></Button>) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline" size="sm">ยกเลิก</Button></DialogClose>
            <Button type="button" size="sm" onClick={handleSavePlan}>บันทึกแผนลงทุน</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}