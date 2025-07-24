// src/stores/appStore.ts

import { create } from 'zustand';
import type { Dispatch, SetStateAction } from 'react';

// --- TYPE & FUNCTION IMPORTS ---

// LTHC Types & Calculations
import type { 
    HealthPlanSelections, SAReductionStrategy, PolicyOriginMode, 
    IWealthyMode, AnnualLTHCOutputRow,
    FundingSource, PensionFundingOptions, 
    PensionMode 
} from '../hooks/useLthcTypes';
import { calculateLthcPlan } from '../hooks/useLthcCalculations';

// iWealthy Types & Calculations
import type { Gender, PaymentFrequency, CalculationInput, CalculationResult, SumInsuredReductionRecord, PausePeriodRecord, AddInvestmentRecord, FrequencyChangeRecord, WithdrawalPlanRecord } from '../lib/calculations';
import { generateIllustrationTables, getSumInsuredFactor, getReductionMultipliers } from '../lib/calculations';
import {
    calculateProjectIRR,
    calculateProjectROI,
    calculateProjectPI,
    calculateInvestmentOnlyMIRR,
    calculateInvestmentOnlyROI, 
    calculateInvestmentOnlyPI,  
    calculateMIRRForYear,
    findBreakEvenPoint,
    calculateTotalPremiums,
    //getFinalFundValue,
    getFinalDisplayedAnnualAccountValue,
    getInitialDeathBenefit,
    getMaxDeathBenefit,
} from '../lib/financialMetrics';

// CI Types & Calculations
import { 
    calculateManualPlanCi, 
    calculateAutomaticPlanCi 
} from '@/components/ci/hooks/useCiCalculations';
import type { CiPlanSelections, AnnualCiOutputRow, PolicyOriginMode as CiPolicyOriginMode } from '@/components/ci/types/useCiTypes';


// --- INTERFACE DEFINITIONS ---

// 1. Interface สำหรับ LTHC
interface LthcState {
  policyholderEntryAge: number;
  policyholderGender: Gender;
  selectedHealthPlans: HealthPlanSelections;
  policyOriginMode: PolicyOriginMode;
  existingPolicyEntryAge?: number;
  // --- Funding Source Selection ---
  fundingSource: FundingSource; 
  iWealthyMode: IWealthyMode;
  pensionMode: PensionMode;
  pensionFundingOptions: PensionFundingOptions;
  manualPensionPremium: number;
  // iWealthy Manual Mode Inputs
  manualRpp: number;
  manualRtu: number;
  manualInvestmentReturn: number;
  manualIWealthyPPT: number;
  manualWithdrawalStartAge: number;
  // iWealthy Automatic Mode Inputs
  autoInvestmentReturn: number;
  autoIWealthyPPT: number;
  autoRppRtuRatio: string;
  saReductionStrategy: SAReductionStrategy;
  // --- Results ---
  result: AnnualLTHCOutputRow[] | null;
  isLoading: boolean;
  error: string | null;
  // iWealthy Results
  calculatedMinPremium?: number;
  calculatedRpp?: number;
  calculatedRtu?: number;
  // Pension Results
  solvedPensionSA?: number;
  solvedPensionPremium?: number;
  // --- Setters ---
  setPolicyholderEntryAge: Dispatch<SetStateAction<number>>;
  setPolicyholderGender: Dispatch<SetStateAction<Gender>>;
  setSelectedHealthPlans: Dispatch<SetStateAction<HealthPlanSelections>>;
  setPolicyOriginMode: Dispatch<SetStateAction<PolicyOriginMode>>;
  setExistingPolicyEntryAge: Dispatch<SetStateAction<number | undefined>>;
  setFundingSource: Dispatch<SetStateAction<FundingSource>>;
  setIWealthyMode: Dispatch<SetStateAction<IWealthyMode>>;
  setPensionMode: Dispatch<SetStateAction<PensionMode>>;
  setPensionFundingOptions: Dispatch<SetStateAction<PensionFundingOptions>>;
  setManualPensionPremium: Dispatch<SetStateAction<number>>;
  setManualRpp: Dispatch<SetStateAction<number>>;
  setManualRtu: Dispatch<SetStateAction<number>>;
  setManualInvestmentReturn: Dispatch<SetStateAction<number>>;
  setManualIWealthyPPT: Dispatch<SetStateAction<number>>;
  setManualWithdrawalStartAge: Dispatch<SetStateAction<number>>;
  setAutoInvestmentReturn: Dispatch<SetStateAction<number>>;
  setAutoIWealthyPPT: Dispatch<SetStateAction<number>>;
  setAutoRppRtuRatio: Dispatch<SetStateAction<string>>;
  setSaReductionStrategy: Dispatch<SetStateAction<SAReductionStrategy>>;
  runCalculation: () => Promise<void>;
  // --- 🎨 ส่วนที่เพิ่มใหม่สำหรับฟีเจอร์ลดหย่อนภาษี ---
  isTaxDeductionEnabled: boolean;
  isTaxModalOpen: boolean;
  taxRate: number;
  usedFirst100k: number;
  handleTaxButtonClick: () => void;
  setTaxInputs: (inputs: { taxRate: number; usedFirst100k: number, endAge: number; }) => void;
  closeTaxModal: () => void;
  taxDeductionEndAge: number;
}

// 2. Interface สำหรับข้อมูล iWealthy
export interface IWealthyState {
  iWealthyAge: number;
  iWealthyGender: Gender;
  iWealthyPaymentFrequency: PaymentFrequency;
  iWealthyRpp: number;
  iWealthyRtu: number;
  iWealthySumInsured: number;
  iWealthyInvestmentReturn: number;
  iWealthyPausePeriods: PausePeriodRecord[];
  iWealthySumInsuredReductions: SumInsuredReductionRecord[];
  iWealthyAdditionalInvestments: AddInvestmentRecord[];
  iWealthyFrequencyChanges: FrequencyChangeRecord[];
  iWealthyWithdrawalPlan: WithdrawalPlanRecord[];
  iWealthyResult: CalculationResult | null;
  iWealthyIsLoading: boolean;
  iWealthyError: string | null;
  iWealthyReductionsNeedReview: boolean;
  iWealthyMetrics: {
        projectIRR: number | null;
        breakEvenYear: number | null;
        breakEvenAge: number | null;
        totalPremiumsPaid: number | null;
        finalFundValue: number | null;
        roi: number | null;
        pi: number | null;
    } | null;
  investmentOnlyMIRR: number | null;
  investmentOnlyROI: number | null;
  investmentOnlyPI: number | null;
  annualMIRRData: Map<number, number | null> | null;
  initialDB: number | null;
  maxDB: { amount: number; age: number } | null;
  setIWealthyAge: (age: number) => void;
  setIWealthyGender: (gender: Gender) => void;
  setIWealthyPaymentFrequency: (freq: PaymentFrequency) => void;
  setIWealthyRpp: (rpp: number) => void;
  setIWealthyRtu: (rtu: number) => void;
  setIWealthySumInsured: (sa: number) => void;
  setIWealthyInvestmentReturn: (rate: number) => void;
  handleIWealthyRppRtuSlider: (percent: number) => void;
  setIWealthyPausePeriods: (periods: PausePeriodRecord[]) => void;
  setIWealthySumInsuredReductions: (reductions: SumInsuredReductionRecord[]) => void;
  setIWealthyAdditionalInvestments: (investments: AddInvestmentRecord[]) => void;
  setIWealthyFrequencyChanges: (changes: FrequencyChangeRecord[]) => void;
  setIWealthyWithdrawalPlan: (plan: WithdrawalPlanRecord[]) => void;
  runIWealthyCalculation: () => Promise<void>;
  acknowledgeIWealthyReductionChanges: () => void;
}

// 3. Interface สำหรับ UI (Modal) ของ iWealthy
interface IWealthyUIState {
  isPauseModalOpen: boolean;
  isReduceModalOpen: boolean;
  isWithdrawalModalOpen: boolean;
  isChangeFreqModalOpen: boolean;
  isAddInvestmentModalOpen: boolean;
  openPauseModal: () => void;
  closePauseModal: () => void;
  openReduceModal: () => void;
  closeReduceModal: () => void;
  openWithdrawalModal: () => void;
  closeWithdrawalModal: () => void;
  openChangeFreqModal: () => void;
  closeChangeFreqModal: () => void;
  openAddInvestmentModal: () => void;
  closeAddInvestmentModal: () => void;
}

// 4. Interface สำหรับ CI Planner
interface CIPlannerState {
    ciPlanningAge: number;
    ciGender: Gender;
    ciPolicyOriginMode: CiPolicyOriginMode;
    ciExistingEntryAge?: number;
    ciPlanSelections: CiPlanSelections;
    ciUseIWealthy: boolean;
    ciIWealthyMode: 'manual' | 'automatic';
    ciManualRpp: number;
    ciManualRtu: number;
    ciManualInvReturn: number;
    ciManualPpt: number;
    ciManualWithdrawalStartAge: number;
    ciAutoInvReturn: number;
    ciAutoPpt: number;
    ciAutoRppRtuRatio: string;
    ciAutoWithdrawalStartAge: number;
    ciResult: AnnualCiOutputRow[] | null;
    ciIsLoading: boolean;
    ciError: string | null;
    ciSolvedMinPremium?: number;
    ciSolvedRpp?: number;
    ciSolvedRtu?: number;
    setCiPlanningAge: Dispatch<SetStateAction<number>>;
    setCiGender: Dispatch<SetStateAction<Gender>>;
    setCiPolicyOriginMode: Dispatch<SetStateAction<CiPolicyOriginMode>>;
    setCiExistingEntryAge: Dispatch<SetStateAction<number | undefined>>;
    setCiPlanSelections: Dispatch<SetStateAction<CiPlanSelections>>;
    setCiUseIWealthy: Dispatch<SetStateAction<boolean>>;
    setCiIWealthyMode: Dispatch<SetStateAction<'manual' | 'automatic'>>;
    setCiManualRpp: Dispatch<SetStateAction<number>>;
    setCiManualRtu: Dispatch<SetStateAction<number>>;
    setCiManualInvReturn: Dispatch<SetStateAction<number>>;
    setCiManualPpt: Dispatch<SetStateAction<number>>;
    setCiManualWithdrawalStartAge: Dispatch<SetStateAction<number>>;
    setCiAutoInvReturn: Dispatch<SetStateAction<number>>;
    setCiAutoPpt: Dispatch<SetStateAction<number>>;
    setCiAutoRppRtuRatio: Dispatch<SetStateAction<string>>;
    setCiAutoWithdrawalStartAge: Dispatch<SetStateAction<number>>;
    runCiCalculation: () => Promise<void>;
}

// --- Helper Function (สำหรับใช้ภายใน Store) ---
const adjustReductions = (rpp: number, reductions: SumInsuredReductionRecord[]): {
    adjustedList: SumInsuredReductionRecord[];
    wasAdjusted: boolean;
} => {
    if (reductions.length === 0) {
        return { adjustedList: [], wasAdjusted: false };
    }
    let wasAdjusted = false;
    const adjustedList = reductions.map(record => {
        const multipliers = getReductionMultipliers(record.age);
        const min = Math.round(rpp * multipliers.min);
        const max = Math.round(rpp * multipliers.max);
        const clampedAmount = Math.max(min, Math.min(record.newSumInsured, max));
        if (clampedAmount !== record.newSumInsured) {
            wasAdjusted = true;
            return { ...record, newSumInsured: clampedAmount };
        }
        return record;
    });
    return { adjustedList, wasAdjusted };
};


// --- ZUSTAND STORE CREATION ---
export const useAppStore = create<LthcState & IWealthyState & IWealthyUIState & CIPlannerState>((set, get) => ({
    // ===================================================================
    // SECTION 1: LTHC State & Actions (UPDATED)
    // ===================================================================
    policyholderEntryAge: 30,
    policyholderGender: 'male',
    selectedHealthPlans: { lifeReadySA: 150000, lifeReadyPPT: 18, iHealthyUltraPlan: 'Bronze', mebPlan: 1000 },
    policyOriginMode: 'newPolicy',
    existingPolicyEntryAge: undefined,
    fundingSource: 'iWealthy',
    iWealthyMode: 'automatic',
    pensionMode: 'automatic',
    pensionFundingOptions: { planType: 'pension8' },
    manualPensionPremium: 200000,
    manualRpp: 100000,
    manualRtu: 0,
    manualInvestmentReturn: 5,
    manualIWealthyPPT: 15,
    manualWithdrawalStartAge: 61,
    autoInvestmentReturn: 5,
    autoIWealthyPPT: 15,
    autoRppRtuRatio: '100/0',
    saReductionStrategy: { type: 'auto' },
    result: null,
    isLoading: false,
    error: null,
    calculatedMinPremium: undefined,
    calculatedRpp: undefined,
    calculatedRtu: undefined,
    solvedPensionSA: undefined,
    solvedPensionPremium: undefined,
    // --- 🎨 ค่าเริ่มต้นและ Actions สำหรับฟีเจอร์ลดหย่อนภาษี ---
    isTaxDeductionEnabled: false,
    isTaxModalOpen: false,
    taxRate: 0.10, // ค่าเริ่มต้น 10%
    usedFirst100k: 0,
    taxDeductionEndAge: 98,

    handleTaxButtonClick: () => {
        const { isTaxDeductionEnabled } = get();
        if (isTaxDeductionEnabled) {
        set({ isTaxDeductionEnabled: false });
        } else {
        set({ isTaxModalOpen: true });
        }
    },

    setTaxInputs: (inputs) => {
        set({
        taxRate: inputs.taxRate,
        usedFirst100k: inputs.usedFirst100k,
        taxDeductionEndAge: inputs.endAge,
        isTaxDeductionEnabled: true,
        isTaxModalOpen: false,
        });
    },

    closeTaxModal: () => set({ isTaxModalOpen: false }),

    // --- Setters for LTHC ---
    setPolicyholderEntryAge: (arg) => set(state => ({ policyholderEntryAge: typeof arg === 'function' ? arg(state.policyholderEntryAge) : arg })),
    setPolicyholderGender: (arg) => set(state => ({ policyholderGender: typeof arg === 'function' ? arg(state.policyholderGender) : arg })),
    setSelectedHealthPlans: (arg) => set(state => ({ selectedHealthPlans: typeof arg === 'function' ? arg(state.selectedHealthPlans) : arg })),
    setPolicyOriginMode: (arg) => set(state => ({ policyOriginMode: typeof arg === 'function' ? arg(state.policyOriginMode) : arg })),
    setExistingPolicyEntryAge: (arg) => set(state => ({ existingPolicyEntryAge: typeof arg === 'function' ? arg(state.existingPolicyEntryAge) : arg })),
    setFundingSource: (arg) => set(state => ({ fundingSource: typeof arg === 'function' ? arg(state.fundingSource) : arg })),
    setIWealthyMode: (arg) => set(state => ({ iWealthyMode: typeof arg === 'function' ? arg(state.iWealthyMode) : arg })),
    setPensionMode: (arg) => set(state => ({ pensionMode: typeof arg === 'function' ? arg(state.pensionMode) : arg })),
    setPensionFundingOptions: (arg) => set(state => ({ pensionFundingOptions: typeof arg === 'function' ? arg(state.pensionFundingOptions) : arg })),
    setManualPensionPremium: (arg) => set(state => ({ manualPensionPremium: typeof arg === 'function' ? arg(state.manualPensionPremium) : arg })),
    setManualRpp: (arg) => set(state => ({ manualRpp: typeof arg === 'function' ? arg(state.manualRpp) : arg })),
    setManualRtu: (arg) => set(state => ({ manualRtu: typeof arg === 'function' ? arg(state.manualRtu) : arg })),
    setManualInvestmentReturn: (arg) => set(state => ({ manualInvestmentReturn: typeof arg === 'function' ? arg(state.manualInvestmentReturn) : arg })),
    setManualIWealthyPPT: (arg) => set(state => ({ manualIWealthyPPT: typeof arg === 'function' ? arg(state.manualIWealthyPPT) : arg })),
    setManualWithdrawalStartAge: (arg) => set(state => ({ manualWithdrawalStartAge: typeof arg === 'function' ? arg(state.manualWithdrawalStartAge) : arg })),
    setAutoInvestmentReturn: (arg) => set(state => ({ autoInvestmentReturn: typeof arg === 'function' ? arg(state.autoInvestmentReturn) : arg })),
    setAutoIWealthyPPT: (arg) => set(state => ({ autoIWealthyPPT: typeof arg === 'function' ? arg(state.autoIWealthyPPT) : arg })),
    setAutoRppRtuRatio: (arg) => set(state => ({ autoRppRtuRatio: typeof arg === 'function' ? arg(state.autoRppRtuRatio) : arg })),
    setSaReductionStrategy: (arg) => set(state => ({ saReductionStrategy: typeof arg === 'function' ? arg(state.saReductionStrategy) : arg })),

    runCalculation: async () => {
        // 1. เริ่มต้นกระบวนการ: ตั้งค่าสถานะกำลังโหลดและล้าง error/ผลลัพธ์เก่า
        set({ 
            isLoading: true, 
            error: null, 
            result: null, 
            calculatedMinPremium: undefined, 
            calculatedRpp: undefined, 
            calculatedRtu: undefined, 
            solvedPensionSA: undefined, 
            solvedPensionPremium: undefined 
        });
        
        // 2. ดึงค่า State ทั้งหมดที่จำเป็นสำหรับการคำนวณ
        const s = get();
        
        try {
            // 3. เรียกใช้ฟังก์ชันคำนวณหลัก โดยส่งค่าทั้งหมดเข้าไป
            const result = await calculateLthcPlan({
                entryAge: s.policyholderEntryAge,
                gender: s.policyholderGender,
                healthPlans: s.selectedHealthPlans,
                policyOrigin: s.policyOriginMode,
                existingEntryAge: s.existingPolicyEntryAge,
                fundingSource: s.fundingSource,
                iWealthyMode: s.iWealthyMode,
                pensionMode: s.pensionMode,
                iWealthyOptions: {
                    // สังเกตว่าเราส่งค่าทั้ง auto และ manual ไปพร้อมกัน
                    // ซึ่งฝั่งคำนวณ (calculateLthcPlan) จะเป็นผู้เลือกใช้เองตาม iWealthyMode
                    invReturn: s.iWealthyMode === 'automatic' ? s.autoInvestmentReturn : s.manualInvestmentReturn,
                    ppt: s.iWealthyMode === 'automatic' ? s.autoIWealthyPPT : s.manualIWealthyPPT,
                    rppRtuRatio: s.autoRppRtuRatio,
                    saReductionStrategy: s.saReductionStrategy,
                    manualRpp: s.manualRpp,
                    manualRtu: s.manualRtu,
                    manualWithdrawalStartAge: s.manualWithdrawalStartAge,
                },
                pensionOptions: s.pensionFundingOptions,
                manualPensionPremium: s.manualPensionPremium,
            });

            // --- ✅ START: Logic ใหม่สำหรับจัดการผลลัพธ์ ---
            if (result.errorMsg) {
                // --- กรณีที่การคำนวณล้มเหลว และส่ง errorMsg กลับมา ---

                // ตรวจสอบว่าการล้มเหลวนี้เกิดจากเงื่อนไขเจ้าปัญหาหรือไม่
                const isProblematicScenario = 
                    s.iWealthyMode === 'automatic' &&
                    s.saReductionStrategy.type === 'none' &&
                    s.autoRppRtuRatio === '100/0';

                if (isProblematicScenario) {
                    // ถ้าใช่, ให้สร้างและตั้งค่า Error Message ที่เป็นมิตรและให้คำแนะนำ
                    const customMessage = "ไม่สามารถหาค่าเบี้ยที่เหมาะสมสำหรับแผน 'ไม่ลดทุน' แบบ RPP 100% ได้ " +
                                        "ขอแนะนำให้ลองปรับสัดส่วนเป็น 80/20 หรือ 90/10";
                    set({ error: customMessage, isLoading: false });
                } else {
                    // ถ้าเป็น Error จากกรณีอื่นๆ, ก็ให้แสดง Error ตามที่ได้รับมา
                    set({ error: `เกิดข้อผิดพลาด: ${result.errorMsg}`, isLoading: false });
                }
            } else {
                // --- กรณีที่การคำนวณสำเร็จ ---
                set({
                    result: result.outputIllustration,
                    calculatedMinPremium: result.minPremiumResult,
                    calculatedRpp: result.rppResult,
                    calculatedRtu: result.rtuResult,
                    solvedPensionSA: result.solvedPensionSA,
                    solvedPensionPremium: result.solvedPensionPremium,
                    error: null, // ไม่มี Error
                    isLoading: false,
                });
            }
            // --- ✅ END: สิ้นสุด Logic ใหม่ ---

        } catch (err) {
            // จัดการ Error ที่ไม่คาดคิด (เช่น Network Error หรือ Bug ร้ายแรง)
            set({ error: err instanceof Error ? err.message : 'An unexpected error occurred', isLoading: false });
        }
    },

    // ===================================================================
    // SECTION 2: iWealthy Data State & Actions
    // ===================================================================
    iWealthyAge: 30,
    iWealthyGender: 'male',
    iWealthyPaymentFrequency: 'annual',
    iWealthyRpp: 100000,
    iWealthyRtu: 0,
    iWealthySumInsured: 100000 * getSumInsuredFactor(30),
    iWealthyInvestmentReturn: 5,
    iWealthyPausePeriods: [],
    iWealthySumInsuredReductions: [],
    iWealthyReductionsNeedReview: false,
    iWealthyAdditionalInvestments: [],
    iWealthyFrequencyChanges: [],
    iWealthyWithdrawalPlan: [],
    iWealthyResult: null,
    iWealthyMetrics: null,
    investmentOnlyMIRR: null,
    investmentOnlyROI: null,
    investmentOnlyPI: null, 
    annualMIRRData: null,
    initialDB: null,
    maxDB: null,
    iWealthyIsLoading: false,
    iWealthyError: null,
    setIWealthyAge: (age) => { const currentRpp = get().iWealthyRpp; const newSumInsured = currentRpp * getSumInsuredFactor(age); set({ iWealthyAge: age, iWealthySumInsured: newSumInsured }); },
    setIWealthyGender: (gender) => set({ iWealthyGender: gender }),
    setIWealthyPaymentFrequency: (freq) => set({ iWealthyPaymentFrequency: freq }),
    setIWealthyRpp: (rpp) => {
        const { iWealthyAge, iWealthySumInsuredReductions } = get();
        const newSumInsured = rpp * getSumInsuredFactor(iWealthyAge);
        const { adjustedList, wasAdjusted } = adjustReductions(rpp, iWealthySumInsuredReductions);
        set({ iWealthyRpp: rpp, iWealthySumInsured: newSumInsured, iWealthySumInsuredReductions: adjustedList, iWealthyReductionsNeedReview: get().iWealthyReductionsNeedReview || wasAdjusted });
    },
    setIWealthyRtu: (rtu) => set({ iWealthyRtu: rtu }),
    setIWealthySumInsured: (sa) => {
        const { iWealthyAge, iWealthySumInsuredReductions } = get();
        const factor = getSumInsuredFactor(iWealthyAge);
        const newRpp = factor > 0 ? Math.round(sa / factor) : 0;
        const { adjustedList, wasAdjusted } = adjustReductions(newRpp, iWealthySumInsuredReductions);
        set({ iWealthySumInsured: sa, iWealthyRpp: newRpp, iWealthySumInsuredReductions: adjustedList, iWealthyReductionsNeedReview: get().iWealthyReductionsNeedReview || wasAdjusted });
    },
    setIWealthyInvestmentReturn: (rate) => set({ iWealthyInvestmentReturn: rate }),
    handleIWealthyRppRtuSlider: (percent) => {
        const { iWealthyRpp, iWealthyRtu, iWealthyAge, iWealthySumInsuredReductions } = get();
        const total = iWealthyRpp + iWealthyRtu;
        if (total > 0) {
            const newRpp = Math.round(total * (percent / 100));
            const newRtu = total - newRpp;
            const newSumInsured = newRpp * getSumInsuredFactor(iWealthyAge);
            const { adjustedList, wasAdjusted } = adjustReductions(newRpp, iWealthySumInsuredReductions);
            set({ iWealthyRpp: newRpp, iWealthyRtu: newRtu, iWealthySumInsured: newSumInsured, iWealthySumInsuredReductions: adjustedList, iWealthyReductionsNeedReview: get().iWealthyReductionsNeedReview || wasAdjusted });
        }
    },
    setIWealthyPausePeriods: (periods) => set({ iWealthyPausePeriods: periods }),
    setIWealthySumInsuredReductions: (reductions) => {
        set({ iWealthySumInsuredReductions: reductions, iWealthyReductionsNeedReview: false });
    },
    setIWealthyAdditionalInvestments: (investments) => set({ iWealthyAdditionalInvestments: investments }),
    setIWealthyFrequencyChanges: (changes) => set({ iWealthyFrequencyChanges: changes }),
    setIWealthyWithdrawalPlan: (plan) => set({ iWealthyWithdrawalPlan: plan }),
    acknowledgeIWealthyReductionChanges: () => {
        set({ iWealthyReductionsNeedReview: false });
    },
    runIWealthyCalculation: async () => {
        // 1. ตั้งค่าสถานะเริ่มต้นและล้างข้อมูลเก่า
        set({ 
            iWealthyIsLoading: true, 
            iWealthyError: null, 
            iWealthyResult: null, 
            iWealthyMetrics: null, 
            investmentOnlyMIRR: null,
            investmentOnlyROI: null,
            investmentOnlyPI: null,
            annualMIRRData: null,
            initialDB: null,
            maxDB: null
        });

        const s = get();
        const calculationInput: CalculationInput = {
            policyholderAge: s.iWealthyAge,
            policyholderGender: s.iWealthyGender,
            initialPaymentFrequency: s.iWealthyPaymentFrequency,
            initialSumInsured: s.iWealthySumInsured,
            rppPerYear: s.iWealthyRpp,
            rtuPerYear: s.iWealthyRtu,
            assumedInvestmentReturnRate: s.iWealthyInvestmentReturn / 100,
            pausePeriods: s.iWealthyPausePeriods,
            sumInsuredReductions: s.iWealthySumInsuredReductions,
            additionalInvestments: s.iWealthyAdditionalInvestments,
            frequencyChanges: s.iWealthyFrequencyChanges,
            withdrawalPlan: s.iWealthyWithdrawalPlan,
         };

            try {
            const result = generateIllustrationTables(calculationInput);

            if (result && result.monthly.length > 0) {
                // 2. คำนวณ Metrics ทั้งหมด
                const breakEven = findBreakEvenPoint(result);
                
                // Metrics สำหรับโครงการ iWealthy ทั้งหมด
                const projIRR = calculateProjectIRR(result);
                const projROI = calculateProjectROI(result);
                const projPI = calculateProjectPI(result, s.iWealthyInvestmentReturn / 100);

                // Metrics สำหรับการวิเคราะห์แบบ BTID (ใช้เบี้ย Term)
                const invOnlyMIRR = calculateInvestmentOnlyMIRR(result, s.iWealthyGender, s.iWealthyInvestmentReturn / 100);
                const invOnlyROI = calculateInvestmentOnlyROI(
                    result, 
                    s.iWealthyGender, 
                    //s.iWealthyInvestmentReturn / 100 // 👈 เพิ่ม argument ตัวนี้
                );
                const invOnlyPI = calculateInvestmentOnlyPI(result, s.iWealthyGender, s.iWealthyInvestmentReturn / 100);

                // 3. สร้าง metrics object ที่สมบูรณ์
                const metrics = {
                    projectIRR: projIRR,
                    breakEvenYear: breakEven?.year ?? null,
                    breakEvenAge: breakEven?.age ?? null,
                    totalPremiumsPaid: calculateTotalPremiums(result),
                    finalFundValue: getFinalDisplayedAnnualAccountValue(result),
                    roi: projROI,
                    pi: projPI,
                    
                };

                const initialDB = getInitialDeathBenefit(result);
                const maxDB = getMaxDeathBenefit(result);
                
                // 4. คำนวณ MIRR รายปีสำหรับกราฟ
                const mirrData = new Map<number, number | null>();
                if (breakEven) {
                    const startYear = breakEven.year;
                    const endYear = Math.ceil(result.lastProcessedMonth / 12);
                    for (let year = startYear; year <= endYear; year++) {
                        const mirr = calculateMIRRForYear(year, result, s.iWealthyGender, s.iWealthyInvestmentReturn / 100);
                        mirrData.set(year, mirr);
                    }
                }

                // 5. บันทึกผลลัพธ์ทั้งหมดลง State
                set({
                    iWealthyResult: result,
                    iWealthyMetrics: metrics,
                    investmentOnlyMIRR: invOnlyMIRR, 
                    investmentOnlyROI: invOnlyROI,
                    investmentOnlyPI: invOnlyPI,
                    annualMIRRData: mirrData,
                    initialDB: initialDB,
                    maxDB: maxDB,
                    iWealthyIsLoading: false
                });

            } else {
                set({ iWealthyResult: result, iWealthyIsLoading: false });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected calculation error occurred';
            set({ iWealthyError: errorMessage, iWealthyIsLoading: false });
        }
    },
    // ===================================================================
    // SECTION 3: iWealthy UI State & Actions
    // ===================================================================
    isPauseModalOpen: false,
    isReduceModalOpen: false,
    isWithdrawalModalOpen: false,
    isChangeFreqModalOpen: false,
    isAddInvestmentModalOpen: false,
    openPauseModal: () => set({ isPauseModalOpen: true }),
    closePauseModal: () => set({ isPauseModalOpen: false }),
    openReduceModal: () => set({ isReduceModalOpen: true }),
    closeReduceModal: () => set({ isReduceModalOpen: false }),
    openWithdrawalModal: () => set({ isWithdrawalModalOpen: true }),
    closeWithdrawalModal: () => set({ isWithdrawalModalOpen: false }),
    openChangeFreqModal: () => set({ isChangeFreqModalOpen: true }),
    closeChangeFreqModal: () => set({ isChangeFreqModalOpen: false }),
    openAddInvestmentModal: () => set({ isAddInvestmentModalOpen: true }),
    closeAddInvestmentModal: () => set({ isAddInvestmentModalOpen: false }),


    // ===================================================================
    // SECTION 4: CI Planner State & Actions
    // ===================================================================
    ciPlanningAge: 30,
    ciGender: 'male',
    ciPolicyOriginMode: 'newPolicy',
    ciExistingEntryAge: undefined,
    ciPlanSelections: { 
        mainRiderChecked: true, lifeReadySA: 150000, lifeReadyPPT: 18, lifeReadyPlan: 18,
        icareChecked: true, icareSA: 1000000,
        ishieldChecked: false, ishieldSA: 1000000, ishieldPlan: null, 
        rokraiChecked: false, rokraiPlan: null, 
        dciChecked: false, dciSA: 1000000,
    } as CiPlanSelections,
    ciUseIWealthy: false,
    ciIWealthyMode: 'automatic',
    ciManualRpp: 100000,
    ciManualRtu: 0,
    ciManualInvReturn: 5,
    ciManualPpt: 15,
    ciManualWithdrawalStartAge: 61,
    ciAutoInvReturn: 5,
    ciAutoPpt: 15,
    ciAutoRppRtuRatio: '100:0',
    ciAutoWithdrawalStartAge: 61,
    ciResult: null,
    ciIsLoading: false,
    ciError: null,
    ciSolvedMinPremium: undefined,
    ciSolvedRpp: undefined,
    ciSolvedRtu: undefined,
    setCiPlanningAge: (arg) => set(state => ({ ciPlanningAge: typeof arg === 'function' ? arg(state.ciPlanningAge) : arg })),
    setCiGender: (arg) => set(state => ({ ciGender: typeof arg === 'function' ? arg(state.ciGender) : arg })),
    setCiPolicyOriginMode: (arg) => set(state => ({ ciPolicyOriginMode: typeof arg === 'function' ? arg(state.ciPolicyOriginMode) : arg })),
    setCiExistingEntryAge: (arg) => set(state => ({ ciExistingEntryAge: typeof arg === 'function' ? arg(state.ciExistingEntryAge) : arg })),
    setCiPlanSelections: (arg) => set(state => ({ ciPlanSelections: typeof arg === 'function' ? arg(state.ciPlanSelections) : arg })),
    setCiUseIWealthy: (arg) => set(state => ({ ciUseIWealthy: typeof arg === 'function' ? arg(state.ciUseIWealthy) : arg })),
    setCiIWealthyMode: (arg) => set(state => ({ ciIWealthyMode: typeof arg === 'function' ? arg(state.ciIWealthyMode) : arg })),
    setCiManualRpp: (arg) => set(state => ({ ciManualRpp: typeof arg === 'function' ? arg(state.ciManualRpp) : arg })),
    setCiManualRtu: (arg) => set(state => ({ ciManualRtu: typeof arg === 'function' ? arg(state.ciManualRtu) : arg })),
    setCiManualInvReturn: (arg) => set(state => ({ ciManualInvReturn: typeof arg === 'function' ? arg(state.ciManualInvReturn) : arg })),
    setCiManualPpt: (arg) => set(state => ({ ciManualPpt: typeof arg === 'function' ? arg(state.ciManualPpt) : arg })),
    setCiManualWithdrawalStartAge: (arg) => set(state => ({ ciManualWithdrawalStartAge: typeof arg === 'function' ? arg(state.ciManualWithdrawalStartAge) : arg })),
    setCiAutoInvReturn: (arg) => set(state => ({ ciAutoInvReturn: typeof arg === 'function' ? arg(state.ciAutoInvReturn) : arg })),
    setCiAutoPpt: (arg) => set(state => ({ ciAutoPpt: typeof arg === 'function' ? arg(state.ciAutoPpt) : arg })),
    setCiAutoRppRtuRatio: (arg) => set(state => ({ ciAutoRppRtuRatio: typeof arg === 'function' ? arg(state.ciAutoRppRtuRatio) : arg })),
    setCiAutoWithdrawalStartAge: (arg) => set(state => ({ ciAutoWithdrawalStartAge: typeof arg === 'function' ? arg(state.ciAutoWithdrawalStartAge) : arg })),
    runCiCalculation: async () => {
        set({ ciIsLoading: true, ciError: null, ciResult: null });
        const s = get();
        try {
            if (s.ciIWealthyMode === 'manual') {
                const manualResult = await calculateManualPlanCi(s.ciPlanningAge, s.ciGender, s.ciPlanSelections, s.ciManualRpp, s.ciManualRtu, s.ciManualInvReturn, s.ciManualPpt, s.ciPolicyOriginMode, s.ciExistingEntryAge);
                set({ ciResult: manualResult, ciIsLoading: false });
            } else { // automatic
                const autoResult = await calculateAutomaticPlanCi(s.ciPlanningAge, s.ciGender, s.ciPlanSelections, s.ciAutoInvReturn, s.ciAutoPpt, s.ciAutoRppRtuRatio, s.ciPolicyOriginMode, s.ciExistingEntryAge);
                set({ ciResult: autoResult.outputIllustration, ciSolvedMinPremium: autoResult.minPremiumResult, ciSolvedRpp: autoResult.rppResult, ciSolvedRtu: autoResult.rtuResult, ciError: autoResult.errorMsg ?? null, ciIsLoading: false });
            }
        } catch (err) {
            set({ ciError: err instanceof Error ? err.message : 'An unexpected CI error occurred', ciIsLoading: false });
        }
    },
}));