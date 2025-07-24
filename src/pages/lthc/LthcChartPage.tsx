// src/components/lthc/LthcChartPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraphControls } from '@/components/GraphControlLTHC'; 

// --- Helper Functions and Type Definitions ---
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

// --- Helper Components สำหรับ Info Cards (ปรับ Padding และ Font กลับมาให้สวยงาม) ---
const InfoCard = ({ title, children, className, style }: { title: string, children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
    <Card className={className} style={style}>
        <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-md font-semibold text-gray-700">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-1 text-sm">
            {children}
        </CardContent>
    </Card>
);

const DataRow = ({ label, value, color }: { label: string, value: string, color?: string }) => (
    <div className="flex justify-between items-baseline">
        <p className="text-gray-600 text-sm truncate">{label}</p>
        <p className="font-bold text-base whitespace-nowrap" style={{ color: color || 'inherit' }}>{value}</p>
    </div>
);


// --- GraphComponent (ยังคงเดิม) ---
const GraphComponent = ({ data, controls, setHoveredData, lineColors, hoveredAge }: any) => {
    const EmptyTooltipContent = () => null;
    const handleMouseMove = (e: any) => { if (e && e.activePayload && e.activePayload.length > 0) { setHoveredData(e.activePayload[0].payload as LthcChartDataType); } };
    const handleMouseLeave = () => { setHoveredData(null); };
    const AgeIndicatorLabel = ({ viewBox, age }: { viewBox?: any, age?: number }) => { if (!viewBox || age === undefined) return null; const { x } = viewBox; return (<g transform={`translate(${x}, 10)`}><rect x={-40} y={0} width={80} height={22} fill="#2563eb" rx={11} /><text x={0} y={15} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">อายุ {age}</text></g>); };
    const renderActiveDot = (props: any): React.ReactElement => { const { cx, cy, dataKey } = props; let dotStrokeColor = 'grey'; let shouldRender = false; if (typeof cx !== 'number' || typeof cy !== 'number') return <></>; switch (dataKey) { case 'healthPlan_cumulativePremium': if (controls.showHealthPremiumAlone) { dotStrokeColor = lineColors.healthPremiumAlone; shouldRender = true; } break; case 'lthcPlan_cumulativePremium': if (controls.showLthcCombinedPremium) { dotStrokeColor = lineColors.lthcCombinedPremium; shouldRender = true; } break; case 'lthc_healthPremiumPaidByUser': if (controls.showLthcHealthPaidByUser) { dotStrokeColor = lineColors.lthcHealthPaidByUser; shouldRender = true; } break; case 'lthc_iWealthyPremium': if (controls.showIWealthyPremium) { dotStrokeColor = lineColors.iWealthyPremium; shouldRender = true; } break; case 'lthc_pensionPremium': if (controls.showPensionPremium) { dotStrokeColor = lineColors.pensionPremium; shouldRender = true; } break; case 'healthPlan_deathBenefit': if (controls.showHealthDeathBenefit) { dotStrokeColor = lineColors.healthDeathBenefit; shouldRender = true; } break; case 'lthcPlan_deathBenefit': if (controls.showLthcDeathBenefit) { dotStrokeColor = lineColors.lthcDeathBenefit; shouldRender = true; } break; case 'lthc_iWealthyAV': if (controls.showIWealthyAV) { dotStrokeColor = lineColors.iWealthyAV; shouldRender = true; } break; case 'lthc_pensionCSV': if (controls.showPensionCSV) { dotStrokeColor = lineColors.pensionCSV; shouldRender = true; } break; case 'lthc_iWealthyWithdrawal': if (controls.showIWealthyWithdrawal) { dotStrokeColor = lineColors.iWealthyWithdrawal; shouldRender = true; } break; case 'lthc_pensionAnnuity': if (controls.showPensionAnnuity) { dotStrokeColor = lineColors.pensionAnnuity; shouldRender = true; } break; case 'lthc_hybridTotalWithdrawal': if (controls.showHybridWithdrawal) { dotStrokeColor = lineColors.hybridTotalWithdrawal; shouldRender = true; } break; default: shouldRender = false; } if (shouldRender) { return <circle cx={cx} cy={cy} r={6} stroke={dotStrokeColor} strokeWidth={2} fill="white" />; } return <></>; };
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 40, right: 30, left: 20, bottom: 20 }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} interval={4} />
                <YAxis tickFormatter={(tick) => `${(tick / 1000000).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:1})}M`} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<EmptyTooltipContent />} cursor={{ stroke: 'rgba(100, 100, 100, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' }} isAnimationActive={false} />
                {hoveredAge && <ReferenceLine x={hoveredAge} stroke="rgba(100, 100, 100, 0.4)" strokeDasharray="3 3" label={<AgeIndicatorLabel age={hoveredAge} />} />}
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

const getInitialControlsState = (fundingSource: string | null) => {
    const showIWealthy = fundingSource === 'iWealthy' || fundingSource === 'hybrid';
    const showPension = fundingSource === 'pension' || fundingSource === 'hybrid';
    return { showPremiums: true, showHealthPremiumAlone: true, showLthcCombinedPremium: true, showLthcHealthPaidByUser: false, showIWealthyPremium: false, showPensionPremium: showPension, showDeathBenefits: true, showHealthDeathBenefit: false, showLthcDeathBenefit: true, showAccountValue: false, showIWealthyAV: showIWealthy, showPensionCSV: showPension, showIWealthyWithdrawal: showIWealthy, showPensionAnnuity: showPension, showHybridWithdrawal: fundingSource === 'hybrid' };
};

export default function LthcChartPage() {
    const { result, isLoading, error, fundingSource } = useAppStore();
    const navigate = useNavigate();
    const [controls, setControls] = useState(() => getInitialControlsState(fundingSource));
    const [hoveredData, setHoveredData] = useState<LthcChartDataType | null>(null);

    const lineColors = {
        healthPremiumAlone: "#ff7300", lthcCombinedPremium: "#387908", lthcHealthPaidByUser: "#eab308",
        iWealthyPremium: "#22c55e", pensionPremium: "#14b8a6", healthDeathBenefit: "#f97316",
        lthcDeathBenefit: "#8b5cf6", iWealthyAV: "#16a34a", pensionCSV: "#10b981",
        iWealthyWithdrawal: '#3b82f6', pensionAnnuity: '#d946ef', hybridTotalWithdrawal: '#84cc16'
    };
    
    useEffect(() => { setControls(getInitialControlsState(fundingSource)); }, [fundingSource]);

    const handleControlChange = (key: keyof typeof controls, value: boolean) => {
        setControls(prev => {
            const newState = { ...prev, [key]: value };
            if (key === 'showPremiums' && !value) { Object.keys(newState).filter(k => k.includes('Premium')).forEach(k => newState[k as keyof typeof newState] = false); }
            if (key === 'showDeathBenefits' && !value) { Object.keys(newState).filter(k => k.includes('DeathBenefit')).forEach(k => newState[k as keyof typeof newState] = false); }
            if (key === 'showAccountValue' && !value) { Object.keys(newState).filter(k => k.includes('AV') || k.includes('CSV') || k.includes('Withdrawal') || k.includes('Annuity')).forEach(k => newState[k as keyof typeof newState] = false); }
            return newState;
        });
    };
    
    const chartDataFormatted: LthcChartDataType[] = useMemo(() => {
        if (!result || result.length === 0) return [];
        let cumHealthAlone = 0, cumLthcHealthPaidByUser = 0, cumIWPremium = 0, cumPensionPremium = 0;
        let cumIWealthyWithdrawal = 0, cumPensionAnnuity = 0, cumHybridWithdrawal = 0;
        return result.map(row => {
            const totalHealthPremiumThisYear = row.totalHealthPremium || 0;
            const iWealthyWithdrawalThisYear = row.iWealthyWithdrawal || 0;
            const pensionAnnuityThisYear = row.pensionPayout || 0;
            const fundingWithdrawal = iWealthyWithdrawalThisYear + pensionAnnuityThisYear;
            const healthPaidByUserThisYear = Math.max(0, totalHealthPremiumThisYear - fundingWithdrawal);
            cumHealthAlone += totalHealthPremiumThisYear;
            const iWealthyPremiumThisYear = row.iWealthyTotalPremium || 0;
            const pensionPremiumThisYear = row.pensionPremium || 0;
            cumLthcHealthPaidByUser += healthPaidByUserThisYear;
            cumIWPremium += iWealthyPremiumThisYear;
            cumPensionPremium += pensionPremiumThisYear;
            cumIWealthyWithdrawal += iWealthyWithdrawalThisYear;
            cumPensionAnnuity += pensionAnnuityThisYear;
            cumHybridWithdrawal += fundingWithdrawal;
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
    }, [result]);

    const initialDataForInfoBox = useMemo(() => chartDataFormatted.length > 0 ? chartDataFormatted[0] : null, [chartDataFormatted]);
    const displayData = hoveredData || initialDataForInfoBox;

    if (isLoading) return <div className="p-4 text-center">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="p-4 text-red-600">เกิดข้อผิดพลาด: {error}</div>;
    if (!result || !displayData) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณากลับไปหน้ากรอกข้อมูลและกด "คำนวณ"
                <Button onClick={() => navigate('/lthc/form')} className="ml-2">ไปหน้ากรอกข้อมูล</Button>
            </div>
        );
    }
    
    const showIWealthy = fundingSource === 'iWealthy' || fundingSource === 'hybrid';
    const showPension = fundingSource === 'pension' || fundingSource === 'hybrid';

    return (
        <div className="space-y-4 p-4 md:p-6 bg-slate-100 min-h-screen">
            <style>{`.lthc-checkbox[data-state="checked"] { background-color: var(--checkbox-color); border-color: var(--checkbox-color); }`}</style>
            
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">กราฟเปรียบเทียบผลประโยชน์</h2>
                    <p className="text-gray-600 text-sm">ข้อมูล ณ อายุ {displayData.age} ปี (เลื่อนเมาส์บนกราฟเพื่อเปลี่ยนอายุ)</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/lthc/table')}>ไปที่ตาราง</Button>
            </div>

            {/* +++ ADDED BACK: นำ Style Gradient กลับมาใส่ให้ InfoCard +++ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard
                    title="เบี้ยประกันสะสม"
                    style={{ background: 'linear-gradient(90deg,rgb(161, 196, 253, 0.6) 0%,rgb(179, 248, 243, 0.6) 60%)' }}
                >
                    <DataRow label="สุขภาพ (ชำระเอง)" value={formatNum(displayData.healthPlan_cumulativePremium)} color={lineColors.healthPremiumAlone} />
                    <DataRow label="แผน LTHC (รวม)" value={formatNum(displayData.lthcPlan_cumulativePremium)} color={lineColors.lthcCombinedPremium} />
                </InfoCard>
                <InfoCard
                    title="ความคุ้มครองชีวิต"
                    style={{ background: 'linear-gradient(90deg, rgb(179, 248, 243, 0.6) 0%,rgb(185, 233, 163, 0.6) 60%)' }}
                >
                    <DataRow label="แผนสุขภาพ" value={formatNum(displayData.healthPlan_deathBenefit)} color={lineColors.healthDeathBenefit} />
                    <DataRow label="แผน LTHC" value={formatNum(displayData.lthcPlan_deathBenefit)} color={lineColors.lthcDeathBenefit} />
                </InfoCard>
                <InfoCard
                    title="มูลค่ากรมธรรม์"
                    style={{ background: 'linear-gradient(90deg,rgb(185, 233, 163, 0.6) 0%,rgb(234, 175, 219, 0.6) 60%)' }}
                >
                    {showIWealthy && <DataRow label="มูลค่า iWealthy" value={formatNum(displayData.lthc_iWealthyAV)} color={lineColors.iWealthyAV} />}
                    {showPension && <DataRow label="มูลค่าเวนคืนบำนาญ" value={formatNum(displayData.lthc_pensionCSV)} color={lineColors.pensionCSV} />}
                </InfoCard>
                <InfoCard
                    title="เงินถอนสะสม"
                    style={{ background: 'linear-gradient(90deg,rgb(234, 175, 219, 0.6) 0%,rgb(232, 239, 202, 0.6) 60%)' }}
                >
                    {showIWealthy && <DataRow label="เงินถอน iWealthy" value={formatNum(displayData.lthc_iWealthyWithdrawal)} color={lineColors.iWealthyWithdrawal} />}
                    {showPension && <DataRow label="เงินบำนาญ" value={formatNum(displayData.lthc_pensionAnnuity)} color={lineColors.pensionAnnuity} />}
                    {fundingSource === 'hybrid' && <DataRow label="เงินถอนรวม (Hybrid)" value={formatNum(displayData.lthc_hybridTotalWithdrawal)} color={lineColors.hybridTotalWithdrawal} />}
                </InfoCard>
            </div>
            
            <div className="flex flex-col md:flex-row w-full gap-4" style={{ height: '60vh' }}>
                <div className="flex-grow md:w-3/4 border border-gray-200 rounded-lg shadow-sm bg-white p-2">
                    <GraphComponent
                        data={chartDataFormatted}
                        controls={controls}
                        setHoveredData={setHoveredData}
                        lineColors={lineColors}
                        hoveredAge={displayData?.age}
                    />
                </div>
                <div className="w-full md:w-1/4">
                     <GraphControls
                        controls={controls}
                        handleControlChange={handleControlChange}
                        fundingSource={fundingSource}
                        lineColors={lineColors}
                     />
                </div>
            </div>
        </div>
    );
};