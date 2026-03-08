// src/pages/iwealthy/ReportDocument.tsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { IWealthyState } from '@/stores/appStore';
import type { AnnualCalculationOutputRow } from '@/lib/calculations';

// --- 1. ลงทะเบียนฟอนต์ภาษาไทย ---
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
  ],
});

// --- 2. Stylesheet สำหรับเอกสาร PDF ---
const styles = StyleSheet.create({
  // General
  page: { 
    fontFamily: 'Sarabun', 
    fontSize: 10, 
    padding: '40px 35px', 
    color: '#334155' 
  },
  bold: { fontWeight: 'bold' },
  
  // Header & Footer
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    textAlign: 'left',
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0c4a6e' 
  },
  headerSubtitle: { 
    fontSize: 11, 
    color: '#475569' 
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
  },

  // Section
  section: { 
    marginBottom: 15,
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1e3a8a', 
    borderBottomWidth: 1.5, 
    borderBottomColor: '#60a5fa', 
    paddingBottom: 4, 
    marginBottom: 10 
  },

  // Content Blocks
  summaryText: { 
    lineHeight: 1.6, 
    textAlign: 'justify' 
  },
  dataBox: { 
    backgroundColor: '#f8fafc', 
    padding: '10px 12px', 
    borderRadius: 4, 
    borderWidth: 1, 
    borderColor: '#f1f5f9' 
  },
  dataGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap' 
  },
  dataGridItem: { 
    width: '33.33%', 
    padding: '4px 0' 
  },
  dataGridItemHalf: {
      width: '50%',
      padding: '4px 0'
  },
  dataSubHeader: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1e3a8a',
      marginBottom: 6,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // สีเทาอ่อนๆ
    borderBottomStyle: 'solid',
    marginVertical: 10, // เพิ่มระยะห่างบน-ล่าง
},
  dataLabel: { 
    color: '#475569' 
  },

  legendContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center', // จัดให้อยู่กลาง
    gap: 20, // ระยะห่างระหว่างแต่ละรายการ
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    backgroundColor: '#f8fafc'
},
  
  // KPI Cards
  kpiContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 10
  },
  kpiCard: { 
    backgroundColor: '#f8fafc', 
    padding: 10, 
    borderRadius: 4, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 220,
  },
  kpiTitle: { 
    fontSize: 9, 
    color: '#64748b', 
    marginBottom: 4 
  },
  kpiValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e3a8a' 
  },
  kpiDescription: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2
  },

  // Table
  table: { 
    width: '100%', 
    //borderWidth: 1, 
    //borderColor: '#e2e8f0', 
    borderStyle: 'solid' 
  },
  tableRow: { 
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableColHeader: { 
    backgroundColor: '#f1f5f9', 
    padding: 6, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#cbd5e1', 
    borderRightWidth: 1, 
    borderRightColor: '#e2e8f0' 
  },
  tableCol: { 
    padding: 5, 
    textAlign: 'right', 
    borderRightWidth: 1, 
    borderRightColor: '#e2e8f0' 
  },
  // Column Widths
  colYear: { 
    width: '12%', 
    textAlign: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0'
  },
  colAge: { width: '12%', textAlign: 'center' },
  colPremium: { width: '26%' },
  colCashValue: { width: '25%' },
  colDeathBenefit: { width: '25%' },
  lastCol: { borderRightWidth: 0 },
  
  // Chart Image
  chartImage: {
    width: '100%',
    height: 'auto',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4
  }
});


// --- Helper Functions ---
const formatDate = (date: Date) => date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
const formatNum = (val: number | null | undefined) => {
    // ถ้าค่าเป็น 0 หรือ null ให้แสดงเป็น '-'
    if (val === null || val === undefined || val === 0) {
        return '-';
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

// --- Props Interface ---
interface ReportDocumentProps {
    metrics: IWealthyState['iWealthyMetrics'];
    result: IWealthyState['iWealthyResult'];
    iWealthyAge: number;
    iWealthyGender: string;
    iWealthyRpp: number;
    iWealthyRtu: number;
    iWealthyInvestmentReturn: number;
    initialDB: number | null;
    maxDB: { amount: number; age: number } | null;
    investmentOnlyMIRR: number | null;
    investmentOnlyROI: number | null;
    investmentOnlyPI: number | null;
    chartImage: string | null;
    totalWithdrawals: number | null;
}

// --- Reusable Components ---

const PageHeader = () => (
    <View style={styles.header}>
        <Text style={styles.headerTitle}>รายงานสรุปผลประโยชน์และการวิเคราะห์ทางการเงิน</Text>
        <Text style={styles.headerSubtitle}>ผลิตภัณฑ์ iWealthy - บมจ. กรุงไทย-แอกซ่า ประกันชีวิต</Text>
    </View>
);

const PageFooter = () => (
    <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `เอกสารฉบับนี้เพื่อประกอบการเสนอขายเท่านั้น | จัดทำ ณ วันที่ ${formatDate(new Date())} | หน้า ${pageNumber} / ${totalPages} `
    )} fixed />
);

const LegendItem = ({ color, text }: { color: string, text: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 10, height: 10, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 9 }}>{text}</Text>
    </View>
);

const KPICard = ({ title, value, unit = '', description = '' }: { title: string, value: string | number, unit?: string, description?: string }) => (
    <View style={styles.kpiCard}>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiValue}>
            {value}
            {/* ย้าย space ' ' เข้ามารวมกับ unit ใน Text เดียวกัน */}
            <Text>{` ${unit}`}</Text> 
        </Text>
        {description && <Text style={styles.kpiDescription}>{description}</Text>}
    </View>
);

// --- [ปรับปรุง] ReportTable Component ---
const ReportTable = ({ data }: { data: AnnualCalculationOutputRow[] }) => (
    <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow} fixed>
            <View style={[styles.tableColHeader, styles.colYear, { borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}><Text>ปีที่</Text></View>
            <View style={[styles.tableColHeader, styles.colAge, { borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}><Text>อายุ</Text></View>
            {/* 1. เปลี่ยนหัวตาราง */}
            <View style={[styles.tableColHeader, styles.colPremium, { borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}><Text>เบี้ยประกันรายปี</Text></View>
            <View style={[styles.tableColHeader, styles.colCashValue, { borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}><Text>มูลค่าเวนคืน</Text></View>
            <View style={[styles.tableColHeader, styles.colDeathBenefit, { borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}><Text>ความคุ้มครองชีวิต</Text></View>
        </View>

        {/* Table Body */}
        {data.map((row: AnnualCalculationOutputRow) => (
            <View style={styles.tableRow} key={row.policyYear} wrap={false}>
                 <View style={[styles.tableCol, styles.colYear]}><Text>{row.policyYear}</Text></View>
                 <View style={[styles.tableCol, styles.colAge]}><Text>{row.age}</Text></View>
                 {/* 2. แสดงเบี้ยประกันของปีนั้นๆ (ต้องมี totalPremiumYear ใน object ของ data) */}
                 <View style={[styles.tableCol, styles.colPremium]}><Text>{formatNum(row.totalPremiumYear)}</Text></View>
                 <View style={[styles.tableCol, styles.colCashValue]}><Text>{formatNum(row.eoyCashSurrenderValue)}</Text></View>
                 <View style={[styles.tableCol, styles.colDeathBenefit]}><Text>{formatNum(row.eoyDeathBenefit)}</Text></View>
            </View>
        ))}
    </View>
);


// --- Main Document Component ---
export const ReportDocument: React.FC<ReportDocumentProps> = (props) => {
    const { 
        metrics, result, iWealthyAge, iWealthyGender, iWealthyRpp, iWealthyRtu,
        iWealthyInvestmentReturn, initialDB, maxDB, investmentOnlyMIRR, 
        investmentOnlyROI, investmentOnlyPI, chartImage, totalWithdrawals 
    } = props;

    if (!result || !metrics) {
        return <Document><Page><Text>ไม่มีข้อมูลสำหรับสร้างรายงาน</Text></Page></Document>;
    }
    
    const totalAnnualPremium = iWealthyRpp + iWealthyRtu;
    const totalBenefit = (metrics.finalFundValue ?? 0) + (totalWithdrawals ?? 0);

    // หาจำนวนหน้าทั้งหมดแบบไดนามิก
    let pageCount = 2; // เริ่มที่ 2 หน้า (สรุป, ตาราง)
    if (chartImage) pageCount++;
    
    //let currentPage = 1;

    console.log('CHECKING DATA FOR PDF TABLE:', result.annual);

    return (
        <Document author="Your Name" title={`iWealthy Report - ${formatDate(new Date())}`}>
            {/* Page 1: Summary & KPIs */}
            <Page size="A4" style={styles.page}>
                <PageHeader />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>บทสรุปสำหรับผู้เอาประกัน </Text>
                    <Text style={styles.summaryText}>
                        แผนประกันควบการลงทุน iWealthy นี้ถูกคาดการณ์ว่าจะสามารถสร้าง
                        <Text style={styles.bold}> อัตราผลตอบแทนทบต้นที่แท้จริง (MIRR) ที่ {(investmentOnlyMIRR !== null ? (investmentOnlyMIRR * 100).toFixed(2) : '-')} % ต่อปี </Text>
                        (วิเคราะห์แบบ BTID) โดยมี
                        <Text style={styles.bold}> จุดคุ้มทุน (Breakeven Point) ในปีที่ {metrics.breakEvenYear ?? '-'} </Text>
                        (เมื่ออายุ {metrics.breakEvenAge ?? '-'} ปี) และมีมูลค่าบัญชีกรมธรรม์ ณ สิ้นสุดโครงการที่ประมาณ
                        <Text style={styles.bold}> {formatNum(metrics.finalFundValue)} บาท</Text>. 
                        พร้อมความคุ้มครองชีวิตสูงสุด
                        <Text style={styles.bold}> {formatNum(maxDB?.amount)} บาท </Text>
                        (ณ อายุ {maxDB?.age} ปี) แผนนี้จึงเป็นทางเลือกที่น่าสนใจสำหรับการสร้างความมั่งคั่งระยะยาวควบคู่กับความคุ้มครองชีวิตที่มั่นคง 
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ข้อมูลเบื้องต้นสำหรับแผน iWealthy </Text>
                    <View style={styles.dataBox}>

                        {/* --- กลุ่มย่อย: ข้อมูลผู้เอาประกัน --- */}
                        <Text style={styles.dataSubHeader}>ข้อมูลผู้เอาประกัน </Text>
                        <View style={styles.dataGrid}>
                            <View style={styles.dataGridItemHalf}>
                                <Text><Text style={styles.dataLabel}>อายุ:</Text> {iWealthyAge} ปี</Text>
                            </View>
                            <View style={styles.dataGridItemHalf}>
                                <Text><Text style={styles.dataLabel}>เพศ:</Text> {iWealthyGender === 'male' ? 'ชาย' : 'หญิง'}</Text>
                            </View>
                        </View>

                        <View style={styles.hr} />

                        {/* --- กลุ่มย่อย: ข้อมูลแผนประกัน (ใส่ style เพื่อเพิ่มระยะห่าง) --- */}
                        <Text style={[styles.dataSubHeader, { marginTop: 2 }]}>ข้อมูลแผนประกัน </Text>
                        <View style={styles.dataGrid}>
                            <View style={styles.dataGridItemHalf}>
                                <Text><Text style={styles.dataLabel}>ผลตอบแทนคาดหวัง:</Text> {iWealthyInvestmentReturn}%</Text>
                            </View>
                            <View style={styles.dataGridItemHalf}>
                                <Text><Text style={styles.dataLabel}>เบี้ยประกันรวม/ปี:</Text> {formatNum(totalAnnualPremium)} บาท</Text>
                            </View>
                            <View style={styles.dataGridItemHalf}>
                                <Text><Text style={styles.dataLabel}>ความคุ้มครองเริ่มต้น:</Text> {formatNum(initialDB)} บาท</Text>
                            </View>
                            <View style={styles.dataGridItemHalf}>
                                <Text><Text style={styles.dataLabel}>ความคุ้มครองสูงสุด:</Text> {formatNum(maxDB?.amount)} บาท</Text>
                            </View>
                        </View>

                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ตัวชี้วัดทางการเงิน (Financial KPIs)</Text>
                    <View style={styles.kpiContainer}>
                        <KPICard 
                            title="MIRR (ผลตอบแทนทบต้นที่แท้จริง) " 
                            value={investmentOnlyMIRR !== null ? (investmentOnlyMIRR * 100).toFixed(2) : 'N/A'} 
                            unit="%" 
                            description="ผลตอบแทนส่วนลงทุน (BTID) ต่อปี "
                        />
                         <KPICard 
                            title="จุดคุ้มทุน (Breakeven Point) " 
                            value={metrics.breakEvenYear ?? 'ไม่พบ'} 
                            unit={metrics.breakEvenYear ? `ปีที่ (อายุ ${metrics.breakEvenAge})` : ''}
                            description="มูลค่าเวนคืน ≥ เบี้ยสะสม "
                        />
                         <KPICard 
                            title="เบี้ยประกันที่ชำระทั้งหมด " 
                            value={formatNum(metrics.totalPremiumsPaid)}
                            unit="บาท"
                            description="ตลอดอายุสัญญา "
                        />
                         <KPICard 
                            title="ผลประโยชน์รวมตลอดสัญญา " 
                            value={formatNum(totalBenefit)}
                            unit="บาท"
                            description="มูลค่าสิ้นสุด + เงินถอนรวม "
                        />
                         <KPICard 
                            title="ROI (ผลตอบแทนจากการลงทุน) " 
                            value={investmentOnlyROI !== null ? investmentOnlyROI.toFixed(2) : 'N/A'}
                            unit="%"
                            description="กำไรส่วนลงทุน (BTID) / เงินลงทุน "
                        />
                         <KPICard 
                            title="PI (ดัชนีกำไร) " 
                            value={investmentOnlyPI !== null ? investmentOnlyPI.toFixed(2) : 'N/A'}
                            unit="เท่า"
                            description="PV เงินเข้า / PV เงินออก "
                        />
                    </View>
                </View>
                
                <PageFooter />
            </Page>

            {/* Page 2: Chart */}
            {chartImage && (
                <Page size="A4" style={styles.page} break>
                    <PageHeader />
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>การวิเคราะห์แนวโน้มผลประโยชน์</Text>
                        <Text style={{marginBottom: 10, lineHeight: 1.5}}>กราฟแสดงความสัมพันธ์ระหว่างเบี้ยประกันภัยสะสม, มูลค่าบัญชีกรมธรรม์, และความคุ้มครองชีวิตตลอดระยะเวลาของกรมธรรม์ เพื่อให้เห็นภาพรวมการเติบโตของมูลค่าการลงทุนและความคุ้มครอง</Text>
                        <Image src={chartImage} style={styles.chartImage} />

                        {/* --- เพิ่มโค้ดส่วนนี้เข้าไปใต้กราฟ --- */}
                        <View style={styles.legendContainer}>
                            <LegendItem color="#F5A623" text="มูลค่ากรมธรรม์" />
                            <LegendItem color="#3b87eb" text="ความคุ้มครองชีวิต" />
                            <LegendItem color="#22c55e" text="เบี้ยประกันสะสม" />
                        </View>
                        {/* ----------------------------------- */}

                    </View>
                    <PageFooter />
                </Page>
            )}

            {/* Page 3: Table */}
            <Page size="A4" style={styles.page} break>
                <PageHeader />
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ตารางแสดงผลประโยชน์รายปี</Text>
                    <ReportTable data={result.annual} />
                </View>
                <PageFooter />
            </Page>

        </Document>
    );
};