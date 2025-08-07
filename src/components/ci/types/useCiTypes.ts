// src/components/ci/types/useCiTypes.ts

// ====================================================================================
// SECTION 1: Import Base Types from External Modules (Source of Truth)
// ====================================================================================

// --- Types from a shared calculation library ---
import type {
    CalculationInput as OriginalIWealthyCalculationInput,
    AnnualCalculationOutputRow as OriginalIWealthyAnnualOutputRow,
    SumInsuredReductionRecord as OriginalSumInsuredReductionRecord,
    FrequencyChangeRecord as OriginalFrequencyChangeRecord,
    WithdrawalPlanRecord as OriginalWithdrawalPlanRecord,
    PausePeriodRecord as OriginalPausePeriodRecord,
    AddInvestmentRecord as OriginalAddInvestmentRecord,
} from '@/lib/calculations'; // โปรดตรวจสอบและปรับ Path ให้ถูกต้อง

// --- Types from another shared calculation library ---
import type {
    Gender as ImportedGender, // 'male' | 'female'
} from '@/lib/healthPlanCalculations'; // โปรดตรวจสอบและปรับ Path ให้ถูกต้อง


// ====================================================================================
// SECTION 2: Core Types for CI Planner
// ====================================================================================

export type Gender = ImportedGender;
export type PolicyOriginMode = 'newPolicy' | 'existingPolicy';
export type IWealthyMode = 'manual' | 'automatic';
export type PaymentFrequency = 'monthly' | 'annual';

// --- CI Plan Specific Types ---
export type LifeReadyPlan = 6 | 12 | 18 | 99;
export type IShieldPlan = "05" | "10" | "15" | "20";
export type RokRaiSoShieldPlan = "S" | "M" | "L" | "XL"; // ใช้ชื่อนี้เป็นชื่อหลัก

export interface StopPaymentConfig {
    useCustomStopAge: boolean;
    stopAge: number;
}

export interface CiPlanSelections {
    icareChecked: boolean;
    icareSA: number;
    icareStopPayment: StopPaymentConfig;
    ishieldChecked: boolean;
    ishieldPlan: IShieldPlan | null;
    ishieldSA: number;
    ishieldStopPayment: StopPaymentConfig;
    mainRiderChecked: boolean;
    lifeReadyPlan: LifeReadyPlan | null;
    lifeReadySA: number;
    lifeReadyStopPayment: StopPaymentConfig;
    rokraiChecked: boolean;
    rokraiPlan: RokRaiSoShieldPlan | null; // แก้ไขให้ใช้ชื่อ Type ที่ตรงกัน
    rokraiStopPayment: StopPaymentConfig;
    dciChecked: boolean;
    dciSA: number;
    dciStopPayment: StopPaymentConfig;
}

// --- iWealthy Calculation Related Types ---
// Re-exporting for use within the CI Planner context
export type SumInsuredReductionRecord = OriginalSumInsuredReductionRecord;
export type FrequencyChangeRecord = OriginalFrequencyChangeRecord;
export type WithdrawalPlanRecord = OriginalWithdrawalPlanRecord;
export type PausePeriodRecord = OriginalPausePeriodRecord;
export type AddInvestmentRecord = OriginalAddInvestmentRecord;
export type CalculationInput = OriginalIWealthyCalculationInput;
export type IWealthyAnnualOutputRow = OriginalIWealthyAnnualOutputRow;

// ====================================================================================
// SECTION 3: CI Planner Specific Output and Prop/Return Types
// ====================================================================================

export interface AnnualCiPremiumDetail {
    policyYear: number;
    age: number;
    totalCiPremium: number;
    lifeReadyPremium?: number;
    icarePremium?: number;
    ishieldPremium?: number;
    rokraiPremium?: number;
    dciPremium?: number;
}

export interface AnnualCiOutputRow {
    policyYear: number;
    age: number;
    lifeReadyPremiumPaid?: number;
    ciRidersPremiumPaid?: number;
    totalCiPackagePremiumPaid?: number;
    iWealthyRpp?: number;
    iWealthyRtu?: number;
    iWealthyTotalPremium?: number;
    iWealthyWithdrawal?: number;
    iWealthyEoyAccountValue?: number;
    iWealthyEoyDeathBenefit?: number;
    iWealthySumAssured?: number;
    iWealthyEOYCSV?: number;
    iWealthyPremChargeRPP?: number;
    iWealthyPremChargeRTU?: number;
    iWealthyPremChargeTotal?: number;
    iWealthyCOI?: number;
    iWealthyAdminFee?: number;
    iWealthyTotalFees?: number;
    iWealthyInvestmentBase?: number;
    iWealthyInvestmentReturn?: number;
    iWealthyRoyaltyBonus?: number;
    totalCombinedDeathBenefit?: number;
}

export interface UseCiPlannerProps {
    initialPolicyholderEntryAge: number;
    initialPolicyholderGender: Gender;
    initialSelectedCiPlans?: CiPlanSelections;
    initialIWealthyMode?: IWealthyMode;
    initialPolicyOriginMode?: PolicyOriginMode;
    initialUseIWealthy?: boolean;
    onCalculationComplete?: () => void;
}

export interface UseCiPlannerReturn {
    // Policyholder & Policy Context
    policyholderEntryAge: number;
    setPolicyholderEntryAge: React.Dispatch<React.SetStateAction<number>>;
    policyholderGender: Gender;
    setPolicyholderGender: React.Dispatch<React.SetStateAction<Gender>>;
    policyOriginMode: PolicyOriginMode;
    setPolicyOriginMode: React.Dispatch<React.SetStateAction<PolicyOriginMode>>;
    existingPolicyEntryAge?: number;
    setExistingPolicyEntryAge: React.Dispatch<React.SetStateAction<number | undefined>>;

    // CI Plan Selections
    selectedCiPlans: CiPlanSelections;
    setSelectedCiPlans: React.Dispatch<React.SetStateAction<CiPlanSelections>>;

    // iWealthy Toggle & Config
    useIWealthy: boolean;
    setUseIWealthy: React.Dispatch<React.SetStateAction<boolean>>;
    iWealthyMode: IWealthyMode;
    setIWealthyMode: React.Dispatch<React.SetStateAction<IWealthyMode>>;
    iWealthyInvestmentReturn: number;
    setIWealthyInvestmentReturn: React.Dispatch<React.SetStateAction<number>>;
    iWealthyOwnPPT: number;
    setIWealthyOwnPPT: React.Dispatch<React.SetStateAction<number>>;
    iWealthyWithdrawalStartAge: number;
    setIWealthyWithdrawalStartAge: React.Dispatch<React.SetStateAction<number>>;
    
    // --- จุดที่แก้ไข ---
    // เพิ่ม State และ Setter สำหรับ Toggle "กำหนดอายุที่เริ่มถอนเอง"
    ciUseCustomWithdrawalAge: boolean;
    setCiUseCustomWithdrawalAge: React.Dispatch<React.SetStateAction<boolean>>;
    // -------------------------------------------------------------

    manualRpp: number;
    setManualRpp: React.Dispatch<React.SetStateAction<number>>;
    manualRtu: number;
    setManualRtu: React.Dispatch<React.SetStateAction<number>>;
    autoRppRtuRatio: string;
    setAutoRppRtuRatio: React.Dispatch<React.SetStateAction<string>>;

    // Results & Status
    isLoading: boolean;
    error: string | null;
    result: AnnualCiOutputRow[] | null;
    ciPremiumsSchedule: AnnualCiPremiumDetail[] | null;
    calculatedMinPremium?: number;
    calculatedRpp?: number;
    calculatedRtu?: number;

    // Actions
    runCalculation: () => Promise<void>;
}

// ====================================================================================
// SECTION 4: Constants
// ====================================================================================

export const MINIMUM_ALLOWABLE_SYSTEM_RPP_CI = 18000;
export const DEFAULT_RPP_RTU_RATIO_CI = '100:0';
export const MAX_POLICY_AGE_CI = 98;