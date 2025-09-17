import React, { useMemo } from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { AnnualLTHCOutputRow } from '@/hooks/useLthcTypes';

// --- 1. ลงทะเบียนฟอนต์ (ใช้ของเดิมได้เลย) ---
Font.register({
    family: 'Sarabun',
    fonts: [
        { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 'normal' },
        { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
    ],
});

// --- ⭐ 2. Stylesheet (อัปเกรดใหม่ทั้งหมดสำหรับตารางที่ซับซ้อนขึ้น) ---
const styles = StyleSheet.create({
    // General Styles (เหมือนเดิม)
    page: { fontFamily: 'Sarabun', fontSize: 8, padding: '20px', color: '#334155' },
    bold: { fontWeight: 'bold' },
    header: { marginBottom: 10, paddingBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#15803d' },
    headerSubtitle: { fontSize: 11, color: '#475569' },
    footer: { position: 'absolute', bottom: 10, left: 30, right: 30, textAlign: 'center', fontSize: 7, color: '#94a3b8' },
    section: { marginBottom: 10 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#166534', borderBottomWidth: 1.5, borderBottomColor: '#86efac', paddingBottom: 3, marginBottom: 5 },
    
    planDetailsContainer: {
        flexDirection: 'row',
        gap: 15,
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    planDetailsColumn: {
        flex: 1, // ทำให้แต่ละคอลัมน์กว้างเท่ากัน
        gap: 6, // ระยะห่างระหว่างบรรทัดในคอลัมน์
    },
    planDetailsTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 3,
    },
    planDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    planDetailsLabel: {
        color: '#475569',
    },
    planDetailsValue: {
        fontWeight: 'bold',
    },
    planDetailsTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 5,
        marginTop: 3,
        fontWeight: 'bold',
    },

    bgHealthPlan: { backgroundColor: '#e0f2fe' }, // สีฟ้าอ่อน
    bgLthcPlan: { backgroundColor: '#f0fdf4' },   // สีเขียวอ่อน

    // Table Styles (แก้ไขใหม่)
    table: { width: '100%' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
    // --- Header Styles ---
    tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#94a3b8', backgroundColor: '#f1f5f9', fontWeight: 'bold' },
    tableColHeader: { padding: 4, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
    tableColHeaderMain: { padding: 4, textAlign: 'center', borderBottomWidth: 0.5, borderBottomColor: '#94a3b8' },
    // --- Body Styles ---
    tableCol: { padding: 4, textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#e2e8f0' },
    colCenter: { textAlign: 'center' },
    // --- Column Widths ---
    colAge: { width: '8%' },
    colHealthPremium: { width: '13%' },
    colHealthDB: { width: '13%' },
    colLthcHealthPremium: { width: '13%', backgroundColor: '#f0fdf4' },
    colLthcIwPremium: { width: '13%', backgroundColor: '#f0f8ff' },
    colLthcIwWithdrawal: { width: '13%', backgroundColor: '#f0f8ff' },
    colLthcIwAV: { width: '13%', backgroundColor: '#f0f8ff' },
    colLthcTotalDB: { width: '14%' },
    
    // ... (Styles อื่นๆ เหมือนเดิม) ...
    summaryText: { lineHeight: 1.6, textAlign: 'justify' },
    dataBox: { backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: 4, borderWidth: 1, borderColor: '#dcfce7' },
    dataGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dataGridItem: { width: '60%', padding: '4px 0' },
    kpiContainer: { flexDirection: 'row', gap: 10 },
    kpiCard: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', flexGrow: 1, flexBasis: '30%' },
    kpiTitle: { fontSize: 9, color: '#64748b', marginBottom: 2 },
    kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
    kpiUnit: { fontSize: 10 },
    kpiDescription: { fontSize: 8, color: '#64748b', marginTop: 2 },
    chartImage: { width: '100%', height: 'auto', marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },

    legendContainer: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginTop: 5,
        padding: 5,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        backgroundColor: '#f8fafc'
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColorBox: {
        width: 10,
        height: 10,
        marginRight: 5,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 8,
        color: '#475569'
    },
});

// --- Helper Functions ---
const formatDate = (date: Date) => date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
const formatNum = (val: number | null | undefined) => val ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-';

// --- Props Interface สำหรับ LTHC ---

interface ControlsState {
    showCumulativeHealthPremium: boolean;
    showLthcCombinedPremium: boolean;
    showLthcDeathBenefit: boolean;
    showIWealthyAV: boolean;
    showIWealthyWithdrawal: boolean;
    showPensionAnnuity: boolean;
}

interface LthcReportDocumentProps {
    result: AnnualLTHCOutputRow[] | null;
    metrics: any;
    chartImage: string | null;
    fundingSource: string;
    controls: ControlsState;
    iWealthyMode: string;
    manualRpp: number;
    manualRtu: number;
    manualInvestmentReturn: number;
    autoInvestmentReturn: number;
    manualIWealthyPPT: number;
    autoIWealthyPPT: number;
    manualWithdrawalStartAge: number; // เพิ่ม
    selectedHealthPlans: any;
    
}

// --- Reusable Components ---
const PageHeader = () => (
    <View style={styles.header}>
        <Text style={styles.headerTitle}>รายงานสรุปผลประโยชน์ แผนสุขภาพระยะยาว (LTHC)</Text>
        <Text style={styles.headerSubtitle}>จัดทำเพื่อประกอบการตัดสินใจวางแผนทางการเงิน </Text>
    </View>
);

const KPICard = ({ title, value, unit = '', description = '' }: { title: string, value: string | number, unit?: string, description?: string }) => (
    <View style={styles.kpiCard}>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiValue}>
            {value}
            <Text style={styles.kpiUnit}>{` ${unit}`}</Text>
        </Text>
        {description && <Text style={styles.kpiDescription}>{description}</Text>}
    </View>
);

const PageFooter = ({ pageNumber, totalPages }: { pageNumber: number, totalPages: number }) => (
    <Text style={styles.footer} fixed>
        เอกสารฉบับนี้เพื่อประกอบการเสนอขายเท่านั้น | จัดทำ ณ วันที่ {formatDate(new Date())} | หน้า {pageNumber} / {totalPages}
    </Text>
);

// --- ⭐ 3. ReportTable Component (ยกเครื่องใหม่ทั้งหมด) ---
const ReportTable = ({ data, fundingSource }: { data: AnnualLTHCOutputRow[], fundingSource: string }) => {
    const showIWealthyCols = fundingSource === 'iWealthy' || fundingSource === 'hybrid';

    return (
        <View style={styles.table}>
            {/* --- Table Header --- */}
            <View fixed>
                <View style={styles.tableHeaderRow}>
                    <View style={[styles.tableColHeaderMain, { width: '16%' }]}><Text>ข้อมูลรายปี</Text></View>
                    <View style={[styles.tableColHeaderMain, styles.bgHealthPlan, { width: '26%', backgroundColor: '#f0f9ff' }]}><Text>แผนสุขภาพ (จ่ายเอง)</Text></View>
                    {showIWealthyCols && (
                        <View style={[styles.tableColHeaderMain, styles.bgLthcPlan, { width: '58%', backgroundColor: '#f0fdf4' }]}><Text>แผน LTHC (ใช้ iWealthy)</Text></View>
                    )}
                </View>
                <View style={styles.tableHeaderRow}>
                    <View style={[styles.tableColHeader, styles.colAge]}><Text>ปีที่</Text></View>
                    <View style={[styles.tableColHeader, styles.colAge]}><Text>อายุ</Text></View>
                    <View style={[styles.tableColHeader, styles.colHealthPremium, styles.bgHealthPlan, { backgroundColor: '#f0f9ff' }]}><Text>เบี้ย</Text></View>
                    <View style={[styles.tableColHeader, styles.colHealthDB, styles.bgHealthPlan, { backgroundColor: '#f0f9ff' }]}><Text>คุ้มครองชีวิต</Text></View>
                    
                    {showIWealthyCols && (
                        <>
                            <View style={[styles.tableColHeader, styles.colLthcHealthPremium, styles.bgLthcPlan]}><Text>เบี้ยสุขภาพ</Text></View>
                            <View style={[styles.tableColHeader, styles.colLthcIwPremium, styles.bgLthcPlan]}><Text>เบี้ย iW</Text></View>
                            <View style={[styles.tableColHeader, styles.colLthcIwWithdrawal, styles.bgLthcPlan]}><Text>เงินถอน iW</Text></View>
                            <View style={[styles.tableColHeader, styles.colLthcIwAV, styles.bgLthcPlan]}><Text>มูลค่า iW</Text></View>
                            <View style={[styles.tableColHeader, styles.colLthcTotalDB, styles.bgLthcPlan]}><Text>คุ้มครองชีวิตรวม</Text></View>
                        </>
                    )}
                </View>
            </View>

            {/* --- Table Body --- */}
            {data.map((row) => {
                const healthPremiumPaidByUser = row.age < 60 ? row.totalHealthPremium : 0;
                
                return (
                    <View style={styles.tableRow} key={row.policyYear} wrap={false}>
                        <View style={[styles.tableCol, styles.colAge, styles.colCenter]}><Text>{row.policyYear}</Text></View>
                        <View style={[styles.tableCol, styles.colAge, styles.colCenter, styles.bold]}><Text>{row.age}</Text></View>
                        <View style={[styles.tableCol, styles.colHealthPremium, styles.bgHealthPlan]}><Text>{formatNum(row.totalHealthPremium)}</Text></View>
                        <View style={[styles.tableCol, styles.colHealthDB, styles.bgHealthPlan]}><Text>{formatNum(row.lifeReadyDeathBenefit)}</Text></View>

                        {showIWealthyCols && (
                            <>
                                <View style={[styles.tableCol, styles.colLthcHealthPremium, styles.bgLthcPlan]}><Text>{formatNum(healthPremiumPaidByUser)}</Text></View>
                                <View style={[styles.tableCol, styles.colLthcIwPremium, styles.bgLthcPlan]}><Text>{formatNum(row.iWealthyTotalPremium)}</Text></View>
                                <View style={[styles.tableCol, styles.colLthcIwWithdrawal, styles.bgLthcPlan]}><Text>{formatNum(row.iWealthyWithdrawal)}</Text></View>
                                <View style={[styles.tableCol, styles.colLthcIwAV, styles.bgLthcPlan]}><Text>{formatNum(row.iWealthyEoyAccountValue)}</Text></View>
                                <View style={[styles.tableCol, styles.colLthcTotalDB, styles.bold, styles.bgLthcPlan]}><Text>{formatNum(row.totalCombinedDeathBenefit)}</Text></View>
                            </>
                        )}
                    </View>
                )
            })}
        </View>
    );
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

const LegendItem = ({ color, text }: { color: string, text: string }) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendColorBox, { backgroundColor: color }]} />
        <Text style={styles.legendText}>{text}</Text>
    </View>
);

const ChartLegend = ({ fundingSource, controls }: { fundingSource: string, controls: any }) => {
    const showIWealthy = fundingSource === 'iWealthy' || fundingSource === 'hybrid';
    const showPension = fundingSource === 'pension' || fundingSource === 'hybrid';

    if (!controls) return null;

    return (
        <View style={styles.legendContainer}>
            {controls.showPremiums && controls.showHealthPremiumAlone && <LegendItem color={lineColors.healthPremiumAlone} text="เบี้ยสุขภาพ (จ่ายเอง)" />}
            {controls.showPremiums && controls.showLthcCombinedPremium && <LegendItem color={lineColors.lthcCombinedPremium} text="เบี้ย LTHC (รวม)" />}
            {controls.showPremiums && controls.showLthcHealthPaidByUser && <LegendItem color={lineColors.lthcHealthPaidByUser} text="เบี้ยสุขภาพ (ในแผน LTHC)" />}
            
            {controls.showPremiums && showIWealthy && controls.showIWealthyPremium && <LegendItem color={lineColors.iWealthyPremium} text="เบี้ย iWealthy" />}
            {controls.showPremiums && showPension && controls.showPensionPremium && <LegendItem color={lineColors.pensionPremium} text="เบี้ยบำนาญ" />}
            
            {controls.showDeathBenefits && controls.showHealthDeathBenefit && <LegendItem color={lineColors.healthDeathBenefit} text="คช. แผนสุขภาพ" />}
            {controls.showDeathBenefits && controls.showLthcDeathBenefit && <LegendItem color={lineColors.lthcDeathBenefit} text="คช. LTHC" />}
            
            {controls.showAccountValue && showIWealthy && controls.showIWealthyAV && <LegendItem color={lineColors.iWealthyAV} text="มูลค่า iWealthy" />}
            {controls.showAccountValue && showPension && controls.showPensionCSV && <LegendItem color={lineColors.pensionCSV} text="มูลค่าเวนคืนบำนาญ" />}

            {controls.showAccountValue && showIWealthy && controls.showIWealthyWithdrawal && <LegendItem color={lineColors.iWealthyWithdrawal} text="เงินถอน iWealthy" />}
            {controls.showAccountValue && showPension && controls.showPensionAnnuity && <LegendItem color={lineColors.pensionAnnuity} text="เงินบำนาญ" />}
            {controls.showAccountValue && fundingSource === 'hybrid' && controls.showHybridWithdrawal && <LegendItem color={lineColors.hybridTotalWithdrawal} text="เงินถอนรวม (Hybrid)" />}
        </View>
    );
};

// --- Main Document Component for LTHC ---
export const LthcReportDocument: React.FC<LthcReportDocumentProps> = (props) => {
    const { 
        result, metrics, chartImage, fundingSource, iWealthyMode, manualRpp, manualRtu,
        manualInvestmentReturn, autoInvestmentReturn, manualIWealthyPPT, autoIWealthyPPT, manualWithdrawalStartAge,
        selectedHealthPlans, controls
    } = props;

    if (!result || !metrics) {
        return <Document><Page><Text>ไม่มีข้อมูล</Text></Page></Document>;
    }

    // --- ✅ 3. สร้าง Logic การสร้างข้อความไว้ในนี้เลย ---

    const firstYearPremiums = useMemo(() => {
        if (!result) return null;
        // ดึงเบี้ยปีแรกจาก row แรกของผลลัพธ์
        const firstRow = result[0];
        return {
            lr: firstRow.lifeReadyPremium,
            ihu: firstRow.iHealthyUltraPremium,
            meb: firstRow.mebPremium,
            total: firstRow.totalHealthPremium,
        };
    }, [result]);

    const iWealthySummary = useMemo(() => {
        if (!result || fundingSource !== 'iWealthy') return null;
        const initialSA = result[0].iWealthyEoyDeathBenefit ?? 0;
        const totalPremium = iWealthyMode === 'manual' ? (manualRpp + manualRtu) : result[0].iWealthyTotalPremium;
        const ppt = iWealthyMode === 'manual' ? manualIWealthyPPT : autoIWealthyPPT;
        const returnRate = iWealthyMode === 'manual' ? manualInvestmentReturn : autoInvestmentReturn;
        const withdrawalStartAge = iWealthyMode === 'manual' ? manualWithdrawalStartAge : 'ตามแผน';
        const totalWithdrawals = result.reduce((sum: number, row: AnnualLTHCOutputRow) => sum + (row.iWealthyWithdrawal || 0), 0);

        return { initialSA, totalPremium, ppt, returnRate, withdrawalStartAge, totalWithdrawals };
    }, [result, fundingSource, iWealthyMode,	
        manualRpp, manualRtu, manualIWealthyPPT,	
        autoIWealthyPPT, manualInvestmentReturn,	
        autoInvestmentReturn, manualWithdrawalStartAge]);


    return (
        <Document author="Your Name" title={`LTHC Report - ${formatDate(new Date())}`}>
            {/* Page 1: Summary & KPIs */}
            <Page size="A4" style={styles.page}>
                <PageHeader />
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>บทสรุปสำหรับผู้เอาประกัน </Text>
                    <Text style={styles.summaryText}>
                        แผนLTHCนี้ออกแบบมาเพื่อบริหารจัดการค่าใช้จ่ายสุขภาพระยะยาวอย่างมีประสิทธิภาพ โดยเปรียบเทียบค่าใช้จ่ายรวมตลอดสัญญาระหว่างการจ่ายเบี้ยสุขภาพ ด้วยตนเองทั้งหมดกับการใช้แผน LTHC ซึ่งผลการวิเคราะห์แสดงให้เห็นว่าแผน LTHC สามารถช่วยให้
                        <Text style={styles.bold}> ประหยัดค่าใช้จ่ายได้ถึง {formatNum(metrics.totalSavings)} บาท</Text>
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ข้อมูลเบื้องต้นของแผน</Text>
                    <View style={styles.planDetailsContainer}>
                        {/* --- Column 1: Health Plan --- */}
                        <View style={styles.planDetailsColumn}>
                            <Text style={styles.planDetailsTitle}>สรุปแผนความคุ้มครองสุขภาพ</Text>
                            <View style={styles.planDetailsRow}>
                                <Text style={styles.planDetailsLabel}>สัญญาหลัก LifeReady:</Text>
                                <Text style={styles.planDetailsValue}>{formatNum(firstYearPremiums?.lr)} บาท/ปี</Text>
                            </View>
                            {selectedHealthPlans.iHealthyUltraPlan && (
                                <View style={styles.planDetailsRow}>
                                    <Text style={styles.planDetailsLabel}>iHealthy Ultra ({selectedHealthPlans.iHealthyUltraPlan}):</Text>
                                    <Text style={styles.planDetailsValue}>{formatNum(firstYearPremiums?.ihu)} บาท/ปี</Text>
                                </View>
                            )}
                            {selectedHealthPlans.mebPlan && (
                                <View style={styles.planDetailsRow}>
                                    <Text style={styles.planDetailsLabel}>MEB (ค่าชดเชย {selectedHealthPlans.mebPlan}):</Text>
                                    <Text style={styles.planDetailsValue}>{formatNum(firstYearPremiums?.meb)} บาท/ปี</Text>
                                </View>
                            )}
                            <View style={styles.planDetailsTotalRow}>
                                <Text>เบี้ยสุขภาพรวมปีแรก:</Text>
                                <Text>{formatNum(firstYearPremiums?.total)} บาท</Text>
                            </View>
                        </View>

                        {/* --- Column 2: Funding Plan --- */}
                        {fundingSource === 'iWealthy' && iWealthySummary && (
                            <View style={styles.planDetailsColumn}>
                                <Text style={styles.planDetailsTitle}>สรุปแผนจัดหาทุน (iWealthy)</Text>
                                <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>คุ้มครองชีวิตเริ่มต้น:</Text><Text style={styles.planDetailsValue}>{formatNum(iWealthySummary.initialSA)} บาท</Text></View>
                                <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>เบี้ยประกัน (RPP+RTU):</Text><Text style={styles.planDetailsValue}>{formatNum(iWealthySummary.totalPremium)} บาท/ปี</Text></View>
                                <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>ระยะเวลาชำระเบี้ย:</Text><Text style={styles.planDetailsValue}>{iWealthySummary.ppt} ปี</Text></View>
                                <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>ผลตอบแทนคาดหวัง:</Text><Text style={styles.planDetailsValue}>{iWealthySummary.returnRate} %</Text></View>
                                <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>เริ่มถอนเพื่อจ่ายเบี้ยอายุ:</Text><Text style={styles.planDetailsValue}>{iWealthySummary.withdrawalStartAge}</Text></View>
                                <View style={styles.planDetailsTotalRow}><Text>รวมถอนจาก iWealthy:</Text><Text>{formatNum(iWealthySummary.totalWithdrawals)} บาท</Text></View>
                            </View>
                        )}
                        {/* (สามารถเพิ่มเงื่อนไขสำหรับ Pension และ Hybrid ได้ที่นี่) */}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>การวิเคราะห์เชิงเปรียบเทียบ</Text>
                    <View style={styles.kpiContainer}>
                        <KPICard title="เบี้ยสุขภาพ (หากจ่ายเองทั้งหมด)" value={formatNum(metrics.totalHealthPremiumIfPaidAlone)} unit="บาท" />
                        <KPICard title="ค่าใช้จ่ายรวม (ในแผน LTHC)" value={formatNum(metrics.lthcTotalCombinedPremiumPaid)} unit="บาท" />
                        <KPICard title="ความประหยัดที่เกิดขึ้น" value={formatNum(metrics.totalSavings)} unit="บาท" />
                    </View>
                </View>

                 {chartImage && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>กราฟเปรียบเทียบผลประโยชน์</Text>
                        <Image src={chartImage} style={styles.chartImage} />
                        <ChartLegend fundingSource={fundingSource} controls={controls} />
                    </View>
                )}

                <PageFooter pageNumber={1} totalPages={2} />
            </Page>

            {/* Page 2: Table */}
            <Page size="A4" style={styles.page}>
                <PageHeader />
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ตารางเปรียบเทียบค่าใช้จ่ายรายปี</Text>
                    <ReportTable data={result} fundingSource={fundingSource} />
                </View>
                <PageFooter pageNumber={2} totalPages={2} />
            </Page>
        </Document>
    );
};