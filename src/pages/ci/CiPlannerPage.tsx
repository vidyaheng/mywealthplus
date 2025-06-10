// src/pages/ci/CiPlannerPage.tsx

// --- Imports ---
import { useState } from 'react';
import { useCiPlanner } from '@/components/ci/hooks/useCiPlanner';
import type { UseCiPlannerReturn } from '@/components/ci/types/useCiTypes';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Page/Component Sections
import CIFormPage from './CIFormPage';
import CITablePage from './CITablePage';
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
        <main className="container mx-auto space-y-4 bg-blue-50 text-foreground min-h-screen">
            
            <header className="text-center">
                <h1 className="pb-2 text-2xl font-extrabold tracking-tight lg:text-2xl bg-gradient-to-r from-blue-800 to-green-500 bg-clip-text text-transparent">
                    วางแผนประกันโรคร้ายแรง (CI)
                </h1>
                <p className="pb-2 text-xl font-extrabold tracking-tight lg:text-xl bg-gradient-to-r from-green-700 to-yellow-500 bg-clip-text text-transparent">พร้อมทางเลือกชำระเบี้ยระยะสั้น</p>
            </header>

            {/* 🔥 โครงสร้างหลักที่ใช้ Tabs ควบคุม */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                {/* ส่วนหัวข้อของ Tab ทั้ง 4 */}
                <TabsList className="w-full justify-start rounded-none border-b -mb-1 bg-blue-50">
                    <TabsTrigger 
                    value="form" 
                    className="pb-2 mt-1 rounded-none rounded-t-md border-transparent border-x border-t data-[state=active]:bg-background data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:font-semibold"
                    >
                        กรอกข้อมูล
                    </TabsTrigger>
                    <TabsTrigger 
                    value="table"
                    className="pb-2 mt-1 rounded-none rounded-t-md border-transparent border-x border-t data-[state=active]:bg-background data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:font-semibold"
                    >
                        ตารางผลลัพธ์
                    </TabsTrigger>
                    <TabsTrigger 
                    value="graph"
                    className="pb-2 mt-1 rounded-none rounded-t-md border-transparent border-x border-t data-[state=active]:bg-background data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:font-semibold"
                    >
                        กราฟผลประโยชน์
                    </TabsTrigger>
                    <TabsTrigger 
                    value="summary"
                    className="pb-2 mt-1 rounded-none rounded-t-md border-transparent border-x border-t data-[state=active]:bg-background data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:font-semibold"
                    >
                        สรุปความคุ้มครอง
                    </TabsTrigger>
                </TabsList>

                {/* เนื้อหา Tab ที่ 1: ฟอร์ม */}
                <TabsContent value="form" className="mt-0 rounded-b-md rounded-tr-md border bg-card p-6 shadow-sm">
                    <CIFormPage {...planner} />
                </TabsContent>

                {/* เนื้อหา Tab ที่ 2: ตาราง */}
                <TabsContent value="table" className="mt-0 rounded-b-md rounded-tr-md border bg-card p-6 shadow-sm">
                    <CITablePage
                        isLoading={planner.isLoading}
                        error={planner.error}
                        result={planner.result}
                        ciPremiumsSchedule={planner.ciPremiumsSchedule}
                        useIWealthy={planner.useIWealthy}
                        iWealthyWithdrawalStartAge={planner.iWealthyWithdrawalStartAge}
                    />
                </TabsContent>

                {/* เนื้อหา Tab ที่ 3: กราฟ */}
                <TabsContent value="graph" className="mt-0 rounded-b-md rounded-tr-md border bg-card p-6 shadow-sm">
                    <CiChartPage {...planner} />
                </TabsContent>
                
                {/* เนื้อหา Tab ที่ 4: สรุป */}
                <TabsContent value="summary" className="mt-0 rounded-b-md rounded-tr-md border bg-card p-6 shadow-sm">
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