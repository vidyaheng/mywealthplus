// src/components/GraphComponent.tsx

import React, { useCallback, useMemo, forwardRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, ResponsiveContainer, ReferenceLine,
    Tooltip, Dot
} from 'recharts';

export interface ChartData {
    age?: number;
    deathBenefit?: number;
    accountValue?: number;
    premiumAnnual?: number;
    premiumCumulative?: number;
}

// [ใหม่] สร้าง Component สำหรับป้ายแสดงข้อมูลที่ลอยอยู่ด้านบน
const CustomHoverLabel = React.memo(({ viewBox, age, mirr }: { viewBox?: any, age?: number, mirr?: string }) => {
    if (!viewBox || age === undefined) return null;
    const { x } = viewBox;
    // ปรับให้แสดงเฉพาะ MIRR ถ้า age เป็นค่าที่มาจาก ReferenceLine (hover)
    // แต่ถ้าต้องการให้แสดงทั้งคู่ ก็สามารถคงรูปแบบเดิมได้
    const textToShow = `อายุ ${age} | MIRR: ${mirr || 'N/A'}`;
    const textWidth = textToShow.length * 6.5; // ประมาณความกว้าง

    return (
        <g transform={`translate(${x}, 10)`}>
            <rect x={-(textWidth / 2)} y={0} width={textWidth} height={22} fill="#1e3a8a" rx={11} />
            <text x={0} y={15} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                {textToShow}
            </text>
        </g>
    );
});

const LINE_COLORS = {
    deathBenefit: '#3b87eb',
    accountValue: '#F5A623',
    premiumAnnual: 'red',
    premiumCumulative: 'green',
};

// --- ฟังก์ชันสำหรับสร้าง custom activeDot renderer (Higher-Order Function) ---
const createCustomActiveDotRenderer = (showProps: {
    showDeathBenefit: boolean;
    showAccountValue: boolean;
    showPremiumAnnual: boolean;
    showPremiumCumulative: boolean;
}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (dotProps: any): React.ReactElement => { // นี่คือฟังก์ชันที่ Recharts คาดหวัง
        const { cx, cy, dataKey } = dotProps;
        
        let dotStrokeColor: string = 'grey';
        let shouldRender = false;

        if (typeof cx !== 'number' || typeof cy !== 'number') return <></>;

        switch (dataKey) {
            case 'deathBenefit':
                if (showProps.showDeathBenefit) {
                    dotStrokeColor = LINE_COLORS.deathBenefit;
                    shouldRender = true;
                }
                break;
            case 'accountValue':
                if (showProps.showAccountValue) {
                    dotStrokeColor = LINE_COLORS.accountValue;
                    shouldRender = true;
                }
                break;
            case 'premiumAnnual':
                if (showProps.showPremiumAnnual) {
                    dotStrokeColor = LINE_COLORS.premiumAnnual;
                    shouldRender = true;
                }
                break;
            case 'premiumCumulative':
                if (showProps.showPremiumCumulative) {
                    dotStrokeColor = LINE_COLORS.premiumCumulative;
                    shouldRender = true;
                }
                break;
            default:
                shouldRender = false;
        }

        if (shouldRender) {
            return (
                <g>
                    <Dot cx={cx} cy={cy} r={5} fill={dotStrokeColor} stroke={dotStrokeColor} strokeWidth={1} />
                    <Dot cx={cx} cy={cy} r={3} fill="white" />
                </g>
            );
        }
        return <></>;
    };
};

interface GraphProps {
    data: ChartData[];
    setHoveredData: React.Dispatch<React.SetStateAction<ChartData | null>>;
    showDeathBenefit: boolean;
    showAccountValue: boolean;
    showPremiumAnnual: boolean;
    showPremiumCumulative: boolean;
    onAgeChange: (age: number | undefined) => void;
    hoveredAge?: number;
    hoveredMirr?: string;
    mirrData?: Map<number, number | null> | null;
    CustomTooltipComponent?: React.ElementType;
}

const Graph = forwardRef<HTMLDivElement, GraphProps>(({
    data,
    setHoveredData,
    showDeathBenefit,
    showAccountValue,
    showPremiumCumulative,
    showPremiumAnnual,
    onAgeChange, 
    hoveredAge,
    hoveredMirr,
    //mirrData,
    //CustomTooltipComponent,
}, ref) => { 
    
    const getTicks = useCallback((dataForTicks: ChartData[]): number[] => {
        if (!dataForTicks || dataForTicks.length === 0) return [];

        const ages = dataForTicks.map(d => d.age).filter((age): age is number => age !== undefined);
        if (ages.length === 0) return [];

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
        // ถ้า minAge หรือ maxAge ไม่ได้ลงท้ายด้วย 0 หรือ 5
        ticks.add(minAge);
        ticks.add(maxAge);

        return Array.from(ticks).sort((a, b) => a - b);
    }, []);

    const memoizedTicks = useMemo(() => getTicks(data), [data, getTicks]);

    // สร้าง activeDotRenderer ใน useMemo เพื่อให้มัน Stable
    const activeDotRenderer = React.useMemo(() => createCustomActiveDotRenderer({
        showDeathBenefit,
        showAccountValue,
        showPremiumAnnual,
        showPremiumCumulative
    }), [showDeathBenefit, showAccountValue, showPremiumAnnual, showPremiumCumulative]);
    // Dependencies คือ props ที่ควบคุมการแสดงผลของ Dot ซึ่งอาจเปลี่ยนได้

    // สร้าง object สำหรับ margin ใน useMemo เพื่อให้มัน Stable
    const chartMargin = React.useMemo(() => ({ top: 40, right: 40, left: 20, bottom: 20 }), []);

    const lastHoveredAgeRef = React.useRef<number | undefined>(undefined);

    const handleMouseMove = React.useCallback((event: any) => {
        if (event?.activePayload && event.activePayload.length > 0) {
            const payload = event.activePayload[0].payload as ChartData;
            // ตรวจสอบว่าข้อมูลที่ hover มีการเปลี่ยนแปลงหรือไม่ ก่อนที่จะ set State
            // เพื่อหลีกเลี่ยงการ re-render ที่ไม่จำเป็น
            setHoveredData(prevData => {
                if (prevData?.age === payload.age && 
                    prevData?.deathBenefit === payload.deathBenefit &&
                    prevData?.accountValue === payload.accountValue &&
                    prevData?.premiumAnnual === payload.premiumAnnual &&
                    prevData?.premiumCumulative === payload.premiumCumulative) {
                    return prevData; // ไม่มีอะไรเปลี่ยน ไม่ต้อง update state
                }
                return payload; // ข้อมูลเปลี่ยน อัปเดต state
            });

            if (payload.age !== undefined && payload.age !== lastHoveredAgeRef.current) {
                lastHoveredAgeRef.current = payload.age;
                onAgeChange(payload.age);
            }
        }
    }, [setHoveredData, onAgeChange]); // Dependencies สำหรับ useCallback

    const handleMouseLeave = React.useCallback(() => {
    setHoveredData(null);
    lastHoveredAgeRef.current = undefined;
    // ส่ง undefined แทน NaN เพื่อบ่งบอกว่าไม่มีการ hover อายุที่ชัดเจน
    // และให้ Parent Component จัดการการรีเซ็ตค่าเริ่มต้น (ถ้ามี)
    onAgeChange(undefined); // เปลี่ยนจาก NaN
}, [setHoveredData, onAgeChange]);

    return (
        <ResponsiveContainer width="100%" height="100%" ref={ref}>
            <LineChart
                data={data}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                margin={chartMargin}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} dy={10} interval="preserveStartEnd" ticks={memoizedTicks} />
                <YAxis tickFormatter={(tick) => `${(tick / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                {/* ใช้ CustomTooltipComponent หากมี หรือใช้ Tooltip ปกติ */}
                <Tooltip content={() => null}
                         cursor={{ stroke: 'rgba(100, 100, 100, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' }} />

                {/* ReferenceLine สำหรับ Hovered Age และ MIRR */}
                {hoveredAge !== undefined && !isNaN(hoveredAge) && ( // <--- เพิ่มเงื่อนไข !isNaN(hoveredAge)
                    <ReferenceLine x={hoveredAge} stroke="#64748b" strokeDasharray="3 3"
                        label={<CustomHoverLabel age={hoveredAge} mirr={hoveredMirr} />}
                    />
                )}

                {/* activeDot ใช้ activeDotRenderer ที่ stable */}
                {showDeathBenefit && <Line isAnimationActive={false} type="monotone" dataKey="deathBenefit" stroke={LINE_COLORS.deathBenefit} strokeWidth={2} name="ผลประโยชน์กรณีเสียชีวิต" dot={false} 
                    activeDot={activeDotRenderer} />}
                
                {showAccountValue && <Line isAnimationActive={false} type="monotone" dataKey="accountValue" stroke={LINE_COLORS.accountValue} strokeWidth={2} name="มูลค่าบัญชีกรมธรรม์" dot={false} 
                    activeDot={activeDotRenderer} />}
                
                {showPremiumAnnual && <Line isAnimationActive={false} type="monotone" dataKey="premiumAnnual" stroke={LINE_COLORS.premiumAnnual} strokeWidth={2} name="เบี้ยประกันภัยรายปี" dot={false} 
                    activeDot={activeDotRenderer} />}
                
                {showPremiumCumulative && <Line isAnimationActive={false} type="monotone" dataKey="premiumCumulative" stroke={LINE_COLORS.premiumCumulative} strokeWidth={2} name="เบี้ยประกันภัยสะสม" dot={false} 
                    activeDot={activeDotRenderer} />}
            </LineChart>
        </ResponsiveContainer>
    );
});

Graph.displayName = 'Graph'; 

export default React.memo(Graph); 