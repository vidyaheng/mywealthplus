// src/components/PausePremiumModal.tsx (ฉบับเต็ม แก้ไขการเรียก State Setter)

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
// Import Type จาก App.tsx (ตรวจสอบ Path และการ Export)
import type { PausePeriodRecord } from '../lib/calculations';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

// --- Props Interface ---
interface PausePremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: PausePeriodRecord[]) => void;
  initialPlan: PausePeriodRecord[];
  currentAge: number;
  maxPossibleAge?: number;
  minPauseAge?: number; // อายุต่ำสุดที่อนุญาตให้หยุดพัก
}

// --- Component หลัก ---
export default function PausePremiumModal({
  isOpen,
  onClose,
  onSave,
  initialPlan = [],
  currentAge,
  maxPossibleAge = 98,
  
}: PausePremiumModalProps) {

  // --- State ภายใน Modal ---
  const [refType, setRefType] = useState<'age' | 'year'>('age');
  const [startValue, setStartValue] = useState<number>(Math.max(currentAge + 1)); // ค่าเริ่มต้นสำหรับช่อง "เริ่มที่"
  const [endValue, setEndValue] = useState<number>(maxPossibleAge);   // ค่าเริ่มต้นสำหรับช่อง "ถึง"
  const [plannedPauses, setPlannedPauses] = useState<PausePeriodRecord[]>([]); // State เก็บรายการที่เพิ่มชั่วคราว
  const [canAddNewPeriod, setCanAddNewPeriod] = useState(true); // Flag ว่ายังเพิ่มช่วงใหม่ได้ไหม
  // --- ---

  // --- คำนวณอายุเริ่มต้นที่เป็นไปได้ครั้งถัดไป (พิจารณาจาก plannedPauses ล่าสุด) ---
  const firstPossibleStartAge = useMemo(() => {
    const lastEndAge = plannedPauses.length > 0 
      ? Math.max(...plannedPauses.map(p => p.endAge)) 
      : currentAge;
    
    // คำนวณอายุเริ่มต้นที่เป็นไปได้ โดยไม่ให้เกิน maxPossibleAge
    const calculatedStartAge = Math.max(lastEndAge + 1, currentAge + 1, 1);
    return Math.min(calculatedStartAge, maxPossibleAge);
  }, [plannedPauses, currentAge, maxPossibleAge]);
  // --- ---


  // --- Effect: ตั้งค่าเริ่มต้นเมื่อ Modal เปิด หรือ initialPlan เปลี่ยน ---
  useEffect(() => {
    if (isOpen) {
      const sortedInitialPlan = [...initialPlan].sort((a, b) => a.startAge - b.startAge);
      setPlannedPauses(sortedInitialPlan);
  
      const lastEndAge = sortedInitialPlan.length > 0 
        ? Math.max(...sortedInitialPlan.map(p => p.endAge)) 
        : currentAge;
      
      const defaultStartAge = Math.min(
        Math.max(lastEndAge + 1, currentAge + 1, 1),
        maxPossibleAge
      );
  
      setRefType('age');
      if (defaultStartAge > maxPossibleAge) { // เปลี่ยนจาก >= เป็น >
        setCanAddNewPeriod(false);
        setStartValue(maxPossibleAge);
        setEndValue(maxPossibleAge);
      } else {
        setCanAddNewPeriod(true);
        setStartValue(defaultStartAge);
        setEndValue(maxPossibleAge);
      }
    }
  }, [isOpen, initialPlan, currentAge, maxPossibleAge]);// ไม่ต้องใส่ Setter ใน Dependencies
  // --- ---


  // --- คำนวณ Options สำหรับ Dropdown ---
  // Options เริ่มต้น (ใช้ firstPossibleStartAge ที่คำนวณไว้)
  const startOptions = useMemo(() => {
    if (!canAddNewPeriod) return [];
    
    const start = Math.min(firstPossibleStartAge, maxPossibleAge);
    if (start >= maxPossibleAge) return []; // ใช้ >= แทน >
    
    if (refType === 'age') {
      return Array.from({ length: maxPossibleAge - start + 1 }, (_, i) => start + i);
    } else {
      const maxPolicyYear = maxPossibleAge - currentAge;
      const firstPossiblePolicyYear = Math.max(1, start - currentAge);
      return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
    }
  }, [firstPossibleStartAge, maxPossibleAge, currentAge, refType, canAddNewPeriod]);

  // Options สิ้นสุด
  const endOptions = useMemo(() => {
     if (!canAddNewPeriod) return [];
    // ค่าเริ่มต้นที่เป็นไปได้สำหรับ End (คำนวณเป็น Age ก่อน)
    const firstPossibleEndAge = refType === 'age' ? startValue : currentAge + startValue;
    if (firstPossibleEndAge > maxPossibleAge) return [];

    if (refType === 'age') {
      return Array.from({ length: maxPossibleAge - firstPossibleEndAge + 1 }, (_, i) => firstPossibleEndAge + i);
    } else { // 'year'
      const maxPolicyYear = maxPossibleAge - currentAge;
      const currentStartYear = refType === 'year' ? startValue : startValue - currentAge; // หาปีเริ่มต้นที่เลือก
      const firstPossibleEndYear = Math.max(1, currentStartYear, firstPossibleEndAge - currentAge);
      if (firstPossibleEndYear > maxPolicyYear) return [];
      return Array.from({ length: maxPolicyYear - firstPossibleEndYear + 1 }, (_, i) => firstPossibleEndYear + i);
    }
  }, [startValue, maxPossibleAge, currentAge, refType, canAddNewPeriod]);
  // --- ---


  // --- Handlers (แก้ไขให้ใช้ Setter ที่ถูกต้อง) ---
  const handleRefTypeChange = (value: string) => {
      const newRefType = value as 'age' | 'year';
      setRefType(newRefType);
      // Reset start/end value (ใช้ Setter โดยตรง)
      const defaultStartAge = firstPossibleStartAge;
      const finalMaxAge = maxPossibleAge > defaultStartAge ? maxPossibleAge : defaultStartAge;
      setStartValue(newRefType === 'age' ? defaultStartAge : Math.max(1, defaultStartAge - currentAge)); // <<< ใช้ setStartValue
      setEndValue(newRefType === 'age' ? finalMaxAge : Math.max(1, finalMaxAge - currentAge)); // <<< ใช้ setEndValue
  };

  const handleStartValueChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    setStartValue(numValue);
  
    // แปลงค่าเป็นอายุจริง
    const effectiveStartAge = refType === 'age' 
      ? numValue 
      : currentAge + numValue;
  
    // ไม่ต้องปรับ endValue อัตโนมัติ แต่ตรวจสอบว่าไม่น้อยกว่า startValue
    const currentEndAge = refType === 'age' 
      ? endValue 
      : currentAge + endValue;
  
    if (currentEndAge < effectiveStartAge) {
      const newEndValue = refType === 'age' 
        ? effectiveStartAge 
        : effectiveStartAge - currentAge;
      setEndValue(newEndValue);
    }
  };

  const handleEndValueChange = (value: string) => {
    setEndValue(parseInt(value, 10)); // <<< ใช้ Setter โดยตรง
  };

  // Handler ปุ่ม "+ เพิ่มช่วงเวลา"
  const handleAddPeriod = useCallback(() => {
    // แปลงค่าให้เป็นอายุจริง
    const startAge = refType === 'age' 
      ? startValue 
      : currentAge + startValue;
    
    const endAge = refType === 'age' 
      ? endValue 
      : currentAge + endValue;
  
    console.log('Adding period:', { startAge, endAge });
  
    // ตรวจสอบความถูกต้อง
    if (startAge >= endAge) {
      alert("อายุเริ่มต้นต้องน้อยกว่าอายุสิ้นสุด");
      return;
    }
  
    if (startAge > maxPossibleAge || endAge > maxPossibleAge) {
      alert(`สามารถหยุดพักได้สูงสุดถึงอายุ ${maxPossibleAge} ปี`);
      return;
    }
  
    // สร้าง record ใหม่
    const newPause: PausePeriodRecord = {
      id: uuidv4(),
      startAge,
      endAge,
      type: refType
    };
  
    // อัปเดตรายการ
    setPlannedPauses(prev => [...prev, newPause].sort((a, b) => a.startAge - b.startAge));
  
    // Reset form
    const nextStartAge = endAge + 1;
    if (nextStartAge <= maxPossibleAge) {
      setStartValue(refType === 'age' ? nextStartAge : nextStartAge - currentAge);
      setEndValue(refType === 'age' ? maxPossibleAge : maxPossibleAge - currentAge);
    } else {
      setCanAddNewPeriod(false);
    }
  }, [refType, startValue, endValue, currentAge, maxPossibleAge]);
  
  
  // Handler ปุ่มลบรายการล่าสุด
  const handleDeleteLastPeriod = useCallback(() => {
      if (plannedPauses.length > 0) {
          if (window.confirm("คุณต้องการลบรายการหยุดพักล่าสุดใช่หรือไม่?")) {
              const newList = plannedPauses.slice(0, -1);
              setPlannedPauses(newList);

              // Reset ค่าใน Form โดยใช้ Setter โดยตรง
              const lastEndAge = newList.length > 0 ? Math.max(...newList.map(p => p.endAge)) : currentAge;
              const nextStartAge = Math.max(firstPossibleStartAge, lastEndAge + 1); // ใช้ firstPossibleStartAge
              setStartValue(refType === 'age' ? nextStartAge : Math.max(1, nextStartAge-currentAge));
              setEndValue(refType === 'age' ? maxPossibleAge : Math.max(1, maxPossibleAge-currentAge));
              setCanAddNewPeriod(nextStartAge <= maxPossibleAge);
          }
      }
  }, [plannedPauses, setPlannedPauses, currentAge, refType, maxPossibleAge, firstPossibleStartAge, setStartValue, setEndValue]); // อัปเดต Dependencies

   // Handler ปุ่ม "บันทึก"
  const handleSavePlan = () => {
    onSave(plannedPauses); // ส่ง Array แผนทั้งหมดกลับ
  };
  // --- ---

  console.log('[PausePremiumModal Render] refType:', refType, 'startValue:', startValue, 'endValue:', endValue);
  console.log('[PausePremiumModal Render] firstPossibleStartAge:', firstPossibleStartAge);
  console.log('[PausePremiumModal Render] canAddNewPeriod:', canAddNewPeriod);
  console.log('[PausePremiumModal Render] startOptions:', JSON.stringify(startOptions));
  console.log('[PausePremiumModal Render] endOptions:', JSON.stringify(endOptions));



  // --- ส่วน JSX ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>หยุดพักชำระเบี้ย</DialogTitle>
        </DialogHeader>

        {/* ส่วนกรอกข้อมูล */}
        <div className="space-y-3 pt-4">
           <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className='text-sm text-gray-700 pb-1'>ตั้งแต่</span>
              {/* ประเภทอ้างอิง */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="ref-type-pause" className="text-xs sr-only">อ้างอิง</Label>
                <Select onValueChange={handleRefTypeChange} value={refType} disabled={!canAddNewPeriod}>
                  <SelectTrigger id="ref-type-pause" className="h-8 text-xs w-[80px]" disabled={!canAddNewPeriod}> <SelectValue /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                    <SelectItem value="year" className="text-xs">ปีที่</SelectItem> 
                  </SelectContent>
                </Select>
              </div>
              {/* เริ่มต้น */}
              <div className="flex flex-col space-y-1">
                 <Label htmlFor="start-value-pause" className="text-xs sr-only">{refType === 'age' ? 'เริ่มที่อายุ' : 'เริ่มปีที่'}</Label>
                 <Select onValueChange={handleStartValueChange} value={startValue.toString()} disabled={!canAddNewPeriod || startOptions.length === 0}>
                    <SelectTrigger id="start-value-pause" className="h-8 text-xs w-[80px]" disabled={!canAddNewPeriod || startOptions.length === 0}> <SelectValue /> </SelectTrigger>
                    <SelectContent>{startOptions.length > 0 ? startOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt} {refType === 'age' ? 'ปี' : ''}</SelectItem> ))  : ( <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">ไม่มีช่วงให้เลือก</div>)} </SelectContent>
                 </Select>
              </div>
              {/* ถึง */}
              <span className='text-sm text-gray-700 pb-1'>ถึง</span>
              <div className="flex flex-col space-y-1">
                  <Label htmlFor="end-value-pause" className="text-xs sr-only">{refType === 'age' ? 'ถึงอายุ' : 'ถึงปีที่'}</Label>
                  <Select onValueChange={handleEndValueChange} value={endValue.toString()} disabled={!canAddNewPeriod || endOptions.length === 0}>
                      <SelectTrigger id="end-value-pause" className="h-8 text-xs w-[80px]" disabled={!canAddNewPeriod || endOptions.length === 0}> <SelectValue /> </SelectTrigger>
                      <SelectContent>
                        {endOptions.length > 0 
                          ? endOptions.map(opt => (
                            <SelectItem key={opt} value={opt.toString()} className="text-xs">
                              {opt} {refType === 'age' ? 'ปี' : ''}
                            </SelectItem>
                            ))
                            : <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">
                            ไม่มีช่วงให้เลือก
                            </div>
                        }
                      </SelectContent>
                  </Select>
              </div>
              <span className="text-sm text-gray-700 pb-1">ปี</span>
              {/* ปุ่ม เพิ่มช่วงเวลา */}
              <div className="ml-auto">
                  <Button variant="outline" size="sm" onClick={handleAddPeriod} disabled={!canAddNewPeriod}>
                    <span className="flex items-center"> {/* ใช้ flex จัด Icon กับ Text ข้างใน span */}
                      <Plus size={16} className="mr-1"/>
                      เพิ่มช่วงเวลา
                    </span>
                  </Button>
              </div>
           </div>
           {/* Warning Messages (แก้ไขข้อความ) */}
           <div className="space-y-1 pt-2">
              <div className="flex items-center text-xs text-red-600">
                 <AlertCircle size={14} className="mr-1 flex-shrink-0"/>
                 {/* เอา Min Age ออก ถ้าไม่ต้องการ */}
                 <span>สามารถหยุดพักชำระเบี้ยได้ถึงอายุ {maxPossibleAge} ปี</span>
              </div>
               <div className="flex items-center text-xs text-red-600">
                  <AlertCircle size={14} className="mr-1 flex-shrink-0"/>
                  <span>การหยุดพักชำระเบี้ยจะส่งผลให้ไม่ได้รับ Bonus ในปีนั้นๆ</span>
               </div>
           </div>
        </div>
        {/* === จบ ส่วนกรอกข้อมูล === */}


        {/* === ส่วนสรุป/ประวัติ === */}
        <div className="border-t pt-3 mt-4">
           {/* ... โค้ดแสดง plannedPauses ... */}
           <div className='flex justify-between items-center mb-2'>
               <h3 className="font-medium text-sm">รายการหยุดพักชำระเบี้ย</h3>
               <span className='text-xs text-gray-500'>รายการทั้งหมด {plannedPauses.length}</span>
           </div>
            {!plannedPauses || plannedPauses.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีรายการ</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {plannedPauses.map((record, index) => {
                  const isLast = index === plannedPauses.length - 1;
      
                  // แปลงการแสดงผลตามประเภทการอ้างอิง
                  const displayText = record.type === 'age' 
                    ? `อายุ ${record.startAge}-${record.endAge} ปี`
                    : `ปีที่ ${record.startAge}-${record.endAge}`;
      
                  return (
                    <div 
                      key={record.id} 
                      className="grid grid-cols-[auto,1fr,auto] gap-2 items-center text-xs px-2 py-1 border rounded bg-gray-50"
                    >
                      <span className='font-mono text-gray-500'>{index + 1}.</span>
                      <span className='text-left text-gray-700'>
                        {displayText}
                      </span>
                      <div className="h-5 w-5 flex items-center justify-center">
                        {isLast && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-full w-full text-red-500 hover:text-red-700 hover:bg-red-100 p-0 flex-shrink-0" 
                            onClick={handleDeleteLastPeriod} 
                            title="ลบรายการล่าสุด"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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