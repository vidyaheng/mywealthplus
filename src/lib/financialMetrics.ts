import type { CalculationResult, Gender } from './calculations';
import { calculatePlb15TermPremium } from '../data/plb15Rates';

// ===================================================================
// SECTION 1: CORE CALCULATION ENGINES (IRR & MIRR)
// ===================================================================

function calculateIRRInternal(values: number[]): number | null {
  const guesses = [0.1, 0.0, 0.2, -0.1, 0.05]; 
  const maxIteration = 100;
  const precision = 1.0e-12;
  for (const guess of guesses) {
    let x0 = guess;
    for (let i = 0; i < maxIteration; i++) {
      let fValue = 0;
      let fDerivative = 0;
      for (let k = 0; k < values.length; k++) {
        const divisor = Math.pow(1.0 + x0, k);
        if (divisor === 0) continue; 
        fValue += values[k] / divisor;
        const derivativeDivisor = Math.pow(1.0 + x0, k + 1);
        if (derivativeDivisor === 0) continue;
        fDerivative += -k * values[k] / derivativeDivisor;
      }
      if (Math.abs(fDerivative) < 1e-10) break;
      const x1 = x0 - fValue / fDerivative;
      if (Math.abs(x1 - x0) <= precision) {
        return x1;
      }
      x0 = x1;
    }
  }
  return null;
}

function calculateMIRRInternal(
  cashFlows: number[], 
  financingRate: number, 
  reinvestmentRate: number
): number | null {
  const n = cashFlows.length;
  if (n < 2) return null;
  let pvOutflows = 0;
  let fvInflows = 0;
  cashFlows.forEach((cf, i) => {
    if (cf < 0) {
      pvOutflows += cf / Math.pow(1 + financingRate, i);
    } else {
      fvInflows += cf * Math.pow(1 + reinvestmentRate, n - 1 - i);
    }
  });
  pvOutflows = Math.abs(pvOutflows);
  if (pvOutflows === 0 || fvInflows === 0) return null;
  const monthlyMIRR = Math.pow(fvInflows / pvOutflows, 1 / (n - 1)) - 1;
  if (!isFinite(monthlyMIRR)) return null;
  return Math.pow(1 + monthlyMIRR, 12) - 1;
}

// ===================================================================
// SECTION 2: PRIMARY METRICS (สำหรับโครงการ iWealthy ทั้งหมด)
// ===================================================================

export function calculateProjectIRR(result: CalculationResult): number | null {
  const activeMonths = result.monthly.slice(0, result.lastProcessedMonth);
  if (activeMonths.length < 1) return null;
  const cashFlows = activeMonths.map(month => month.withdrawalAmount - month.totalPremiumPaid);
  const lastActiveMonth = activeMonths[activeMonths.length - 1];
  if (lastActiveMonth) {
    cashFlows[cashFlows.length - 1] += lastActiveMonth.cashSurrenderValue;
  }
  const monthlyIRR = calculateIRRInternal(cashFlows);
  if (monthlyIRR === null) return null;
  return Math.pow(1 + monthlyIRR, 12) - 1;
}

export function calculateProjectROI(result: CalculationResult): number | null {
    const totalPremiums = calculateTotalPremiums(result);
    if (totalPremiums === 0) return null;

    const totalWithdrawals = result.annual.reduce((sum, row) => sum + row.withdrawalYear, 0);
    const finalValue = getFinalFundValue(result);
    
    const totalReturn = totalWithdrawals + finalValue;
    const netProfit = totalReturn - totalPremiums;

    return (netProfit / totalPremiums) * 100;
}

export function calculateProjectPI(result: CalculationResult, discountRate: number): number | null {
    let pvOutflows = 0;
    let pvInflows = 0;
    const activeYears = result.annual.filter(y => y.policyYear <= Math.ceil(result.lastProcessedMonth / 12));

    activeYears.forEach((yearRow, index) => {
        const t = index + 1;
        pvOutflows += yearRow.totalPremiumYear / Math.pow(1 + discountRate, t);
        pvInflows += yearRow.withdrawalYear / Math.pow(1 + discountRate, t);
    });

    const finalValue = getFinalFundValue(result);
    pvInflows += finalValue / Math.pow(1 + discountRate, activeYears.length);

    if (pvOutflows === 0) return null;

    return pvInflows / pvOutflows;
}
// ===================================================================
// SECTION 3: INVESTMENT-ONLY ANALYSIS (วิเคราะห์ BTID)
// ===================================================================

export function calculateInvestmentOnlyMIRR(
  result: CalculationResult, 
  gender: Gender,
  investmentReturnRate: number
): number | null {
  const endYear = Math.ceil(result.lastProcessedMonth / 12);
  return calculateMIRRForYear(endYear, result, gender, investmentReturnRate);
}

export function calculateMIRRForYear(
  surrenderYear: number,
  result: CalculationResult,
  gender: Gender,
  investmentReturnRate: number
): number | null {
  const annualCashFlows: number[] = [];
  const activeYears = result.annual.filter(y => y.policyYear <= surrenderYear);

  for (let i = 0; i < activeYears.length; i++) {
      const yearRow = activeYears[i];
      const netAmountAtRisk = Math.max(0, yearRow.eoyDeathBenefit - yearRow.eoyAccountValue);
      const termPremiumForYear = calculatePlb15TermPremium(yearRow.age, gender, netAmountAtRisk);
      
      // กระแสเงินสดสุทธิ = (-เบี้ย iWealthy) + (+เบี้ย Term) + (เงินถอน)
      const netCashFlow = -yearRow.totalPremiumYear + termPremiumForYear + (yearRow.withdrawalYear ?? 0);

      if (i === activeYears.length - 1) {
          const finalSurrenderValue = yearRow.eoyCashSurrenderValue ?? 0;
          annualCashFlows.push(netCashFlow + finalSurrenderValue);
      } else {
          annualCashFlows.push(netCashFlow);
      }
  }

  if (annualCashFlows.length < 2) return null;
  
  const monthlyCashFlows: number[] = [];
  annualCashFlows.forEach((annualFlow) => {
    monthlyCashFlows.push(annualFlow);
    for (let i = 0; i < 11; i++) { monthlyCashFlows.push(0); }
  });

  const monthlyRate = Math.pow(1 + investmentReturnRate, 1 / 12) - 1;
  return calculateMIRRInternal(monthlyCashFlows, monthlyRate, monthlyRate);
}

export function calculateInvestmentOnlyROI(result: CalculationResult, gender: Gender): number | null {
    const totalPremiums = calculateTotalPremiums(result);
    if (totalPremiums === 0) return null;

    let totalTermPremiums = 0;
    const activeYears = result.annual.filter(y => y.policyYear <= Math.ceil(result.lastProcessedMonth / 12));
    activeYears.forEach(yearRow => {
        const netAmountAtRisk = Math.max(0, yearRow.eoyDeathBenefit - yearRow.eoyAccountValue);
        totalTermPremiums += calculatePlb15TermPremium(yearRow.age, gender, netAmountAtRisk);
    });

    const totalWithdrawals = result.annual.reduce((sum, row) => sum + row.withdrawalYear, 0);
    const finalValue = getFinalFundValue(result);
    
    // ผลตอบแทนรวม = เงินถอน + เงินก้อนสุดท้าย + เบี้ย Term ทั้งหมด
    const totalReturn = totalWithdrawals + finalValue + totalTermPremiums;
    const netProfit = totalReturn - totalPremiums;

    return (netProfit / totalPremiums) * 100;
}

export function calculateInvestmentOnlyPI(result: CalculationResult, gender: Gender, discountRate: number): number | null {
    let pvOutflows = 0;
    let pvInflows = 0;
    const activeYears = result.annual.filter(y => y.policyYear <= Math.ceil(result.lastProcessedMonth / 12));

    activeYears.forEach((yearRow, index) => {
        const t = index + 1;
        // เงินสดออก คือ เบี้ย iWealthy ทั้งหมด
        pvOutflows += yearRow.totalPremiumYear / Math.pow(1 + discountRate, t);

        // เงินสดเข้า คือ เงินถอน + เบี้ย Term
        const netAmountAtRisk = Math.max(0, yearRow.eoyDeathBenefit - yearRow.eoyAccountValue);
        const termPremiumForYear = calculatePlb15TermPremium(yearRow.age, gender, netAmountAtRisk);
        pvInflows += (yearRow.withdrawalYear + termPremiumForYear) / Math.pow(1 + discountRate, t);
    });

    // เพิ่มเงินก้อนสุดท้าย (มูลค่าเวนคืน) เข้าไปในฝั่งเงินสดเข้า
    const finalValue = getFinalFundValue(result);
    pvInflows += finalValue / Math.pow(1 + discountRate, activeYears.length);

    if (pvOutflows === 0) return null;

    return pvInflows / pvOutflows;
}

// ===================================================================
// SECTION 4: HELPER FUNCTIONS
// ===================================================================

export function findBreakEvenPoint(result: CalculationResult): { year: number; age: number } | null {
    let cumulativePremium = 0;
    for (const yearRow of result.annual) {
        if (yearRow.eoyAccountValue <=0 && cumulativePremium > 0) break;
        cumulativePremium += yearRow.totalPremiumYear;
        if (yearRow.eoyCashSurrenderValue >= cumulativePremium && cumulativePremium > 0) {
            return { year: yearRow.policyYear, age: yearRow.age };
        }
    }
    return null;
}

export function calculateTotalPremiums(result: CalculationResult): number {
    const activeYears = result.annual.filter(y => y.policyYear <= Math.ceil(result.lastProcessedMonth / 12));
    return activeYears.reduce((sum, row) => sum + row.totalPremiumYear, 0);
}

export function getFinalFundValue(result: CalculationResult): number {
    if (result.monthly.length === 0 || result.lastProcessedMonth === 0) return 0;
    const lastMonthData = result.monthly[result.lastProcessedMonth - 1];
    return lastMonthData ? lastMonthData.eomValue : 0;
}

/**
 * คำนวณมูลค่าบัญชีสิ้นปีสุดท้ายที่แสดงผลในตาราง (Real Value, หลังหัก lapse)
 * ใช้เพื่อให้ค่าที่แสดงผลสรุปตรงกับค่าในตาราง Annual
 * @param result CalculationResult ทั้งหมด
 * @returns มูลค่าบัญชีสิ้นปีของปีสุดท้ายที่ปรากฏในตาราง หรือ 0 ถ้าไม่มีข้อมูล
 */
export function getFinalDisplayedAnnualAccountValue(result: CalculationResult): number {
    if (!result?.annual || result.annual.length === 0) {
        return 0;
    }

    const originalAnnualData = result.annual;

    // ใช้ logic การกรองเดียวกับที่ใช้ใน IWealthyTablePage/ChartPage
    // 1. หา index ของแถว "แรก" ที่มูลค่ากรมธรรม์ (eoyAccountValue) เป็น 0 หรือน้อยกว่า
    const firstZeroIndex = originalAnnualData.findIndex(row => (row.eoyAccountValue ?? 0) <= 0.005);

    // 2. ถ้าไม่เจอแถวที่เป็น 0 เลย ให้ใช้ข้อมูลทั้งหมด
    const filteredDataForDisplay = firstZeroIndex === -1
        ? originalAnnualData
        : originalAnnualData.slice(0, firstZeroIndex + 1); // รวมแถวที่เป็น 0 ด้วย

    // ดึง eoyAccountValue ของแถวสุดท้ายในข้อมูลที่กรองแล้ว
    if (filteredDataForDisplay.length > 0) {
        return filteredDataForDisplay[filteredDataForDisplay.length - 1].eoyAccountValue ?? 0;
    }

    return 0;
}

// ใน src/lib/financialMetrics.ts

export function getInitialDeathBenefit(result: CalculationResult): number {
    if (!result?.annual?.[0]) return 0;
    return result.annual[0].eoyDeathBenefit ?? 0;
}

export function getMaxDeathBenefit(result: CalculationResult): { amount: number; age: number } {
    if (!result?.annual || result.annual.length === 0) {
        return { amount: 0, age: 0 };
    }
    return result.annual.reduce((max, row) => {
        if ((row.eoyDeathBenefit ?? 0) > max.amount) {
            return { amount: row.eoyDeathBenefit ?? 0, age: row.age };
        }
        return max;
    }, { amount: 0, age: 0 });
}