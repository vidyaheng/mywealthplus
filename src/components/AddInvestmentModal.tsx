// src/components/modals/AddInvestmentModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { AddInvestmentRecord } from '@/lib/calculations';

// --- UI Component Imports (ปรับปรุงใหม่) ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Trash2, TrendingUp, Repeat, PiggyBank, Briefcase } from 'lucide-react';

// --- Type และ Options ---
type InvestmentType = 'single' | 'annual';

// --- Sub-component สำหรับแสดงรายการใน Timeline ---
function InvestmentItem({ record, onDelete }: { record: AddInvestmentRecord; onDelete: (id: string | undefined) => void; }) {
  const isSingle = record.type === 'single';
  return (
    <div className="flex items-start gap-4 p-4 bg-white border-l-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
         style={{ borderLeftColor: isSingle ? '#0ea5e9' : '#10b981' }}> {/* sky-500 or emerald-500 */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isSingle ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {isSingle ? <TrendingUp className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
      </div>
      <div className="flex-grow">
        <p className="font-bold text-lg text-slate-800">{record.amount.toLocaleString()} บาท</p>
        <p className="text-sm text-slate-600">
          {isSingle ? `ลงทุนครั้งเดียวตอนอายุ ${record.startAge} ปี` : `ลงทุนทุกปี ตั้งแต่อายุ ${record.startAge} - ${record.endAge} ปี`}
        </p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(record.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function AddInvestmentModal() {
  // --- Store State ---
  const {
    isAddInvestmentModalOpen,
    closeAddInvestmentModal,
    iWealthyAdditionalInvestments,
    iWealthyAge,
    setIWealthyAdditionalInvestments,
  } = useAppStore();

  const maxPossibleAge = 98;

  // --- Local State ---
  const [plannedInvestments, setPlannedInvestments] = useState<AddInvestmentRecord[]>([]);
  const [investmentType, setInvestmentType] = useState<InvestmentType>('single');
  const [amount, setAmount] = useState('50000');
  const [startAge, setStartAge] = useState(iWealthyAge);
  const [endAge, setEndAge] = useState(maxPossibleAge);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // --- Derived State & Memos ---
  const lastEndAge = useMemo(() =>
    plannedInvestments.length > 0 ? Math.max(...plannedInvestments.map(p => p.endAge)) : iWealthyAge - 1,
    [plannedInvestments, iWealthyAge]
  );

  const startAgeOptions = useMemo(() => {
    const firstPossibleAge = lastEndAge + 1;
    if (firstPossibleAge > maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - firstPossibleAge + 1 }, (_, i) => firstPossibleAge + i);
  }, [lastEndAge, maxPossibleAge]);

  const endAgeOptions = useMemo(() => {
    if (startAge >= maxPossibleAge) return [];
    return Array.from({ length: maxPossibleAge - startAge }, (_, i) => startAge + 1 + i);
  }, [startAge]);

  const canAdd = startAgeOptions.length > 0 && Number(amount) > 0;
  
  // --- Effects ---
  useEffect(() => {
    if (isAddInvestmentModalOpen) {
      const sortedPlan = [...iWealthyAdditionalInvestments].sort((a, b) => a.startAge - b.startAge);
      setPlannedInvestments(sortedPlan);
      const nextStartAge = (sortedPlan.length > 0 ? Math.max(...sortedPlan.map(p => p.endAge)) : iWealthyAge - 1) + 1;
      setStartAge(Math.min(nextStartAge, maxPossibleAge));
      setEndAge(maxPossibleAge);
      setAmount('50000');
      setInvestmentType('single');
    }
  }, [isAddInvestmentModalOpen, iWealthyAdditionalInvestments, iWealthyAge]);

  // --- Handlers ---
  const handleAddInvestment = useCallback(() => {
    const numericAmount = Number(amount) || 0;
    if (!canAdd || numericAmount <= 0) return;
    if (investmentType === 'annual' && startAge >= endAge) {
      alert("อายุเริ่มต้นต้องน้อยกว่าอายุสิ้นสุด"); return;
    }

    const newInvestment: AddInvestmentRecord = {
      id: uuidv4(),
      type: investmentType,
      amount: numericAmount,
      startAge: startAge,
      endAge: investmentType === 'single' ? startAge : endAge,
      refType: 'age',
    };
    const updatedPlan = [...plannedInvestments, newInvestment].sort((a, b) => a.startAge - b.startAge);
    setPlannedInvestments(updatedPlan);
    
    // Reset Form
    const lastPlanEndAge = investmentType === 'single' ? startAge : endAge;
    const nextStartAge = lastPlanEndAge + 1;
    if (nextStartAge <= maxPossibleAge) {
      setStartAge(nextStartAge);
      setEndAge(maxPossibleAge);
    }
  }, [amount, canAdd, endAge, investmentType, plannedInvestments, startAge]);

  const confirmDelete = useCallback(() => {
    if (!itemToDeleteId) return;
    setPlannedInvestments(prev => prev.filter(p => p.id !== itemToDeleteId));
    setItemToDeleteId(null);
  }, [itemToDeleteId]);

  const handleSaveAndClose = () => {
    setIWealthyAdditionalInvestments(plannedInvestments);
    closeAddInvestmentModal();
  };

  return (
    <>
      <Dialog open={isAddInvestmentModalOpen} onOpenChange={(open) => !open && closeAddInvestmentModal()}>
        <DialogContent className="sm:max-w-5xl grid grid-rows-[auto,1fr,auto] p-0 max-h-[90vh] rounded-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <PiggyBank className="mr-3 h-8 w-8 text-emerald-600" />
              วางแผนการลงทุนเพิ่ม
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              เพิ่มความมั่งคั่งด้วยการวางแผนลงทุนเพิ่มเติมได้ตามต้องการ ทั้งแบบครั้งเดียวหรือรายปี
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-x-2 bg-slate-100/60">
            {/* --- คอลัมน์ซ้าย: ฟอร์ม --- */}
            <div className="px-6 py-6 space-y-6">
              <div className="p-6 bg-white border rounded-xl space-y-6 shadow-sm">
                <RadioGroup value={investmentType} onValueChange={(v) => setInvestmentType(v as InvestmentType)} className="grid grid-cols-2 gap-4">
                  <Label className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${investmentType === 'single' ? 'border-sky-500 bg-sky-50 shadow-inner' : 'border-slate-200 hover:border-slate-300'}`}>
                    <RadioGroupItem value="single" id="single" className="sr-only" />
                    <TrendingUp className={`mb-2 h-8 w-8 ${investmentType === 'single' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-800">ลงทุนครั้งเดียว</span>
                  </Label>
                  <Label className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${investmentType === 'annual' ? 'border-emerald-500 bg-emerald-50 shadow-inner' : 'border-slate-200 hover:border-slate-300'}`}>
                    <RadioGroupItem value="annual" id="annual" className="sr-only" />
                    <Repeat className={`mb-2 h-8 w-8 ${investmentType === 'annual' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-800">ลงทุนทุกปี</span>
                  </Label>
                </RadioGroup>
                
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-semibold text-slate-700">จำนวนเงินลงทุน</Label>
                  <div className="relative">
                    <Input id="amount" type="text" inputMode="numeric" value={Number(amount).toLocaleString()} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="50,000" className="pl-7 h-12 text-lg"/>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 font-sans">฿</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-slate-700">{investmentType === 'single' ? 'ลงทุนเมื่ออายุ' : 'ช่วงเวลาลงทุน'}</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      {investmentType === 'annual' && <Label htmlFor="start-age" className="text-sm">ตั้งแต่</Label>}
                      <Select value={startAge.toString()} onValueChange={(v) => setStartAge(Number(v))} disabled={!canAdd}>
                        <SelectTrigger id="start-age" className="h-11"><SelectValue/></SelectTrigger>
                        <SelectContent>{startAgeOptions.map(age => <SelectItem key={age} value={age.toString()}>อายุ {age} ปี</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {investmentType === 'annual' && (
                      <>
                        <span className="pt-6 text-slate-500">-</span>
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="end-age" className="text-sm">ถึง</Label>
                          <Select value={endAge.toString()} onValueChange={v => setEndAge(Number(v))} disabled={!canAdd}>
                            <SelectTrigger id="end-age" className="h-11"><SelectValue/></SelectTrigger>
                            <SelectContent>{endAgeOptions.map(age => <SelectItem key={age} value={age.toString()}>อายุ {age} ปี</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Button onClick={handleAddInvestment} disabled={!canAdd} size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-base font-bold">เพิ่มลงในแผนลงทุน</Button>
              </div>
            </div>

            {/* --- คอลัมน์ขวา: ไทม์ไลน์ --- */}
            <div className="px-6 py-6 space-y-4 lg:border-l lg:bg-white/70">
              <h3 className="font-semibold text-lg text-slate-800">แผนการลงทุนของคุณ</h3>
              {plannedInvestments.length === 0 ? (
                <div className="text-center text-slate-400 pt-16 h-full flex flex-col items-center justify-center">
                  <Briefcase className="h-20 w-20 text-slate-300" />
                  <p className="mt-4 font-medium text-slate-500">เริ่มต้นสร้างแผนการลงทุน</p>
                  <p className="text-sm">เพิ่มรายการลงทุนทางด้านซ้าย</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plannedInvestments.map(item => (
                    <InvestmentItem key={item.id} record={item} onDelete={() => setItemToDeleteId(item.id ?? null)} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-6 bg-slate-100 border-t">
            <Button type="button" variant="ghost" onClick={closeAddInvestmentModal}>ยกเลิก</Button>
            <Button type="button" onClick={handleSaveAndClose} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">บันทึกแผน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการลบรายการลงทุนนี้ออกจากแผนใช่หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">ยืนยันการลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}