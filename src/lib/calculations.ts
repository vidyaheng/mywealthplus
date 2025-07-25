// src/lib/calculations.ts

import { COI_RATES, CoiRateEntry } from '../data/coiRates'; // ตรวจสอบ path
//import { // ค่าคงที่ import โดยไม่มี 'type'
 //   MINIMUM_ALLOWABLE_SYSTEM_RPP_TYPE as MINIMUM_RPP,
 //   MAX_POLICY_AGE_TYPE, // <--- ตรวจสอบการ import นี้
   // MEB_TERMINATION_AGE_TYPE as MEB_TERMINATION_AGE,
   // DEFAULT_RPP_RTU_RATIO_TYPE // ถ้ามีการใช้
//} from '@/hooks/useLthcTypes';

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
    premiumPayingTermYears?: number;
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
    // --- Fields ใหม่ที่ต้องเพิ่มเข้าไป ---
    /**
     * สถานะของกรมธรรม์ในเดือนนั้นๆ
     * 'Active': กรมธรรม์ยังดำเนินต่อไปตามปกติ
     * 'Lapsed_Charges': Lapsed เนื่องจากไม่สามารถหักค่าธรรมเนียมเบี้ยประกันได้
     * 'Lapsed_COI_Admin': Lapsed เนื่องจากไม่สามารถหัก COI หรือ Admin Fee ได้
     * 'Lapsed_Withdrawal': Lapsed (หรือเงินไม่พอ) เนื่องจากไม่สามารถถอนเงินได้ตามแผน
     */
    //policyStatusThisMonth: 'Active' | 'Lapsed_Charges' | 'Lapsed_COI_Admin' | 'Lapsed_Withdrawal';

    /**
     * (Optional) มูลค่าสิ้นเดือนที่คำนวณได้จริงๆ ก่อนที่จะมีการตัดสินใจว่า Lapsed หรือปัดเป็น 0
     * มีประโยชน์สำหรับการ debug หรือการวิเคราะห์ขั้นสูง
     */
    calculatedEomValueBeforeLapse?: number;
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
    eoySumInsured?: number; // ทุนประกัน ณ สิ้นปีกรมธรรม์ (ทำให้เป็น optional ถ้าบางกรณีอาจจะไม่มี)
    //eoyInflationAdjustedValue: number; 
}

export interface MonthlyCalculationInternalResult {
    monthlyRows: MonthlyCalculationOutputRow[];
    finalPolicyStatus: 'Active' | 'Lapsed_Charges' | 'Lapsed_COI_Admin' | 'Lapsed_Withdrawal' | 'Lapsed_Final' | 'Completed';
    lastProcessedMonth: number; // เดือนสุดท้ายที่ยังคำนวณได้ (อาจจะยังไม่ Lapsed แต่จบ policyDurationMonths)
    lastSolventAge: number; // อายุสุดท้ายที่สถานะยังเป็น Active หรือ Completed
}

// Interface สำหรับผลลัพธ์สุดท้ายของ generateIllustrationTables (ถ้ายังไม่มีหรือต้องการปรับปรุง)
export interface CalculationResult {
   monthly: MonthlyCalculationOutputRow[];
    annual: AnnualCalculationOutputRow[];
    finalPolicyStatus: MonthlyCalculationInternalResult['finalPolicyStatus'];
    lastSolventAge: number; // เปลี่ยนเป็น required
}

const POLICY_TERM_TARGET_AGE = 99;
const LAST_PAYMENT_AGE = 98;
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

//สันนิษฐานว่ามีการ import หรือประกาศ Types และ Constants เหล่านี้ไว้แล้วในไฟล์ calculations.ts หรือไฟล์ที่คุณ import มา:
// export interface CalculationInput { /* ... */ }
// export interface MonthlyCalculationOutputRow { /*... (ตามที่อัปเดตล่าสุด) ...*/ }
// export interface AnnualCalculationOutputRow { /*... (ตามที่อัปเดตล่าสุด) ...*/ }
// export interface SumInsuredReductionRecord { /* ... */ }
// export interface FrequencyChangeRecord { /* ... */ }
// export interface WithdrawalPlanRecord { /* ... */ }
// export interface PausePeriodRecord { /* ... */ }
// export interface AddInvestmentRecord { /* ... */ }
// export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
// export type Gender = 'male' | 'female';
// const POLICY_TERM_TARGET_AGE = 99;
// const ADMIN_FEE_RATE_ANNUAL = 0.006;
// const RPP_CHARGE_RATES = [0.45, 0.30, 0.15, 0.10];
// const RTU_CHARGE_RATES = [0.03, 0.02, 0.01, 0.01];
// const SURRENDER_CHARGE_RATES = [0.50, 0.30, 0.20, 0.05];
// const WITHDRAWAL_FEE_RATES = [0.50, 0.30, 0.20, 0.05];
// const ROYALTY_BONUS_RATE = 0.006;
// const ROYALTY_BONUS_ELIGIBILITY_YEARS = 6;
// const MIN_PAID_MONTHS_FOR_PAUSE = 24;
// function getCOIRate(age: number, gender: Gender): number | null { /* ... */ }
// function getPaymentsPerYear(frequency: PaymentFrequency): number { /* ... */ }
// function isPaymentMonth(monthInYear: number, frequency: PaymentFrequency): boolean { /* ... */ }

// --------------------------------------------------------------------
// TYPES ที่ต้องปรับปรุงหรือเพิ่มเติมใน calculations.ts
// --------------------------------------------------------------------
export interface MonthlyCalculationOutputRow {
    policyYear: number;
    monthInYear: number;
    monthTotal: number;
    age: number;
    rppPaid: number;
    rtuPaid: number;
    lstuPaidGross: number;
    lstuFee: number;
    totalPremiumPaid: number;
    withdrawalAmount: number;
    costOfInsurance: number;
    adminFee: number;
    premiumChargeRPP: number;
    premiumChargeRTU: number;
    totalPremiumCharge: number;
    bomValue: number;
    withdrawalFee: number;
    investmentBase: number;
    investmentReturnEarned: number;
    royaltyBonusAmount: number;
    eomValue: number; // ค่าสิ้นเดือนที่อาจจะถูกปัดเป็น 0 ถ้า Lapsed
    cashSurrenderValue: number;
    deathBenefit: number;
    currentSumAssured: number;
    // Fields ใหม่
    policyStatusThisMonth: 'Active' | 'Lapsed_Charges' | 'Lapsed_COI_Admin' | 'Lapsed_Withdrawal' | 'Lapsed_Final'; // เพิ่ม Lapsed_Final
    calculatedEomValueBeforeLapse?: number; // (Optional)
}

export interface MonthlyCalculationInternalResult {
    monthlyRows: MonthlyCalculationOutputRow[];
    finalPolicyStatus: 'Active' | 'Lapsed_Charges' | 'Lapsed_Withdrawal' | 'Lapsed_COI_Admin' | 'Lapsed_Final' | 'Completed';
    lastProcessedMonth: number;
    lastSolventAge: number; // อายุสุดท้ายที่สถานะยังเป็น Active (ก่อนจะ Lapsed หรือ Completed)
}

export interface CalculationResult {
    monthly: MonthlyCalculationOutputRow[];
    annual: AnnualCalculationOutputRow[]; // ต้องมั่นใจว่า AnnualCalculationOutputRow มี field ที่สอดคล้อง
    finalPolicyStatus: MonthlyCalculationInternalResult['finalPolicyStatus'];
    lastSolventAge: number; // เปลี่ยนเป็น required
    lastProcessedMonth: number;
}


// --------------------------------------------------------------------
// ฟังก์ชัน calculateBenefitIllustrationMonthly ที่แก้ไขแล้ว
// --------------------------------------------------------------------
// ใน lib/calculations.ts

export function calculateBenefitIllustrationMonthly(
    input: CalculationInput
): MonthlyCalculationInternalResult {
    // --- ส่วนที่ 1: การตั้งค่าเริ่มต้นและเตรียมข้อมูล ---
    const monthlyResults: MonthlyCalculationOutputRow[] = [];
    const monthlyInvestmentRate = input.assumedInvestmentReturnRate / 12;
    const monthlyAdminFeeRate = ADMIN_FEE_RATE_ANNUAL / 12;
    const policyDurationMonths = (POLICY_TERM_TARGET_AGE - input.policyholderAge + 1) * 12;
    //const premiumPayingTermYears = input.premiumPayingTermYears > 0
    //    ? input.premiumPayingTermYears
    //    : (MAX_POLICY_AGE_TYPE - input.policyholderAge + 1);

    // --- ตัวแปรสำหรับติดตามสถานะต่างๆ ตลอดการคำนวณ ---
    let currentAccountValue_BOM = 0;
    let currentSumAssured = input.initialSumInsured;
    let paidMonthsCount = 0;
    let paidPeriodsCount = 0;
    let wasWithdrawalInFirst6Years = false;
    const eomValuesLast12Months: number[] = [];

    // --- ตัวแปรสำหรับติดตามสถานะของกรมธรรม์ ---
    let policyIsLapsed: boolean = false;
    let lapseReason: MonthlyCalculationOutputRow['policyStatusThisMonth'] = 'Active';
    let finalLastSolventAge: number = POLICY_TERM_TARGET_AGE; // Assume solvent till end, will be updated if lapsed

    // --- เตรียมข้อมูลแผนต่างๆ โดยการเรียงลำดับ ---
    const sortedFrequencyChanges = [...(input.frequencyChanges || [])].sort((a, b) => a.startAge - b.startAge);
    const sortedPausePeriods = [...(input.pausePeriods || [])].sort((a, b) => a.startAge - b.startAge);
    const sortedSumInsuredReductions = [...(input.sumInsuredReductions || [])].sort((a, b) => a.age - b.age);
    const sortedWithdrawalPlan = [...(input.withdrawalPlan || [])].sort((a, b) => a.startAge - b.startAge);
    const sortedAdditionalInvestments = [...(input.additionalInvestments || [])].sort((a, b) => a.startAge - b.startAge);

    let actualLastProcessedMonth = 0;

    // --- ส่วนที่ 2: Loop การคำนวณรายเดือน ---
    for (let m = 1; m <= policyDurationMonths; m++) {
        actualLastProcessedMonth = m;
        const policyYear = Math.ceil(m / 12);
        const monthInYear = ((m - 1) % 12) + 1;
        const currentAge = input.policyholderAge + policyYear - 1;

        const bomValueForCurrentMonth = currentAccountValue_BOM;
        let calculatedEomValueThisMonth = bomValueForCurrentMonth; // Start with BOM for current month's EOM calculation
        let currentMonthStatusForOutput: MonthlyCalculationOutputRow['policyStatusThisMonth'] = 'Active';
        //let eomValueRawBeforeAnyLapseDecision = bomValueForCurrentMonth; // For calculatedEomValueBeforeLapse

        // ค่า default สำหรับผลลัพธ์รายเดือน
        // --- ตั้งค่าตัวแปรรายเดือนให้เป็น 0 ก่อนเริ่มคำนวณ ---
        let rpp_month = 0, rtu_month = 0, lstu_gross_month = 0, lstuFee_month = 0;
        let totalPremium_gross_month = 0;
        let premiumCharge_rpp_month = 0, premiumCharge_rtu_month = 0, totalPremiumCharge_month = 0;
        let coi_month = 0, adminFee_month = 0;
        let withdrawal_month = 0, withdrawalFee_month = 0;
        let investmentBaseForMonth = 0, investmentReturn_month = 0, royaltyBonus_month = 0;

        // --- ตรวจสอบสถานะขาดอายุ: ถ้าขาดอายุแล้ว ให้ข้ามไปเดือนถัดไป ---
        if (policyIsLapsed) {
            currentAccountValue_BOM = 0;
            const monthlyRowLapsed: MonthlyCalculationOutputRow = {
                policyYear, monthInYear, monthTotal: m, age: currentAge, rppPaid: 0, rtuPaid: 0,
                lstuPaidGross: 0, lstuFee: 0, totalPremiumPaid: 0, withdrawalAmount: 0,
                costOfInsurance: 0, adminFee: 0, premiumChargeRPP: 0, premiumChargeRTU: 0,
                totalPremiumCharge: 0, bomValue: bomValueForCurrentMonth, withdrawalFee: 0,
                investmentBase: 0, investmentReturnEarned: 0, royaltyBonusAmount: 0,
                eomValue: 0, cashSurrenderValue: 0, deathBenefit: currentSumAssured, currentSumAssured,
                policyStatusThisMonth: lapseReason, calculatedEomValueBeforeLapse: 0, // Value before this specific lapse
            };
            monthlyResults.push(monthlyRowLapsed);
            continue;
        }

        // 1. Sum Insured Reduction
        const reduction = sortedSumInsuredReductions.find(r => r.age === currentAge);
        if (reduction && monthInYear === 1) currentSumAssured = reduction.newSumInsured;

        // --- 2. Premium ---
        let effectivePaymentFrequency = input.initialPaymentFrequency;
        const activeFreqChange = sortedFrequencyChanges.filter(fc => currentAge >= fc.startAge && currentAge <= fc.endAge).pop();
        if (activeFreqChange) {
            effectivePaymentFrequency = activeFreqChange.frequency;
        } else {
            const lastChange = sortedFrequencyChanges.filter(fc => currentAge > fc.endAge).pop();
            if (lastChange) effectivePaymentFrequency = lastChange.frequency;
        }

        let isPayingPeriod = true; // ตั้งค่าเริ่มต้นให้จ่ายเบี้ย

        // 1. ตรวจสอบ Premium Paying Term Years (ถ้ามีการกำหนด)
        if (input.premiumPayingTermYears !== undefined && input.premiumPayingTermYears > 0) {
            isPayingPeriod = policyYear <= input.premiumPayingTermYears;
        }

        // 2. เพิ่มเงื่อนไขหยุดจ่ายเบี้ยที่อายุที่กำหนด (LAST_PAYMENT_AGE)
        // **สำคัญ**: เงื่อนไขนี้ควรตรวจสอบหลังจากเงื่อนไข premiumPayingTermYears
        // เพื่อให้ถ้ามีการกำหนด premiumPayingTermYears ที่สั้นกว่า LAST_PAYMENT_AGE มันก็ยังหยุดจ่ายตามนั้น
        // แต่ถ้า premiumPayingTermYears ไม่มี หรือยาวกว่า LAST_PAYMENT_AGE ก็จะหยุดที่ LAST_PAYMENT_AGE แทน
        if (currentAge > LAST_PAYMENT_AGE) {
            isPayingPeriod = false; // ถ้าอายุเกินอายุสูงสุดที่ต้องจ่ายเบี้ย ให้หยุดจ่าย
        }
        let isPaused = false;
        if (m >= (MIN_PAID_MONTHS_FOR_PAUSE + 1)) {
            const activePause = sortedPausePeriods.find(p => {
                if (p.type === 'year') {
                    return policyYear >= p.startAge && policyYear <= p.endAge;
                } else {
                    return currentAge >= p.startAge && currentAge <= p.endAge;
                }
            });
            isPaused = !!activePause;
        }

        if (isPayingPeriod && !isPaused && isPaymentMonth(monthInYear, effectivePaymentFrequency)) {
            const paymentsPerYear = getPaymentsPerYear(effectivePaymentFrequency);
            rpp_month = (input.rppPerYear || 0) / paymentsPerYear;
            rtu_month = (input.rtuPerYear || 0) / paymentsPerYear;
            paidMonthsCount++;
            paidPeriodsCount++;
        }

        if (monthInYear === 1) {
            sortedAdditionalInvestments.forEach(inv => {
                if ((inv.type === 'single' && inv.startAge === currentAge) || (inv.type === 'annual' && currentAge >= inv.startAge && currentAge <= inv.endAge)) {
                    lstu_gross_month += inv.amount;
                    lstuFee_month += inv.amount * 0.0125;
                }
            });
        }
        totalPremium_gross_month = rpp_month + rtu_month + lstu_gross_month;
        calculatedEomValueThisMonth += totalPremium_gross_month;

        // 3. Premium Charges
        if (policyYear <= 4 && (rpp_month > 0 || rtu_month > 0)) {
            const chargeIdx = Math.min(policyYear - 1, RPP_CHARGE_RATES.length - 1);
            premiumCharge_rpp_month = rpp_month * (RPP_CHARGE_RATES[chargeIdx] || 0);
            premiumCharge_rtu_month = rtu_month * (RTU_CHARGE_RATES[chargeIdx] || 0);
        }
        totalPremiumCharge_month = premiumCharge_rpp_month + premiumCharge_rtu_month + lstuFee_month;
        calculatedEomValueThisMonth -= totalPremiumCharge_month;

        if (calculatedEomValueThisMonth < -0.01 && !policyIsLapsed) {
            policyIsLapsed = true; lapseReason = 'Lapsed_Charges'; finalLastSolventAge = currentAge;
        }

        // 4. COI & Admin Fee (only if not lapsed yet)
        if (!policyIsLapsed) {
            const coiRate = getCOIRate(currentAge, input.policyholderGender);
            if (coiRate !== null) {
                const avBeforeCOI = calculatedEomValueThisMonth;
                const dbForCOI = Math.max(currentSumAssured * 1.2, ( (policyYear === 1 && monthInYear === 1) ? 0 : avBeforeCOI) * 1.2, currentSumAssured);
                const sar = Math.max(0, dbForCOI - ((policyYear === 1 && monthInYear === 1) ? 0 : avBeforeCOI) );
                coi_month = Math.max(0, (sar / 1000) * coiRate / 12);
                calculatedEomValueThisMonth -= coi_month;
                if (calculatedEomValueThisMonth < -0.01 && !policyIsLapsed) {
                    policyIsLapsed = true; lapseReason = 'Lapsed_COI_Admin'; finalLastSolventAge = currentAge;
                }
            }
        }
        if (!policyIsLapsed) {
            //const avBeforeAdmin = calculatedEomValueThisMonth;
            const adminFeeBase = (policyYear === 1 && monthInYear === 1) ? Math.max(0, totalPremium_gross_month - totalPremiumCharge_month) : bomValueForCurrentMonth; // Or avBeforeAdmin
            adminFee_month = Math.max(0, adminFeeBase * monthlyAdminFeeRate);
            calculatedEomValueThisMonth -= adminFee_month;
            if (calculatedEomValueThisMonth < -0.01 && !policyIsLapsed) {
                policyIsLapsed = true; lapseReason = 'Lapsed_COI_Admin'; finalLastSolventAge = currentAge;
            }
        }

        // 5. Withdrawals (only if not lapsed yet)
        if (!policyIsLapsed && monthInYear === 1) {
            for (const wd of sortedWithdrawalPlan) {
                if ((wd.type === 'single' && wd.startAge === currentAge) || (wd.type === 'annual' && currentAge >= wd.startAge && currentAge <= wd.endAge)) {
                    const amountToWithdraw = wd.amount;
                    if (calculatedEomValueThisMonth >= amountToWithdraw) {
                        withdrawal_month += amountToWithdraw;
                        calculatedEomValueThisMonth -= amountToWithdraw;
                        const feeIdx = Math.min(policyYear - 1, WITHDRAWAL_FEE_RATES.length - 1);
                        withdrawalFee_month += amountToWithdraw * ((policyYear <= WITHDRAWAL_FEE_RATES.length) ? WITHDRAWAL_FEE_RATES[feeIdx] : 0);
                    } else {
                        withdrawal_month += Math.max(0, calculatedEomValueThisMonth);
                        calculatedEomValueThisMonth = 0;
                        policyIsLapsed = true; lapseReason = 'Lapsed_Withdrawal'; finalLastSolventAge = currentAge;
                        withdrawalFee_month = 0;
                        break;
                    }
                    if (policyYear <= ROYALTY_BONUS_ELIGIBILITY_YEARS) wasWithdrawalInFirst6Years = true;
                }
            }
        }
        if (!policyIsLapsed && withdrawalFee_month > 0) {
            calculatedEomValueThisMonth -= withdrawalFee_month;
            if (calculatedEomValueThisMonth < -0.01 && !policyIsLapsed) {
                policyIsLapsed = true; lapseReason = 'Lapsed_Charges'; // Or a specific 'Lapsed_WithdrawalFee'
                finalLastSolventAge = currentAge;
            }
        }

        // 6. Investment Base & Return (only if not lapsed yet)
        investmentBaseForMonth = policyIsLapsed ? 0 : calculatedEomValueThisMonth;
        investmentReturn_month = policyIsLapsed ? 0 : Math.max(0, investmentBaseForMonth) * monthlyInvestmentRate;
        calculatedEomValueThisMonth += investmentReturn_month;

        // 7. Royalty Bonus (only if not lapsed yet)
        royaltyBonus_month = 0;
            if (!policyIsLapsed && monthInYear === 12) {
                // เปลี่ยนจาก paidMonthsCount >= 72 เป็น paidPeriodsCount >= 6
                const paid6Y = paidPeriodsCount >= ROYALTY_BONUS_ELIGIBILITY_YEARS;
                const eligible6Y = paid6Y && !wasWithdrawalInFirst6Years;
                const pausedThisY = sortedPausePeriods.some(p => {
                    if (p.type === 'year') {
                        return policyYear >= p.startAge && policyYear <= p.endAge;
                    } else { // 'age' หรือ default
                        return currentAge >= p.startAge && currentAge <= p.endAge;
                    }
                });
                const withdrewThisY = withdrawal_month > 0;
                if (eligible6Y  && isPayingPeriod && !pausedThisY && !withdrewThisY) {
                    if (eomValuesLast12Months.length === 12) {
                        royaltyBonus_month = Math.max(0, (eomValuesLast12Months.reduce((a, b) => a + b, 0) / 12) * ROYALTY_BONUS_RATE);
                    }
                }
                calculatedEomValueThisMonth += royaltyBonus_month;
            }

        // 8. Final EOM and status for the month
        const eomValueRawForMonth = calculatedEomValueThisMonth;
        currentMonthStatusForOutput = policyIsLapsed ? lapseReason : 'Active';

        if (!policyIsLapsed && eomValueRawForMonth < -0.01) { // Final check if any operation made it negative
            policyIsLapsed = true;
            lapseReason = 'Lapsed_Final'; // General lapse if it becomes negative at the very end of month's calcs
            finalLastSolventAge = currentAge;
            currentMonthStatusForOutput = lapseReason;
        }

        const finalEomValueForDisplay = policyIsLapsed ? 0 : Math.max(0, eomValueRawForMonth);
        currentAccountValue_BOM = finalEomValueForDisplay; // BOM for next month

        let srRate = 0; if (policyYear <= SURRENDER_CHARGE_RATES.length) srRate = SURRENDER_CHARGE_RATES[policyYear - 1];
        const eomCSV = finalEomValueForDisplay * (1 - srRate);
        const eomDB = policyIsLapsed ? currentSumAssured : Math.max(currentSumAssured * 1.2, finalEomValueForDisplay * 1.2, currentSumAssured);

        monthlyResults.push({
            policyYear, monthInYear, monthTotal: m, age: currentAge, rppPaid: rpp_month, rtuPaid: rtu_month,
            lstuPaidGross: lstu_gross_month, lstuFee: lstuFee_month, totalPremiumPaid: totalPremium_gross_month,
            withdrawalAmount: withdrawal_month, costOfInsurance: coi_month, adminFee: adminFee_month,
            premiumChargeRPP: premiumCharge_rpp_month, premiumChargeRTU: premiumCharge_rtu_month,
            totalPremiumCharge: totalPremiumCharge_month, bomValue: bomValueForCurrentMonth,
            withdrawalFee: withdrawalFee_month, investmentBase: investmentBaseForMonth,
            investmentReturnEarned: investmentReturn_month, royaltyBonusAmount: royaltyBonus_month,
            eomValue: finalEomValueForDisplay, cashSurrenderValue: Math.max(0, eomCSV), deathBenefit: eomDB, currentSumAssured,
            policyStatusThisMonth: currentMonthStatusForOutput,
            calculatedEomValueBeforeLapse: eomValueRawForMonth,
        });

        if (!policyIsLapsed) {
            finalLastSolventAge = currentAge; // Update last age policy was active
            eomValuesLast12Months.push(finalEomValueForDisplay); // Use value that might be zeroed for bonus calc consistency
            if (eomValuesLast12Months.length > 12) eomValuesLast12Months.shift();
        }

        if (currentAge >= POLICY_TERM_TARGET_AGE && m >= policyDurationMonths) break; // End early if target age reached
        if (policyIsLapsed && m < policyDurationMonths) {
            // If lapsed, fill remaining months with lapsed state if needed by isScenarioSolvent
            // Or, allow loop to continue to push lapsed rows (current behavior)
            // For Solver, it's important that `finalLastSolventAge` is accurate.
        }
    } // End of monthly loop

    let finalOverallStatus: MonthlyCalculationInternalResult['finalPolicyStatus'] = 'Completed';
    if (policyIsLapsed) {
        finalOverallStatus = lapseReason;
    } else if (actualLastProcessedMonth < policyDurationMonths) { // Should not happen if loop completes
        finalOverallStatus = 'Active'; // Or some other indicator of early termination without lapse
    }
    // Ensure finalLastSolventAge is accurate if policy completed without lapsing
    if (!policyIsLapsed && monthlyResults.length > 0) {
         finalLastSolventAge = monthlyResults[monthlyResults.length -1].age;
    }


    return {
        monthlyRows: monthlyResults,
        finalPolicyStatus: finalOverallStatus,
        lastProcessedMonth: actualLastProcessedMonth,
        lastSolventAge: finalLastSolventAge,
    };
}

// ตรวจสอบให้แน่ใจว่า MonthlyCalculationOutputRow และ AnnualCalculationOutputRow
// ได้รับการนิยาม Type ตามที่เราคุยกันล่าสุดแล้ว
// เช่น MonthlyCalculationOutputRow มี policyStatusThisMonth
// และ AnnualCalculationOutputRow (ถ้าต้องการ) อาจจะมี eoySumInsured และ annualPolicyStatus

const ANNUAL_INFLATION_RATE: number = 0.0034; // อัตราเงินเฟ้อ 4% ต่อปี

export function aggregateToAnnual(
    monthlyData: MonthlyCalculationOutputRow[],
    assumedInvestmentReturnRate: number
): AnnualCalculationOutputRow[] {
    if (!monthlyData || monthlyData.length === 0) {
        return [];
    }

    const annualResultsMap = new Map<number, Partial<AnnualCalculationOutputRow>>();

    // Loop 1: รวมยอดรายเดือน (Summation)
    for (const monthRow of monthlyData) {
        let yearData = annualResultsMap.get(monthRow.policyYear);

        if (!yearData) {
            yearData = {
                policyYear: monthRow.policyYear,
                age: monthRow.age, // จะถูกอัปเดตเป็นอายุสิ้นปีทีหลัง
                premiumRPPYear: 0,
                premiumRTUYear: 0,
                premiumLSTUYearGross: 0,
                totalPremiumYear: 0,
                premiumChargeRPPYear: 0,
                premiumChargeRTUYear: 0,
                totalPremiumChargeYear: 0,
                totalCOIYear: 0,
                totalAdminFeeYear: 0,
                royaltyBonusYear: 0,
                withdrawalYear: 0,
                investmentReturnYear: 0,
            };
            annualResultsMap.set(monthRow.policyYear, yearData);
        }

        // --- [ลบออก] ลบ Logic เก่าของ investmentBaseYear และ eoySumInsured ---
        // if (monthRow.monthInYear === 1) { ... }
        
        // การบวกรวมค่าต่างๆ ทำเหมือนเดิม
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
    }

    const finalizedAnnualResults: AnnualCalculationOutputRow[] = [];
    
    // Loop 2: คำนวณค่าสุดท้ายของแต่ละปี (Finalization & Transformation)
    for (const yearDataPartial of annualResultsMap.values()) {
        const monthlyForYear = monthlyData.filter(
            (m: MonthlyCalculationOutputRow) => m.policyYear === yearDataPartial.policyYear
        );

        if (monthlyForYear.length > 0) {
            const lastMonthOfYearData = monthlyForYear[monthlyForYear.length - 1];
            
            // อัปเดต age และ sum insured ให้เป็นของเดือนสุดท้าย
            yearDataPartial.age = lastMonthOfYearData.age;
            yearDataPartial.eoySumInsured = lastMonthOfYearData.currentSumAssured;

            // --- LOGIC ใหม่ทั้งหมด ---
            const nominalEoyAccountValue = lastMonthOfYearData.eomValue; // ถ้าต้องการ factor 1.00107 ให้คูณตรงนี้
            
            const realEoyAccountValue = (ANNUAL_INFLATION_RATE === 0)
                ? nominalEoyAccountValue
                : nominalEoyAccountValue / Math.pow(1 + (ANNUAL_INFLATION_RATE / 12), (yearDataPartial.policyYear ?? 1) * 12);
            
            yearDataPartial.eoyAccountValue = realEoyAccountValue;

            const nominalSumAssured = yearDataPartial.eoySumInsured ?? 0;
            const hybridDeathBenefit = Math.max(
                nominalSumAssured * 1.2,
                nominalEoyAccountValue * 1.2,
                nominalSumAssured
            );
            yearDataPartial.eoyDeathBenefit = hybridDeathBenefit;

            const surrenderRate = (yearDataPartial.policyYear ?? 1) <= SURRENDER_CHARGE_RATES.length 
                ? SURRENDER_CHARGE_RATES[(yearDataPartial.policyYear ?? 1) - 1] 
                : 0;
            yearDataPartial.eoyCashSurrenderValue = nominalEoyAccountValue * (1 - surrenderRate);

            // --- [แก้ไข] ย้ายโค้ดส่วนนี้เข้ามาใน if block ---
            const withdrawalFeeYear = monthlyForYear.reduce((sum: number, m: MonthlyCalculationOutputRow) => sum + (m.withdrawalFee || 0), 0);
            yearDataPartial.totalFeesYear =
                (yearDataPartial.totalPremiumChargeYear || 0) +
                (yearDataPartial.totalCOIYear || 0) +
                (yearDataPartial.totalAdminFeeYear || 0) +
                withdrawalFeeYear;

            if (assumedInvestmentReturnRate > 0) {
                yearDataPartial.investmentBaseYear = (yearDataPartial.investmentReturnYear || 0) / assumedInvestmentReturnRate;
            } else {
                yearDataPartial.investmentBaseYear = 0;
            }
            // --- สิ้นสุดส่วนที่ย้าย ---

            finalizedAnnualResults.push(yearDataPartial as AnnualCalculationOutputRow);
        }
    }

    finalizedAnnualResults.sort((a, b) => a.policyYear - b.policyYear);
    return finalizedAnnualResults;
}

export function generateIllustrationTables(input: CalculationInput): CalculationResult {
    console.log("[calculations.ts] Input to generateIllustrationTables:", JSON.parse(JSON.stringify(input)));
    const monthlyInternalResult = calculateBenefitIllustrationMonthly(input);
    const annualData = aggregateToAnnual(monthlyInternalResult.monthlyRows, input.assumedInvestmentReturnRate);
    console.log("[generateIllustrationTables] Generated Annual Data Preview (First 5):", annualData.slice(0, 5));
    return {
        monthly: monthlyInternalResult.monthlyRows,
        annual: annualData,
        finalPolicyStatus: monthlyInternalResult.finalPolicyStatus,
        lastSolventAge: monthlyInternalResult.lastSolventAge,
        lastProcessedMonth: monthlyInternalResult.lastProcessedMonth,
    };
}

