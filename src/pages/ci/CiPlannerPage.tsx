// src/pages/ci/CiPlannerPage.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore'; 

// --- TYPE IMPORTS ---
import { calculateAllCiPremiumsSchedule } from '@/components/ci/utils/ciScheduleCalcs';
import type { AnnualCiPremiumDetail, UseCiPlannerReturn, CiPlanSelections, PolicyOriginMode } from '@/components/ci/types/useCiTypes';
import type { Gender } from '@/lib/calculations';

// --- UI & PAGE IMPORTS ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CIFormPage from './CIFormPage';
import CITablePage from './CITablePage';
import CiChartPage from './CiChartPage';
import CoverageSummaryPage from './CoverageSummaryPage';


export default function CiPlannerPage() {
    const [activeTab, setActiveTab] = useState('form');
    const store = useAppStore();
    const [ciPremiumsSchedule, setCiPremiumsSchedule] = useState<AnnualCiPremiumDetail[] | null>(null);

    useEffect(() => {
        const schedule = calculateAllCiPremiumsSchedule(
            store.ciPlanningAge,
            store.ciGender,
            store.ciPlanSelections,
            store.ciPolicyOriginMode,
            store.ciExistingEntryAge
        );
        setCiPremiumsSchedule(schedule);
    }, [store.ciPlanningAge, store.ciGender, store.ciPlanSelections, store.ciPolicyOriginMode, store.ciExistingEntryAge]);

    const wasLoading = useRef(false);
    useEffect(() => {
        if (wasLoading.current && !store.ciIsLoading && !store.ciError) {
            setActiveTab('table');
        }
        wasLoading.current = store.ciIsLoading;
    }, [store.ciIsLoading, store.ciError]);

    const wrappedSetters = {
        setPolicyholderEntryAge: useCallback((value: React.SetStateAction<number>) => {
            store.setCiPlanningAge(typeof value === 'function' ? value(store.ciPlanningAge) : value);
        }, [store.ciPlanningAge, store.setCiPlanningAge]),
        
        setPolicyholderGender: useCallback((value: React.SetStateAction<Gender>) => {
            store.setCiGender(typeof value === 'function' ? value(store.ciGender) : value);
        }, [store.ciGender, store.setCiGender]),
        
        setPolicyOriginMode: useCallback((value: React.SetStateAction<PolicyOriginMode>) => {
            store.setCiPolicyOriginMode(typeof value === 'function' ? value(store.ciPolicyOriginMode) : value);
        }, [store.ciPolicyOriginMode, store.setCiPolicyOriginMode]),

        setExistingPolicyEntryAge: useCallback((value: React.SetStateAction<number | undefined>) => {
            store.setCiExistingEntryAge(typeof value === 'function' ? value(store.ciExistingEntryAge) : value);
        }, [store.ciExistingEntryAge, store.setCiExistingEntryAge]),
        
        setSelectedCiPlans: useCallback((value: React.SetStateAction<CiPlanSelections>) => {
            store.setCiPlanSelections(typeof value === 'function' ? value(store.ciPlanSelections) : value);
        }, [store.ciPlanSelections, store.setCiPlanSelections]),
        
        setUseIWealthy: useCallback((value: React.SetStateAction<boolean>) => {
            store.setCiUseIWealthy(typeof value === 'function' ? value(store.ciUseIWealthy) : value);
        }, [store.ciUseIWealthy, store.setCiUseIWealthy]),
        
        setIWealthyMode: useCallback((value: React.SetStateAction<'manual' | 'automatic'>) => {
            store.setCiIWealthyMode(typeof value === 'function' ? value(store.ciIWealthyMode) : value);
        }, [store.ciIWealthyMode, store.setCiIWealthyMode]),

        setManualRpp: useCallback((value: React.SetStateAction<number>) => {
            store.setCiManualRpp(typeof value === 'function' ? value(store.ciManualRpp) : value);
        }, [store.ciManualRpp, store.setCiManualRpp]),

        setManualRtu: useCallback((value: React.SetStateAction<number>) => {
            store.setCiManualRtu(typeof value === 'function' ? value(store.ciManualRtu) : value);
        }, [store.ciManualRtu, store.setCiManualRtu]),
        
        setAutoRppRtuRatio: useCallback((value: React.SetStateAction<string>) => {
            store.setCiAutoRppRtuRatio(typeof value === 'function' ? value(store.ciAutoRppRtuRatio) : value);
        }, [store.ciAutoRppRtuRatio, store.setCiAutoRppRtuRatio]),

        setIWealthyInvestmentReturn: useCallback((value: React.SetStateAction<number>) => {
            const setter = store.ciIWealthyMode === 'manual' ? store.setCiManualInvReturn : store.setCiAutoInvReturn;
            const state = store.ciIWealthyMode === 'manual' ? store.ciManualInvReturn : store.ciAutoInvReturn;
            setter(typeof value === 'function' ? value(state) : value);
        }, [store.ciIWealthyMode, store.ciManualInvReturn, store.ciAutoInvReturn, store.setCiManualInvReturn, store.setCiAutoInvReturn]),

        setIWealthyOwnPPT: useCallback((value: React.SetStateAction<number>) => {
            const setter = store.ciIWealthyMode === 'manual' ? store.setCiManualPpt : store.setCiAutoPpt;
            const state = store.ciIWealthyMode === 'manual' ? store.ciManualPpt : store.ciAutoPpt;
            setter(typeof value === 'function' ? value(state) : value);
        }, [store.ciIWealthyMode, store.ciManualPpt, store.ciAutoPpt, store.setCiManualPpt, store.setCiAutoPpt]),
        
        // --- ADDED BACK: เพิ่มกลับเข้ามาเป็นฟังก์ชันว่างๆ เพื่อให้ Type ถูกต้อง ---
        setIWealthyWithdrawalStartAge: useCallback((value: React.SetStateAction<number>) => {
        console.log(`[CiPlannerPage] ได้รับค่าอายุ: ${value}, โหมดปัจจุบัน: ${store.ciIWealthyMode}`);
            // 1. ตรวจสอบโหมดที่กำลังใช้งานอยู่
        if (store.ciIWealthyMode === 'manual') {
            // 2. ถ้าเป็น Manual ให้บันทึกลง State ของ Manual
            store.setCiManualWithdrawalStartAge(typeof value === 'function' ? value(store.ciManualWithdrawalStartAge) : value);
        } else {
            // 3. ถ้าเป็น Auto ให้บันทึกลง State ของ Auto
            store.setCiAutoWithdrawalStartAge(typeof value === 'function' ? value(store.ciAutoWithdrawalStartAge) : value);
        }
    }, [
        // 4. เพิ่ม dependencies ที่จำเป็นทั้งหมด
        store.ciIWealthyMode, 
        store.ciManualWithdrawalStartAge, 
        store.setCiManualWithdrawalStartAge,
        store.ciAutoWithdrawalStartAge,
        store.setCiAutoWithdrawalStartAge
    ]),

        setCiUseCustomWithdrawalAge: useCallback((value: React.SetStateAction<boolean>) => {
        store.setCiUseCustomWithdrawalAge(typeof value === 'function' ? value(store.ciUseCustomWithdrawalAge) : value);
    }, [store.setCiUseCustomWithdrawalAge, store.ciUseCustomWithdrawalAge]),
    };
    
    const planner: UseCiPlannerReturn = {
        isLoading: store.ciIsLoading,
        error: store.ciError,
        result: store.ciResult,
        ciPremiumsSchedule: ciPremiumsSchedule,
        calculatedMinPremium: store.ciSolvedMinPremium,
        calculatedRpp: store.ciSolvedRpp,
        calculatedRtu: store.ciSolvedRtu,
        policyholderEntryAge: store.ciPlanningAge,
        policyholderGender: store.ciGender,
        policyOriginMode: store.ciPolicyOriginMode,
        existingPolicyEntryAge: store.ciExistingEntryAge,
        selectedCiPlans: store.ciPlanSelections,
        useIWealthy: store.ciUseIWealthy,
        iWealthyMode: store.ciIWealthyMode,
        iWealthyInvestmentReturn: store.ciIWealthyMode === 'manual' ? store.ciManualInvReturn : store.ciAutoInvReturn,
        iWealthyOwnPPT: store.ciIWealthyMode === 'manual' ? store.ciManualPpt : store.ciAutoPpt,
        // --- REMOVED: ค่านี้ไม่จำเป็นต้องส่งไปแล้ว เพราะ Logic อยู่ใน Backend ---
        // แต่ Type ยังต้องการอยู่ เราจึงส่งค่า placeholder ไป
        iWealthyWithdrawalStartAge: store.ciManualWithdrawalStartAge,
        manualRpp: store.ciManualRpp,
        manualRtu: store.ciManualRtu,
        autoRppRtuRatio: store.ciAutoRppRtuRatio,
        ciUseCustomWithdrawalAge: store.ciUseCustomWithdrawalAge,
        ...wrappedSetters,
        runCalculation: store.runCiCalculation,
    };
    
    return (
        <main className="container mx-auto space-y-4 bg-blue-50 text-foreground min-h-screen">
            <header className="text-center">
                <h1 className="pb-2 text-2xl font-extrabold tracking-tight lg:text-2xl bg-gradient-to-r from-blue-800 to-green-500 bg-clip-text text-transparent">
                    วางแผนประกันโรคร้ายแรงแบบยั่งยืน (LTCI)
                </h1>
                <p className="pb-2 text-lg font-bold tracking-tight lg:text-xl bg-gradient-to-r from-green-700 to-yellow-500 bg-clip-text text-transparent">LONG-TERM CRITICAL ILLNESS</p>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b -mb-1 bg-blue-50">
                    <TabsTrigger value="form" className="pb-2 mt-1 rounded-none rounded-t-md border-transparent border-x border-t data-[state=active]:bg-background data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:font-semibold">
                        กรอกข้อมูล
                    </TabsTrigger>
                    <TabsTrigger value="table" className="pb-2 mt-1 rounded-none rounded-t-md border-transparent border-x border-t data-[state=active]:bg-background data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:font-semibold">
                        ตารางผลลัพธ์
                    </TabsTrigger>
                    <TabsTrigger value="graph" className="pb-2 mt-1 rounded-none rounded-t-md border-transparent border-x border-t data-[state=active]:bg-background data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:font-semibold">
                        กราฟผลประโยชน์
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="pb-2 mt-1 rounded-none rounded-t-md border-transparent border-x border-t data-[state=active]:bg-background data-[state=active]:border-gray-300 dark:data-[state=active]:border-slate-700 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:font-semibold">
                        สรุปความคุ้มครอง
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="form" className="mt-0 rounded-b-md rounded-tr-md border bg-card p-6 shadow-sm">
                    <CIFormPage {...planner} />
                </TabsContent>
                <TabsContent value="table" className="mt-0 rounded-b-md rounded-tr-md border bg-card p-6 shadow-sm">
                    <CITablePage
                        isLoading={planner.isLoading}
                        error={planner.error}
                        result={planner.result}
                        ciPremiumsSchedule={planner.ciPremiumsSchedule}
                        useIWealthy={planner.useIWealthy}
                        // ไม่ต้องส่ง iWealthyWithdrawalStartAge ไปแล้ว
                    />
                </TabsContent>
                <TabsContent value="graph" className="mt-0 rounded-b-md rounded-tr-md border bg-card p-6 shadow-sm">
                    <CiChartPage {...planner} />
                </TabsContent>
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