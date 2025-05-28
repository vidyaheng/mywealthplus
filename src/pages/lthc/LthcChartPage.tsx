// src/pages/lthc/LthcChartPage.tsx
import { useState, useMemo, useCallback } from 'react'; // เพิ่ม useCallback ถ้า onAgeChange ต้อง memoized
import { useOutletContext, useNavigate } from 'react-router-dom';
import type {
    UseLthcPlannerReturn,
    //AnnualLTHCOutputRow,
    // Import Types ที่จำเป็นสำหรับ InfoBoxAndControlsLTHC (เช่น Gender, HealthPlanSelections) ถ้าต้องการแสดงข้อมูลเหล่านั้น
} from '../../hooks/useLthcTypes';

// Import Recharts components
{/*import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label
} from 'recharts'*/}

// Import Custom Components (คุณจะต้องสร้างหรือปรับปรุง Components เหล่านี้)
import GraphComponentLTHC, { type LthcChartDataType } from '../../components/GraphComponentLTHC'; // สร้างใหม่สำหรับ LTHC
import InfoBoxAndControlsLTHC from '../../components/InfoBoxAndControlsLTHC'; // สร้างใหม่สำหรับ LTHC
// ❌ ไม่ต้อง import FullScreenDisplayModal, ModalTableViewLTHC, ModalChartViewLTHC ❌

import { Button } from "@/components/ui/button";
// import { ZoomIn } from 'lucide-react'; // ❌ ไม่ต้องใช้ ZoomIn ถ้าไม่มี Fullscreen ❌

// Custom Tooltip (ถ้าต้องการ)
{/*const CustomLthcTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white border rounded shadow-lg text-xs">
                <p className="label font-semibold">{`อายุ: ${label}`}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={`item-${index}`} style={{ color: entry.stroke || entry.color }}>
                        {`${entry.name}: ${entry.value?.toLocaleString() ?? '-'}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;*/}


export default function LthcChartPage() {
    const context = useOutletContext<UseLthcPlannerReturn>();
    const navigate = useNavigate();

    if (!context) {
        return <div className="p-4 text-center text-gray-600">กำลังโหลด Context...</div>;
    }

    const {
        result,
        isLoading,
        error,
        iWealthyMode,
        manualWithdrawalStartAge,
        policyholderEntryAge,
        autoIWealthyPPT,
    } = context;

    // States for LTHC Graph interactions and controls
    const [hoveredLthcData, setHoveredLthcData] = useState<LthcChartDataType | null>(null);
    const [showHealthPremiumAlone, setShowHealthPremiumAlone] = useState(true);
    const [showLthcCombinedPremium, setShowLthcCombinedPremium] = useState(true);
    const [showTotalCombinedDB, setShowTotalCombinedDB] = useState(false);
    const [showCumulativeWithdrawal, setShowCumulativeWithdrawal] = useState(true);
    const [showIWealthyAV, setShowIWealthyAV] = useState(false);
    const [currentAgeForInfoBox, setCurrentAgeInfoBox] = useState<number | undefined>(policyholderEntryAge);

    // ❌ ลบ State isFullScreenModalOpen และ functions ที่เกี่ยวข้องออก ❌
    // const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
    // const openFullScreenModal = () => setIsFullScreenModalOpen(true);
    // const closeFullScreenModal = () => { /* ... */ };

    const withdrawalStartAge = useMemo(() => { /* ... (เหมือนเดิม) ... */
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
        if (num === undefined || num === null || isNaN(num)) { // เพิ่มการตรวจสอบ isNaN
            return '0 บาท'; // หรือ '-' หรือ 'N/A บาท' ตามต้องการ
        }
        return `${Math.round(num).toLocaleString()} บาท`; // <--- ⭐ เพิ่ม " บาท" ตรงนี้ ⭐
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

    // ❌ ลบ Content Node สำหรับ Modal ออก ❌
    // const tableTabContentNodeLTHC = ( ... );
    // const graphTabContentNodeLTHC = ( ... );

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
                    {/* ❌ ลบปุ่ม Fullscreen ออก ❌ */}
                    {/* <Button variant="outline" size="icon" className="h-8 w-8" title="แสดงผลเต็มหน้าจอ" onClick={openFullScreenModal}>
                        <ZoomIn size={16} />
                    </Button> */}
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-700">
                    อายุผู้เอาประกันปัจจุบัน: {policyholderEntryAge} ปี |
                    ช่วงอายุในกราฟ: {chartDataFormatted[0]?.age} - {chartDataFormatted[chartDataFormatted.length - 1]?.age} ปี
                </p>
            </div>

            {/* On-page graph display */}
            <div className="flex flex-col md:flex-row w-full h-[calc(100vh-280px)]"> {/* ปรับความสูงตามต้องการ */}
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
                            //isFullScreenView={false} // ระบุว่าเป็น on-page view
                        />
                    </div>
                </div>
            </div>

            {/* ❌ ลบ FullScreenDisplayModal ออก ❌ */}
            {/* {isFullScreenModalOpen && result && ( ... )} */}
        </div>
    );
};