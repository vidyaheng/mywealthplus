// src/hooks/useLthcPlanner.ts
import { useState, useCallback, useEffect, useMemo } from 'react';

// Import Types from useLthcTypes.ts
import type {
    Gender,
    HealthPlanSelections,
    AnnualLTHCOutputRow,
    UseLthcPlannerProps,
    UseLthcPlannerReturn,
    PolicyOriginMode,
    IWealthyMode,
    AnnualHealthPremiumDetail,
    // Types ที่ LthcPage อาจจะใช้ในการ cast (ถ้ายังจำเป็น)
    //LifeReadyPaymentTerm,
    //IHealthyUltraPlan,
    //MEBPlan,
} from './useLthcTypes';

// Import the calculation hook
import { useLthcCalculations } from './useLthcCalculations';

export function useLthcPlanner({
    initialPolicyholderEntryAge,
    initialPolicyholderGender,
    initialSelectedHealthPlans,
    initialPolicyOriginMode = 'newPolicy',
    initialIWealthyMode = 'automatic',
}: UseLthcPlannerProps): UseLthcPlannerReturn {

    // --- State Management ---
    const [policyholderEntryAge, setPolicyholderEntryAge] = useState<number>(initialPolicyholderEntryAge);
    const [policyholderGender, setPolicyholderGender] = useState<Gender>(initialPolicyholderGender);
    const [selectedHealthPlans, setSelectedHealthPlans] = useState<HealthPlanSelections>(initialSelectedHealthPlans);
    const [policyOriginMode, setPolicyOriginMode] = useState<PolicyOriginMode>(initialPolicyOriginMode);
    const [existingPolicyEntryAge, setExistingPolicyEntryAge] = useState<number | undefined>(undefined);
    const [iWealthyMode, setIWealthyMode] = useState<IWealthyMode>(initialIWealthyMode);

    // Manual Mode States
    const [manualRpp, setManualRpp] = useState<number>(100000);
    const [manualRtu, setManualRtu] = useState<number>(0);
    const [manualInvestmentReturn, setManualInvestmentReturn] = useState<number>(5);
    const [manualIWealthyPPT, setManualIWealthyPPT] = useState<number>(15);
    const [manualWithdrawalStartAge, setManualWithdrawalStartAge] = useState<number>(61);

    // Automatic Mode States
    const [autoInvestmentReturn, setAutoInvestmentReturn] = useState<number>(5);
    const [autoIWealthyPPT, setAutoIWealthyPPT] = useState<number>(() => {
        if (initialPolicyholderEntryAge <= 45) return 15;
        if (initialPolicyholderEntryAge <= 50) return Math.max(1, 60 - initialPolicyholderEntryAge);
        return 10;
    });
    const [autoRppRtuRatio, setAutoRppRtuRatio] = useState<string>('100/0');

    // Calculated Results from Automatic Mode
    const [calculatedMinPremium, setCalculatedMinPremium] = useState<number | undefined>();
    const [calculatedRpp, setCalculatedRpp] = useState<number | undefined>();
    const [calculatedRtu, setCalculatedRtu] = useState<number | undefined>();

    // Output Data & Status
    const [result, setResult] = useState<AnnualLTHCOutputRow[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to update autoIWealthyPPT when entryAge or mode changes
    useEffect(() => {
        if (iWealthyMode === 'automatic') {
            let newPpt: number;
            if (policyholderEntryAge <= 45) { newPpt = 15; }
            else if (policyholderEntryAge <= 50) { newPpt = Math.max(1, 60 - policyholderEntryAge); }
            else { newPpt = 10; }
            setAutoIWealthyPPT(currentAutoPPT => currentAutoPPT !== newPpt ? newPpt : currentAutoPPT);
        }
    }, [policyholderEntryAge, iWealthyMode]);

    // --- Instantiate Calculation Hook ---
    const lthcCalculations = useLthcCalculations(); // Hook นี้จะคืน object ที่มีฟังก์ชันคำนวณ

    // Memoized health premiums (using the function from lthcCalculations hook)
    const healthPremiums = useMemo<AnnualHealthPremiumDetail[]>(() => {
        if (lthcCalculations && typeof lthcCalculations.calculateAllHealthPremiums === 'function') {
            return lthcCalculations.calculateAllHealthPremiums(
                policyholderEntryAge,
                policyholderGender,
                selectedHealthPlans,
                policyOriginMode,
                existingPolicyEntryAge
            );
        }
        console.warn("useLthcPlanner: lthcCalculations.calculateAllHealthPremiums is not available. Returning empty array.");
        return [];
    }, [policyholderEntryAge, policyholderGender, selectedHealthPlans, policyOriginMode, existingPolicyEntryAge, lthcCalculations]);


    // --- Main Calculation Function ---
    const runCalculation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setCalculatedMinPremium(undefined);
        setCalculatedRpp(undefined);
        setCalculatedRtu(undefined);

        if (!lthcCalculations || !lthcCalculations.calculateManualPlan || !lthcCalculations.calculateAutomaticPlan) {
            setError("Calculation service is not properly initialized.");
            setIsLoading(false);
            return;
        }
            const commonCalcParams = {
            currentEntryAge: policyholderEntryAge, // อายุ ณ ปัจจุบัน
            gender: policyholderGender,
            plans: selectedHealthPlans,
            originMode: policyOriginMode,
            originalEntryAge: existingPolicyEntryAge,
        };

        try {
            if ( iWealthyMode === 'manual') {
                const manualResultData = await lthcCalculations.calculateManualPlan(
                    policyholderEntryAge,
                    policyholderGender,
                    selectedHealthPlans,
                    manualRpp,
                    manualRtu,
                    manualInvestmentReturn,
                    manualIWealthyPPT,
                    manualWithdrawalStartAge,
                    commonCalcParams.originMode,
                    commonCalcParams.originalEntryAge
                );
                setResult(manualResultData);
                // if (manualResultData.errorMsg) setError(manualResultData.errorMsg); // If calculateManualPlan returns errorMsg

            } else { // mode === 'automatic'
                const autoResult = await lthcCalculations.calculateAutomaticPlan(
                    policyholderEntryAge,
                    policyholderGender,
                    selectedHealthPlans,
                    autoInvestmentReturn,
                    autoIWealthyPPT,
                    autoRppRtuRatio,
                    commonCalcParams.originMode, 
                    commonCalcParams.originalEntryAge
                );

                setResult(autoResult.outputIllustration); // Can be null if solver fails
                setCalculatedMinPremium(autoResult.minPremiumResult ?? undefined);
                setCalculatedRpp(autoResult.rppResult ?? undefined);
                setCalculatedRtu(autoResult.rtuResult ?? undefined);
                if (autoResult.errorMsg) {
                    setError(autoResult.errorMsg);
                }
            }
        } catch (err) {
            console.error("LTHC Calculation Error in useLthcPlanner Hook:", err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred during calculation.');
        } finally {
            setIsLoading(false);
        }
    }, [
        iWealthyMode, policyholderEntryAge, policyholderGender, selectedHealthPlans,
        manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT, manualWithdrawalStartAge,
        autoInvestmentReturn, autoIWealthyPPT, autoRppRtuRatio, policyOriginMode, existingPolicyEntryAge,
        lthcCalculations // Dependency on the calculation hook instance
    ]);

    const recalculate = useCallback(async (options?: {
        entryAge?: number;
        gender?: Gender;
        healthPlans?: HealthPlanSelections;
        policyOriginMode?: PolicyOriginMode;
        existingPolicyEntryAge?: number;
    }) => {
        if (options?.entryAge !== undefined) setPolicyholderEntryAge(options.entryAge);
        if (options?.gender) setPolicyholderGender(options.gender);
        if (options?.healthPlans) setSelectedHealthPlans(options.healthPlans);
        // Consider using useEffect to trigger runCalculation after state updates
        // or pass options directly to a modified runCalculation.
        await runCalculation();
    }, [runCalculation, setPolicyholderEntryAge, setPolicyholderGender, setSelectedHealthPlans, setPolicyOriginMode, setExistingPolicyEntryAge]);

    return {
        policyOriginMode, // ⭐ เพิ่ม
        setPolicyOriginMode, // ⭐ เพิ่ม
        existingPolicyEntryAge, // ⭐ เพิ่ม
        setExistingPolicyEntryAge, // ⭐ เพิ่ม
        iWealthyMode, // ⭐ เปลี่ยนชื่อ
        setIWealthyMode, // ⭐ เปลี่ยนชื่อ
        isLoading: isLoading, // Consistent with UseLthcPlannerReturn
        error,
        result,
        healthPremiums,
        runCalculation,
        recalculate,
        calculatedMinPremium,
        calculatedRpp,
        calculatedRtu,
        manualRpp, setManualRpp,
        manualRtu, setManualRtu,
        manualInvestmentReturn, setManualInvestmentReturn,
        manualIWealthyPPT, setManualIWealthyPPT,
        manualWithdrawalStartAge, setManualWithdrawalStartAge,
        autoInvestmentReturn, setAutoInvestmentReturn,
        autoIWealthyPPT, setAutoIWealthyPPT,
        autoRppRtuRatio, setAutoRppRtuRatio,
        policyholderEntryAge, setPolicyholderEntryAge,
        policyholderGender, setPolicyholderGender,
        selectedHealthPlans, setSelectedHealthPlans,
    };
}