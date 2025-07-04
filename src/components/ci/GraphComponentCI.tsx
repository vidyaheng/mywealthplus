// src/components/ci/GraphComponentCI.tsx

import React, { useCallback, useMemo } from 'react';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Label, Tooltip
} from 'recharts';

// Type สำหรับข้อมูลแต่ละจุดในกราฟ CI
export interface CiChartDataType {
    age: number;
    ciPremium?: number;
    iWealthyPremium?: number;
    withdrawal?: number;
    iWealthyAV?: number;
    totalDB?: number;
}

// Props interface สำหรับคอมโพเนนต์
interface GraphComponentCIProps {
    data: CiChartDataType[];
    setHoveredData: (data: CiChartDataType | null) => void;
    onAgeChange?: (age: number | undefined) => void;
    showCiPremium: boolean;
    showIWealthyPremium: boolean;
    showWithdrawal: boolean;
    showIWealthyAV: boolean;
    showTotalDB: boolean;
}

// Tooltip ที่ว่างเปล่า เพื่อให้เราใช้ onMouseMove ได้
const EmptyTooltipContent = () => null;

const GraphComponentCI: React.FC<GraphComponentCIProps> = ({
    data, setHoveredData, onAgeChange,
    showCiPremium, showIWealthyPremium, showWithdrawal, showIWealthyAV, showTotalDB
}) => {

    // --- ฟังก์ชันสำหรับสร้าง Ticks บนแกน X ให้สวยงาม ---
    const getNiceTicks = useCallback((chartData: CiChartDataType[]): number[] => {
        if (!chartData || chartData.length === 0) return [];
        
        const ages = chartData.map(d => d.age);
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        
        const firstTick = Math.ceil(minAge / 5) * 5;
        
        const ticks: number[] = [];
        for (let i = firstTick; i <= maxAge; i += 5) {
            ticks.push(i);
        }

        if (!ticks.includes(minAge) && minAge < firstTick && (firstTick - minAge) >= 3) {
            ticks.unshift(minAge);
        }
        
        if (!ticks.includes(maxAge) && maxAge > (ticks[ticks.length - 1] ?? firstTick) ) {
             ticks.push(maxAge);
        }

        return [...new Set(ticks)].sort((a,b) => a-b);
    }, []);
    
    // เรียกใช้ฟังก์ชันและ memoize ผลลัพธ์ไว้
    const memoizedTicks = useMemo(() => getNiceTicks(data), [data, getNiceTicks]);

    // --- Handlers สำหรับการโต้ตอบกับกราฟ ---
    const handleMouseMove = (e: any) => {
        if (e?.activePayload?.[0]) {
            const hoveredAge = e.activePayload[0].payload.age;
            setHoveredData(e.activePayload[0].payload as CiChartDataType);
            onAgeChange?.(hoveredAge);
        }
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
        onAgeChange?.(undefined);
    };

    // --- ฟังก์ชันช่วยอื่นๆ ---
    const formatYAxisTick = (tick: number) => `${(tick / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    
    return (
        <ResponsiveContainer width="100%" height="100%" minHeight={400}>
            <LineChart
                data={data}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                
                <XAxis
                    dataKey="age"
                    tick={{ fontSize: 10, fill: '#666' }}
                    dy={10}
                    ticks={memoizedTicks}
                    tickFormatter={(tick) => `${tick}`}
                    interval="preserveStartEnd"
                >
                    <Label value="อายุ (ปี)" offset={0} position="insideBottom" style={{ fontSize: 11, fill: '#555' }} dy={15} />
                </XAxis>

                <YAxis tickFormatter={formatYAxisTick} tick={{ fontSize: 10, fill: '#666' }} allowDataOverflow={false}>
                    <Label value="มูลค่า (ล้านบาท)" angle={-90} position="insideLeft" style={{ fontSize: 11, fill: '#555' }} dx={5} />
                </YAxis>
                
                <Tooltip
                    cursor={{ stroke: 'rgba(100, 100, 100, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={<EmptyTooltipContent />}
                    isAnimationActive={false}
                />

                {/* --- ส่วนของเส้นกราฟ --- */}
                {showCiPremium && <Line isAnimationActive={false} type="monotone" dataKey="ciPremium" name="เบี้ยรวม CI (สะสม)" stroke="#4299E1" strokeWidth={2} dot={false} />}
                {showIWealthyPremium && <Line isAnimationActive={false} type="monotone" dataKey="iWealthyPremium" name="เบี้ยรวม iWealthy (สะสม)" stroke="#9F7AEA" strokeWidth={2} dot={false} />}
                {showWithdrawal && <Line isAnimationActive={false} type="monotone" dataKey="withdrawal" name="เงินถอนจาก iW (สะสม)" stroke="#F6E05E" strokeWidth={2} dot={false} />}
                {showIWealthyAV && <Line isAnimationActive={false} type="monotone" dataKey="iWealthyAV" name="มูลค่าบัญชี iWealthy (สิ้นปี)" stroke="#48BB78" strokeWidth={3} dot={false} />}
                {showTotalDB && <Line isAnimationActive={false} type="monotone" dataKey="totalDB" name="ความคุ้มครองชีวิตรวม (รายปี)" stroke="#ED8936" strokeWidth={2} dot={false} />}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default GraphComponentCI;