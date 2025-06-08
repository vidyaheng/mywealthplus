// src/hooks/useCiPlanner.ts

import { useState, useCallback, useEffect } from 'react';

// --- Types ---
import type {
    Gender,
    CiPlanSelections,
    AnnualCiOutputRow,
    UseCiPlannerProps,
    UseCiPlannerReturn,
    PolicyOriginMode,
    IWealthyMode,
    AnnualCiPremiumDetail,
} from '../types/useCiTypes';

// --- Calculation Hook ---
import { useCiCalculations } from './useCiCalculations';

// --- Initial State Definition ---
const defaultInitialCiPlans: CiPlanSelections = {
    icareChecked: false,
    icareSA: 0,
    ishieldChecked: false,
    ishieldPlan: '',
    ishieldSA: 0,
    mainRiderChecked: false,
    lifeReadyPlan: '',
    lifeReadySA: 0,
    rokraiChecked: false,
    rokraiPlan: '',
    dciChecked: false,
    dciSA: 0,
};

// --- Custom Hook ---
export function useCiPlanner({
    initialPolicyholderEntryAge,
    initialPolicyholderGender,
    initialSelectedCiPlans = defaultInitialCiPlans,
    initialIWealthyMode = 'automatic',
    initialPolicyOriginMode = 'newPolicy',
    initialUseIWealthy = false,
    onCalculationComplete,
}: UseCiPlannerProps): UseCiPlannerReturn {

    // --- State Declarations ---
    const [policyholderEntryAge, setPolicyholderEntryAge] = useState<number>(initialPolicyholderEntryAge);
    const [policyholderGender, setPolicyholderGender] = useState<Gender>(initialPolicyholderGender);
    const [policyOriginMode, setPolicyOriginMode] = useState<PolicyOriginMode>(initialPolicyOriginMode);
    const [existingPolicyEntryAge, setExistingPolicyEntryAge] = useState<number | undefined>(undefined);
    const [selectedCiPlans, setSelectedCiPlans] = useState<CiPlanSelections>(initialSelectedCiPlans);
    const [useIWealthy, setUseIWealthy] = useState<boolean>(initialUseIWealthy);
    const [iWealthyMode, setIWealthyMode] = useState<IWealthyMode>(initialIWealthyMode);
    const [iWealthyInvestmentReturn, setIWealthyInvestmentReturn] = useState<number>(5);
    const [iWealthyOwnPPT, setIWealthyOwnPPT] = useState<number>(10);
    const [iWealthyWithdrawalStartAge, setIWealthyWithdrawalStartAge] = useState<number>(60);
    const [manualRpp, setManualRpp] = useState<number>(18000);
    const [manualRtu, setManualRtu] = useState<number>(0);
    const [autoRppRtuRatio, setAutoRppRtuRatio] = useState<string>('100:0');
    const [result, setResult] = useState<AnnualCiOutputRow[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [ciPremiumsSchedule, setCiPremiumsSchedule] = useState<AnnualCiPremiumDetail[] | null>(null);
    const [calculatedMinPremium, setCalculatedMinPremium] = useState<number | undefined>();
    const [calculatedRpp, setCalculatedRpp] = useState<number | undefined>();
    const [calculatedRtu, setCalculatedRtu] = useState<number | undefined>();

    const ciCalculations = useCiCalculations();

    // --- Effects ---
    useEffect(() => {
        if (ciCalculations && ciCalculations.calculateAllCiPremiumsSchedule) {
            const newSchedule = ciCalculations.calculateAllCiPremiumsSchedule(
                policyholderEntryAge,
                policyholderGender,
                selectedCiPlans,
                policyOriginMode,
                existingPolicyEntryAge
            );
            if (JSON.stringify(newSchedule) !== JSON.stringify(ciPremiumsSchedule)) {
                setCiPremiumsSchedule(newSchedule);
            }
        }
    }, [
        policyholderEntryAge,
        policyholderGender,
        selectedCiPlans,
        policyOriginMode,
        existingPolicyEntryAge,
        ciCalculations, // ciCalculations is an object from a hook, can be a dependency
        ciPremiumsSchedule
    ]);

    // --- Main Calculation Function ---
    const runCalculation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setCalculatedMinPremium(undefined);
        setCalculatedRpp(undefined);
        setCalculatedRtu(undefined);

        try {
            const currentCiScheduleForCalc = ciPremiumsSchedule || [];

            if (!useIWealthy) {
                if (currentCiScheduleForCalc.length > 0) {
                    const ciOnlyIllustration: AnnualCiOutputRow[] = currentCiScheduleForCalc.map(ciRow => {
                        const lifeReadySAForCombinedDB = (selectedCiPlans.mainRiderChecked && selectedCiPlans.lifeReadySA > 0) ? selectedCiPlans.lifeReadySA : 0;
                        return {
                            policyYear: ciRow.policyYear,
                            age: ciRow.age,
                            lifeReadyPremiumPaid: ciRow.lifeReadyPremium,
                            ciRidersPremiumPaid: Math.round((ciRow.icarePremium || 0) + (ciRow.ishieldPremium || 0) + (ciRow.rokraiPremium || 0) + (ciRow.dciPremium || 0)),
                            totalCiPackagePremiumPaid: Math.round(ciRow.totalCiPremium),
                            totalCombinedDeathBenefit: lifeReadySAForCombinedDB,
                            iWealthyRpp: undefined, iWealthyRtu: undefined, iWealthyTotalPremium: undefined,
                            iWealthyWithdrawal: undefined, iWealthyEoyAccountValue: undefined,
                            iWealthyEoyDeathBenefit: undefined, iWealthySumAssured: undefined,
                            iWealthyEOYCSV: undefined, iWealthyPremChargeRPP: undefined,
                            iWealthyPremChargeRTU: undefined, iWealthyPremChargeTotal: undefined,
                            iWealthyCOI: undefined, iWealthyAdminFee: undefined, iWealthyTotalFees: undefined,
                            iWealthyInvestmentBase: undefined, iWealthyInvestmentReturn: undefined,
                            iWealthyRoyaltyBonus: undefined,
                        };
                    });
                    setResult(ciOnlyIllustration);
                } else {
                    setResult(null);
                }
                return;
            }

            if (!ciCalculations.calculateManualPlanCi || !ciCalculations.calculateAutomaticPlanCi) {
                setError("Calculation services for iWealthy are not available.");
                return;
            }
            if (currentCiScheduleForCalc.length === 0) {
                setError("CI premium schedule is not available for iWealthy calculation. Please select CI plans.");
                return;
            }

            if (iWealthyMode === 'manual') {
                const manualResultData = await ciCalculations.calculateManualPlanCi(
                    policyholderEntryAge, policyholderGender, selectedCiPlans,
                    manualRpp, manualRtu, iWealthyInvestmentReturn,
                    iWealthyOwnPPT, iWealthyWithdrawalStartAge,
                    policyOriginMode, existingPolicyEntryAge
                );
                setResult(manualResultData);
            } else { // 'automatic' mode
                const autoWithdrawalStartAgeForSolver = policyholderEntryAge + iWealthyOwnPPT;
                const autoResult = await ciCalculations.calculateAutomaticPlanCi(
                    policyholderEntryAge, policyholderGender, selectedCiPlans,
                    iWealthyInvestmentReturn, iWealthyOwnPPT, autoRppRtuRatio,
                    autoWithdrawalStartAgeForSolver, policyOriginMode, existingPolicyEntryAge
                );
                setResult(autoResult.outputIllustration);
                setCalculatedMinPremium(autoResult.minPremiumResult);
                setCalculatedRpp(autoResult.rppResult);
                setCalculatedRtu(autoResult.rtuResult);
                if (autoResult.errorMsg) {
                    setError(autoResult.errorMsg);
                }
            }
        } catch (err) {
            console.error("CI Calculation Error in useCiPlanner Hook (runCalculation):", err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred during calculation.');
        } finally {
            setIsLoading(false);
            onCalculationComplete?.();
        }
    }, [
        useIWealthy, iWealthyMode, policyholderEntryAge, policyholderGender,
        selectedCiPlans, manualRpp, manualRtu, iWealthyInvestmentReturn,
        iWealthyOwnPPT, iWealthyWithdrawalStartAge, autoRppRtuRatio,
        ciCalculations, ciPremiumsSchedule, policyOriginMode,
        existingPolicyEntryAge, onCalculationComplete
    ]);

    // --- Return Values ---
    return {
        policyholderEntryAge, setPolicyholderEntryAge,
        policyholderGender, setPolicyholderGender,
        policyOriginMode, setPolicyOriginMode,
        existingPolicyEntryAge, setExistingPolicyEntryAge,
        selectedCiPlans, setSelectedCiPlans,
        useIWealthy, setUseIWealthy,
        iWealthyMode, setIWealthyMode,
        iWealthyInvestmentReturn, setIWealthyInvestmentReturn,
        iWealthyOwnPPT, setIWealthyOwnPPT,
        iWealthyWithdrawalStartAge, setIWealthyWithdrawalStartAge,
        manualRpp, setManualRpp,
        manualRtu, setManualRtu,
        autoRppRtuRatio, setAutoRppRtuRatio,
        isLoading,
        error,
        result,
        ciPremiumsSchedule,
        calculatedMinPremium,
        calculatedRpp,
        calculatedRtu,
        runCalculation,
    };
}