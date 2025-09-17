// src/pages/lthc/LthcReportPage.tsx

import { PDFDownloadLink } from '@react-pdf/renderer';
import { LthcReportDocument } from './LthcReportDocument';
import LthcTablePage from './LthcTablePage';
import LthcChartPage from './LthcChartPage';
import { useAppStore } from '@/stores/appStore';
import { useMemo, useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
// Import ฟังก์ชันคำนวณเบี้ยประกัน (อาจจะต้องปรับ Path ให้ถูกต้อง)
import { calculateLifeReadyPremium, calculateIHealthyUltraPremium, calculateMEBPremium } from '../../lib/healthPlanCalculations';


// --- Helper Functions ---
const formatDate = (date: Date) => date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
const formatNum = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '-';
    return Math.round(value).toLocaleString();
};

const lineColors = {
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

// 👇 สร้าง Legend Component ใหม่สำหรับหน้าเว็บโดยเฉพาะ
const ReportPageChartLegend = ({ fundingSource, controls }: { fundingSource: string | null, controls: any }) => {
    if (!controls) return null;

    const showIWealthy = fundingSource === 'iWealthy' || fundingSource === 'hybrid';
    const showPension = fundingSource === 'pension' || fundingSource === 'hybrid';

    const LegendItem = ({ color, text }: { color: string, text: string }) => (
        <div className="flex items-center">
            <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: color }}></span>
            <span className="text-xs text-slate-600">{text}</span>
        </div>
    );

    const visibleLegends = [
        controls.showPremiums && controls.showHealthPremiumAlone && { color: lineColors.healthPremiumAlone, text: "เบี้ยสุขภาพ (จ่ายเอง)" },
        controls.showPremiums && controls.showLthcCombinedPremium && { color: lineColors.lthcCombinedPremium, text: "เบี้ย LTHC (รวม)" },
        controls.showPremiums && controls.showLthcHealthPaidByUser && { color: lineColors.lthcHealthPaidByUser, text: "เบี้ยสุขภาพ (ในแผน LTHC)" },
        controls.showPremiums && showIWealthy && controls.showIWealthyPremium && { color: lineColors.iWealthyPremium, text: "เบี้ย iWealthy" },
        controls.showPremiums && showPension && controls.showPensionPremium && { color: lineColors.pensionPremium, text: "เบี้ยบำนาญ" },
        controls.showDeathBenefits && controls.showHealthDeathBenefit && { color: lineColors.healthDeathBenefit, text: "คช. แผนสุขภาพ" },
        controls.showDeathBenefits && controls.showLthcDeathBenefit && { color: lineColors.lthcDeathBenefit, text: "คช. LTHC" },
        controls.showAccountValue && showIWealthy && controls.showIWealthyAV && { color: lineColors.iWealthyAV, text: "มูลค่า iWealthy" },
        controls.showAccountValue && showPension && controls.showPensionCSV && { color: lineColors.pensionCSV, text: "มูลค่าเวนคืนบำนาญ" },
        controls.showAccountValue && showIWealthy && controls.showIWealthyWithdrawal && { color: lineColors.iWealthyWithdrawal, text: "เงินถอน iWealthy" },
        controls.showAccountValue && showPension && controls.showPensionAnnuity && { color: lineColors.pensionAnnuity, text: "เงินบำนาญ" },
        controls.showAccountValue && fundingSource === 'hybrid' && controls.showHybridWithdrawal && { color: lineColors.hybridTotalWithdrawal, text: "เงินถอนรวม (Hybrid)" }
    ].filter(Boolean); // กรองเอาเฉพาะอันที่แสดงผล (ตัดค่า false, null, undefined ออก)

    if (visibleLegends.length === 0) return null; // ถ้าไม่มีเส้นไหนถูกเลือก ก็ไม่ต้องแสดง Legend

    return (
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 p-2 mt-2 border rounded-lg bg-slate-50">
            {visibleLegends.map((legend: any) => (
                <LegendItem key={legend.text} color={legend.color} text={legend.text} />
            ))}
        </div>
    );
};

// --- Component การ์ด KPI ---
const KPICard = ({ title, value, unit = '', description }: { title: string; value: string | number | null; unit?: string, description?: string }) => (
    <div className="flex flex-col p-4 bg-slate-50 rounded-lg border border-slate-200 h-full">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <p className="mt-1 text-2xl font-semibold text-sky-800">
            {value}
            {value !== '-' && unit && <span className="text-base font-normal ml-1.5 text-slate-500">{unit}</span>}
        </p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
);

// --- Component หลักของหน้ารายงาน LTHC ---
export const LthcReportPage = () => {
    // 1. ดึงข้อมูล LTHC ทั้งหมดที่จำเป็นจาก Store
    const {
        result, isLoading, fundingSource, policyholderEntryAge, policyholderGender,
        selectedHealthPlans, policyOriginMode, existingPolicyEntryAge,
        iWealthyMode, manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT, manualWithdrawalStartAge,
        autoInvestmentReturn, autoIWealthyPPT,lthcControls 
    } = useAppStore();

    // 2. คำนวณ Metrics และข้อมูลสรุปที่ต้องการ
    const summaryData = useMemo(() => {
        if (!result || result.length === 0) return null;

        // คำนวณเบี้ยสุขภาพปีแรก
        const entryAgeForLr = (policyOriginMode === 'existingPolicy' && existingPolicyEntryAge) ? existingPolicyEntryAge : policyholderEntryAge;
        const firstYearLrPremium = calculateLifeReadyPremium(entryAgeForLr, policyholderGender, selectedHealthPlans.lifeReadySA, selectedHealthPlans.lifeReadyPPT);
        const firstYearIhuPremium = selectedHealthPlans.iHealthyUltraPlan ? calculateIHealthyUltraPremium(policyholderEntryAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan) : 0;
        const firstYearMebPremium = selectedHealthPlans.mebPlan ? calculateMEBPremium(policyholderEntryAge, selectedHealthPlans.mebPlan) : 0;

        // คำนวณค่าเปรียบเทียบ
        let totalHealthPremiumIfPaidAlone = 0;
        let lthcHealthPremiumPaidByUser = 0;
        let lthcTotalFundingPremium = 0;
        let totalWithdrawals = 0;

        result.forEach(row => {
            totalHealthPremiumIfPaidAlone += row.totalHealthPremium || 0;
            const fundIsActive = (row.iWealthyWithdrawal ?? 0) > 0 || (row.pensionPayout ?? 0) > 0;
            if (!fundIsActive) {
                lthcHealthPremiumPaidByUser += row.totalHealthPremium || 0;
            }
            lthcTotalFundingPremium += (row.iWealthyTotalPremium || 0) + (row.pensionPremium || 0);
            totalWithdrawals += (row.iWealthyWithdrawal || 0) + (row.pensionPayout || 0);
        });
        
        const lthcTotalCombinedPremiumPaid = lthcHealthPremiumPaidByUser + lthcTotalFundingPremium;
        const totalSavings = totalHealthPremiumIfPaidAlone - lthcTotalCombinedPremiumPaid;
        const initialSA = result[0].iWealthyEoyDeathBenefit ?? 0;

        return {
            firstYearLrPremium, firstYearIhuPremium, firstYearMebPremium,
            totalHealthPremiumIfPaidAlone, lthcTotalCombinedPremiumPaid, totalSavings,
            totalWithdrawals, initialSA
        };
    }, [result, policyholderEntryAge, policyholderGender, selectedHealthPlans, policyOriginMode, existingPolicyEntryAge]);

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartImage, setChartImage] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    //const controlsForPdf = useMemo(() => getInitialControlsState(fundingSource), [fundingSource]);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    // จับภาพกราฟเมื่อ result เปลี่ยน
    useEffect(() => {
        if (chartContainerRef.current && isClient && result) {
            setTimeout(() => {
                html2canvas(chartContainerRef.current!, { scale: 2, backgroundColor: null }).then((canvas) => {
                    setChartImage(canvas.toDataURL('image/png'));
                });
            }, 500);
        }
    }, [isClient, result]);

    if (isLoading) return <div className="text-center p-10">กำลังจัดทำรายงาน...</div>;
    if (!result || !summaryData) return <div className="text-center p-10 text-gray-500">กรุณากดคำนวณในหน้า "กรอกข้อมูล" เพื่อจัดทำรายงาน</div>;

    //const planDetailsForPdf = {
    //    healthPlans: [
    //        `LifeReady (SA: ${formatNum(selectedHealthPlans.lifeReadySA)})`,
    //        selectedHealthPlans.iHealthyUltraPlan ? `iHealthy Ultra (${selectedHealthPlans.iHealthyUltraPlan})` : null,
    //        selectedHealthPlans.mebPlan ? `MEB (${formatNum(selectedHealthPlans.mebPlan)})` : null
    //    ].filter(Boolean) as string[],
    //    fundingSource: fundingSource,
    //    iWealthyParams: fundingSource === 'iWealthy'
    //        ? `ผลตอบแทน ${iWealthyMode === 'manual' ? manualInvestmentReturn : autoInvestmentReturn}%, จ่ายเบี้ย ${iWealthyMode === 'manual' ? manualIWealthyPPT : autoIWealthyPPT} ปี`
    //        : undefined
    //};
    //const lthcControls = useAppStore(state => state.lthcControls);

    console.log('Controls being sent to PDF:', lthcControls);
    
    return (
        <div className="bg-gray-100 font-sans">
            <div ref={chartContainerRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '800px', height: '400px', zIndex: -1 }}>
                <LthcChartPage isReportMode={true} />
            </div>
            <div className="p-4 text-right print:hidden">
                {isClient && (
                    <PDFDownloadLink
                        document={
                            <LthcReportDocument 
                                result={result}
                                metrics={summaryData}
                                chartImage={chartImage}
                                fundingSource={fundingSource}
                                controls={lthcControls}
                                iWealthyMode={iWealthyMode}
                                manualRpp={manualRpp} 
                                manualRtu={manualRtu} 
                                manualInvestmentReturn={manualInvestmentReturn}
                                autoInvestmentReturn={autoInvestmentReturn}
                                manualIWealthyPPT={manualIWealthyPPT}
                                autoIWealthyPPT={autoIWealthyPPT}
                                manualWithdrawalStartAge={manualWithdrawalStartAge}
                                selectedHealthPlans={selectedHealthPlans}
                            />
                        }
                        fileName={`LTHC-Report-${new Date().toISOString().slice(0,10)}.pdf`}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700"
                    >
                        {({ loading }) => loading ? 'กำลังสร้างเอกสาร...' : 'ดาวน์โหลดรายงาน PDF'}
                    </PDFDownloadLink>
                )}
            </div>
            <div id="printable-lthc-report" className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
                
                <header className="flex justify-between items-center pb-6 border-b-2 border-green-800">
                    <div>
                        <h1 className="text-2xl font-bold text-green-900">รายงานสรุปผลประโยชน์ แผนสุขภาพระยะยาว</h1>
                        <p className="text-lg text-slate-600">Long-Term Health Care (LTHC)</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500 mt-2">จัดทำ ณ วันที่: {formatDate(new Date())}</p>
                    </div>
                </header>

                {/* --- ข้อมูลเบื้องต้นของแผน --- */}
                <section className="mt-6">
                    <h2 className="text-xl font-semibold text-green-800 border-l-4 border-green-800 pl-3 mb-3">ข้อมูลเบื้องต้นของแผน</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-md">
                        {/* Column 1: Health Plan */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-slate-700">สรุปแผนความคุ้มครองสุขภาพ</h3>
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between"><span>สัญญาหลัก LifeReady:</span> <span className="font-semibold">{formatNum(summaryData.firstYearLrPremium)} บาท/ปี</span></div>
                                {selectedHealthPlans.iHealthyUltraPlan && <div className="flex justify-between"><span>iHealthy Ultra ({selectedHealthPlans.iHealthyUltraPlan}):</span> <span className="font-semibold">{formatNum(summaryData.firstYearIhuPremium)} บาท/ปี</span></div>}
                                {selectedHealthPlans.mebPlan && <div className="flex justify-between"><span>MEB (ค่าชดเชย {selectedHealthPlans.mebPlan}):</span> <span className="font-semibold">{formatNum(summaryData.firstYearMebPremium)} บาท/ปี</span></div>}
                                <div className="flex justify-between border-t pt-2 mt-2 font-bold"><span>เบี้ยสุขภาพรวมปีแรก:</span> <span>{formatNum(summaryData.firstYearLrPremium + summaryData.firstYearIhuPremium + summaryData.firstYearMebPremium)} บาท</span></div>
                            </div>
                        </div>
                        {/* Column 2: Funding Plan */}
                        {fundingSource === 'iWealthy' && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-700">สรุปแผนจัดหาทุน (iWealthy)</h3>
                                <div className="text-sm space-y-2">
                                    <div className="flex justify-between"><span>ความคุ้มครองชีวิตเริ่มต้น:</span> <span className="font-semibold">{formatNum(summaryData.initialSA)} บาท</span></div>
                                    <div className="flex justify-between"><span>เบี้ยประกัน (RPP+RTU):</span> <span className="font-semibold">{formatNum(iWealthyMode === 'manual' ? manualRpp + manualRtu : result[0].iWealthyTotalPremium)} บาท/ปี</span></div>
                                    <div className="flex justify-between"><span>ระยะเวลาชำระเบี้ย:</span> <span className="font-semibold">{iWealthyMode === 'manual' ? manualIWealthyPPT : autoIWealthyPPT} ปี</span></div>
                                    <div className="flex justify-between"><span>ผลตอบแทนคาดหวัง:</span> <span className="font-semibold">{iWealthyMode === 'manual' ? manualInvestmentReturn : autoInvestmentReturn} %</span></div>
                                    <div className="flex justify-between"><span>เริ่มถอนเพื่อจ่ายเบี้ยสุขภาพอายุ:</span> <span className="font-semibold">{iWealthyMode === 'manual' ? manualWithdrawalStartAge : 'ตามแผน'} ปี</span></div>
                                    <div className="flex justify-between border-t pt-2 mt-2 font-bold"><span>รวมถอนจาก iWealthy ทั้งหมด:</span> <span>{formatNum(summaryData.totalWithdrawals)} บาท</span></div>
                                </div>
                            </div>
                        )}
                        {/* (สามารถเพิ่มเงื่อนไขสำหรับ Pension และ Hybrid ได้ที่นี่) */}
                    </div>
                </section>
                
                {/* --- การวิเคราะห์เชิงเปรียบเทียบ --- */}
                <section className="mt-6">
                    <h2 className="text-xl font-semibold text-green-800 border-l-4 border-green-800 pl-3 mb-3">การวิเคราะห์เชิงเปรียบเทียบ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KPICard 
                            title="เบี้ยสุขภาพที่ต้องจ่าย (หากจ่ายเองทั้งหมด)" 
                            value={formatNum(summaryData.totalHealthPremiumIfPaidAlone)}
                            unit="บาท"
                        />
                        <KPICard 
                            title="ค่าใช้จ่ายรวมตลอดสัญญา (ในแผน LTHC)" 
                            value={formatNum(summaryData.lthcTotalCombinedPremiumPaid)} 
                            unit="บาท"
                            description="เบี้ยสุขภาพที่จ่ายเอง + เบี้ยกองทุน"
                        />
                        <KPICard 
                            title="ความประหยัดที่เกิดขึ้น" 
                            value={formatNum(summaryData.totalSavings)} 
                            unit="บาท"
                            description="ส่วนต่างระหว่าง 2 แผน"
                        />
                    </div>
                </section>

                {/* --- กราฟ และ ตาราง --- */}
                <section className="mt-8 page-break-before">
                    <h2 className="text-xl font-semibold text-green-800 border-l-4 border-green-800 pl-3 mb-3">กราฟเปรียบเทียบผลประโยชน์</h2>
                    <div style={{ height: '400px', width: '100%' }}>
                         <LthcChartPage isReportMode={true} />
                    </div>
                    <ReportPageChartLegend fundingSource={fundingSource} controls={lthcControls} />
                </section>
                <section className="mt-8">
                     <h2 className="text-xl font-semibold text-green-800 border-l-4 border-green-800 pl-3 mb-3">ตารางเปรียบเทียบผลประโยชน์รายปี</h2>
                     <LthcTablePage isReportMode={true} />
                </section>

                <footer className="mt-10 pt-4 border-t border-slate-300 text-xs text-slate-500">
                    <p><b>ข้อจำกัดความรับผิดชอบ:</b> ...</p>
                </footer>
            </div>
        </div>
    );
};