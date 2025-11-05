// --- Imports ---
import { generateIllustrationTables, getSumInsuredFactor } from '@/lib/calculations';
import type { CalculationInput, WithdrawalPlanRecord, SumInsuredReductionRecord, AnnualCalculationOutputRow as IWealthyAnnualRow } from '@/lib/calculations';
import { generatePensionIllustration } from '@/hooks/useLthcCalculations';
import type { RetirementPlanParams, AnnualRetirementOutputRow } from './useRetirementTypes';
import { getPensionPremiumRate, PensionPlanType } from '@/data/pensionRates';

// ===================================================================
// +++ เครื่องคำนวณลดหย่อนภาษี +++
// ===================================================================

/**
 * คำนวณผลประโยชน์ทางภาษีสำหรับตารางแสดงผลประโยชน์
 * @param illustrationData ข้อมูลตารางผลประโยชน์ที่คำนวณแล้ว
 * @param taxInfo ข้อมูลภาษีที่ผู้ใช้กรอก
 * @returns ข้อมูลตารางผลประโยชน์ที่เพิ่มคอลัมน์ taxBenefit เข้าไป
 */
export const calculateRetirementTaxBenefits = (
    illustrationData: AnnualRetirementOutputRow[],
    taxInfo: { taxRate: number; usedFirst100k: number; usedPensionDeduction: number; endAge: number }
): AnnualRetirementOutputRow[] => {
    if (!taxInfo) return illustrationData;

    return illustrationData.map(row => {
        if (row.age > taxInfo.endAge) {
            return { ...row, taxBenefit: 0 };
        }

        let totalTaxSavings = 0;
        const taxRate = taxInfo.taxRate / 100;

        // 1. คำนวณลดหย่อนจาก "แผนบำนาญ" (โควต้า 200,000 บาท)
        if (row.pensionPremium > 0) {
            const remainingPensionLimit = Math.max(0, 200000 - taxInfo.usedPensionDeduction);
            const deductiblePension = Math.min(row.pensionPremium, remainingPensionLimit);
            totalTaxSavings += deductiblePension * taxRate;
        }

        // 2. คำนวณลดหย่อนจาก "iWealthy" โดยใช้ค่าใช้จ่ายจริง
        const iWealthyExpenses = (row.iWealthyCOI ?? 0) + (row.iWealthyAdminFee ?? 0) + (row.iWealthyPremiumCharge ?? 0);
        if (iWealthyExpenses > 0) {
            const remaining100kLimit = Math.max(0, 100000 - taxInfo.usedFirst100k);
            const deductibleIWealthy = Math.min(iWealthyExpenses, remaining100kLimit);
            totalTaxSavings += deductibleIWealthy * taxRate;
        }

        return { ...row, taxBenefit: totalTaxSavings };
    });
};


// ===================================================================
// +++ HELPER & CORE FUNCTIONS +++
// ===================================================================
const isPlanSolvent = (
    annualData: IWealthyAnnualRow[],
    withdrawalPlan: WithdrawalPlanRecord[]
): boolean => {
    if (!annualData || annualData.length === 0) return false;
    const lastRow = annualData[annualData.length - 1];
    if (lastRow.age < 98) return false;
    for (const row of annualData) {
        if (row.eoyAccountValue < -0.01) return false;
    }
    const withdrawalMap = new Map<number, number>();
    withdrawalPlan.forEach(wd => {
        for (let age = wd.startAge; age <= wd.endAge; age++) {
             withdrawalMap.set(age, (withdrawalMap.get(age) || 0) + wd.amount);
        }
    });
    for(const row of annualData) {
        const plannedAmount = withdrawalMap.get(row.age);
        if (plannedAmount && plannedAmount > 0) {
            if (row.withdrawalYear < plannedAmount * 0.999) return false;
        }
    }
    return true;
};

const generateAutoSAReductions = (entryAge: number, rpp: number): SumInsuredReductionRecord[] => {
    const reductions: SumInsuredReductionRecord[] = [];
    if (rpp <= 0) return reductions;
    const getReductionFactor = (milestoneAge: number): number => {
        if (milestoneAge <= 40) return 40;
        if (milestoneAge <= 50) return 30;
        if (milestoneAge <= 60) return 20;
        if (milestoneAge <= 65) return 15;
        return 5;
    };
    const milestones = [41, 51, 61, 66];
    reductions.push({
        age: entryAge + 1,
        newSumInsured: Math.round(rpp * getReductionFactor(entryAge + 1))
    });
    milestones.forEach(age => {
        if (age > entryAge + 1) {
            reductions.push({
                age: age,
                newSumInsured: Math.round(rpp * getReductionFactor(age))
            });
        }
    });
    return reductions.sort((a, b) => a.age - b.age);
};


const calculateTotalPensionPayoutFactor = (planType: PensionPlanType): number => {
    if (planType === 'pension8') return 0.18 * (88 - 60 + 1);
    if (planType === 'pension60') {
         const factor60to70 = 0.15 * (70 - 60 + 1);
         const factor71to80 = 0.20 * (80 - 71 + 1);
         const factor81to88 = 0.25 * (88 - 81 + 1);
         return factor60to70 + factor71to80 + factor81to88;
    }
    return 0;
};

const calculateLumpSumNeeded = (params: RetirementPlanParams): number => {
    const { planningAge, desiredRetirementAge, desiredAnnualPension, assumedInflationRate } = params;
    const yearsToRetire = desiredRetirementAge - planningAge;
    const futureMonthlyPension = (desiredAnnualPension / 12) * Math.pow(1 + assumedInflationRate / 100, yearsToRetire);
    const requiredAnnualPension = futureMonthlyPension * 12;
    const lumpSum = requiredAnnualPension * 25;
    return lumpSum;
};

const generateTargetPensionMap = (params: RetirementPlanParams): Map<number, number> => {
    const targetPensionMap = new Map<number, number>();
    const { planningAge, desiredRetirementAge, desiredAnnualPension, assumedInflationRate } = params;
    for (let age = desiredRetirementAge; age <= 98; age++) {
        const yearsElapsedSincePlanning = age - planningAge;
        const inflationAdjustedPension = desiredAnnualPension * Math.pow(1 + (assumedInflationRate / 100), yearsElapsedSincePlanning);
        targetPensionMap.set(age, Math.round(inflationAdjustedPension));
    }
    return targetPensionMap;
};


const generateCombinedIllustration = (
  planningAge: number,
  iWealthyAnnualData?: IWealthyAnnualRow[],
  pensionAnnualData?: any[],
  targetPensionMap?: Map<number, number>
): AnnualRetirementOutputRow[] => {
    const combined: AnnualRetirementOutputRow[] = [];
    let cumulativePremium = 0, cumulativeWithdrawal = 0;
    const iWealthyMap = new Map(iWealthyAnnualData?.map(row => [row.age, row]));
    const pensionMap = new Map(pensionAnnualData?.map(row => [row.age, row]));
    for (let age = planningAge; age <= 98; age++) {
        const policyYear = age - planningAge + 1;
        const iWealthyRow = iWealthyMap.get(age);
        const pensionRow = pensionMap.get(age);
        const iWealthyPremium = iWealthyRow?.totalPremiumYear ?? 0;
        const pensionPremium = pensionRow?.pensionPremium ?? 0;
        const totalPremium = iWealthyPremium + pensionPremium;
        cumulativePremium += totalPremium;
        const pensionPayout = pensionRow?.pensionPayout ?? 0;
        const iWealthyWithdrawal = iWealthyRow?.withdrawalYear ?? 0;
        const totalWithdrawal = pensionPayout + iWealthyWithdrawal;
        cumulativeWithdrawal += totalWithdrawal;
        const row: AnnualRetirementOutputRow = {
            policyYear, age, iWealthyPremium, pensionPremium, totalPremium, cumulativePremium,
            pensionPayout, iWealthyWithdrawal, totalWithdrawal, cumulativeWithdrawal,
            targetAnnualPension: targetPensionMap?.get(age),
            iWealthyFundValue: iWealthyRow?.eoyAccountValue ?? 0,
            pensionCSV: pensionRow?.pensionEOYCSV ?? 0,
            iWealthyDeathBenefit: iWealthyRow?.eoyDeathBenefit ?? 0,
            pensionDeathBenefit: pensionRow?.pensionDeathBenefit ?? 0,
            iWealthyCOI: iWealthyRow?.totalCOIYear,
            iWealthyAdminFee: iWealthyRow?.totalAdminFeeYear,
            iWealthyPremiumCharge: iWealthyRow?.totalPremiumChargeYear,
        };
        combined.push(row);
    }
    return combined;
};

const calculateSustainableWithdrawal = (finalFundValue: number, guaranteedPensionPerMonth: number): number => {
    const withdrawalFromFundPerMonth = (finalFundValue * 0.04) / 12;
    return guaranteedPensionPerMonth + withdrawalFromFundPerMonth;
};

const solveForRetirementPremiums = async (params: RetirementPlanParams) => {
    const totalLumpSumNeeded = calculateLumpSumNeeded(params);
    let pensionLumpSumTarget = 0;
    
    let solvedPensionPremium = 0;
    let pensionIllustration: any[] | undefined = undefined;

    if (params.fundingMix === 'pensionOnly') {
        pensionLumpSumTarget = totalLumpSumNeeded;
    } else if (params.fundingMix === 'hybrid') {
        if (params.hybridMode === 'automatic') {
            pensionLumpSumTarget = totalLumpSumNeeded * (params.hybridPensionRatio / 100);
        } else { // manual
            const premiumRate = getPensionPremiumRate(params.planningAge, params.gender, params.pensionOptions.planType);
            if (premiumRate) {
                const manualSA = Math.round(((params.manualPensionPremium / premiumRate) * 1000) / 1000) * 1000;
                pensionIllustration = generatePensionIllustration(params.planningAge, params.gender, params.pensionOptions.planType, manualSA, params. pensionStartAge, params.pensionEndAge);
                const totalPayoutFactor = calculateTotalPensionPayoutFactor(params.pensionOptions.planType);
                pensionLumpSumTarget = manualSA * totalPayoutFactor;
                solvedPensionPremium = params.manualPensionPremium;
            }
        }
    }

    if (pensionLumpSumTarget > 0 && params.hybridMode !== 'manual') {
        const totalPayoutFactor = calculateTotalPensionPayoutFactor(params.pensionOptions.planType);
        const requiredSA = totalPayoutFactor > 0 ? pensionLumpSumTarget / totalPayoutFactor : 0;
        const solvedSA = Math.ceil(requiredSA / 1000) * 1000;
        const premiumRate = getPensionPremiumRate(params.planningAge, params.gender, params.pensionOptions.planType);
        if (premiumRate) {
            solvedPensionPremium = Math.ceil(((solvedSA / 1000) * premiumRate) / 100) * 100;
            pensionIllustration = generatePensionIllustration(params.planningAge, params.gender, params.pensionOptions.planType, solvedSA, params. pensionStartAge, params.pensionEndAge);
        }
    }
    
    const iWealthyLumpSumTarget = Math.max(0, totalLumpSumNeeded - pensionLumpSumTarget);
    
    const targetPensionMap = generateTargetPensionMap(params);
    let finalIWealthyWithdrawalPlan = params.iWealthyWithdrawalPlan;
    if (params.iWealthyWithdrawalMode === 'automatic') {
        const autoPlan: WithdrawalPlanRecord[] = [];
        const pensionPayoutMap = new Map(pensionIllustration?.map(p => [p.age, p.pensionPayout]));
        for (let age = params.desiredRetirementAge; age <= 98; age++) {
            const pensionPayoutThisYear = pensionPayoutMap.get(age) ?? 0;
            const targetPensionThisYear = targetPensionMap.get(age) ?? 0;
            const iWealthyWithdrawalNeeded = Math.max(0, targetPensionThisYear - pensionPayoutThisYear);
            if (iWealthyWithdrawalNeeded > 0) {
                autoPlan.push({
                    id: `auto-wd-${age}`, type: 'annual',
                    amount: Math.ceil(iWealthyWithdrawalNeeded / 100) * 100,
                    startAge: age, endAge: age, refType: 'age',
                });
            }
        }
        finalIWealthyWithdrawalPlan = autoPlan;
    }

    let solvedIWealthyPremium = 0;
    let iWealthyIllustration: any[] | undefined = undefined;

    if (iWealthyLumpSumTarget > 0) {
        let searchLow = 18000, searchHigh = iWealthyLumpSumTarget * 2, optimalPremium = 0;
        for (let i = 0; i < 20; i++) {
            if (searchHigh - searchLow < 100) break;
            const midPremium = Math.round(((searchLow + searchHigh) / 2) / 100) * 100;
            if (midPremium <= searchLow || midPremium >= searchHigh) break;
            const saReductions = generateAutoSAReductions(params.planningAge, midPremium);
            const input: CalculationInput = {
                policyholderAge: params.planningAge, policyholderGender: params.gender,
                initialSumInsured: getSumInsuredFactor(params.planningAge) * midPremium,
                rppPerYear: midPremium, rtuPerYear: 0,
                assumedInvestmentReturnRate: params.investmentReturn / 100,
                premiumPayingTermYears: params.iWealthyPPT,
                initialPaymentFrequency: 'annual', pausePeriods: [], 
                sumInsuredReductions: saReductions,
                additionalInvestments: [], frequencyChanges: [], 
                withdrawalPlan: finalIWealthyWithdrawalPlan,
            };
            const result = await generateIllustrationTables(input);
            if (isPlanSolvent(result.annual, finalIWealthyWithdrawalPlan)) {
                searchHigh = midPremium;
                optimalPremium = midPremium;
                iWealthyIllustration = result.annual;
            } else {
                searchLow = midPremium;
            }
        }
        solvedIWealthyPremium = optimalPremium;
        if (solvedIWealthyPremium === 0 && iWealthyLumpSumTarget > 0) {
             throw new Error("ไม่สามารถหาเบี้ย iWealthy ที่เหมาะสมได้ กรุณาลองปรับเป้าหมายหรือเงื่อนไข");
        }
    }

    const finalIllustration = generateCombinedIllustration(params.planningAge, iWealthyIllustration, pensionIllustration, targetPensionMap);
    return { illustration: finalIllustration, solvedIWealthyPremium, solvedPensionPremium };
};

const runRetirementProjection = async (params: RetirementPlanParams) => {
    let iWealthyIllustration: any[] | undefined = undefined;
    let finalIWealthyWithdrawalPlan = params.iWealthyWithdrawalPlan;
    if (params.iWealthyWithdrawalMode === 'automatic') {
        const autoPlan: WithdrawalPlanRecord[] = [];
        const targetPensionMap = generateTargetPensionMap(params); 
        for (let age = params.desiredRetirementAge; age <= 98; age++) {
             const targetPensionThisYear = targetPensionMap.get(age) ?? 0;
             if(targetPensionThisYear > 0) {
                autoPlan.push({
                    id: `auto-wd-${age}`, type: 'annual',
                    amount: Math.ceil(targetPensionThisYear / 100) * 100,
                    startAge: age, endAge: age, refType: 'age',
                });
             }
        }
        finalIWealthyWithdrawalPlan = autoPlan;
    }
    
    if (params.manualIWealthyPremium > 0) {
        const saReductions = generateAutoSAReductions(params.planningAge, params.manualIWealthyPremium);

        const input: CalculationInput = {
            policyholderAge: params.planningAge, policyholderGender: params.gender,
            initialSumInsured: getSumInsuredFactor(params.planningAge) * params.manualIWealthyPremium,
            rppPerYear: params.manualIWealthyPremium, rtuPerYear: 0,
            assumedInvestmentReturnRate: params.investmentReturn / 100,
            premiumPayingTermYears: params.iWealthyPPT,
            initialPaymentFrequency: 'annual', pausePeriods: [], 
            sumInsuredReductions: saReductions,
            additionalInvestments: [], frequencyChanges: [],
            withdrawalPlan: finalIWealthyWithdrawalPlan,
        };
        const iWealthyResult = await generateIllustrationTables(input);
        iWealthyIllustration = iWealthyResult.annual;
    }

    let pensionIllustration: any[] | undefined = undefined;
    if (params.manualPensionPremium > 0) {
        const premiumRate = getPensionPremiumRate(params.planningAge, params.gender, params.pensionOptions.planType);
        if (premiumRate) {
            const solvedSA = Math.round(((params.manualPensionPremium / premiumRate) * 1000) / 1000) * 1000;
            pensionIllustration = generatePensionIllustration(params.planningAge, params.gender, params.pensionOptions.planType, solvedSA, params.pensionStartAge, params.pensionEndAge);
        }
    }
    
    if (!iWealthyIllustration && !pensionIllustration) {
        throw new Error("กรุณากรอกเบี้ยประกันอย่างน้อยหนึ่งแผน");
    }

    const finalIllustration = generateCombinedIllustration(params.planningAge, iWealthyIllustration, pensionIllustration);
    const finalFundValue = iWealthyIllustration?.find(row => row.age === 98)?.eoyAccountValue ?? 0;
    const guaranteedPensionPerMonth = (pensionIllustration?.find(row => row.pensionPayout > 0)?.pensionPayout ?? 0) / 12;
    const achievedMonthlyPension = calculateSustainableWithdrawal(finalFundValue, guaranteedPensionPerMonth);

    return { illustration: finalIllustration, achievedMonthlyPension };
};

// ===================================================================
// +++ MAIN DISPATCHER (EXPORTED) +++
// ===================================================================
export const calculateRetirementPlan = async (params: RetirementPlanParams) => {
    try {
        if (params.planningMode === 'goalBased') {
            const result = await solveForRetirementPremiums(params);
            return {
                retirementResult: result.illustration,
                retirementSolvedIWealthyPremium: result.solvedIWealthyPremium,
                retirementSolvedPensionPremium: result.solvedPensionPremium,
            };
        } else { 
            const result = await runRetirementProjection(params);
            return {
                retirementResult: result.illustration,
                retirementAchievedMonthlyPension: result.achievedMonthlyPension,
            };
        }
    } catch (err) {
        return { retirementError: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ' };
    }
};