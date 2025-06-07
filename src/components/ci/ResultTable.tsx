// src/components/ci/ResultTable.tsx (หรือ Path ที่คุณต้องการ)

// --- Imports ---
import { useState } from 'react';
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
import type { AnnualCiOutputRow, AnnualCiPremiumDetail } from '@/components/ci/types/useCiTypes';
import CITablePage from '@/pages/ci/CITablePage'; // 👈 1. Import คอมโพเนนต์ตารางที่คุณมีอยู่แล้ว

// --- กำหนด Props สำหรับตัวหุ้มนี้ ---
// เราต้องการ props ทั้งหมดที่ CITablePage ต้องการ + props สำหรับจัดการสถานะ
interface ResultTableProps {
    isLoading: boolean;
    error: string | null;
    result: AnnualCiOutputRow[] | null;
    ciPremiumsSchedule: AnnualCiPremiumDetail[] | null; // ชื่อ prop อาจต่างกัน ให้ตรงกับใน planner hook
    useIWealthy: boolean;
    iWealthyWithdrawalStartAge: number;
}

export default function ResultTable({ 
    isLoading, 
    error, 
    result, 
    ciPremiumsSchedule, 
    useIWealthy, 
    iWealthyWithdrawalStartAge
}: ResultTableProps) {
    const [showCiOnlyView, setShowCiOnlyView] = useState(false);

    // --- Logic การจัดการสถานะ ---

    // 2. ถ้ากำลังโหลด
    if (isLoading) {
        return <div className="flex items-center justify-center h-64">กำลังคำนวณ...</div>;
    }

    // 3. ถ้ามี Error
    if (error) {
        return <div className="flex items-center justify-center h-64 text-red-500">เกิดข้อผิดพลาด: {error}</div>;
    }

    // 4. ถ้ายังไม่มีผลลัพธ์ (ยังไม่กดคำนวณ หรือคำนวณแล้วไม่มีข้อมูล)
    if (!result || result.length === 0) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">กรุณากด 'คำนวณ' ในแท็บ 'กรอกข้อมูล' เพื่อดูผลลัพธ์</div>;
    }

    // 5. 🔥 ถ้าทุกอย่างปกติ (มีข้อมูล, ไม่โหลด, ไม่มี error)
    // ให้ Render คอมโพเนนต์ตารางของคุณ แล้วส่ง props ที่จำเป็นไปให้

    const toggleLabel = showCiOnlyView ? 'แสดงตาราง iWealthy' : 'แสดงตารางเบี้ย CI';

    return (
        <div className="space-y-4">
            {/* ส่วนสวิตช์ จะแสดงก็ต่อเมื่อใช้ iWealthy เท่านั้น */}
            {useIWealthy && (
                <div className="flex items-center justify-end space-x-2">
                    <Label htmlFor="view-toggle">{toggleLabel}</Label>
                    <Switch
                        id="view-toggle"
                        checked={showCiOnlyView}
                        onCheckedChange={setShowCiOnlyView}
                    />
                </div>
            )}

            {/* ส่ง state `showCiOnlyView` และ `iWealthyWithdrawalStartAge` ไปให้ CITablePage */}
            <CITablePage 
                resultData={result} 
                ciPremiumsScheduleData={ciPremiumsSchedule}
                useIWealthy={useIWealthy}
                showCiOnlyView={showCiOnlyView}
                withdrawalStartAge={iWealthyWithdrawalStartAge}
            />
        </div>
    );
}