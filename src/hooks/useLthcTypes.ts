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
//import React from 'react';

export type SAReductionStrategy = 
    | { type: 'auto' }
    | { type: 'manual', ages: number[] };

export type Gender = HealthPlanGenderOriginal;
export type PolicyOriginMode = 'newPolicy' | 'existingPolicy';
export type IWealthyMode = 'manual' | 'automatic';
export type PaymentFrequency = 'monthly' | 'annual';
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

export type SumInsuredReductionRecord = OriginalSumInsuredReductionRecord;
export type FrequencyChangeRecord = OriginalFrequencyChangeRecord;
export type WithdrawalPlanRecord = OriginalWithdrawalPlanRecord;
export type CalculationInput = OriginalIWealthyCalculationInput;
export type IWealthyAnnualOutputRow = OriginalIWealthyAnnualOutputRow;

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

// ลบ UseLthcPlannerProps และ UseLthcPlannerReturn ที่ไม่ใช้ออกไป

// --- Constants ---
export const MINIMUM_ALLOWABLE_SYSTEM_RPP_TYPE = 18000;
export const DEFAULT_RPP_RTU_RATIO_TYPE = '100/0';
export const MAX_POLICY_AGE_TYPE = 98;
export const MEB_TERMINATION_AGE_TYPE = 74;