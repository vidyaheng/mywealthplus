// src/hooks/useLthcTypes.ts

// SECTION 1: Import Base Types from External Modules (Source of Truth)
import type {
    CalculationInput as OriginalIWealthyCalculationInput,
    AnnualCalculationOutputRow as OriginalIWealthyAnnualOutputRow,
    SumInsuredReductionRecord as OriginalSumInsuredReductionRecord,
    FrequencyChangeRecord as OriginalFrequencyChangeRecord,
    WithdrawalPlanRecord as OriginalWithdrawalPlanRecord,
    // MonthlyCalculationOutputRow, // ถ้าจะใช้ type นี้โดยตรงจาก calculations.ts
} from '../lib/calculations';

import type {
    Gender as HealthPlanGenderOriginal,
    // HealthPlanSelections as HealthPlanSelectionsOriginal, // เราจะนิยามใหม่ให้ชัดเจนด้านล่าง
    LifeReadyPaymentTerm as LifeReadyPaymentTermOriginal,
    IHealthyUltraPlan as IHealthyUltraPlanOriginal, // นี่คือ Union ของชื่อแผน IHU จริงๆ
    MEBPlan as MEBPlanOriginal,                 // นี่คือ Union ของค่าแผน MEB จริงๆ
} from '../lib/healthPlanCalculations';

// ====================================================================================
// SECTION 2: Core Types for LTHC Planner
// ====================================================================================

// --- Basic Enum-like Types ---
export type Gender = HealthPlanGenderOriginal;
export type PolicyOriginMode = 'newPolicy' | 'existingPolicy';
export type IWealthyMode = 'manual' | 'automatic'; //เปลี่ยนจากเดิม LTHCMode
export type PaymentFrequency = 'monthly' | 'annual';

// --- Health Plan Specific Types ---
export type LifeReadyPaymentTerm = LifeReadyPaymentTermOriginal;

// For iHealthyUltra:
// IHealthyUltraPlan will be the type for actual plan names ('Smart', 'Bronze', etc.)
export type IHealthyUltraPlan = IHealthyUltraPlanOriginal;
// IHealthyUltraPlanSelection will include a way to signify "not selected"
export type IHealthyUltraPlanSelection = IHealthyUltraPlan | null; // 'NONE' signifies not selected

// For MEB:
// MEBPlan will be the type for actual plan values (500, 1000, etc.)
export type MEBPlan = MEBPlanOriginal;
// MEBPlanSelection will include a way to signify "not selected" (using 0 as per previous UI logic)
export type MEBPlanSelection = MEBPlan | null; // 0 signifies not selected

// Interface for the user's health plan selections
export interface HealthPlanSelections {
    lifeReadySA: number;
    lifeReadyPPT: LifeReadyPaymentTerm;
    iHealthyUltraPlan: IHealthyUltraPlanSelection; // Uses the selection type
    mebPlan: MEBPlanSelection;                     // Uses the selection type
}

// --- iWealthy Calculation Related Types (Re-exported) ---
export type SumInsuredReductionRecord = OriginalSumInsuredReductionRecord;
export type FrequencyChangeRecord = OriginalFrequencyChangeRecord;
export type WithdrawalPlanRecord = OriginalWithdrawalPlanRecord;
export type CalculationInput = OriginalIWealthyCalculationInput;
export type IWealthyAnnualOutputRow = OriginalIWealthyAnnualOutputRow;


// ====================================================================================
// SECTION 3: LTHC Planner Specific Output and Prop/Return Types
// ====================================================================================
export interface AnnualLTHCOutputRow {
    policyYear: number;
    age: number;
    lifeReadyPremium: number;
    lifeReadyDeathBenefit: number;
    iHealthyUltraPremium: number; // เบี้ยที่จ่ายจริง (อาจเป็น 0 ถ้าไม่เลือก)
    mebPremium: number;           // เบี้ยที่จ่ายจริง (อาจเป็น 0 ถ้าไม่เลือก)
    totalHealthPremium: number;
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

export interface AnnualHealthPremiumDetail {
    year: number;
    age: number;
    totalPremium: number;
    lrPrem: number;
    ihuPrem: number; // เบี้ยที่คำนวณได้สำหรับแผน IHU (อาจเป็น 0 ถ้าไม่เลือก)
    mebPrem: number;  // เบี้ยที่คำนวณได้สำหรับแผน MEB (อาจเป็น 0 ถ้าไม่เลือก)
}

export interface UseLthcPlannerProps {
    initialPolicyholderEntryAge: number;
    initialPolicyholderGender: Gender;
    initialSelectedHealthPlans: HealthPlanSelections; // ใช้ HealthPlanSelections ที่นิยามในไฟล์นี้
    initialPolicyOriginMode?: PolicyOriginMode; 
    initialIWealthyMode?: IWealthyMode;
}

export interface UseLthcPlannerReturn {
    policyOriginMode: PolicyOriginMode;
    setPolicyOriginMode: React.Dispatch<React.SetStateAction<PolicyOriginMode>>; 
    iWealthyMode: IWealthyMode;
    setIWealthyMode: React.Dispatch<React.SetStateAction<IWealthyMode>>;
    existingPolicyEntryAge?: number;
    setExistingPolicyEntryAge: React.Dispatch<React.SetStateAction<number | undefined>>;
    policyholderEntryAge: number;
    setPolicyholderEntryAge: React.Dispatch<React.SetStateAction<number>>;
    policyholderGender: Gender;
    setPolicyholderGender: React.Dispatch<React.SetStateAction<Gender>>;
    selectedHealthPlans: HealthPlanSelections; // State นี้จะมี iHealthyUltraPlan เป็น IHealthyUltraPlanSelection
    setSelectedHealthPlans: React.Dispatch<React.SetStateAction<HealthPlanSelections>>;
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
    result: AnnualLTHCOutputRow[] | null;
    healthPremiums: AnnualHealthPremiumDetail[];
    calculatedMinPremium?: number;
    calculatedRpp?: number;
    calculatedRtu?: number;
    isLoading: boolean;
    error: string | null;
    runCalculation: () => Promise<void>;
    recalculate: (options: {
        entryAge?: number;
        gender?: Gender;
        healthPlans?: HealthPlanSelections;
    }) => Promise<void>;
}

// ====================================================================================
// SECTION 8: Constants
// ====================================================================================
export const MINIMUM_ALLOWABLE_SYSTEM_RPP_TYPE = 18000;
export const DEFAULT_RPP_RTU_RATIO_TYPE = '100/0';
export const MAX_POLICY_AGE_TYPE = 98;
export const MEB_TERMINATION_AGE_TYPE = 74;