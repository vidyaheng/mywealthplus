import { useCallback } from 'react';

// --- Main iWealthy Calculation Engine ---
import {
    generateIllustrationTables,
} from '@/lib/calculations'; // โปรดตรวจสอบ Path

// --- CI Premium Schedule Calculation ---
import { calculateAllCiPremiumsSchedule } from '@/components/ci/utils/ciScheduleCalcs'; // โปรดตรวจสอบ Path

// --- Types ---
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
} from '@/components/ci/types/useCiTypes'; // โปรดตรวจสอบ Path

// --- Constants ---
const MINIMUM_RPP = 18000;
const MAX_POLICY_AGE_TYPE = 98; // อายุสูงสุดที่ iWealthy คำนวณ และใช้เป็น target age สำหรับ 70% rule

// Placeholder: ควรย้าย getSumInsuredFactor และ roundUpToNearestThousand ไปไว้ที่ utility กลาง
const getSumInsuredFactor = (age: number): number => {
    if (age >= 0 && age <= 40) return 60;
    if (age >= 41 && age <= 50) return 50;
    if (age >= 51 && age <= 60) return 20;
    if (age >= 61 && age <= 65) return 15;
    if (age >= 66 && age <= MAX_POLICY_AGE_TYPE) return 5;
    return 0;
};
const roundUpToNearestThousand = (num: number): number => {
    if (num <= 0) return 0;
    return Math.ceil(num / 1000) * 1000;
};

interface OptimalCiSolverResult {
    solvedTotalPremium: number | null;
    solvedRpp: number | null;
    solvedRtu: number | null;
    finalIWealthyAnnualData?: IWealthyAnnualOutputRow[];
    errorMessage?: string;
}

export const useCiCalculations = () => {

    const generateSAReductionsForIWealthy = useCallback(/* ...เหมือนเดิม... */ (
        entryAge: number,
        rpp: number
    ): SumInsuredReductionRecord[] => {
        const reductions: SumInsuredReductionRecord[] = [];
        if (rpp <= 0) return reductions;
        const getReductionFactor = (milestoneAge: number, currentEntryAge: number): number => {
            if (milestoneAge === currentEntryAge + 1) {
                if (currentEntryAge <= 40) return 40; if (currentEntryAge <= 50) return 30;
                if (currentEntryAge <= 60) return 20; if (currentEntryAge <= 65) return 15; return 5;
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
    }, []);

    // **ปรับปรุง `checkIWealthySolvencyCi` ให้เป็นเกณฑ์เข้มงวดสำหรับ Solver ในโหมด Auto เท่านั้น**
    const checkIWealthySolvencyCi = useCallback((
        iWealthyAnnualData: IWealthyAnnualOutputRow[] | undefined,
        plannedWithdrawals: WithdrawalPlanRecord[], // เบี้ย CI ที่ iWealthy วางแผนจะจ่าย
        //targetAVPercentageOfTotalCIPaid: number = 0.70,
        targetAgeForValueCheck: number = MAX_POLICY_AGE_TYPE // อายุที่ตรวจสอบมูลค่า (เช่น สิ้นปีอายุ 98)
    ): boolean => {
        if (!iWealthyAnnualData || iWealthyAnnualData.length === 0) {
            // console.log("Solver Check: No iWealthy data");
            return false;
        }

        // 1. กรมธรรม์ต้องไม่ Lapse และต้องดำเนินไปจนถึง targetAgeForValueCheck
        const lastYearData = iWealthyAnnualData[iWealthyAnnualData.length - 1];
        if (lastYearData.age < targetAgeForValueCheck) {
            // console.log(`Solver Check: Policy ended at age ${lastYearData.age}, before target ${targetAgeForValueCheck}`);
            return false; // สิ้นสุดก่อนอายุเป้าหมาย
        }
        if ((lastYearData.eoyAccountValue ?? -1) < 1.00 && lastYearData.age === targetAgeForValueCheck) {
            // console.log(`Solver Check: Policy has near zero value at target age ${targetAgeForValueCheck}`);
            // This might be acceptable if withdrawals were made, but the 70% rule below will be the main check.
            // However, if it's negative, it definitely fails.
             if ((lastYearData.eoyAccountValue ?? 0) < 0) return false;
        }


        // 2. ตรวจสอบว่าจ่าย Withdrawal (เบี้ย CI) ได้ครบถ้วนหรือไม่
        const withdrawalMapByAge = new Map<number, number>();
        plannedWithdrawals.forEach(wd => {
            for (let age = wd.startAge; age <= wd.endAge; age++) {
                withdrawalMapByAge.set(age, (withdrawalMapByAge.get(age) || 0) + wd.amount);
            }
        });

        for (const row of iWealthyAnnualData) {
            if (row.age > targetAgeForValueCheck) continue; // ตรวจสอบถึงแค่อายุเป้าหมาย

            if ((row.eoyAccountValue ?? -1) < -0.005 && row.age < targetAgeForValueCheck) { // ติดลบก่อนถึงปีเป้าหมาย
                // console.log(`Solver Check: Negative EOY AV at age ${row.age}`);
                return false;
            }
            const plannedAmountForYear = withdrawalMapByAge.get(row.age);
            if (plannedAmountForYear && plannedAmountForYear > 0) {
                if (((row.withdrawalYear ?? 0) < (plannedAmountForYear * 0.999)) && ((row.eoyAccountValue ?? 0) >= 1.00)) {
                    // console.log(`Solver Check: Incomplete withdrawal at age ${row.age}`);
                    return false; // จ่าย Withdrawal ไม่ครบทั้งที่เงินยังเหลือ (อาจบ่งชี้ปัญหาอื่น)
                }
            }
        }

        // 3. ตรวจสอบเงื่อนไข 70% ณ อายุเป้าหมาย
        const finalYearDataForTarget = iWealthyAnnualData.find(row => row.age === targetAgeForValueCheck);
        if (!finalYearDataForTarget) {
            // console.log(`Solver Check: No data for target age ${targetAgeForValueCheck}`);
            return false; // ไม่พบข้อมูล ณ อายุเป้าหมาย (ไม่ควรเกิดถ้าผ่านข้อ 1)
        }

        const finalAccountValue = finalYearDataForTarget.eoyAccountValue ?? 0;
        if (finalAccountValue < 0) return false; // ยืนยันอีกครั้งว่าไม่ติดลบ

        let totalCiPremiumsPlannedByIWealthy = 0;
        plannedWithdrawals.forEach(wd => {
            totalCiPremiumsPlannedByIWealthy += wd.amount;
        });

        if (totalCiPremiumsPlannedByIWealthy > 0) {
            {/*const requiredValueAtTargetAge = targetAVPercentageOfTotalCIPaid * totalCiPremiumsPlannedByIWealthy;
            if (finalAccountValue < requiredValueAtTargetAge) {
                // console.log(`Solver Check: AV at age ${targetAgeForValueCheck} (${finalAccountValue}) < ${targetAVPercentageOfTotalCIPaid*100}% of total CI premiums ${totalCiPremiumsPlannedByIWealthy} (Target: ${requiredValueAtTargetAge})`);
                return false;
            */}
            if (finalAccountValue <= 500000) {
                // ถ้าค่าน้อยกว่าหรือเท่ากับ 500,000 ให้ถือว่าไม่ผ่านเงื่อนไข
                return false;
            }
        }
        // console.log("Solver Check: PASSED ALL CHECKS");
        return true; // ผ่านทุกเงื่อนไขสำหรับโหมด Auto
    }, []);

    const processIWealthyResultsToCi = useCallback(/* ...เหมือนเดิม... */ (
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
            const lifeReadySAForCombinedDB = (ciSelections.mainRiderChecked && ciSelections.lifeReadySA > 0) ? ciSelections.lifeReadySA : 0;
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
                totalCombinedDeathBenefit: (iWealthyYearData?.eoyDeathBenefit ?? 0) + lifeReadySAForCombinedDB,
            });
        }
        return illustration;
    }, []);

    const findOptimalIWealthyPremiumCi = useCallback(async (
        entryAge: number, gender: Gender, allCiPremiums: AnnualCiPremiumDetail[],
        iWealthyPPT: number, investmentReturnRate: number, targetRppRtuRatio: string,
        iWealthyWithdrawalStartAge: number
    ): Promise<OptimalCiSolverResult> => {
        // ... (ส่วน Logic ของ Solver เหมือนเดิม ที่มีการเพิ่ม id ใน withdrawalPlanForIWealthy) ...
        // Solver จะเรียก checkIWealthySolvencyCi (ที่รวมเงื่อนไข 70% แล้ว)
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
                if (checkIWealthySolvencyCi(result.annual, withdrawalPlanForIWealthy)) { // <--- ใช้ checkIWealthySolvencyCi ที่เข้มงวด
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
    }, [generateSAReductionsForIWealthy, checkIWealthySolvencyCi]);

    // **ปรับปรุง `calculateManualPlanCi` ไม่ให้ใช้ `checkIWealthySolvencyCi` เป็นตัวตัดสิน**
    const calculateManualPlanCi = useCallback(async (
        currentPlanningAge: number,
        gender: Gender,
        ciSelections: CiPlanSelections,
        iWealthyRpp: number,
        iWealthyRtu: number,
        iWealthyInvReturn: number,
        iWealthyOwnPPT: number,
        ciWithdrawalStartAge: number,
        policyOriginMode: PolicyOriginMode,
        existingOriginalEntryAge?: number,
        maxCiScheduleAge?: number
    ): Promise<AnnualCiOutputRow[]> => {
        const rppActual = Math.max(iWealthyRpp, MINIMUM_RPP);
        const allCiPremiumsData = calculateAllCiPremiumsSchedule(
            currentPlanningAge, gender, ciSelections,
            policyOriginMode, existingOriginalEntryAge, maxCiScheduleAge
        );

        const withdrawalPlanForIWealthy: WithdrawalPlanRecord[] = [];
        allCiPremiumsData.forEach(ciRow => {
            if (ciRow.age >= ciWithdrawalStartAge && ciRow.age <= MAX_POLICY_AGE_TYPE && ciRow.totalCiPremium > 0) {
                withdrawalPlanForIWealthy.push({
                    id: `manual-ci-wd-${ciRow.policyYear}-${ciRow.age}`,
                    type: 'annual', amount: ciRow.totalCiPremium,
                    startAge: ciRow.age, endAge: ciRow.age, refType: 'age',
                });
            }
        });

        const iWealthyEntryAge = currentPlanningAge;
        const sumInsuredReductions = generateSAReductionsForIWealthy(iWealthyEntryAge, rppActual);
        const frequencyChanges: FrequencyChangeRecord[] = [{ startAge: iWealthyEntryAge + 1, endAge: MAX_POLICY_AGE_TYPE, frequency: 'monthly', type: 'age' }];
        const initialSA = Math.max(1, Math.round(getSumInsuredFactor(iWealthyEntryAge) * rppActual));

        const iWealthyInput: CalculationInput = {
            policyholderAge: iWealthyEntryAge, policyholderGender: gender, initialPaymentFrequency: 'annual',
            initialSumInsured: initialSA, rppPerYear: rppActual, rtuPerYear: iWealthyRtu,
            assumedInvestmentReturnRate: iWealthyInvReturn / 100, premiumPayingTermYears: iWealthyOwnPPT,
            pausePeriods: [], sumInsuredReductions, additionalInvestments: [],
            frequencyChanges, withdrawalPlan: withdrawalPlanForIWealthy,
        };

        // คำนวณและคืนผลลัพธ์เสมอสำหรับ Manual Mode
        const iWealthyResult = await generateIllustrationTables(iWealthyInput);
        // การแสดงผลจะสะท้อนเองว่ากรมธรรม์อยู่ได้นานแค่ไหน หรือมีมูลค่าเหลือเท่าไหร่
        return processIWealthyResultsToCi(allCiPremiumsData, iWealthyResult.annual, ciSelections, initialSA, sumInsuredReductions);
    }, [generateSAReductionsForIWealthy, processIWealthyResultsToCi]);


    const calculateAutomaticPlanCi = useCallback(async (
        currentPlanningAge: number,
        gender: Gender,
        ciSelections: CiPlanSelections,
        iWealthyInvReturn: number,
        iWealthyOwnPPT: number,
        iWealthyRppRtuRatio: string,
        ciWithdrawalStartAge: number,
        policyOriginMode: PolicyOriginMode,
        existingOriginalEntryAge?: number,
        maxCiScheduleAge?: number
    ): Promise<{
        outputIllustration: AnnualCiOutputRow[] | null;
        minPremiumResult?: number; rppResult?: number; rtuResult?: number; errorMsg?: string;
    }> => {
        const allCiPremiumsData = calculateAllCiPremiumsSchedule(
            currentPlanningAge, gender, ciSelections,
            policyOriginMode, existingOriginalEntryAge, maxCiScheduleAge
        );

        const iWealthyEntryAgeForSolver = currentPlanningAge;
        const solverResult = await findOptimalIWealthyPremiumCi(
            iWealthyEntryAgeForSolver, gender, allCiPremiumsData, iWealthyOwnPPT,
            iWealthyInvReturn, iWealthyRppRtuRatio, ciWithdrawalStartAge
        );

        // Solver จะคืน finalIWealthyAnnualData มาด้วยเสมอ (แม้จะไม่ solvent ตามเกณฑ์)
        // เพื่อให้สามารถแสดงผลการคำนวณที่ดีที่สุดที่ Solver หาได้ พร้อมกับ errorMessage
        const initialSA = Math.max(1, Math.round(getSumInsuredFactor(iWealthyEntryAgeForSolver) * (solverResult.solvedRpp ?? 0)));
        const saReductions = generateSAReductionsForIWealthy(iWealthyEntryAgeForSolver, (solverResult.solvedRpp ?? 0));
        
        const processedOutput = processIWealthyResultsToCi(
            allCiPremiumsData,
            solverResult.finalIWealthyAnnualData, // ส่งข้อมูลที่ solver คำนวณได้ (อาจจะ solvent หรือไม่)
            ciSelections,
            initialSA,
            saReductions
        );

        return {
            outputIllustration: processedOutput,
            minPremiumResult: solverResult.solvedTotalPremium ?? undefined,
            rppResult: solverResult.solvedRpp ?? undefined,
            rtuResult: solverResult.solvedRtu ?? undefined,
            errorMsg: solverResult.errorMessage, // แสดง error message จาก solver โดยตรง
        };
    }, [findOptimalIWealthyPremiumCi, processIWealthyResultsToCi, generateSAReductionsForIWealthy]);

    return {
        calculateAllCiPremiumsSchedule,
        calculateManualPlanCi,
        calculateAutomaticPlanCi,
    };
};