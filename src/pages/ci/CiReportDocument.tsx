// src/pages/ci/CiReportDocument.tsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { AnnualCiOutputRow, CiPlanSelections } from '@/components/ci/types/useCiTypes';
import { formatNumber } from '@/components/ci/utils/helpers'; // ต้องสร้างหรือหา Path ที่ถูกต้อง

// --- ตั้งค่า Font (เหมือนเดิม) ---
Font.register({
    family: 'Sarabun',
    fonts: [
        { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 'normal' },
        { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
    ],
});

// --- Stylesheet ---
const styles = StyleSheet.create({
    page: { fontFamily: 'Sarabun', fontSize: 9, padding: '25px', color: '#334155' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
    headerSubtitle: { fontSize: 11, color: '#475569' },
    section: { marginBottom: 12 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e40af', borderBottomWidth: 1.5, borderBottomColor: '#93c5fd', paddingBottom: 3, marginBottom: 8 },
    planDetailsContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 4, borderWidth: 1, borderColor: '#f1f5f9' },
    planDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    planDetailsLabel: { color: '#475569' },
    planDetailsValue: { fontWeight: 'bold' },
    chartImage: { width: '100%', height: 'auto', marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
    legendContainer: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 5, padding: 5, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, backgroundColor: '#f8fafc' },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendColorBox: { width: 10, height: 10, marginRight: 5, borderRadius: 2 },
    legendText: { fontSize: 8, color: '#475569' },
    table: { width: '100%' },
    tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#94a3b8', backgroundColor: '#eff6ff', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
    tableColHeader: { padding: 4, textAlign: 'center' },
    tableCol: { padding: 4, textAlign: 'right' },
    colCenter: { textAlign: 'center' },
    footer: { position: 'absolute', bottom: 15, left: 25, right: 25, textAlign: 'center', fontSize: 7, color: '#94a3b8' },
});

// --- Reusable Components ---
const PageHeader = () => (
    <View style={styles.section}>
        <Text style={styles.headerTitle}>รายงานสรุปผลประโยชน์ แผนประกันโรคร้ายแรง</Text>
        <Text style={styles.headerSubtitle}>Long-Term Critical Illness (LTCI)</Text>
    </View>
);
const PageFooter = ({ page, totalPages }: { page: number, totalPages: number }) => (
    <Text style={styles.footer} fixed>
        เอกสารฉบับนี้จัดทำเพื่อประกอบการเสนอขายเท่านั้น | หน้า {page} / {totalPages}
    </Text>
);

const lineColors = {
    ciPremium: "#4299E1",
    iWealthyPremium: "#9F7AEA",
    withdrawal: "#F6E05E",
    iWealthyAV: "#48BB78",
    totalDB: "#ED8936",
};

const ChartLegend = ({ controls, useIWealthy }: { controls: any, useIWealthy: boolean }) => {
    const allLegends = [
        controls.showCiPremium && { color: lineColors.ciPremium, text: "เบี้ย CI (สะสม)" },
        useIWealthy && controls.showIWealthyPremium && { color: lineColors.iWealthyPremium, text: "เบี้ย iWealthy (สะสม)" },
        useIWealthy && controls.showWithdrawal && { color: lineColors.withdrawal, text: "เงินถอน (สะสม)" },
        useIWealthy && controls.showIWealthyAV && { color: lineColors.iWealthyAV, text: "มูลค่าบัญชี iW" },
        controls.showTotalDB && { color: lineColors.totalDB, text: "คุ้มครองชีวิตรวม" },
    ].filter(Boolean);

    if (allLegends.length === 0) return null;

    return (
        <View style={styles.legendContainer}>
            {allLegends.map((legend: any) => (
                <View style={styles.legendItem} key={legend.text}>
                    <View style={[styles.legendColorBox, { backgroundColor: legend.color }]} />
                    <Text style={styles.legendText}>{legend.text}</Text>
                </View>
            ))}
        </View>
    );
};

// --- Main Document Component ---
interface CiReportDocumentProps {
    chartImage: string | null;
    ciResult: AnnualCiOutputRow[] | null;
    ciPlanSelections: CiPlanSelections;
    ciControls: any;
    useIWealthy: boolean;
    summaryMetrics: {
        totalCiPremiumPaidAlone: number;
        totalCostInLtciPlan: number;
        savings: number;
        initialDbWithIwealthy: number;
        initialDbWithoutIwealthy: number;
        firstYearCiPremium: number;
        firstYearIWealthyPremium: number;
        initialIWealthyDb: number;
    } | null; // สามารถเป็น null ได้ถ้าไม่ได้ใช้ iWealthy
}

const KPICard = ({ title, value, unit = '', description = '' }: { title: string, value: string | number, unit?: string, description?: string }) => (
    <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', flexGrow: 1, flexBasis: '30%' }}>
        <Text style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>{title}</Text>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' }}>
            {value}
            <Text style={{ fontSize: 10 }}>{` ${unit}`}</Text>
        </Text>
        {description && <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{description}</Text>}
    </View>
);

export const CiReportDocument: React.FC<CiReportDocumentProps> = (props) => {
    const { chartImage, ciResult, ciPlanSelections, ciControls, useIWealthy, summaryMetrics } = props;
    if (!ciResult || !summaryMetrics) return <Document><Page><Text>ไม่มีข้อมูล</Text></Page></Document>;
    
    // ตัดข้อมูลเมื่อ AV <= 0 เหมือนในตาราง
    const firstZeroValueIndex = ciResult.findIndex(row => (row.iWealthyEoyAccountValue ?? 0) <= 0);
    const displayResult = firstZeroValueIndex === -1 ? ciResult : ciResult.slice(0, firstZeroValueIndex);

    return (
        <Document author="Your App" title="CI Planner Report">
            <Page size="A4" style={styles.page}>
                <PageHeader />
                
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ข้อมูลเบื้องต้นของแผน</Text>
                    <View style={styles.planDetailsContainer}>
                        {/* CI Plans */}
                        {ciPlanSelections.icareChecked && <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>iCare ทุนประกัน:</Text><Text style={styles.planDetailsValue}>{formatNumber(ciPlanSelections.icareSA)} บาท</Text></View>}
                        {ciPlanSelections.ishieldChecked && <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>iShield (แผน {ciPlanSelections.ishieldPlan}) ทุนประกัน:</Text><Text style={styles.planDetailsValue}>{formatNumber(ciPlanSelections.ishieldSA)} บาท</Text></View>}
                        {ciPlanSelections.mainRiderChecked && <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>LifeReady ({ciPlanSelections.lifeReadyPlan} ปี) ทุนประกัน:</Text><Text style={styles.planDetailsValue}>{formatNumber(ciPlanSelections.lifeReadySA)} บาท</Text></View>}
                        {ciPlanSelections.rokraiChecked && <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>RokeRaiSoShield:</Text><Text style={styles.planDetailsValue}>แผน {ciPlanSelections.rokraiPlan}</Text></View>}
                        {ciPlanSelections.dciChecked && <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>DCI ทุนประกัน:</Text><Text style={styles.planDetailsValue}>{formatNumber(ciPlanSelections.dciSA)} บาท</Text></View>}
                        
                        

                        {/* First Year Premiums & iWealthy DB */}
                        {summaryMetrics && (
                            <>
                                
                                {summaryMetrics.firstYearCiPremium > 0 && <View style={styles.planDetailsRow}><Text style={{...styles.planDetailsLabel, color: '#1d4ed8'}}>เบี้ย CI รวมปีแรก:</Text><Text style={{...styles.planDetailsValue, color: '#1d4ed8'}}>{formatNumber(summaryMetrics.firstYearCiPremium)} บาท</Text></View>}
                                {/* Divider */}
                                <View style={{ borderBottomWidth: 1, borderColor: '#e2e8f0', marginVertical: 6 }} />
                                {useIWealthy && (
                                    <>
                                        <View style={styles.planDetailsRow}><Text style={styles.planDetailsLabel}>iWealthy คุ้มครองชีวิตเริ่มต้น:</Text><Text style={styles.planDetailsValue}>{formatNumber(summaryMetrics.initialIWealthyDb)} บาท</Text></View>
                                        <View style={styles.planDetailsRow}><Text style={{...styles.planDetailsLabel, color: '#5b21b6'}}>เบี้ย iWealthy ปีแรก:</Text><Text style={{...styles.planDetailsValue, color: '#5b21b6'}}>{formatNumber(summaryMetrics.firstYearIWealthyPremium)} บาท</Text></View>
                                    </>
                                )}
                            </>
                        )}
                    </View>
                </View>
                {useIWealthy && summaryMetrics && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>การวิเคราะห์เชิงเปรียบเทียบ</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                            <KPICard title="เบี้ย CI (หากจ่ายเองทั้งหมด)" value={formatNumber(summaryMetrics.totalCiPremiumPaidAlone)} unit="บาท" />
                            <KPICard title="ค่าใช้จ่ายรวม (ในแผน LTCI)" value={formatNumber(summaryMetrics.totalCostInLtciPlan)} unit="บาท" description="เบี้ย CI ที่จ่ายเอง + เบี้ย iW" />
                            <KPICard title="ประหยัดค่าเบี้ยได้" value={formatNumber(summaryMetrics.savings)} unit="บาท" />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                             <KPICard title="คุ้มครองชีวิตเริ่มต้น (จ่ายเอง)" value={formatNumber(summaryMetrics.initialDbWithoutIwealthy)} unit="บาท" />
                             <KPICard title="คุ้มครองชีวิตเริ่มต้น (แผน LTCI)" value={formatNumber(summaryMetrics.initialDbWithIwealthy)} unit="บาท" />
                        </View>
                    </View>
                )}

                {chartImage && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>กราฟแสดงผลประโยชน์</Text>
                        <Image src={chartImage} style={styles.chartImage} />
                        <ChartLegend controls={ciControls} useIWealthy={useIWealthy} />
                    </View>
                )}
                <PageFooter page={1} totalPages={2} />
            </Page>
            
            <Page size="A4" style={styles.page}>
                <PageHeader />
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ตารางแสดงผลประโยชน์รายปี</Text>
                    <View style={styles.table}>
                        {/* --- Table Header --- */}
                        <View style={styles.tableHeaderRow} fixed>
                        <View style={[styles.tableColHeader, styles.colCenter, {width: '10%'}]}><Text>อายุ</Text></View>
                        
                        {/* 👇 แก้ไขชื่อ Header */}
                        <View style={[styles.tableColHeader, {width: '18%'}]}><Text>เบี้ย CI</Text></View>
                        
                        {useIWealthy && (
                            <>
                                {/* 👇 แก้ไขชื่อ Header และปรับความกว้าง */}
                                <View style={[styles.tableColHeader, {width: '18%'}]}><Text>เบี้ย iW</Text></View>
                                
                                {/* 👇 เพิ่ม Header ใหม่ */}
                                <View style={[styles.tableColHeader, {width: '18%'}]}><Text>เงินถอน iW</Text></View>
                                
                                {/* 👇 ปรับความกว้าง */}
                                <View style={[styles.tableColHeader, {width: '18%'}]}><Text>มูลค่าบัญชี iW</Text></View>
                                <View style={[styles.tableColHeader, {width: '18%'}]}><Text>คุ้มครองชีวิตรวม</Text></View>
                            </>
                        )}
                        {/* กรณีไม่ใช้ iWealthy */}
                        {!useIWealthy && (
                                <View style={[styles.tableColHeader, {width: '72%'}]}><Text>คุ้มครองชีวิตรวม</Text></View>
                        )}
                        </View>
                        
                        {/* --- Table Body --- */}
                        {displayResult.map(row => (
                            <View style={styles.tableRow} key={row.age} wrap={false}>
                                <View style={[styles.tableCol, styles.colCenter, {width: '10%'}]}><Text>{row.age}</Text></View>
                                
                                {/* 👇 ปรับความกว้าง */}
                                <View style={[styles.tableCol, {width: '18%'}]}><Text>{formatNumber(row.totalCiPackagePremiumPaid)}</Text></View>
                                
                                {useIWealthy && (
                                    <>
                                        {/* 👇 ปรับความกว้าง */}
                                        <View style={[styles.tableCol, {width: '18%'}]}><Text>{formatNumber(row.iWealthyTotalPremium)}</Text></View>

                                        {/* 👇 เพิ่ม Cell ข้อมูลใหม่ */}
                                        <View style={[styles.tableCol, {width: '18%'}]}><Text>{formatNumber(Math.round(row.iWealthyWithdrawal ?? 0))}</Text></View>
                                        
                                        {/* 👇 ปรับความกว้าง */}
                                        <View style={[styles.tableCol, {width: '18%'}]}><Text>{formatNumber(Math.round(row.iWealthyEoyAccountValue ?? 0))}</Text></View>
                                        <View style={[styles.tableCol, {width: '18%'}]}><Text>{formatNumber(Math.round(row.totalCombinedDeathBenefit ?? 0))}</Text></View>
                                    </>
                                )}
                                {/* กรณีไม่ใช้ iWealthy */}
                                {!useIWealthy && (
                                    <View style={[styles.tableCol, {width: '72%'}]}><Text>{formatNumber(Math.round(row.totalCombinedDeathBenefit ?? 0))}</Text></View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
                <PageFooter page={2} totalPages={2} />
            </Page>
        </Document>
    );
};