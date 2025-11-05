// src/hooks/useLthcTypes.ts

// --- Original Imports ---
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
import type { PensionPlanType as PensionPlanTypeOriginal } from '../data/pensionRates';


// --- New & Existing Type Definitions ---
export type PensionPlanType = PensionPlanTypeOriginal;
export type FundingSource = 'none' | 'iWealthy' | 'pension' | 'hybrid';
export type PensionMode = 'automatic' | 'manual';

export interface PensionFundingOptions {
    planType: PensionPlanType;
}

export interface PensionInputParams {
    pensionMode: PensionMode; 
    
    // พารามิเตอร์สำหรับโหมด Manual
    manualPensionPlanType: PensionPlanType;
    manualPensionPremium: number;
    pensionStartAge: number;
    pensionEndAge: number; 

    // พารามิเตอร์สำหรับโหมด Automatic
    autoPensionPlanType: PensionPlanType;
    autoPensionPremium: number;
}

// --- Original Type Aliases ---
export type SAReductionStrategy = { type: 'auto' } | { type: 'manual', ages: number[] } | { type: 'none' };
export type Gender = HealthPlanGenderOriginal;
export type PolicyOriginMode = 'newPolicy' | 'existingPolicy';
export type IWealthyMode = 'manual' | 'automatic';
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
    pensionPlanType?: PensionPlanType;
}

export type SumInsuredReductionRecord = OriginalSumInsuredReductionRecord;
export type FrequencyChangeRecord = OriginalFrequencyChangeRecord;
export type WithdrawalPlanRecord = OriginalWithdrawalPlanRecord;
export type CalculationInput = OriginalIWealthyCalculationInput;
export type IWealthyAnnualOutputRow = OriginalIWealthyAnnualOutputRow;
export interface TaxSavingsBreakdown {
  life: number
  health: number;
  iWealthy: number;
  pension: number;
  total: number;
}

export type LthcTaxSavingsResult = Map<number, TaxSavingsBreakdown>;


export interface AnnualLTHCOutputRow {
    policyYear: number;
    age: number;
    lifeReadyPremium: number;
    lifeReadyDeathBenefit: number;
    iHealthyUltraPremium: number;
    mebPremium: number;
    totalHealthPremium: number;
    totalCombinedDeathBenefit?: number;
    // iWealthy
    iWealthyRpp?: number;
    iWealthyRtu?: number;
    iWealthyTotalPremium?: number;
    iWealthyWithdrawal?: number;
    iWealthyEoyAccountValue?: number;
    iWealthyEoyDeathBenefit?: number;
    iWealthySumAssured?: number;
    iWealthyEOYCSV?: number;
    iWealthyPremiumCharge?: number;
    iWealthyCOI?: number;
    iWealthyAdminFee?: number;
    // Pension
    pensionPremium?: number;
    pensionSumAssured?: number;
    pensionPayout?: number;
    pensionEOYCSV?: number;
    pensionSurplusShortfall?: number;
    pensionCumulativeBalance?: number;
    // +++ FIX: Added this property to resolve the error +++
    pensionDeathBenefit?: number;
}

export interface AnnualHealthPremiumDetail {
    year: number;
    age: number;
    totalPremium: number;
    lrPrem: number;
    ihuPrem: number;
    mebPrem: number;
}

// --- Constants ---
export const MINIMUM_ALLOWABLE_SYSTEM_RPP_TYPE = 18000;
export const DEFAULT_RPP_RTU_RATIO_TYPE = '100/0';
export const MAX_POLICY_AGE_TYPE = 98;
export const MEB_TERMINATION_AGE_TYPE = 74;
