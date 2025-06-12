// src/pages/ci/CoverageSummaryPage.tsx

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

// --- Types ---
import type { UseCiPlannerReturn } from '@/components/ci/types/useCiTypes';

// --- Child Components ---
import ICareSummary from '@/components/ci/ICareSummary';
import IShieldSummary from '@/components/ci/IShieldSummary';
import DCISummary from '@/components/ci/DCISummary';
import RokRaiSoShieldSummary from '@/components/ci/RokRaiSoShieldSummary';
import { formatNumber } from '@/components/ci/utils/helpers';

// --- Props Interface ---
// เรา Pick เฉพาะ props ที่ Component นี้ต้องการใช้จริงๆ
type CoverageSummaryPageProps = Pick<
    UseCiPlannerReturn, 
    'isLoading' | 'error' | 'result' | 'selectedCiPlans' | 'policyholderEntryAge'
>;

// --- Component Definition ---
export default function CoverageSummaryPage({
    isLoading,
    error,
    result,
    selectedCiPlans,
    policyholderEntryAge
}: CoverageSummaryPageProps) {

    // --- State for Accordion UI ---
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Calculations for Grand Totals ---
    const summaryData = useMemo(() => {
        const { 
            lifeReadySA, mainRiderChecked, 
            icareChecked, icareSA, 
            ishieldChecked, ishieldSA, 
            dciChecked, dciSA, 
            rokraiPlan 
        } = selectedCiPlans;

        const totalLifeBenefit = (mainRiderChecked ? lifeReadySA : 0) +
            (icareChecked ? 100000 : 0) +
            (ishieldChecked ? ishieldSA : 0) +
            (dciChecked ? dciSA : 0);

        const ciMaxPossibleBenefit = (icareChecked ? icareSA * 5 : 0) +
            (ishieldChecked ? ishieldSA : 0) +
            (dciChecked ? dciSA : 0);
        
        const rokraiLifetimeLimit = { S: 1500000, M: 3000000, L: 9000000, XL: 30000000, '': 0, null: 0 }[rokraiPlan || ''];

        return { totalLifeBenefit, ciMaxPossibleBenefit, rokraiLifetimeLimit };
    }, [selectedCiPlans]);

    // --- Render Guards ---
    if (isLoading) {
        return <div className="flex justify-center items-center h-full min-h-[400px]">กำลังสรุปผล...</div>;
    }
    if (error) {
        return <div className="flex justify-center items-center h-full min-h-[400px] text-red-600">เกิดข้อผิดพลาด: {error}</div>;
    }
    if (!result) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px] text-muted-foreground">
                <p>ไม่มีข้อมูลสำหรับแสดงผล กรุณากด "คำนวณ" ที่หน้ากรอกข้อมูล</p>
            </div>
        );
    }
    
    // --- Data for Accordion Items ---
    const summaryItems = [
        { id: 'icare', label: 'iCare', checked: selectedCiPlans.icareChecked, maxBenefit: selectedCiPlans.icareSA * 5, component: <ICareSummary sumAssured={selectedCiPlans.icareSA} age={policyholderEntryAge} /> },
        { id: 'ishield', label: 'iShield', checked: selectedCiPlans.ishieldChecked, maxBenefit: selectedCiPlans.ishieldSA, component: <IShieldSummary sumAssured={selectedCiPlans.ishieldSA} /> },
        { id: 'rokrai', label: 'RokRaiSoShield', checked: selectedCiPlans.rokraiChecked, maxBenefit: summaryData.rokraiLifetimeLimit, isHealthRider: true, component: <RokRaiSoShieldSummary plan={selectedCiPlans.rokraiPlan} age={policyholderEntryAge} /> },
        { id: 'dci', label: 'DCI', checked: selectedCiPlans.dciChecked, maxBenefit: selectedCiPlans.dciSA, component: <DCISummary sumAssured={selectedCiPlans.dciSA} /> },
    ].filter(item => item.checked);

    return (
        <div className="space-y-8">
            {/* ส่วนที่ 1: สรุปรวมทั้งหมด */}
            <Card>
                <CardHeader>
                    <CardTitle>สรุปผลประโยชน์โดยรวม</CardTitle>
                    <CardDescription>ภาพรวมความคุ้มครองจากทุกสัญญาที่คุณเลือก</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm text-muted-foreground">รวมความคุ้มครองชีวิตทั้งหมด</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{formatNumber(summaryData.totalLifeBenefit)}</p>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm text-muted-foreground">รวมผลประโยชน์เงินก้อนโรคร้าย</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{formatNumber(summaryData.ciMaxPossibleBenefit)}</p>
                    </div>
                    {/* แสดง Card นี้ก็ต่อเมื่อเลือก RokRaiSoShield */}
                    {selectedCiPlans.rokraiChecked && (
                         <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-sm text-muted-foreground">วงเงินค่ารักษาโรคร้าย</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-lime-500 bg-clip-text text-transparent">{formatNumber(summaryData.rokraiLifetimeLimit)}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ส่วนที่ 2: สรุปย่อยแต่ละสัญญา (แบบ Accordion) */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">รายละเอียดความคุ้มครอง</h3>
                {summaryItems.length > 0 ? (
                    summaryItems.map(item => (
                        <div key={item.id} className="border rounded-md bg-background">
                            <button
                                onClick={() => toggleSection(item.id)}
                                className="w-full flex justify-between items-center p-4 text-left hover:bg-muted/50 transition-colors"
                            >
                                <div className="font-semibold">{item.label}</div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">
                                        {item.isHealthRider ? 'วงเงินสูงสุด ' : 'คุ้มครองสูงสุด '}
                                        <span className="font-bold text-foreground">{formatNumber(item.maxBenefit)}</span>
                                    </span>
                                    <ChevronDown className={clsx("h-5 w-5 text-muted-foreground transition-transform", expandedSections[item.id] && "rotate-180")} />
                                </div>
                            </button>
                            {expandedSections[item.id] && (
                                <div className="p-4 border-t">
                                    {item.component}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground text-center py-4">กรุณาเลือกสัญญาเพิ่มเติมในหน้า 'กรอกข้อมูล'</p>
                )}
            </div>
        </div>
    );
}