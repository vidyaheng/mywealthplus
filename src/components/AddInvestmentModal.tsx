// src/components/AddInvestmentModal.tsx (ฉบับเต็ม แก้ไขตาม Requirement ล่าสุด)

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from 'lucide-react'; // <<< ลบ AlertCircle ออก
// Import InputFieldGroup ถ้าจะใช้ช่องกรอกแบบมี +/-
import InputFieldGroup from './InputFieldGroup';
// Import Type จาก App.tsx (ต้องมี AddInvestmentRecord)
import type { AddInvestmentRecord } from '../lib/calculations';; // <<< ตรวจสอบว่า Export Type นี้จาก App.tsx
import { v4 as uuidv4 } from 'uuid'; // Import uuid สำหรับสร้าง ID ชั่วคราว

// --- Props Interface ---
interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: AddInvestmentRecord[]) => void; // Callback ส่งแผนทั้งหมดกลับ
  initialPlan: AddInvestmentRecord[]; // รับแผนเริ่มต้น
  currentAge: number; // อายุปัจจุบัน
  maxPossibleAge?: number;
  // ไม่ต้องมี minPauseAge ที่นี่
}

// Type สำหรับ ประเภทการลงทุน
type InvestmentType = 'single' | 'annual';
const investmentTypeOptions: { value: InvestmentType; label: string }[] = [
    { value: 'single', label: 'ครั้งเดียว' },
    { value: 'annual', label: 'ทุกปี' },
];

// Type สำหรับ ประเภทอ้างอิง
type RefType = 'age' | 'year';

// --- Component หลัก ---
export default function AddInvestmentModal({
  isOpen,
  onClose,
  onSave,
  initialPlan = [],
  currentAge,
  maxPossibleAge = 98,
}: AddInvestmentModalProps) {

  // --- State ภายใน Modal ---
  const [investmentType, setInvestmentType] = useState<InvestmentType>('single');
  const [investmentAmount, setInvestmentAmount] = useState<number>(10000);
  const [refType, setRefType] = useState<RefType>('age');
  const [startValue, setStartValue] = useState<number>(currentAge); // <<< ค่าเริ่มต้นอาจจะเป็น currentAge
  const [endValue, setEndValue] = useState<number>(maxPossibleAge);
  const [plannedInvestments, setPlannedInvestments] = useState<AddInvestmentRecord[]>([]);
  const [canAddNewPeriod, setCanAddNewPeriod] = useState(true);
  // --- ---

  // --- คำนวณอายุเริ่มต้นที่เป็นไปได้ครั้งถัดไป ---
  const firstPossibleStartAge = useMemo(() => {
    const lastEndAge = plannedInvestments.length > 0 ? Math.max(...plannedInvestments.map(p => p.endAge)) : currentAge - 1; // ใช้อายุก่อนหน้าปัจจุบันถ้ายังไม่มีประวัติ
    // เริ่มได้ตั้งแต่อายุสุดท้าย + 1 หรือ อายุปัจจุบัน (เอาค่าที่มากกว่า) และต้องไม่น้อยกว่า 1
    return Math.max(lastEndAge + 1, currentAge, 1); // <<< แก้ไข: เริ่มที่ currentAge ได้
  }, [plannedInvestments, currentAge]);
  // --- ---

  // --- Effect: ตั้งค่าเริ่มต้นเมื่อ Modal เปิด หรือ initialPlan เปลี่ยน ---
  useEffect(() => {
    if (isOpen) {
      const sortedInitialPlan = [...initialPlan].sort((a, b) => a.startAge - b.startAge);
      setPlannedInvestments(sortedInitialPlan);

      // Reset Form
      setInvestmentType('single');
      setInvestmentAmount(10000);
      setRefType('age');

      // คำนวณอายุเริ่มต้น (ใช้ Logic เดียวกับ useMemo)
      const lastEndAge = sortedInitialPlan.length > 0 ? Math.max(...sortedInitialPlan.map(p => p.endAge)) : currentAge - 1;
      const defaultStartAge = Math.max(lastEndAge + 1, currentAge, 1); // <<< แก้ไข: เริ่มที่ currentAge ได้
      const finalMaxAge = maxPossibleAge > defaultStartAge ? maxPossibleAge : defaultStartAge;

      if (defaultStartAge > maxPossibleAge) {
        setCanAddNewPeriod(false);
        setStartValue(defaultStartAge);
        setEndValue(defaultStartAge);
      } else {
        setCanAddNewPeriod(true);
        setStartValue(defaultStartAge);
        setEndValue(finalMaxAge);
      }
    }
  }, [isOpen, initialPlan, currentAge, maxPossibleAge]); // อัปเดต Dependencies
  // --- ---

  // --- คำนวณ Options สำหรับ Dropdown ---
   const startOptions = useMemo(() => {
       if (!canAddNewPeriod) return [];
       const start = firstPossibleStartAge; // ใช้ค่าที่คำนวณไว้
       if (start > maxPossibleAge) return [];
       if (refType === 'age') {
           return Array.from({ length: maxPossibleAge - start + 1 }, (_, i) => start + i);
       } else { // refType === 'year'
           const maxPolicyYear = maxPossibleAge - currentAge;
           const firstPossiblePolicyYear = Math.max(1, start - currentAge);
           if (firstPossiblePolicyYear > maxPolicyYear) return [];
           return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
       }
   }, [firstPossibleStartAge, maxPossibleAge, currentAge, refType, canAddNewPeriod]);

   const endOptions = useMemo(() => {
       if (!canAddNewPeriod) return [];
       const firstPossibleEndAge = refType === 'age' ? startValue : currentAge + startValue;
       if (firstPossibleEndAge > maxPossibleAge) return [];

       if (refType === 'age') {
           return Array.from({ length: maxPossibleAge - firstPossibleEndAge + 1 }, (_, i) => firstPossibleEndAge + i);
       } else { // refType === 'year'
           const maxPolicyYear = maxPossibleAge - currentAge;
           const currentStartYear = refType === 'year' ? startValue : startValue - currentAge; // ปีเริ่มต้นที่เลือก
           const firstPossibleEndYear = Math.max(1, currentStartYear, firstPossibleEndAge - currentAge);
           if (firstPossibleEndYear > maxPolicyYear) return [];
           return Array.from({ length: maxPolicyYear - firstPossibleEndYear + 1 }, (_, i) => firstPossibleEndYear + i);
       }
   }, [startValue, maxPossibleAge, currentAge, refType, canAddNewPeriod]);
  // --- ---


  // --- Handlers ---
  const handleTypeChange = (value: string) => setInvestmentType(value as InvestmentType);

  const handleRefTypeChange = (value: string) => {
      const newRefType = value as 'age' | 'year';
      setRefType(newRefType);
      // Reset start/end value
      const defaultStartAge = firstPossibleStartAge;
      const finalMaxAge = maxPossibleAge > defaultStartAge ? maxPossibleAge : defaultStartAge;
      setStartValue(newRefType === 'age' ? defaultStartAge : Math.max(1, defaultStartAge - currentAge));
      setEndValue(newRefType === 'age' ? finalMaxAge : Math.max(1, finalMaxAge - currentAge));
  };

  const handleStartValueChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setStartValue(numValue);
    const effectiveStartAge = refType === 'age' ? numValue : currentAge + numValue;
    const effectiveEndAge = refType === 'age' ? endValue : currentAge + endValue;
    if (effectiveEndAge < effectiveStartAge) {
        const maxEndValue = refType === 'age' ? maxPossibleAge : Math.max(1, maxPossibleAge - currentAge);
        setEndValue(maxEndValue);
    }
  };

  const handleEndValueChange = (value: string) => {
    setEndValue(parseInt(value, 10));
  };

  // Handler ปุ่ม "+ เพิ่มรายการลงทุน"
  const handleAddInvestmentPeriod = useCallback(() => {
    const startAgeValue = refType === 'age' ? startValue : currentAge + startValue;
    const endAgeValue = investmentType === 'single' ? startAgeValue : (refType === 'age' ? endValue : currentAge + endValue);

    if (!investmentType || !investmentAmount || investmentAmount <= 0 || !startValue || (investmentType === 'annual' && !endValue)) {
      alert("กรุณากรอกข้อมูลลงทุนเพิ่มให้ครบถ้วนและถูกต้อง"); return;
    }
    if (investmentType === 'annual' && startAgeValue > endAgeValue) {
      alert("อายุเริ่มต้นต้องไม่มากกว่าอายุสิ้นสุด"); return;
    }
    // ลบการเช็ค minPauseAge ออก
    if (startAgeValue > maxPossibleAge || endAgeValue > maxPossibleAge) {
       alert(`สามารถลงทุนเพิ่มได้ถึงอายุ ${maxPossibleAge} ปี เท่านั้น`); return;
    }
    // TODO: Validate Overlaps

    const newInvestment: AddInvestmentRecord = {
      id: uuidv4(),
      type: investmentType,
      amount: investmentAmount,
      startAge: startAgeValue,
      endAge: endAgeValue,
      refType: refType,
    };
    setPlannedInvestments(prev => [...prev, newInvestment].sort((a, b) => a.startAge - b.startAge));

    // Reset Form
    const nextStartAge = Math.max(currentAge, endAgeValue + 1); // ใช้ currentAge เป็น min
    if (nextStartAge <= maxPossibleAge) {
        setStartValue(refType === 'age' ? nextStartAge : Math.max(1, nextStartAge - currentAge));
        setEndValue(refType === 'age' ? maxPossibleAge : Math.max(1, maxPossibleAge - currentAge));
        setCanAddNewPeriod(true);
        setInvestmentAmount(10000); // Reset Amount
    } else {
        setCanAddNewPeriod(false);
        setStartValue(nextStartAge);
        setEndValue(nextStartAge);
    }
  }, [investmentType, investmentAmount, refType, startValue, endValue, currentAge, maxPossibleAge, plannedInvestments, setPlannedInvestments, setStartValue, setEndValue, setInvestmentAmount]); // อัปเดต Dependencies

  // Handler ปุ่มลบรายการล่าสุด
  const handleDeleteLastInvestment = useCallback(() => {
      if (plannedInvestments.length > 0) {
          if (window.confirm("คุณต้องการลบรายการลงทุนเพิ่มล่าสุดใช่หรือไม่?")) {
              const newList = plannedInvestments.slice(0, -1);
              setPlannedInvestments(newList);
              // Reset ค่าใน Form
              const lastEndAge = newList.length > 0 ? Math.max(...newList.map(p => p.endAge)) : currentAge - 1;
              const nextStartAge = Math.max(currentAge, lastEndAge + 1); // ใช้ currentAge เป็น min
              setStartValue(refType === 'age' ? nextStartAge : Math.max(1, nextStartAge-currentAge));
              setEndValue(refType === 'age' ? maxPossibleAge : Math.max(1, maxPossibleAge-currentAge));
              setCanAddNewPeriod(nextStartAge <= maxPossibleAge);
          }
      }
  }, [plannedInvestments, setPlannedInvestments, currentAge, refType, maxPossibleAge, setStartValue, setEndValue]); // อัปเดต Dependencies

   // Handler ปุ่ม "บันทึก"
  const handleSaveInvestmentPlan = () => {
    onSave(plannedInvestments);
  };
  // --- ---


  // --- ส่วน JSX ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl"> {/* ขยาย Modal */}
        <DialogHeader>
          <DialogTitle>วางแผนการลงทุนเพิ่ม</DialogTitle>
        </DialogHeader>

        {/* ส่วนกรอกข้อมูล */}
        <div className="space-y-3 pt-4">
           {/* แถว 1: ประเภทและจำนวนเงิน */}
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <div className="flex flex-col space-y-1 min-w-[120px]">
                 <Label htmlFor="investment-type" className="text-xs">ประเภทการลงทุน</Label>
                 <Select value={investmentType} onValueChange={handleTypeChange} disabled={!canAddNewPeriod}>
                   <SelectTrigger id="investment-type" className="h-8 text-xs" disabled={!canAddNewPeriod}> <SelectValue /> </SelectTrigger>
                   <SelectContent>{investmentTypeOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>))}</SelectContent>
                 </Select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <Label htmlFor="investment-amount" className="text-xs mb-1 block">จำนวนเงินลงทุนเพิ่ม</Label>
                 <InputFieldGroup
                   inputId="investment-amount"
                   value={investmentAmount} onChange={setInvestmentAmount}
                   step={1000} min={1} label="" inputBgColor="bg-white" compact // Min=1?
                   disabled={!canAddNewPeriod}
                 />
              </div>
               <span className="text-sm text-gray-700 pb-1">บาท / ครั้ง</span>
            </div>

           {/* แถว 2: กำหนดเวลา */}
           <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className='text-sm text-gray-700 pb-1'>ตั้งแต่</span>
              {/* ประเภทอ้างอิง */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="ref-type-invest" className="text-xs sr-only">อ้างอิง</Label>
                <Select onValueChange={handleRefTypeChange} value={refType} disabled={!canAddNewPeriod}>
                   <SelectTrigger id="ref-type-invest" className="h-8 text-xs w-[80px]" disabled={!canAddNewPeriod}> <SelectValue /> </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                     {/* <SelectItem value="year" className="text-xs">ปีที่</SelectItem> */}
                   </SelectContent>
                </Select>
              </div>
              {/* เริ่มต้น */}
              <div className="flex flex-col space-y-1">
                 <Label htmlFor="start-value-invest" className="text-xs sr-only">{refType === 'age' ? 'เริ่มที่อายุ' : 'เริ่มปีที่'}</Label>
                 <Select onValueChange={handleStartValueChange} value={(refType === 'age' ? startValue : Math.max(1, startValue - currentAge)).toString()} disabled={!canAddNewPeriod || startOptions.length === 0}>
                    <SelectTrigger id="start-value-invest" className="h-8 text-xs w-[80px]" disabled={!canAddNewPeriod || startOptions.length === 0}> <SelectValue /> </SelectTrigger>
                    <SelectContent>{startOptions.length > 0 ? startOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt} {refType === 'age' ? 'ปี' : ''}</SelectItem> )) : <SelectItem value="" disabled>เต็ม</SelectItem>}</SelectContent>
                 </Select>
              </div>
              {/* ถึง (แสดงเมื่อเป็นรายปี) */}
              {investmentType === 'annual' && ( // <<< แสดงเฉพาะเมื่อ Type เป็น annual
                <>
                  <span className='text-sm text-gray-700 pb-1'>ถึง</span>
                  <div className="flex flex-col space-y-1">
                      <Label htmlFor="end-value-invest" className="text-xs sr-only">{refType === 'age' ? 'ถึงอายุ' : 'ถึงปีที่'}</Label>
                      <Select onValueChange={handleEndValueChange} value={(refType === 'age' ? endValue : Math.max(1, endValue - currentAge)).toString()} disabled={!canAddNewPeriod || endOptions.length === 0}>
                          <SelectTrigger id="end-value-invest" className="h-8 text-xs w-[80px]" disabled={!canAddNewPeriod || endOptions.length === 0}> <SelectValue /> </SelectTrigger>
                          <SelectContent>{endOptions.length > 0 ? endOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt} {refType === 'age' ? 'ปี' : ''}</SelectItem>)) : <SelectItem value="" disabled>เต็ม</SelectItem>}</SelectContent>
                      </Select>
                  </div>
                  <span className="text-sm text-gray-700 pb-1">ปี</span>
                </>
              )}
              {/* ปุ่ม เพิ่มรายการลงทุน */}
              <div className="ml-auto">
                  <Button variant="outline" size="sm" onClick={handleAddInvestmentPeriod} disabled={!canAddNewPeriod}>
                    <span className="flex items-center"> {/* ใช้ flex จัด Icon กับ Text ข้างใน span */}
                      <Plus size={16} className="mr-1"/>
                      เพิ่มรายการลงทุน
                    </span>
                  </Button>
              </div>
           </div>
           {/* ลบ Warning Messages ที่ไม่เกี่ยวข้องออก */}
        </div>
        {/* === จบ ส่วนกรอกข้อมูล === */}


        {/* === ส่วนสรุป/ประวัติ === */}
        <div className="border-t pt-3 mt-4">
           <div className='flex justify-between items-center mb-2'>
               <h3 className="font-medium text-sm">รายการลงทุนเพิ่มเติม</h3>
               <span className='text-xs text-gray-500'>รายการทั้งหมด {plannedInvestments.length}</span>
           </div>
             {!plannedInvestments || plannedInvestments.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีรายการ</p>
             ) : (
                 <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                     {/* แก้ไข Grid Columns และการแสดงผล */}
                     {plannedInvestments.map((record, index) => {
                          const typeLabel = investmentTypeOptions.find(t => t.value === record.type)?.label || record.type;
                          const periodLabel = record.type === 'single' ? `${record.refType === 'age' ? 'อายุ' : 'ปีที่'} ${record.startAge} ปี` : `${record.refType === 'age' ? 'อายุ' : 'ปีที่'} ${record.startAge} - ${record.endAge} ปี`;
                          const isLast = index === plannedInvestments.length - 1;
                          return (
                            <div key={record.id} className="grid grid-cols-[auto,auto,1fr,auto,auto] gap-2 items-center text-xs px-2 py-1 border rounded bg-gray-50"> {/* ปรับ Grid Columns */}
                                <span className='font-mono text-gray-500'>{index + 1}.</span>
                                <span className='text-left font-medium text-green-700 w-14 truncate'>{typeLabel}</span> {/* แสดง Type */}
                                <span className='text-right font-medium'>{record.amount.toLocaleString('en-US')} บาท</span> {/* แสดง Amount */}
                                <span className='text-center text-gray-600 w-24'>{periodLabel}</span> {/* แสดง Period */}
                                <div className="h-5 w-5 flex items-center justify-center">
                                    {isLast ? (<Button variant="ghost" size="icon" className="h-full w-full text-red-500 hover:text-red-700 hover:bg-red-100 p-0 flex-shrink-0" onClick={handleDeleteLastInvestment} title="ลบรายการล่าสุด"><Trash2 className="h-3.5 w-3.5" /></Button>) : null }
                                </div>
                            </div>
                          );
                     })}
                 </div>
             )}
             {/* ส่วนสรุปยอดรวม (ถ้าต้องการ) */}
             {/* ... */}
        </div>
        {/* === จบ ส่วนสรุป/ประวัติ === */}

        {/* Footer */}
        <DialogFooter className="mt-6">
           <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={onClose} // <<< เพิ่ม onClick ให้เรียก onClose prop โดยตรง
           >
               ยกเลิก
           </Button>
           <Button type="button" size="sm" onClick={handleSaveInvestmentPlan}>บันทึกแผนลงทุน</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}