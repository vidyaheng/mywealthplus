// src/components/GraphComponent.tsx
import React from 'react'; // React import is crucial for JSX and React types
import { useCallback, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    //Legend,
    ResponsiveContainer,
} from 'recharts';

export interface ChartData {
    age?: number;
    deathBenefit?: number;
    accountValue?: number;
    premiumAnnual?: number;
    premiumCumulative?: number;
}

interface GraphProps {
    data: ChartData[];
    setHoveredData: React.Dispatch<React.SetStateAction<ChartData | null>>;
    showDeathBenefit: boolean;
    showAccountValue: boolean;
    showPremiumAnnual: boolean;
    showPremiumCumulative: boolean;
    onAgeChange?: (age: number) => void;
}

// Custom Tooltip (ถ้าต้องการปรับแต่งการแสดงข้อมูลเมื่อ hover)
// const CustomTooltipContent = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//         // Example of custom tooltip content
//         // return (
//         //   <div className="custom-tooltip bg-white p-3 shadow-lg rounded border border-gray-200 text-xs">
//         //     {/* ... content ... */}
//         //   </div>
//         // );
//     }
//     return null;
// };

// Custom Tooltip Content ที่ไม่แสดงผลอะไรเลย (เพื่อให้ cursor ยังทำงาน)
const EmptyTooltipContent = () => {
    return null; // หรือ <></>
};

const Graph: React.FC<GraphProps> = ({
    data,
    setHoveredData,
    showDeathBenefit,
    showAccountValue,
    showPremiumCumulative,
    showPremiumAnnual,
    onAgeChange
}) => {

    // filterTicks function ควรจะรับ number เท่านั้น (เหมือนเดิม)
    const filterTicks = useCallback((age: number): boolean => {
        if (data && data.length > 0) {
            const firstAge = data[0]?.age; // ใช้ optional chaining เผื่อ data[0] ไม่มี
            const lastAge = data[data.length - 1]?.age; // ใช้ optional chaining เผื่อ data[data.length - 1] ไม่มี

            // ตรวจสอบว่า firstAge และ lastAge เป็น number จริงๆ ก่อนเปรียบเทียบ
            if (typeof firstAge === 'number' && age === firstAge) {
                return true;
            }
            if (typeof lastAge === 'number' && age === lastAge) {
                return true;
            }
        }
        return age % 5 === 0;
    }, [data]); // filterTicks ขึ้นอยู่กับ data

    const tickValues = useMemo(() => {
        if (!data || data.length === 0) {
            return []; // ถ้าไม่มี data ก็ return array ว่าง
        }

        // 1. ดึงค่า age ทั้งหมดออกมา (TypeScript อาจจะมองว่าเป็น (number | undefined)[])
        const allAges = data.map(item => item.age);

        // 2. กรองเอาเฉพาะค่าที่เป็น number จริงๆ และไม่เป็น undefined
        //    โดยใช้ type predicate `ageValue is number` เพื่อบอก TypeScript ว่าผลลัพธ์จะเป็น number[]
        const definedAges: number[] = allAges.filter((ageValue): ageValue is number => typeof ageValue === 'number');

        // 3. นำ definedAges (ซึ่งเป็น number[] แน่นอนแล้ว) มา filter ด้วย filterTicks
        return definedAges.filter(filterTicks);

    }, [data, filterTicks]); // คำนวณใหม่เมื่อ data หรือ filterTicks เปลี่ยน

    const handleMouseMove = (event: any) => {
        if (event && event.activePayload && event.activePayload.length > 0) {
            const payload = event.activePayload[0].payload as ChartData;
            setHoveredData(payload);
            if (onAgeChange && payload.age !== undefined) {
                onAgeChange(payload.age);
            }
        }
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    // เปลี่ยน return type เป็น React.ReactElement
    const renderActiveDot = (props: any): React.ReactElement => {
        const { cx, cy, payload, dataKey } = props; // ไม่ใช้ stroke จาก props โดยตรงแล้ว

        let shouldRenderDot = false;
        let dotStrokeColor = '#8884d8'; // สี fallback เริ่มต้น

        // ตรวจสอบว่า payload (ข้อมูล ณ จุดนั้น) และ cx, cy (พิกัด) มีค่าที่ถูกต้อง
        if (payload && typeof cx === 'number' && typeof cy === 'number') {
            // กำหนดสีของเส้นขอบวงกลม (dotStrokeColor) ตาม dataKey และตรวจสอบว่าเส้นนั้นๆ ถูกตั้งค่าให้แสดงผล
            // และมีข้อมูล ณ จุดนั้นหรือไม่
            if (dataKey === 'deathBenefit' && showDeathBenefit && payload.deathBenefit !== undefined) {
                shouldRenderDot = true;
                dotStrokeColor = "#3b87eb"; // สีของเส้น deathBenefit
            } else if (dataKey === 'accountValue' && showAccountValue && payload.accountValue !== undefined) {
                shouldRenderDot = true;
                dotStrokeColor = "#F5A623"; // สีของเส้น accountValue
            } else if (dataKey === 'premiumAnnual' && showPremiumAnnual && payload.premiumAnnual !== undefined) {
                shouldRenderDot = true;
                dotStrokeColor = "red";     // สีของเส้น premiumAnnual
            } else if (dataKey === 'premiumCumulative' && showPremiumCumulative && payload.premiumCumulative !== undefined) {
                shouldRenderDot = true;
                dotStrokeColor = "green";   // สีของเส้น premiumCumulative
            }
        }

        if (shouldRenderDot) {
            // แสดงวงกลม: ขอบสีตามเส้นกราฟ (dotStrokeColor), สีพื้นเป็นสีขาว, รัศมี 5, เส้นขอบหนา 1.5
            return (
                <circle cx={cx} cy={cy} r={6} stroke={dotStrokeColor} strokeWidth={2} fill="white" />
            );
        }
        return <></>; // ถ้าไม่เข้าเงื่อนไข ให้ return React Fragment เปล่า
    };


    return (
        <ResponsiveContainer width="100%" height="100%" minHeight={500}>
            <LineChart
                data={data}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                margin={{ top: 50, right: 70, left: 20, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="age"
                    tickFormatter={(tick) => `${tick}`}
                    ticks={tickValues} 
                    interval="preserveStartEnd"
                    dy={10}
                    tick={{ fontSize: 10, fill: '#666' }}
                    padding={{ left: 0, right: 0 }}
                    label={{ value: 'อายุ (ปี)', angle: 0, position: 'right', offset: 20, fontSize: 11, fill:'#666' }}
                />
                <YAxis
                    tickFormatter={(value) => (value / 1_000_000).toFixed(1)}
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#666' }}
                    allowDataOverflow={true}
                    label={{ value: 'มูลค่า (ล้านบาท)', angle: 0, position: 'top', offset: 20, fontSize: 11, fill:'#666' }}
                />
                <Tooltip
                    cursor={{ stroke: 'rgba(150, 150, 150, 0.5)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={<EmptyTooltipContent />} // <<< ใช้ EmptyTooltipContent เพื่อซ่อนกล่อง Tooltip
                    wrapperStyle={{ zIndex: 1000 }} // เพิ่ม zIndex เผื่อกรณี Tooltip ถูกบัง
                    // content={<CustomTooltipContent />} // CustomTooltipContent is currently commented out
                />

                {/* <Legend /> */} {/* Legend is hidden */}

                {showDeathBenefit && (
                    <Line isAnimationActive={true} type="monotone" dataKey="deathBenefit" stroke="#3b87eb" strokeWidth={2} name="ผลประโยชน์กรณีเสียชีวิต" dot={false} activeDot={renderActiveDot} />
                )}
                {showAccountValue && (
                    <Line isAnimationActive={true} type="monotone" dataKey="accountValue" stroke="#F5A623" strokeWidth={2} name="มูลค่าบัญชีกรมธรรม์" dot={false} activeDot={renderActiveDot} />
                )}
                {showPremiumAnnual && (
                    <Line isAnimationActive={true} type="monotone" dataKey="premiumAnnual" stroke="red" strokeWidth={2} name="เบี้ยประกันภัยรายปี" dot={false} activeDot={renderActiveDot} />
                )}
                {showPremiumCumulative && (
                    <Line isAnimationActive={true} type="monotone" dataKey="premiumCumulative" stroke="green" strokeWidth={2} name="เบี้ยประกันภัยสะสม" dot={false} activeDot={renderActiveDot} />
                )}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default Graph;
