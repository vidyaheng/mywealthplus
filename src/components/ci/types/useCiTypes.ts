// src/components/ci/types/useCiTypes.ts

// SECTION 1: Import Base Types from External Modules (Source of Truth)
import type {
    CalculationInput as OriginalIWealthyCalculationInput,
    AnnualCalculationOutputRow as OriginalIWealthyAnnualOutputRow,
    SumInsuredReductionRecord as OriginalSumInsuredReductionRecord,
    FrequencyChangeRecord as OriginalFrequencyChangeRecord,
    WithdrawalPlanRecord as OriginalWithdrawalPlanRecord,
    PausePeriodRecord as OriginalPausePeriodRecord,
    AddInvestmentRecord as OriginalAddInvestmentRecord,
} from '@/lib/calculations'; // โปรดตรวจสอบและปรับ Path ให้ถูกต้อง

import type {
    Gender as ImportedGender, // 'male' | 'female'
} from '@/lib/healthPlanCalculations'; // โปรดตรวจสอบและปรับ Path ให้ถูกต้อง

{/*import type {
    LifeReadyPlan as OriginalLifeReadyPlan, // 6 | 12 | 18 | 99
    IShieldPlan as OriginalIShieldPlan,     // "05" | "10" | "15" | "20"
    AllRokRaiSoShieldPremiums,
} from '../utils/premiumCalcs'; // โปรดตรวจสอบและปรับ Path ให้ถูกต้อง*/}

// ====================================================================================
// SECTION 2: Core Types for CI Planner
// ====================================================================================

export type Gender = ImportedGender; // 'male' | 'female'
export type PolicyOriginMode = 'newPolicy' | 'existingPolicy';
export type IWealthyMode = 'manual' | 'automatic';
export type PaymentFrequency = 'monthly' | 'annual';

// --- CI Plan Specific Types ---
export type LifeReadyPlan = 6 | 12 | 18 | 99;
export type IShieldPlan = "05" | "10" | "15" | "20";
export type RokRaiSoShieldPlan = "S" | "M" | "L" | "XL";
export type RokraiPlan = 'S' | 'M' | 'L' | 'XL';

export interface CiPlanSelections {
    icareChecked: boolean;
    icareSA: number;
    ishieldChecked: boolean;
    ishieldPlan: IShieldPlan | '';
    ishieldSA: number;
    mainRiderChecked: boolean;
    lifeReadyPlan: LifeReadyPlan | '';
    lifeReadySA: number;
    rokraiChecked: boolean;
    rokraiPlan: RokRaiSoShieldPlan | '';
    dciChecked: boolean;
    dciSA: number;
}

// --- iWealthy Calculation Related Types ---
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
    initialUseIWealthy?: boolean; // <<--- เพิ่ม Prop นี้สำหรับค่าเริ่มต้นของ Toggle iWealthy
    onCalculationComplete?: () => void;
}

export interface UseCiPlannerReturn {
    // Policyholder & Policy Context Info
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

    // iWealthy Toggle
    useIWealthy: boolean; // <<--- เพิ่ม State นี้
    setUseIWealthy: React.Dispatch<React.SetStateAction<boolean>>; // <<--- เพิ่ม Setter นี้

    // iWealthy Configuration (Consolidated shared states)
    iWealthyMode: IWealthyMode;
    setIWealthyMode: React.Dispatch<React.SetStateAction<IWealthyMode>>;
    iWealthyInvestmentReturn: number;
    setIWealthyInvestmentReturn: React.Dispatch<React.SetStateAction<number>>;
    iWealthyOwnPPT: number;
    setIWealthyOwnPPT: React.Dispatch<React.SetStateAction<number>>;
    iWealthyWithdrawalStartAge: number;
    setIWealthyWithdrawalStartAge: React.Dispatch<React.SetStateAction<number>>;

    // Manual Mode Specific iWealthy states
    manualRpp: number;
    setManualRpp: React.Dispatch<React.SetStateAction<number>>;
    manualRtu: number;
    setManualRtu: React.Dispatch<React.SetStateAction<number>>;

    // Auto Mode Specific iWealthy states
    autoRppRtuRatio: string;
    setAutoRppRtuRatio: React.Dispatch<React.SetStateAction<string>>;

    // Results and Status
    isLoading: boolean;
    error: string | null;
    result: AnnualCiOutputRow[] | null;
    ciPremiumsSchedule: AnnualCiPremiumDetail[] | null;

    // Calculated values from solver (Automatic mode)
    calculatedMinPremium?: number;
    calculatedRpp?: number;
    calculatedRtu?: number;

    // Action functions
    runCalculation: () => Promise<void>;
}

// ====================================================================================
// SECTION 4: Constants (ถ้ามีค่าคงที่เฉพาะสำหรับ CI หรือจะ re-export จากที่อื่น)
// ====================================================================================
export const MINIMUM_ALLOWABLE_SYSTEM_RPP_CI = 18000;
export const DEFAULT_RPP_RTU_RATIO_CI = '100:0';
export const MAX_POLICY_AGE_CI = 98;
// คุณอาจจะต้องการ re-export ค่าคงที่จาก useLthcTypes.ts หากใช้ค่าเดียวกันและไม่อยากประกาศซ้ำ
// import { MAX_POLICY_AGE_TYPE } from '../../hooks/useLthcTypes'; // ตัวอย่าง
// export const MAX_POLICY_AGE_CI = MAX_POLICY_AGE_TYPE;