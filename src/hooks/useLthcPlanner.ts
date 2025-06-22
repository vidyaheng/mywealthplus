// src/hooks/useLthcPlanner.ts

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
    Gender,
    HealthPlanSelections,
    AnnualLTHCOutputRow,
    UseLthcPlannerProps,
    UseLthcPlannerReturn,
    PolicyOriginMode,
    IWealthyMode,
    AnnualHealthPremiumDetail,
    SAReductionStrategy,
    SumInsuredReductionRecord,
} from './useLthcTypes';
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
    
    // State ใหม่สำหรับเก็บ "กลยุทธ์" การลดทุน (ค่าเริ่มต้นคือ auto)
    const [saReductionStrategy, setSaReductionStrategy] = useState<SAReductionStrategy>({ type: 'auto' });

    // Calculated Results from Automatic Mode
    const [calculatedMinPremium, setCalculatedMinPremium] = useState<number | undefined>();
    const [calculatedRpp, setCalculatedRpp] = useState<number | undefined>();
    const [calculatedRtu, setCalculatedRtu] = useState<number | undefined>();

    // Output Data & Status
    const [result, setResult] = useState<AnnualLTHCOutputRow[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (iWealthyMode === 'automatic') {
            let newPpt: number;
            if (policyholderEntryAge <= 45) { newPpt = 15; }
            else if (policyholderEntryAge <= 50) { newPpt = Math.max(1, 60 - policyholderEntryAge); }
            else { newPpt = 10; }
            setAutoIWealthyPPT(currentAutoPPT => currentAutoPPT !== newPpt ? newPpt : currentAutoPPT);
        }
    }, [policyholderEntryAge, iWealthyMode]);

    const lthcCalculations = useLthcCalculations();

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
        return [];
    }, [policyholderEntryAge, policyholderGender, selectedHealthPlans, policyOriginMode, existingPolicyEntryAge, lthcCalculations]);

    const runCalculation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setCalculatedMinPremium(undefined);
        setCalculatedRpp(undefined);
        setCalculatedRtu(undefined);

        if (!lthcCalculations.calculateManualPlan || !lthcCalculations.calculateAutomaticPlan || !lthcCalculations.generateSAReductionsForIWealthy) {
            setError("Calculation service is not properly initialized.");
            setIsLoading(false);
            return;
        }

        try {
            if ( iWealthyMode === 'manual') {
                // สำหรับโหมด Manual เรารู้ RPP ที่แน่นอน จึงคำนวณ List การลดทุนที่สมบูรณ์ได้เลย
                let reductionsForManual: SumInsuredReductionRecord[];
                if (saReductionStrategy.type === 'auto') {
                    // ถ้ากลยุทธ์เป็น auto ให้ใช้ค่า default ของระบบ
                    reductionsForManual = lthcCalculations.generateSAReductionsForIWealthy(policyholderEntryAge, manualRpp);
                } else {
                    // ถ้ากลยุทธ์เป็น manual ให้ส่ง ages ที่ผู้ใช้เลือกเข้าไป
                    reductionsForManual = lthcCalculations.generateSAReductionsForIWealthy(policyholderEntryAge, manualRpp, saReductionStrategy.ages);
                }

                const manualResultData = await lthcCalculations.calculateManualPlan(
                    policyholderEntryAge, policyholderGender, selectedHealthPlans,
                    manualRpp, manualRtu, manualInvestmentReturn,
                    manualIWealthyPPT, manualWithdrawalStartAge,
                    reductionsForManual, // << ส่ง list ที่คำนวณแล้วเข้าไป
                    policyOriginMode, existingPolicyEntryAge
                );
                setResult(manualResultData);

            } else { // iWealthyMode === 'automatic'
                // สำหรับโหมด Auto เรายังไม่รู้ RPP จึงส่งแค่ "ความตั้งใจ" (รายชื่ออายุ) เข้าไป
                const customAgesForAuto = saReductionStrategy.type === 'manual' 
                    ? saReductionStrategy.ages 
                    : undefined; // ถ้าเป็น 'auto' ให้ส่ง undefined เพื่อให้ engine ใช้ค่า default

                const autoResult = await lthcCalculations.calculateAutomaticPlan(
                    policyholderEntryAge, policyholderGender, selectedHealthPlans,
                    autoInvestmentReturn, autoIWealthyPPT, autoRppRtuRatio,
                    customAgesForAuto, // << ส่ง "รายชื่ออายุ" หรือ undefined เข้าไป
                    policyOriginMode, existingPolicyEntryAge
                );

                setResult(autoResult.outputIllustration);
                setCalculatedMinPremium(autoResult.minPremiumResult ?? undefined);
                setCalculatedRpp(autoResult.rppResult ?? undefined);
                setCalculatedRtu(autoResult.rtuResult ?? undefined);
                if (autoResult.errorMsg) setError(autoResult.errorMsg);
            }
        } catch (err) {
            console.error("LTHC Calculation Error in useLthcPlanner Hook:", err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred during calculation.');
        } finally {
            setIsLoading(false);
        }
    }, [
        saReductionStrategy, // Dependency ใหม่
        iWealthyMode, policyholderEntryAge, policyholderGender, selectedHealthPlans,
        manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT, manualWithdrawalStartAge,
        autoInvestmentReturn, autoIWealthyPPT, autoRppRtuRatio, policyOriginMode, existingPolicyEntryAge,
        lthcCalculations
    ]);

    const recalculate = useCallback(async (options?: {
        entryAge?: number;
        gender?: Gender;
        healthPlans?: HealthPlanSelections;
    }) => {
        if (options?.entryAge !== undefined) setPolicyholderEntryAge(options.entryAge);
        if (options?.gender) setPolicyholderGender(options.gender);
        if (options?.healthPlans) setSelectedHealthPlans(options.healthPlans);
        await runCalculation();
    }, [runCalculation]);

    return {
        policyOriginMode, setPolicyOriginMode,
        existingPolicyEntryAge, setExistingPolicyEntryAge,
        iWealthyMode, setIWealthyMode,
        isLoading,
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

        // ส่ง state และ setter ของ "กลยุทธ์" ใหม่ออกไป
        saReductionStrategy,
        setSaReductionStrategy,
    };
}