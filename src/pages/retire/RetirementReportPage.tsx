import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { PDFDownloadLink } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';

import RetirementTablePage from './RetirementTablePage';
import RetirementChartPage from './RetirementChartPage';
import { RetirementReportDocument } from '@/components/ret/RetirementReportDocument';
import { calculateRetirementTaxBenefits } from '@/components/ret/hooks/useRetirementCalculations';

const formatDate = (date: Date) => date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

const KPICard = ({ title, value, unit = '', description }: { title: string; value: string | number | null; unit?: string, description?: string }) => {
    const displayValue = (value === null || value === undefined || Number.isNaN(value)) ? '-' : value;
    return (
        <div className="flex flex-col p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-medium text-slate-600">{title}</h3>
            <p className="mt-1 text-2xl font-semibold text-sky-800">
                {displayValue}
                {displayValue !== '-' && unit && <span className="text-base font-normal ml-1.5 text-slate-500">{unit}</span>}
            </p>
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </div>
    );
};

const ChartLegend = ({ showPremium, showPayout, showValue, showDb }: { showPremium: boolean, showPayout: boolean, showValue: boolean, showDb: boolean }) => (
    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-3 text-xs text-gray-600">
        {showPremium && (
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                <span>เบี้ยสะสม</span>
            </div>
        )}
        {showPayout && (
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                <span>เงินเกษียณสะสม</span>
            </div>
        )}
        {showValue && (
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span>มูลค่า กธ.</span>
            </div>
        )}
        {showDb && (
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <span>คุ้มครองชีวิต</span>
            </div>
        )}
    </div>
);


const RetirementReportPage = () => {
    const { 
        retirementResult, retirementIsLoading, retirementPlanningAge, retirementGender, retirementInvestmentReturn,
        retirementTaxInfo, retirementShowPremium, retirementShowPayoutCumulative, retirementShowFundValue, retirementShowDeathBenefit
    } = useAppStore();

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartImage, setChartImage] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    const dataWithTax = useMemo(() => {
        if (!retirementResult) return null;
        if (!retirementTaxInfo) return retirementResult;
        return calculateRetirementTaxBenefits(retirementResult, retirementTaxInfo);
    }, [retirementResult, retirementTaxInfo]);

    const reportData = useMemo(() => {
        if (!dataWithTax) return null;
        const totalPremiumsPaid = dataWithTax.reduce((sum, row) => sum + row.totalPremium, 0);
        const totalPayoutsReceived = dataWithTax.reduce((sum, row) => sum + row.totalWithdrawal, 0);
        const maxDeathBenefit = Math.max(...dataWithTax.map(row => row.iWealthyDeathBenefit + row.pensionDeathBenefit));
        
        let savingsAccountValue = 0;
        let totalSavingsPayout = 0;
        let savingsDepletionAge: number | null = null;
        for (const row of dataWithTax) {
            savingsAccountValue += row.totalPremium;
            savingsAccountValue *= 1.005;
            const withdrawalAmount = row.totalWithdrawal;
            const actualWithdrawal = Math.min(savingsAccountValue, withdrawalAmount);
            totalSavingsPayout += actualWithdrawal;
            savingsAccountValue -= actualWithdrawal;
            if (savingsAccountValue <= 0 && withdrawalAmount > 0 && savingsDepletionAge === null) {
                savingsDepletionAge = row.age;
            }
        }
        
        const difference = totalPayoutsReceived - totalSavingsPayout;

        return { totalPremiumsPaid, totalPayoutsReceived, maxDeathBenefit, savingsTotalPayout: totalSavingsPayout, savingsDepletionAge, difference };
    }, [dataWithTax]);

    useEffect(() => {
        if (chartContainerRef.current && isClient && dataWithTax) {
            setTimeout(() => {
                html2canvas(chartContainerRef.current!, { backgroundColor: null, scale: 2 })
                .then((canvas) => setChartImage(canvas.toDataURL('image/png')));
            }, 500);
        }
    }, [isClient, dataWithTax, retirementShowPremium, retirementShowPayoutCumulative, retirementShowFundValue, retirementShowDeathBenefit]);

    useEffect(() => { setIsClient(true); }, []);

    if (retirementIsLoading) return <div className="text-center p-10">กำลังจัดทำรายงาน...</div>;
    if (!dataWithTax || !reportData) return <div className="text-center p-10 text-gray-500">กรุณากดคำนวณเพื่อจัดทำรายงาน</div>;

    return (
        <div className="bg-gray-100 font-sans">
            <div ref={chartContainerRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '800px', height: '400px', zIndex: -1 }}>
                <RetirementChartPage isCaptureMode={true} />
            </div>

            <div className="p-4 text-right print:hidden">
                {isClient && chartImage && (
                    <PDFDownloadLink
                        document={
                            <RetirementReportDocument 
                                reportData={reportData}
                                result={dataWithTax}
                                planningAge={retirementPlanningAge}
                                gender={retirementGender}
                                investmentReturn={retirementInvestmentReturn}
                                chartImage={chartImage}
                                showPremium={retirementShowPremium}
                                showPayoutCumulative={retirementShowPayoutCumulative}
                                showFundValue={retirementShowFundValue}
                                showDeathBenefit={retirementShowDeathBenefit}
                                showTaxBenefit={retirementTaxInfo !== null}
                            />
                        }
                        fileName={`Retirement-Report-${new Date().toISOString().slice(0,10)}.pdf`}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    >
                        {({ loading }) => loading ? 'กำลังสร้างเอกสาร...' : 'ดาวน์โหลดรายงาน PDF'}
                    </PDFDownloadLink>
                )}
            </div>
            
            <div id="printable-report" className="max-w-4xl mx-auto bg-white p-8 shadow-lg print:shadow-none space-y-8">
                <header className="flex justify-between items-center pb-6 border-b-2 border-sky-800">
                    <div>
                        <h1 className="text-2xl font-bold text-sky-900">รายงานสรุปแผนเพื่อการเกษียณ</h1>
                        <p className="text-lg text-slate-600">Retirement Planner</p>
                    </div>
                    <div className="text-right">
                         <p className="text-sm text-slate-500 mt-2">จัดทำ ณ วันที่: {formatDate(new Date())}</p>
                    </div>
                </header>

                <section>
                    <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">สรุปผลประโยชน์หลัก</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KPICard title="เบี้ยประกันที่ชำระทั้งหมด" value={reportData.totalPremiumsPaid.toLocaleString('en-US', {maximumFractionDigits: 0})} unit="บาท" />
                        <KPICard title="เงินเกษียณที่ได้รับทั้งหมด" value={reportData.totalPayoutsReceived.toLocaleString('en-US', {maximumFractionDigits: 0})} unit="บาท" />
                        <KPICard title="ความคุ้มครองชีวิตสูงสุด" value={reportData.maxDeathBenefit.toLocaleString('en-US', {maximumFractionDigits: 0})} unit="บาท" />
                    </div>
                </section>

                <section>
                     <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">ผลการเปรียบเทียบ</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <KPICard 
                            title="ผลประโยชน์รวมจากแผนบำนาญ" 
                            value={reportData.totalPayoutsReceived.toLocaleString('en-US', {maximumFractionDigits: 0})} 
                            unit="บาท"
                            description={`ผลตอบแทนสุทธิ: ${(reportData.totalPayoutsReceived - reportData.totalPremiumsPaid).toLocaleString('en-US', {maximumFractionDigits: 0})} บาท`}
                         />
                         <KPICard 
                            title="ผลประโยชน์จากเงินฝาก (0.5%)" 
                            value={reportData.savingsTotalPayout.toLocaleString('en-US', {maximumFractionDigits: 0})} 
                            unit="บาท"
                            description={`เงินจะหมดเมื่ออายุประมาณ ${reportData.savingsDepletionAge ?? '99+'} ปี`}
                         />
                         <KPICard 
                            title="ส่วนต่างผลประโยชน์" 
                            value={reportData.difference.toLocaleString('en-US', {maximumFractionDigits: 0})} 
                            unit="บาท"
                            description="เทียบกับเงินฝากออมทรัพย์"
                         />
                     </div>
                </section>
                
                <section>
                    <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">กราฟแสดงแนวโน้มผลประโยชน์</h2>
                    <div className="h-[500px] border rounded-lg p-2">
                       <RetirementChartPage isEmbedded={true} />
                    </div>
                    <ChartLegend 
                        showPremium={retirementShowPremium}
                        showPayout={retirementShowPayoutCumulative}
                        showValue={retirementShowFundValue}
                        showDb={retirementShowDeathBenefit}
                    />
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">ตารางผลประโยชน์รายปี</h2>
                    <RetirementTablePage />
                </section>
                
                <footer className="mt-10 pt-4 border-t border-slate-300 text-xs text-slate-500">
                    <p><b>ข้อจำกัดความรับผิดชอบ:</b> เอกสารนี้เป็นเพียงภาพประกอบ... (ข้อความเดิม)</p>
                </footer>
            </div>
        </div>
    );
};

export default RetirementReportPage;