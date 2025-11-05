import type { Gender, WithdrawalPlanRecord } from '@/lib/calculations';
import type { PensionPlanType } from '@/data/pensionRates';

/**
 * โครงสร้างข้อมูลสำหรับเก็บข้อมูลภาษีที่ผู้ใช้กรอก
 */
export type TaxInfo = {
    taxRate: number;
    usedFirst100k: number;
    usedPensionDeduction: number;
    endAge: number;
};

/**
 * โครงสร้างข้อมูล Input ทั้งหมดที่ส่งจาก UI ไปยังเครื่องคำนวณ
 */
export interface RetirementPlanParams {
  planningAge: number;
  gender: Gender;
  desiredRetirementAge: number;
  planningMode: 'goalBased' | 'premiumBased';
  // Goal-Based
  desiredAnnualPension: number;
  assumedInflationRate: number;
  // Premium-Based
  manualIWealthyPremium: number;
  manualPensionPremium: number;
  // Shared Config
  fundingMix: 'iWealthyOnly' | 'pensionOnly' | 'hybrid';
  hybridPensionRatio: number; // 0-100
  investmentReturn: number;
  iWealthyPPT: number;
  pensionOptions: { planType: PensionPlanType };
  hybridMode: 'automatic' | 'manual';
  iWealthyWithdrawalPlan: WithdrawalPlanRecord[]; // ✨ เพิ่ม property ที่ขาดหายไป
  iWealthyWithdrawalMode: 'automatic' | 'manual';
  pensionStartAge: number; 
  pensionEndAge: number;
}

/**
 * โครงสร้างข้อมูล Output รายปีสำหรับแสดงผลในตารางและกราฟ
 */
export interface AnnualRetirementOutputRow {
  policyYear: number;
  age: number;
  // Premiums
  iWealthyPremium: number;
  pensionPremium: number;
  totalPremium: number;
  cumulativePremium: number;
  // Withdrawals / Payouts
  pensionPayout: number;
  iWealthyWithdrawal: number;
  totalWithdrawal: number;
  cumulativeWithdrawal: number;
  targetAnnualPension?: number;
  // Fund Values
  iWealthyFundValue: number;
  pensionCSV: number;
  // Death Benefits
  iWealthyDeathBenefit: number;
  pensionDeathBenefit: number;
  // เพิ่มฟิลด์สำหรับผลประโยชน์ทางภาษี
  taxBenefit?: number;
  // เพิ่มฟิลด์สำหรับค่าใช้จ่าย iWealthy
  iWealthyCOI?: number;
  iWealthyAdminFee?: number;
  iWealthyPremiumCharge?: number;
}