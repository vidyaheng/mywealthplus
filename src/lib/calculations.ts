// src/lib/calculations.ts

import { COI_RATES, CoiRateEntry } from '../data/coiRates'; // ตรวจสอบ path

export const getSumInsuredFactor = (age: number): number => {
    if (age >= 0 && age <= 40) return 60;
    if (age >= 41 && age <= 50) return 50;
    if (age >= 51 && age <= 60) return 20;
    if (age >= 61 && age <= 65) return 15;
    if (age >= 66) return 5;
    return 0;
};

export const getReducedSumInsuredFactor = (age: number): number => {
    if (age >= 0 && age <= 40) return 40;
    if (age >= 41 && age <= 50) return 30;
    if (age >= 51 && age <= 60) return 20;
    if (age >= 61 && age <= 65) return 15;
    if (age >= 66) return 5;
    return 0;
};

export const calculateLifeCoverage = (sumInsured: number): number => {
    return sumInsured * 1.20;
}

export function getReductionMultipliers(age: number): { min: number; max: number } {
    if (age >= 1 && age <= 40) return { min: 40, max: 60 };
    if (age >= 41 && age <= 50) return { min: 30, max: 50 };
    if (age >= 51 && age <= 60) return { min: 20, max: 20 };
    if (age >= 61 && age <= 65) return { min: 15, max: 15 };
    if (age >= 66) return { min: 5, max: 5 };
    return { min: 0, max: 0 };
}

// --- Supporting Types & Interfaces ---
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
export type Gender = 'male' | 'female';
export type InvestmentType = 'single' | 'annual';
export type ReferenceType = 'age' | 'year';

export interface PausePeriodRecord {
    id?: string;
    startAge: number;
    endAge: number;
    type: 'age' | 'year';
}

export interface SumInsuredReductionRecord {
    id?: string;
    age: number;
    newSumInsured: number;
}

export interface AddInvestmentRecord {
    id?: string;
    type: InvestmentType;
    amount: number;
    startAge: number;
    endAge: number;
    refType?: ReferenceType;
}

export interface FrequencyChangeRecord {
    id?: string;
    startAge: number;
    endAge: number;
    frequency: PaymentFrequency;
    type?: ReferenceType;
}

export interface ReductionHistoryRecord {
    id: string;
    age: number;
    amount: number;
}

export interface WithdrawalPlanRecord {
    id: string;
    type: 'single' | 'annual';
    amount: number;
    startAge: number;
    endAge: number;
    refType: 'age' | 'year';
}

export interface CalculationInput {
    policyholderAge: number;
    policyholderGender: Gender;
    premiumPayingTermYears: number;
    initialPaymentFrequency: PaymentFrequency;
    initialSumInsured: number;
    rppPerYear: number;
    rtuPerYear?: number;
    pausePeriods: PausePeriodRecord[];
    sumInsuredReductions: SumInsuredReductionRecord[];
    additionalInvestments: AddInvestmentRecord[];
    frequencyChanges: FrequencyChangeRecord[];
    withdrawalPlan: WithdrawalPlanRecord[];
    /** อัตราผลตอบแทนที่คาดหวัง (ในรูปทศนิยม เช่น 0.05 สำหรับ 5%) */
    assumedInvestmentReturnRate: number;
}

export interface MonthlyCalculationOutputRow {
    policyYear: number;
    monthInYear: number;
    monthTotal: number;
    age: number;
    rppPaid: number;
    rtuPaid: number;
    lstuPaidGross: number;
    lstuFee: number;
    totalPremiumPaid: number; // ยอด Gross Premium ที่จ่ายในเดือนนี้
    withdrawalAmount: number;
    costOfInsurance: number;
    adminFee: number;
    premiumChargeRPP: number;
    premiumChargeRTU: number;
    totalPremiumCharge: number; // ยอดรวม Premium Charge + LSTU Fee
    bomValue: number;
    withdrawalFee: number;
    investmentBase: number;
    investmentReturnEarned: number;
    royaltyBonusAmount: number;
    eomValue: number;
    cashSurrenderValue: number;
    deathBenefit: number;
    currentSumAssured: number;
}

export interface AnnualCalculationOutputRow {
    policyYear: number;
    age: number;
    premiumRPPYear: number;
    premiumRTUYear: number;
    premiumLSTUYearGross: number;
    totalPremiumYear: number;
    royaltyBonusYear: number;
    withdrawalYear: number;
    investmentBaseYear: number; // ฐานเงินลงทุน ณ ต้นปี (หลังหักค่าใช้จ่ายเดือนแรก)
    investmentReturnYear: number; // ผลตอบแทนรวมของปี
    premiumChargeRPPYear: number;
    premiumChargeRTUYear: number;
    totalPremiumChargeYear: number; // ยอดรวม Premium Charge + LSTU Fee ของปี
    totalCOIYear: number;
    totalAdminFeeYear: number;
    totalFeesYear: number; // ยอดรวมค่าธรรมเนียมทั้งหมดของปี
    eoyAccountValue: number;
    eoyDeathBenefit: number;
    eoyCashSurrenderValue: number;
}

const POLICY_TERM_TARGET_AGE = 99;
const ADMIN_FEE_RATE_ANNUAL = 0.006;
const RPP_CHARGE_RATES = [0.45, 0.30, 0.15, 0.10];
const RTU_CHARGE_RATES = [0.03, 0.02, 0.01, 0.01];
const SURRENDER_CHARGE_RATES = [0.50, 0.30, 0.20, 0.05];
const WITHDRAWAL_FEE_RATES = [0.50, 0.30, 0.20, 0.05];
const ROYALTY_BONUS_RATE = 0.006;
const ROYALTY_BONUS_ELIGIBILITY_YEARS = 6;
const MIN_PAID_MONTHS_FOR_PAUSE = 24;

function getCOIRate(age: number, gender: Gender): number | null {
    const effectiveAge = Math.max(COI_RATES[0].age, Math.min(age, COI_RATES[COI_RATES.length - 1].age));
    const rateEntry: CoiRateEntry | undefined = COI_RATES.find(entry => entry.age === effectiveAge);
    if (!rateEntry) {
        console.error(`[getCOIRate] COI rate not found for effective age: ${effectiveAge}`);
        return null;
    }
    return gender === 'male' ? rateEntry.maleRate : rateEntry.femaleRate;
}

function getPaymentsPerYear(frequency: PaymentFrequency): number {
    switch (frequency) {
        case 'monthly': return 12;
        case 'quarterly': return 4;
        case 'semi-annual': return 2;
        case 'annual': return 1;
        default: return 1;
    }
}

function isPaymentMonth(monthInYear: number, frequency: PaymentFrequency): boolean {
    switch (frequency) {
        case 'monthly': return true;
        case 'quarterly': return [1, 4, 7, 10].includes(monthInYear);
        case 'semi-annual': return [1, 7].includes(monthInYear);
        case 'annual': return monthInYear === 1;
        default: return false;
    }
}

export function calculateBenefitIllustrationMonthly(
    input: CalculationInput
): MonthlyCalculationOutputRow[] {

    const monthlyResults: MonthlyCalculationOutputRow[] = [];

    // ***** แก้ไขตรงนี้ *****
    // input.assumedInvestmentReturnRate ควรจะเป็นทศนิยมแล้ว (เช่น 0.05)
    // จึงไม่ต้องหารด้วย 100 อีกครั้ง
    const monthlyInvestmentRate = input.assumedInvestmentReturnRate / 12;
    // ***** จบการแก้ไข *****

    const monthlyAdminFeeRate = ADMIN_FEE_RATE_ANNUAL / 12;

    const policyDurationMonths = (POLICY_TERM_TARGET_AGE - input.policyholderAge + 1) * 12;
    const defaultPPT = input.premiumPayingTermYears > 0
        ? input.premiumPayingTermYears
        : (98 - input.policyholderAge + 1);
    const premiumPayingTermYears = defaultPPT;

    let currentAccountValue = 0;
    let currentSumAssured = input.initialSumInsured;
    // let currentPaymentFrequency = input.initialPaymentFrequency; // ไม่ได้ใช้ตัวแปรนี้โดยตรงแล้ว คำนวณ effective ทุกเดือน
    let accumulatedPremiumsPaid = 0;
    let paidMonthsCount = 0;
    let wasWithdrawalInFirst6Years = false;
    const eomValuesLast12Months: number[] = [];

    const sortedFrequencyChanges = [...input.frequencyChanges].sort((a, b) => a.startAge - b.startAge);
    const sortedPausePeriods = [...input.pausePeriods].sort((a, b) => a.startAge - b.startAge);
    const sortedSumInsuredReductions = [...input.sumInsuredReductions].sort((a, b) => a.age - b.age);
    const sortedWithdrawalPlan = [...input.withdrawalPlan].sort((a, b) => a.startAge - b.startAge);
    const sortedAdditionalInvestments = [...input.additionalInvestments].sort((a, b) => a.startAge - b.startAge);

    for (let m = 1; m <= policyDurationMonths; m++) {
        const policyYear = Math.ceil(m / 12);
        const monthInYear = ((m - 1) % 12) + 1;
        const currentAge = input.policyholderAge + policyYear - 1;

        const bomValue = currentAccountValue;

        const reduction = sortedSumInsuredReductions.find(r => r.age === currentAge);
        if (reduction && monthInYear === 1) {
            currentSumAssured = reduction.newSumInsured;
        }

        let effectivePaymentFrequency = input.initialPaymentFrequency;
        const activeFrequencyChange = sortedFrequencyChanges.filter(fc => currentAge >= fc.startAge && currentAge <= fc.endAge).pop();
        if (activeFrequencyChange) {
            effectivePaymentFrequency = activeFrequencyChange.frequency;
        } else {
            const lastChange = sortedFrequencyChanges.filter(fc => currentAge > fc.endAge).pop();
            if (lastChange) {
                effectivePaymentFrequency = lastChange.frequency;
            }
        }

        let isPausedThisMonth = false;
        const canPause = m >= (MIN_PAID_MONTHS_FOR_PAUSE + 1); // ต้องจ่ายครบ MIN_PAID_MONTHS ก่อนถึงจะเริ่ม Pause ได้ในเดือนถัดไป
        if (canPause) {
            const matchingPausePeriod = sortedPausePeriods.find(p => currentAge >= p.startAge && currentAge <= p.endAge);
            isPausedThisMonth = !!matchingPausePeriod;
        }

        const isPayingTerm = policyYear <= premiumPayingTermYears;

        let rpp_month = 0;
        let rtu_month = 0;
        let lstu_gross_month = 0;
        let lstuFee_month = 0;
        let premiumCharge_rpp_month = 0;
        let premiumCharge_rtu_month = 0;
        let totalPremiumCharge_month = 0;
        let coi_month = 0;
        let adminFee_month = 0;
        let withdrawal_month = 0;
        let withdrawalFee_month = 0;

        if (isPayingTerm && !isPausedThisMonth && isPaymentMonth(monthInYear, effectivePaymentFrequency)) {
            const paymentsPerYear = getPaymentsPerYear(effectivePaymentFrequency);
            rpp_month = (input.rppPerYear || 0) / paymentsPerYear;
            rtu_month = (input.rtuPerYear || 0) / paymentsPerYear;
            paidMonthsCount++;
        }

        if (monthInYear === 1) { // LSTU จ่ายต้นปี
            sortedAdditionalInvestments.forEach(inv => {
                if ((inv.type === 'single' && inv.startAge === currentAge) ||
                    (inv.type === 'annual' && currentAge >= inv.startAge && currentAge <= inv.endAge)) {
                    const currentLstuGross = inv.amount;
                    const currentLstuFee = currentLstuGross * 0.0125; // 1.25% LSTU Fee
                    lstu_gross_month += currentLstuGross;
                    lstuFee_month += currentLstuFee;
                }
            });
        }
        const totalPremium_gross_month = rpp_month + rtu_month + lstu_gross_month;
        accumulatedPremiumsPaid += totalPremium_gross_month;

        if (policyYear <= 4 && (rpp_month > 0 || rtu_month > 0)) {
            const chargeYearIndex = Math.min(policyYear - 1, RPP_CHARGE_RATES.length - 1);
            const chargeRateRPP = RPP_CHARGE_RATES[chargeYearIndex] || 0;
            const chargeRateRTU = RTU_CHARGE_RATES[chargeYearIndex] || 0;
            premiumCharge_rpp_month = rpp_month * chargeRateRPP;
            premiumCharge_rtu_month = rtu_month * chargeRateRTU;
        }
        // Total Premium Charge = RPP Charge + RTU Charge + LSTU Fee
        totalPremiumCharge_month = premiumCharge_rpp_month + premiumCharge_rtu_month + lstuFee_month;


        const coiRateAnnual = getCOIRate(currentAge, input.policyholderGender);
        if (coiRateAnnual !== null) {
            let sarBase: number;
            let deathBenefitForCOI: number;
            // สำหรับเดือนแรกของกรมธรรม์ SAR Base คือ 0
            if (policyYear === 1 && monthInYear === 1) {
                sarBase = 0;
                deathBenefitForCOI = currentSumAssured * 1.2;
            } else {
                sarBase = bomValue; // ใช้มูลค่าต้นเดือน
                deathBenefitForCOI = Math.max(bomValue * 1.2, currentSumAssured * 1.2);
            }
            const sar = Math.max(0, deathBenefitForCOI - sarBase);
            coi_month = (sar / 1000) * coiRateAnnual / 12;
            coi_month = Math.max(0, coi_month);
        }

        // Admin Fee
        // เดือนแรก คิดจาก (เบี้ยรวม Gross - Premium Charge รวม)
        // เดือนถัดไป คิดจาก bomValue
        if (policyYear === 1 && monthInYear === 1) {
            adminFee_month = (totalPremium_gross_month - totalPremiumCharge_month) * monthlyAdminFeeRate;
        } else {
            adminFee_month = bomValue * monthlyAdminFeeRate;
        }
        adminFee_month = Math.max(0, adminFee_month);

        // Withdrawal (สมมติว่าการถอนเกิดขึ้น ณ ต้นปี/เดือนแรกของปี)
        if (monthInYear === 1) {
            sortedWithdrawalPlan.forEach(wd => {
                if ((wd.type === 'single' && wd.startAge === currentAge) ||
                    (wd.type === 'annual' && currentAge >= wd.startAge && currentAge <= wd.endAge)) {
                    withdrawal_month += wd.amount;
                    const feeYearIndex = Math.min(policyYear - 1, WITHDRAWAL_FEE_RATES.length - 1);
                    const withdrawalFeeRate = (policyYear <= WITHDRAWAL_FEE_RATES.length) ? WITHDRAWAL_FEE_RATES[feeYearIndex] : 0;
                    withdrawalFee_month += wd.amount * withdrawalFeeRate;
                    if (policyYear <= ROYALTY_BONUS_ELIGIBILITY_YEARS) {
                        wasWithdrawalInFirst6Years = true;
                    }
                }
            });
        }

        let investmentBase: number;
        if (policyYear === 1 && monthInYear === 1) {
            investmentBase = totalPremium_gross_month // เบี้ยเข้า
                           - totalPremiumCharge_month // หัก Charge + LSTU Fee
                           - coi_month              // หัก COI
                           - adminFee_month           // หัก Admin Fee
                           - withdrawal_month;        // หักยอดถอน (ถ้ามี)
        } else {
            investmentBase = bomValue                 // เงินต้นเดือน
                           + totalPremium_gross_month // บวกเบี้ยเข้า (ถ้ามี)
                           - totalPremiumCharge_month // หัก Charge + LSTU Fee
                           - coi_month              // หัก COI
                           - adminFee_month           // หัก Admin Fee
                           - withdrawal_month;        // หักยอดถอน (ถ้ามี)
        }
        investmentBase = Math.max(0, investmentBase); // ป้องกันติดลบ

        const investmentReturn_month = investmentBase * monthlyInvestmentRate; // ไม่ต้อง Math.max(0, investmentBase) ตรงนี้ เพราะ investmentBase ถูกจัดการแล้ว

        let royaltyBonus_month = 0;
        if (monthInYear === 12) { // Bonus จ่ายสิ้นปี
            const paidFirst6Years = paidMonthsCount >= (ROYALTY_BONUS_ELIGIBILITY_YEARS * 12);
            const eligibleFirst6Years = paidFirst6Years && !wasWithdrawalInFirst6Years;

            // ตรวจสอบการหยุดพักชำระ "ในปีปัจจุบัน"
            const isPausedThisPolicyYear = sortedPausePeriods.some(p => p.startAge === currentAge || (p.startAge < currentAge && p.endAge >= currentAge) );
            // ตรวจสอบการถอน "ในปีปัจจุบัน"
            const hadWithdrawalThisPolicyYear = sortedWithdrawalPlan.some(wd => wd.startAge === currentAge || (wd.type === 'annual' && currentAge >= wd.startAge && currentAge <= wd.endAge));

            const wasPremiumPayingYear = isPayingTerm; // เช็คว่าเป็นปีที่อยู่ในช่วงชำระเบี้ยหรือไม่

            if (eligibleFirst6Years && wasPremiumPayingYear && !isPausedThisPolicyYear && !hadWithdrawalThisPolicyYear) {
                if (eomValuesLast12Months.length === 12) {
                    const averageEOM = eomValuesLast12Months.reduce((a, b) => a + b, 0) / 12;
                    royaltyBonus_month = averageEOM * ROYALTY_BONUS_RATE;
                }
            }
        }

        const eomValue = investmentBase
            + investmentReturn_month
            + royaltyBonus_month
            - withdrawalFee_month; // หักค่าธรรมเนียมถอน

        currentAccountValue = Math.max(0, eomValue);

        const deathBenefitBasedOnSumInsured = currentSumAssured * 1.2;
        const deathBenefitBasedOnAccountValue = currentAccountValue * 1.2; // ใช้ currentAccountValue (EOM)
        const eomDeathBenefit = Math.max(deathBenefitBasedOnSumInsured, deathBenefitBasedOnAccountValue, currentSumAssured); // เพิ่ม currentSumAssured เข้าไปในการหา Max ด้วย

        let surrenderChargeRate = 0;
        if (policyYear >= 1 && policyYear <= SURRENDER_CHARGE_RATES.length) {
            const surrenderYearIndex = policyYear - 1;
            surrenderChargeRate = SURRENDER_CHARGE_RATES[surrenderYearIndex];
        }
        const eomCSV = currentAccountValue * (1 - surrenderChargeRate);

        const monthlyRow: MonthlyCalculationOutputRow = {
            policyYear: policyYear,
            monthInYear: monthInYear,
            monthTotal: m,
            age: currentAge,
            rppPaid: rpp_month,
            rtuPaid: rtu_month,
            lstuPaidGross: lstu_gross_month,
            lstuFee: lstuFee_month,
            totalPremiumPaid: totalPremium_gross_month,
            withdrawalAmount: withdrawal_month,
            bomValue: bomValue,
            premiumChargeRPP: premiumCharge_rpp_month,
            premiumChargeRTU: premiumCharge_rtu_month,
            totalPremiumCharge: totalPremiumCharge_month,
            costOfInsurance: coi_month,
            adminFee: adminFee_month,
            withdrawalFee: withdrawalFee_month,
            investmentBase: investmentBase,
            investmentReturnEarned: investmentReturn_month,
            royaltyBonusAmount: royaltyBonus_month,
            eomValue: currentAccountValue,
            cashSurrenderValue: eomCSV,
            deathBenefit: eomDeathBenefit,
            currentSumAssured: currentSumAssured,
        };
        monthlyResults.push(monthlyRow);

        eomValuesLast12Months.push(currentAccountValue);
        if (eomValuesLast12Months.length > 12) {
            eomValuesLast12Months.shift();
        }
    }
    console.log("[Calculation] Finished Monthly Loop. Total Rows:", monthlyResults.length);
    return monthlyResults;
}

export function aggregateToAnnual(
    monthlyData: MonthlyCalculationOutputRow[]
): AnnualCalculationOutputRow[] {
    if (!monthlyData || monthlyData.length === 0) {
        return [];
    }
    const annualResultsMap = new Map<number, Partial<AnnualCalculationOutputRow>>();

    for (const monthRow of monthlyData) {
        let yearData = annualResultsMap.get(monthRow.policyYear);
        if (!yearData) {
            yearData = {
                policyYear: monthRow.policyYear,
                age: monthRow.age, // อายุ ณ ต้นปี
                premiumRPPYear: 0,
                premiumRTUYear: 0,
                premiumLSTUYearGross: 0,
                totalPremiumYear: 0,
                premiumChargeRPPYear: 0,
                premiumChargeRTUYear: 0,
                totalPremiumChargeYear: 0,
                totalCOIYear: 0,
                totalAdminFeeYear: 0,
                investmentBaseYear: 0, // จะถูก set จากเดือนแรกของปี
                royaltyBonusYear: 0,
                withdrawalYear: 0,
                investmentReturnYear: 0,
                totalFeesYear: 0,
                eoyAccountValue: monthRow.eomValue, // Default to last month's EOM
                eoyDeathBenefit: monthRow.deathBenefit, // Default to last month's DB
                eoyCashSurrenderValue: monthRow.cashSurrenderValue, // Default to last month's CSV
            };
            annualResultsMap.set(monthRow.policyYear, yearData);

            // กำหนด investmentBaseYear จาก investmentBase ของเดือนแรกของปีนั้นๆ
            if (monthRow.monthInYear === 1) {
                yearData.investmentBaseYear = monthRow.investmentBase;
            }
        }

        yearData.premiumRPPYear! += monthRow.rppPaid;
        yearData.premiumRTUYear! += monthRow.rtuPaid;
        yearData.premiumLSTUYearGross! += monthRow.lstuPaidGross;
        yearData.totalPremiumYear! += monthRow.totalPremiumPaid;
        yearData.premiumChargeRPPYear! += monthRow.premiumChargeRPP;
        yearData.premiumChargeRTUYear! += monthRow.premiumChargeRTU;
        yearData.totalPremiumChargeYear! += monthRow.totalPremiumCharge;
        yearData.totalCOIYear! += monthRow.costOfInsurance;
        yearData.totalAdminFeeYear! += monthRow.adminFee;
        yearData.royaltyBonusYear! += monthRow.royaltyBonusAmount;
        yearData.withdrawalYear! += monthRow.withdrawalAmount;
        yearData.investmentReturnYear! += monthRow.investmentReturnEarned;

        // อัปเดตค่าสิ้นปีด้วยค่าของเดือนสุดท้ายของปี
        if (monthRow.monthInYear === 12 || monthlyData.filter(m => m.policyYear === monthRow.policyYear).length === monthRow.monthInYear) {
             yearData.eoyAccountValue = monthRow.eomValue;
             yearData.eoyDeathBenefit = monthRow.deathBenefit;
             yearData.eoyCashSurrenderValue = monthRow.cashSurrenderValue;
        }
         // ถ้า investmentBaseYear ยังเป็น 0 (กรณีปีนั้นไม่มีเดือน 1 หรือข้อมูลไม่ครบ) ให้ใช้ของเดือนปัจจุบัน
        if (yearData.investmentBaseYear === 0) {
            yearData.investmentBaseYear = monthRow.investmentBase;
        }
    }

    const annualResults: AnnualCalculationOutputRow[] = [];
    for (const yearData of annualResultsMap.values()) {
        const monthlyForYear = monthlyData.filter(m => m.policyYear === yearData.policyYear);
        const withdrawalFeeYear = monthlyForYear.reduce((sum, m) => sum + m.withdrawalFee, 0);
        // LSTU Fee ถูกรวมใน totalPremiumChargeYear แล้ว
        // const lstuFeeYear = monthlyForYear.reduce((sum, m) => sum + m.lstuFee, 0);

        yearData.totalFeesYear = (yearData.totalPremiumChargeYear ?? 0) + // Includes LSTU Fee
                                 (yearData.totalCOIYear ?? 0) +
                                 (yearData.totalAdminFeeYear ?? 0) +
                                 withdrawalFeeYear;

        annualResults.push(yearData as AnnualCalculationOutputRow);
    }
    annualResults.sort((a, b) => a.policyYear - b.policyYear);
    return annualResults;
}

export function generateIllustrationTables(input: CalculationInput): { monthly: MonthlyCalculationOutputRow[], annual: AnnualCalculationOutputRow[] } {
    console.log("[calculations.ts] Input to generateIllustrationTables:", JSON.parse(JSON.stringify(input)));
    const monthly = calculateBenefitIllustrationMonthly(input);
    const annual = aggregateToAnnual(monthly);
    console.log("[generateIllustrationTables] Generated Annual Data Preview (First 5):", annual.slice(0, 5));
    return { monthly, annual };
}

