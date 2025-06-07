// src/components/ci/ResultGraph.tsx

// --- Imports ---
import type { AnnualCiOutputRow } from '@/components/ci/types/useCiTypes';
import CIGraphPage from '@/pages/ci/CIGraphPage'; // 👈 1. Import คอมโพเนนต์กราฟของคุณ

// --- กำหนด Props สำหรับตัวหุ้มนี้ ---
interface ResultGraphProps {
    isLoading: boolean;
    error: string | null;
    result: AnnualCiOutputRow[] | null;
}

export default function ResultGraph({ isLoading, error, result }: ResultGraphProps) {

    // --- Logic การจัดการสถานะ (เหมือนกับของตาราง) ---

    // 2. ถ้ากำลังโหลด
    if (isLoading) {
        return <div className="flex items-center justify-center h-96">กำลังสร้างกราฟ...</div>;
    }

    // 3. ถ้ามี Error
    if (error) {
        return <div className="flex items-center justify-center h-96 text-red-500">เกิดข้อผิดพลาด: {error}</div>;
    }

    // 4. ถ้ายังไม่มีผลลัพธ์
    if (!result || result.length === 0) {
        return <div className="flex items-center justify-center h-96 text-muted-foreground">กรุณากด 'คำนวณ' ในแท็บ 'กรอกข้อมูล' เพื่อดูกราฟ</div>;
    }

    // 5. 🔥 ถ้าทุกอย่างปกติ (มีข้อมูล)
    // ให้ Render คอมโพเนนต์กราฟของคุณ แล้วส่ง props ที่จำเป็น (resultData) ไปให้
    return (
        <CIGraphPage 
            resultData={result} 
        />
    );
}