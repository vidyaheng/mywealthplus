// src/hooks/useLthcCalculations.ts

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
    AnnualLTHCOutputRow, AnnualHealthPremiumDetail, PolicyOriginMode,
} from './useLthcTypes';
import {
    MINIMUM_ALLOWABLE_SYSTEM_RPP_TYPE as MINIMUM_RPP,
    MAX_POLICY_AGE_TYPE, MEB_TERMINATION_AGE_TYPE,
} from './useLthcTypes';
import { IHEALTHY_ULTRA_RATES } from '../data/iHealthyUltraRates';

interface OptimalSolverResult {
    solvedTotalPremium: number | null;
    solvedRpp: number | null;
    solvedRtu: number | null;
    finalIWealthyAnnualData?: OriginalIWealthyAnnualOutputRow[];
    errorMessage?: string;
}

const roundUpToNearestThousand = (num: number): number => {
    if (num <= 0) return 0;
    return Math.ceil(num / 1000) * 1000;
};

export const calculateAllHealthPremiums = (
    currentPolicyholderAge: number, gender: Gender, plans: HealthPlanSelections,
    policyOrigin: PolicyOriginMode, originalEntryAgeForLR?: number
): AnnualHealthPremiumDetail[] => {
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

export const generateSAReductionsForIWealthy = (
    entryAge: number, rpp: number, reductionAges?: number[]
): SumInsuredReductionRecord[] => {
    const reductions: SumInsuredReductionRecord[] = [];
    if (rpp <= 0) return reductions;
    const getFactor = (milestoneAge: number, currentEntryAge: number): number => {
        if (milestoneAge === currentEntryAge + 1) {
            if (currentEntryAge <= 40) return 40; if (currentEntryAge <= 50) return 30;
            if (currentEntryAge <= 60) return 20; if (currentEntryAge <= 65) return 15; return 5;
        }
        if (milestoneAge === 41) return 30; if (milestoneAge === 51) return 20;
        if (milestoneAge === 61) return 15; if (milestoneAge === 66) return 5; return 0;
    };
    const milestones = reductionAges ?? [entryAge + 1, 41, 51, 61, 66];
    const reductionMap = new Map<number, number>();
    milestones.forEach(age => {
        if (age > entryAge && age <= MAX_POLICY_AGE_TYPE) {
            const factor = getFactor(age, entryAge);
            if (factor > 0) {
                const newSA = Math.round(rpp * factor);
                if (!reductionMap.has(age) || newSA < (reductionMap.get(age) ?? Infinity)) {
                    reductionMap.set(age, newSA);
                }
            }
        }
    });
    reductionMap.forEach((newSumInsured, age) => reductions.push({ age, newSumInsured }));
    return reductions.sort((a, b) => a.age - b.age);
};

const checkIWealthySolvency = (
    iWealthyAnnualData: OriginalIWealthyAnnualOutputRow[] | undefined, plannedWithdrawals: WithdrawalPlanRecord[]
): boolean => {
    if (!iWealthyAnnualData || iWealthyAnnualData.length === 0) return false;
    const MINIMUM_REQUIRED_VALUE = 500000;
    const START_AGE_FOR_MINIMUM_VALUE_CHECK = 65;
    const EXPECTED_LAST_POLICY_AGE = MAX_POLICY_AGE_TYPE;
    const lastYearData = iWealthyAnnualData[iWealthyAnnualData.length - 1];
    if (lastYearData.age < EXPECTED_LAST_POLICY_AGE) return false;
    const withdrawalMap = new Map<number, number>();
    plannedWithdrawals.forEach(wd => { if (wd.type === 'annual' && wd.amount > 0) withdrawalMap.set(wd.startAge, (withdrawalMap.get(wd.startAge) || 0) + wd.amount); });
    for (const row of iWealthyAnnualData) {
        if ((row.eoyAccountValue ?? -1) < -0.005) return false;
        const plannedAmountForYear = withdrawalMap.get(row.age);
        if (plannedAmountForYear && plannedAmountForYear > 0) {
            if ((row.withdrawalYear || 0) < (plannedAmountForYear * 0.999) && (row.eoyAccountValue ?? 0) < 1.00) return false;
        }
        if (row.age >= START_AGE_FOR_MINIMUM_VALUE_CHECK && (row.eoyAccountValue ?? -1) < MINIMUM_REQUIRED_VALUE) return false;
    }
    return !((lastYearData.age >= EXPECTED_LAST_POLICY_AGE && lastYearData.age >= START_AGE_FOR_MINIMUM_VALUE_CHECK) && (lastYearData.eoyAccountValue ?? -1) < MINIMUM_REQUIRED_VALUE);
};

const processIWealthyResultsToLTHC = (
    healthPremiumsLocal: AnnualHealthPremiumDetail[], iWealthyAnnualDataLocal: OriginalIWealthyAnnualOutputRow[] | undefined,
    currentSelectedHealthPlansLocal: HealthPlanSelections, iWealthyInitialSALocal: number, iWealthyReductionsLocal: SumInsuredReductionRecord[]
): AnnualLTHCOutputRow[] => {
    const illustration: AnnualLTHCOutputRow[] = [];
    if (!iWealthyAnnualDataLocal) return illustration;
    let currentActualIWealthySA = iWealthyInitialSALocal;
    for (const healthEntry of healthPremiumsLocal) {
        if (healthEntry.age > 99) break;
        const iWealthyYearData = iWealthyAnnualDataLocal.find(iw => iw.policyYear === healthEntry.year);
        const applicableReductions = iWealthyReductionsLocal.filter(r => r.age <= healthEntry.age);
        if (applicableReductions.length > 0) currentActualIWealthySA = applicableReductions[applicableReductions.length - 1].newSumInsured;
        else if (healthEntry.year === 1) currentActualIWealthySA = iWealthyInitialSALocal;
        illustration.push({
            policyYear: healthEntry.year, age: healthEntry.age, lifeReadyPremium: healthEntry.lrPrem, lifeReadyDeathBenefit: currentSelectedHealthPlansLocal.lifeReadySA,
            iHealthyUltraPremium: healthEntry.ihuPrem, mebPremium: healthEntry.mebPrem, totalHealthPremium: healthEntry.totalPremium,
            iWealthyRpp: iWealthyYearData?.premiumRPPYear, iWealthyRtu: iWealthyYearData?.premiumRTUYear, iWealthyTotalPremium: iWealthyYearData?.totalPremiumYear,
            iWealthyWithdrawal: iWealthyYearData?.withdrawalYear, iWealthyEoyAccountValue: iWealthyYearData?.eoyAccountValue,
            iWealthyEoyDeathBenefit: iWealthyYearData?.eoyDeathBenefit, iWealthySumAssured: currentActualIWealthySA,
            iWealthyEOYCSV: iWealthyYearData?.eoyCashSurrenderValue, iWealthyPremChargeRPP: iWealthyYearData?.premiumChargeRPPYear,
            iWealthyPremChargeRTU: iWealthyYearData?.premiumChargeRTUYear, iWealthyPremChargeTotal: iWealthyYearData?.totalPremiumChargeYear,
            iWealthyCOI: iWealthyYearData?.totalCOIYear, iWealthyAdminFee: iWealthyYearData?.totalAdminFeeYear, iWealthyTotalFees: iWealthyYearData?.totalFeesYear,
            iWealthyInvestmentBase: iWealthyYearData?.investmentBaseYear, iWealthyInvestmentReturn: iWealthyYearData?.investmentReturnYear,
            iWealthyRoyaltyBonus: iWealthyYearData?.royaltyBonusYear, totalCombinedDeathBenefit: (iWealthyYearData?.eoyDeathBenefit ?? 0) + currentSelectedHealthPlansLocal.lifeReadySA,
        });
    }
    return illustration;
};

const findOptimalIWealthyPremium = async (
    entryAge: number, gender: Gender, allHealthPremiums: AnnualHealthPremiumDetail[],
    iWealthyPPT: number, investmentReturnRate: number, targetRppRtuRatio: string,
    customReductionAges?: number[]
): Promise<OptimalSolverResult> => {
    const [rppPercStr, rtuPercStr] = targetRppRtuRatio.split('/');
    const rppRatio = parseFloat(rppPercStr) / 100;
    const rtuRatio = parseFloat(rtuPercStr) / 100;
    let totalExpectedWithdrawal = 0;
    const withdrawalPlanAuto: WithdrawalPlanRecord[] = [];
    const iWealthyEndAge = entryAge + iWealthyPPT;
    const autoWithdrawalStartAge = Math.max(61, iWealthyEndAge);
    allHealthPremiums.forEach(hp => {
        if (hp.age >= autoWithdrawalStartAge && hp.age <= MAX_POLICY_AGE_TYPE && hp.totalPremium > 0) {
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
        const saReductions = generateSAReductionsForIWealthy(entryAge, rppTrial, customReductionAges);
        const inputTrial: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: initialSA,
            rppPerYear: rppTrial, rtuPerYear: rtuTrial, assumedInvestmentReturnRate: investmentReturnRate / 100, 
            premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: saReductions,
            additionalInvestments: [], frequencyChanges: frequencyChangesAuto, withdrawalPlan: withdrawalPlanAuto,
        };
        try {
            const resultFromEngine = await generateIllustrationTables(inputTrial);
            if (checkIWealthySolvency(resultFromEngine.annual, withdrawalPlanAuto)) { totalPremiumThatWorksHeuristic = totalPremiumTrial; break; }
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
        const saReductionsMid = generateSAReductionsForIWealthy(entryAge, rppBin, customReductionAges);
        const inputMid: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: initialSAMid,
            rppPerYear: rppBin, rtuPerYear: rtuBin, assumedInvestmentReturnRate: investmentReturnRate / 100,
            premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: saReductionsMid,
            additionalInvestments: [], frequencyChanges: frequencyChangesAuto, withdrawalPlan: withdrawalPlanAuto,
        };
        let isSolvent = false;
        try {
            const resMid = await generateIllustrationTables(inputMid);
            isSolvent = checkIWealthySolvency(resMid.annual, withdrawalPlanAuto);
        } catch (e) { isSolvent = false; }
        if (isSolvent) { searchHigh = mid; optimalTotal = mid; } else { searchLow = mid; }
    }
    const finalRawRpp = optimalTotal * rppRatio;
    const finalRawRtu = optimalTotal * rtuRatio;
    const finalSolvedRpp = roundUpToNearestThousand(finalRawRpp);
    const finalSolvedRtu = roundUpToNearestThousand(finalRawRtu);
    if (rppRatio > 0 && finalSolvedRpp < MINIMUM_RPP) return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: `Final RPP ${finalSolvedRpp} below min.` };
    const finalInitialSA = Math.round(getSumInsuredFactor(entryAge) * finalSolvedRpp);
    const finalSaReductions = generateSAReductionsForIWealthy(entryAge, finalSolvedRpp, customReductionAges);
    const finalInput: CalculationInput = {
        policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: finalInitialSA,
        rppPerYear: finalSolvedRpp, rtuPerYear: finalSolvedRtu, assumedInvestmentReturnRate: investmentReturnRate / 100,
        premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: finalSaReductions,
        additionalInvestments: [], frequencyChanges: frequencyChangesAuto, withdrawalPlan: withdrawalPlanAuto,
    };
    try {
        const finalIWealthyResult = await generateIllustrationTables(finalInput);
        if (checkIWealthySolvency(finalIWealthyResult.annual, withdrawalPlanAuto)) {
            return {
                solvedTotalPremium: finalSolvedRpp + finalSolvedRtu, solvedRpp: finalSolvedRpp, solvedRtu: finalSolvedRtu,
                finalIWealthyAnnualData: finalIWealthyResult.annual
            };
        } else {
            return {
                solvedTotalPremium: finalSolvedRpp + finalSolvedRtu, solvedRpp: finalSolvedRpp, solvedRtu: finalSolvedRtu,
                errorMessage: `Final check with rounded RPP/RTU (${targetRppRtuRatio}) failed solvency.`
            };
        }
    } catch (error) {
        return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: error instanceof Error ? error.message : "Error in final solver calculation." };
    }
};

export const calculateManualPlan = async (
    currentEntryAge: number, gender: Gender, plans: HealthPlanSelections,
    rpp: number, rtu: number, invReturn: number, ppt: number, withdrawalStartAge: number,
    sumInsuredReductions: SumInsuredReductionRecord[],
    policyOrigin: PolicyOriginMode, originalEntryAgeForLR?: number
): Promise<AnnualLTHCOutputRow[]> => {
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

export const calculateAutomaticPlan = async (
    currentEntryAge: number, gender: Gender, plans: HealthPlanSelections,
    invReturn: number, currentAutoPPT: number, currentRppRtuRatio: string,
    customReductionAges: number[] | undefined,
    policyOrigin: PolicyOriginMode, originalEntryAgeForLR?: number
): Promise<{
    outputIllustration: AnnualLTHCOutputRow[] | null;
    minPremiumResult?: number;
    rppResult?: number;
    rtuResult?: number;
    errorMsg?: string;
}> => {
    const allHealthPremiumsData = calculateAllHealthPremiums(currentEntryAge, gender, plans, policyOrigin, originalEntryAgeForLR);
    const solverResult = await findOptimalIWealthyPremium(
        currentEntryAge, gender, allHealthPremiumsData, currentAutoPPT, invReturn, currentRppRtuRatio,
        customReductionAges
    );
    if (solverResult.finalIWealthyAnnualData) {
        const initialSAForDisplay = Math.round(getSumInsuredFactor(currentEntryAge) * (solverResult.solvedRpp || 0));
        const saReductionsForDisplay = generateSAReductionsForIWealthy(
            currentEntryAge, 
            (solverResult.solvedRpp || 0), 
            customReductionAges
        );
        const processedOutput = processIWealthyResultsToLTHC(
            allHealthPremiumsData, solverResult.finalIWealthyAnnualData,
            plans, initialSAForDisplay, saReductionsForDisplay
        );
        return {
            outputIllustration: processedOutput,
            minPremiumResult: solverResult.solvedTotalPremium ?? undefined,
            rppResult: solverResult.solvedRpp ?? undefined,
            rtuResult: solverResult.solvedRtu ?? undefined,
            errorMsg: solverResult.errorMessage ?? undefined,
        };
    } else {
        return {
            outputIllustration: null,
            minPremiumResult: solverResult.solvedTotalPremium ?? undefined,
            rppResult: solverResult.solvedRpp ?? undefined,
            rtuResult: solverResult.solvedRtu ?? undefined,
            errorMsg: solverResult.errorMessage || "Automatic calculation failed.",
        };
    }
};