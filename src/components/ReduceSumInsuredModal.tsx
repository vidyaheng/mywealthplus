// src/components/modals/ReduceSumInsuredModal.tsx

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Import Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { SumInsuredReductionRecord } from '@/lib/calculations';

// --- UI Component Imports ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from 'lucide-react';

// --- Helper Function ---
function getReductionMultipliers(age: number): { min: number; max: number } {
  if (age >= 1 && age <= 40) return { min: 40, max: 60 };
  if (age >= 41 && age <= 50) return { min: 30, max: 50 };
  if (age >= 51 && age <= 60) return { min: 20, max: 20 };
  if (age >= 61 && age <= 65) return { min: 15, max: 15 };
  if (age >= 66) return { min: 5, max: 5 };
  return { min: 0, max: 0 };
}

export default function ReduceSumInsuredModal() {
  // --- ดึง State และ Actions จาก useAppStore ---
  const {
    isReduceModalOpen,
    closeReduceModal,
    iWealthyRpp,
    iWealthyAge,
    iWealthySumInsuredReductions,
    setIWealthySumInsuredReductions,
    acknowledgeIWealthyReductionChanges,
    iWealthyReductionsNeedReview,
  } = useAppStore();
  
  const maxPossibleAge = 98;

  // --- Local State สำหรับฟอร์ม ---
  const [activeTab, setActiveTab] = useState("edit");
  const [refType, setRefType] = useState<'age' | 'year'>('age');
  const [selectedAge, setSelectedAge] = useState<number>(iWealthyAge + 1);
  const [amountInput, setAmountInput] = useState<string>("");
  const amountInputRef = useRef<HTMLInputElement>(null);

  // --- คำนวณค่าต่างๆ โดยอิงจาก Store State ---
  const multipliers = useMemo(() => getReductionMultipliers(selectedAge), [selectedAge]);
  const minAmount = useMemo(() => Math.round(iWealthyRpp * multipliers.min), [iWealthyRpp, multipliers.min]);
  const maxAmount = useMemo(() => Math.round(iWealthyRpp * multipliers.max), [iWealthyRpp, multipliers.max]);

  const startOptions = useMemo(() => {
    const lastReducedAge = iWealthySumInsuredReductions.length > 0 ? Math.max(...iWealthySumInsuredReductions.map(item => item.age)) : iWealthyAge;
    const firstPossibleStartAge = Math.max(lastReducedAge + 1, 1);
    if (firstPossibleStartAge > maxPossibleAge) return [];
    if (refType === 'age') {
      return Array.from({ length: maxPossibleAge - firstPossibleStartAge + 1 }, (_, i) => firstPossibleStartAge + i);
    } else { // 'year'
      const maxPolicyYear = maxPossibleAge - iWealthyAge + 1;
      const firstPossiblePolicyYear = firstPossibleStartAge - iWealthyAge + 1;
      if (firstPossiblePolicyYear > maxPolicyYear) return [];
      return Array.from({ length: maxPolicyYear - firstPossiblePolicyYear + 1 }, (_, i) => firstPossiblePolicyYear + i);
    }
  }, [iWealthyAge, maxPossibleAge, iWealthySumInsuredReductions, refType]);

  // --- Effects ---
  useEffect(() => {
    if (isReduceModalOpen) {
      const lastReducedAge = iWealthySumInsuredReductions.length > 0 ? Math.max(...iWealthySumInsuredReductions.map(item => item.age)) : iWealthyAge;
      const initialStartAgeValue = Math.max(lastReducedAge + 1, 1);
      setActiveTab('edit');
      setRefType('age');
      setSelectedAge(initialStartAgeValue);
    }
  }, [isReduceModalOpen, iWealthyAge]);

  useEffect(() => {
    setAmountInput(minAmount.toLocaleString('en-US'));
  }, [selectedAge, minAmount]);

  // --- Handlers (ฉบับสมบูรณ์) ---
  const handleRefTypeChange = (value: string) => {
    const newRefType = value as 'age' | 'year';
    setRefType(newRefType);
    const lastReducedAge = iWealthySumInsuredReductions.length > 0 ? Math.max(...iWealthySumInsuredReductions.map(item => item.age)) : iWealthyAge;
    const initialStartAgeValue = Math.max(lastReducedAge + 1, 1);
    setSelectedAge(initialStartAgeValue);
  };

  const handleStartValueChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (refType === 'age') {
        setSelectedAge(numValue);
    } else { // 'year'
        setSelectedAge(iWealthyAge + numValue - 1);
    }
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountInput(e.target.value);
  };

  const handleInputBlur = useCallback(() => {
    const numericValue = parseInt(amountInput.replace(/,/g, ''), 10) || 0;
    const clampedAmount = Math.max(minAmount, Math.min(maxAmount, numericValue));
    setAmountInput(clampedAmount.toLocaleString('en-US'));
  }, [minAmount, maxAmount, amountInput]);

  const handleUpdatePlan = useCallback(() => {
    const finalAmount = parseInt(amountInput.replace(/,/g, ''), 10) || 0;
    if (finalAmount < minAmount || finalAmount > maxAmount) {
      alert(`จำนวนเงินต้องอยู่ระหว่าง ${minAmount.toLocaleString()} และ ${maxAmount.toLocaleString()}`);
      return;
    }
    const currentList = iWealthySumInsuredReductions;
    const existingIndex = currentList.findIndex(r => r.age === selectedAge);
    const newList = [...currentList];
    const newRecord: SumInsuredReductionRecord = { 
      age: selectedAge, 
      newSumInsured: finalAmount,
      id: existingIndex > -1 ? newList[existingIndex].id : uuidv4()
    };
    if (existingIndex > -1) {
      newList[existingIndex] = newRecord;
    } else {
      newList.push(newRecord);
    }
    setIWealthySumInsuredReductions(newList.sort((a, b) => a.age - b.age));
    setActiveTab("history");
  }, [amountInput, selectedAge, minAmount, maxAmount, iWealthySumInsuredReductions, setIWealthySumInsuredReductions]);

  // --- จุดที่แก้ไข: ย้าย handleDeleteReduction ออกมาอยู่ข้างนอก ---
  const handleDeleteReduction = useCallback((id: string) => {
    if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      const newList = iWealthySumInsuredReductions.filter(r => r.id !== id);
      setIWealthySumInsuredReductions(newList);
    }
  }, [iWealthySumInsuredReductions, setIWealthySumInsuredReductions]);
  
  const handleConfirmChanges = () => {
    acknowledgeIWealthyReductionChanges();
    closeReduceModal();
  };


  return (
    <Dialog open={isReduceModalOpen} onOpenChange={(open) => !open && closeReduceModal()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-blue-700 text-2xl font-semibold">แก้ไขจำนวนเงินเอาประกันภัยฯ</DialogTitle>
          {/* +++ จุดที่แก้ไข: เพิ่มข้อความแจ้งเตือน +++ */}
          {iWealthyReductionsNeedReview && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-md border border-orange-200 dark:border-orange-800">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>แผนลดทุนถูกปรับค่าอัตโนมัติ กรุณาตรวจสอบและกดยืนยันที่หน้า "ประวัติการแก้ไข"</span>
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="edit" className="text-md data-[state=active]:text-blue-600 data-[state=active]:font-bold">แก้ไขทุนประกัน</TabsTrigger>
            <TabsTrigger value="history" className="text-md data-[state=active]:text-blue-600 data-[state=active]:font-bold">ประวัติการแก้ไข</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="space-y-3 pt-4 ml-4">
            <div className="text-sm font-medium text-gray-800">เพิ่ม/ลด จำนวนเงินเอาประกันภัยฯ</div>
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                <div className="flex flex-col space-y-1">
                    <Select onValueChange={handleRefTypeChange} value={refType}>
                        <SelectTrigger className="h-8 text-xs w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="age" className="text-xs">ที่อายุ</SelectItem>
                            <SelectItem value="year" className="text-xs">ปีที่</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col space-y-1">
                    <Label htmlFor="start-value" className="text-xs ml-2 whitespace-nowrap">{refType === 'age' ? 'เริ่มที่อายุ' : 'เริ่มปีที่'}</Label>
                    <Select onValueChange={handleStartValueChange} value={(refType === 'age' ? selectedAge : selectedAge - iWealthyAge + 1).toString()}>
                        <SelectTrigger id="start-value" className="h-8 text-xs w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {startOptions.map(opt => <SelectItem key={opt} value={opt.toString()} className="text-xs">{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="min-w-[180px] ml-auto">
                    <Label htmlFor="reduction-amount" className="text-xs mb-1 mr-2 block text-right">จำนวนเงินเอาประกันใหม่</Label>
                    <div className="flex items-center h-8">
                        <Input ref={amountInputRef} id="reduction-amount" type="text" inputMode="numeric" value={amountInput} onChange={handleAmountInputChange} onBlur={handleInputBlur} className="text-right h-full"/>
                        <span className="text-sm text-gray-700 bg-gray-50 h-full flex items-center px-3 border border-l-0 rounded-r-md">บาท</span>
                    </div>
                </div>
            </div>
            <div className="text-xs text-gray-500 text-right">
                (ขั้นต่ำ: {minAmount.toLocaleString('en-US')} / สูงสุด: {maxAmount.toLocaleString('en-US')} บาท)
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-4 min-h-[150px] max-h-60 overflow-y-auto border-t mt-2">
            <h3 className="mb-4 font-medium text-md text-blue-700">ประวัติการแก้ไข</h3>
            {iWealthySumInsuredReductions.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">ยังไม่มีข้อมูล</p>
            ) : (
              <ul className="space-y-1.5">
                {[...iWealthySumInsuredReductions].sort((a, b) => a.age - b.age).map((record, index, sortedHistory) => {
                  const endDisplayAge = sortedHistory[index + 1] ? sortedHistory[index + 1].age - 1 : maxPossibleAge;
                  const displayEndAge = Math.max(record.age, endDisplayAge);
                  const isLastRecord = index === sortedHistory.length - 1;
                  return (
                    <li key={record.id} className="flex justify-between items-center text-sm border-b pb-1 pr-1">
                      <span className='flex flex-1 items-center mr-2 gap-x-4'>
                        <span>ช่วงอายุ {record.age} - {displayEndAge} ปี:</span>
                        <span>ลดทุนเหลือ</span>
                        <span className="font-semibold text-red-500">{record.newSumInsured.toLocaleString('en-US')}</span>
                        <span>บาท</span>
                      </span>
                      {isLastRecord && record.id && (
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500" onClick={() => handleDeleteReduction(record.id as string)}>
                          <Trash2 className="h-4 w-4" />
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
              <Button type="button" variant="outline" size="sm" onClick={closeReduceModal}>ยกเลิก</Button>
              <Button type="button" size="sm" onClick={handleUpdatePlan} className="bg-blue-700 text-white">อัปเดตแผน</Button>
            </>
          )}
          {activeTab === 'history' && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("edit")}>แก้ไขเพิ่มเติม</Button>
              <Button type="button" size="sm" onClick={handleConfirmChanges} className="bg-blue-700 text-white">ยืนยัน</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
