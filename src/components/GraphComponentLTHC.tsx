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
    const getTicks = useCallback((dataForTicks: LthcChartDataType[]): number[] => {
    if (!dataForTicks || dataForTicks.length === 0) return [];
    const ages = dataForTicks.map(d => d.age).filter(age => typeof age === 'number') as number[];
    if (ages.length === 0) return [];

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const ticks: number[] = [];

    if (dataForTicks.length < 10 && ages.length > 0) { // ถ้าข้อมูลน้อยกว่า 10 จุด แสดงทุกจุด
        return [...new Set(ages)].sort((a,b) => a-b); // ใช้ Set เพื่อเอาค่าซ้ำออกก่อน sort
    }

    if (minAge === maxAge && ages.length > 0) return [minAge]; // กรณีมีข้อมูลแค่จุดเดียว

    for (let i = minAge; i <= maxAge; i += 5) { // สร้าง ticks ทุก 5 ปี
        ticks.push(i);
    }

    // ตรวจสอบและเพิ่ม minAge ถ้ายังไม่มีและไม่ใกล้กับ tick แรกมากไป
    if (ticks.length > 0 && minAge < ticks[0] && ticks[0] - minAge >= 2) {
         if (!ticks.includes(minAge)) ticks.unshift(minAge);
    } else if (ticks.length === 0 && ages.length > 0) { // ถ้า loop for ไม่ทำงานเลย แต่มี data
        ticks.push(minAge);
    }


    // ตรวจสอบและเพิ่ม maxAge ถ้ายังไม่มีและไม่ใกล้กับ tick สุดท้ายมากไป
    if (ticks.length > 0 && ticks[ticks.length - 1] < maxAge) {
        if (maxAge - ticks[ticks.length - 1] >= 2 || ticks.length === 1 && minAge !== maxAge) {
           if(!ticks.includes(maxAge)) ticks.push(maxAge);
        } else if (ticks.length > 1 && !ticks.includes(maxAge)) { // ถ้าใกล้มาก ให้แทนที่ตัวสุดท้าย
            ticks[ticks.length - 1] = maxAge;
        }
    } else if (ticks.length === 1 && ticks[0] !== maxAge && minAge !== maxAge) { // กรณีมี minAge แต่ยังไม่มี maxAge
        ticks.push(maxAge);
    }


    return [...new Set(ticks)].sort((a,b) => a-b); // เอาค่าซ้ำออก (ถ้ามี) และ sort
}, []);

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
            <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
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
            </div>
        </ResponsiveContainer>
    );
};
export default GraphComponentLTHC;