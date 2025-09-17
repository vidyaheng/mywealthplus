// src/pages/ci/CiReportPage.tsx

import { useState, useRef, useEffect, useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';
import { useAppStore } from '@/stores/appStore';
import { CiReportDocument } from './CiReportDocument';
import CiChartPage from './CiChartPage';
import { Button } from '@/components/ui/button';
import type { UseCiPlannerReturn, AnnualCiOutputRow } from '@/components/ci/types/useCiTypes';
import { calculateAllCiPremiumsSchedule } from '@/components/ci/utils/ciScheduleCalcs';
import { formatNumber } from '@/components/ci/utils/helpers';

// --- Component การ์ด KPI สำหรับหน้าเว็บ ---
const WebKPICard = ({ title, value, unit = 'บาท', description }: { title: string; value: string | number; unit?: string, description?: string }) => (
    <div className="flex flex-col p-4 bg-slate-50 rounded-lg border border-slate-200 h-full flex-1">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <p className="mt-1 text-2xl font-semibold text-sky-800">
            {value}
            {value !== '-' && unit && <span className="text-base font-normal ml-1.5 text-slate-500">{unit}</span>}
        </p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
);

// --- Component ตารางสำหรับหน้าเว็บ ---
const WebReportTable = ({ data, useIWealthy }: { data: AnnualCiOutputRow[], useIWealthy: boolean }) => {
    const firstZeroValueIndex = data.findIndex(row => (row.iWealthyEoyAccountValue ?? 0) <= 0);
    const displayResult = firstZeroValueIndex === -1 ? data : data.slice(0, firstZeroValueIndex);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="p-2 text-center font-semibold border">อายุ</th>
                        <th className="p-2 text-right font-semibold border">เบี้ย CI</th>
                        {useIWealthy && <th className="p-2 text-right font-semibold border">เบี้ย iW</th>}
                        {useIWealthy && <th className="p-2 text-right font-semibold border">เงินถอน iW</th>}
                        {useIWealthy && <th className="p-2 text-right font-semibold border">มูลค่าบัญชี iW</th>}
                        <th className="p-2 text-right font-semibold border">คุ้มครองชีวิตรวม</th>
                    </tr>
                </thead>
                <tbody>
                    {displayResult.map(row => (
                        <tr key={row.age} className="border-b">
                            <td className="p-2 text-center border">{row.age}</td>
                            <td className="p-2 text-right border">{formatNumber(row.totalCiPackagePremiumPaid)}</td>
                            {useIWealthy && <td className="p-2 text-right border">{formatNumber(row.iWealthyTotalPremium)}</td>}
                            {useIWealthy && <td className="p-2 text-right border">{formatNumber(Math.round(row.iWealthyWithdrawal ?? 0))}</td>}
                            {useIWealthy && <td className="p-2 text-right border font-semibold">{formatNumber(Math.round(row.iWealthyEoyAccountValue ?? 0))}</td>}
                            <td className="p-2 text-right border font-semibold">{formatNumber(Math.round(row.totalCombinedDeathBenefit ?? 0))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export default function CiReportPage() {
    // --- Data Fetching (Zustand v3 style) ---
    const ciResult = useAppStore(state => state.ciResult);
    const ciPlanSelections = useAppStore(state => state.ciPlanSelections);
    const ciControls = useAppStore(state => state.ciControls);
    const useIWealthy = useAppStore(state => state.ciUseIWealthy);
    const ciIsLoading = useAppStore(state => state.ciIsLoading);
    const ciError = useAppStore(state => state.ciError);
    const ciPlanningAge = useAppStore(state => state.ciPlanningAge);
    const setCiControls = useAppStore(state => state.setCiControls);
    const ciGender = useAppStore(state => state.ciGender);
    const ciPolicyOriginMode = useAppStore(state => state.ciPolicyOriginMode);
    const ciExistingEntryAge = useAppStore(state => state.ciExistingEntryAge);
    
    // --- Local State & Refs ---
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartImage, setChartImage] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    // --- Effects ---
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (ciResult && chartContainerRef.current && isClient) {
            setTimeout(() => {
                html2canvas(chartContainerRef.current!, { scale: 2, backgroundColor: 'white' }).then((canvas) => {
                    setChartImage(canvas.toDataURL('image/png'));
                });
            }, 500);
        }
    }, [ciResult, isClient]);

    // --- Memoized Calculations ---
    const summaryMetrics = useMemo(() => {
        if (!ciResult) return null;
        const purePremiumSchedule = calculateAllCiPremiumsSchedule(ciPlanningAge, ciGender, ciPlanSelections, ciPolicyOriginMode, ciExistingEntryAge);
        const totalCiPremiumPaidAlone = purePremiumSchedule.reduce((sum, row) => sum + (row.totalCiPremium ?? 0), 0);

        const firstYearCiPremium = purePremiumSchedule[0]?.totalCiPremium ?? 0;
        const firstYearIWealthyPremium = ciResult[0]?.iWealthyTotalPremium ?? 0;
        const initialIWealthyDb = ciResult[0]?.iWealthyEoyDeathBenefit ?? 0;

        let totalCostInLtciPlan = totalCiPremiumPaidAlone;
        let savings = 0;
        let initialDbWithIwealthy = ciResult[0]?.totalCombinedDeathBenefit ?? 0;

        if (useIWealthy) {
            const firstWithdrawalIndex = ciResult.findIndex(row => (row.iWealthyWithdrawal ?? 0) > 0);
            const effectiveFirstWithdrawalIndex = firstWithdrawalIndex === -1 ? ciResult.length : firstWithdrawalIndex;
            const ciPremiumPaidByUser = ciResult.slice(0, effectiveFirstWithdrawalIndex).reduce((sum, row) => sum + (row.totalCiPackagePremiumPaid ?? 0), 0);
            const totalIWealthyPremium = ciResult.reduce((sum, row) => sum + (row.iWealthyTotalPremium ?? 0), 0);
            totalCostInLtciPlan = ciPremiumPaidByUser + totalIWealthyPremium;
            savings = totalCiPremiumPaidAlone - totalCostInLtciPlan;
        }

        const initialDbWithoutIwealthy = (ciResult[0]?.totalCombinedDeathBenefit ?? 0) - (ciResult[0]?.iWealthyEoyDeathBenefit ?? 0);
        
        return {
            totalCiPremiumPaidAlone,
            totalCostInLtciPlan,
            savings,
            initialDbWithIwealthy,
            initialDbWithoutIwealthy,
            firstYearCiPremium,
            firstYearIWealthyPremium,
            initialIWealthyDb,
        };
    }, [ciResult, useIWealthy, ciPlanSelections, ciPlanningAge, ciGender, ciPolicyOriginMode, ciExistingEntryAge]);

    const chartProps: UseCiPlannerReturn = useMemo(() => ({
        result: ciResult, isLoading: ciIsLoading, error: ciError, policyholderEntryAge: ciPlanningAge, useIWealthy: useIWealthy,
        ciControls: ciControls, setCiControls: setCiControls, policyholderGender: 'male', setPolicyholderEntryAge: () => {},
        setPolicyholderGender: () => {}, policyOriginMode: 'newPolicy', setPolicyOriginMode: () => {}, setExistingPolicyEntryAge: () => {},
        selectedCiPlans: ciPlanSelections, setSelectedCiPlans: () => {}, setUseIWealthy: () => {}, iWealthyMode: 'automatic',
        setIWealthyMode: () => {}, iWealthyInvestmentReturn: 0, setIWealthyInvestmentReturn: () => {}, iWealthyOwnPPT: 0,
        setIWealthyOwnPPT: () => {}, iWealthyWithdrawalStartAge: 0, setIWealthyWithdrawalStartAge: () => {},
        ciUseCustomWithdrawalAge: false, setCiUseCustomWithdrawalAge: () => {}, manualRpp: 0, setManualRpp: () => {},
        manualRtu: 0, setManualRtu: () => {}, autoRppRtuRatio: '', setAutoRppRtuRatio: () => {}, ciPremiumsSchedule: null,
        runCalculation: async () => {},
    }), [ciResult, ciIsLoading, ciError, ciPlanningAge, useIWealthy, ciControls, setCiControls, ciPlanSelections]);

    // --- Render Guards ---
    if (!ciResult && !ciIsLoading) {
        return <div className="text-center p-10">กรุณากดคำนวณในหน้า "กรอกข้อมูล" เพื่อสร้างรายงาน</div>;
    }
    if (ciIsLoading) {
        return <div className="text-center p-10">กำลังคำนวณรายงาน...</div>;
    }

    // --- Main Render ---
    return (
        <div>
            {/* Hidden div for chart capture */}
            <div ref={chartContainerRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '800px', height: '500px', zIndex: -1, background: 'white' }}>
                {ciResult && <CiChartPage {...chartProps} isReportMode={true} />}
            </div>

            {/* Download Button */}
            <div className="p-4 text-right print:hidden">
                {isClient && chartImage && !ciIsLoading && summaryMetrics ? (
                    <PDFDownloadLink
                        document={
                            <CiReportDocument 
                                chartImage={chartImage}
                                ciResult={ciResult}
                                ciPlanSelections={ciPlanSelections}
                                ciControls={ciControls}
                                useIWealthy={useIWealthy}
                                summaryMetrics={summaryMetrics}
                            />
                        }
                        fileName={`CI-Planner-Report-${new Date().toISOString().slice(0, 10)}.pdf`}
                    >
                        {({ loading }) => (
                            <Button size="lg" disabled={loading} className="bg-green-600 hover:bg-green-700">
                                {loading ? 'กำลังสร้างเอกสาร...' : 'ดาวน์โหลดรายงาน PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                ) : (
                    <Button size="lg" disabled>
                        {ciIsLoading ? 'กำลังคำนวณ...' : 'กำลังเตรียมรายงาน...'}
                    </Button>
                )}
            </div>

            {/* Web Preview */}
            <div className="p-6 space-y-8 bg-white rounded-lg shadow-md">
                <header className="text-center border-b pb-4">
                    <h1 className="text-2xl font-bold text-blue-800">รายงานสรุปผลประโยชน์ แผนประกันโรคร้ายแรง</h1>
                    <p className="text-md text-slate-600">Long-Term Critical Illness (LTCI)</p>
                </header>

                <section>
                    <h2 className="text-xl font-semibold text-blue-700 border-l-4 border-blue-700 pl-3 mb-4">ข้อมูลเบื้องต้นของแผน</h2>
                    <div className="p-4 bg-slate-50 rounded-md space-y-2 text-sm">
                        {/* ส่วน CI Plans */}
                        {ciPlanSelections.icareChecked && <div className="flex justify-between"><span>iCare ทุนประกัน:</span> <span className="font-semibold">{formatNumber(ciPlanSelections.icareSA)} บาท</span></div>}
                        {ciPlanSelections.ishieldChecked && <div className="flex justify-between"><span>iShield (แผน {ciPlanSelections.ishieldPlan}) ทุนประกัน:</span> <span className="font-semibold">{formatNumber(ciPlanSelections.ishieldSA)} บาท</span></div>}
                        {ciPlanSelections.mainRiderChecked && <div className="flex justify-between"><span>LifeReady (ชำระเบี้ย {ciPlanSelections.lifeReadyPlan} ปี) ทุนประกัน:</span> <span className="font-semibold">{formatNumber(ciPlanSelections.lifeReadySA)} บาท</span></div>}
                        {ciPlanSelections.rokraiChecked && <div className="flex justify-between"><span>RokeRaiSoShield:</span> <span className="font-semibold">แผน {ciPlanSelections.rokraiPlan}</span></div>}
                        {ciPlanSelections.dciChecked && <div className="flex justify-between"><span>DCI ทุนประกัน:</span> <span className="font-semibold">{formatNumber(ciPlanSelections.dciSA)} บาท</span></div>}

                        {summaryMetrics && (
                            <>
                                {/* เส้นคั่น */}
                                {/*(ciPlanSelections.icareChecked || ciPlanSelections.ishieldChecked || ciPlanSelections.mainRiderChecked) && <div className="border-t !my-3"></div>*/}

                                {/* ส่วนเบี้ยปีแรก */}
                                {summaryMetrics.firstYearCiPremium > 0 && <div className="flex justify-between text-blue-700"><span>เบี้ย CI รวมปีแรก:</span> <span className="font-bold">{formatNumber(summaryMetrics.firstYearCiPremium)} บาท</span></div>}

                                {/* ส่วน iWealthy */}
                                {useIWealthy && (
                                    <>
                                        <div className="border-t !my-3"></div>
                                        <div className="flex justify-between"><span>iWealthy คุ้มครองชีวิตเริ่มต้น:</span> <span className="font-semibold">{formatNumber(summaryMetrics.initialIWealthyDb)} บาท</span></div>
                                        <div className="flex justify-between text-purple-700"><span>เบี้ย iWealthy ปีแรก:</span> <span className="font-bold">{formatNumber(summaryMetrics.firstYearIWealthyPremium)} บาท</span></div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {useIWealthy && summaryMetrics && (
                    <section>
                        <h2 className="text-xl font-semibold text-blue-700 border-l-4 border-blue-700 pl-3 mb-4">การวิเคราะห์เชิงเปรียบเทียบ</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <WebKPICard title="เบี้ย CI (หากจ่ายเองทั้งหมด)" value={formatNumber(summaryMetrics.totalCiPremiumPaidAlone)} />
                            <WebKPICard title="ค่าใช้จ่ายรวม (ในแผน LTCI)" value={formatNumber(summaryMetrics.totalCostInLtciPlan)} description="เบี้ย CI ที่จ่ายเอง + เบี้ย iW" />
                            <WebKPICard title="ประหยัดค่าเบี้ยได้" value={formatNumber(summaryMetrics.savings)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                             <WebKPICard title="คุ้มครองชีวิตเริ่มต้น (จ่ายเอง)" value={formatNumber(summaryMetrics.initialDbWithoutIwealthy)} />
                             <WebKPICard title="คุ้มครองชีวิตเริ่มต้น (แผน LTCI)" value={formatNumber(summaryMetrics.initialDbWithIwealthy)} />
                        </div>
                    </section>
                )}

                <section>
                    <h2 className="text-xl font-semibold text-blue-700 border-l-4 border-blue-700 pl-3 mb-4">กราฟแสดงผลประโยชน์</h2>
                    {chartImage ? 
                        <img src={chartImage} alt="Chart Preview" className="w-full border rounded-lg shadow-sm" />
                        : <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">กำลังสร้างภาพตัวอย่าง...</div>
                    }
                </section>

                <section>
                     <h2 className="text-xl font-semibold text-blue-700 border-l-4 border-blue-700 pl-3 mb-4">ตารางแสดงผลประโยชน์รายปี</h2>
                     {ciResult && <WebReportTable data={ciResult} useIWealthy={useIWealthy} />}
                </section>
            </div>
        </div>
    );
}