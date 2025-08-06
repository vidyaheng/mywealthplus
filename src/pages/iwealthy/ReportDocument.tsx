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

const LINE_COLORS = {
    deathBenefit: '#3b87eb',
    accountValue: '#F5A623',
    premiumAnnual: 'red',
    premiumCumulative: 'green',
};

// --- 2. สร้าง Stylesheet สำหรับ PDF ---
const styles = StyleSheet.create({
  page: { fontFamily: 'Sarabun', fontSize: 10, padding: 30, color: '#334155' },
  // **ใหม่:** สไตล์สำหรับหน้าปก
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 60,
    backgroundColor: '#e0f2f7', // สีพื้นหลังอ่อนๆ
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#004c6d',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Sarabun',
  },
  coverSubtitle: {
    fontSize: 20,
    color: '#00709b',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Sarabun',
  },
  coverImage: {
    width: 150,
    height: 150,
    marginBottom: 30,
    borderRadius: 75, // ถ้าต้องการให้เป็นวงกลม
  },
  coverDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 'auto', // จัดให้อยู่ด้านล่าง
    fontFamily: 'Sarabun',
  },

  header: { textAlign: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #93c5fd', paddingBottom: 3, marginBottom: 8 },
  summaryText: { lineHeight: 1.5 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33.33%', padding: 5 },
  gridItemHalf: { width: '50%', padding: 5 },
  dataBox: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  dataLabel: { color: '#475569' },
  dataValue: { fontWeight: 'bold' },
  kpiCard: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 3, border: '1px solid #e2e8f0' },
  kpiTitle: { fontSize: 9, color: '#64748b', marginBottom: 4 },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#94a3b8' },

  table: {
    width: "100%",
    borderWidth: 1, // เพิ่มเส้นขอบรอบตารางหลัก
    borderColor: '#ddd',
    borderStyle: 'solid',
  },
  tableRow: {
    flexDirection: "row",
    flexWrap: 'nowrap',
  },
  tableColHeader: {
    backgroundColor: '#f1f5f9',
    padding: 5,
    fontWeight: 'bold',
    textAlign: 'center',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  tableCol: {
    padding: 5,
    textAlign: 'right',
    borderColor: '#ddd',
    borderStyle: 'solid',
    borderWidth: 1, // เพิ่มเส้นขอบทุกด้าน
    borderTopWidth: 0, // ยกเว้นขอบบน เพื่อไม่ให้ซ้ำกับขอบล่างของ row ก่อนหน้า
    borderLeftWidth: 0, // ยกเว้นขอบซ้าย
   
  },
  tableColPolicyYear: { width: "15%", textAlign: 'center',borderLeftWidth: 1, borderBottomWidth: 1 },
  tableColAge: { width: "10%", textAlign: 'center' },
  tableColPremium: { width: "25%", color: LINE_COLORS.premiumCumulative },
  tableColCashValue: { width: "25%", color: LINE_COLORS.accountValue },
  tableColDeathBenefit: { width: "25%", color: LINE_COLORS.deathBenefit },
});

// --- Helper สำหรับจัดรูปแบบวันที่เป็นภาษาไทย (เหมือนใน IWealthyReportPage) ---
const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};


// --- 3. สร้าง Interface สำหรับ Props (เหมือนเดิม) ---
interface ReportDocumentProps {
  metrics: IWealthyState['iWealthyMetrics'];
  result: IWealthyState['iWealthyResult'];
  iWealthyAge: number;
  iWealthyGender: string;
  iWealthyInvestmentReturn: number;
  initialDB: number | null;
  maxDB: { amount: number; age: number } | null;
  investmentOnlyMIRR: number | null;
  investmentOnlyROI: number | null;
  investmentOnlyPI: number | null;
  chartImage: string | null;
  totalWithdrawals: number | null;
}

const formatNum = (val: number | null | undefined) => val?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0';

// **แก้ไข:** สร้าง Component สำหรับตาราง (ปรับโครงสร้างเพื่อรองรับ fixed header)
const ReportTable = ({ data }: { data: AnnualCalculationOutputRow[] }) => (
    <View style={styles.table}>
        {/* Table Header - **สำคัญ:** ใส่ prop fixed เพื่อให้หัวตารางแสดงซ้ำเมื่อตัดหน้า */}
        <View style={styles.tableRow} fixed>
            {/* **แก้ไข:** กำหนดเส้นขอบซ้าย/บน ให้เซลล์หัวตาราง */}
            <View style={[styles.tableColHeader, styles.tableColPolicyYear, { borderLeftWidth: 1, borderTopWidth: 1 }]}><Text>สิ้นปีกรมธรรม์</Text></View>
            <View style={[styles.tableColHeader, styles.tableColAge, { borderTopWidth: 1 }]}><Text>อายุ</Text></View>
            <View style={[styles.tableColHeader, styles.tableColPremium, { borderTopWidth: 1 }]}><Text>เบี้ยสะสม</Text></View>
            <View style={[styles.tableColHeader, styles.tableColCashValue, { borderTopWidth: 1 }]}><Text>มูลค่าเวนคืน</Text></View>
            <View style={[styles.tableColHeader, styles.tableColDeathBenefit, { borderTopWidth: 1, borderRightWidth: 1 }]}><Text>ความคุ้มครองชีวิต</Text></View>
        </View>

        {/* Table Body */}
        {data.map((row: AnnualCalculationOutputRow, index: number) => {
            const cumulativePremium = data.slice(0, index + 1).reduce((acc: number, curr: AnnualCalculationOutputRow) => acc + (curr.totalPremiumYear ?? 0), 0);
            const isLastRow = index === data.length - 1;
            
            return (
                <View style={styles.tableRow} key={row.policyYear}>
                    {/* **แก้ไข:** กำหนดเส้นขอบซ้าย/ขวา และขอบล่างตาม isLastRow */}
                    <View style={[styles.tableCol, styles.tableColPolicyYear, { borderLeftWidth: 1, borderBottomWidth: isLastRow ? 1 : 0 }]}><Text>{row.policyYear}</Text></View>
                    <View style={[styles.tableCol, styles.tableColAge, { borderBottomWidth: isLastRow ? 1 : 0 }]}><Text>{row.age}</Text></View>
                    <View style={[styles.tableCol, styles.tableColPremium, { borderBottomWidth: isLastRow ? 1 : 0 }]}><Text>{formatNum(cumulativePremium)}</Text></View>
                    <View style={[styles.tableCol, styles.tableColCashValue, { borderBottomWidth: isLastRow ? 1 : 0 }]}><Text>{formatNum(row.eoyCashSurrenderValue)}</Text></View>
                    <View style={[styles.tableCol, styles.tableColDeathBenefit, { borderRightWidth: 1, borderBottomWidth: isLastRow ? 1 : 0 }]}><Text>{formatNum(row.eoyDeathBenefit)}</Text></View>
                </View>
            );
        })}
    </View>
);

// --- 4. สร้าง Component ของเอกสาร PDF ---
export const ReportDocument: React.FC<ReportDocumentProps> = (props) => {
    const { metrics, result, iWealthyAge, iWealthyGender, iWealthyInvestmentReturn, initialDB, maxDB, investmentOnlyMIRR, investmentOnlyROI, investmentOnlyPI } = props;

    if (!result || !metrics) {
        return <Document><Page><Text>ไม่มีข้อมูลสำหรับสร้างรายงาน</Text></Page></Document>;
    }
    
    const totalPremium = (result.annual[0]?.premiumRPPYear ?? 0) + (result.annual[0]?.premiumRTUYear ?? 0);
    const totalBenefit = (metrics.finalFundValue ?? 0) + (metrics.totalWithdrawals ?? 0);

    return (
        <Document>
            {/* --- 1. หน้าปก (Cover Page) --- */}
            <Page size="A4" style={styles.coverPage}>
                <View>
                    {/* <Image src="/path/to/your/company-logo.png" style={styles.coverImage} />  <--- ลบ Image ออก หรือคอมเมนต์ไว้ */}
                    <Text style={styles.coverTitle}>รายงานสรุปผลประโยชน์และการวิเคราะห์ทางการเงิน</Text>
                    <Text style={styles.coverSubtitle}>สำหรับผลิตภัณฑ์ iWealthy</Text>
                    {/* <Text style={styles.coverSubtitle}>บริษัท กรุงไทย-แอกซ่า ประกันชีวิต จำกัด (มหาชน)</Text>  <--- ถ้าไม่อยากให้มีชื่อบริษัท ก็ลบออก หรือคอมเมนต์ไว้ */}
                </View>
                <Text style={styles.coverDate}>จัดทำ ณ วันที่: {formatDate(new Date())}</Text>
            </Page>

            {/* --- 2. บทสรุปผู้บริหาร (Executive Summary) --- */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>รายงานสรุปผลประโยชน์และการวิเคราะห์ทางการเงิน</Text>
                    <Text style={styles.headerSubtitle}>ผลิตภัณฑ์ iWealthy - บมจ. กรุงไทย-แอกซ่า ประกันชีวิต</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>บทสรุปสำหรับผู้เอาประกัน</Text>
                    <Text style={styles.summaryText}>
                        {`แผนประกันควบการลงทุน iWealthy นี้ได้รับการวิเคราะห์และคาดการณ์ว่าจะสามารถสร้าง `}
                        <Text style={{ fontWeight: 'bold' }}>อัตราผลตอบแทนทบต้นที่แท้จริง (MIRR) ที่ </Text>
                        <Text style={{ fontWeight: 'bold', color: '#22c55e', fontSize: 11 }}>{investmentOnlyMIRR !== null ? (investmentOnlyMIRR * 100).toFixed(2) : 'N/A'}%</Text>
                        <Text> ต่อปี (วิเคราะห์แบบ BTID). </Text>
                        <Text>โดยคาดว่า </Text>
                        <Text style={{ fontWeight: 'bold' }}>จุดคุ้มทุน (Breakeven Point) คือปีที่ {metrics.breakEvenYear ?? '-'}</Text>
                        <Text> (เมื่ออายุ {metrics.breakEvenAge ?? '-'} ปี) </Text>
                        <Text>และมีมูลค่าบัญชีกรมธรรม์ ณ สิ้นสุดโครงการที่ประมาณ </Text>
                        <Text style={{ fontWeight: 'bold' }}>{formatNum(metrics.finalFundValue)} บาท</Text>
                        <Text>. พร้อมความคุ้มครองชีวิตสูงสุด </Text>
                        <Text style={{ fontWeight: 'bold' }}>{formatNum(maxDB?.amount)} บาท ณ อายุ {maxDB?.age} ปี</Text>
                        <Text>. แผนการลงทุนนี้จึงนำเสนอโอกาสในการสร้างความมั่งคั่งระยะยาวพร้อมความคุ้มครองชีวิตที่มั่นคง.</Text>
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ข้อมูลเบื้องต้นสำหรับแผน iWealthy</Text>
                    <View style={styles.dataBox}>
                        <View style={styles.gridContainer}>
                            <View style={styles.gridItem}><Text><Text style={styles.dataLabel}>อายุผู้เอาประกัน:</Text> {iWealthyAge} ปี</Text></View>
                            <View style={styles.gridItem}><Text><Text style={styles.dataLabel}>เพศ:</Text> {iWealthyGender === 'male' ? 'ชาย' : 'หญิง'}</Text></View>
                            <View style={styles.gridItem}><Text><Text style={styles.dataLabel}>ผลตอบแทนคาดหวัง:</Text> {iWealthyInvestmentReturn}% ต่อปี</Text></View>
                        </View>
                        <View style={[styles.gridContainer, {marginTop: 5}]}>
                            <View style={styles.gridItem}><Text><Text style={styles.dataLabel}>เบี้ยประกันรวม (ต่อปี):</Text> {`${formatNum(totalPremium)} บาท`}</Text></View>
                            <View style={styles.gridItem}><Text><Text style={styles.dataLabel}>ความคุ้มครองเริ่มต้น:</Text> {`${formatNum(initialDB)} บาท`}</Text></View>
                            <View style={styles.gridItem}><Text><Text style={styles.dataLabel}>ความคุ้มครองสูงสุด:</Text> {`${formatNum(maxDB?.amount)} (อายุ ${maxDB?.age}) บาท`}</Text></View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ตัวชี้วัดทางการเงิน (KPIs)</Text>
                    <View style={styles.gridContainer}>
                        <View style={styles.gridItemHalf}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiTitle}>MIRR (Modified Internal Rate of Return)</Text>
                                <Text style={styles.kpiValue}>{investmentOnlyMIRR !== null ? `${(investmentOnlyMIRR * 100).toFixed(2)}%` : 'N/A'}</Text>
                                <Text style={styles.kpiTitle}>ผลตอบแทนส่วนลงทุน (BTID) ต่อปี</Text>
                            </View>
                        </View>
                        <View style={styles.gridItemHalf}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiTitle}>จุดคุ้มทุน (Breakeven Point)</Text>
                                <Text style={styles.kpiValue}>{metrics.breakEvenYear ? `ปีที่ ${metrics.breakEvenYear} (อายุ ${metrics.breakEvenAge})` : 'ไม่พบ'}</Text>
                                <Text style={styles.kpiTitle}>มูลค่าเวนคืน ≥ เบี้ยสะสม</Text>
                            </View>
                        </View>
                        <View style={styles.gridItemHalf}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiTitle}>เบี้ยประกันที่ชำระทั้งหมด</Text>
                                <Text style={styles.kpiValue}>{`${formatNum(metrics.totalPremiumsPaid)} บาท`}</Text>
                                <Text style={styles.kpiTitle}>รวมเบี้ย RPP และ RTU</Text>
                            </View>
                        </View>
                        <View style={styles.gridItemHalf}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiTitle}>ผลประโยชน์รวมตลอดสัญญา</Text>
                                <Text style={styles.kpiValue}>{`${formatNum(totalBenefit)} บาท`}</Text>
                                <Text style={styles.kpiTitle}>มูลค่าบัญชีสิ้นสุด + เงินถอนรวม</Text>
                            </View>
                        </View>
                        <View style={styles.gridItemHalf}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiTitle}>ROI (Return on Investment)</Text>
                                <Text style={styles.kpiValue}>{investmentOnlyROI !== null ? investmentOnlyROI.toFixed(2) : 'N/A'}%</Text>
                                <Text style={styles.kpiTitle}>กำไรส่วนลงทุน (BTID) / เงินลงทุน</Text>
                            </View>
                        </View>
                        <View style={styles.gridItemHalf}>
                            <View style={styles.kpiCard}>
                                <Text style={styles.kpiTitle}>PI (Profitability Index)</Text>
                                <Text style={styles.kpiValue}>{investmentOnlyPI !== null ? investmentOnlyPI.toFixed(2) : 'N/A'} เท่า</Text>
                                <Text style={styles.kpiTitle}>PV เงินเข้า / PV เงินออก</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>

            {/* --- 3. ตารางแสดงเบี้ย มูลค่ากรมธรรม์ ความคุ้มครองชีวิต --- */}
            <Page size="A4" style={styles.page} break> {/* ใช้ break เพื่อขึ้นหน้าใหม่ */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>ตารางแสดงผลประโยชน์รายปี</Text>
                    <Text style={styles.headerSubtitle}>ผลิตภัณฑ์ iWealthy - บมจ. กรุงไทย-แอกซ่า ประกันชีวิต</Text>
                </View>
                <View style={[styles.section, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>รายละเอียดผลประโยชน์และมูลค่ากรมธรรม์รายปี</Text>
                    <ReportTable data={result.annual} />
                </View>
            </Page>

            {/* --- 4. กราฟ Cash Flow / Break-even / NPV / MIRR / ROI / PI --- */}
            {props.chartImage && (
                <Page size="A4" style={styles.page} break> {/* ใช้ break เพื่อขึ้นหน้าใหม่ */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>กราฟแสดงผลประโยชน์และการวิเคราะห์ทางการเงิน</Text>
                        <Text style={styles.headerSubtitle}>ผลิตภัณฑ์ iWealthy - บมจ. กรุงไทย-แอกซ่า ประกันชีวิต</Text>
                    </View>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>การวิเคราะห์แนวโน้มผลประโยชน์และตัวชี้วัดสำคัญ</Text>
                        <Image src={props.chartImage} style={{ width: '100%', height: 'auto' }} /> {/* ปรับ Image style เพื่อให้ยืดตาม width */}
                    </View>
                </Page>
            )}

            {/* --- 5. บทสรุปข้อเสนอแนะ (สามารถปรับเนื้อหาได้ตามต้องการ) --- */}
            <Page size="A4" style={styles.page} break> {/* ใช้ break เพื่อขึ้นหน้าใหม่ */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>บทสรุปและข้อเสนอแนะ</Text>
                    <Text style={styles.headerSubtitle}>ผลิตภัณฑ์ iWealthy - บมจ. กรุงไทย-แอกซ่า ประกันชีวิต</Text>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ข้อพิจารณาและการตัดสินใจลงทุน</Text>
                    <Text style={styles.summaryText}>
                        จากผลการวิเคราะห์ข้างต้น แผนประกันควบการลงทุน iWealthy แสดงให้เห็นถึงศักยภาพในการสร้างผลตอบแทนที่น่าสนใจ 
                        พร้อมความคุ้มครองชีวิตที่ครอบคลุมตลอดอายุสัญญา. จุดเด่นของแผนนี้คือความยืดหยุ่นในการปรับเปลี่ยนเบี้ยประกันและแผนการลงทุน 
                        เพื่อให้สอดคล้องกับเป้าหมายและความเสี่ยงที่ผู้เอาประกันภัยรับได้ในแต่ละช่วงชีวิต. 
                        อย่างไรก็ตาม ผู้เอาประกันภัยควรพิจารณาถึงความผันผวนของตลาดการลงทุนและปัจจัยอื่นๆ ที่อาจส่งผลต่อผลตอบแทนที่แท้จริง.
                    </Text>
                    <Text style={[styles.summaryText, { marginTop: 10 }]}>
                        จึงขอเสนอแนะให้ปรึกษาผู้เชี่ยวชาญทางการเงินเพื่อวางแผนการลงทุนที่เหมาะสมกับสถานการณ์ส่วนบุคคล 
                        และทบทวนแผนการลงทุนเป็นประจำ เพื่อให้บรรลุเป้าหมายทางการเงินที่ตั้งไว้.
                    </Text>
                </View>
            </Page>

            {/* --- 6. หมายเหตุและข้อจำกัดความรับผิดชอบ (Footer) --- */}
            <Page size="A4" style={styles.page} break>
                <Text style={styles.footer}>
                    ข้อจำกัดความรับผิดชอบ: เอกสารนี้เป็นเพียงภาพประกอบที่จัดทำขึ้นตามข้อสมมติฐานที่ระบุไว้ข้างต้นเท่านั้น ไม่ใช่ส่วนหนึ่งของสัญญาประกันภัย 
                    อัตราผลตอบแทนจากการลงทุนที่แสดงเป็นเพียงการคาดการณ์และอาจมีการเปลี่ยนแปลงได้ตามสภาวะตลาดจริง 
                    ผู้ลงทุนควรทำความเข้าใจลักษณะสินค้า เงื่อนไขผลตอบแทน และความเสี่ยงก่อนตัดสินใจลงทุน
                </Text>
            </Page>
        </Document>
    );
};