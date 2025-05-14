// src/components/WithdrawalPlanModal.tsx (ไฟล์ใหม่)

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import InputFieldGroup from './InputFieldGroup'; // ใช้ InputFieldGroup
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { WithdrawalPlanRecord } from '../lib/calculations'; // Import Type
import { v4 as uuidv4 } from 'uuid'; // Import uuid

interface WithdrawalPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: WithdrawalPlanRecord[]) => void; // Callback ส่งแผนทั้งหมดกลับ
  initialPlan: WithdrawalPlanRecord[]; // รับแผนเริ่มต้น
  currentAge: number;
  maxPossibleAge?: number;
}

type WithdrawalType = 'single' | 'annual';
const withdrawalTypeOptions: { value: WithdrawalType; label: string }[] = [
    { value: 'single', label: 'ครั้งเดียว' },
    { value: 'annual', label: 'ทุกปี' },
];

type RefType = 'age' | 'year';

export default function WithdrawalPlanModal({
  isOpen,
  onClose,
  onSave,
  initialPlan = [],
  currentAge,
  maxPossibleAge = 98,
}: WithdrawalPlanModalProps) {

  // --- State สำหรับฟอร์มกรอกข้อมูลปัจจุบัน ---
  const [currentType, setCurrentType] = useState<WithdrawalType>('annual'); // Default เป็น ทุกปี ตามรูป
  const [currentAmount, setCurrentAmount] = useState<number>(10000);
  const [currentRefType, setCurrentRefType] = useState<RefType>('age');
  const [currentStartValue, setCurrentStartValue] = useState<number>(45); // เริ่มที่ 45 ตามรูป
  const [currentEndValue, setCurrentEndValue] = useState<number>(maxPossibleAge); // สิ้นสุด Default

  // --- State สำหรับเก็บรายการแผนที่เพิ่มเข้ามาใน Modal นี้ ---
  const [plannedWithdrawals, setPlannedWithdrawals] = useState<WithdrawalPlanRecord[]>([]);

  // --- State สำหรับควบคุม UI ---
  const minWithdrawalAge = 45; // อายุต่ำสุดที่ถอนได้ (จาก Warning)

  // --- Effect: ตั้งค่าเริ่มต้นเมื่อ Modal เปิด หรือ initialPlan เปลี่ยน ---
  useEffect(() => {
    if (isOpen) {
      // นำแผนเริ่มต้นจาก App.tsx มาใส่ใน State ของ Modal
      setPlannedWithdrawals([...initialPlan].sort((a, b) => a.startAge - b.startAge));

      // Reset ค่าในฟอร์มกรอกข้อมูล
      setCurrentType('annual'); // หรือ 'single'? ดูค่า default ที่เหมาะสม
      setCurrentAmount(10000); // ค่า default
      setCurrentRefType('age');
      // คำนวณอายุเริ่มต้นที่เป็นไปได้ถัดไป
      const lastEndAge = plannedWithdrawals.length > 0 ? Math.max(...plannedWithdrawals.map(p => p.endAge)) : currentAge;
      const nextStartAge = Math.max(minWithdrawalAge, lastEndAge + 1, currentAge + 1); // เริ่มจาก 45 หรือ อายุถัดไป
      setCurrentStartValue(nextStartAge);
      setCurrentEndValue(maxPossibleAge);
    }
  }, [isOpen, initialPlan, currentAge]); // ทำงานเมื่อเปิด หรือแผนเริ่มต้นเปลี่ยน

  // --- คำนวณ Options สำหรับ Dropdown อายุ/ปี ---
  const startOptions = useMemo(() => {
    const firstPossibleStartAge = plannedWithdrawals.length > 0
        ? Math.max(minWithdrawalAge, Math.max(...plannedWithdrawals.map(p => p.endAge)) + 1)
        : Math.max(minWithdrawalAge, currentAge + 1);

    if (firstPossibleStartAge > maxPossibleAge) return [];

    if (currentRefType === 'age') {
      return Array.from({ length: maxPossibleAge - firstPossibleStartAge + 1 }, (_, i) => firstPossibleStartAge + i);
    } else { // 'year'
      const maxPolicyYear = maxPossibleAge - currentAge;
      const firstPossiblePolicyYear = Math.max(1, firstPossibleStartAge - currentAge);
      if (firstPossiblePolicyYear > maxPolicyYear) return [];
      return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
    }
  }, [currentAge, maxPossibleAge, plannedWithdrawals, currentRefType]);

  const endOptions = useMemo(() => {
    const firstPossibleEndAge = currentRefType === 'age' ? currentStartValue : currentAge + currentStartValue;
    if (firstPossibleEndAge > maxPossibleAge) return [];

    if (currentRefType === 'age') {
      return Array.from({ length: maxPossibleAge - firstPossibleEndAge + 1 }, (_, i) => firstPossibleEndAge + i);
    } else { // 'year'
      const maxPolicyYear = maxPossibleAge - currentAge;
      const firstPossibleEndYear = Math.max(1, firstPossibleEndAge - currentAge);
      if (firstPossibleEndYear > maxPolicyYear) return [];
      return Array.from({ length: maxPolicyYear - firstPossibleEndYear + 1 }, (_, i) => firstPossibleEndYear + i);
    }
  }, [currentStartValue, maxPossibleAge, currentAge, currentRefType]);
  // --- ---


  // --- Handlers ---
  const handleTypeChange = (value: string) => setCurrentType(value as WithdrawalType);
  const handleRefTypeChange = (value: string) => setCurrentRefType(value as RefType);

  const handleStartValueChange = (value: string) => {
      const numValue = parseInt(value, 10);
      setCurrentStartValue(numValue);
      const effectiveStartAge = currentRefType === 'age' ? numValue : currentAge + numValue;
      const effectiveEndAge = currentRefType === 'age' ? currentEndValue : currentAge + currentEndValue;
      if (effectiveEndAge < effectiveStartAge) {
          const maxEndValue = currentRefType === 'age' ? maxPossibleAge : maxPossibleAge - currentAge;
          setCurrentEndValue(maxEndValue);
      }
   };
  const handleEndValueChange = (value: string) => setCurrentEndValue(parseInt(value, 10));

  // Handler ปุ่ม "+ เพิ่มช่วงเวลา"
  const handleAddPeriod = useCallback(() => {
    // แปลง Start/End Value เป็น Age จริงๆ ก่อน
    const startAgeValue = currentRefType === 'age' ? currentStartValue : currentAge + currentStartValue;
    // ถ้าเป็น 'single' ให้ endAge = startAge
    const endAgeValue = currentType === 'single' ? startAgeValue : (currentRefType === 'age' ? currentEndValue : currentAge + currentEndValue);

    // Validation เบื้องต้น
    if (!currentType || !currentAmount || !currentStartValue || (currentType === 'annual' && !currentEndValue)) {
      alert("กรุณากรอกข้อมูลการถอนให้ครบถ้วน"); return;
    }
    if (startAgeValue > endAgeValue && currentType === 'annual') {
      alert("อายุเริ่มต้นต้องไม่มากกว่าอายุสิ้นสุด"); return;
    }
    if (startAgeValue < minWithdrawalAge || startAgeValue > maxPossibleAge || (currentType === 'annual' && (endAgeValue < minWithdrawalAge || endAgeValue > maxPossibleAge))) {
       alert(`สามารถถอนเงินได้ระหว่างอายุ ${minWithdrawalAge} ถึง ${maxPossibleAge} ปี เท่านั้น`); return;
    }
    // TODO: Validate Overlaps with existing plannedWithdrawals

    // สร้าง Record ใหม่
    const newWithdrawal: WithdrawalPlanRecord = {
      id: uuidv4(), // สร้าง ID ชั่วคราวใน Modal
      type: currentType,
      amount: currentAmount,
      startAge: startAgeValue,
      endAge: endAgeValue,
      refType: currentRefType,
    };

    // เพิ่มเข้า Array ใน State และเรียงลำดับ
    setPlannedWithdrawals(prev => [...prev, newWithdrawal].sort((a, b) => a.startAge - b.startAge));

    // Reset Form (อาจจะ reset แค่บางส่วน หรือทั้งหมด)
    const nextStartAge = Math.max(minWithdrawalAge, endAgeValue + 1, currentAge + 1);
    setCurrentAmount(10000); // Reset amount
    if (nextStartAge <= maxPossibleAge) {
      setCurrentStartValue(currentRefType === 'age' ? nextStartAge : nextStartAge - currentAge);
      setCurrentEndValue(currentRefType === 'age' ? maxPossibleAge : maxPossibleAge - currentAge);
    } else {
        // ไม่สามารถเพิ่มได้อีก อาจจะ Disable ปุ่ม Add
        setCurrentStartValue(nextStartAge); // ให้ dropdown แสดงว่าไม่มี option
        setCurrentEndValue(nextStartAge);
    }

  }, [currentType, currentAmount, currentRefType, currentStartValue, currentEndValue, currentAge, maxPossibleAge, plannedWithdrawals, setPlannedWithdrawals]);

  // Handler ปุ่มลบรายการ (ลบจากรายการสุดท้ายเท่านั้น)
  const handleDeleteLastPeriod = useCallback(() => {
      if (plannedWithdrawals.length > 0) {
          if (window.confirm("คุณต้องการลบรายการถอนล่าสุดใช่หรือไม่?")) {
              setPlannedWithdrawals(prev => prev.slice(0, -1)); // ลบตัวสุดท้ายออก
          }
      }
  }, [plannedWithdrawals, setPlannedWithdrawals]);

   // Handler ปุ่ม "บันทึก"
  const handleSavePlan = () => {
    // ส่ง Array แผนการถอนเงินทั้งหมดกลับไปให้ App.tsx
    onSave(plannedWithdrawals);
    // onClose(); // App.tsx จัดการปิดเองแล้ว
  };
  // --- ---


  // --- ส่วน JSX ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl"> {/* ขยาย Modal */}
        <DialogHeader>
          <DialogTitle>วางแผนการถอนเงิน</DialogTitle>
        </DialogHeader>

        {/* === ส่วนกรอกข้อมูล === */}
        <div className="space-y-4 pt-4">
          {/* แถว 1: จำนวนเงิน */}
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <div className="flex-1 space-y-1 min-w-[120px]">
              <Label htmlFor="withdrawal-type" className="text-xs">เงินต้องการถอน</Label>
              <Select value={currentType} onValueChange={handleTypeChange}>
                <SelectTrigger id="withdrawal-type" className="h-8 text-xs"> <SelectValue /> </SelectTrigger>
                <SelectContent>
                  {withdrawalTypeOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <Label htmlFor="withdrawal-amount" className="text-xs mb-1 block sr-only">จำนวนเงิน</Label>
              <InputFieldGroup
                inputId="withdrawal-amount"
                value={currentAmount} onChange={setCurrentAmount}
                step={1000} min={0} label="" inputBgColor="bg-white" compact
              />
            </div>
            <span className="text-sm text-gray-700 pb-1">บาท</span>
          </div>

          {/* แถว 2: กำหนดเวลา */}
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
             {/* ตั้งแต่ */}
             <div className="flex items-end gap-2 flex-shrink-0">
                <span className='text-sm text-gray-700 pb-1'>ตั้งแต่</span>
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="ref-type-wd" className="text-xs sr-only">อ้างอิง</Label>
                  <Select onValueChange={handleRefTypeChange} value={currentRefType}>
                     <SelectTrigger id="ref-type-wd" className="h-8 text-xs w-[80px]"> <SelectValue /> </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                       {/* <SelectItem value="year" className="text-xs">ปีที่</SelectItem> */}
                     </SelectContent>
                   </Select>
                </div>
                <div className="flex flex-col space-y-1">
                    <Label htmlFor="start-value-wd" className="text-xs sr-only">{currentRefType === 'age' ? 'เริ่มที่อายุ' : 'เริ่มปีที่'}</Label>
                    <Select onValueChange={handleStartValueChange} value={(currentRefType === 'age' ? currentStartValue : Math.max(1, currentStartValue - currentAge)).toString()} disabled={startOptions.length === 0}>
                        <SelectTrigger id="start-value-wd" className="h-8 text-xs w-[80px]" disabled={startOptions.length === 0}> <SelectValue /> </SelectTrigger>
                        <SelectContent>{startOptions.length > 0 ? startOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt} {currentRefType === 'age' ? 'ปี' : ''}</SelectItem> )) : <SelectItem value="" disabled>เต็ม</SelectItem>}</SelectContent>
                    </Select>
                </div>
             </div>

             {/* ถึง (แสดงเมื่อเป็นรายปี) */}
             {currentType === 'annual' && (
                <div className="flex items-end gap-2 flex-shrink-0">
                    <span className='text-sm text-gray-700 pb-1'>ถึง</span>
                    <div className="flex flex-col space-y-1">
                        <Label htmlFor="end-value-wd" className="text-xs sr-only">{currentRefType === 'age' ? 'ถึงอายุ' : 'ถึงปีที่'}</Label>
                        <Select onValueChange={handleEndValueChange} value={(currentRefType === 'age' ? currentEndValue : Math.max(1, currentEndValue - currentAge)).toString()} disabled={endOptions.length === 0}>
                            <SelectTrigger id="end-value-wd" className="h-8 text-xs w-[80px]" disabled={endOptions.length === 0}> <SelectValue /> </SelectTrigger>
                            <SelectContent>{endOptions.length > 0 ? endOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt} {currentRefType === 'age' ? 'ปี' : ''}</SelectItem>)) : <SelectItem value="" disabled>เต็ม</SelectItem>}</SelectContent>
                        </Select>
                    </div>
                    <span className="text-sm text-gray-700 pb-1">ปี</span>
                </div>
             )}

             {/* ปุ่ม เพิ่มช่วงเวลา */}
             <div className="ml-auto"> {/* ดันไปขวาสุด */}
                 <Button variant="outline" size="sm" onClick={handleAddPeriod} disabled={startOptions.length === 0}>
                    <Plus size={16} className="mr-1"/> เพิ่มช่วงเวลา
                 </Button>
             </div>
          </div>

          {/* Warning Messages */}
          <div className="space-y-1 pt-2">
              <div className="flex items-center text-xs text-red-600">
                 <AlertCircle size={14} className="mr-1 flex-shrink-0"/>
                 <span>สามารถถอนเงินได้ตั้งแต่อายุ {minWithdrawalAge} ถึง {maxPossibleAge} ปี</span>
              </div>
               <div className="flex items-center text-xs text-red-600">
                  <AlertCircle size={14} className="mr-1 flex-shrink-0"/>
                  <span>การถอนเงินจะคำนวณจากมูลค่าฯ และจะส่งผลให้ได้รับเงินไม่เท่าเดิม</span>
               </div>
           </div>
        </div>
        {/* === จบ ส่วนกรอกข้อมูล === */}


        {/* === ส่วนสรุป/ประวัติ (แก้ไข Layout) === */}
        {/* Container หลักของส่วนนี้ */}
        <div className="border-t pt-3 mt-4">

            {/* หัวข้อ */}
            <h3 className="mb-2 font-medium text-sm">เงินที่วางแผนถอน</h3>

            {/* Container สำหรับ List พร้อม Scrollbar ถ้าจำเป็น */}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {/* ตรวจสอบว่ามีข้อมูลหรือไม่ */}
                {!plannedWithdrawals || plannedWithdrawals.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีรายการ</p>
                ) : (             
                    <>
                        {/* (Optional) แถว Header ของตาราง */}
                        <div className="grid grid-cols-[1fr,1fr,auto] gap-2 text-xs text-gray-500 font-medium px-2 pb-1 border-b">
                            <span className="text-right">จำนวนเงินที่ถอน</span>
                            <span className="text-left">ช่วงอายุที่ถอน</span>
                            <span>{/* ว่างสำหรับปุ่มลบ */}</span>
                        </div>
                        {/* แสดงรายการข้อมูล */}
                        {plannedWithdrawals.map((record, index) => {
                            // คำนวณข้อความช่วงอายุ
                            const periodLabel = record.type === 'single'
                                ? `อายุ ${record.startAge} ปี`
                                : `อายุ ${record.startAge} - ${record.endAge} ปี`;
                            // เช็คว่าเป็นรายการสุดท้ายหรือไม่
                            const isLastRecord = index === plannedWithdrawals.length - 1;

                            return (
                                // ใช้ Grid จัดคอลัมน์แต่ละแถว
                                <div key={record.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center text-xs px-2 py-1 border-b last:border-b-0">
                                    {/* คอลัมน์ 1: จำนวนเงิน */}
                                    <span className='text-right font-medium'>
                                        {record.amount.toLocaleString('en-US')} บาท
                                    </span>
                                    {/* คอลัมน์ 2: ช่วงอายุ */}
                                    <span className='text-left text-gray-700'>
                                        {periodLabel}
                                    </span>
                                    {/* คอลัมน์ 3: ปุ่มลบ (แสดงเฉพาะรายการสุดท้าย) */}
                                    <div className="h-5 w-5 flex items-center justify-center">
                                        {/* VVVVV ใส่เงื่อนไข isLastRecord ตรงนี้ VVVVV */}
                                        {isLastRecord ? (
                                            <Button
                                                variant="ghost" size="icon"
                                                className="h-full w-full text-red-500 hover:text-red-700 hover:bg-red-100 p-0 flex-shrink-0"
                                                onClick={() => handleDeleteLastPeriod()} // เรียก Handler ลบตัวสุดท้าย
                                                title="ลบรายการล่าสุด"
                                                //disabled={!onDeleteChange} // อาจจะไม่ต้องเช็ค ถ้าปุ่มนี้จัดการ State ภายใน Modal
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        ) : null // ถ้าไม่ใช่รายการสุดท้าย ไม่ต้องแสดงปุ่ม
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
                </div>

                {/* ส่วนแสดงผลรวม (ถ้ามี) */}
                {plannedWithdrawals.length > 0 && (
                    <div className='text-right mt-2 text-sm font-semibold'>
                        รวมวางแผนการถอนเงินทั้งหมด: {plannedWithdrawals.reduce((sum, item) => sum + (item.amount * (item.type === 'annual' ? (item.endAge - item.startAge + 1) : 1)), 0).toLocaleString('en-US')} บาท
                    </div>
                )}
                </div>
                {/* === จบ ส่วนสรุป/ประวัติ === */}

        {/* Footer */}
        <DialogFooter className="mt-6">
          <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">ยกเลิก</Button>
          </DialogClose>
           <Button type="button" size="sm" onClick={handleSavePlan}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}