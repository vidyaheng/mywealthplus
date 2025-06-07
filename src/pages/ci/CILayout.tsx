// src/components/ci/CILayout.tsx
'use client'; // ใน Vite ไม่จำเป็นต้องมี แต่ใส่ไว้ได้

import { useState } from 'react';
// import type ที่จำเป็นสำหรับการกำหนด props
import type { AnnualCiOutputRow, AnnualCiPremiumDetail } from '@/components/ci/types/useCiTypes'; // ปรับ path

// import Components ที่ต้องใช้
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CITablePage from './CITablePage';
import { ErrorIcon, InfoIcon } from '@/components/ci/utils/helpers'; // ปรับ path

// 1. สร้าง Interface เพื่อกำหนด "หน้าตา" ของ props ที่จะรับเข้ามา
interface CILayoutProps {
    result: AnnualCiOutputRow[] | null;
    isLoading: boolean;
    error: string | null;
    ciPremiumsSchedule: AnnualCiPremiumDetail[] | null;
    useIWealthy: boolean;
}

// 2. แก้ไขฟังก์ชันให้รับ props และใช้ Destructuring เพื่อดึงค่าออกมาใช้งาน
export default function CILayout({ result, isLoading, error, ciPremiumsSchedule, useIWealthy }: CILayoutProps) {
    const [activeTab, setActiveTab] = useState('table');

    // 3. ใช้ props ที่รับเข้ามาเพื่อควบคุมการแสดงผล
    if (isLoading) {
        return <div className="mt-8 text-center p-10"><p>กำลังคำนวณ...</p></div>;
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mt-8">
                <ErrorIcon />
                <AlertTitle>เกิดข้อผิดพลาด!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if (!result) {
        return null; // ยังไม่กดคำนวณ ไม่ต้องแสดงอะไร
    }

    if (result.length === 0) {
        return (
            <Alert variant="default" className="mt-8 bg-sky-50 text-sky-800 border-sky-200">
                <InfoIcon /> {/* <--- InfoIcon ถูกใช้งานที่นี่ */}
                <AlertTitle>ไม่พบข้อมูล</AlertTitle>
                <AlertDescription>
                    ไม่พบข้อมูลผลประโยชน์ประกอบการขายสำหรับเงื่อนไขที่เลือก
                </AlertDescription>
            </Alert>
        );
    }
    return (
        <div className="mt-8 space-y-8">
            <h2 className="pb-2 text-2xl font-semibold border-b-2 border-primary">ภาพประกอบการขาย</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="table">ตาราง</TabsTrigger>
                    <TabsTrigger value="graph">กราฟ</TabsTrigger>
                    <TabsTrigger value="coverage">ความคุ้มครอง</TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                    <CITablePage 
                        resultData={result} 
                        ciPremiumsScheduleData={ciPremiumsSchedule} 
                        useIWealthy={useIWealthy} 
                    />
                </TabsContent>
                <TabsContent value="graph">
                    <p className="p-10 text-center text-muted-foreground">ส่วนนี้สำหรับแสดงกราฟในอนาคต</p>
                </TabsContent>
                <TabsContent value="coverage">
                    <p className="p-10 text-center text-muted-foreground">ส่วนนี้สำหรับแสดงรายละเอียดความคุ้มครอง</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}