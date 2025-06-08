// src/pages/ci/CiChartPage.tsx

import { useState, useMemo, useCallback } from 'react';

// --- Types ---
// 1. แก้ไข: import Type ที่จำเป็น
import type { UseCiPlannerReturn } from '@/components/ci/types/useCiTypes';
import type { CiChartDataType } from '@/components/ci/GraphComponentCI';

// --- Custom Components ---
import GraphComponentCI from '@/components/ci/GraphComponentCI';
import InfoBoxAndControlsCI from '@/components/ci/InfoBoxAndControlsCI';

// --- Component Definition ---
// 2. แก้ไข: เปลี่ยนการประกาศฟังก์ชันให้รับ props
export default function CiChartPage(props: UseCiPlannerReturn) {

    // 3. แก้ไข: ลบ useOutletContext และดึงค่าจาก props ที่รับเข้ามาแทน
    const {
        result,
        isLoading,
        error,
        policyholderEntryAge,
        useIWealthy // 👈 ดึง 'useIWealthy' ออกมาจาก props ตรงนี้
    } = props;

    // --- States for CI Graph ---
    const [hoveredCiData, setHoveredCiData] = useState<CiChartDataType | null>(null);
    const [showCiPremium, setShowCiPremium] = useState(true);
    const [showIWealthyPremium, setShowIWealthyPremium] = useState(true);
    const [showWithdrawal, setShowWithdrawal] = useState(true);
    const [showIWealthyAV, setShowIWealthyAV] = useState(true);
    const [showTotalDB, setShowTotalDB] = useState(false);
    const [currentAgeForInfoBox, setCurrentAgeInfoBox] = useState<number | undefined>(policyholderEntryAge);

    // --- Data Processing ---
    const chartDataFormatted: CiChartDataType[] = useMemo(() => {
        if (!result) return [];
        
        let cumCiPremium = 0, cumIWealthyPremium = 0, cumWithdrawal = 0;

        return result.map(row => {
            cumCiPremium += row.totalCiPackagePremiumPaid ?? 0;
            cumIWealthyPremium += row.iWealthyTotalPremium ?? 0;
            cumWithdrawal += row.iWealthyWithdrawal ?? 0;
            
            return {
                age: row.age,
                ciPremium: cumCiPremium,
                iWealthyPremium: cumIWealthyPremium,
                withdrawal: cumWithdrawal,
                iWealthyAV: row.iWealthyEoyAccountValue ?? 0,
                totalDB: row.totalCombinedDeathBenefit ?? 0,
            };
        });
    }, [result]);

    // --- Handlers & Helpers ---
    const initialDataForInfoBox = useMemo(() => {
        if (chartDataFormatted.length > 0) return chartDataFormatted[0];
        return { age: policyholderEntryAge, ciPremium: 0, iWealthyPremium: 0, withdrawal: 0, iWealthyAV: 0, totalDB: 0 };
    }, [chartDataFormatted, policyholderEntryAge]);

    const handleGraphAgeChange = useCallback((ageFromGraph: number | undefined) => {
        if (ageFromGraph === undefined) {
            setHoveredCiData(initialDataForInfoBox);
            setCurrentAgeInfoBox(policyholderEntryAge);
            return;
        }
        setCurrentAgeInfoBox(ageFromGraph);
        const dataPoint = chartDataFormatted.find(d => d.age === ageFromGraph);
        setHoveredCiData(dataPoint || null);
    }, [chartDataFormatted, initialDataForInfoBox, policyholderEntryAge]);

    const formatNumberForInfoBox = (num: number | undefined | null): string => {
        if (num === undefined || num === null || isNaN(num)) return '0 บาท';
        return `${Math.round(num).toLocaleString()} บาท`;
    };

    // --- Render Logic ---
    if (isLoading) return <div className="flex justify-center items-center h-full min-h-[400px]">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="flex justify-center items-center h-full min-h-[400px] text-red-600">เกิดข้อผิดพลาด: {error}</div>;
    if (!result || chartDataFormatted.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px] text-muted-foreground">
                <p>ไม่มีข้อมูลสำหรับแสดงผล กรุณากด "คำนวณ" ที่หน้ากรอกข้อมูล</p>
            </div>
        );
    }

    return (
        <div className="p-1 md:p-2 space-y-4">
            <div className="flex flex-col md:flex-row w-full h-[calc(100vh-250px)] min-h-[500px] gap-4">
                <div className="flex-grow md:w-3/4 border rounded-lg shadow-sm p-2">
                    <GraphComponentCI
                        data={chartDataFormatted}
                        setHoveredData={setHoveredCiData}
                        onAgeChange={handleGraphAgeChange}
                        showCiPremium={showCiPremium}
                        showIWealthyPremium={useIWealthy && showIWealthyPremium}
                        showWithdrawal={useIWealthy && showWithdrawal}
                        showIWealthyAV={useIWealthy && showIWealthyAV}
                        showTotalDB={showTotalDB}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    {/* 4. แก้ไข: ส่ง useIWealthy ที่ดึงมาจาก props ลงไป */}
                    <InfoBoxAndControlsCI
                        hoveredData={hoveredCiData}
                        initialData={initialDataForInfoBox}
                        currentAge={currentAgeForInfoBox}
                        formatNumber={formatNumberForInfoBox}
                        useIWealthy={useIWealthy}
                        showCiPremium={showCiPremium}
                        setShowCiPremium={setShowCiPremium}
                        showIWealthyPremium={showIWealthyPremium}
                        setShowIWealthyPremium={setShowIWealthyPremium}
                        showWithdrawal={showWithdrawal}
                        setShowWithdrawal={setShowWithdrawal}
                        showIWealthyAV={showIWealthyAV}
                        setShowIWealthyAV={setShowIWealthyAV}
                        showTotalDB={showTotalDB}
                        setShowTotalDB={setShowTotalDB}
                    />
                </div>
            </div>
        </div>
    );
}