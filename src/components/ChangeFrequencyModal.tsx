// src/components/modals/ChangeFrequencyModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// +++ STEP 1: เปลี่ยนมา Import Store และ Types ที่ถูกต้อง +++
import { useAppStore } from '@/stores/appStore';
import type { FrequencyChangeRecord } from '@/lib/calculations';

// --- UI Component Imports (เหมือนเดิม) ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2 } from 'lucide-react';


// --- Type และ Options (เหมือนเดิม) ---
type PaymentFrequencyOption = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
const frequencyOptions: { value: PaymentFrequencyOption; label: string }[] = [
    { value: 'monthly', label: 'รายเดือน' },
    { value: 'quarterly', label: 'ราย 3 เดือน' },
    { value: 'semi-annual', label: 'ราย 6 เดือน' },
    { value: 'annual', label: 'ราย 1 ปี' },
];
type RefType = 'age' | 'year';


export default function ChangeFrequencyModal() {
  // +++ STEP 2: ดึง State และ Actions ทั้งหมดมาจาก useAppStore +++
  const {
    isChangeFreqModalOpen,
    closeChangeFreqModal,
    iWealthyFrequencyChanges,
    iWealthyAge,
    setIWealthyFrequencyChanges,
  } = useAppStore();
  
  const maxPossibleAge = 98;

  // --- Local State สำหรับฟอร์ม (เหมือนเดิม) ---
  const [activeTab, setActiveTab] = useState("edit");
  const [newFrequency, setNewFrequency] = useState<PaymentFrequencyOption>('monthly');
  const [refType, setRefType] = useState<RefType>('age');
  const [startValue, setStartValue] = useState<number>(iWealthyAge + 1);
  const [endValue, setEndValue] = useState<number>(maxPossibleAge);
  
  // +++ STEP 3: ปรับแก้ Hooks ให้ทำงานกับ Store State +++
  const initialStartAge = useMemo(() => {
    if (iWealthyFrequencyChanges.length > 0) {
      const maxEndAge = Math.max(...iWealthyFrequencyChanges.map(item => item.endAge));
      return Math.max(maxEndAge + 1, iWealthyAge + 1);
    }
    return Math.max(iWealthyAge + 1, 1);
  }, [iWealthyFrequencyChanges, iWealthyAge]);

  useEffect(() => {
    if (isChangeFreqModalOpen && activeTab === 'edit') {
      const defaultStartAge = initialStartAge;
      const finalMaxAge = maxPossibleAge > defaultStartAge ? maxPossibleAge : defaultStartAge;
      
      setNewFrequency('monthly');
      setRefType('age');
      setStartValue(defaultStartAge);
      setEndValue(finalMaxAge);
    }
  }, [isChangeFreqModalOpen, activeTab, initialStartAge, maxPossibleAge]);
  
  // +++ STEP 4: เติม Logic ใน useMemo และ Handlers ให้สมบูรณ์ +++
  const startOptions = useMemo(() => {
    if (initialStartAge > maxPossibleAge) return [];
    if (refType === 'age') {
      return Array.from({ length: maxPossibleAge - initialStartAge + 1 }, (_, i) => initialStartAge + i);
    } else { // 'year'
      const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
      const firstPossiblePolicyYear = Math.max(1, initialStartAge - iWealthyAge + 1);
      if (firstPossiblePolicyYear > maxPolicyYear) return [];
      return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
    }
  }, [initialStartAge, maxPossibleAge, iWealthyAge, refType]);
  
  const endOptions = useMemo(() => {
    const firstPossibleEnd = refType === 'age' ? startValue : iWealthyAge + startValue -1;
    if (firstPossibleEnd >= maxPossibleAge) return [maxPossibleAge];
    if (refType === 'age') {
        return Array.from({ length: maxPossibleAge - firstPossibleEnd + 1 }, (_, i) => firstPossibleEnd + i);
    } else { // 'year'
        const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
        const firstPossibleEndYear = Math.max(1, firstPossibleEnd - iWealthyAge + 2);
        if (firstPossibleEndYear > maxPolicyYear) return [];
        return Array.from({ length: maxPolicyYear - firstPossibleEndYear + 1 }, (_, i) => firstPossibleEndYear + i);
    }
  }, [startValue, maxPossibleAge, iWealthyAge, refType]);
  
  const handleFrequencyChange = (value: string) => setNewFrequency(value as PaymentFrequencyOption);
  const handleRefTypeChange = (value: string) => {
    const newRefType = value as 'age' | 'year';
    setRefType(newRefType);
    if (newRefType === 'age') {
        setStartValue(initialStartAge);
        setEndValue(maxPossibleAge);
    } else {
        setStartValue(Math.max(1, initialStartAge - iWealthyAge + 1));
        setEndValue(maxPossibleAge - iWealthyAge + 1);
    }
  };
  const handleStartValueChange = (value: string) => {
    const numVal = parseInt(value, 10);
    setStartValue(numVal);
    if(numVal > endValue) {
        setEndValue(numVal);
    }
  };
  const handleEndValueChange = (value: string) => setEndValue(parseInt(value, 10));

  const handleUpdatePlan = useCallback(() => {
    const startAgeValue = refType === 'age' ? startValue : iWealthyAge + startValue - 1;
    const endAgeValue = refType === 'age' ? endValue : iWealthyAge + endValue - 1;

    if (!newFrequency || !startValue || !endValue || startAgeValue >= endAgeValue) {
      alert("กรุณาเลือกข้อมูลให้ครบถ้วน และช่วงอายุ/ปี ให้ถูกต้อง");
      return;
    }
    
    const newRecord: FrequencyChangeRecord = {
      id: uuidv4(),
      startAge: startAgeValue,
      endAge: endAgeValue,
      frequency: newFrequency,
      type: 'age', // Save as age for consistency
    };

    const newList = [...iWealthyFrequencyChanges, newRecord].sort((a,b) => a.startAge - b.startAge);
    setIWealthyFrequencyChanges(newList);
    setActiveTab("history");

  }, [newFrequency, startValue, endValue, refType, iWealthyAge, iWealthyFrequencyChanges, setIWealthyFrequencyChanges]);

  const handleDeleteLastRecord = useCallback(() => {
    if (window.confirm("คุณต้องการลบรายการล่าสุดใช่หรือไม่?")) {
        const newList = iWealthyFrequencyChanges.slice(0, -1);
        setIWealthyFrequencyChanges(newList);
    }
  }, [iWealthyFrequencyChanges, setIWealthyFrequencyChanges]);


  return (
    <Dialog open={isChangeFreqModalOpen} onOpenChange={(open) => !open && closeChangeFreqModal()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>เปลี่ยนงวดการชำระเบี้ยประกัน</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="edit" className="text-xs px-2">เลือกงวดการชำระ</TabsTrigger>
                <TabsTrigger value="history" className="text-xs px-2">ประวัติการเปลี่ยนแปลง</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="pt-4">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
                <div className="flex flex-col space-y-1 min-w-[120px]">
                  <Label htmlFor="new-frequency" className="text-xs">เปลี่ยนงวดเป็น</Label>
                  <Select onValueChange={handleFrequencyChange} value={newFrequency}>
                    <SelectTrigger id="new-frequency" className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{frequencyOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1 min-w-[90px]">
                  <Label htmlFor="ref-type" className="text-xs">โดยอ้างอิง</Label>
                  <Select onValueChange={handleRefTypeChange} value={refType}>
                    <SelectTrigger id="ref-type" className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                      <SelectItem value="year" className="text-xs">ปีที่</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1 w-20">
                  <Label htmlFor="start-value" className="text-xs">{refType === 'age' ? 'เริ่มที่อายุ' : 'เริ่มปีที่'}</Label>
                  <Select onValueChange={handleStartValueChange} value={startValue.toString()}>
                    <SelectTrigger id="start-value" className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{startOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem> ))}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1 w-20">
                  <Label htmlFor="end-value" className="text-xs">{refType === 'age' ? 'ถึงอายุ' : 'ถึงปีที่'}</Label>
                  <Select onValueChange={handleEndValueChange} value={endValue.toString()}>
                    <SelectTrigger id="end-value" className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{endOptions.map(opt => ( <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="pt-4 min-h-[150px] max-h-60 overflow-y-auto border-t mt-2">
                <h3 className="mb-2 font-medium text-sm">ประวัติการเปลี่ยนแปลง</h3>
                {iWealthyFrequencyChanges.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีข้อมูล</p>
                ) : (
                    <ul className="space-y-1.5">
                        {iWealthyFrequencyChanges.map((record, index) => {
                            const isLastRecord = index === iWealthyFrequencyChanges.length - 1;
                            const freqLabel = frequencyOptions.find(f => f.value === record.frequency)?.label || record.frequency;
                            return (
                                <li key={record.id} className="flex justify-between items-center text-xs border-b pb-1 pr-1">
                                    <span className='flex-1 mr-2'>
                                        อายุ {record.startAge} - {record.endAge} ปี: <span className="font-semibold">{freqLabel}</span>
                                    </span>
                                    {isLastRecord && record.id && (
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:text-red-700" onClick={handleDeleteLastRecord}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </TabsContent>
        </Tabs>
        <DialogFooter className="mt-4">
          {activeTab === 'edit' && (
            <>
              {/* +++ จุดที่แก้ไข +++ */}
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">ยกเลิก</Button>
              </DialogClose>
              <Button type="button" size="sm" onClick={handleUpdatePlan}>อัปเดตแผน</Button>
            </>
          )}
          {activeTab === 'history' && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("edit")}>แก้ไขเพิ่มเติม</Button>
              {/* +++ จุดที่แก้ไข +++ */}
              <DialogClose asChild>
                <Button type="button" size="sm">ยืนยัน</Button>
              </DialogClose>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}