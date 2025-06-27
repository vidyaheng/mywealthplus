// src/pages/lthc/LthcChartPage.tsx (Refactored to use Zustand store)

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. ลบ import ที่ไม่ใช้ออกไป
// import { useOutletContext } from 'react-router-dom';
// import type { UseLthcPlannerReturn } from '../../hooks/useLthcTypes';

// 2. เพิ่ม import ของ useAppStore
import { useAppStore } from '../../stores/appStore';

// Import Custom Components
import GraphComponentLTHC, { type LthcChartDataType } from '../../components/GraphComponentLTHC';
import InfoBoxAndControlsLTHC from '../../components/InfoBoxAndControlsLTHC';
import { Button } from "@/components/ui/button";

export default function LthcChartPage() {
    // 3. เปลี่ยนจากการใช้ useOutletContext มาเป็น useAppStore
    const {
        result,
        isLoading,
        error,
        iWealthyMode,
        manualWithdrawalStartAge,
        policyholderEntryAge,
        autoIWealthyPPT,
    } = useAppStore();

    const navigate = useNavigate();

    // ไม่จำเป็นต้องมี if (!context) แล้ว เพราะ useAppStore จะมีข้อมูลเสมอ
    // if (!context) { ... }

    // States for LTHC Graph interactions and controls
    const [hoveredLthcData, setHoveredLthcData] = useState<LthcChartDataType | null>(null);
    const [showHealthPremiumAlone, setShowHealthPremiumAlone] = useState(true);
    const [showLthcCombinedPremium, setShowLthcCombinedPremium] = useState(true);
    const [showTotalCombinedDB, setShowTotalCombinedDB] = useState(false);
    const [showCumulativeWithdrawal, setShowCumulativeWithdrawal] = useState(true);
    const [showIWealthyAV, setShowIWealthyAV] = useState(false);
    const [currentAgeForInfoBox, setCurrentAgeInfoBox] = useState<number | undefined>(policyholderEntryAge);

    const withdrawalStartAge = useMemo(() => {
        if (iWealthyMode === 'manual') return manualWithdrawalStartAge;
        let startAge = 61;
        const iWealthyPTTEndAge = policyholderEntryAge + autoIWealthyPPT - 1;
        if (iWealthyPTTEndAge >= 60) startAge = iWealthyPTTEndAge + 1;
        return startAge;
    }, [iWealthyMode, manualWithdrawalStartAge, policyholderEntryAge, autoIWealthyPPT]);

    const chartDataFormatted: LthcChartDataType[] = useMemo(() => {
        if (!result) return [];
        let cumHealthAlone = 0, cumHealthUserLTHC = 0, cumIWPremium = 0, cumWithdrawal = 0;
        return result.map(row => {
            cumHealthAlone += (row.totalHealthPremium || 0);
            let healthPaidByUserThisYearInLTHC = 0;
            if (row.age < withdrawalStartAge) {
                healthPaidByUserThisYearInLTHC = (row.totalHealthPremium || 0);
            }
            cumHealthUserLTHC += healthPaidByUserThisYearInLTHC;
            cumIWPremium += (row.iWealthyTotalPremium || 0);
            cumWithdrawal += (row.iWealthyWithdrawal || 0);
            return {
                age: row.age,
                healthPremiumAlone: cumHealthAlone,
                lthcCombinedPremium: cumHealthUserLTHC + cumIWPremium,
                totalCombinedDeathBenefit: row.totalCombinedDeathBenefit || 0,
                cumulativeWithdrawal: cumWithdrawal,
                eoyAccountValue: row.iWealthyEoyAccountValue || 0,
            };
        });
    }, [result, withdrawalStartAge]);

    const initialDataForInfoBox = useMemo(() => {
        if (chartDataFormatted.length > 0) return chartDataFormatted[0];
        return { age: policyholderEntryAge, healthPremiumAlone: 0, lthcCombinedPremium: 0, totalCombinedDeathBenefit: 0, cumulativeWithdrawal: 0, eoyAccountValue: 0 };
    }, [chartDataFormatted, policyholderEntryAge]);

    const handleGraphAgeChange = useCallback((ageFromGraph: number | undefined) => {
        if (ageFromGraph === undefined) {
            setHoveredLthcData(initialDataForInfoBox);
            setCurrentAgeInfoBox(policyholderEntryAge);
            return;
        }
        setCurrentAgeInfoBox(ageFromGraph);
        const dataPoint = chartDataFormatted.find(d => d.age === ageFromGraph);
        setHoveredLthcData(dataPoint || null);
    }, [chartDataFormatted, initialDataForInfoBox, policyholderEntryAge]);

    const formatNumberForInfoBox = (num: number | undefined | null): string => {
        if (num === undefined || num === null || isNaN(num)) {
            return '0 บาท';
        }
        return `${Math.round(num).toLocaleString()} บาท`;
    };

    if (isLoading) return <div className="p-4 text-center">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="p-4 text-red-600">เกิดข้อผิดพลาด: {error}</div>;
    if (!result || chartDataFormatted.length === 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณากลับไปหน้ากรอกข้อมูลและกด "คำนวณ" เพื่อดูผลประโยชน์
                <Button onClick={() => navigate('/lthc/form')} className="ml-2">ไปหน้ากรอกข้อมูล</Button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-4 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-sky-700">
                    กราฟแสดงผลประโยชน์ LTHC
                </h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/lthc/table')}>
                        ไปที่ตาราง
                    </Button>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-700">
                    อายุผู้เอาประกันปัจจุบัน: {policyholderEntryAge} ปี |
                    ช่วงอายุในกราฟ: {chartDataFormatted[0]?.age} - {chartDataFormatted[chartDataFormatted.length - 1]?.age} ปี
                </p>
            </div>

            <div className="flex flex-col md:flex-row w-full h-[calc(100vh-280px)]">
                <div className="flex-grow md:w-3/4 border border-gray-300 rounded-md shadow-md p-1 overflow-hidden relative">
                    <div className="absolute inset-0">
                        <GraphComponentLTHC
                            data={chartDataFormatted}
                            setHoveredData={setHoveredLthcData}
                            showHealthPremiumAlone={showHealthPremiumAlone}
                            showLthcCombinedPremium={showLthcCombinedPremium}
                            showTotalCombinedDB={showTotalCombinedDB}
                            showCumulativeWithdrawal={showCumulativeWithdrawal}
                            showIWealthyAV={showIWealthyAV}
                            onAgeChange={handleGraphAgeChange}
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/4 md:pl-2 mt-4 md:mt-0">
                    <div className="rounded-md shadow-md bg-white h-full overflow-y-auto p-1">
                        <InfoBoxAndControlsLTHC
                            hoveredData={hoveredLthcData}
                            initialData={initialDataForInfoBox}
                            currentAge={currentAgeForInfoBox}
                            formatNumber={formatNumberForInfoBox}
                            showHealthPremiumAlone={showHealthPremiumAlone}
                            setShowHealthPremiumAlone={setShowHealthPremiumAlone}
                            showLthcCombinedPremium={showLthcCombinedPremium}
                            setShowLthcCombinedPremium={setShowLthcCombinedPremium}
                            showTotalCombinedDB={showTotalCombinedDB}
                            setShowTotalCombinedDB={setShowTotalCombinedDB}
                            showCumulativeWithdrawal={showCumulativeWithdrawal}
                            setShowCumulativeWithdrawal={setShowCumulativeWithdrawal}
                            showIWealthyAV={showIWealthyAV}
                            setShowIWealthyAV={setShowIWealthyAV}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};