// src/pages/ci/CiPlannerPage.tsx

// --- Imports ---
import { useState } from 'react';
import { useCiPlanner } from '@/components/ci/hooks/useCiPlanner';
import type { UseCiPlannerReturn } from '@/components/ci/types/useCiTypes';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Page/Component Sections
import CIFormPage from './CIFormPage';
import ResultTable from '@/components/ci/ResultTable';
import CiChartPage from './CiChartPage'; // เราจะเรียกใช้หน้านี้ใน Tab กราฟ
import CoverageSummaryPage from './CoverageSummaryPage';


export default function CiPlannerPage() {
    
    // --- State Management ---
    // State สำหรับควบคุมว่า Tab ไหนกำลังทำงานอยู่
    const [activeTab, setActiveTab] = useState('form');

    // เรียกใช้ Hook หลัก และส่ง callback เพื่อสลับ Tab เมื่อคำนวณเสร็จ
    const planner: UseCiPlannerReturn = useCiPlanner({
        initialPolicyholderEntryAge: 30,
        initialPolicyholderGender: 'male',
        initialUseIWealthy: false,
        initialPolicyOriginMode: 'newPolicy',
        onCalculationComplete: () => setActiveTab('table'),
    });

    // --- Rendering ---
    return (
        <main className="container p-4 mx-auto space-y-8 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen">
            
            <header className="py-6 text-center">
                <h1 className="pb-2 text-4xl font-extrabold tracking-tight text-primary lg:text-5xl">
                    วางแผนประกันโรคร้ายแรง (CI)
                </h1>
                <p className="text-lg text-muted-foreground">พร้อมทางเลือกชำระเบี้ยด้วย iWealthy</p>
            </header>

            {/* 🔥 โครงสร้างหลักที่ใช้ Tabs ควบคุม */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                {/* ส่วนหัวข้อของ Tab ทั้ง 4 */}
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="form">กรอกข้อมูล</TabsTrigger>
                    <TabsTrigger value="table">ตารางผลลัพธ์</TabsTrigger>
                    <TabsTrigger value="graph">กราฟ</TabsTrigger>
                    <TabsTrigger value="summary">สรุปความคุ้มครอง</TabsTrigger>
                </TabsList>

                {/* เนื้อหา Tab ที่ 1: ฟอร์ม */}
                <TabsContent value="form">
                    <CIFormPage {...planner} />
                </TabsContent>

                {/* เนื้อหา Tab ที่ 2: ตาราง */}
                <TabsContent value="table">
                    <ResultTable
                        isLoading={planner.isLoading}
                        error={planner.error}
                        result={planner.result}
                        ciPremiumsSchedule={planner.ciPremiumsSchedule}
                        useIWealthy={planner.useIWealthy}
                        iWealthyWithdrawalStartAge={planner.iWealthyWithdrawalStartAge}
                    />
                </TabsContent>

                {/* เนื้อหา Tab ที่ 3: กราฟ */}
                <TabsContent value="graph">
                    <CiChartPage {...planner} />
                </TabsContent>
                
                {/* เนื้อหา Tab ที่ 4: สรุป */}
                <TabsContent value="summary">
                    <CoverageSummaryPage
                        isLoading={planner.isLoading}
                        error={planner.error}
                        result={planner.result}
                        selectedCiPlans={planner.selectedCiPlans} 
                        policyholderEntryAge={planner.policyholderEntryAge}
                    />
                </TabsContent>

            </Tabs>
        </main>
    );
}