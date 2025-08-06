// src/hooks/useCiCalculations.ts

// --- REMOVED: ไม่ต้อง import useCallback แล้ว ---
// import { useCallback } from 'react';

// --- Imports ---
import {
    generateIllustrationTables,
    getSumInsuredFactor,
} from '@/lib/calculations';
import { calculateAllCiPremiumsSchedule } from '@/components/ci/utils/ciScheduleCalcs';
import type {
    Gender,
    CiPlanSelections,
    AnnualCiPremiumDetail,
    CalculationInput,
    IWealthyAnnualOutputRow,
    AnnualCiOutputRow,
    WithdrawalPlanRecord,
    SumInsuredReductionRecord,
    FrequencyChangeRecord,
    PolicyOriginMode,
} from '@/components/ci/types/useCiTypes';

// --- Constants ---
const MINIMUM_RPP = 18000;
const MAX_POLICY_AGE_TYPE = 98;

// --- Helper Functions (internal to this file) ---
const roundUpToNearestThousand = (num: number): number => {
    if (num <= 0) return 0;
    return Math.ceil(num / 1000) * 1000;
};

const generateSAReductionsForIWealthy = (
    entryAge: number,
    rpp: number
): SumInsuredReductionRecord[] => {
    const reductions: SumInsuredReductionRecord[] = [];
    if (rpp <= 0) return reductions;
    const getReductionFactor = (milestoneAge: number, currentEntryAge: number): number => {
        if (milestoneAge === currentEntryAge + 1) {
            if (currentEntryAge <= 40) return 40;
            if (currentEntryAge <= 50) return 30;
            if (currentEntryAge <= 60) return 20;
            if (currentEntryAge <= 65) return 15;
            return 5;
        }
        if (milestoneAge === 41 && currentEntryAge < 41) return 30;
        if (milestoneAge === 51 && currentEntryAge < 51) return 20;
        if (milestoneAge === 61 && currentEntryAge < 61) return 15;
        if (milestoneAge === 66 && currentEntryAge < 66) return 5;
        return 0;
    };
    const milestones = [entryAge + 1, 41, 51, 61, 66];
    const reductionMap = new Map<number, number>();
    milestones.forEach(ageOfReduction => {
        if (ageOfReduction > entryAge && ageOfReduction <= MAX_POLICY_AGE_TYPE) {
            const factor = getReductionFactor(ageOfReduction, entryAge);
            if (factor > 0) {
                const newSA = Math.max(0, Math.round(rpp * factor));
                if (!reductionMap.has(ageOfReduction) || newSA < (reductionMap.get(ageOfReduction) ?? Infinity)) {
                    reductionMap.set(ageOfReduction, newSA);
                }
            }
        }
    });
    reductionMap.forEach((newSumInsured, age) => reductions.push({ age, newSumInsured }));
    return reductions.sort((a, b) => a.age - b.age);
};

const checkIWealthySolvencyCi = (
    iWealthyAnnualData: IWealthyAnnualOutputRow[] | undefined,
    plannedWithdrawals: WithdrawalPlanRecord[],
    targetAgeForValueCheck: number = MAX_POLICY_AGE_TYPE
): boolean => {
    if (!iWealthyAnnualData || iWealthyAnnualData.length === 0) {
        return false;
    }

    const lastYearData = iWealthyAnnualData[iWealthyAnnualData.length - 1];
    if (lastYearData.age < targetAgeForValueCheck) {
        return false;
    }
    if ((lastYearData.eoyAccountValue ?? 0) < 0) return false;

    const withdrawalMapByAge = new Map<number, number>();
    plannedWithdrawals.forEach(wd => {
        for (let age = wd.startAge; age <= wd.endAge; age++) {
            withdrawalMapByAge.set(age, (withdrawalMapByAge.get(age) || 0) + wd.amount);
        }
    });

    for (const row of iWealthyAnnualData) {
        if (row.age > targetAgeForValueCheck) continue;

        if ((row.eoyAccountValue ?? -1) < -0.005 && row.age < targetAgeForValueCheck) {
            return false;
        }
        const plannedAmountForYear = withdrawalMapByAge.get(row.age);
        if (plannedAmountForYear && plannedAmountForYear > 0) {
            if (((row.withdrawalYear ?? 0) < (plannedAmountForYear * 0.999)) && ((row.eoyAccountValue ?? 0) >= 1.00)) {
                return false;
            }
        }
    }

    const finalYearDataForTarget = iWealthyAnnualData.find(row => row.age === targetAgeForValueCheck);
    if (!finalYearDataForTarget) {
        return false;
    }

    if (finalYearDataForTarget.eoyAccountValue <= 500000) {
        return false;
    }
    
    return true;
};

const processIWealthyResultsToCi = (
    ciPremiumsSchedule: AnnualCiPremiumDetail[],
    iWealthyRawAnnualData: IWealthyAnnualOutputRow[] | undefined,
    ciSelections: CiPlanSelections,
    iWealthyInitialSA: number,
    iWealthySaReductions: SumInsuredReductionRecord[]
): AnnualCiOutputRow[] => {
    const illustration: AnnualCiOutputRow[] = [];
    const iWealthyDataMap = new Map<number, IWealthyAnnualOutputRow>();
    if (iWealthyRawAnnualData) {
        iWealthyRawAnnualData.forEach(iw => iWealthyDataMap.set(iw.age, iw));
    }
    for (const ciRow of ciPremiumsSchedule) {
        if (ciRow.age > MAX_POLICY_AGE_TYPE + 1 && iWealthyRawAnnualData) break;
        if (ciRow.age > MAX_POLICY_AGE_TYPE && !iWealthyRawAnnualData && ciPremiumsSchedule.length > MAX_POLICY_AGE_TYPE - ciRow.age +1) {
            if(ciRow.age > MAX_POLICY_AGE_TYPE) continue;
        }
        
        const iWealthyYearData = iWealthyDataMap.get(ciRow.age);
        let currentActualIWealthySA = iWealthyInitialSA;
        const applicableReductions = iWealthySaReductions.filter(r => r.age <= ciRow.age);
        if (applicableReductions.length > 0) {
            currentActualIWealthySA = applicableReductions[applicableReductions.length - 1].newSumInsured;
        }
        
        const ciRidersDeathBenefit =
        (ciSelections.mainRiderChecked ? ciSelections.lifeReadySA : 0) +
        (ciSelections.icareChecked ? 100000 : 0) +
        (ciSelections.ishieldChecked ? ciSelections.ishieldSA : 0) +
        (ciSelections.dciChecked ? ciSelections.dciSA : 0);
        
        illustration.push({
            policyYear: ciRow.policyYear, age: ciRow.age,
            lifeReadyPremiumPaid: ciRow.lifeReadyPremium,
            ciRidersPremiumPaid: Math.round((ciRow.icarePremium || 0) + (ciRow.ishieldPremium || 0) + (ciRow.rokraiPremium || 0) + (ciRow.dciPremium || 0)),
            totalCiPackagePremiumPaid: Math.round(ciRow.totalCiPremium),
            iWealthyRpp: iWealthyYearData?.premiumRPPYear, iWealthyRtu: iWealthyYearData?.premiumRTUYear,
            iWealthyTotalPremium: iWealthyYearData?.totalPremiumYear, iWealthyWithdrawal: iWealthyYearData?.withdrawalYear,
            iWealthyEoyAccountValue: iWealthyYearData?.eoyAccountValue, iWealthyEoyDeathBenefit: iWealthyYearData?.eoyDeathBenefit,
            iWealthySumAssured: iWealthyYearData?.eoySumInsured ?? currentActualIWealthySA,
            iWealthyEOYCSV: iWealthyYearData?.eoyCashSurrenderValue,
            iWealthyPremChargeRPP: iWealthyYearData?.premiumChargeRPPYear, iWealthyPremChargeRTU: iWealthyYearData?.premiumChargeRTUYear,
            iWealthyPremChargeTotal: iWealthyYearData?.totalPremiumChargeYear, iWealthyCOI: iWealthyYearData?.totalCOIYear,
            iWealthyAdminFee: iWealthyYearData?.totalAdminFeeYear, iWealthyTotalFees: iWealthyYearData?.totalFeesYear,
            iWealthyInvestmentBase: iWealthyYearData?.investmentBaseYear, iWealthyInvestmentReturn: iWealthyYearData?.investmentReturnYear,
            iWealthyRoyaltyBonus: iWealthyYearData?.royaltyBonusYear,
            totalCombinedDeathBenefit: (iWealthyYearData?.eoyDeathBenefit ?? 0) + ciRidersDeathBenefit,
        });
    }
    return illustration;
};

interface OptimalCiSolverResult {
    solvedTotalPremium: number | null;
    solvedRpp: number | null;
    solvedRtu: number | null;
    finalIWealthyAnnualData?: IWealthyAnnualOutputRow[];
    errorMessage?: string;
}

const findOptimalIWealthyPremiumCi = async (
    entryAge: number, gender: Gender, allCiPremiums: AnnualCiPremiumDetail[],
    iWealthyPPT: number, investmentReturnRate: number, targetRppRtuRatio: string,
    iWealthyWithdrawalStartAge: number
): Promise<OptimalCiSolverResult> => {
    const [rppPercStr, rtuPercStr] = targetRppRtuRatio.split(':');
    const rppRatio = parseFloat(rppPercStr) / 100;
    const rtuRatio = parseFloat(rtuPercStr) / 100;
    const withdrawalPlanForIWealthy: WithdrawalPlanRecord[] = [];
    let totalExpectedCiWithdrawal = 0;
    allCiPremiums.forEach(ciRow => {
        if (ciRow.age >= iWealthyWithdrawalStartAge && ciRow.age <= MAX_POLICY_AGE_TYPE && ciRow.totalCiPremium > 0) {
            totalExpectedCiWithdrawal += ciRow.totalCiPremium;
            withdrawalPlanForIWealthy.push({
                id: `auto-ci-wd-${ciRow.policyYear}-${ciRow.age}`, type: 'annual', amount: ciRow.totalCiPremium,
                startAge: ciRow.age, endAge: ciRow.age, refType: 'age',
            });
        }
    });
    const frequencyChangesForIWealthy: FrequencyChangeRecord[] = [{ startAge: entryAge + 1, endAge: MAX_POLICY_AGE_TYPE, frequency: 'monthly', type: 'age' }];
    let totalPremiumThatWorksHeuristic: number | null = null;
    let divisor = 3.0; const minDivisor = 0.5; const divisorStep = 0.1;
    for (let i = 0; i < 30; i++) {
        let totalPremiumTrial = (totalExpectedCiWithdrawal / Math.max(divisor, 0.01)) / Math.max(iWealthyPPT, 1);
        let rppTrial = Math.round(totalPremiumTrial * rppRatio);
        if (rppRatio > 0 && rppTrial < MINIMUM_RPP) { totalPremiumTrial = MINIMUM_RPP / rppRatio; }
        totalPremiumTrial = Math.max(totalPremiumTrial, MINIMUM_RPP);
        totalPremiumTrial = Math.ceil(totalPremiumTrial / 100) * 100;
        rppTrial = Math.round(totalPremiumTrial * rppRatio);
        const rtuTrial = Math.round(totalPremiumTrial * rtuRatio);
        if (rppRatio > 0 && rppTrial < MINIMUM_RPP) { divisor -= divisorStep; if (divisor < minDivisor) break; continue; }
        const initialSA = Math.max(1, Math.round(getSumInsuredFactor(entryAge) * rppTrial));
        const saReductions = generateSAReductionsForIWealthy(entryAge, rppTrial);
        const inputTrial: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual',
            initialSumInsured: initialSA, rppPerYear: rppTrial, rtuPerYear: rtuTrial,
            assumedInvestmentReturnRate: investmentReturnRate / 100, premiumPayingTermYears: iWealthyPPT,
            pausePeriods: [], sumInsuredReductions: saReductions, additionalInvestments: [],
            frequencyChanges: frequencyChangesForIWealthy, withdrawalPlan: withdrawalPlanForIWealthy,
        };
        try {
            const result = await generateIllustrationTables(inputTrial);
            if (checkIWealthySolvencyCi(result.annual, withdrawalPlanForIWealthy)) {
                totalPremiumThatWorksHeuristic = totalPremiumTrial; break;
            } else { divisor -= divisorStep; if (divisor < minDivisor) break; }
        } catch (e) { divisor -= divisorStep; if (divisor < minDivisor) break; }
    }
    if (!totalPremiumThatWorksHeuristic) return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: "Solver (heuristic) failed to find a premium satisfying all conditions." };
    let searchHigh = totalPremiumThatWorksHeuristic;
    let searchLow = rppRatio > 0 ? Math.ceil((MINIMUM_RPP / rppRatio) / 100) * 100 : MINIMUM_RPP;
    searchLow = Math.max(searchLow, MINIMUM_RPP);
    let optimalTotal = searchHigh;
    for (let i = 0; i < 20 && (searchHigh - searchLow > 100); i++) {
        let mid = Math.max(searchLow, Math.floor(((searchLow + searchHigh) / 2) / 100) * 100);
        if (mid <= searchLow && searchLow < searchHigh - 100) mid = searchLow + 100;
        else if (mid >= searchHigh && searchHigh > searchLow + 100) mid = searchHigh - 100;
        if (mid === searchLow && mid === searchHigh) break;
        const rppBin = Math.round(mid * rppRatio); const rtuBin = Math.round(mid * rtuRatio);
        if (rppRatio > 0 && rppBin < MINIMUM_RPP) { searchLow = mid; continue; }
        const initialSAMid = Math.max(1, Math.round(getSumInsuredFactor(entryAge) * rppBin));
        const saReductionsMid = generateSAReductionsForIWealthy(entryAge, rppBin);
        const inputMid: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: initialSAMid,
            rppPerYear: rppBin, rtuPerYear: rtuBin, assumedInvestmentReturnRate: investmentReturnRate / 100,
            premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: saReductionsMid,
            additionalInvestments: [], frequencyChanges: frequencyChangesForIWealthy, withdrawalPlan: withdrawalPlanForIWealthy,
        };
        let isSolvent = false; try { const res = await generateIllustrationTables(inputMid); isSolvent = checkIWealthySolvencyCi(res.annual, withdrawalPlanForIWealthy); } catch (e) { isSolvent = false; }
        if (isSolvent) { searchHigh = mid; optimalTotal = mid; } else { searchLow = mid; }
    }
    const finalSolvedRpp = roundUpToNearestThousand(optimalTotal * rppRatio);
    const finalSolvedRtu = roundUpToNearestThousand(optimalTotal * rtuRatio);
    if (rppRatio > 0 && finalSolvedRpp < MINIMUM_RPP) { return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: `Final RPP ${finalSolvedRpp} is below minimum.` }; }
    const finalInitialSA = Math.max(1, Math.round(getSumInsuredFactor(entryAge) * finalSolvedRpp));
    const finalSaReductions = generateSAReductionsForIWealthy(entryAge, finalSolvedRpp);
    const finalInput: CalculationInput = {
        policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: finalInitialSA,
        rppPerYear: finalSolvedRpp, rtuPerYear: finalSolvedRtu, assumedInvestmentReturnRate: investmentReturnRate / 100,
        premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: finalSaReductions,
        additionalInvestments: [], frequencyChanges: frequencyChangesForIWealthy, withdrawalPlan: withdrawalPlanForIWealthy,
    };
    try {
        const finalResult = await generateIllustrationTables(finalInput);
        if (checkIWealthySolvencyCi(finalResult.annual, withdrawalPlanForIWealthy)) {
            return { solvedTotalPremium: finalSolvedRpp + finalSolvedRtu, solvedRpp: finalSolvedRpp, solvedRtu: finalSolvedRtu, finalIWealthyAnnualData: finalResult.annual };
        } else {
            return { solvedTotalPremium: finalSolvedRpp + finalSolvedRtu, solvedRpp: finalSolvedRpp, solvedRtu: finalSolvedRtu, errorMessage: "Final solved premium is not solvent under strict CI conditions.", finalIWealthyAnnualData: finalResult.annual };
        }
    } catch (error) { return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: error instanceof Error ? error.message : "Error in final solver run." }; }
};


// --- CHANGED: Export ฟังก์ชันที่จำเป็นโดยตรง ---
export { calculateAllCiPremiumsSchedule };

export const calculateManualPlanCi = async (
    currentPlanningAge: number, gender: Gender, ciSelections: CiPlanSelections,
    iWealthyRpp: number, iWealthyRtu: number, iWealthyInvReturn: number, iWealthyOwnPPT: number,
    policyOriginMode: PolicyOriginMode, // <<-- 1. ย้ายมาอยู่ตรงนี้
    existingOriginalEntryAge?: number,
    maxCiScheduleAge?: number,
    manualWithdrawalStartAge?: number
): Promise<AnnualCiOutputRow[]> => {
    const rppActual = Math.max(iWealthyRpp, MINIMUM_RPP);
    const allCiPremiumsData = calculateAllCiPremiumsSchedule(currentPlanningAge, gender, ciSelections, policyOriginMode, existingOriginalEntryAge, maxCiScheduleAge);
    
    // +++ NEW LOGIC: คำนวณปีที่หยุดจ่ายเบี้ย และปีที่เริ่มถอน +++
    {/*const lastIWealthyPremiumAge = currentPlanningAge + iWealthyOwnPPT - 1;
    let lastCiPremiumPaymentAge: number;
    let withdrawalStartAge: number;

    if (ciSelections.icareChecked || ciSelections.rokraiChecked) {
        // กรณีเลือกแผนเบี้ยสูง
        lastCiPremiumPaymentAge = Math.max(60, lastIWealthyPremiumAge);
        withdrawalStartAge = lastCiPremiumPaymentAge + 1;
    } else {
        // กรณีทั่วไป
        lastCiPremiumPaymentAge = lastIWealthyPremiumAge;
        withdrawalStartAge = lastIWealthyPremiumAge + 1;
    }
    // ตรวจสอบว่าไม่เกินอายุสูงสุด
    withdrawalStartAge = Math.min(withdrawalStartAge, MAX_POLICY_AGE_TYPE + 1);*/}
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    let withdrawalStartAge: number;
    if (manualWithdrawalStartAge) {
        // ถ้าผู้ใช้กำหนดอายุมาเอง (เปิด Toggle) ให้ใช้ค่านั้น
        withdrawalStartAge = manualWithdrawalStartAge;
    } else {
        // ถ้าไม่ได้กำหนด (ปิด Toggle) ให้คำนวณแบบอัตโนมัติเหมือนเดิม
        const lastIWealthyPremiumAge = currentPlanningAge + iWealthyOwnPPT - 1;
        if (ciSelections.icareChecked || ciSelections.rokraiChecked) {
            withdrawalStartAge = Math.max(60, lastIWealthyPremiumAge) + 1;
        } else {
            withdrawalStartAge = lastIWealthyPremiumAge + 1;
        }
        withdrawalStartAge = Math.min(withdrawalStartAge, MAX_POLICY_AGE_TYPE + 1);
    }
    const lastCiPremiumPaymentAge = withdrawalStartAge - 1;

    const withdrawalPlanForIWealthy: WithdrawalPlanRecord[] = [];
    allCiPremiumsData.forEach(ciRow => {
        // สร้างรายการถอนสำหรับเบี้ย CI ที่เกิดขึ้น *หลังจาก* ปีที่เริ่มถอน
        if (ciRow.age >= withdrawalStartAge && ciRow.age <= MAX_POLICY_AGE_TYPE && ciRow.totalCiPremium > 0) {
            withdrawalPlanForIWealthy.push({
                id: `manual-ci-wd-${ciRow.policyYear}-${ciRow.age}`,
                type: 'annual', amount: ciRow.totalCiPremium,
                startAge: ciRow.age, endAge: ciRow.age, refType: 'age',
            });
        }
    });

    // สร้างตาราง CI ที่แสดงการจ่ายเบี้ยตาม Logic ใหม่
    const adjustedCiPremiumsData = allCiPremiumsData.map(ciRow => {
        // ถ้าอายุมากกว่าปีที่ต้องจ่ายเบี้ย CI แล้ว ให้เบี้ยเป็น 0
        if (ciRow.age > lastCiPremiumPaymentAge) {
            return { ...ciRow, totalCiPremium: 0, lifeReadyPremium: 0, icarePremium: 0, ishieldPremium: 0, rokraiPremium: 0, dciPremium: 0 };
        }
        return ciRow;
    });

    const sumInsuredReductions = generateSAReductionsForIWealthy(currentPlanningAge, rppActual);
    const frequencyChanges: FrequencyChangeRecord[] = [{ startAge: currentPlanningAge + 1, endAge: MAX_POLICY_AGE_TYPE, frequency: 'monthly', type: 'age' }];
    const initialSA = Math.max(1, Math.round(getSumInsuredFactor(currentPlanningAge) * rppActual));
    const iWealthyInput: CalculationInput = {
        policyholderAge: currentPlanningAge, policyholderGender: gender, initialPaymentFrequency: 'annual',
        initialSumInsured: initialSA, rppPerYear: rppActual, rtuPerYear: iWealthyRtu,
        assumedInvestmentReturnRate: iWealthyInvReturn / 100, premiumPayingTermYears: iWealthyOwnPPT,
        pausePeriods: [], sumInsuredReductions, additionalInvestments: [],
        frequencyChanges, withdrawalPlan: withdrawalPlanForIWealthy,
    };
    const iWealthyResult = await generateIllustrationTables(iWealthyInput);
    
    // ใช้ตาราง CI ที่ปรับแล้ว (adjusted) เพื่อรวมผลลัพธ์
    return processIWealthyResultsToCi(adjustedCiPremiumsData, iWealthyResult.annual, ciSelections, initialSA, sumInsuredReductions);
};

export const calculateAutomaticPlanCi = async (
    currentPlanningAge: number, gender: Gender, ciSelections: CiPlanSelections,
    iWealthyInvReturn: number, iWealthyOwnPPT: number, iWealthyRppRtuRatio: string,
    policyOriginMode: PolicyOriginMode, // <<-- 1. ย้ายมาอยู่ตรงนี้
    existingOriginalEntryAge?: number,
    maxCiScheduleAge?: number,
    userDefinedWithdrawalStartAge?: number
): Promise<any> => {
    const allCiPremiumsData = calculateAllCiPremiumsSchedule(currentPlanningAge, gender, ciSelections, policyOriginMode, existingOriginalEntryAge, maxCiScheduleAge);
    
    let withdrawalStartAge: number;
    if (userDefinedWithdrawalStartAge) {
        // ถ้าผู้ใช้กำหนดอายุมาเอง (เปิด Toggle) ให้ใช้ค่านั้น
        withdrawalStartAge = userDefinedWithdrawalStartAge;
    } else {
        // ถ้าไม่ได้กำหนด (ปิด Toggle) ให้คำนวณแบบอัตโนมัติเหมือนเดิม
        const lastIWealthyPremiumAge = currentPlanningAge + iWealthyOwnPPT - 1;
        if (ciSelections.icareChecked || ciSelections.rokraiChecked) {
            withdrawalStartAge = Math.max(61, lastIWealthyPremiumAge + 1);
        } else {
            withdrawalStartAge = lastIWealthyPremiumAge + 1;
        }
        withdrawalStartAge = Math.min(withdrawalStartAge, MAX_POLICY_AGE_TYPE + 1);
    }
    
    const solverResult = await findOptimalIWealthyPremiumCi(
        currentPlanningAge, gender, allCiPremiumsData, iWealthyOwnPPT,
        iWealthyInvReturn, iWealthyRppRtuRatio,
        withdrawalStartAge // ส่งค่าที่คำนวณใหม่เข้าไปใน Solver
    );

    // Logic การหยุดจ่ายเบี้ย CI ต้องถูกนำมาใช้ที่นี่ด้วย
    const lastCiPremiumPaymentAge = withdrawalStartAge - 1;
    const adjustedCiPremiumsData = allCiPremiumsData.map(ciRow => {
        if (ciRow.age > lastCiPremiumPaymentAge) {
            return { ...ciRow, totalCiPremium: 0, lifeReadyPremium: 0, icarePremium: 0, ishieldPremium: 0, rokraiPremium: 0, dciPremium: 0 };
        }
        return ciRow;
    });

    const initialSA = Math.max(1, Math.round(getSumInsuredFactor(currentPlanningAge) * (solverResult.solvedRpp ?? 0)));
    const saReductions = generateSAReductionsForIWealthy(currentPlanningAge, (solverResult.solvedRpp ?? 0));
    const processedOutput = processIWealthyResultsToCi(
        adjustedCiPremiumsData, // ใช้ตาราง CI ที่ปรับแล้ว
        solverResult.finalIWealthyAnnualData,
        ciSelections,
        initialSA,
        saReductions
    );
    return {
        outputIllustration: processedOutput,
        minPremiumResult: solverResult.solvedTotalPremium,
        rppResult: solverResult.solvedRpp,
        rtuResult: solverResult.solvedRtu,
        errorMsg: solverResult.errorMessage,
    };
};