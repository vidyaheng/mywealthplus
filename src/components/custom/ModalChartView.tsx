// src/components/custom/ModalChartView.tsx

import React from 'react';
import Graph, { ChartData } from '../GraphComponent'; // ตรวจสอบ Path ของ GraphComponent
import ModalChartControls from './ModalChartControls'; // ตรวจสอบ Path ของ ModalChartControls

// --- STEP 1: ใช้ Props Interface ที่สมบูรณ์ (จากโค้ดของผม) ---
// Interface นี้รู้จัก props ทั้งหมด รวมถึง isFullScreenView ที่จำเป็น
export interface ModalChartViewProps {
    chartData: ChartData[];
    hoveredData: ChartData | null;
    setHoveredData: React.Dispatch<React.SetStateAction<ChartData | null>>;
    initialData: ChartData | null;
    currentAge: number | undefined;
    formatNumber: (num: number | undefined | null) => string;
    showDeathBenefit: boolean;
    setShowDeathBenefit: React.Dispatch<React.SetStateAction<boolean>>;
    showAccountValue: boolean;
    setShowAccountValue: React.Dispatch<React.SetStateAction<boolean>>;
    showPremiumAnnual: boolean;
    setShowPremiumAnnual: React.Dispatch<React.SetStateAction<boolean>>;
    showPremiumCumulative: boolean;
    setShowPremiumCumulative: React.Dispatch<React.SetStateAction<boolean>>;
    rppPercent: number;
    totalPremium: number;
    onPercentChange: (percent: number) => void;
    assumedReturnRate: number;
    onReturnRateChange: (rate: number) => void;
    onRecalculate: () => void;
    onAgeChange: (age: number) => void;
    isFullScreenView?: boolean; // Prop ที่แก้ปัญหา error
    CustomTooltipComponent?: React.ElementType;
    hoveredAge?: number;
    hoveredMirr?: string; 
    mirrData?: Map<number, number | null> | null;
}

// --- STEP 2: นำโครงสร้าง Layout เดิมของคุณกลับมาใช้ ---
export default function ModalChartView(props: ModalChartViewProps) {
    // Destructure props isFullScreenView ออกมาเพื่อส่งต่อ
    const { 
        isFullScreenView = false, 
        CustomTooltipComponent, 
        mirrData,
        hoveredAge,
        hoveredMirr,
        ...restOfProps 
    } = props;

    return (
        // ใช้ Layout เดิมของคุณ (แนวตั้ง บน/ล่าง)
        <div className="flex flex-col h-full w-full bg-slate-50"> 
            
            {/* ส่วน Controls ด้านบน (เหมือนเดิม) */}
            <div className="flex-shrink-0 p-2 md:p-3 border-b border-slate-300 bg-white shadow-sm">
                <ModalChartControls
                    // ส่ง props ทั้งหมดลงไป
                    {...restOfProps} 
                    // และส่ง isFullScreenView ที่ถูกต้องไปด้วย
                    isFullScreenView={isFullScreenView} 
                />
            </div>

            {/* ส่วน Graph ด้านล่าง (เหมือนเดิม) */}
            <div className="flex-1 w-full h-full relative mt-1 flex justify-center items-center">
                <div 
                    className="w-[85%] h-full bg-white shadow-sm rounded-md overflow-y-auto"
                    style={{ minHeight: '500px' }} // กำหนดความสูงขั้นต่ำ
                >
                    <Graph 
                        data={props.chartData}
                        setHoveredData={props.setHoveredData}
                        showDeathBenefit={props.showDeathBenefit}
                        showAccountValue={props.showAccountValue}
                        showPremiumAnnual={props.showPremiumAnnual}
                        showPremiumCumulative={props.showPremiumCumulative}
                        onAgeChange={props.onAgeChange}
                        //CustomTooltipComponent={CustomTooltipComponent}
                        hoveredAge={hoveredAge}
                        hoveredMirr={hoveredMirr}
                        //mirrData={mirrData}
                    />
                </div>
            </div>
        </div>
    );
};