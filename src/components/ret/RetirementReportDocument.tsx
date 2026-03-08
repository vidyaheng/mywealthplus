// src/components/ret/RetirementReportDocument.tsx

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { AnnualRetirementOutputRow } from '@/components/ret/hooks/useRetirementTypes';

// --- ลงทะเบียนฟอนต์ภาษาไทย ---
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf' },
    { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
  ],
});

// --- Stylesheet สำหรับ PDF ---
const styles = StyleSheet.create({
  page: { fontFamily: 'Sarabun', padding: 30, fontSize: 9, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '2px solid #0c4a6e', marginBottom: 20 },
  headerLeft: { flexDirection: 'column' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#075985' },
  headerSubtitle: { fontSize: 12, color: '#334155' },
  headerRight: { textAlign: 'right', color: '#64748b', fontSize: 10 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0c4a6e', borderLeft: '3px solid #0c4a6e', paddingLeft: 6, marginBottom: 10 },
  kpiContainer: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, padding: 10, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4 },
  kpiTitle: { fontSize: 8, color: '#475569' },
  kpiValue: { fontSize: 14, fontWeight: 'bold', color: '#0369a1' },
  kpiUnit: { fontSize: 9, fontWeight: 'normal', color: '#64748b' },
  comparisonContainer: { flexDirection: 'row', gap: 10, border: '1px solid #e2e8f0', borderRadius: 4, backgroundColor: '#f8fafc', padding: 10, },
  comparisonItem: { flex: 1, textAlign: 'center' },
  comparisonLabel: { fontSize: 9, color: '#475569' },
  comparisonValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  comparisonSubtext: { fontSize: 8, color: '#64748b', marginTop: 2 },
  planValue: { color: '#059669' },
  savingsValue: { color: '#ea580c' },
  differenceValue: { color: '#0369a1' },
  chartImage: { width: '100%', height: 'auto', marginTop: 10, marginBottom: 20 },
  infoBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: 12, flexDirection: 'row', justifyContent: 'space-around' },
  infoItem: { fontSize: 10 },
  infoLabel: { color: '#475569' },
  infoValue: { fontWeight: 'bold', color: '#1e293b' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTop: '1px solid #cbd5e1', paddingTop: 8, fontSize: 7, color: '#64748b', textAlign: 'justify' },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendColorBox: { width: 10, height: 10 },
  legendText: { fontSize: 8, color: '#475569' },

  // --- ✨ [แก้ไขแล้ว] สถาปัตยกรรมสไตล์ตารางใหม่ทั้งหมด ---

  // 1. Table Container (ไม่มีเส้นขอบเลย)
  table: {
    width: "100%",
  },

  // 2. แถวปกติ: มีเส้นคั่นล่าง และ "สร้างกรอบซ้าย-ขวาของตัวเอง"
  tableRow: {
    flexDirection: "row",
    //borderBottomWidth: 0.5,
    //borderBottomColor: '#cbd5e1',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#4b5563',
  },

  // 3. แถว Header: เพิ่มเส้น "ขอบบนสุด" และ "ขอบล่างหนา"
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1.5, // สร้างเส้นบนสุดของตาราง
    borderBottomWidth: 1.5,
    borderBottomColor: '#4b5563',
  },

  // 4. Cell: มีแค่เส้น "คั่นแนวตั้ง" ด้านขวา
  tableCell: {
    padding: 5,
    borderRightWidth: 0.5,
    borderRightColor: '#cbd5e1',
  },
  
  // 5. Cell สุดท้าย: ไม่ต้องมีเส้นขวา
  lastCell: {
    borderRightWidth: 0,
  },

  // --- (ส่วนที่เหลือของ style เหมือนเดิม) ---
  tableCellHeader: { textAlign: 'center', fontWeight: 'bold' },
  tableCellText: { textAlign: 'right' },
  tableCellAgeText: { textAlign: 'center' },
  colAge: { flex: 1.2 },
  colData: { flex: 2 },
  bgRed: { backgroundColor: '#fee2e2' },
  bgTeal: { backgroundColor: '#d1fae5' },
  bgGreen: { backgroundColor: '#dcfce7' },
  bgBlue: { backgroundColor: '#dbeafe' },
  bgPurple: { backgroundColor: '#ede9fe' },
});

interface ReportProps {
    reportData: any;
    result: AnnualRetirementOutputRow[];
    planningAge: number;
    gender: string;
    investmentReturn: number;
    chartImage: string | null;
    showPremium: boolean;
    showPayoutCumulative: boolean;
    showFundValue: boolean;
    showDeathBenefit: boolean;
    showTaxBenefit: boolean;
}

export const RetirementReportDocument = ({ 
    reportData, result, planningAge, gender, investmentReturn, chartImage,
    showPremium, showPayoutCumulative, showFundValue, showDeathBenefit,
    showTaxBenefit
}: ReportProps) => {
    const difference = reportData.totalPayoutsReceived - reportData.savingsTotalPayout;
    const formatNum = (num: number | undefined | null) => (num === undefined || num === null || num === 0) ? '-' : num.toLocaleString('en-US', {maximumFractionDigits: 0});

    return (
    <Document>
        {/* --- หน้าที่ 1: สรุปและกราฟ (เหมือนเดิม) --- */}
        <Page size="A4" style={styles.page}>
           <View style={styles.header}>
               <View style={styles.headerLeft}>
                   <Text style={styles.headerTitle}>รายงานสรุปแผนเพื่อการเกษียณ</Text>
                   <Text style={styles.headerSubtitle}>Retirement Planner</Text>
               </View>
               <View style={styles.headerRight}>
                   <Text>จัดทำ ณ วันที่: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}</Text>
               </View>
           </View>
           <View style={styles.section}>
               <Text style={styles.sectionTitle}>ข้อมูลเบื้องต้นและข้อสมมติฐาน</Text>
               <View style={styles.infoBox}>
                   <Text style={styles.infoItem}><Text style={styles.infoLabel}>อายุ: </Text><Text style={styles.infoValue}>{planningAge} ปี</Text></Text>
                   <Text style={styles.infoItem}><Text style={styles.infoLabel}>เพศ: </Text><Text style={styles.infoValue}>{gender === 'male' ? 'ชาย' : 'หญิง'}</Text></Text>
                   <Text style={styles.infoItem}><Text style={styles.infoLabel}>ผลตอบแทน: </Text><Text style={styles.infoValue}>{investmentReturn}% ต่อปี</Text></Text>
               </View>
           </View>
           <View style={styles.section}>
               <Text style={styles.sectionTitle}>สรุปผลประโยชน์หลัก</Text>
               <View style={styles.kpiContainer}>
                   <View style={styles.kpiCard}><Text style={styles.kpiTitle}>เบี้ยที่ชำระทั้งหมด</Text><Text style={styles.kpiValue}>{formatNum(reportData.totalPremiumsPaid)} <Text style={styles.kpiUnit}>บาท</Text></Text></View>
                   <View style={styles.kpiCard}><Text style={styles.kpiTitle}>เงินเกษียณที่ได้รับทั้งหมด</Text><Text style={styles.kpiValue}>{formatNum(reportData.totalPayoutsReceived)} <Text style={styles.kpiUnit}>บาท</Text></Text></View>
                   <View style={styles.kpiCard}><Text style={styles.kpiTitle}>คุ้มครองชีวิตสูงสุด</Text><Text style={styles.kpiValue}>{formatNum(reportData.maxDeathBenefit)} <Text style={styles.kpiUnit}>บาท</Text></Text></View>
               </View>
           </View>
           <View style={styles.section}>
               <Text style={styles.sectionTitle}>ผลการเปรียบเทียบ</Text>
               <View style={styles.comparisonContainer}>
                   <View style={styles.comparisonItem}>
                       <Text style={styles.comparisonLabel}>ผลประโยชน์รวมจากแผน</Text>
                       <Text style={[styles.comparisonValue, styles.planValue]}>{formatNum(reportData.totalPayoutsReceived)}</Text>
                   </View>
                   <View style={styles.comparisonItem}>
                       <Text style={styles.comparisonLabel}>ผลประโยชน์จากออมทรัพย์ (0.5%)</Text>
                       <Text style={[styles.comparisonValue, styles.savingsValue]}>{formatNum(reportData.savingsTotalPayout)}</Text>
                       <Text style={styles.comparisonSubtext}>เงินหมดเมื่ออายุประมาณ {reportData.savingsDepletionAge ?? '99+'}</Text>
                   </View>
                   <View style={styles.comparisonItem}>
                       <Text style={styles.comparisonLabel}>ส่วนต่างผลประโยชน์</Text>
                       <Text style={[styles.comparisonValue, styles.differenceValue]}>{formatNum(difference)}</Text>
                   </View>
               </View>
           </View>
           <View style={styles.section}>
               <Text style={styles.sectionTitle}>กราฟแสดงแนวโน้มผลประโยชน์</Text>
               {chartImage && <Image src={chartImage} style={styles.chartImage} />}
               <View style={styles.legendContainer}>
                   {showPremium && <View style={styles.legendItem}><View style={[styles.legendColorBox, {backgroundColor: '#dc2626'}]}/><Text style={styles.legendText}>เบี้ยสะสม</Text></View>}
                   {showPayoutCumulative && <View style={styles.legendItem}><View style={[styles.legendColorBox, {backgroundColor: '#16a34a'}]}/><Text style={styles.legendText}>เงินเกษียณสะสม</Text></View>}
                   {showFundValue && <View style={styles.legendItem}><View style={[styles.legendColorBox, {backgroundColor: '#3b82f6'}]}/><Text style={styles.legendText}>มูลค่า กธ.</Text></View>}
                   {showDeathBenefit && <View style={styles.legendItem}><View style={[styles.legendColorBox, {backgroundColor: '#7c3aed'}]}/><Text style={styles.legendText}>คุ้มครองชีวิต</Text></View>}
               </View>
           </View>
           <Text style={styles.footer}>ข้อจำกัดความรับผิดชอบ: เอกสารนี้เป็นเพียงภาพประกอบ...</Text>
        </Page>
        
        {/* --- หน้าที่ 2: ตาราง (ใช้โครงสร้างใหม่) --- */}
        <Page size="A4" style={styles.page}>
            <Text style={styles.sectionTitle}>ตารางแสดงผลประโยชน์รายปี</Text>
            <View style={styles.table}>
                {/* --- Table Header --- */}
                {/* ✨ [แก้ไขแล้ว] Header จะใช้ Style ของ Row ปกติ + Style ของ Header */}
                <View style={[styles.tableRow, styles.tableHeader]} fixed>
                    <View style={[styles.tableCell, styles.tableCellHeader, styles.colAge]}><Text>อายุ</Text></View>
                    <View style={[styles.tableCell, styles.tableCellHeader, styles.colAge]}><Text>ปีที่</Text></View>
                    <View style={[styles.tableCell, styles.tableCellHeader, styles.colData, styles.bgRed]}><Text>เบี้ยรวม</Text></View>
                    {showTaxBenefit && <View style={[styles.tableCell, styles.tableCellHeader, styles.colData, styles.bgTeal]}><Text>คืนภาษี</Text></View>}
                    <View style={[styles.tableCell, styles.tableCellHeader, styles.colData, styles.bgGreen]}><Text>เงินเกษียณ</Text></View>
                    <View style={[styles.tableCell, styles.tableCellHeader, styles.colData, styles.bgBlue]}><Text>มูลค่า กธ.</Text></View>
                    <View style={[styles.tableCell, styles.tableCellHeader, styles.colData, styles.bgPurple, styles.lastCell]}><Text>คุ้มครองชีวิต</Text></View>
                </View>

                {/* --- Table Body --- */}
                {result.map((row, index) => (
                    <View 
                        style={[
                            styles.tableRow,
                            // ✨ [แก้ไขแล้ว] Logic ใหม่สำหรับแถวสุดท้าย
                            // ถ้าเป็นแถวสุดท้าย ให้เปลี่ยนเส้นขอบล่างเป็นเส้นหนาเพื่อปิดตาราง
                            index === result.length - 1 
                                ? { borderBottomWidth: 1.5, borderBottomColor: '#4b5563' } 
                                : { borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' }
                        ]} 
                        key={row.age} 
                        wrap={false}
                    >
                        <View style={[styles.tableCell, styles.colAge]}><Text style={styles.tableCellAgeText}>{row.age}</Text></View>
                        <View style={[styles.tableCell, styles.colAge]}><Text style={styles.tableCellAgeText}>{row.policyYear}</Text></View>
                        <View style={[styles.tableCell, styles.colData, styles.bgRed]}><Text style={styles.tableCellText}>{formatNum(row.totalPremium)}</Text></View>
                        {showTaxBenefit && <View style={[styles.tableCell, styles.colData, styles.bgTeal]}><Text style={styles.tableCellText}>{formatNum(row.taxBenefit)}</Text></View>}
                        <View style={[styles.tableCell, styles.colData, styles.bgGreen]}><Text style={styles.tableCellText}>{formatNum(row.totalWithdrawal)}</Text></View>
                        <View style={[styles.tableCell, styles.colData, styles.bgBlue]}><Text style={styles.tableCellText}>{formatNum(row.iWealthyFundValue + row.pensionCSV)}</Text></View>
                        <View style={[styles.tableCell, styles.colData, styles.bgPurple, styles.lastCell]}><Text style={styles.tableCellText}>{formatNum(row.iWealthyDeathBenefit + row.pensionDeathBenefit)}</Text></View>
                    </View>
                ))}
            </View>
            <Text style={styles.footer}>
                ข้อจำกัดความรับผิดชอบ: เอกสารนี้เป็นเพียงภาพประกอบ...
            </Text>
        </Page>
    </Document>
    );
};