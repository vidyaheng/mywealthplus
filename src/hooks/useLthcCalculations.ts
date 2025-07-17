// src/hooks/useLthcCalculations.ts

// --- Imports ---
import {
    generateIllustrationTables,
    getSumInsuredFactor,
    type AnnualCalculationOutputRow as OriginalIWealthyAnnualOutputRow,
} from '../lib/calculations';
import {
    calculateLifeReadyPremium,
    calculateIHealthyUltraPremium,
    calculateMEBPremium,
} from '../lib/healthPlanCalculations';
import type {
    Gender, HealthPlanSelections, SumInsuredReductionRecord, FrequencyChangeRecord,
    WithdrawalPlanRecord, CalculationInput, IHealthyUltraPlan, MEBPlan,
    AnnualHealthPremiumDetail, PolicyOriginMode, AnnualLTHCOutputRow, 
    FundingSource, PensionFundingOptions, PensionMode, IWealthyMode, SAReductionStrategy
} from './useLthcTypes';
import {
    MINIMUM_ALLOWABLE_SYSTEM_RPP_TYPE as MINIMUM_RPP,
    MAX_POLICY_AGE_TYPE, MEB_TERMINATION_AGE_TYPE,
} from './useLthcTypes';
import { IHEALTHY_ULTRA_RATES } from '../data/iHealthyUltraRates';
import { getPensionPremiumRate, PensionPlanType } from '../data/pensionRates';
import { getPensionCsvRatePer1000 } from '../data/pensionCsvRates';


// =================================================================================
// +++ PENSION PLAN & HELPER FUNCTIONS +++
// =================================================================================

const calculateTotalPensionPayoutFactor = (planType: PensionPlanType): number => {
    if (planType === 'pension8') return 0.18 * (88 - 60 + 1);
    const factor60to70 = 0.15 * (70 - 60 + 1);
    const factor71to80 = 0.20 * (80 - 71 + 1);
    const factor81to88 = 0.25 * (88 - 81 + 1);
    return factor60to70 + factor71to80 + factor81to88;
};

const generatePensionIllustration = (entryAge: number, gender: Gender, planType: PensionPlanType, solvedSumAssured: number): any[] => {
    const illustration = [];
    const annualPensionPremiumRate = getPensionPremiumRate(entryAge, gender, planType);
    if (annualPensionPremiumRate === null) throw new Error(`ไม่พบอัตราค่าเบี้ยบำนาญสำหรับอายุ ${entryAge}`);
    
    const annualPensionPremium = (solvedSumAssured / 1000) * annualPensionPremiumRate;
    
    let cumulativePensionPremium = 0;
    let cumulativeAnnuityPayout = 0;
    let remainingAnnuity60to74 = 0;

    for (let age = 60; age <= 74; age++) {
        if (planType === 'pension8') {
            remainingAnnuity60to74 += solvedSumAssured * 0.18;
        } else {
            if (age <= 70) remainingAnnuity60to74 += solvedSumAssured * 0.15;
            else remainingAnnuity60to74 += solvedSumAssured * 0.20;
        }
    }

    for (let policyYear = 1; (entryAge + policyYear - 1) <= MAX_POLICY_AGE_TYPE; policyYear++) {
        const attainedAge = entryAge + policyYear - 1;
        let currentYearPremium = 0;
        if ((planType === 'pension8' && policyYear <= 8) || (planType === 'pension60' && attainedAge < 60)) {
            currentYearPremium = annualPensionPremium;
        }
        cumulativePensionPremium += currentYearPremium;

        let payout = 0;
        if (attainedAge >= 60 && attainedAge <= 88) {
            if (planType === 'pension8') payout = solvedSumAssured * 0.18;
            else {
                if (attainedAge <= 70) payout = solvedSumAssured * 0.15;
                else if (attainedAge <= 80) payout = solvedSumAssured * 0.20;
                else payout = solvedSumAssured * 0.25;
            }
            cumulativeAnnuityPayout += payout;
        }

        const csvRate = getPensionCsvRatePer1000(entryAge, gender, policyYear, planType);
        const eoyCsv = (solvedSumAssured / 1000) * csvRate;

        let deathBenefit = 0;
        if (policyYear <= 4) {
            deathBenefit = Math.max(solvedSumAssured, eoyCsv, cumulativePensionPremium * 1.01);
        } else if (attainedAge <= 59) {
            deathBenefit = Math.max(solvedSumAssured * 1.8, eoyCsv, cumulativePensionPremium * 1.01);
        } else if (attainedAge <= 74) {
            const annuityPaidUntilThisYear = cumulativeAnnuityPayout;
            const remainingPayouts = remainingAnnuity60to74 - annuityPaidUntilThisYear;
            deathBenefit = Math.max(cumulativePensionPremium - annuityPaidUntilThisYear, remainingPayouts);
        } else if (attainedAge <= 88) {
            deathBenefit = Math.max(0, cumulativePensionPremium - cumulativeAnnuityPayout);
        }

        illustration.push({ 
            policyYear, 
            age: attainedAge, 
            pensionPremium: currentYearPremium, 
            pensionSumAssured: solvedSumAssured, 
            pensionPayout: payout, 
            pensionEOYCSV: eoyCsv,
            pensionDeathBenefit: deathBenefit
        });
    }
    return illustration;
};

const findOptimalPensionPlan = async (entryAge: number, gender: Gender, allHealthPremiums: AnnualHealthPremiumDetail[], pensionOptions: PensionFundingOptions): Promise<any> => {
    const { planType } = pensionOptions;
    const totalHealthPremiumNeeded = allHealthPremiums.filter(hp => hp.age >= 60 && hp.age <= 88).reduce((sum, hp) => sum + hp.totalPremium, 0);
    if (totalHealthPremiumNeeded <= 0) {
        throw new Error("ไม่พบค่าเบี้ยสุขภาพที่ต้องชำระในช่วงอายุ 60-88 ปี จึงไม่สามารถคำนวณแผนบำนาญอัตโนมัติได้");
    }
    const totalPayoutFactor = calculateTotalPensionPayoutFactor(planType);
    const rawRequiredSumAssured = totalHealthPremiumNeeded / totalPayoutFactor;
    const solvedSumAssured = Math.ceil(rawRequiredSumAssured / 1000) * 1000;
    const premiumRate = getPensionPremiumRate(entryAge, gender, planType);
    if (premiumRate === null) {
        throw new Error(`ไม่พบอัตราเบี้ยบำนาญสำหรับอายุ ${entryAge}, เพศ ${gender}, แผน ${planType}`);
    }
    const rawAnnualPensionPremium = (solvedSumAssured / 1000) * premiumRate;
    const solvedAnnualPremium = Math.ceil(rawAnnualPensionPremium / 100) * 100;
    const pensionIllustration = generatePensionIllustration(entryAge, gender, planType, solvedSumAssured);
    return { solvedSA: solvedSumAssured, solvedAnnualPremium, pensionIllustration };
};

const processPensionResultsToLTHC = (healthPremiumsLocal: AnnualHealthPremiumDetail[], pensionIllustrationLocal: any[], currentSelectedHealthPlansLocal: HealthPlanSelections): AnnualLTHCOutputRow[] => {
    const illustration: AnnualLTHCOutputRow[] = [];
    let cumulativeBalance = 0;
    for (const healthEntry of healthPremiumsLocal) {
        if (healthEntry.age > MAX_POLICY_AGE_TYPE) break;
        const pensionEntry = pensionIllustrationLocal.find(p => p.policyYear === healthEntry.year);
        if (!pensionEntry) continue;
        let surplusShortfall = 0;
        if (healthEntry.age >= 60) {
            surplusShortfall = (pensionEntry.pensionPayout ?? 0) - healthEntry.totalPremium;
            cumulativeBalance += surplusShortfall;
        }
        const totalDeathBenefit = (pensionEntry.pensionDeathBenefit ?? 0) + currentSelectedHealthPlansLocal.lifeReadySA;
        illustration.push({
            policyYear: healthEntry.year, age: healthEntry.age,
            lifeReadyPremium: healthEntry.lrPrem, iHealthyUltraPremium: healthEntry.ihuPrem, mebPremium: healthEntry.mebPrem, totalHealthPremium: healthEntry.totalPremium,
            lifeReadyDeathBenefit: currentSelectedHealthPlansLocal.lifeReadySA, totalCombinedDeathBenefit: totalDeathBenefit,
            pensionPremium: pensionEntry.pensionPremium, pensionSumAssured: pensionEntry.pensionSumAssured, pensionPayout: pensionEntry.pensionPayout, pensionEOYCSV: pensionEntry.pensionEOYCSV,
            pensionSurplusShortfall: surplusShortfall, pensionCumulativeBalance: cumulativeBalance, pensionDeathBenefit: pensionEntry.pensionDeathBenefit,
        });
    }
    return illustration;
};

export const calculateManualPensionPlan = async (entryAge: number, gender: Gender, allHealthPremiums: AnnualHealthPremiumDetail[], pensionOptions: PensionFundingOptions, manualPremium: number, healthPlans: HealthPlanSelections): Promise<any> => {
    const { planType } = pensionOptions;
    const premiumRate = getPensionPremiumRate(entryAge, gender, planType);
    if (premiumRate === null || premiumRate <= 0) {
        throw new Error(`ไม่พบอัตราเบี้ยสำหรับแผนบำนาญที่เลือก หรืออัตราเบี้ยเป็นศูนย์`);
    }
    const calculatedSA = (manualPremium / premiumRate) * 1000;
    const solvedSA = Math.round(calculatedSA / 1000) * 1000;
    const pensionIllustration = generatePensionIllustration(entryAge, gender, planType, solvedSA);
    const processedOutput = processPensionResultsToLTHC(allHealthPremiums, pensionIllustration, healthPlans);
    return { outputIllustration: processedOutput, solvedSA: solvedSA, pensionIllustration };
};

const processHybridResultsToLTHC = (healthPremiums: AnnualHealthPremiumDetail[], pensionIllustration: any[], iWealthyData: OriginalIWealthyAnnualOutputRow[] | undefined, healthPlans: HealthPlanSelections): AnnualLTHCOutputRow[] => {
    const illustration: AnnualLTHCOutputRow[] = [];
    for (const healthEntry of healthPremiums) {
        const pensionEntry = pensionIllustration.find(p => p.policyYear === healthEntry.year);
        const iWealthyEntry = iWealthyData?.find(iw => iw.policyYear === healthEntry.year);
        const pensionPayout = pensionEntry?.pensionPayout ?? 0;
        const surplusShortfall = (healthEntry.age >= 60) ? pensionPayout - healthEntry.totalPremium : 0;
        const totalDB = (healthPlans.lifeReadySA ?? 0) + (pensionEntry?.pensionDeathBenefit ?? 0) + (iWealthyEntry?.eoyDeathBenefit ?? 0);
        illustration.push({
            policyYear: healthEntry.year, age: healthEntry.age,
            lifeReadyPremium: healthEntry.lrPrem, iHealthyUltraPremium: healthEntry.ihuPrem, mebPremium: healthEntry.mebPrem, totalHealthPremium: healthEntry.totalPremium,
            pensionPremium: pensionEntry?.pensionPremium, pensionSumAssured: pensionEntry?.pensionSumAssured, pensionPayout: pensionPayout, pensionEOYCSV: pensionEntry?.pensionEOYCSV,
            pensionSurplusShortfall: surplusShortfall, pensionDeathBenefit: pensionEntry?.pensionDeathBenefit,
            iWealthyRpp: iWealthyEntry?.premiumRPPYear, iWealthyRtu: iWealthyEntry?.premiumRTUYear, iWealthyTotalPremium: iWealthyEntry?.totalPremiumYear,
            iWealthyWithdrawal: iWealthyEntry?.withdrawalYear, iWealthyEoyAccountValue: iWealthyEntry?.eoyAccountValue,
            iWealthyEoyDeathBenefit: iWealthyEntry?.eoyDeathBenefit, // +++ FIX: Added this property
            lifeReadyDeathBenefit: healthPlans.lifeReadySA, totalCombinedDeathBenefit: totalDB,
            iWealthyPremiumCharge: iWealthyEntry?.totalPremiumChargeYear,
            iWealthyCOI: iWealthyEntry?.totalCOIYear,
            iWealthyAdminFee: iWealthyEntry?.totalAdminFeeYear,
        });
    }
    return illustration;
};

// =================================================================================
// +++ ORIGINAL FUNCTIONS (FULL IMPLEMENTATION) +++
// =================================================================================
const roundUpToNearestThousand = (num: number): number => {
    if (num <= 0) return 0;
    return Math.ceil(num / 1000) * 1000;
};

const checkIWealthySolvency = (
    iWealthyAnnualData: OriginalIWealthyAnnualOutputRow[] | undefined,
    plannedWithdrawals: WithdrawalPlanRecord[],
    isNoReductionMode: boolean = false // ✅ เพิ่ม Parameter ใหม่
): boolean => {
    if (!iWealthyAnnualData || iWealthyAnnualData.length === 0) return false;
    
    const MINIMUM_REQUIRED_VALUE = 500000;
    const START_AGE_FOR_MINIMUM_VALUE_CHECK = 65;
    const EXPECTED_LAST_POLICY_AGE = 99;

    const withdrawalMap = new Map<number, number>();
    plannedWithdrawals.forEach(wd => { 
        if (wd.type === 'annual' && wd.amount > 0) {
            withdrawalMap.set(wd.startAge, (withdrawalMap.get(wd.startAge) || 0) + wd.amount);
        }
    });

    for (const row of iWealthyAnnualData) {
        // เงื่อนไข 1: ห้ามขาดอายุ (ติดลบ) - ตรวจสอบเสมอ
        if ((row.eoyAccountValue ?? -1) < -0.005) {
            return false; 
        }

        // เงื่อนไข 2: ต้องถอนเงินได้ตามแผน - ตรวจสอบเสมอ
        const plannedAmountForYear = withdrawalMap.get(row.age);
        if (plannedAmountForYear && plannedAmountForYear > 0) {
            if ((row.withdrawalYear || 0) < (plannedAmountForYear * 0.999) && (row.eoyAccountValue ?? 0) < 1.00) {
                return false;
            }
        }

        // ✅ เงื่อนไข 3: ตรวจสอบ 500k แบบมีเงื่อนไข
        // จะทำงานก็ต่อเมื่อ *ไม่ใช่* โหมด "ไม่ลดทุน"
        if (!isNoReductionMode) {
            if (row.age >= START_AGE_FOR_MINIMUM_VALUE_CHECK && (row.eoyAccountValue ?? -1) < MINIMUM_REQUIRED_VALUE) {
                return false;
            }
        }
    }

    const lastYearData = iWealthyAnnualData[iWealthyAnnualData.length - 1];
    // ตรวจสอบว่าคำนวณจนจบหรือไม่
    if (lastYearData.age < EXPECTED_LAST_POLICY_AGE) {
        return false;
    }

    // ✅ ตรวจสอบ 500k ปีสุดท้ายแบบมีเงื่อนไข
    if (!isNoReductionMode) {
        if ((lastYearData.age >= EXPECTED_LAST_POLICY_AGE && lastYearData.age >= START_AGE_FOR_MINIMUM_VALUE_CHECK) && (lastYearData.eoyAccountValue ?? -1) < MINIMUM_REQUIRED_VALUE) {
            return false;
        }
    }

    return true; // ผ่านทุกเงื่อนไข
};

export const calculateAllHealthPremiums = (currentPolicyholderAge: number, gender: Gender, plans: HealthPlanSelections, policyOrigin: PolicyOriginMode, originalEntryAgeForLR?: number): AnnualHealthPremiumDetail[] => {
    const premiums: AnnualHealthPremiumDetail[] = [];
    if (!currentPolicyholderAge || !plans) return premiums;
    const MAX_AGE_LOOP_UNTIL = 99;
    const MAX_IHU_PREMIUM_AGE = IHEALTHY_ULTRA_RATES.length > 0 ? IHEALTHY_ULTRA_RATES[IHEALTHY_ULTRA_RATES.length - 1].age : 0;
    for (let lthcPolicyYear = 1; currentPolicyholderAge + lthcPolicyYear - 1 <= MAX_AGE_LOOP_UNTIL; lthcPolicyYear++) {
        const attainedAge = currentPolicyholderAge + lthcPolicyYear - 1;
        let lrPremium = 0;
        const lrSaFromSelection = plans.lifeReadySA;
        const lrPptFromSelection = plans.lifeReadyPPT;
        let entryAgeForLrCalc: number = currentPolicyholderAge;
        let stillPayingLrThisLthcYear = false;
        if (policyOrigin === 'existingPolicy' && originalEntryAgeForLR !== undefined && originalEntryAgeForLR < currentPolicyholderAge) {
            entryAgeForLrCalc = originalEntryAgeForLR;
            const yearsAlreadyPaidLR = currentPolicyholderAge - originalEntryAgeForLR;
            const currentOriginalLrPolicyYear = yearsAlreadyPaidLR + lthcPolicyYear;
            if (lrPptFromSelection !== 99) {
                if (currentOriginalLrPolicyYear <= lrPptFromSelection && entryAgeForLrCalc <= 70) stillPayingLrThisLthcYear = true;
            } else {
                if (attainedAge <= MAX_POLICY_AGE_TYPE && entryAgeForLrCalc <= 80) stillPayingLrThisLthcYear = true;
            }
        } else {
            entryAgeForLrCalc = currentPolicyholderAge;
            if (lrPptFromSelection === 99) {
                if (attainedAge <= MAX_POLICY_AGE_TYPE && entryAgeForLrCalc <= 80) stillPayingLrThisLthcYear = true;
            } else {
                if (lthcPolicyYear <= lrPptFromSelection && entryAgeForLrCalc <= 70) stillPayingLrThisLthcYear = true;
            }
        }
        if (stillPayingLrThisLthcYear) lrPremium = calculateLifeReadyPremium(entryAgeForLrCalc, gender, lrSaFromSelection, lrPptFromSelection);
        let ihuPremium = 0;
        if (plans.iHealthyUltraPlan !== null && attainedAge <= MAX_IHU_PREMIUM_AGE && attainedAge <= MAX_POLICY_AGE_TYPE) ihuPremium = calculateIHealthyUltraPremium(attainedAge, gender, plans.iHealthyUltraPlan as IHealthyUltraPlan);
        let mebPremium = 0;
        if (plans.mebPlan !== null && attainedAge <= MEB_TERMINATION_AGE_TYPE) mebPremium = calculateMEBPremium(attainedAge, plans.mebPlan as MEBPlan);
        premiums.push({ year: lthcPolicyYear, age: attainedAge, lrPrem: lrPremium, ihuPrem: ihuPremium, mebPrem: mebPremium, totalPremium: lrPremium + ihuPremium + mebPremium });
    }
    return premiums;
};

export const generateSAReductionsForIWealthy = (entryAge: number, rpp: number, reductionAges?: number[]): SumInsuredReductionRecord[] => {
    const reductions: SumInsuredReductionRecord[] = [];
    if (rpp <= 0) {
        return reductions;
    }

    if (Array.isArray(reductionAges) && reductionAges.length === 0) {
        // กรณีไม่ต้องการลดทุน (none)
        const initialSA = Math.round(getSumInsuredFactor(entryAge) * rpp);
        // สร้าง reduction record ที่ไม่มีการเปลี่ยนแปลงทุนประกัน
        // โดยตั้งค่าให้ลดทุนเป็นค่าเดิมในปีถัดไป (เพื่อให้ระบบทำงานต่อได้)
        reductions.push({ 
            age: entryAge + 1, 
            newSumInsured: initialSA // ตั้งค่าเป็นทุนประกันเริ่มต้น
        });
        return reductions;
    }

    const getFactor = (milestoneAge: number, currentEntryAge: number): number => {
        if (milestoneAge === currentEntryAge + 1) {
            if (currentEntryAge <= 40) return 40;
            if (currentEntryAge <= 50) return 30;
            if (currentEntryAge <= 60) return 20;
            if (currentEntryAge <= 65) return 15;
            return 5;
        }
        if (milestoneAge === 41) return 30;
        if (milestoneAge === 51) return 20;
        if (milestoneAge === 61) return 15;
        if (milestoneAge === 66) return 5;
        return 0;
    };

    // กำหนด milestones ตาม input: auto (undefined), none ([]), or manual ([...ages])
    const milestones = reductionAges === undefined ? [entryAge + 1, 41, 51, 61, 66] : reductionAges;

    const reductionMap = new Map<number, number>();
    milestones.forEach(age => {
        if (age > entryAge && age <= 99) { // MAX_POLICY_AGE_TYPE
            const factor = getFactor(age, entryAge);
            if (factor > 0) {
                const newSA = Math.round(rpp * factor);
                if (!reductionMap.has(age) || newSA < (reductionMap.get(age) ?? Infinity)) {
                    reductionMap.set(age, newSA);
                }
            }
        }
    });
    
    reductionMap.forEach((newSumInsured, age) => {
        reductions.push({ age, newSumInsured });
    });

    return reductions.sort((a, b) => a.age - b.age);
};


// ... processIWealthyResultsToLTHC และ findOptimalIWealthyPremium เหมือนเดิม ...
export const processIWealthyResultsToLTHC = (healthPremiumsLocal: AnnualHealthPremiumDetail[], iWealthyAnnualDataLocal: OriginalIWealthyAnnualOutputRow[] | undefined, currentSelectedHealthPlansLocal: HealthPlanSelections, iWealthyInitialSALocal: number, iWealthyReductionsLocal: SumInsuredReductionRecord[]): AnnualLTHCOutputRow[] => {
    const illustration: AnnualLTHCOutputRow[] = [];
    if (!iWealthyAnnualDataLocal) return illustration;
    let currentActualIWealthySA = iWealthyInitialSALocal;
    for (const healthEntry of healthPremiumsLocal) {
        if (healthEntry.age > 99) break;
        const iWealthyYearData = iWealthyAnnualDataLocal.find(iw => iw.policyYear === healthEntry.year);
        if (!iWealthyYearData) {
            break;
        }
        if (illustration.length > 0 && (illustration[illustration.length - 1].iWealthyEoyAccountValue ?? 0) < 1.00) {
            break;
        }
        const applicableReductions = iWealthyReductionsLocal.filter(r => r.age <= healthEntry.age);
        if (applicableReductions.length > 0) {
            currentActualIWealthySA = applicableReductions[applicableReductions.length - 1].newSumInsured;
        }
        
        illustration.push({
            policyYear: healthEntry.year, age: healthEntry.age, lifeReadyPremium: healthEntry.lrPrem, lifeReadyDeathBenefit: currentSelectedHealthPlansLocal.lifeReadySA,
            iHealthyUltraPremium: healthEntry.ihuPrem, mebPremium: healthEntry.mebPrem, totalHealthPremium: healthEntry.totalPremium,
            iWealthyRpp: iWealthyYearData?.premiumRPPYear, iWealthyRtu: iWealthyYearData?.premiumRTUYear, iWealthyTotalPremium: iWealthyYearData?.totalPremiumYear,
            iWealthyWithdrawal: iWealthyYearData?.withdrawalYear, iWealthyEoyAccountValue: iWealthyYearData?.eoyAccountValue,
            iWealthyEoyDeathBenefit: iWealthyYearData?.eoyDeathBenefit, iWealthySumAssured: currentActualIWealthySA,
            iWealthyEOYCSV: iWealthyYearData?.eoyCashSurrenderValue,
            totalCombinedDeathBenefit: (iWealthyYearData?.eoyDeathBenefit ?? 0) + currentSelectedHealthPlansLocal.lifeReadySA,
            iWealthyPremiumCharge: iWealthyYearData.totalPremiumChargeYear,
            iWealthyCOI: iWealthyYearData.totalCOIYear,
            iWealthyAdminFee: iWealthyYearData.totalAdminFeeYear,
        });
    }
    return illustration;
};

export const findOptimalIWealthyPremium = async (entryAge: number, gender: Gender, allHealthPremiums: AnnualHealthPremiumDetail[], iWealthyPPT: number, investmentReturnRate: number, targetRppRtuRatio: string, saReductionStrategy: SAReductionStrategy, customWithdrawalStopAge: number | null = null): Promise<any> => {
    
    const isNoReduction = saReductionStrategy.type === 'none';
    let reductionAges: number[] | undefined;
    if (saReductionStrategy.type === 'manual') {
        reductionAges = saReductionStrategy.ages;
    } else if (saReductionStrategy.type === 'none') {
        reductionAges = [];
    } else { // 'auto'
        reductionAges = undefined;
    }

    const [rppPercStr, rtuPercStr] = targetRppRtuRatio.split('/');
    const rppRatio = parseFloat(rppPercStr) / 100;
    const rtuRatio = parseFloat(rtuPercStr) / 100;
    let totalExpectedWithdrawal = 0;
    const withdrawalPlanAuto: WithdrawalPlanRecord[] = [];
    const iWealthyEndAge = entryAge + iWealthyPPT;
    const autoWithdrawalStartAge = Math.max(60, iWealthyEndAge); 
    // กำหนดอายุสิ้นสุดการถอนเงิน ถ้าไม่ระบุมา ให้ใช้ 99 ปีตามปกติ
    const withdrawalStopAge = customWithdrawalStopAge ?? MAX_POLICY_AGE_TYPE;
    allHealthPremiums.forEach(hp => {
        if (hp.age >= autoWithdrawalStartAge && hp.age <= withdrawalStopAge && hp.totalPremium > 0) {
            totalExpectedWithdrawal += hp.totalPremium;
            withdrawalPlanAuto.push({ id: `wd-a-${hp.age}-${targetRppRtuRatio.replace('/', '')}`, type: 'annual', amount: hp.totalPremium, startAge: hp.age, endAge: hp.age, refType: 'age' });
        }
    });
    const frequencyChangesAuto: FrequencyChangeRecord[] = [{ id: `lthc-a-mth-y2-${targetRppRtuRatio.replace('/', '')}`, startAge: entryAge + 1, endAge: MAX_POLICY_AGE_TYPE, frequency: 'monthly', type: 'age' }];
    let totalPremiumThatWorksHeuristic: number | null = null;
    let divisor = 3.0; const ds = 0.1; const md = 0.5; const mhi = 30;
    for (let i = 0; i < mhi; i++) {
        let totalPremiumTrial = (totalExpectedWithdrawal / Math.max(divisor, 0.01)) / Math.max(iWealthyPPT, 1);
        let rppForCheck = Math.round(totalPremiumTrial * rppRatio);
        if (rppRatio > 0 && rppForCheck < MINIMUM_RPP) totalPremiumTrial = MINIMUM_RPP / rppRatio;
        totalPremiumTrial = Math.max(totalPremiumTrial, MINIMUM_RPP);
        totalPremiumTrial = Math.ceil(totalPremiumTrial / 100) * 100;
        const rppTrial = Math.round(totalPremiumTrial * rppRatio);
        const rtuTrial = Math.round(totalPremiumTrial * rtuRatio);
        if (rppRatio > 0 && rppTrial < MINIMUM_RPP) { divisor -= ds; if (divisor < md) break; continue; }
        const initialSA = Math.round(getSumInsuredFactor(entryAge) * rppTrial);
        const saReductions = generateSAReductionsForIWealthy(entryAge, rppTrial, reductionAges);
        const inputTrial: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: initialSA,
            rppPerYear: rppTrial, rtuPerYear: rtuTrial, assumedInvestmentReturnRate: investmentReturnRate / 100, 
            premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: saReductions,
            additionalInvestments: [], frequencyChanges: frequencyChangesAuto, withdrawalPlan: withdrawalPlanAuto,
        };
        try {
            const resultFromEngine = await generateIllustrationTables(inputTrial);
            if (checkIWealthySolvency(resultFromEngine.annual, withdrawalPlanAuto, isNoReduction)) { totalPremiumThatWorksHeuristic = totalPremiumTrial; break; }
            else { divisor -= ds; if (divisor < md) break; }
        } catch (e) { divisor -= ds; if (divisor < md) break; }
    }
    if (!totalPremiumThatWorksHeuristic) return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: `Heuristic failed (Ratio: ${targetRppRtuRatio})` };
    let searchHigh = totalPremiumThatWorksHeuristic;
    let searchLow = rppRatio > 0 ? Math.ceil((MINIMUM_RPP / rppRatio) / 100) * 100 : MINIMUM_RPP;
    searchLow = Math.max(searchLow, MINIMUM_RPP);
    let optimalTotal = searchHigh;
    const binaryIter = 20; const tol = 100;
    for (let i = 0; i < binaryIter && (searchHigh - searchLow > tol); i++) {
        let mid = Math.max(searchLow, Math.floor((searchLow + searchHigh) / 2 / 100) * 100);
        if (mid >= searchHigh && searchHigh > searchLow + tol) mid = searchHigh - tol;
        else if (mid <= searchLow && searchLow < searchHigh - tol) mid = searchLow + tol;
        if (mid === searchLow && mid === searchHigh) break;
        const rppBin = Math.round(mid * rppRatio); const rtuBin = Math.round(mid * rtuRatio);
        if (rppRatio > 0 && rppBin < MINIMUM_RPP) { searchLow = mid; continue; }
        const initialSAMid = Math.round(getSumInsuredFactor(entryAge) * rppBin);
        const saReductionsMid = generateSAReductionsForIWealthy(entryAge, rppBin, reductionAges);
        const inputMid: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: initialSAMid,
            rppPerYear: rppBin, rtuPerYear: rtuBin, assumedInvestmentReturnRate: investmentReturnRate / 100,
            premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: saReductionsMid,
            additionalInvestments: [], frequencyChanges: frequencyChangesAuto, withdrawalPlan: withdrawalPlanAuto,
        };
        let isSolvent = false;
        try {
            const resMid = await generateIllustrationTables(inputMid);
            // ✅✅✅ บรรทัดที่แก้ไขแล้ว ✅✅✅
            isSolvent = checkIWealthySolvency(resMid.annual, withdrawalPlanAuto, isNoReduction);
        } catch (e) { isSolvent = false; }
        if (isSolvent) { searchHigh = mid; optimalTotal = mid; } else { searchLow = mid; }
    }
    const finalRawRpp = optimalTotal * rppRatio;
    const finalRawRtu = optimalTotal * rtuRatio;
    const finalSolvedRpp = roundUpToNearestThousand(finalRawRpp);
    const finalSolvedRtu = roundUpToNearestThousand(finalRawRtu);
    if (rppRatio > 0 && finalSolvedRpp < MINIMUM_RPP) return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: `Final RPP ${finalSolvedRpp} below min.` };
    const finalInitialSA = Math.round(getSumInsuredFactor(entryAge) * finalSolvedRpp);
    const finalSaReductions = generateSAReductionsForIWealthy(entryAge, finalSolvedRpp, reductionAges);
    const finalInput: CalculationInput = {
        policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: finalInitialSA,
        rppPerYear: finalSolvedRpp, rtuPerYear: finalSolvedRtu, assumedInvestmentReturnRate: investmentReturnRate / 100,
        premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: finalSaReductions,
        additionalInvestments: [], frequencyChanges: frequencyChangesAuto, withdrawalPlan: withdrawalPlanAuto,
    };
    try {
        const finalIWealthyResult = await generateIllustrationTables(finalInput);
        if (checkIWealthySolvency(finalIWealthyResult.annual, withdrawalPlanAuto, isNoReduction)) {
            return { solvedTotalPremium: finalSolvedRpp + finalSolvedRtu, solvedRpp: finalSolvedRpp, solvedRtu: finalSolvedRtu, finalIWealthyAnnualData: finalIWealthyResult.annual };
        } else {
            return { solvedTotalPremium: finalSolvedRpp + finalSolvedRtu, solvedRpp: finalSolvedRpp, solvedRtu: finalSolvedRtu, errorMessage: `Final check with rounded RPP/RTU (${targetRppRtuRatio}) failed solvency.` };
        }
    } catch (error) {
        return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: error instanceof Error ? error.message : "Error in final solver calculation." };
    }
};

export const calculateManualPlan = async (currentEntryAge: number, gender: Gender, plans: HealthPlanSelections, rpp: number, rtu: number, invReturn: number, ppt: number, withdrawalStartAge: number, sumInsuredReductions: SumInsuredReductionRecord[], policyOrigin: PolicyOriginMode, originalEntryAgeForLR?: number): Promise<AnnualLTHCOutputRow[]> => {
    const rppActual = Math.max(rpp, MINIMUM_RPP);
    const allHealthPremiumsData = calculateAllHealthPremiums(currentEntryAge, gender, plans, policyOrigin, originalEntryAgeForLR);
    const withdrawalPlan: WithdrawalPlanRecord[] = [];
    allHealthPremiumsData.forEach(hp => { if (hp.age >= withdrawalStartAge && hp.age <= MAX_POLICY_AGE_TYPE && hp.totalPremium > 0) withdrawalPlan.push({id: `wd-m-${hp.age}`, type: 'annual', amount: hp.totalPremium, startAge: hp.age, endAge: hp.age, refType: 'age' }); });
    const frequencyChanges: FrequencyChangeRecord[] = [{ id: 'lthc-m-mth-y2', startAge: currentEntryAge + 1, endAge: MAX_POLICY_AGE_TYPE, frequency: 'monthly', type: 'age' }];
    const initialSA = Math.round(getSumInsuredFactor(currentEntryAge) * rppActual);
    const input: CalculationInput = {
        policyholderAge: currentEntryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: initialSA,
        rppPerYear: rppActual, rtuPerYear: rtu, assumedInvestmentReturnRate: invReturn / 100,
        premiumPayingTermYears: ppt, pausePeriods: [], 
        sumInsuredReductions: sumInsuredReductions,
        additionalInvestments: [], frequencyChanges: frequencyChanges, withdrawalPlan: withdrawalPlan,
    };
    console.log("FINAL INPUT to Calculation Engine:", input);
    try {
        const iWealthyResult = await generateIllustrationTables(input);
        if (!checkIWealthySolvency(iWealthyResult.annual, withdrawalPlan)) {
            console.warn("Manual plan might not be solvent for all withdrawals. LTHC illustration will be generated but may show issues.");
        }
        return processIWealthyResultsToLTHC(allHealthPremiumsData, iWealthyResult.annual, plans, initialSA, sumInsuredReductions);
    } catch (error) {
        console.error("Error in calculateManualPlan within useLthcCalculations:", error);
        throw error;
    }
};

async function solveForBestOutcomeWithNoReduction(
    entryAge: number, 
    gender: Gender, 
    allHealthPremiums: AnnualHealthPremiumDetail[], 
    iWealthyPPT: number, 
    investmentReturnRate: number, 
    targetRppRtuRatio: string, 
    saReductionStrategy: SAReductionStrategy
) {
    console.log("--- ENTERING SUPER SOLVER for No-Reduction Mode ---");

    let latestSuccessfulResult: any = null;
    let latestSuccessfulStopAge: number | null = null;
    
    // เริ่มค้นหาจากล่างขึ้นบน (Bottom-Up)
    // เราอาจเริ่มจากอายุที่ต่ำกว่านี้ถ้าจำเป็น เช่น 85
    const startAge = 88;
    const endAge = 98;

    for (let stopAge = startAge; stopAge <= endAge; stopAge++) {
        console.log(`\n--- Super Solver: Trying to fund withdrawals until age ${stopAge} ---`);
        
        const result = await findOptimalIWealthyPremium(
            entryAge, gender, allHealthPremiums, iWealthyPPT, 
            investmentReturnRate, targetRppRtuRatio, saReductionStrategy,
            stopAge // ✅ ส่งอายุที่ต้องการให้หยุดถอนเข้าไป
        );

        if (result && !result.errorMessage) {
            // ถ้าสำเร็จ, เก็บผลลัพธ์นี้ไว้เป็น "คำตอบที่ดีที่สุด" ในปัจจุบัน
            console.log(`✅ SUCCESS: Found a solution that funds until age ${stopAge}. RPP: ${result.solvedRpp}`);
            latestSuccessfulResult = result;
            latestSuccessfulStopAge = stopAge;
        } else {
            // ถ้าล้มเหลว, หมายความว่าเราไปต่อไม่ได้แล้ว
            console.log(`🛑 FAILURE: Cannot fund until age ${stopAge}. Stopping search.`);
            break; // หยุด Loop ทันที
        }
    }

    if (latestSuccessfulResult) {
        console.log(`--- SUPER SOLVER FINISHED: Best outcome is funding until age ${latestSuccessfulStopAge} ---`);
        // เพิ่มข้อมูลเกี่ยวกับอายุที่สำเร็จเข้าไปในผลลัพธ์เพื่อนำไปแสดงผลได้
        latestSuccessfulResult.bestWithdrawalStopAge = latestSuccessfulStopAge;
        return latestSuccessfulResult;
    } else {
        // กรณีที่แม้แต่จะพยายามจ่ายถึงอายุ 88 ก็ยังล้มเหลว
        console.error("--- SUPER SOLVER FAILED: Could not find any viable solution. ---");
        return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: `Heuristic failed even with best-effort approach.` };
    }
}

// =================================================================================
// +++ MAIN CALCULATION DISPATCHER +++
// =================================================================================

export const calculateLthcPlan = async (
    params: {
        entryAge: number; gender: Gender; healthPlans: HealthPlanSelections; policyOrigin: PolicyOriginMode;
        existingEntryAge?: number; fundingSource: FundingSource; iWealthyMode: IWealthyMode;
        pensionMode: PensionMode;
        iWealthyOptions: { invReturn: number; ppt: number; rppRtuRatio: string; saReductionStrategy: SAReductionStrategy; manualRpp: number; manualRtu: number; manualWithdrawalStartAge: number; };
        pensionOptions: PensionFundingOptions; manualPensionPremium: number;
    }
): Promise<{
    outputIllustration: AnnualLTHCOutputRow[] | null;
    minPremiumResult?: number; rppResult?: number; rtuResult?: number;
    solvedPensionSA?: number; solvedPensionPremium?: number;
    errorMsg?: string;
}> => {
    const { entryAge, gender, healthPlans, policyOrigin, existingEntryAge, fundingSource, iWealthyMode, pensionMode, iWealthyOptions, pensionOptions, manualPensionPremium } = params;
    const allHealthPremiumsData = calculateAllHealthPremiums(entryAge, gender, healthPlans, policyOrigin, existingEntryAge);

    try {
        switch (fundingSource) {
            case 'hybrid': {
                const manualPensionResult = await calculateManualPensionPlan(entryAge, gender, allHealthPremiumsData, pensionOptions, manualPensionPremium, healthPlans);
                if (!manualPensionResult.pensionIllustration) {
                    throw new Error("ไม่สามารถคำนวณส่วนของแผนบำนาญในโหมด Hybrid ได้");
                }
                const iWealthyTargetPremiums = allHealthPremiumsData.map(hp => {
                    const pensionPayout = manualPensionResult.pensionIllustration.find((p: any) => p.age === hp.age)?.pensionPayout ?? 0;
                    const shortfall = Math.max(0, hp.totalPremium - pensionPayout);
                    return { ...hp, totalPremium: shortfall };
                });
                const iWealthySolverResult = await findOptimalIWealthyPremium(
                    entryAge, gender, iWealthyTargetPremiums, 
                    iWealthyOptions.ppt, iWealthyOptions.invReturn, iWealthyOptions.rppRtuRatio,
                    iWealthyOptions.saReductionStrategy // ส่ง strategy เข้าไป
                );
                if (!iWealthySolverResult.finalIWealthyAnnualData) {
                    throw new Error(`ไม่สามารถคำนวณส่วนของ iWealthy ในโหมด Hybrid ได้: ${iWealthySolverResult.errorMessage}`);
                }
                const finalIllustration = processHybridResultsToLTHC(allHealthPremiumsData, manualPensionResult.pensionIllustration, iWealthySolverResult.finalIWealthyAnnualData, healthPlans);
                return {
                    outputIllustration: finalIllustration,
                    solvedPensionSA: manualPensionResult.solvedSA,
                    solvedPensionPremium: manualPensionPremium,
                    minPremiumResult: iWealthySolverResult.solvedTotalPremium,
                    rppResult: iWealthySolverResult.solvedRpp,
                    rtuResult: iWealthySolverResult.solvedRtu,
                };
            }

            case 'pension':
                if (pensionMode === 'automatic') {
                    const pensionSolverResult = await findOptimalPensionPlan(entryAge, gender, allHealthPremiumsData, pensionOptions);
                    const processedOutput = processPensionResultsToLTHC(allHealthPremiumsData, pensionSolverResult.pensionIllustration, healthPlans);
                    return { outputIllustration: processedOutput, solvedPensionSA: pensionSolverResult.solvedSA, solvedPensionPremium: pensionSolverResult.solvedAnnualPremium, errorMsg: pensionSolverResult.errorMessage };
                } else { // Manual Pension
                    const manualResult = await calculateManualPensionPlan(entryAge, gender, allHealthPremiumsData, pensionOptions, manualPensionPremium, healthPlans);
                    return { ...manualResult, solvedPensionPremium: manualPensionPremium };
                }

            case 'iWealthy': {
                const strategy = iWealthyOptions.saReductionStrategy;
                if (iWealthyMode === 'automatic') {
                    let solverResult;

                    // ✅ ตรวจสอบเงื่อนไขพิเศษ (ไม่ลดทุน และ RPP 100%)
                    if (strategy.type === 'none' && iWealthyOptions.rppRtuRatio === '100/0') {
                        // ✅ ถ้าใช่, เรียกใช้ Super Solver ตัวใหม่
                        solverResult = await solveForBestOutcomeWithNoReduction(
                            entryAge, gender, allHealthPremiumsData, 
                            iWealthyOptions.ppt, iWealthyOptions.invReturn, iWealthyOptions.rppRtuRatio,
                            strategy
                        );
                    } else {
                        // ✅ ถ้าเป็นกรณีอื่นๆ, เรียกใช้ Solver ตัวเดิมตามปกติ
                        solverResult = await findOptimalIWealthyPremium(
                            entryAge, gender, allHealthPremiumsData, 
                            iWealthyOptions.ppt, iWealthyOptions.invReturn, iWealthyOptions.rppRtuRatio,
                            strategy,
                            null // ไม่มีการกำหนดอายุหยุดถอนเอง
                        );
                    }

                    if (solverResult.finalIWealthyAnnualData) {
                        const rppResult = solverResult.solvedRpp || 0;
                        const initialSAForDisplay = Math.round(getSumInsuredFactor(entryAge) * rppResult);
                        
                        let finalReductions: SumInsuredReductionRecord[] = [];
                        if (strategy.type === 'manual') {
                            finalReductions = generateSAReductionsForIWealthy(entryAge, rppResult, strategy.ages);
                        } else if (strategy.type === 'auto') {
                            finalReductions = generateSAReductionsForIWealthy(entryAge, rppResult, undefined);
                        } else { // 'none'
                             finalReductions = generateSAReductionsForIWealthy(entryAge, rppResult, []);
                        }

                        const processedOutput = processIWealthyResultsToLTHC(allHealthPremiumsData, solverResult.finalIWealthyAnnualData, healthPlans, initialSAForDisplay, finalReductions);
                        return { outputIllustration: processedOutput, minPremiumResult: solverResult.solvedTotalPremium, rppResult: solverResult.solvedRpp, rtuResult: solverResult.solvedRtu, errorMsg: solverResult.errorMessage };
                    } else {
                        return { outputIllustration: null, minPremiumResult: solverResult.solvedTotalPremium, rppResult: solverResult.solvedRpp, rtuResult: solverResult.solvedRtu, errorMsg: solverResult.errorMessage || "Automatic iWealthy calculation failed." };
                    }
                } else { // Manual iWealthy
                    let reductionsForManual: SumInsuredReductionRecord[] = [];
                    if (strategy.type === 'auto') {
                        reductionsForManual = generateSAReductionsForIWealthy(entryAge, iWealthyOptions.manualRpp, undefined);
                    } else if (strategy.type === 'manual') {
                        reductionsForManual = generateSAReductionsForIWealthy(entryAge, iWealthyOptions.manualRpp, strategy.ages);
                    } else { // 'none'
                         reductionsForManual = generateSAReductionsForIWealthy(entryAge, iWealthyOptions.manualRpp, []);
                    }

                    const manualResultData = await calculateManualPlan(
                        entryAge, gender, healthPlans, 
                        iWealthyOptions.manualRpp, iWealthyOptions.manualRtu,
                        iWealthyOptions.invReturn, iWealthyOptions.ppt, iWealthyOptions.manualWithdrawalStartAge, 
                        reductionsForManual, 
                        policyOrigin, existingEntryAge
                    );
                    return { outputIllustration: manualResultData };
                }
            }

            case 'none':
            default:
                const illustration: AnnualLTHCOutputRow[] = allHealthPremiumsData.map(hp => ({
                    policyYear: hp.year, age: hp.age,
                    lifeReadyPremium: hp.lrPrem, iHealthyUltraPremium: hp.ihuPrem, mebPremium: hp.mebPrem,
                    totalHealthPremium: hp.totalPremium,
                    lifeReadyDeathBenefit: healthPlans.lifeReadySA,
                }));
                return { outputIllustration: illustration };
        }
    } catch (err) {
        return { outputIllustration: null, errorMsg: err instanceof Error ? err.message : 'An unexpected error occurred during calculation.' };
    }
};