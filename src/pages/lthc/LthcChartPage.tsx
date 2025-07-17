import React, { useState, useMemo, useCallback, useEffect } from 'react'; // เพิ่ม useEffect
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label as RechartsLabel } from 'recharts';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ... (Helper Functions และ Type Definitions เหมือนเดิม) ...
const formatNum = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return Math.round(value).toLocaleString();
};

export type LthcChartDataType = {
    age: number;
    healthPlan_cumulativePremium: number;
    healthPlan_deathBenefit: number;
    lthcPlan_cumulativePremium: number;
    lthcPlan_deathBenefit: number;
    lthcPlan_accountValue: number;
    lthc_healthPremiumPaidByUser: number;
    lthc_iWealthyPremium: number;
    lthc_pensionPremium: number;
    lthc_iWealthyDB: number;
    lthc_pensionDB: number;
    lthc_iWealthyAV: number;
    lthc_pensionCSV: number;
    lthc_iWealthyWithdrawal: number;
    lthc_pensionAnnuity: number;
    lthc_hybridTotalWithdrawal: number;
};

const InfoCard = ({ title, children, className, style }: { title: string, children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
    <Card className={className} style={style}>
        <CardHeader className="pb-2">
            <CardTitle className="text-md font-semibold text-gray-700">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
            {children}
        </CardContent>
    </Card>
);

const DataRow = ({ label, value, color }: { label: string, value: string, color?: string }) => (
    <div className="flex justify-between items-baseline">
        <p className="text-gray-600">{label}</p>
        <p className="font-bold text-base" style={{ color: color || 'inherit' }}>{value}</p>
    </div>
);

// ... (GraphComponent, InfoCard, DataRow เหมือนเดิม) ...
const GraphComponent = ({ data, controls, setHoveredData, lineColors, hoveredAge }: any) => {
    const EmptyTooltipContent = () => null;

    const handleMouseMove = (e: any) => {
        if (e && e.activePayload && e.activePayload.length > 0) {
            setHoveredData(e.activePayload[0].payload as LthcChartDataType);
        }
    };

    // ✅ ย้าย handleMouseLeave มาวางในตำแหน่งที่ถูกต้อง
    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    // ✅ มี AgeIndicatorLabel แค่ฟังก์ชันเดียว
    const AgeIndicatorLabel = ({ viewBox, age }: { viewBox?: any, age?: number }) => {
        if (!viewBox || age === undefined) return null;

        const { x } = viewBox;
        return (
            <g transform={`translate(${x}, 10)`}>
              <rect x={-40} y={0} width={80} height={22} fill="#2563eb" rx={11} />
              <text x={0} y={15} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                อายุ {age}
              </text>
            </g>
        );
    };

    const renderActiveDot = (props: any): React.ReactElement => {
        const { cx, cy, dataKey } = props;
        let dotStrokeColor = 'grey';
        let shouldRender = false;

        if (typeof cx !== 'number' || typeof cy !== 'number') return <></>;

        switch (dataKey) {
            case 'healthPlan_cumulativePremium': if (controls.showHealthPremiumAlone) { dotStrokeColor = lineColors.healthPremiumAlone; shouldRender = true; } break;
            case 'lthcPlan_cumulativePremium': if (controls.showLthcCombinedPremium) { dotStrokeColor = lineColors.lthcCombinedPremium; shouldRender = true; } break;
            case 'lthc_healthPremiumPaidByUser': if (controls.showLthcHealthPaidByUser) { dotStrokeColor = lineColors.lthcHealthPaidByUser; shouldRender = true; } break;
            case 'lthc_iWealthyPremium': if (controls.showIWealthyPremium) { dotStrokeColor = lineColors.iWealthyPremium; shouldRender = true; } break;
            case 'lthc_pensionPremium': if (controls.showPensionPremium) { dotStrokeColor = lineColors.pensionPremium; shouldRender = true; } break;
            case 'healthPlan_deathBenefit': if (controls.showHealthDeathBenefit) { dotStrokeColor = lineColors.healthDeathBenefit; shouldRender = true; } break;
            case 'lthcPlan_deathBenefit': if (controls.showLthcDeathBenefit) { dotStrokeColor = lineColors.lthcDeathBenefit; shouldRender = true; } break;
            case 'lthc_iWealthyAV': if (controls.showIWealthyAV) { dotStrokeColor = lineColors.iWealthyAV; shouldRender = true; } break;
            case 'lthc_pensionCSV': if (controls.showPensionCSV) { dotStrokeColor = lineColors.pensionCSV; shouldRender = true; } break;
            case 'lthc_iWealthyWithdrawal': if (controls.showIWealthyWithdrawal) { dotStrokeColor = lineColors.iWealthyWithdrawal; shouldRender = true; } break;
            case 'lthc_pensionAnnuity': if (controls.showPensionAnnuity) { dotStrokeColor = lineColors.pensionAnnuity; shouldRender = true; } break;
            case 'lthc_hybridTotalWithdrawal': if (controls.showHybridWithdrawal) { dotStrokeColor = lineColors.hybridTotalWithdrawal; shouldRender = true; } break;
            default: shouldRender = false;
        }

        if (shouldRender) {
            return <circle cx={cx} cy={cy} r={6} stroke={dotStrokeColor} strokeWidth={2} fill="white" />;
        }
        return <></>;
    };

    const getTicks = useCallback((dataForTicks: LthcChartDataType[]): number[] => {
        if (!dataForTicks || dataForTicks.length === 0) return [];
        const ages = dataForTicks.map(d => d.age);
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        const ticks: Set<number> = new Set();
        ticks.add(minAge);
        for (let i = Math.ceil(minAge / 5) * 5; i <= maxAge; i += 5) {
            if (i > minAge && i < maxAge) ticks.add(i);
        }
        ticks.add(maxAge);
        return Array.from(ticks).sort((a,b) => a-b);
    }, []);

    const memoizedTicks = useMemo(() => getTicks(data), [data, getTicks]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 40, right: 60, left: 10, bottom: 20 }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1d5db" />
                <XAxis dataKey="age" tick={{ fontSize: 10, fill: '#666' }} dy={10} ticks={memoizedTicks} interval="preserveStartEnd">
                    <RechartsLabel value="อายุ (ปี)" offset={25} position="right" style={{ fontSize: 11, fill:'#555' }} />
                </XAxis>
                <YAxis tickFormatter={(tick) => `${(tick / 1000000).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:1})}M`} tick={{ fontSize: 10, fill: '#666' }}>
                    <RechartsLabel value="มูลค่า (ล้านบาท)" angle={0} position="top" style={{ fontSize: 11, fill:'#555' }} offset={15} />
                </YAxis>
                <Tooltip content={<EmptyTooltipContent />} cursor={{ stroke: 'rgba(100, 100, 100, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' }} isAnimationActive={false} />

                {hoveredAge && (
                    <ReferenceLine x={hoveredAge} stroke="rgba(100, 100, 100, 0.4)" strokeDasharray="3 3"
                        label={<AgeIndicatorLabel age={hoveredAge} />}
                    />
                )}

                {controls.showPremiums && controls.showHealthPremiumAlone && <Line isAnimationActive={false} type="monotone" dataKey="healthPlan_cumulativePremium" stroke={lineColors.healthPremiumAlone} strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
                {controls.showPremiums && controls.showLthcCombinedPremium && <Line isAnimationActive={false} type="monotone" dataKey="lthcPlan_cumulativePremium" stroke={lineColors.lthcCombinedPremium} strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
                {controls.showPremiums && controls.showLthcHealthPaidByUser && <Line isAnimationActive={false} type="monotone" dataKey="lthc_healthPremiumPaidByUser" stroke={lineColors.lthcHealthPaidByUser} strokeDasharray="3 3" dot={false} activeDot={renderActiveDot} />}
                {controls.showPremiums && controls.showIWealthyPremium && <Line isAnimationActive={false} type="monotone" dataKey="lthc_iWealthyPremium" stroke={lineColors.iWealthyPremium} strokeDasharray="3 3" dot={false} activeDot={renderActiveDot} />}
                {controls.showPremiums && controls.showPensionPremium && <Line isAnimationActive={false} type="monotone" dataKey="lthc_pensionPremium" stroke={lineColors.pensionPremium} strokeDasharray="3 3" dot={false} activeDot={renderActiveDot} />}
                {controls.showDeathBenefits && controls.showHealthDeathBenefit && <Line isAnimationActive={false} type="stepAfter" dataKey="healthPlan_deathBenefit" stroke={lineColors.healthDeathBenefit} strokeDasharray="5 5" dot={false} activeDot={renderActiveDot} />}
                {controls.showDeathBenefits && controls.showLthcDeathBenefit && <Line isAnimationActive={false} type="monotone" dataKey="lthcPlan_deathBenefit" stroke={lineColors.lthcDeathBenefit} strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
                {controls.showAccountValue && controls.showIWealthyAV && <Line isAnimationActive={false} type="monotone" dataKey="lthc_iWealthyAV" stroke={lineColors.iWealthyAV} strokeWidth={2} dot={false} activeDot={renderActiveDot} />}
                {controls.showAccountValue && controls.showPensionCSV && <Line isAnimationActive={false} type="monotone" dataKey="lthc_pensionCSV" stroke={lineColors.pensionCSV} strokeDasharray="3 3" dot={false} activeDot={renderActiveDot} />}
                {controls.showAccountValue && controls.showIWealthyWithdrawal && <Line isAnimationActive={false} type="monotone" dataKey="lthc_iWealthyWithdrawal" stroke={lineColors.iWealthyWithdrawal} strokeWidth={2.5} dot={false} activeDot={renderActiveDot} />}
                {controls.showAccountValue && controls.showPensionAnnuity && <Line isAnimationActive={false} type="monotone" dataKey="lthc_pensionAnnuity" stroke={lineColors.pensionAnnuity} strokeWidth={2.5} dot={false} activeDot={renderActiveDot} />}
                {controls.showAccountValue && controls.showHybridWithdrawal && <Line isAnimationActive={false} type="monotone" dataKey="lthc_hybridTotalWithdrawal" stroke={lineColors.hybridTotalWithdrawal} strokeWidth={2.5} dot={false} activeDot={renderActiveDot} />}

                <ReferenceLine x={60} stroke="grey" strokeDasharray="3 3" />
            </LineChart>
        </ResponsiveContainer>
    );
};
const GraphControls = ({ controls, handleControlChange, fundingSource, lineColors }: any) => {
    const showPension = fundingSource === 'pension' || fundingSource === 'hybrid';
    const showIWealthy = fundingSource === 'iWealthy' || fundingSource === 'hybrid';

    const ControlItem = ({ controlKey, label, colorKey }: any) => {
        const color = lineColors[colorKey];
        const isChecked = controls[controlKey];
        return (
            <div className="flex items-center space-x-2 py-1 cursor-pointer" onClick={() => handleControlChange(controlKey, !isChecked)}>
                <Checkbox id={controlKey} checked={isChecked} onCheckedChange={(val: boolean) => handleControlChange(controlKey, val)} style={{ '--checkbox-color': color } as React.CSSProperties} className="h-4 w-4 rounded-sm border-gray-400 data-[state=checked]:text-white data-[state=checked]:border-transparent lthc-checkbox" />
                <Label htmlFor={controlKey} className="text-sm cursor-pointer" style={{ color: isChecked ? color : '#6b7280' }}>{label}</Label>
            </div>
        );
    };

    return (
        // ✅ 1. เปลี่ยนพื้นหลังหลักเป็นสีเทาอ่อน
        <Card className="h-full flex flex-col bg-slate-50">
            {/* ✅ 2. เพิ่ม Gradient ที่ Header */}
            <CardHeader style={{ background: 'linear-gradient(to right, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0))' }}>
                <CardTitle className="text-md text-slate-800">ตัวเลือกแสดงผลกราฟ</CardTitle>
            </CardHeader>

            <CardContent className="text-xs flex-grow overflow-y-auto p-4">
                {/* --- กลุ่มเบี้ยประกัน --- */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="font-medium text-base text-slate-700">เบี้ยสะสม</Label>
                        <Switch id="show-premiums" checked={controls.showPremiums} onCheckedChange={(val) => handleControlChange('showPremiums', val)} className="data-[state=checked]:bg-blue-500" />
                    </div>
                    {controls.showPremiums && (
                        // ✅ 4. จัดกลุ่มตัวเลือกย่อยให้สวยงาม
                        <div className="pl-3 pr-2 py-2 space-y-1 bg-white/60 rounded-lg border border-slate-200/80 mt-1">
                            <ControlItem controlKey="showHealthPremiumAlone" label="แผนสุขภาพ (ชำระเอง)" colorKey="healthPremiumAlone" />
                            <ControlItem controlKey="showLthcCombinedPremium" label="แผน LTHC (รวม)" colorKey="lthcCombinedPremium" />
                            <div className="pl-5 space-y-1">
                                <ControlItem controlKey="showLthcHealthPaidByUser" label="ชำระเอง (ในแผน LTHC)" colorKey="lthcHealthPaidByUser" />
                                {showIWealthy && <ControlItem controlKey="showIWealthyPremium" label="เบี้ย iWealthy" colorKey="iWealthyPremium" />}
                                {showPension && <ControlItem controlKey="showPensionPremium" label="เบี้ยบำนาญ" colorKey="pensionPremium" />}
                            </div>
                        </div>
                    )}
                </div>

                {/* ✅ 3. ปรับสีเส้นคั่น */}
                <Separator className="my-4 bg-slate-200" />

                {/* --- กลุ่มความคุ้มครองชีวิต --- */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="font-medium text-base text-slate-700">ความคุ้มครองชีวิต</Label>
                        <Switch checked={controls.showDeathBenefits} onCheckedChange={(val) => handleControlChange('showDeathBenefits', val)} className="data-[state=checked]:bg-blue-500" />
                    </div>
                    {controls.showDeathBenefits && (
                         <div className="pl-3 pr-2 py-2 space-y-1 bg-white/60 rounded-lg border border-slate-200/80 mt-1">
                            <ControlItem controlKey="showHealthDeathBenefit" label="แผนสุขภาพ" colorKey="healthDeathBenefit" />
                            <ControlItem controlKey="showLthcDeathBenefit" label="แผน LTHC" colorKey="lthcDeathBenefit" />
                        </div>
                    )}
                </div>
                
                <Separator className="my-4 bg-slate-200" />

                {/* --- กลุ่มมูลค่าและเงินถอน --- */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="font-medium text-base text-slate-700">มูลค่าและเงินถอน</Label>
                        <Switch checked={controls.showAccountValue} onCheckedChange={(val) => handleControlChange('showAccountValue', val)} className="data-[state=checked]:bg-blue-500" />
                    </div>
                    {controls.showAccountValue && (
                         <div className="pl-3 pr-2 py-2 space-y-1 bg-white/60 rounded-lg border border-slate-200/80 mt-1">
                            {showIWealthy && <ControlItem controlKey="showIWealthyAV" label="มูลค่า iWealthy" colorKey="iWealthyAV" />}
                            {showPension && <ControlItem controlKey="showPensionCSV" label="มูลค่าเวนคืนบำนาญ" colorKey="pensionCSV" />}
                            {showIWealthy && <ControlItem controlKey="showIWealthyWithdrawal" label="เงินถอนสะสม iWealthy" colorKey="iWealthyWithdrawal" />}
                            {showPension && <ControlItem controlKey="showPensionAnnuity" label="เงินบำนาญสะสม" colorKey="pensionAnnuity" />}
                            {fundingSource === 'hybrid' && <ControlItem controlKey="showHybridWithdrawal" label="เงินถอนรวมสะสม (Hybrid)" colorKey="hybridTotalWithdrawal" />}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
// =================================================================================
// +++ Main Page Component +++
// =================================================================================
// ✅ --- สร้างฟังก์ชันสำหรับกำหนดค่า State เริ่มต้น --- ✅
const getInitialControlsState = (fundingSource: string | null) => {
    const showIWealthy = fundingSource === 'iWealthy' || fundingSource === 'hybrid';
    const showPension = fundingSource === 'pension' || fundingSource === 'hybrid';

    return {
        showPremiums: true,
        showHealthPremiumAlone: true,
        showLthcCombinedPremium: true,
        showLthcHealthPaidByUser: false,
        showIWealthyPremium: false, // <-- กำหนดตาม fundingSource
        showPensionPremium: showPension, // <-- กำหนดตาม fundingSource

        showDeathBenefits: true,
        showHealthDeathBenefit: false,
        showLthcDeathBenefit: true,

        showAccountValue: false,
        showIWealthyAV: showIWealthy, // <-- กำหนดตาม fundingSource
        showPensionCSV: showPension, // <-- กำหนดตาม fundingSource
        showIWealthyWithdrawal: showIWealthy, // <-- กำหนดตาม fundingSource
        showPensionAnnuity: showPension, // <-- กำหนดตาม fundingSource
        showHybridWithdrawal: fundingSource === 'hybrid', // <-- กำหนดตาม fundingSource
    };
};


export default function LthcChartPage() {
    const { result, isLoading, error, fundingSource } = useAppStore();
    const navigate = useNavigate();

    const SHARED_LINE_COLORS = {
        healthPremiumAlone: "#ff7300",
        lthcCombinedPremium: "#387908",
        lthcHealthPaidByUser: "#eab308",
        iWealthyPremium: "#22c55e",
        pensionPremium: "#14b8a6",
        healthDeathBenefit: "#f97316",
        lthcDeathBenefit: "#8b5cf6",
        iWealthyAV: "#16a34a",
        pensionCSV: "#10b981",
        iWealthyWithdrawal: '#3b82f6',
        pensionAnnuity: '#d946ef',
        hybridTotalWithdrawal: '#84cc16'
    };
    
    // ✅ --- ใช้ฟังก์ชันใหม่ในการกำหนดค่าเริ่มต้นให้ useState --- ✅
    const [controls, setControls] = useState(() => getInitialControlsState(fundingSource));

    // ✅ --- เพิ่ม useEffect เพื่อ Reset State เมื่อ fundingSource เปลี่ยน --- ✅
    useEffect(() => {
        setControls(getInitialControlsState(fundingSource));
    }, [fundingSource]);


    const handleControlChange = (key: keyof typeof controls, value: boolean) => {
        setControls(prev => {
            const newState = { ...prev, [key]: value };

            if (key === 'showPremiums' && !value) {
                newState.showHealthPremiumAlone = false;
                newState.showLthcCombinedPremium = false;
                newState.showLthcHealthPaidByUser = false;
                newState.showIWealthyPremium = false;
                newState.showPensionPremium = false;
            }

            if (key === 'showDeathBenefits' && !value) {
                newState.showHealthDeathBenefit = false;
                newState.showLthcDeathBenefit = false;
            }

            if (key === 'showAccountValue' && !value) {
                newState.showIWealthyAV = false;
                newState.showPensionCSV = false;
                newState.showIWealthyWithdrawal = false;
                newState.showPensionAnnuity = false;
                newState.showHybridWithdrawal = false;
            }

            return newState;
        });
    };
    
    // ... โค้ดส่วนที่เหลือเหมือนเดิมทั้งหมด ...
    const chartDataFormatted: LthcChartDataType[] = useMemo(() => {
        if (!result || result.length === 0) return [];
        let cumHealthAlone = 0, cumLthcHealthPaidByUser = 0, cumIWPremium = 0, cumPensionPremium = 0;
        let cumIWealthyWithdrawal = 0;
        let cumPensionAnnuity = 0;
        let cumHybridWithdrawal = 0;

        return result.map(row => {
            cumHealthAlone += (row.totalHealthPremium || 0);
            let healthPaidByUserThisYear = 0;
            if (fundingSource === 'none' || row.age < 60) healthPaidByUserThisYear = row.totalHealthPremium || 0;
            else if (fundingSource === 'pension' && row.age > 88) healthPaidByUserThisYear = row.totalHealthPremium || 0;
            
            const iWealthyPremiumThisYear = row.iWealthyTotalPremium || 0;
            const pensionPremiumThisYear = row.pensionPremium || 0;
            cumLthcHealthPaidByUser += healthPaidByUserThisYear;
            cumIWPremium += iWealthyPremiumThisYear;
            cumPensionPremium += pensionPremiumThisYear;

            const iWealthyWithdrawalThisYear = row.iWealthyWithdrawal || 0;
            const pensionAnnuityThisYear = row.pensionPayout || 0;
            cumIWealthyWithdrawal += iWealthyWithdrawalThisYear;
            cumPensionAnnuity += pensionAnnuityThisYear;
            cumHybridWithdrawal += (iWealthyWithdrawalThisYear + pensionAnnuityThisYear);

            return {
                age: row.age,
                healthPlan_cumulativePremium: cumHealthAlone,
                healthPlan_deathBenefit: row.lifeReadyDeathBenefit || 0,
                lthcPlan_cumulativePremium: cumLthcHealthPaidByUser + cumIWPremium + cumPensionPremium,
                lthcPlan_deathBenefit: row.totalCombinedDeathBenefit || 0,
                lthcPlan_accountValue: (row.iWealthyEoyAccountValue ?? 0) + (row.pensionEOYCSV ?? 0),
                lthc_healthPremiumPaidByUser: cumLthcHealthPaidByUser,
                lthc_iWealthyPremium: cumIWPremium,
                lthc_pensionPremium: cumPensionPremium,
                lthc_iWealthyDB: row.iWealthyEoyDeathBenefit ?? 0,
                lthc_pensionDB: row.pensionDeathBenefit ?? 0,
                lthc_iWealthyAV: row.iWealthyEoyAccountValue ?? 0,
                lthc_pensionCSV: row.pensionEOYCSV ?? 0,
                lthc_iWealthyWithdrawal: cumIWealthyWithdrawal,
                lthc_pensionAnnuity: cumPensionAnnuity,
                lthc_hybridTotalWithdrawal: cumHybridWithdrawal
            };
        });
    }, [result, fundingSource]);

    const initialDataForInfoBox = useMemo(() => chartDataFormatted.length > 0 ? chartDataFormatted[0] : null, [chartDataFormatted]);
    const [currentInfoBoxData, setCurrentInfoBoxData] = useState<LthcChartDataType | null>(null);
    const displayData = currentInfoBoxData || initialDataForInfoBox;

    if (isLoading) return <div className="p-4 text-center">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="p-4 text-red-600">เกิดข้อผิดพลาด: {error}</div>;
    if (!result || !displayData) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณากลับไปหน้ากรอกข้อมูลและกด "คำนวณ" เพื่อดูผลประโยชน์
                <Button onClick={() => navigate('/lthc/form')} className="ml-2">ไปหน้ากรอกข้อมูล</Button>
            </div>
        );
    }

    const showIWealthy = fundingSource === 'iWealthy' || fundingSource === 'hybrid';
    const showPension = fundingSource === 'pension' || fundingSource === 'hybrid';

    return (
        <div className="p-4 md:p-6 space-y-4 min-h-screen bg-gray-50">
            <style>{`.lthc-checkbox[data-state="checked"] { background-color: var(--checkbox-color); border-color: var(--checkbox-color); }`}</style>
            
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-blue-800">กราฟเปรียบเทียบผลประโยชน์</h2>
                    <p className="text-gray-500 text-sm">ข้อมูล ณ อายุ {displayData.age} ปี (เลื่อนเมาส์บนกราฟเพื่อเปลี่ยนอายุ)</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/lthc/table')}>ไปที่ตาราง</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* กล่องที่ 1: เบี้ยประกัน (สีฟ้า -> ชมพู เหมือนเดิม) */}
                <InfoCard
                    title="เบี้ยประกันสะสม"
                    style={{ background: 'linear-gradient(90deg,rgb(161, 196, 253, 0.6) 0%,rgb(179, 248, 243, 0.6) 60%)' }}
                >
                    <DataRow label="สุขภาพ (ชำระเอง)" value={formatNum(displayData.healthPlan_cumulativePremium)} color={SHARED_LINE_COLORS.healthPremiumAlone} />
                    <DataRow label="แผน LTHC (รวม)" value={formatNum(displayData.lthcPlan_cumulativePremium)} color={SHARED_LINE_COLORS.lthcCombinedPremium} />
                </InfoCard>

                {/* กล่องที่ 2: ความคุ้มครองชีวิต (เปลี่ยนเป็นโทนสีเขียว) */}
                <InfoCard
                    title="ความคุ้มครองชีวิต"
                    style={{ background: 'linear-gradient(90deg, rgb(179, 248, 243, 0.6) 0%,rgb(185, 233, 163, 0.6) 60%)' }}
                >
                    <DataRow label="แผนสุขภาพ" value={formatNum(displayData.healthPlan_deathBenefit)} color={SHARED_LINE_COLORS.healthDeathBenefit} />
                    <DataRow label="แผน LTHC" value={formatNum(displayData.lthcPlan_deathBenefit)} color={SHARED_LINE_COLORS.lthcDeathBenefit} />
                </InfoCard>

                {/* กล่องที่ 3: มูลค่ากรมธรรม์ (ใช้สีเดิมของกล่องที่ 2) */}
                <InfoCard
                    title="มูลค่ากรมธรรม์"
                    style={{ background: 'linear-gradient(90deg,rgb(185, 233, 163, 0.6) 0%,rgb(234, 175, 219, 0.6) 60%)' }}
                >
                    {showIWealthy && <DataRow label="มูลค่า iWealthy" value={formatNum(displayData.lthc_iWealthyAV)} color={SHARED_LINE_COLORS.iWealthyAV} />}
                    {showPension && <DataRow label="มูลค่าเวนคืนบำนาญ" value={formatNum(displayData.lthc_pensionCSV)} color={SHARED_LINE_COLORS.pensionCSV} />}
                </InfoCard>

                {/* กล่องที่ 4: เงินถอนสะสม (ใช้สีเดิมของกล่องที่ 3) */}
                <InfoCard
                    title="เงินถอนสะสม"
                    style={{ background: 'linear-gradient(90deg,rgb(234, 175, 219, 0.6) 0%,rgb(232, 239, 202, 0.6) 60%)' }}
                >
                    {showIWealthy && <DataRow label="เงินถอน iWealthy" value={formatNum(displayData.lthc_iWealthyWithdrawal)} color={SHARED_LINE_COLORS.iWealthyWithdrawal} />}
                    {showPension && <DataRow label="เงินบำนาญ" value={formatNum(displayData.lthc_pensionAnnuity)} color={SHARED_LINE_COLORS.pensionAnnuity} />}
                    {fundingSource === 'hybrid' && <DataRow label="เงินถอนรวม (Hybrid)" value={formatNum(displayData.lthc_hybridTotalWithdrawal)} color={SHARED_LINE_COLORS.hybridTotalWithdrawal} />}
                </InfoCard>

            </div>
            
            <div className="flex flex-col md:flex-row w-full gap-4" style={{ height: '60vh' }}>
                <div className="flex-grow md:w-3/4 border border-gray-200 rounded-lg shadow-sm bg-[#f3f4f6] p-4 rounded-md">
                    <GraphComponent
                        data={chartDataFormatted}
                        controls={controls}
                        setHoveredData={setCurrentInfoBoxData}
                        lineColors={SHARED_LINE_COLORS}
                        hoveredAge={displayData?.age}
                    />
                </div>
                <div className="w-full md:w-1/4">
                     <GraphControls
                        controls={controls}
                        handleControlChange={handleControlChange}
                        fundingSource={fundingSource}
                        lineColors={SHARED_LINE_COLORS}
                     />
                </div>
            </div>
        </div>
    );
};