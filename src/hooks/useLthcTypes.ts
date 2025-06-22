// src/hooks/useLthcTypes.ts

import type {
    CalculationInput as OriginalIWealthyCalculationInput,
    AnnualCalculationOutputRow as OriginalIWealthyAnnualOutputRow,
    SumInsuredReductionRecord as OriginalSumInsuredReductionRecord,
    FrequencyChangeRecord as OriginalFrequencyChangeRecord,
    WithdrawalPlanRecord as OriginalWithdrawalPlanRecord,
} from '../lib/calculations';

import type {
    Gender as HealthPlanGenderOriginal,
    LifeReadyPaymentTerm as LifeReadyPaymentTermOriginal,
    IHealthyUltraPlan as IHealthyUltraPlanOriginal,
    MEBPlan as MEBPlanOriginal,
} from '../lib/healthPlanCalculations';
import React from 'react';

// --- Type ใหม่สำหรับเก็บ "กลยุทธ์" การลดทุน ---
export type SAReductionStrategy = 
    | { type: 'auto' } // กลยุทธ์แบบอัตโนมัติ (ใช้ค่า default ของระบบ)
    | { type: 'manual', ages: number[] }; // กลยุทธ์แบบกำหนดเอง เก็บแค่อายุที่ต้องการลด

// --- Basic Enum-like Types ---
export type Gender = HealthPlanGenderOriginal;
export type PolicyOriginMode = 'newPolicy' | 'existingPolicy';
export type IWealthyMode = 'manual' | 'automatic';
export type PaymentFrequency = 'monthly' | 'annual';

// --- Health Plan Specific Types ---
export type LifeReadyPaymentTerm = LifeReadyPaymentTermOriginal;
export type IHealthyUltraPlan = IHealthyUltraPlanOriginal;
export type IHealthyUltraPlanSelection = IHealthyUltraPlan | null;
export type MEBPlan = MEBPlanOriginal;
export type MEBPlanSelection = MEBPlan | null;

export interface HealthPlanSelections {
    lifeReadySA: number;
    lifeReadyPPT: LifeReadyPaymentTerm;
    iHealthyUltraPlan: IHealthyUltraPlanSelection;
    mebPlan: MEBPlanSelection;
}

// --- iWealthy Calculation Related Types (Re-exported) ---
export type SumInsuredReductionRecord = OriginalSumInsuredReductionRecord;
export type FrequencyChangeRecord = OriginalFrequencyChangeRecord;
export type WithdrawalPlanRecord = OriginalWithdrawalPlanRecord;
export type CalculationInput = OriginalIWealthyCalculationInput;
export type IWealthyAnnualOutputRow = OriginalIWealthyAnnualOutputRow;

// --- LTHC Planner Specific Output and Prop/Return Types ---
export interface AnnualLTHCOutputRow {
    policyYear: number;
    age: number;
    lifeReadyPremium: number;
    lifeReadyDeathBenefit: number;
    iHealthyUltraPremium: number;
    mebPremium: number;
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
    ihuPrem: number;
    mebPrem: number;
}

export interface UseLthcPlannerProps {
    initialPolicyholderEntryAge: number;
    initialPolicyholderGender: Gender;
    initialSelectedHealthPlans: HealthPlanSelections;
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
    selectedHealthPlans: HealthPlanSelections;
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

    // --- ส่วนที่แก้ไขให้ใช้ "กลยุทธ์" (เก็บไว้เฉพาะส่วนนี้) ---
    saReductionStrategy: SAReductionStrategy;
    setSaReductionStrategy: React.Dispatch<React.SetStateAction<SAReductionStrategy>>;
}

// --- Constants ---
export const MINIMUM_ALLOWABLE_SYSTEM_RPP_TYPE = 18000;
export const DEFAULT_RPP_RTU_RATIO_TYPE = '100/0';
export const MAX_POLICY_AGE_TYPE = 98;
export const MEB_TERMINATION_AGE_TYPE = 74;