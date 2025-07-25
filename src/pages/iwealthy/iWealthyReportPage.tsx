import IWealthyTablePage from './iWealthyTablePage';
import IWealthyChartPage from './iWealthyChartPage';
import { useAppStore } from '@/stores/appStore';
//import { Button } from '@/components/ui/button'; // สำหรับปุ่ม Print
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';

// --- [ส่วนใหม่] ---
// Helper สำหรับจัดรูปแบบวันที่เป็นภาษาไทย
const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Component การ์ด KPI (เหมือนเดิม แต่เราอาจจะย้ายไปไฟล์แยกในอนาคต)
const KPICard = ({ title, value, unit = '', description }: { title: string; value: string | number | null; unit?: string, description?: string }) => {
    const displayValue = value === null || value === undefined ? '-' : value;
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


// --- Component หลักของหน้ารายงาน ---
export const IWealthyReportPage = () => {
    // --- [ส่วนที่แก้ไข] ---
    // ดึงข้อมูลจาก Store ทีละส่วนเพื่อป้องกัน Infinite Loop
    const metrics = useAppStore(state => state.iWealthyMetrics);
    const result = useAppStore(state => state.iWealthyResult);
    const isLoading = useAppStore(state => state.iWealthyIsLoading);
    const iWealthyAge = useAppStore(state => state.iWealthyAge);
    const iWealthyGender = useAppStore(state => state.iWealthyGender);
    const iWealthyRpp = useAppStore(state => state.iWealthyRpp);
    const iWealthyRtu = useAppStore(state => state.iWealthyRtu);
    const initialDB = useAppStore(state => state.initialDB);
    const maxDB = useAppStore(state => state.maxDB);
    const iWealthyInvestmentReturn = useAppStore(state => state.iWealthyInvestmentReturn);
    const investmentOnlyMIRR = useAppStore(state => state.investmentOnlyMIRR);
    const investmentOnlyROI = useAppStore(state => state.investmentOnlyROI);
    const investmentOnlyPI = useAppStore(state => state.investmentOnlyPI);
    
    if (isLoading) return <div className="text-center p-10">กำลังจัดทำรายงานและบทวิเคราะห์...</div>;
    if (!result || !metrics) return <div className="text-center p-10 text-gray-500">กรุณากดคำนวณเพื่อจัดทำรายงาน</div>;


    // --- ส่วนของ UI และ Layout ---
    return (
        <div className="bg-gray-100 font-sans">
            {/* ปุ่มสำหรับสั่งพิมพ์ จะถูกซ่อนเวลาพิมพ์ */}
            <div className="p-4 text-right print:hidden">
                <PDFDownloadLink
                    document={<ReportDocument metrics={metrics} result={result} />}
                    fileName={`iWealthy-Report-${new Date().toISOString().slice(0,10)}.pdf`}
                >
                    {({ loading }) => 
                        loading ? 'กำลังสร้างเอกสาร...' : 'ดาวน์โหลดรายงาน PDF'
                    }
                </PDFDownloadLink>
            </div>

            {/* == เริ่มส่วนของรายงานที่จะพิมพ์ == */}
            <div id="printable-report" className="max-w-4xl mx-auto bg-white p-8 shadow-lg print:shadow-none">
                
                {/* --- 1. ส่วนหัวของรายงาน --- */}
                <header className="flex justify-between items-center pb-6 border-b-2 border-sky-800">
                    <div>
                        <h1 className="text-2xl font-bold text-sky-900">รายงานสรุปผลประโยชน์และการวิเคราะห์ทางการเงิน</h1>
                        <p className="text-lg text-slate-600">ผลิตภัณฑ์ iWealthy - บมจ. กรุงไทย-แอกซ่า ประกันชีวิต</p>
                    </div>
                    <div className="text-right">
                         {/* <img src="/logo-axa.png" alt="Krungthai-AXA Logo" className="h-12"/> */}
                        <p className="text-sm text-slate-500 mt-2">จัดทำ ณ วันที่: {formatDate(new Date())}</p>
                    </div>
                </header>

                {/* --- 2. บทสรุปสำหรับผู้บริหาร --- */}
                <section className="mt-6">
                    <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">บทสรุปสำหรับนักลงทุน</h2>
                    <p className="text-slate-700 leading-relaxed">
                        แผนประกันควบการลงทุน iWealthy นี้ได้รับการวิเคราะห์และคาดการณ์ว่าจะสามารถสร้าง 
                        <b>อัตราผลตอบแทนทบต้นที่แท้จริง (MIRR) ที่ <span className="font-bold text-lg text-green-700">{investmentOnlyMIRR !== null ? (investmentOnlyMIRR * 100).toFixed(2) : 'N/A'}%</span> ต่อปี</b>. 
                        เมื่อเปรียบเทียบกับแผนการลงทุนแบบ BTID (Buy Term and Invest the Difference) โดยคาดว่า <b>จุดคุ้มทุน (Breakeven Point) คือปีที่ {metrics.breakEvenYear ?? '-'}</b> (เมื่ออายุ {metrics.breakEvenAge ?? '-'} ปี) 
                        และมีมูลค่าบัญชีกรมธรรม์ ณ สิ้นสุดโครงการที่ประมาณ <b>{metrics.finalFundValue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'} บาท</b>. 
                        แผนการลงทุนนี้จึงนำเสนอโอกาสในการสร้างความมั่งคั่งระยะยาวพร้อมความคุ้มครองชีวิตที่มั่นคง
                    </p>
                </section>

                {/* --- 3. ข้อมูลเบื้องต้นสำหรับแผน iWealthy (Layout ใหม่) --- */}
                <section className="mt-6">
                    <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">ข้อมูลเบื้องต้นสำหรับแผน iWealthy</h2>
                    <div className="flex flex-col gap-2 text-sm p-4 bg-slate-50 rounded-md">
                        
                        {/* --- แถวที่ 1 --- */}
                        <div className="grid grid-cols-3 gap-4">
                            <div><strong className="text-slate-600">อายุผู้เอาประกัน:</strong> {iWealthyAge} ปี</div>
                            <div><strong className="text-slate-600">เพศ:</strong> {iWealthyGender === 'male' ? 'ชาย' : 'หญิง'}</div>
                            <div><strong className="text-slate-600">ผลตอบแทนคาดหวัง:</strong> {iWealthyInvestmentReturn}% ต่อปี</div>
                        </div>

                        {/* --- แถวที่ 2 --- */}
                        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                            <div>
                                <strong className="text-slate-600">เบี้ยประกันรวม (ต่อปี):</strong> 
                                {(iWealthyRpp + iWealthyRtu).toLocaleString()} บาท
                            </div>
                            <div>
                                <strong className="text-slate-600">ความคุ้มครองเริ่มต้น:</strong> 
                                {initialDB?.toLocaleString() ?? '0'} บาท
                            </div>
                            <div>
                                <strong className="text-slate-600">ความคุ้มครองสูงสุด:</strong> 
                                {maxDB?.amount.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? '0'} บาท
                                <div className="text-slate-500 text-xs">(ณ อายุ {maxDB?.age} ปี)</div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* --- 4. ตัวชี้วัดทางการเงิน (Layout ใหม่ 3 แถว) --- */}
                <section className="mt-6">
                    <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">ตัวชี้วัดทางการเงิน</h2>
                    <div className="flex flex-col gap-4">

                        {/* --- แถวที่ 1 --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KPICard 
                                title="MIRR (วิเคราะห์แบบ BTID)" 
                                value={investmentOnlyMIRR !== null ? (investmentOnlyMIRR * 100).toFixed(2) : 'N/A'} 
                                unit="%" 
                                description="ผลตอบแทนส่วนลงทุนเทียบ Term"
                            />
                            <KPICard 
                                title="จุดคุ้มทุน (มูลค่าเวนคืน ≥ เบี้ยสะสม)" 
                                value={metrics.breakEvenYear ?? 'ไม่พบ'} 
                                unit={metrics.breakEvenYear ? `ปีที่ (อายุ ${metrics.breakEvenAge} ปี)` : ''}
                            />
                        </div>

                        {/* --- แถวที่ 2 --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KPICard 
                                title="เบี้ยประกันที่ชำระทั้งหมด" 
                                value={metrics.totalPremiumsPaid?.toLocaleString() ?? '0'} 
                                unit="บาท"
                            />
                            <KPICard 
                                title="มูลค่าบัญชี ณ สิ้นสุด" 
                                value={metrics.finalFundValue?.toLocaleString() ?? '0'} 
                                unit="บาท"
                            />
                        </div>

                        {/* --- แถวที่ 3 --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KPICard 
                                title="ROI (วิเคราะห์แบบ BTID)" 
                                value={investmentOnlyROI !== null ? investmentOnlyROI.toFixed(2) : 'N/A'}
                                unit="%"
                                description="กำไรส่วนลงทุนเทียบ Term"
                            />
                            <KPICard 
                                title="PI (วิเคราะห์แบบ BTID)" 
                                value={investmentOnlyPI !== null ? investmentOnlyPI.toFixed(2) : 'N/A'}
                                unit="เท่า"
                                description="PV เงินเข้า / PV เงินออก"
                            />
                        </div>

                    </div>
                </section>

                {/* --- 5. การวิเคราะห์เชิงภาพ (กราฟ) --- */}
                <section className="mt-8 page-break-before">
                    <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">การวิเคราะห์แนวโน้มผลประโยชน์</h2>
                    <IWealthyChartPage />
                </section>

                {/* --- 6. ตารางผลประโยชน์รายปี --- */}
                <section className="mt-8">
                     <h2 className="text-xl font-semibold text-sky-800 border-l-4 border-sky-800 pl-3 mb-3">ตารางผลประโยชน์รายปี</h2>
                    <IWealthyTablePage />
                </section>
                
                {/* --- 7. หมายเหตุและข้อจำกัดความรับผิดชอบ --- */}
                <footer className="mt-10 pt-4 border-t border-slate-300 text-xs text-slate-500">
                    <p><b>ข้อจำกัดความรับผิดชอบ:</b> เอกสารนี้เป็นเพียงภาพประกอบที่จัดทำขึ้นตามข้อสมมติฐานที่ระบุไว้ข้างต้นเท่านั้น ไม่ใช่ส่วนหนึ่งของสัญญาประกันภัย อัตราผลตอบแทนจากการลงทุนที่แสดงเป็นเพียงการคาดการณ์และอาจมีการเปลี่ยนแปลงได้ตามสภาวะตลาดจริง ผู้ลงทุนควรทำความเข้าใจลักษณะสินค้า เงื่อนไขผลตอบแทน และความเสี่ยงก่อนตัดสินใจลงทุน</p>
                </footer>

            </div>
            {/* == จบส่วนของรายงานที่จะพิมพ์ == */}
        </div>
    );
};