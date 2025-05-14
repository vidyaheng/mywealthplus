// src/components/ChangeFrequencyModal.tsx (แก้ไข Logic และปุ่มตาม Requirement)

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2 } from 'lucide-react';
// Import Type จาก App.tsx (ตรวจสอบ Path และการ Export)
import type { FrequencyChangeRecord } from '../lib/calculations';

// --- Props Interface ---
interface ChangeFrequencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChange: (data: Omit<FrequencyChangeRecord, 'id'>) => void;
  history: FrequencyChangeRecord[];
  onDeleteChange?: (id: string) => void; // ใช้ชื่อนี้ตามที่แก้ครั้งก่อน
  currentAge: number;
  maxPossibleAge?: number;
}

// Type และ Options สำหรับ Dropdown งวดการชำระ (เหมือนเดิม)
type PaymentFrequencyOption = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
const frequencyOptions: { value: PaymentFrequencyOption; label: string }[] = [
    { value: 'monthly', label: 'รายเดือน' },
    { value: 'quarterly', label: 'ราย 3 เดือน' },
    { value: 'semi-annual', label: 'ราย 6 เดือน' },
    { value: 'annual', label: 'ราย 1 ปี' },
];
// --- ---

// --- Component หลัก ---
export default function ChangeFrequencyModal({
  isOpen,
  onClose,
  onAddChange,
  history = [],
  onDeleteChange, // รับ Prop นี้เข้ามา
  currentAge,
  maxPossibleAge = 98,
}: ChangeFrequencyModalProps) {

  // --- State ---
  const [activeTab, setActiveTab] = useState("edit");
  const [newFrequency, setNewFrequency] = useState<PaymentFrequencyOption>('monthly');
  const [refType, setRefType] = useState<'age' | 'year'>('age');
  // State สำหรับอายุเริ่มต้น (จะถูก set ค่าเริ่มต้นที่ถูกต้องใน useEffect)
  const [startValue, setStartValue] = useState<number>(currentAge + 1);
  // State สำหรับอายุสิ้นสุด
  const [endValue, setEndValue] = useState<number>(maxPossibleAge);
  // --- ---

  // --- คำนวณอายุเริ่มต้นที่เป็นไปได้ (พิจารณาจาก history) ---
  const initialStartAge = useMemo(() => {
    if (history && history.length > 0) {
      // หา endAge สูงสุดในประวัติ
      const maxEndAge = Math.max(...history.map(item => item.endAge));
      // อายุเริ่มต้นคือ maxEndAge + 1 แต่อย่างน้อยต้องมากกว่า currentAge
      return Math.max(maxEndAge + 1, currentAge + 1);
    }
    // ถ้าไม่มีประวัติ ให้เริ่มที่ currentAge + 1
    return Math.max(currentAge + 1, 1); // ป้องกันกรณี currentAge < 0
  }, [history, currentAge]);
  // --- ---


  // --- Effect Reset ค่าเมื่อ Modal เปิด หรือกลับมา Tab Edit ---
  useEffect(() => {
    if (isOpen) {
      // คำนวณอายุเริ่มต้นใหม่ทุกครั้งที่เปิด หรือกลับมา Tab Edit
      const lastRecordedEndAge = history && history.length > 0 ? Math.max(...history.map(item => item.endAge)) : currentAge;
      const defaultStartAge = Math.max(lastRecordedEndAge + 1, currentAge + 1, 1); // อายุเริ่มต้นที่เป็นไปได้
      const finalMaxAge = maxPossibleAge > defaultStartAge ? maxPossibleAge : defaultStartAge;

      // ถ้าอยู่ Tab Edit หรือเพิ่งเปิด Modal ให้ Reset ค่า
      if (activeTab === 'edit') {
        setNewFrequency('monthly');
        setRefType('age');
        setStartValue(defaultStartAge);
        setEndValue(finalMaxAge);
      } else if (!activeTab) { // กรณีเปิดครั้งแรก
        setActiveTab('edit'); // เริ่มที่ Tab Edit
        setNewFrequency('monthly');
        setRefType('age');
        setStartValue(defaultStartAge);
        setEndValue(finalMaxAge);
      }
    }
  }, [isOpen, activeTab, currentAge, maxPossibleAge, history]); // เพิ่ม activeTab และ history ใน deps
  // --- ---


  // --- คำนวณ Options สำหรับ Dropdown (ใช้ initialStartAge) ---
  const startOptions = useMemo(() => {
    const firstPossibleStart = initialStartAge;
    if (firstPossibleStart > maxPossibleAge) return [];
    if (refType === 'age') {
      return Array.from({ length: maxPossibleAge - firstPossibleStart + 1 }, (_, i) => firstPossibleStart + i);
    } else { // refType === 'year'
      const maxPolicyYear = maxPossibleAge - currentAge;
      const firstPossiblePolicyYear = firstPossibleStart - currentAge;
      if (firstPossiblePolicyYear < 1 || firstPossiblePolicyYear > maxPolicyYear) return [];
      return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
    }
  }, [initialStartAge, maxPossibleAge, currentAge, refType]);

  const endOptions = useMemo(() => {
    const firstPossibleEnd = refType === 'age' ? startValue : currentAge + startValue; // หาอายุสิ้นสุดที่เป็นไปได้ขั้นต่ำ
    if (firstPossibleEnd > maxPossibleAge) return [];
    if (refType === 'age') {
      return Array.from({ length: maxPossibleAge - firstPossibleEnd + 1 }, (_, i) => firstPossibleEnd + i);
    } else { // refType === 'year'
       const maxPolicyYear = maxPossibleAge - currentAge;
       const firstPossibleEndYear = firstPossibleEnd - currentAge;
       if (firstPossibleEndYear < 1 || firstPossibleEndYear > maxPolicyYear) return [];
       return Array.from({ length: maxPolicyYear - firstPossibleEndYear + 1 }, (_, i) => firstPossibleEndYear + i);
    }
  }, [startValue, maxPossibleAge, currentAge, refType]);
  // --- ---


  // --- Handlers ---
  
  // อัปเดต State งวดที่เลือก
  const handleFrequencyChange = (value: string) => {
    setNewFrequency(value as PaymentFrequencyOption); 
  };
  // อัปเดต State ประเภทอ้างอิง
  const handleRefTypeChange = (value: string) => {
      const newRefType = value as 'age' | 'year';
      setRefType(newRefType); 
      // --- Reset อายุ/ปี เริ่มต้นและสิ้นสุด กลับไปเป็นค่า Default เมื่อเปลี่ยน Type ---
      // คำนวณอายุเริ่มต้นที่เป็นไปได้ (เหมือนใน useEffect)
      const lastRecordedEndAge = history && history.length > 0 ? Math.max(...history.map(item => item.endAge)) : currentAge;
      const defaultStartAge = Math.max(lastRecordedEndAge + 1, currentAge + 1, 1);
      const finalMaxAge = maxPossibleAge > defaultStartAge ? maxPossibleAge : defaultStartAge;

      // ถ้า Type ใหม่คือ 'age' ให้ set startValue เป็น defaultStartAge
      // ถ้า Type ใหม่คือ 'year' ให้ set startValue เป็น defaultStartAge - currentAge (ปีที่ 1, 2, ...)
      setStartValue(newRefType === 'age' ? defaultStartAge : Math.max(1, defaultStartAge - currentAge));

      // Reset ค่าสิ้นสุดเป็นค่า Max เสมอ (แปลงเป็น ปีที่ ถ้า Type เป็น year)
      setEndValue(newRefType === 'age' ? finalMaxAge : Math.max(1, finalMaxAge - currentAge));
      // --- จบการ Reset ---
  };

  // Handler ตอนเลือกค่าเริ่มต้น (อายุ หรือ ปีที่)
  const handleStartValueChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setStartValue(numValue); // อัปเดต state 'startValue' (เก็บเป็น อายุ หรือ ปีที่ ตามที่เลือก)

    // คำนวณอายุจริงที่สอดคล้องกับค่าเริ่มต้นใหม่
    const effectiveStartAge = refType === 'age' ? numValue : currentAge + numValue;
    // คำนวณอายุจริงที่สอดคล้องกับค่าสิ้นสุดปัจจุบัน
    // (endValue อาจจะเป็น อายุ หรือ ปีที่ อยู่ในขณะนั้น)
    const effectiveEndAge = refType === 'age' ? endValue : currentAge + endValue;

    // ถ้าค่าสิ้นสุด (อายุจริง) น้อยกว่าค่าเริ่มต้น (อายุจริง) ใหม่ ให้ Reset ค่าสิ้นสุด state
    if (effectiveEndAge < effectiveStartAge) {
        // หาค่า value สูงสุดของ End Select ตาม refType ปัจจุบัน
        const maxEndValue = refType === 'age' ? maxPossibleAge : Math.max(1, maxPossibleAge - currentAge);
        setEndValue(maxEndValue);
    }
  };

  // Handler ตอนเลือกค่าสิ้นสุด (อายุ หรือ ปีที่)
  const handleEndValueChange = (value: string) => {
    setEndValue(parseInt(value, 10)); // อัปเดต state 'endValue'
  };

  // Handler ปุ่ม "อัปเดตแผน"
  const handleUpdatePlan = useCallback(() => {
    const startAgeValue = refType === 'age' ? startValue : currentAge + startValue;
    const endAgeValue = refType === 'age' ? endValue : currentAge + endValue; // คำนวณ endAge ด้วย

    if (!newFrequency || !startValue || !endValue || startAgeValue > endAgeValue) {
      alert("กรุณาเลือกข้อมูลให้ครบถ้วน และช่วงอายุ/ปี ให้ถูกต้อง");
      return;
    }
    // TODO: Validate Overlaps with history

    const newData: Omit<FrequencyChangeRecord, 'id'> = {
      startAge: startAgeValue, // ส่งเป็น Age เสมอ
      endAge: endAgeValue,     // ส่งเป็น Age เสมอ
      frequency: newFrequency,
      type: refType,
    };
    onAddChange(newData);
    setActiveTab("history"); // <<< เปลี่ยนไป Tab ประวัติ
  }, [newFrequency, startValue, endValue, refType, onAddChange, setActiveTab, currentAge]); // เพิ่ม Dependencies

  // Handler ปุ่มลบประวัติ
  const handleDeleteClick = useCallback((id: string) => {
      if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?") && onDeleteChange) {
          onDeleteChange(id);
      }
  }, [onDeleteChange]);
  // --- ---

  // --- ส่วน JSX ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>เปลี่ยนงวดการชำระเบี้ยประกัน</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="edit" className="text-xs px-2">เลือกงวดการชำระ</TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-2">ประวัติการเปลี่ยนแปลง</TabsTrigger>
          </TabsList>

          {/* --- Tab 1: ฟอร์มแก้ไข --- */}
          <TabsContent value="edit" className="pt-4">

            <div className="flex flex-wrap items-end gap-x-3 gap-y-3"> {/* <<< ใช้ flex */}

                {/* กลุ่ม 1: เลือกงวดการชำระใหม่ */}
              <div className="flex flex-col space-y-1 min-w-[120px]">
                <Label htmlFor="new-frequency" className="text-xs whitespace-nowrap">เปลี่ยนงวดเป็น</Label>
                  <Select onValueChange={handleFrequencyChange} value={newFrequency}>
                    <SelectTrigger id="new-frequency" className="h-8 text-xs w-full"> <SelectValue /> </SelectTrigger>
                    <SelectContent>{frequencyOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>))}</SelectContent>
                  </Select>
              </div>

                {/* กลุ่ม 2: เลือกประเภทอ้างอิง */}
              <div className="flex flex-col space-y-1 min-w-[90px]">
                <Label htmlFor="ref-type" className="text-xs whitespace-nowrap">โดยอ้างอิง</Label>
                  <Select onValueChange={handleRefTypeChange} value={refType}>
                      <SelectTrigger id="ref-type" className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                        <SelectItem value="year" className="text-xs">ปีที่</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

                {/* กลุ่ม 3: เริ่มที่อายุ/ปี */}
              <div className="flex flex-col space-y-1 w-20">
                <Label htmlFor="start-value" className="text-xs whitespace-nowrap">{refType === 'age' ? 'เริ่มที่อายุ' : 'เริ่มปีที่'}</Label>
                <Select onValueChange={handleStartValueChange} value={(refType === 'age' ? startValue : startValue - currentAge).toString()}>
                  <SelectTrigger id="start-value" className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{startOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt} {refType === 'age' ? 'ปี' : ''}</SelectItem> ))}</SelectContent>
                </Select>
              </div>

                {/* กลุ่ม 4: ถึงอายุ/ปี */}
              <div className="flex flex-col space-y-1 w-20">
                <Label htmlFor="end-value" className="text-xs whitespace-nowrap">{refType === 'age' ? 'ถึงอายุ' : 'ถึงปีที่'}</Label>
                <Select onValueChange={handleEndValueChange} value={(refType === 'age' ? endValue : endValue - currentAge).toString()}>
                  <SelectTrigger id="end-value" className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{endOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt} {refType === 'age' ? 'ปี' : ''}</SelectItem>))}</SelectContent>
                </Select>
              </div>

            </div>
                {/* ^^^^^ ปิด Flex Container แนวนอน ^^^^^ */}
          </TabsContent>
              {/* === จบ Tab 1 === */}

          {/* --- Tab 2: ประวัติ --- */}
          <TabsContent value="history" className="pt-4 min-h-[150px] max-h-60 overflow-y-auto border-t mt-2">
             <h3 className="mb-2 font-medium text-sm">ประวัติการเปลี่ยนแปลง</h3>
             {!history || history.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีข้อมูล</p>
             ) : (
                 <ul className="space-y-1.5">
                     {/* เรียงตามอายุเริ่มต้น น้อยไปมาก */}
                     {[...history].sort((a, b) => a.startAge - b.startAge).map((record, index, sortedHistory) => { // <<< รับ index, sortedHistory
                          const freqLabel = frequencyOptions.find(f => f.value === record.frequency)?.label || record.frequency;
                          const typeLabel = record.type === 'age' ? 'อายุ' : 'ปีที่';
                          //const nextRecord = sortedHistory[index + 1];
                          //const endDisplayAge = nextRecord ? nextRecord.startAge - 1 : maxPossibleAge;
                          //const displayEndAge = Math.max(record.startAge, endDisplayAge); // ป้องกันอายุติดกัน
                          // เช็คว่าเป็นรายการสุดท้ายหรือไม่
                          const isLastRecord = index === sortedHistory.length - 1; // <<< เช็ครายการสุดท้าย

                          return (
                            <li key={record.id} className="flex justify-between items-center text-xs border-b pb-1 pr-1">
                                <span className='flex-1 mr-2'>
                                    {typeLabel} {record.startAge} - {record.endAge} ปี: <span className="font-semibold">{freqLabel}</span>
                                </span>
                                {/* VVVVV แสดงปุ่มลบเฉพาะรายการสุดท้าย VVVVV */}
                                {onDeleteChange && isLastRecord && (
                                    <Button variant="ghost" 
                                            size="icon" 
                                            className="h-5 w-5 text-red-500 hover:text-red-700 hover:bg-red-100 p-0 flex-shrink-0" 
                                            onClick={() => {
                                              if (record.id) { // <<< เพิ่มการตรวจสอบว่า record.id มีค่า (ไม่ใช่ undefined)
                                                  handleDeleteClick(record.id); // สมมติมี handleDeleteClick หรือเรียก onDeleteChange โดยตรง
                                              } else {
                                                  console.warn("Attempted to delete a record without an ID.", record);
                                              }
                                          }}
                                          // ปิดการใช้งานปุ่มถ้า record.id ไม่มีค่า
                                          disabled={!record.id}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                 )}
                                 {/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}
                            </li>
                          );
                     })}
                 </ul>
             )}
          </TabsContent>
          {/* === จบ Tab 2 === */}

        </Tabs>
        {/* Footer ของ Dialog (แก้ไขให้แสดงตาม Tab) */}
        <DialogFooter className="mt-4">
          {/* === ปุ่มสำหรับ Tab แก้ไข === */}
          {activeTab === 'edit' && (
            <>
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">ยกเลิก</Button>
              </DialogClose>
              <Button type="button" size="sm" onClick={handleUpdatePlan}>อัปเดตแผน</Button>
            </>
          )}
          {/* === ปุ่มสำหรับ Tab ประวัติ === */}
          {activeTab === 'history' && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("edit")}>
                แก้ไขเพิ่มเติม
              </Button>
              <Button type="button" size="sm" onClick={onClose}>
                ยืนยัน
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  // --- จบ ส่วน JSX ---
}
// --- จบ Component หลัก ---