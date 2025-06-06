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
} from '../types/useCiTypes'; // โปรดตรวจสอบ Path: จาก useCiPlanner.ts ไปยัง useCiTypes.ts

// --- Calculation Hook ---
import { useCiCalculations } from './useCiCalculations'; // โปรดตรวจสอบ Path: จาก useCiPlanner.ts ไปยัง useCiCalculations.ts (ถ้า useCiCalculations อยู่ใน src/hooks/)

const defaultInitialCiPlans: CiPlanSelections = {
    icareChecked: false,
    icareSA: 0,
    ishieldChecked: false,
    ishieldPlan: null,
    ishieldSA: 0,
    mainRiderChecked: false,
    lifeReadyPlan: null,
    lifeReadySA: 0,
    rokraiChecked: false,
    rokraiPlan: null,
    dciChecked: false,
    dciSA: 0,
};

export function useCiPlanner({
    initialPolicyholderEntryAge,
    initialPolicyholderGender,
    initialSelectedCiPlans = defaultInitialCiPlans,
    initialIWealthyMode = 'automatic',
    initialPolicyOriginMode = 'newPolicy',
    initialUseIWealthy = false, // ค่าเริ่มต้นสำหรับ useIWealthy คือ false (ปิด)
}: UseCiPlannerProps): UseCiPlannerReturn {

    // --- States for Policyholder & Policy Context ---
    const [policyholderEntryAge, setPolicyholderEntryAge] = useState<number>(initialPolicyholderEntryAge);
    const [policyholderGender, setPolicyholderGender] = useState<Gender>(initialPolicyholderGender);
    const [policyOriginMode, setPolicyOriginMode] = useState<PolicyOriginMode>(initialPolicyOriginMode);
    const [existingPolicyEntryAge, setExistingPolicyEntryAge] = useState<number | undefined>(undefined);

    // --- State for CI Plan Selections ---
    const [selectedCiPlans, setSelectedCiPlans] = useState<CiPlanSelections>(initialSelectedCiPlans);

    // --- State for iWealthy Toggle ---
    const [useIWealthy, setUseIWealthy] = useState<boolean>(initialUseIWealthy);
    

    // --- States for iWealthy Configuration ---
    const [iWealthyMode, setIWealthyMode] = useState<IWealthyMode>(initialIWealthyMode);
    const [iWealthyInvestmentReturn, setIWealthyInvestmentReturn] = useState<number>(5);
    const [iWealthyOwnPPT, setIWealthyOwnPPT] = useState<number>(10);
    const [iWealthyWithdrawalStartAge, setIWealthyWithdrawalStartAge] = useState<number>(60);
    const [manualRpp, setManualRpp] = useState<number>(18000);
    const [manualRtu, setManualRtu] = useState<number>(0);
    const [autoRppRtuRatio, setAutoRppRtuRatio] = useState<string>('100:0');

    // --- Results & Status ---
    const [result, setResult] = useState<AnnualCiOutputRow[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [ciPremiumsSchedule, setCiPremiumsSchedule] = useState<AnnualCiPremiumDetail[] | null>(null);

    // Solver results
    const [calculatedMinPremium, setCalculatedMinPremium] = useState<number | undefined>();
    const [calculatedRpp, setCalculatedRpp] = useState<number | undefined>();
    const [calculatedRtu, setCalculatedRtu] = useState<number | undefined>();

    // --- Instantiate Calculation Hook ---
    const ciCalculations = useCiCalculations();

    // --- Pre-calculate CI Premium Schedule when inputs change ---
    useEffect(() => {
        // console.log("useEffect for ciPremiumsSchedule in useCiPlanner triggered. Dependencies:",
        //     policyholderEntryAge, policyholderGender, selectedCiPlans, policyOriginMode, existingPolicyEntryAge, ciCalculations.calculateAllCiPremiumsSchedule
        // );
        if (ciCalculations && ciCalculations.calculateAllCiPremiumsSchedule) {
            const newSchedule = ciCalculations.calculateAllCiPremiumsSchedule(
                policyholderEntryAge,
                policyholderGender,
                selectedCiPlans,
                policyOriginMode,
                existingPolicyEntryAge
                // maxScheduleAge can be passed here if dynamic, otherwise uses default in function
            );

            // เปรียบเทียบ schedule ใหม่กับค่าใน state เดิมก่อนเรียก setCiPremiumsSchedule
            if (JSON.stringify(newSchedule) !== JSON.stringify(ciPremiumsSchedule)) {
                // console.log("New CI premium schedule is different, updating state in useCiPlanner.");
                setCiPremiumsSchedule(newSchedule);
            } else {
                // console.log("New CI premium schedule is the same as current in useCiPlanner, no state update.");
            }
        }
    }, [
        policyholderEntryAge,
        policyholderGender,
        selectedCiPlans,
        policyOriginMode,
        existingPolicyEntryAge,
        ciCalculations.calculateAllCiPremiumsSchedule, // Function reference from hook
        ciPremiumsSchedule // State for comparison
    ]);

    // --- Main Calculation Trigger ---
    const runCalculation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setCalculatedMinPremium(undefined);
        setCalculatedRpp(undefined);
        setCalculatedRtu(undefined);

        // ciPremiumsSchedule ควรจะถูกคำนวณและ set โดย useEffect ข้างบนแล้ว
        // ถ้า ciPremiumsSchedule ยังเป็น null อาจจะยังไม่พร้อม หรือมีปัญหา
        const currentCiScheduleForCalc = ciPremiumsSchedule || []; // ใช้ array ว่างถ้ายังเป็น null

        if (!useIWealthy) {
            if (currentCiScheduleForCalc.length > 0) {
                // สร้างผลลัพธ์ที่แสดงเฉพาะข้อมูล CI premiums
                const ciOnlyIllustration: AnnualCiOutputRow[] = currentCiScheduleForCalc.map(ciRow => {
                    const lifeReadySAForCombinedDB = (selectedCiPlans.mainRiderChecked && selectedCiPlans.lifeReadySA > 0)
                        ? selectedCiPlans.lifeReadySA
                        : 0;
                    return {
                        policyYear: ciRow.policyYear,
                        age: ciRow.age,
                        lifeReadyPremiumPaid: ciRow.lifeReadyPremium,
                        ciRidersPremiumPaid: Math.round(
                            (ciRow.icarePremium || 0) +
                            (ciRow.ishieldPremium || 0) +
                            (ciRow.rokraiPremium || 0) +
                            (ciRow.dciPremium || 0)
                        ),
                        totalCiPackagePremiumPaid: Math.round(ciRow.totalCiPremium),
                        iWealthyRpp: undefined, iWealthyRtu: undefined, iWealthyTotalPremium: undefined,
                        iWealthyWithdrawal: undefined, iWealthyEoyAccountValue: undefined,
                        iWealthyEoyDeathBenefit: undefined, iWealthySumAssured: undefined,
                        iWealthyEOYCSV: undefined, iWealthyPremChargeRPP: undefined,
                        iWealthyPremChargeRTU: undefined, iWealthyPremChargeTotal: undefined,
                        iWealthyCOI: undefined, iWealthyAdminFee: undefined, iWealthyTotalFees: undefined,
                        iWealthyInvestmentBase: undefined, iWealthyInvestmentReturn: undefined,
                        iWealthyRoyaltyBonus: undefined,
                        totalCombinedDeathBenefit: lifeReadySAForCombinedDB,
                    };
                });
                setResult(ciOnlyIllustration);
            } else {
                setResult(null); // ไม่มี schedule ก็ไม่มี result
            }
            setIsLoading(false);
            return;
        }

        // กรณีใช้ iWealthy
        if (!ciCalculations.calculateManualPlanCi || !ciCalculations.calculateAutomaticPlanCi) {
            setError("Calculation services for iWealthy are not available.");
            setIsLoading(false);
            return;
        }
        if (currentCiScheduleForCalc.length === 0 && useIWealthy) { // เพิ่มการตรวจสอบนี้
             setError("CI premium schedule is not available for iWealthy calculation. Please select CI plans.");
             setIsLoading(false);
             return;
        }

        try {
            if (iWealthyMode === 'manual') {
                const manualResultData = await ciCalculations.calculateManualPlanCi(
                    policyholderEntryAge,
                    policyholderGender,
                    selectedCiPlans,
                    manualRpp,
                    manualRtu,
                    iWealthyInvestmentReturn,
                    iWealthyOwnPPT,
                    iWealthyWithdrawalStartAge,
                    policyOriginMode,
                    existingPolicyEntryAge
                );
                setResult(manualResultData);
            } else { // 'automatic' mode
                const autoWithdrawalStartAgeForSolver = policyholderEntryAge + iWealthyOwnPPT;
                const autoResult = await ciCalculations.calculateAutomaticPlanCi(
                    policyholderEntryAge,
                    policyholderGender,
                    selectedCiPlans,
                    iWealthyInvestmentReturn,
                    iWealthyOwnPPT,
                    autoRppRtuRatio,
                    autoWithdrawalStartAgeForSolver,
                    policyOriginMode,
                    existingPolicyEntryAge
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
            setError(err instanceof Error ? err.message : 'An unexpected error occurred during iWealthy calculation.');
        } finally {
            setIsLoading(false);
        }
    }, [
        useIWealthy,
        iWealthyMode,
        policyholderEntryAge,
        policyholderGender,
        selectedCiPlans, // Object - การเปลี่ยนแปลง reference จะ trigger
        manualRpp,
        manualRtu,
        iWealthyInvestmentReturn,
        iWealthyOwnPPT,
        iWealthyWithdrawalStartAge,
        autoRppRtuRatio,
        ciCalculations, // Object ที่มี functions ที่ memoized
        ciPremiumsSchedule, // State ที่ใช้ใน branch ของ !useIWealthy
        policyOriginMode,
        existingPolicyEntryAge
    ]);

    // --- Return Values for CIFormPage.tsx ---
    return {
        // Policyholder & Policy Context Info
        policyholderEntryAge, setPolicyholderEntryAge,
        policyholderGender, setPolicyholderGender,
        policyOriginMode, setPolicyOriginMode,
        existingPolicyEntryAge, setExistingPolicyEntryAge,

        // CI Plan Selections
        selectedCiPlans, setSelectedCiPlans,

        // iWealthy Toggle
        useIWealthy, setUseIWealthy,
        

        // iWealthy Configuration
        iWealthyMode, setIWealthyMode,
        iWealthyInvestmentReturn, setIWealthyInvestmentReturn,
        iWealthyOwnPPT, setIWealthyOwnPPT,
        iWealthyWithdrawalStartAge, setIWealthyWithdrawalStartAge,

        // Manual Mode Specific
        manualRpp, setManualRpp,
        manualRtu, setManualRtu,

        // Auto Mode Specific
        autoRppRtuRatio, setAutoRppRtuRatio,

        // Results and Status
        isLoading,
        error,
        result,
        ciPremiumsSchedule,

        // Calculated values from solver
        calculatedMinPremium,
        calculatedRpp,
        calculatedRtu,

        // Action functions
        runCalculation,
    };
}