import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { IWealthyState } from '@/stores/appStore';

// ลงทะเบียนฟอนต์
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf' },
    { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Stylesheet
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    fontSize: 11,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e3a8a',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#334155',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 3,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kpiCard: {
    width: '50%',
    padding: 8,
  },
  kpiTitle: {
    fontSize: 10,
    color: '#64748b',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e408a',
  },
});

interface ReportDocumentProps {
  metrics: IWealthyState['iWealthyMetrics'];
  result: IWealthyState['iWealthyResult'];
}

export const ReportDocument: React.FC<ReportDocumentProps> = ({ metrics, result }) => {
  // --- [ส่วนที่แก้ไข] ---
  // เพิ่มการตรวจสอบค่า null ที่ตอนต้น
  if (!metrics || !result) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>ไม่สามารถสร้างเอกสารได้เนื่องจากไม่มีข้อมูล</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>รายงานสรุปผลประโยชน์และการวิเคราะห์ทางการเงิน</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>บทสรุปสำหรับนักลงทุน</Text>
          <Text>
            แผนการลงทุนนี้คาดว่าจะสร้างอัตราผลตอบแทน (IRR) ที่ 
            {metrics.projectIRR !== null ? (metrics.projectIRR * 100).toFixed(2) : 'N/A'}% ต่อปี...
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ตัวชี้วัดทางการเงิน</Text>
          <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                  <Text style={styles.kpiTitle}>อัตราผลตอบแทน (IRR)</Text>
                  <Text style={styles.kpiValue}>{metrics.projectIRR !== null ? `${(metrics.projectIRR * 100).toFixed(2)}%` : 'N/A'}</Text>
              </View>
               <View style={styles.kpiCard}>
                  <Text style={styles.kpiTitle}>จุดคุ้มทุน</Text>
                  <Text style={styles.kpiValue}>{metrics.breakEvenYear ? `ปีที่ ${metrics.breakEvenYear}` : 'ไม่พบ'}</Text>
              </View>
              {/* เพิ่ม KPI อื่นๆ ที่นี่ */}
          </View>
        </View>
      </Page>
    </Document>
  );
};