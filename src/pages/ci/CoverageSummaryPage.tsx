// สร้างไฟล์ใหม่ เช่น src/pages/CoverageSummaryPage.tsx

import type { AnnualCiOutputRow, CiPlanSelections } from '@/components/ci/types/useCiTypes';
import ICareSummary from '@/components/ci/ICareSummary';
import IShieldSummary from '@/components/ci/IShieldSummary';
import DCISummary from '@/components/ci/DCISummary';
import RokRaiSoShieldSummary from '@/components/ci/RokRaiSoShieldSummary';
// import RokRaiSoShieldSummary from '@/components/ci/RokRaiSoShieldSummary';

interface CoverageSummaryPageProps {
    isLoading: boolean;
    error: string | null;
    result: AnnualCiOutputRow[] | null; // รับ result มาเผื่อเช็คว่าคำนวณแล้วหรือยัง
    selectedCiPlans: CiPlanSelections;
    policyholderEntryAge: number;
}

export default function CoverageSummaryPage({
    isLoading,
    error,
    result,
    selectedCiPlans,
    policyholderEntryAge
}: CoverageSummaryPageProps) {

    // ถ้ากำลังโหลด
    if (isLoading) {
        return <div className="flex items-center justify-center h-64">กำลังโหลดข้อมูลสรุป...</div>;
    }

    // ถ้ายังไม่มีผลลัพธ์ (ยังไม่กดคำนวณ)
    if (!result) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">กรุณากด 'คำนวณ' ในแท็บ 'กรอกข้อมูล' เพื่อดูสรุปความคุ้มครอง</div>;
    }

    // ถ้ามี Error
    if (error) {
        return <div className="flex items-center justify-center h-64 text-red-500">เกิดข้อผิดพลาด: {error}</div>;
    }

    // 🔥 ส่วนแสดงผลหลัก: ตรวจสอบแต่ละ plan ว่าถูกเลือกหรือไม่ แล้วแสดงผล
    return (
        <div className="space-y-6 mt-4">
            {selectedCiPlans.icareChecked && (
                <ICareSummary 
                    sumAssured={selectedCiPlans.icareSA} 
                    age={policyholderEntryAge} 
                />
            )}

            
            {selectedCiPlans.ishieldChecked && (
                <IShieldSummary sumAssured={selectedCiPlans.ishieldSA} />
            )}

            {selectedCiPlans.dciChecked && (
                <DCISummary sumAssured={selectedCiPlans.dciSA} />
            )}

            {selectedCiPlans.rokraiChecked && (
                 <RokRaiSoShieldSummary plan={selectedCiPlans.rokraiPlan} age={policyholderEntryAge} />
            )}
            
             <p className="text-center text-sm text-muted-foreground">นี่เป็นเพียงสรุปเบื้องต้น โปรดศึกษารายละเอียดทั้งหมดจากกรมธรรม์</p>
        </div>
    );
}