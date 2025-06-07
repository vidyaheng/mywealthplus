// src/pages/CiPlannerPage.tsx

// --- 1. Imports ---
import { useState } from 'react';
import { useCiPlanner } from '@/components/ci/hooks/useCiPlanner';
import type { UseCiPlannerReturn } from '@/components/ci/types/useCiTypes';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Page/Component Sections
import CIFormPage from './CIFormPage';
import ResultTable from '@/components/ci/ResultTable';
import ResultGraph from '@/components/ci/ResultGraph';
import CoverageSummaryPage from './CoverageSummaryPage';


export default function CiPlannerPage() {
    
    // --- 2. State Management ---
    // State สำหรับควบคุมว่า Tab ไหนกำลังทำงานอยู่ เริ่มต้นที่ 'form'
    const [activeTab, setActiveTab] = useState('form');

    // เรียกใช้ Hook หลักที่จัดการ Logic ทั้งหมด
    // และส่ง callback 'onCalculationComplete' เข้าไป เพื่อให้ Hook เรียกกลับมาเมื่อคำนวณเสร็จ
    const planner: UseCiPlannerReturn = useCiPlanner({
        // ค่าเริ่มต้นต่างๆ
        initialPolicyholderEntryAge: 30,
        initialPolicyholderGender: 'male',
        initialUseIWealthy: false,
        initialPolicyOriginMode: 'newPolicy',
        // เมื่อคำนวณเสร็จ ให้เปลี่ยน Tab ไปที่ 'table'
        onCalculationComplete: () => setActiveTab('table'),
    });

    // ✨ 1. สร้างตัวแปรใหม่เพื่อหา "อายุที่เริ่มถอนที่ใช้จริง" ---
    // เราจะเพิ่ม Logic นี้เข้าไปก่อน return
    const effectiveWithdrawalStartAge = planner.iWealthyMode === 'automatic'
        ? planner.policyholderEntryAge + planner.iWealthyOwnPPT // กรณี Auto: คำนวณจากอายุ + ระยะจ่ายเบี้ย
        : planner.iWealthyWithdrawalStartAge;                 // กรณี Manual: ใช้ค่าจากฟอร์มโดยตรง

    // --- 3. Rendering ---
    return (
        <main className="container p-4 mx-auto space-y-8 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen">
            
            <header className="py-6 text-center">
                <h1 className="pb-2 text-4xl font-extrabold tracking-tight text-primary lg:text-5xl">
                    วางแผนประกันโรคร้ายแรง (CI)
                </h1>
                <p className="text-lg text-muted-foreground">พร้อมทางเลือกชำระเบี้ยด้วย iWealthy</p>
            </header>

            {/* โครงสร้างหลักที่ใช้ Tabs ควบคุม */}
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
                        iWealthyWithdrawalStartAge={effectiveWithdrawalStartAge}
                    />
                </TabsContent>

                {/* เนื้อหา Tab ที่ 3: กราฟ */}
                <TabsContent value="graph">
                    <ResultGraph
                        isLoading={planner.isLoading}
                        error={planner.error}
                        result={planner.result}
                    />
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