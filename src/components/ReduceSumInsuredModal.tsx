// src/components/ReduceSumInsuredModal.tsx (แก้ไขให้เลือก อายุ/ปีที่ ได้)

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from 'lucide-react';


// Helper Function (เหมือนเดิม)
function getReductionMultipliers(age: number): { min: number; max: number } {
  // ... (logic เดิม) ...
  if (age >= 1 && age <= 40) return { min: 40, max: 60 };
  if (age >= 41 && age <= 50) return { min: 30, max: 50 };
  if (age >= 51 && age <= 60) return { min: 20, max: 20 };
  if (age >= 61 && age <= 65) return { min: 15, max: 15 };
  if (age >= 66) return { min: 5, max: 5 };
  return { min: 0, max: 0 };
}

interface ReductionHistoryRecord {
  id: string;       // ID ของรายการ (สร้างจาก App.tsx)
  age: number;      // อายุที่เริ่มลดทุน
  amount: number;   // จำนวนเงินเอาประกันหลังลด
}

interface ReduceSumInsuredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (reductionData: { age: number; amount: number }) => void;
  currentRpp: number;
  currentAge: number;
  currentSumInsured: number; // ลบออกถ้าไม่ได้ใช้แล้ว
  history?: ReductionHistoryRecord[];
  onDeleteReduction?: (id: string) => void;
  maxPossibleAge?: number;
}

export default function ReduceSumInsuredModal({
  isOpen,
  onClose,
  onUpdate,
  currentRpp,
  currentAge,
  // currentSumInsured,
  history = [],
  onDeleteReduction,
  maxPossibleAge = 98,
}: ReduceSumInsuredModalProps) {

  // --- State ---
  const [activeTab, setActiveTab] = useState("edit");
  const [refType, setRefType] = useState<'age' | 'year'>('age'); // <<< State ประเภทอ้างอิง
  const [selectedAge, setSelectedAge] = useState<number>(currentAge + 1); // <<< State หลักยังคงเก็บเป็น "อายุ"
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>("");
  const amountInputRef = useRef<HTMLInputElement>(null);
  // --- ---

  // --- คำนวณ Min/Max Amount (ใช้ selectedAge) ---
  const multipliers = useMemo(() => {
    // +++ LOGGING BEFORE getReductionMultipliers +++
    console.log(`[Multipliers Calc] selectedAge for getReductionMultipliers: ${selectedAge}`);
    const m = getReductionMultipliers(selectedAge);
    // +++ LOGGING AFTER getReductionMultipliers +++
    console.log(`[Multipliers Calc] Result from getReductionMultipliers for age ${selectedAge}:`, m);
    return m;
  }, [selectedAge]);

  const minAmount = useMemo(() => {
    const calculatedMin = Math.round(currentRpp * multipliers.min);
    // +++ LOGGING minAmount CALCULATION +++
    console.log(`[MinAmount Calc] currentRpp: ${currentRpp}, multipliers.min: ${multipliers.min}, calculatedMinAmount: ${calculatedMin}`);
    return calculatedMin;
  }, [currentRpp, multipliers.min]);

  const maxAmount = useMemo(() => {
    const calculatedMax = Math.round(currentRpp * multipliers.max);
    // +++ LOGGING maxAmount CALCULATION +++
    // console.log(`[MaxAmount Calc] currentRpp: ${currentRpp}, multipliers.max: ${multipliers.max}, calculatedMaxAmount: ${calculatedMax}`);
    return calculatedMax;
  }, [currentRpp, multipliers.max]);
  // --- ---

   // --- คำนวณ Options สำหรับ Dropdown เริ่มต้น (ตาม refType) ---
   const startOptions = useMemo(() => {
       const lastReducedAge = history && history.length > 0 ? Math.max(...history.map(item => item.age)) : currentAge;
       const firstPossibleStartAge = Math.max(lastReducedAge + 1, 1);

       if (firstPossibleStartAge > maxPossibleAge) return [];

       if (refType === 'age') {
           // สร้าง Options เป็น อายุ
           return Array.from({ length: maxPossibleAge - firstPossibleStartAge + 1 }, (_, i) => firstPossibleStartAge + i);
       } else { // refType === 'year'
           // สร้าง Options เป็น ปีที่ (1, 2, 3, ...)
           const maxPolicyYear = maxPossibleAge - currentAge;
           const firstPossiblePolicyYear = firstPossibleStartAge - currentAge;
           if (firstPossiblePolicyYear > maxPolicyYear) return [];
           return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
       }
   }, [currentAge, maxPossibleAge, history, refType]);
   // --- ---

   // --- Effect ตั้งค่า Default Amount ---
   useEffect(() => {
    if (isOpen) {
      const ageToUse = selectedAge;
      const currentMultipliers = getReductionMultipliers(ageToUse);
      const newMinAmount = Math.round(currentRpp * currentMultipliers.min);
      // +++ LOGGING IN DEFAULT AMOUNT EFFECT +++
      console.log(`[Default Amount Effect] ageToUse: ${ageToUse}, currentMultipliers:`, currentMultipliers, `newMinAmount for input: ${newMinAmount}`);
      setSelectedAmount(newMinAmount);
      setAmountInput(newMinAmount.toLocaleString('en-US'));
    }
  }, [selectedAge, currentRpp, isOpen]); // ทำงานเมื่อ อายุที่เลือก หรือ RPP เปลี่ยน (ตอน Modal เปิด)
  // --- ---

  // --- Effect Reset ค่าเมื่อ Modal เปิด / อายุตั้งต้นเปลี่ยน ---
   useEffect(() => {
    if (isOpen) {
       const lastReducedAge = history && history.length > 0 ? Math.max(...history.map(item => item.age)) : currentAge;
       const initialStartAgeValue = Math.max(lastReducedAge + 1, 1);
       setActiveTab('edit');
       setRefType('age'); // เริ่มต้นที่ อายุ เสมอ
       setSelectedAge(initialStartAgeValue); // ตั้งค่าอายุเริ่มต้น
    }
  }, [isOpen, currentAge]); // ทำงานเฉพาะตอน Modal เปิด หรือ อายุปัจจุบันเปลี่ยน
  
      // --- Effect: Reset selectedAge เมื่อสลับกลับมา Tab แก้ไข ---
    useEffect(() => {
      // ทำงานเฉพาะเมื่อ Tab เปลี่ยนเป็น 'edit' (หลังจากที่อาจจะไปดู History มา)
      if (activeTab === 'edit') {
        // คำนวณหาอายุเริ่มต้นที่เป็นไปได้ ณ ตอนนั้น (เหมือนตอนเปิด Modal)
        const lastReducedAge = history && history.length > 0 ? Math.max(...history.map(item => item.age)) : currentAge;
        const firstPossibleStartAge = Math.max(lastReducedAge + 1, 1);

        // ถ้าอายุที่เลือกไว้ปัจจุบัน น้อยกว่า อายุเริ่มต้นที่เป็นไปได้ ให้ Reset
        // หรืออาจจะ Reset ทุกครั้งที่กลับมา Tab edit ก็ได้ ถ้าต้องการให้เริ่มที่ค่าแรกเสมอ
        if (selectedAge < firstPossibleStartAge) {
           setSelectedAge(firstPossibleStartAge);
           // การเปลี่ยน selectedAge จะ trigger effect เดิมให้คำนวณ min/max/default amount ใหม่อยู่แล้ว
        }
        // ถ้าต้องการ Reset ทุกครั้ง ไม่ต้องมี if
        // setSelectedAge(firstPossibleStartAge);
      }
    // ใส่ dependencies ที่จำเป็น: activeTab และค่าที่ใช้คำนวณ firstPossibleStartAge
    }, [activeTab, currentAge, history, maxPossibleAge, selectedAge]); // เพิ่ม selectedAge ด้วย


  // --- Handlers ---
 

  // Handler เลือกประเภทอ้างอิง
  const handleRefTypeChange = (value: string) => {
      const newRefType = value as 'age' | 'year';
      setRefType(newRefType);
      // Reset อายุที่เลือก กลับไปเป็นค่าเริ่มต้นเสมอเมื่อเปลี่ยน Type
      const lastReducedAge = history && history.length > 0 ? Math.max(...history.map(item => item.age)) : currentAge;
      const initialStartAgeValue = Math.max(lastReducedAge + 1, 1);
      setSelectedAge(initialStartAgeValue);
  };

  // Handler เลือกค่าเริ่มต้น (อายุ หรือ ปีที่)
   const handleStartValueChange = (value: string) => {
      const numValue = parseInt(value, 10);
      if (refType === 'age') {
          setSelectedAge(numValue); // ถ้าเลือกอายุ ก็ set อายุโดยตรง
      } else { // refType === 'year'
          // ถ้าเลือกปีที่ ให้คำนวณอายุที่สอดคล้องแล้ว set อายุ
          setSelectedAge(currentAge + numValue -1);
      }
   };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... เหมือนเดิม ... */
     const rawValue = e.target.value;
     setAmountInput(rawValue);
     const numericValue = parseInt(rawValue.replace(/,/g, ''), 10);
     if(!isNaN(numericValue)){ setSelectedAmount(numericValue); }
     else if (rawValue === '') { setSelectedAmount(0); }
  };

  const handleInputBlur = useCallback(() => { /* ... เหมือนเดิม ... */
      const clampedAmount = Math.max(minAmount, Math.min(maxAmount, selectedAmount || 0));
      setSelectedAmount(clampedAmount);
      setAmountInput(clampedAmount.toLocaleString('en-US'));
  }, [minAmount, maxAmount, selectedAmount]);

  // Handler ปุ่ม "อัปเดตแผน" (ส่ง selectedAge กลับไป)
  const handleUpdatePlan = useCallback(() => {
    const finalAmount = Math.max(minAmount, Math.min(maxAmount, selectedAmount || 0));
     if (finalAmount < minAmount || finalAmount > maxAmount) { /* ... alert ... */ return; }
    onUpdate({ age: selectedAge, amount: finalAmount }); // ส่ง selectedAge เสมอ
    setActiveTab("history");
  }, [selectedAmount, selectedAge, minAmount, maxAmount, onUpdate, setActiveTab]);

  // Handler ปุ่มลบประวัติ
  const handleDeleteClick = useCallback((id: string) => {
      if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?") && onDeleteReduction) {
          onDeleteReduction(id);
      }
  }, [onDeleteReduction]);
  // --- ---

  // --- ส่วน JSX ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl"> {/* ขยาย Modal เล็กน้อย */}
        <DialogHeader>
          <DialogTitle
            className ="text-blue-700 text-2xl font-semibold"
            >    
              แก้ไขจำนวนเงินเอาประกันภัยฯ
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger 
              value="edit" 
              className="text-md px-2 data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:bg-white data-[state=active]:border-b-2"
              >
                แก้ไขจำนวนเงินเอาประกันภัยฯ
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="text-md px-2 data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:bg-white data-[state=active]:border-b-2"
              >
                ประวัติการแก้ไข
            </TabsTrigger>
          </TabsList>

          {/* === Tab 1: ฟอร์มแก้ไข (Layout แนวนอน) === */}
          <TabsContent value="edit" className="space-y-3 pt-4 ml-4">
            <div className="text-sm font-medium text-gray-800">เพิ่ม/ลด จำนวนเงินเอาประกันภัยฯ</div>

            {/* แถว Input แนวนอน */}
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">

              {/* 1. เลือกประเภทอ้างอิง */}
              <div className="flex flex-col space-y-1">
                {/*<Label htmlFor="ref-type" className="text-xs whitespace-nowrap">อ้างอิง</Label>*/}
                {/* เปิดใช้งาน Dropdown นี้ */}
                <Select onValueChange={handleRefTypeChange} value={refType}>
                  <SelectTrigger id="ref-type" className="h-8 text-xs w-[90px]"> <SelectValue /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                    <SelectItem value="year" className="text-xs">ปีที่</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2. เลือกอายุ/ปี เริ่มต้น */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="start-value" className="text-xs ml-2 whitespace-nowrap">{refType === 'age' ? 'เริ่มที่อายุ' : 'เริ่มปีที่'}</Label>
                {/* ค่า value ของ Select ต้องแปลงให้ถูกตาม refType */}
                <Select
                  onValueChange={handleStartValueChange}
                  value={(refType === 'age' ? selectedAge : selectedAge - currentAge +1).toString()}
                >
                  <SelectTrigger id="start-value" className="h-8 text-xs w-[90px]"> <SelectValue /> </SelectTrigger>
                  <SelectContent>
                    {startOptions.length > 0 ? startOptions.map(opt => (
                      <SelectItem key={opt} value={opt.toString()} className="text-xs">
                        {opt} {refType === 'age' ? 'ปี' : ''}
                      </SelectItem>
                    )) : <SelectItem value="" disabled>ไม่มีช่วงให้เลือก</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. จำนวนเงินเอาประกันใหม่ */}
              <div className="min-w-[180px] ml-auto">
                 <Label htmlFor="reduction-amount" className="text-xs mb-1 mr-2 block text-right">จำนวนเงินเอาประกันใหม่</Label>
                 <div className="flex items-center h-8">
                     <Input
                        ref={amountInputRef}
                        id="reduction-amount" type="text" inputMode="numeric"
                        value={amountInput} onChange={handleAmountInputChange} onBlur={handleInputBlur}
                        className="text-right h-full flex-1 rounded-l-md rounded-r-none border-r-0"
                        disabled={minAmount >= maxAmount && minAmount === 0}
                     />
                     <span className="text-sm text-gray-700 bg-gray-50 h-full flex items-center px-3 border border-gray-300 rounded-r-md border-l-0">บาท</span>
                 </div>
              </div>

              {/* --- ไม่มี Dropdown ถึงอายุ/ปีที่ แล้ว --- */}

            </div> {/* ปิดแถวแนวนอน */}

             {/* แสดง Min/Max ใต้แถว Input */}
             <div className="text-xs text-gray-500 text-right">
                (ขั้นต่ำ: {minAmount.toLocaleString('en-US')} / สูงสุด: {maxAmount.toLocaleString('en-US')} บาท)
             </div>
          </TabsContent>
          {/* === จบ Tab 1 === */}


            {/* --- Tab 2: ประวัติ --- */}
          <TabsContent value="history" className="pt-4 min-h-[150px] max-h-60 overflow-y-auto border-t mt-2">
            <h3 className="mb-4 font-medium text-md text-blue-700">ประวัติการแก้ไข (เพิ่ม/ลดทุนประกัน)</h3>
            {!history || history.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีข้อมูล</p>
            ) : (
                <ul className="space-y-1.5">
                  {/* 1. เรียงประวัติตามอายุเริ่มต้น */}
                  {[...history].sort((a, b) => a.age - b.age)
                     // 2. Map พร้อมรับ index และ array ที่เรียงแล้ว
                     .map((record, index, sortedHistory) => {
                          // 3. คำนวณอายุสิ้นสุดของช่วงนี้
                          const nextRecord = sortedHistory[index + 1]; // หา record ถัดไป
                          // ถ้ามี record ถัดไป ใช้ (อายุเริ่มของตัวถัดไป - 1) ถ้าไม่มี ใช้ maxPossibleAge
                          const endDisplayAge = nextRecord ? nextRecord.age - 1 : maxPossibleAge;
                          // ป้องกันกรณีอายุติดกัน เช่น ลดตอน 40 แล้วลดอีกที 41 (จะแสดง 40-40)
                          const displayEndAge = Math.max(record.age, endDisplayAge);
                          // VVVVV เพิ่มตัวแปรเช็ค VVVVV
                          const isLastRecord = index === sortedHistory.length - 1;

                          return (
                            <li key={record.id} className="flex justify-between items-center text-sm border-b pb-1 pr-1">
                                {/* 1. เพิ่ม flex, items-center และ gap-x-2 (หรือค่าอื่นที่ต้องการ) ที่ span ตัวแม่ */}
                                <span className='flex flex-1 items-center mr-2 gap-x-4'>
                                    {/* 2. ห่อแต่ละส่วนด้วย span */}
                                    <span>ช่วงอายุ</span>
                                    <span>{record.age} ปี - {displayEndAge} ปี:</span>                                                                
                                    <span>ลดทุนประกันเหลือ</span>
                                    <span className="font-semibold text-red-500">{record.amount.toLocaleString('en-US')}</span>
                                    <span>บาท</span>
                                </span>

                                {/* ปุ่มลบ */}
                                {onDeleteReduction && isLastRecord && (
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:text-red-700 hover:bg-red-100 p-0 flex-shrink-0" onClick={() => handleDeleteClick(record.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </li>
                          );
                  })}
                </ul>
            )}
          </TabsContent>
            {/* === จบ Tab 2 === */}

        </Tabs>
        {/* Footer ของ Dialog */}
        <DialogFooter className="mt-4">
          {/* === ปุ่มสำหรับ Tab แก้ไข === */}
          {activeTab === 'edit' && (
            <>
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">ยกเลิก</Button>
              </DialogClose>
              <Button 
                type="button" 
                size="sm" 
                onClick={handleUpdatePlan}
                className="bg-blue-700 text-white hover:bg-blue-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  อัปเดตแผน</Button>
            </>
          )}

          {/* === ปุ่มสำหรับ Tab ประวัติ === */}
          {activeTab === 'history' && (
            <>
              {/* ปุ่ม "แก้ไขเพิ่มเติม" (กลับไป Tab edit) */}
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("edit")}>
                แก้ไขเพิ่มเติม
              </Button>
              {/* ปุ่ม "ยืนยัน" (ปิด Modal) */}
              <Button type="button" size="sm" onClick={onClose} className ="bg-blue-700 text-white hover:bg-blue-500 text-white"> {/* <<< เรียก onClose prop */}
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