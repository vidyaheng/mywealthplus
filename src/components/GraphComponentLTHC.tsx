// src/components/lthc/GraphComponentLTHC.tsx
import React, { useCallback, useMemo } from 'react'; // เพิ่ม useCallback, useMemo ถ้า getTicks ใช้
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Label,
    Tooltip, // 👈 เพิ่ม Tooltip เข้ามาใน import
    Dot      // 👈 เพิ่ม Dot เข้ามาใน import
} from 'recharts';

// Type สำหรับข้อมูลแต่ละจุดในกราฟ LTHC
export interface LthcChartDataType {
    age: number;
    healthPremiumAlone?: number;
    lthcCombinedPremium?: number;
    totalCombinedDeathBenefit?: number;
    cumulativeWithdrawal?: number;
    eoyAccountValue?: number;
}

interface GraphComponentLTHCProps {
    data: LthcChartDataType[];
    setHoveredData: (data: LthcChartDataType | null) => void;
    onAgeChange?: (age: number | undefined) => void;
    showHealthPremiumAlone: boolean;
    showLthcCombinedPremium: boolean;
    showTotalCombinedDB: boolean;
    showCumulativeWithdrawal: boolean;
    showIWealthyAV: boolean;
}

// Custom Tooltip ที่ไม่แสดงผลอะไรเลย (เพื่อให้ cursor ของ Tooltip ทำงาน และ onMouseMove/Leave ยังคงทำงานได้)
const EmptyTooltipContent = () => {
    return null;
};

const GraphComponentLTHC: React.FC<GraphComponentLTHCProps> = ({
    data, setHoveredData, onAgeChange,
    showHealthPremiumAlone, showLthcCombinedPremium,
    showTotalCombinedDB, showCumulativeWithdrawal, showIWealthyAV
}) => {

    const handleMouseMove = (e: any) => {
        if (e && e.activePayload && e.activePayload.length > 0 && e.activeCoordinate) {
            const hoveredAge = e.activePayload[0].payload.age;
            setHoveredData(e.activePayload[0].payload as LthcChartDataType);
            if (onAgeChange && hoveredAge !== undefined) { // ตรวจสอบ hoveredAge
                onAgeChange(hoveredAge);
            }
        }
    };
    const handleMouseLeave = () => {
        setHoveredData(null);
        if (onAgeChange) onAgeChange(undefined);
    };

    const formatYAxisTick = (tickValue: number) => `${(tickValue / 1000000).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:1})}M`;

    // --- vvvv ลบ getTicks เดิม แล้วใช้โค้ดนี้แทน vvvv ---
    const getTicks = useCallback((dataForTicks: LthcChartDataType[]): number[] => {
        if (!dataForTicks || dataForTicks.length === 0) return [];
        
        const ages = dataForTicks.map(d => d.age);
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);

        const ticks = new Set<number>();

        // หาตัวเลขแรกที่ลงท้ายด้วย 0 หรือ 5 ที่มากกว่าหรือเท่ากับ minAge
        const startTick = Math.ceil(minAge / 5) * 5;

        // สร้าง Ticks ที่ลงท้ายด้วย 0 หรือ 5 ไปจนถึง maxAge
        for (let i = startTick; i <= maxAge; i += 5) {
            ticks.add(i);
        }
        
        // เพิ่ม tick แรก (minAge) และ tick สุดท้าย (maxAge) เพื่อให้กราฟเต็มขอบเสมอ
        ticks.add(minAge);
        ticks.add(maxAge);

        return Array.from(ticks).sort((a, b) => a - b);
    }, []);
    // --- ^^^^ จบส่วนที่แก้ไข ^^^^ ---

    const memoizedTicks = useMemo(() => getTicks(data), [data, getTicks]);



    // ฟังก์ชันสำหรับ render active dot (วงกลมเมื่อ hover)
    const renderActiveDot = (props: any) => {
        const { cx, cy, payload, dataKey } = props;

        let shouldShowDot = false;
        let dotStrokeColor = '#8884d8';
        if (dataKey === 'healthPremiumAlone' && showHealthPremiumAlone && payload.healthPremiumAlone !== undefined) {shouldShowDot = true; dotStrokeColor = "#ff7300";}
        else if (dataKey === 'lthcCombinedPremium' && showLthcCombinedPremium && payload.lthcCombinedPremium !== undefined) {shouldShowDot = true; dotStrokeColor = "#387908";}
        else if (dataKey === 'totalCombinedDeathBenefit' && showTotalCombinedDB && payload.totalCombinedDeathBenefit !== undefined) {shouldShowDot = true; dotStrokeColor = "#8884d8";}
        else if (dataKey === 'cumulativeWithdrawal' && showCumulativeWithdrawal && payload.cumulativeWithdrawal !== undefined) {shouldShowDot = true; dotStrokeColor = "#ffce56";}
        else if (dataKey === 'eoyAccountValue' && showIWealthyAV && payload.eoyAccountValue !== undefined) {shouldShowDot = true; dotStrokeColor = "#26A69A";}

        if (shouldShowDot && typeof cx === 'number' && typeof cy === 'number') {
            return <Dot cx={cx} cy={cy} r={5} stroke={dotStrokeColor} strokeWidth={2} fill="white" />;
        }
        return <></>;
    };

    return (
        <ResponsiveContainer width="100%" height="100%" minHeight={400}>          
            <LineChart
                data={data}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }} // เพิ่ม bottom margin สำหรับ XAxis Label
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0"/>
                <XAxis
                    dataKey="age"
                    tickFormatter={(tick) => `${tick}`}
                    ticks={memoizedTicks} // ใช้ ticks ที่ memoized
                    interval="preserveStartEnd"
                    dy={10}
                    tick={{ fontSize: 10, fill: '#666' }}
                    padding={{ left: 10, right: 10 }} // เพิ่ม padding เล็กน้อย
                >
                    <Label value="อายุ (ปี)" offset={0} position="insideBottom" style={{ fontSize: 11, fill:'#555' }} dy={15} />
                </XAxis>
                <YAxis
                    tickFormatter={formatYAxisTick}
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#666' }}
                    allowDataOverflow={false} // ป้องกันไม่ให้แกน Y ขยายเกินข้อมูล
                >
                    <Label value="มูลค่า (ล้านบาท)" angle={-90} position="insideLeft" style={{ fontSize: 11, fill:'#555' }} dx={5} />
                </YAxis>
                {/* ⭐ เพิ่ม Tooltip component แต่ใช้ EmptyTooltipContent ⭐ */}
                <Tooltip
                    cursor={{ stroke: 'rgba(100, 100, 100, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' }} // เส้น cursor แนวตั้ง
                    content={<EmptyTooltipContent />} // ไม่แสดงกล่องข้อความ tooltip
                    wrapperStyle={{ zIndex: 1000 }}
                    isAnimationActive={false}
                />

                {/* <Legend wrapperStyle={{ fontSize: '10px', paddingTop: 15 }} iconSize={10} /> */} {/* Legend ถูก comment out */}

                {/* ⭐ เพิ่ม activeDot={renderActiveDot} ให้กับแต่ละ Line ⭐ */}
                {showHealthPremiumAlone && <Line isAnimationActive={false} type="monotone" dataKey="healthPremiumAlone" name="เบี้ยสุขภาพรวม (จ่ายเองทั้งหมด, สะสม)" stroke="#ff7300" strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
                {showLthcCombinedPremium && <Line isAnimationActive={false} type="monotone" dataKey="lthcCombinedPremium" name="เบี้ย LTHC จ่ายจริง (สะสม)" stroke="#387908" strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
                {showTotalCombinedDB && <Line isAnimationActive={false} type="monotone" dataKey="totalCombinedDeathBenefit" name="คุ้มครองชีวิตรวม (รายปี)" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
                {showCumulativeWithdrawal && <Line isAnimationActive={false} type="monotone" dataKey="cumulativeWithdrawal" name="เงินถอนจาก iW รวม (สะสม)" stroke="#ffc658" strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
                {showIWealthyAV && <Line isAnimationActive={false} type="monotone" dataKey="eoyAccountValue" name="มูลค่า AV iWealthy (สิ้นปี)" stroke="#26A69A" strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
            </LineChart>
        </ResponsiveContainer>
    );
};
export default GraphComponentLTHC;