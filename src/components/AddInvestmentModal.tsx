// src/components/modals/AddInvestmentModal.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Store และ Types ---
import { useAppStore } from '@/stores/appStore';
import type { AddInvestmentRecord } from '@/lib/calculations';

// --- UI Component Imports ---
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Trash2, TrendingUp, Repeat, PiggyBank, Briefcase, PlusCircle } from 'lucide-react';

type InvestmentType = 'single' | 'annual';

// --- Sub-component: ปรับดีไซน์ให้เหมือนกับ Modal อื่นๆ ---
function InvestmentItem({ record, onDelete }: { record: AddInvestmentRecord; onDelete: (id: string | undefined) => void; }) {
  const isSingle = record.type === 'single';
  return (
    <div className="flex items-center justify-between p-2.5 bg-zinc-50 border rounded-lg hover:bg-zinc-100 transition-colors">
      <div className="flex items-center gap-3">
        {isSingle 
          ? <TrendingUp className="w-5 h-5 text-sky-500" /> 
          : <Repeat className="w-5 h-5 text-emerald-500" />}
        <div>
          <p className="font-medium text-xs text-zinc-800">
            ลงทุน <span className={isSingle ? 'text-sky-600' : 'text-emerald-600'}>{record.amount.toLocaleString()}</span> บาท
          </p>
          <p className="text-[11px] text-zinc-500">
            {isSingle ? `ตอนอายุ ${record.startAge} ปี` : `ช่วงอายุ ${record.startAge} - ${record.endAge} ปี`}
          </p>
        </div>
      </div>
      {record.id && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(record.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function AddInvestmentModal() {
  // --- Store & Local State (ไม่มีการเปลี่ยนแปลง) ---
  const { isAddInvestmentModalOpen, closeAddInvestmentModal, iWealthyAdditionalInvestments, iWealthyAge, setIWealthyAdditionalInvestments } = useAppStore();
  const maxPossibleAge = 98;
  const [plannedInvestments, setPlannedInvestments] = useState<AddInvestmentRecord[]>([]);
  const [investmentType, setInvestmentType] = useState<InvestmentType>('single');
  const [amount, setAmount] = useState('50000');
  const [startAge, setStartAge] = useState(iWealthyAge);
  const [endAge, setEndAge] = useState(maxPossibleAge);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // --- Logic (Memos, Effects, Handlers) - ไม่มีการเปลี่ยนแปลงในส่วน Logic ---
  const lastEndAge = useMemo(() => plannedInvestments.length > 0 ? Math.max(...plannedInvestments.map(p => p.endAge)) : iWealthyAge - 1, [plannedInvestments, iWealthyAge]);
  const startAgeOptions = useMemo(() => { const firstPossibleAge = lastEndAge + 1; if (firstPossibleAge > maxPossibleAge) return []; return Array.from({ length: maxPossibleAge - firstPossibleAge + 1 }, (_, i) => firstPossibleAge + i); }, [lastEndAge, maxPossibleAge]);
  const endAgeOptions = useMemo(() => { if (startAge >= maxPossibleAge) return []; return Array.from({ length: maxPossibleAge - startAge }, (_, i) => startAge + 1 + i); }, [startAge]);
  const canAdd = startAgeOptions.length > 0 && Number(amount) > 0;

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

  const handleAddInvestment = useCallback(() => {
    const numericAmount = Number(amount.replace(/,/g, '')) || 0;
    if (!canAdd || numericAmount <= 0) return;
    if (investmentType === 'annual' && startAge >= endAge) return;
    const newInvestment: AddInvestmentRecord = { id: uuidv4(), type: investmentType, amount: numericAmount, startAge, endAge: investmentType === 'single' ? startAge : endAge, refType: 'age' };
    const updatedPlan = [...plannedInvestments, newInvestment].sort((a, b) => a.startAge - b.startAge);
    setPlannedInvestments(updatedPlan);
    const lastPlanEndAge = investmentType === 'single' ? startAge : endAge;
    const nextStartAge = lastPlanEndAge + 1;
    if (nextStartAge <= maxPossibleAge) { setStartAge(nextStartAge); setEndAge(maxPossibleAge); }
  }, [amount, canAdd, endAge, investmentType, plannedInvestments, startAge]);

  const confirmDelete = useCallback(() => { if (!itemToDeleteId) return; setPlannedInvestments(prev => prev.filter(p => p.id !== itemToDeleteId)); setItemToDeleteId(null); }, [itemToDeleteId]);
  const handleSaveAndClose = () => { setIWealthyAdditionalInvestments(plannedInvestments); closeAddInvestmentModal(); };

  return (
    <>
      <Dialog open={isAddInvestmentModalOpen} onOpenChange={(open) => !open && closeAddInvestmentModal()}>
        {/* --- ปรับ Layout หลักให้เหมือนกัน --- */}
        <DialogContent className="sm:max-w-3xl grid grid-rows-[auto,1fr,auto] max-h-[90vh] rounded-2xl overflow-hidden border-2 border-slate-200">
          
          <DialogHeader className="p-4 bg-slate-50 border-b">
            <DialogTitle className="flex items-center text-base font-bold text-slate-800">
              <PiggyBank className="mr-2 h-5 w-5 text-emerald-600" />
              วางแผนการลงทุนเพิ่ม
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-x-6 bg-slate-100/50">
            
            {/* --- คอลัมน์ซ้าย: ฟอร์ม (ปรับให้กระชับ) --- */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-emerald-600"/>สร้างรายการลงทุน</h3>
              <div className="p-4 bg-white border rounded-xl space-y-3 shadow-md shadow-slate-200/50">
                
                {/* 1. ประเภทการลงทุน */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-slate-600">1. เลือกประเภท</Label>
                  <RadioGroup value={investmentType} onValueChange={(v) => setInvestmentType(v as InvestmentType)} className="grid grid-cols-2 gap-2">
                    <Label className={`flex items-center justify-center rounded-md border p-2 cursor-pointer transition-all ${investmentType === 'single' ? 'border-sky-500 bg-sky-50/70' : 'border-slate-200 hover:border-slate-300'}`}>
                      <RadioGroupItem value="single" className="sr-only" />
                      <TrendingUp className={`mr-2 h-4 w-4 ${investmentType === 'single' ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-medium text-slate-800">ครั้งเดียว</span>
                    </Label>
                    <Label className={`flex items-center justify-center rounded-md border p-2 cursor-pointer transition-all ${investmentType === 'annual' ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-200 hover:border-slate-300'}`}>
                      <RadioGroupItem value="annual" className="sr-only" />
                      <Repeat className={`mr-2 h-4 w-4 ${investmentType === 'annual' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-medium text-slate-800">ทุกปี</span>
                    </Label>
                  </RadioGroup>
                </div>
                
                {/* 2. จำนวนเงิน */}
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-normal text-slate-600">2. ระบุจำนวนเงิน</Label>
                  <div className="relative">
                    <Input id="amount" type="text" inputMode="numeric" 
                      value={Number(amount).toLocaleString()}
                      onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      className="pl-7 pr-8 h-9 text-xs" />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">฿</span>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">บาท</span>
                  </div>
                </div>

                {/* 3. ช่วงเวลา */}
                <div className="grid grid-cols-2 gap-x-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-age" className="text-xs font-normal text-slate-600">{investmentType === 'single' ? '3. ที่อายุ' : '3. ตั้งแต่อายุ'}</Label>
                    <Select value={startAge.toString()} onValueChange={(v) => setStartAge(Number(v))} disabled={!canAdd}>
                      <SelectTrigger id="start-age" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {startAgeOptions.map(age => <SelectItem key={age} value={age.toString()} className="text-xs">อายุ {age} ปี</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {investmentType === 'annual' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="end-age" className="text-xs font-normal text-slate-600">ถึงอายุ</Label>
                      <Select value={endAge.toString()} onValueChange={v => setEndAge(Number(v))} disabled={!canAdd}>
                        <SelectTrigger id="end-age" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {endAgeOptions.map(age => <SelectItem key={age} value={age.toString()} className="text-xs">อายุ {age} ปี</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button onClick={handleAddInvestment} disabled={!canAdd} className="w-full h-10 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">เพิ่มลงในแผน</Button>
              </div>
            </div>
            
            {/* --- คอลัมน์ขวา: รายการ --- */}
            <div className="space-y-2 lg:border-l lg:pl-6">
              <h3 className="font-semibold text-sm text-slate-800">แผนการลงทุนของคุณ</h3>
              {plannedInvestments.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-slate-400 h-full pt-8">
                  <Briefcase className="h-14 w-14 text-slate-300" />
                  <p className="mt-2 font-medium text-xs text-slate-500">เริ่มต้นสร้างแผนการลงทุน</p>
                  <p className="text-xs">เพิ่มรายการทางด้านซ้าย</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plannedInvestments.map(item => (
                    <InvestmentItem key={item.id} record={item} onDelete={() => setItemToDeleteId(item.id ?? null)} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-4 bg-slate-100 border-t">
            <Button type="button" variant="ghost" className="text-sm" onClick={closeAddInvestmentModal}>ยกเลิก</Button>
            <Button type="button" onClick={handleSaveAndClose} className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">บันทึกแผน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- AlertDialog (ปรับขนาด Font) --- */}
      <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">คุณต้องการลบรายการลงทุนนี้ออกจากแผนใช่หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="text-sm bg-red-600 hover:bg-red-700">ยืนยันการลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}