// src/hooks/useLthcPlanner.ts

import { useState, useCallback, useEffect } from 'react';

// Types และ Functions จาก iWealthy เดิม (lib/calculations.ts)
import {
    CalculationInput as IWealthyCalculationInput,
    AnnualCalculationOutputRow as IWealthyAnnualRow,
    SumInsuredReductionRecord,
    FrequencyChangeRecord,
    WithdrawalPlanRecord,
    generateIllustrationTables,
    getSumInsuredFactor,
    // YourIllustrationResultType as IWealthyResult, // ถ้าไม่ใช้ ลบออก
    // PausePeriodRecord, // ยังไม่ได้ใช้ใน LTHC
    // AddInvestmentRecord, // ยังไม่ได้ใช้ใน LTHC
} from '../lib/calculations';

// Types และ Functions จาก Health Plan Calculations (lib/healthPlanCalculations.ts)
import {
    Gender,
    HealthPlanSelections,
    LifeReadyPaymentTerm,
    IHealthyUltraPlan,
    MEBPlan,
    getAnnualTotalHealthPremium,
    calculateLifeReadyPremium,
    calculateIHealthyUltraPremium,
    calculateMEBPremium,
} from '../lib/healthPlanCalculations';

// Import ตารางเบี้ย iHealthy Ultra เพื่อหา max age (ถ้าจำเป็นสำหรับการต่ออายุ)
import { IHEALTHY_ULTRA_RATES } from '../data/iHealthyUltraRates';


// Type สำหรับ Output ของ LTHC Planner (ที่ Hook จะสร้าง)
export interface AnnualLTHCOutputRow {
    policyYear: number;
    age: number;
    // Health Plan Details
    lifeReadyPremium: number;
    lifeReadyDeathBenefit: number;
    iHealthyUltraPremium: number;
    mebPremium: number;
    totalHealthPremium: number;
    // iWealthy Details
    iWealthyRpp?: number;
    iWealthyRtu?: number;
    iWealthyTotalPremium?: number;
    iWealthyWithdrawal?: number;
    iWealthyEoyAccountValue?: number;
    iWealthyEoyDeathBenefit?: number;
    iWealthySumAssured?: number; // ทุนประกัน iWealthy ณ สิ้นปีนั้นๆ
    // iWealthy Expenses (for Full View)
    iWealthyPremChargeRPP?: number;
    iWealthyPremChargeRTU?: number;
    iWealthyPremChargeTotal?: number; // Includes LSTU fee
    iWealthyCOI?: number;
    iWealthyAdminFee?: number;
    iWealthyTotalFees?: number; // Sum of all above fees + withdrawal fee
    // iWealthy Investment (for Full View)
    iWealthyInvestmentBase?: number;
    iWealthyInvestmentReturn?: number;
    iWealthyRoyaltyBonus?: number;
    iWealthyEOYCSV?: number; // Cash Surrender Value ณ สิ้นปี
    // Combined
    totalCombinedDeathBenefit?: number;
}

// Props ที่ Custom Hook นี้จะรับเข้ามา
export interface UseLthcPlannerProps {
    initialPolicyholderEntryAge: number;
    initialPolicyholderGender: Gender;
    initialSelectedHealthPlans: HealthPlanSelections;
}

// ค่าที่ Custom Hook นี้จะคืนออกไปให้ Component
export interface UseLthcPlannerReturn {
    lthcMode: 'manual' | 'automatic';
    setLthcMode: React.Dispatch<React.SetStateAction<'manual' | 'automatic'>>;
    manualRpp: number;
    setManualRpp: React.Dispatch<React.SetStateAction<number>>;
    manualRtu: number;
    setManualRtu: React.Dispatch<React.SetStateAction<number>>;
    manualInvestmentReturn: number;
    setManualInvestmentReturn: React.Dispatch<React.SetStateAction<number>>;
    manualIWealthyPPT: number;
    setManualIWealthyPPT: React.Dispatch<React.SetStateAction<number>>;
    manualWithdrawalStartAge: number;
    setManualWithdrawalStartAge: React.Dispatch<React.SetStateAction<number>>;
    autoInvestmentReturn: number;
    setAutoInvestmentReturn: React.Dispatch<React.SetStateAction<number>>;
    autoIWealthyPPT: number;
    setAutoIWealthyPPT: React.Dispatch<React.SetStateAction<number>>;
    autoRppRtuRatio: string;
    setAutoRppRtuRatio: React.Dispatch<React.SetStateAction<string>>;
    calculatedMinIWealthyPremium: number | null;
    calculatedIWealthyRpp: number | null;
    calculatedIWealthyRtu: number | null;
    lthcIllustrationData: AnnualLTHCOutputRow[] | null;
    isLoading: boolean;
    errorMessage: string | null;
    runLthcCalculation: () => void;
    policyholderEntryAge: number;
    setPolicyholderEntryAge: React.Dispatch<React.SetStateAction<number>>;
    policyholderGender: Gender;
    setPolicyholderGender: React.Dispatch<React.SetStateAction<Gender>>;
    selectedHealthPlans: HealthPlanSelections;
    setSelectedHealthPlans: React.Dispatch<React.SetStateAction<HealthPlanSelections>>;
}

const MINIMUM_ALLOWABLE_SYSTEM_RPP = 18000; // เบี้ย RPP ขั้นต่ำที่ระบบยอมรับได้ต่อปี

export function useLthcPlanner({
    initialPolicyholderEntryAge,
    initialPolicyholderGender,
    initialSelectedHealthPlans,
}: UseLthcPlannerProps): UseLthcPlannerReturn {

    const [policyholderEntryAge, setPolicyholderEntryAge] = useState<number>(initialPolicyholderEntryAge);
    const [policyholderGender, setPolicyholderGender] = useState<Gender>(initialPolicyholderGender);
    const [selectedHealthPlans, setSelectedHealthPlans] = useState<HealthPlanSelections>(initialSelectedHealthPlans);

    useEffect(() => setPolicyholderEntryAge(initialPolicyholderEntryAge), [initialPolicyholderEntryAge]);
    useEffect(() => setPolicyholderGender(initialPolicyholderGender), [initialPolicyholderGender]);
    useEffect(() => setSelectedHealthPlans(initialSelectedHealthPlans), [initialSelectedHealthPlans]);

    const [lthcMode, setLthcMode] = useState<'manual' | 'automatic'>('automatic');
    const [manualRpp, setManualRpp] = useState<number>(60000);
    const [manualRtu, setManualRtu] = useState<number>(0);
    const [manualInvestmentReturn, setManualInvestmentReturn] = useState<number>(5);
    const [manualIWealthyPPT, setManualIWealthyPPT] = useState<number>(15);
    const [manualWithdrawalStartAge, setManualWithdrawalStartAge] = useState<number>(61);

    const [autoInvestmentReturn, setAutoInvestmentReturn] = useState<number>(5);
    const [autoIWealthyPPT, setAutoIWealthyPPT] = useState<number>(() => {
        if (initialPolicyholderEntryAge <= 45) return 15;
        if (initialPolicyholderEntryAge <= 50) return Math.max(1, 60 - initialPolicyholderEntryAge);
        return 10;
    });
    const [autoRppRtuRatio, setAutoRppRtuRatio] = useState<string>('100/0');

    const [calculatedMinIWealthyPremium, setCalculatedMinIWealthyPremium] = useState<number | null>(null);
    const [calculatedIWealthyRpp, setCalculatedIWealthyRpp] = useState<number | null>(null);
    const [calculatedIWealthyRtu, setCalculatedIWealthyRtu] = useState<number | null>(null);

    const [lthcIllustrationData, setLthcIllustrationData] = useState<AnnualLTHCOutputRow[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        console.log('useEffect for autoIWealthyPPT triggered. Mode:', lthcMode, 'Entry Age:', policyholderEntryAge);
        if (lthcMode === 'automatic') {
            let newPptCalculated: number;
            if (policyholderEntryAge <= 45) {
                newPptCalculated = 15;
            } else if (policyholderEntryAge <= 50) {
                newPptCalculated = Math.max(1, 60 - policyholderEntryAge);
            } else {
                newPptCalculated = 10;
            }

            // ตรวจสอบก่อน set เพื่อลด re-render ที่ไม่จำเป็น (React ทำอยู่แล้ว แต่ก็ดี)
            // และที่สำคัญคือ setAutoIWealthyPPT จะไม่ทำให้ useEffect นี้ทำงานซ้ำ
            // เพราะ autoIWealthyPPT ไม่ได้อยู่ใน dependency array นี้
            setAutoIWealthyPPT(currentPpt => {
                if (currentPpt !== newPptCalculated) {
                    console.log(`Setting autoIWealthyPPT from ${currentPpt} to ${newPptCalculated}`);
                    return newPptCalculated;
                }
                return currentPpt;
            });
        }
        // ถ้า lthcMode ไม่ใช่ 'automatic' เราอาจจะอยาก reset autoIWealthyPPT กลับไปเป็นค่าเริ่มต้น
        // หรือปล่อยให้มันคงค่าเดิมไว้ก็ได้ ขึ้นอยู่กับพฤติกรรมที่ต้องการ
        // else {
        //     // Optionally reset or do nothing
        // }
    }, [policyholderEntryAge, lthcMode]);

    const annualHealthPremiums = useCallback(() => {
        const premiums: { year: number; age: number; totalPremium: number; lrPrem: number; ihuPrem: number; mebPrem: number; }[] = [];
        if (!policyholderEntryAge || !selectedHealthPlans) return premiums;
        for (let policyYear = 1; policyholderEntryAge + policyYear - 1 <= 99; policyYear++) {
            const attainedAge = policyholderEntryAge + policyYear - 1;
            const lrPremRaw = calculateLifeReadyPremium(policyholderEntryAge, policyholderGender, selectedHealthPlans.lifeReadySA, selectedHealthPlans.lifeReadyPPT);
            const ihuPremRaw = calculateIHealthyUltraPremium(attainedAge, policyholderGender, selectedHealthPlans.iHealthyUltraPlan);
            const mebPremRaw = calculateMEBPremium(attainedAge, selectedHealthPlans.mebPlan);
            let currentLifeReadyPremium = 0;
            if (selectedHealthPlans.lifeReadyPPT === 99) {
                if (attainedAge <= 98 && policyholderEntryAge <= 80) currentLifeReadyPremium = lrPremRaw;
            } else {
                if (policyYear <= selectedHealthPlans.lifeReadyPPT && policyholderEntryAge <= 70) currentLifeReadyPremium = lrPremRaw;
            }
            const maxIHUAge = IHEALTHY_ULTRA_RATES.length > 0 ? IHEALTHY_ULTRA_RATES[IHEALTHY_ULTRA_RATES.length - 1].age : 0;
            const currentIHUPremium = (attainedAge <= maxIHUAge && attainedAge <= 98) ? ihuPremRaw : 0;
            const currentMEBPremium = (attainedAge <= 74) ? mebPremRaw : 0;
            premiums.push({
                year: policyYear, age: attainedAge,
                totalPremium: currentLifeReadyPremium + currentIHUPremium + currentMEBPremium,
                lrPrem: currentLifeReadyPremium, ihuPrem: currentIHUPremium, mebPrem: currentMEBPremium,
            });
        }
        return premiums;
    }, [policyholderEntryAge, policyholderGender, selectedHealthPlans]);

    const generateAutomaticSAReductions = useCallback((entryAge: number, rpp: number): SumInsuredReductionRecord[] => {
        const reductions: SumInsuredReductionRecord[] = [];
        if (rpp <= 0) return reductions;

        const getFactorForMilestone = (milestoneAge: number, currentEntryAge: number): number => {
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

        const milestones = [entryAge + 1, 41, 51, 61, 66];
        const reductionMap = new Map<number, number>();

        milestones.forEach(milestoneAge => {
            if (milestoneAge > entryAge && milestoneAge <= 98) {
                const factor = getFactorForMilestone(milestoneAge, entryAge);
                if (factor > 0) {
                    const newSA = Math.round(rpp * factor);
                    if (!reductionMap.has(milestoneAge) || newSA < (reductionMap.get(milestoneAge) ?? Infinity)) {
                        reductionMap.set(milestoneAge, newSA);
                    }
                }
            }
        });
        reductionMap.forEach((newSumInsured, age) => {
            reductions.push({ age, newSumInsured });
        });
        return reductions.sort((a, b) => a.age - b.age);
    }, []);

    const isScenarioSolvent = useCallback((
        iWealthyAnnualResult: IWealthyAnnualRow[] | undefined,
        plannedWithdrawals: WithdrawalPlanRecord[],
        _entryAgeForSolvency: number // Might not be needed if checking last age directly
    ): boolean => {
        if (!iWealthyAnnualResult || iWealthyAnnualResult.length === 0) {
            return false;
        }
        const expectedLastAge = 98;
        const lastYearData = iWealthyAnnualResult[iWealthyAnnualResult.length - 1];

        if (lastYearData.age < expectedLastAge && lastYearData.eoyAccountValue < 1.00) {
            return false;
        }

        const withdrawalMap = new Map<number, number>();
        plannedWithdrawals.forEach(wd => {
            if (wd.type === 'annual' && wd.amount > 0) {
                withdrawalMap.set(wd.startAge, (withdrawalMap.get(wd.startAge) || 0) + wd.amount);
            }
        });

        for (const row of iWealthyAnnualResult) {
            if (row.eoyAccountValue < -0.005) {
                return false;
            }
            const plannedAmountForYear = withdrawalMap.get(row.age);
            if (plannedAmountForYear && plannedAmountForYear > 0) {
                const actualWithdrawal = row.withdrawalYear || 0;
                if (actualWithdrawal < (plannedAmountForYear * 0.999) && row.eoyAccountValue < 1.00) {
                    return false;
                }
            }
        }
        return true;
    }, []);

    const processIWealthyResultForLTHC = useCallback((
        healthPremiums: Array<{ year: number; age: number; totalPremium: number; lrPrem: number; ihuPrem: number; mebPrem: number; }>,
        iWealthyAnnualData: IWealthyAnnualRow[] | undefined, // Handle undefined
        currentSelectedHealthPlansLocal: HealthPlanSelections,
        iWealthyInitialSA: number,
        iWealthyReductions: SumInsuredReductionRecord[]
    ): AnnualLTHCOutputRow[] => {
        const illustration: AnnualLTHCOutputRow[] = [];
        if (!iWealthyAnnualData) return illustration; // Return empty if no iWealthy data

        let currentActualIWealthySA = iWealthyInitialSA;
        for (const healthEntry of healthPremiums) {
            if (healthEntry.age > 99) break;
            const iWealthyYearData = iWealthyAnnualData.find(iw => iw.policyYear === healthEntry.year);
            
            const applicableReductions = iWealthyReductions.filter(r => r.age <= healthEntry.age);
            if (applicableReductions.length > 0) {
                currentActualIWealthySA = applicableReductions[applicableReductions.length - 1].newSumInsured;
            } else if (healthEntry.year === 1) {
                 currentActualIWealthySA = iWealthyInitialSA;
            }

            illustration.push({
                policyYear: healthEntry.year, age: healthEntry.age,
                lifeReadyPremium: healthEntry.lrPrem, lifeReadyDeathBenefit: currentSelectedHealthPlansLocal.lifeReadySA,
                iHealthyUltraPremium: healthEntry.ihuPrem, mebPremium: healthEntry.mebPrem,
                totalHealthPremium: healthEntry.totalPremium,
                iWealthyRpp: iWealthyYearData?.premiumRPPYear, iWealthyRtu: iWealthyYearData?.premiumRTUYear,
                iWealthyTotalPremium: iWealthyYearData?.totalPremiumYear, iWealthyWithdrawal: iWealthyYearData?.withdrawalYear,
                iWealthyEoyAccountValue: iWealthyYearData?.eoyAccountValue, iWealthyEoyDeathBenefit: iWealthyYearData?.eoyDeathBenefit,
                iWealthySumAssured: currentActualIWealthySA,
                iWealthyPremChargeRPP: iWealthyYearData?.premiumChargeRPPYear, iWealthyPremChargeRTU: iWealthyYearData?.premiumChargeRTUYear,
                iWealthyPremChargeTotal: iWealthyYearData?.totalPremiumChargeYear, iWealthyCOI: iWealthyYearData?.totalCOIYear,
                iWealthyAdminFee: iWealthyYearData?.totalAdminFeeYear, iWealthyTotalFees: iWealthyYearData?.totalFeesYear,
                iWealthyInvestmentBase: iWealthyYearData?.investmentBaseYear, iWealthyInvestmentReturn: iWealthyYearData?.investmentReturnYear,
                iWealthyRoyaltyBonus: iWealthyYearData?.royaltyBonusYear, iWealthyEOYCSV: iWealthyYearData?.eoyCashSurrenderValue,
                totalCombinedDeathBenefit: (iWealthyYearData?.eoyDeathBenefit ?? 0) + currentSelectedHealthPlansLocal.lifeReadySA,
            });
        }
        return illustration;
    }, []); // Removed policyholderEntryAge dependency for now, assuming it's stable within a calculation run.

    const runLthcCalculation = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);
        setLthcIllustrationData(null);
        setCalculatedMinIWealthyPremium(null);
        setCalculatedIWealthyRpp(null);
        setCalculatedIWealthyRtu(null);

        const healthPremiumsOverTime = annualHealthPremiums();
        const currentEntryAge = policyholderEntryAge;
        const currentGender = policyholderGender;

        if (lthcMode === 'manual') {
            const rppForManual = Math.max(manualRpp, MINIMUM_ALLOWABLE_SYSTEM_RPP);
            const withdrawalPlanManual: WithdrawalPlanRecord[] = [];
            healthPremiumsOverTime.forEach(hp => {
                if (hp.age >= manualWithdrawalStartAge && hp.age <= 98 && hp.totalPremium > 0) {
                    withdrawalPlanManual.push({ id: `wd-m-${hp.age}`, type: 'annual', amount: hp.totalPremium, startAge: hp.age, endAge: hp.age, refType: 'age' });
                }
            });
            const sumInsuredReductionsManual = generateAutomaticSAReductions(currentEntryAge, rppForManual);
            const frequencyChangesManual: FrequencyChangeRecord[] = [{ id: 'lthc-m-mth-y2', startAge: currentEntryAge + 1, endAge: 99, frequency: 'monthly', type: 'age' }];
            const initialSAManual = Math.round(getSumInsuredFactor(currentEntryAge) * rppForManual);

            const iWealthyInputManual: IWealthyCalculationInput = {
                policyholderAge: currentEntryAge, policyholderGender: currentGender,
                initialPaymentFrequency: 'annual', initialSumInsured: initialSAManual,
                rppPerYear: rppForManual, rtuPerYear: manualRtu,
                assumedInvestmentReturnRate: manualInvestmentReturn / 100,
                premiumPayingTermYears: manualIWealthyPPT,
                pausePeriods: [], sumInsuredReductions: sumInsuredReductionsManual,
                additionalInvestments: [], frequencyChanges: frequencyChangesManual,
                withdrawalPlan: withdrawalPlanManual,
            };
            try {
                const iWealthyResult = generateIllustrationTables(iWealthyInputManual);
                if (!isScenarioSolvent(iWealthyResult.annual, withdrawalPlanManual, currentEntryAge)) {
                    setErrorMessage("แผน iWealthy (กำหนดเอง) อาจไม่เพียงพอสำหรับค่าใช้จ่ายสุขภาพ หรือมูลค่าอาจติดลบ");
                }
                const finalIllustration = processIWealthyResultForLTHC(healthPremiumsOverTime, iWealthyResult.annual, selectedHealthPlans, initialSAManual, sumInsuredReductionsManual);
                setLthcIllustrationData(finalIllustration);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Error in Manual Calculation");
            }
        } else { // lthcMode === 'automatic'
            // --- AUTOMATIC MODE LOGIC ---
            console.log("Automatic Mode Calculation Started...");
            let totalExpectedWithdrawal = 0;
            const withdrawalPlanAuto: WithdrawalPlanRecord[] = [];
            const currentAutoIWealthyPPT = autoIWealthyPPT;
            let autoWithdrawalStartAgeDetermined = 61;
            const iWealthyPTTEndAge = currentEntryAge + currentAutoIWealthyPPT - 1;
            if (iWealthyPTTEndAge >= 61) autoWithdrawalStartAgeDetermined = iWealthyPTTEndAge + 1;

            healthPremiumsOverTime.forEach(hp => {
                if (hp.age >= autoWithdrawalStartAgeDetermined && hp.age <= 98 && hp.totalPremium > 0) {
                    totalExpectedWithdrawal += hp.totalPremium;
                    withdrawalPlanAuto.push({ id: `wd-a-${hp.age}`, type: 'annual', amount: hp.totalPremium, startAge: hp.age, endAge: hp.age, refType: 'age' });
                }
            });
            const frequencyChangesAuto: FrequencyChangeRecord[] = [{ id: 'lthc-a-mth-y2', startAge: currentEntryAge + 1, endAge: 99, frequency: 'monthly', type: 'age' }];

            // --- Solver - Heuristic Phase ---
            let rppThatWorks: number | null = null;
            let divisor = 3.0;
            const divisorStepDown = 0.1;
            const minDivisor = 0.5;
            const maxHeuristicIterations = 30;

            console.log("Auto - Starting Heuristic Phase...");
            for (let i = 0; i < maxHeuristicIterations; i++) {
                let rppTrialBase = (totalExpectedWithdrawal / Math.max(divisor, 0.01)) / Math.max(currentAutoIWealthyPPT, 1);
                rppTrialBase = Math.max(rppTrialBase, MINIMUM_ALLOWABLE_SYSTEM_RPP);
                rppTrialBase = Math.ceil(rppTrialBase / 100) * 100;
                const rppTrialForSolver = rppTrialBase;
                const initialSATrial = Math.round(getSumInsuredFactor(currentEntryAge) * rppTrialForSolver);
                const sumInsuredReductionsTrial = generateAutomaticSAReductions(currentEntryAge, rppTrialForSolver);
                const iWealthyInputTrial: IWealthyCalculationInput = {
                    policyholderAge: currentEntryAge, policyholderGender: currentGender,
                    initialPaymentFrequency: 'annual', initialSumInsured: initialSATrial,
                    rppPerYear: rppTrialForSolver, rtuPerYear: 0,
                    assumedInvestmentReturnRate: autoInvestmentReturn / 100,
                    premiumPayingTermYears: currentAutoIWealthyPPT,
                    pausePeriods: [], sumInsuredReductions: sumInsuredReductionsTrial,
                    additionalInvestments: [], frequencyChanges: frequencyChangesAuto,
                    withdrawalPlan: withdrawalPlanAuto,
                };
                try {
                    const result = generateIllustrationTables(iWealthyInputTrial);
                    if (isScenarioSolvent(result.annual, withdrawalPlanAuto, currentEntryAge)) {
                        rppThatWorks = rppTrialForSolver;
                        break;
                    } else {
                        divisor -= divisorStepDown;
                        if (divisor < minDivisor) break;
                    }
                } catch (e) { divisor -= divisorStepDown; if (divisor < minDivisor) break; }
            }

            if (!rppThatWorks) {
                setErrorMessage("ไม่สามารถคำนวณเบี้ย iWealthy ที่เหมาะสมได้ (Heuristic)");
                setIsLoading(false); return;
            }

            // --- Solver - Binary Search Phase ---
            console.log(`Auto - Starting Binary Search. RPP_High_from_Heuristic = ${rppThatWorks}`);

            let searchHighRpp = rppThatWorks;
            let searchLowRpp = MINIMUM_ALLOWABLE_SYSTEM_RPP;
            let minViableRppTotal = searchHighRpp;
            const binarySearchIterations = 20;
            const tolerance = 100; // บาท

            for (let i = 0; i < binarySearchIterations && (searchHighRpp - searchLowRpp > tolerance); i++) {
                let midRppTotal = Math.max(MINIMUM_ALLOWABLE_SYSTEM_RPP, Math.floor((searchLowRpp + searchHighRpp) / 2 / 100) * 100);
                // ป้องกันการวนซ้ำค่าเดิมๆ หรือการออกนอกช่วงมากเกินไป
                if (midRppTotal >= searchHighRpp && searchHighRpp > searchLowRpp + tolerance) midRppTotal = searchHighRpp - tolerance;
                else if (midRppTotal <= searchLowRpp && searchLowRpp < searchHighRpp - tolerance) midRppTotal = searchLowRpp + tolerance;
                 if (midRppTotal === searchLowRpp && midRppTotal === searchHighRpp) break; // Avoid infinite loop if stuck

                midRppTotal = Math.max(MINIMUM_ALLOWABLE_SYSTEM_RPP, midRppTotal); // Ensure not below minimum
                 // If mid is same as low or high, and they are not yet converged, try to make progress

                const initialSABinary = Math.round(getSumInsuredFactor(currentEntryAge) * midRppTotal);
                const sumInsuredReductionsBinary = generateAutomaticSAReductions(currentEntryAge, midRppTotal);
                const iWealthyInputBinary: IWealthyCalculationInput = {
                    policyholderAge: currentEntryAge, policyholderGender: currentGender,
                    initialPaymentFrequency: 'annual', initialSumInsured: initialSABinary,
                    rppPerYear: midRppTotal, rtuPerYear: 0,
                    assumedInvestmentReturnRate: autoInvestmentReturn / 100,
                    premiumPayingTermYears: currentAutoIWealthyPPT,
                    pausePeriods: [], sumInsuredReductions: sumInsuredReductionsBinary,
                    additionalInvestments: [], frequencyChanges: frequencyChangesAuto,
                    withdrawalPlan: withdrawalPlanAuto,
                };
                let isSolventBinary = false;
                try {
                    const resultBinary = generateIllustrationTables(iWealthyInputBinary);
                    isSolventBinary = isScenarioSolvent(resultBinary.annual, withdrawalPlanAuto, currentEntryAge);
                } catch (e) { isSolventBinary = false; }

                if (isSolventBinary) {
                    searchHighRpp = midRppTotal;
                    minViableRppTotal = midRppTotal; // เก็บค่าล่าสุดที่ยังผ่าน
                } else {
                    searchLowRpp = midRppTotal;
                }
                // ถ้า searchLowRpp และ searchHighRpp เข้าใกล้กันมากพอ หรือ midRpp ไม่เปลี่ยนแปลงแล้ว ก็อาจจะ break
                if (searchHighRpp - searchLowRpp <= tolerance && isSolventBinary) {
                    minViableRppTotal = searchHighRpp; // หรือ midRppTotal
                    break;
                }
                 if (searchHighRpp - searchLowRpp <= tolerance && !isSolventBinary) {
                    minViableRppTotal = searchHighRpp; // ถ้า mid ไม่ผ่าน ให้ใช้ high ก่อนหน้า
                    break;
                 }
            }
            console.log(`Auto - Minimum Viable RPP (at 100% RPP assumption) from Binary Search = ${minViableRppTotal}`);
            setCalculatedMinIWealthyPremium(minViableRppTotal);
            

            // 5. คำนวณ RPP และ RTU จริงตาม autoRppRtuRatio ที่ผู้ใช้เลือก
            setCalculatedMinIWealthyPremium(minViableRppTotal);
            const [rppPercStr, rtuPercStr] = autoRppRtuRatio.split('/');
            const rppRatio = parseFloat(rppPercStr) / 100;
            const rtuRatio = parseFloat(rtuPercStr) / 100;
            const finalRpp = Math.round(minViableRppTotal * rppRatio);
            const finalRtu = Math.round(minViableRppTotal * rtuRatio);
            setCalculatedIWealthyRpp(finalRpp);
            setCalculatedIWealthyRtu(finalRtu);

            // 6. Final Calculation for Display (Automatic Mode)
            const initialSAFinal = Math.round(getSumInsuredFactor(currentEntryAge) * finalRpp);
            const sumInsuredReductionsFinal = generateAutomaticSAReductions(currentEntryAge, finalRpp);
            const iWealthyInputFinal: IWealthyCalculationInput = {
                policyholderAge: currentEntryAge, policyholderGender: currentGender,
                initialPaymentFrequency: 'annual', initialSumInsured: initialSAFinal,
                rppPerYear: finalRpp, rtuPerYear: finalRtu,
                assumedInvestmentReturnRate: autoInvestmentReturn / 100,
                premiumPayingTermYears: currentAutoIWealthyPPT,
                pausePeriods: [], sumInsuredReductions: sumInsuredReductionsFinal,
                additionalInvestments: [], frequencyChanges: frequencyChangesAuto,
                withdrawalPlan: withdrawalPlanAuto,
            };
            try {
                const iWealthyResultFinal = generateIllustrationTables(iWealthyInputFinal);
                if (!isScenarioSolvent(iWealthyResultFinal.annual, withdrawalPlanAuto, currentEntryAge)) {
                     setErrorMessage("ไม่สามารถสร้างแผนที่เหมาะสมได้ด้วยเบี้ย RPP/RTU ที่คำนวณได้ (Automatic - Final Check)");
                }
                const finalIllustration = processIWealthyResultForLTHC(healthPremiumsOverTime, iWealthyResultFinal.annual, selectedHealthPlans, initialSAFinal, sumInsuredReductionsFinal);
                setLthcIllustrationData(finalIllustration);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Error in Final Auto Calculation");
            }
        } // --- End Automatic Mode ---

        setIsLoading(false);
    }, [
        lthcMode, policyholderEntryAge, policyholderGender, selectedHealthPlans,
        manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT, manualWithdrawalStartAge,
        autoInvestmentReturn, autoIWealthyPPT, autoRppRtuRatio,
        annualHealthPremiums, generateAutomaticSAReductions, 
        isScenarioSolvent, processIWealthyResultForLTHC
    ]);

    return {
        lthcMode, setLthcMode,
        manualRpp, setManualRpp, manualRtu, setManualRtu,
        manualInvestmentReturn, setManualInvestmentReturn, manualIWealthyPPT, setManualIWealthyPPT,
        manualWithdrawalStartAge, setManualWithdrawalStartAge,
        autoInvestmentReturn, setAutoInvestmentReturn, autoIWealthyPPT, setAutoIWealthyPPT,
        autoRppRtuRatio, setAutoRppRtuRatio,
        calculatedMinIWealthyPremium, calculatedIWealthyRpp, calculatedIWealthyRtu,
        lthcIllustrationData, isLoading, errorMessage, runLthcCalculation,
        policyholderEntryAge, setPolicyholderEntryAge,
        policyholderGender, setPolicyholderGender,
        selectedHealthPlans, setSelectedHealthPlans,
    };
}