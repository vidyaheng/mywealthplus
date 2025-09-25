import React, { useMemo, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, ResponsiveContainer, ReferenceLine,
    Tooltip,
} from 'recharts';

export interface RetirementChartData {
    age?: number;
    fundValue?: number;
    payoutCumulative?: number;
    premium?: number;
    deathBenefit?: number;
}

const LINE_COLORS = {
    fundValue: '#3b82f6',    // blue
    payoutCumulative: '#16a34a', // green
    premium: '#dc2626',      // red
    deathBenefit: '#7c3aed', // purple
};

// Component ป้ายแสดงข้อมูลที่ลอยอยู่ด้านบนเส้นปะ
const CustomHoverLabel = React.memo(({ viewBox, age }: { viewBox?: any, age?: number }) => {
    if (!viewBox || age === undefined) return null;
    const { x } = viewBox;
    const textToShow = `อายุ ${age}`;
    const textWidth = textToShow.length * 8;
    return (
        <g transform={`translate(${x}, 10)`}>
            <rect x={-(textWidth / 2)} y={0} width={textWidth} height={22} fill="#1e3a8a" rx={11} />
            <text x={0} y={15} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                {textToShow}
            </text>
        </g>
    );
});

const renderActiveDot = (dotProps: any): React.ReactElement => {
    const { cx, cy, dataKey } = dotProps;
    if (typeof cx !== 'number' || typeof cy !== 'number') return <></>;
    const dotColor = LINE_COLORS[dataKey as keyof typeof LINE_COLORS] || '#8884d8';
    return (
        <circle cx={cx} cy={cy} r={6} stroke={dotColor} strokeWidth={2} fill="white" />
    );
};


interface RetirementGraphProps {
    data: RetirementChartData[];
    onAgeChange: (age: number | undefined) => void;
    hoveredAge?: number;
    showFundValue: boolean;
    showPayoutCumulative: boolean;
    showPremium: boolean;
    showDeathBenefit: boolean;
    investmentReturn: number; // ✨ [ใหม่] เพิ่ม prop สำหรับรับค่าผลตอบแทน
}

const RetirementGraph = ({ data, onAgeChange, hoveredAge, showFundValue, showPayoutCumulative, showPremium, showDeathBenefit, investmentReturn }: RetirementGraphProps) => {

    const chartMargin = useMemo(() => ({ top: 5, right: 40, left: 20, bottom: 20 }), []);
    
    const getTicks = useCallback((dataForTicks: RetirementChartData[]): number[] => {
        if (!dataForTicks || dataForTicks.length === 0) return [];
        const ages = dataForTicks.map(d => d.age).filter((age): age is number => age !== undefined);
        if (ages.length === 0) return [];

        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        const ticks = new Set<number>();
        const startTick = Math.ceil(minAge / 5) * 5;

        for (let i = startTick; i <= maxAge; i += 5) {
            ticks.add(i);
        }
        ticks.add(minAge);
        ticks.add(maxAge);

        return Array.from(ticks).sort((a, b) => a - b);
    }, []);

    const memoizedTicks = useMemo(() => getTicks(data), [data, getTicks]);

    const { minAge, maxAge } = useMemo(() => {
        if (!data || data.length === 0) return { minAge: 'N/A', maxAge: 'N/A' };
        const ages = data.map(d => d.age).filter((age): age is number => age !== undefined);
        if (ages.length === 0) return { minAge: 'N/A', maxAge: 'N/A' };
        return {
            minAge: Math.min(...ages),
            maxAge: Math.max(...ages)
        };
    }, [data]);


    const handleMouseMove = useCallback((event: any) => {
        if (event?.activePayload && event.activePayload.length > 0) {
            const payload = event.activePayload[0].payload as RetirementChartData;
            if (payload.age) {
                onAgeChange(payload.age);
            }
        }
    }, [onAgeChange]);

    const handleMouseLeave = useCallback(() => {
        onAgeChange(undefined);
    }, [onAgeChange]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="text-center pt-2 px-4">
                <h3 className="text-sm font-semibold text-slate-700">กราฟแสดงผลประโยชน์แผนบำนาญ</h3>
                {/* ✨ [อัปเดตแล้ว] เพิ่มการแสดงผลตอบแทนคาดหวัง */}
                <p className="text-xs text-slate-500">
                    ช่วงอายุ {minAge} - {maxAge} ปี | ผลตอบแทนคาดหวัง (iWealthy): {investmentReturn}%
                </p>
            </div>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        margin={chartMargin}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="age" tick={{ fontSize: 11 }} dy={10} interval="preserveStartEnd" ticks={memoizedTicks} />
                        <YAxis tickFormatter={(tick) => `${(tick / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                        <Tooltip content={() => null} cursor={{ stroke: 'rgba(100, 100, 100, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        
                        {hoveredAge && (
                            <ReferenceLine x={hoveredAge} stroke="#64748b" strokeDasharray="3 3" label={<CustomHoverLabel age={hoveredAge} />} />
                        )}

                        {showFundValue && <Line isAnimationActive={false} type="monotone" dataKey="fundValue" stroke={LINE_COLORS.fundValue} strokeWidth={2} name="มูลค่า กธ." dot={false} activeDot={renderActiveDot} />}
                        {showPayoutCumulative && <Line isAnimationActive={false} type="monotone" dataKey="payoutCumulative" stroke={LINE_COLORS.payoutCumulative} strokeWidth={2} name="เงินเกษียณสะสม" dot={false} activeDot={renderActiveDot} />}
                        {showPremium && <Line isAnimationActive={false} type="monotone" dataKey="premium" stroke={LINE_COLORS.premium} strokeWidth={2} name="เบี้ยสะสม" dot={false} activeDot={renderActiveDot} />}
                        {showDeathBenefit && <Line isAnimationActive={false} type="monotone" dataKey="deathBenefit" stroke={LINE_COLORS.deathBenefit} strokeWidth={2} name="คุ้มครองชีวิต" dot={false} activeDot={renderActiveDot} />}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default React.memo(RetirementGraph);