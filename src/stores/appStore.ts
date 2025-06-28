// src/stores/appStore.ts

import { create } from 'zustand';
import type { Dispatch, SetStateAction } from 'react';

// --- TYPE & FUNCTION IMPORTS ---

// LTHC Types & Calculations
import type { HealthPlanSelections, SAReductionStrategy, PolicyOriginMode, IWealthyMode as LthcIWealthyMode, AnnualLTHCOutputRow } from '../hooks/useLthcTypes';
import { calculateManualPlan, calculateAutomaticPlan, generateSAReductionsForIWealthy } from '../hooks/useLthcCalculations';

// iWealthy Types & Calculations
import type { Gender, PaymentFrequency, CalculationInput, CalculationResult, SumInsuredReductionRecord, PausePeriodRecord, AddInvestmentRecord, FrequencyChangeRecord, WithdrawalPlanRecord } from '../lib/calculations';
import { generateIllustrationTables, getSumInsuredFactor, getReductionMultipliers } from '../lib/calculations';

// --- CHANGED: แก้ไข Import สำหรับ CI ---
// เราจะ import ฟังก์ชันคำนวณโดยตรง ไม่ใช่ hook อีกต่อไป
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
  iWealthyMode: LthcIWealthyMode;
  manualRpp: number;
  manualRtu: number;
  manualInvestmentReturn: number;
  manualIWealthyPPT: number;
  manualWithdrawalStartAge: number;
  autoInvestmentReturn: number;
  autoIWealthyPPT: number;
  autoRppRtuRatio: string;
  saReductionStrategy: SAReductionStrategy;
  result: AnnualLTHCOutputRow[] | null;
  isLoading: boolean;
  error: string | null;
  calculatedMinPremium?: number;
  calculatedRpp?: number;
  calculatedRtu?: number;
  setPolicyholderEntryAge: Dispatch<SetStateAction<number>>;
  setPolicyholderGender: Dispatch<SetStateAction<Gender>>;
  setSelectedHealthPlans: Dispatch<SetStateAction<HealthPlanSelections>>;
  setPolicyOriginMode: Dispatch<SetStateAction<PolicyOriginMode>>;
  setExistingPolicyEntryAge: Dispatch<SetStateAction<number | undefined>>;
  setIWealthyMode: Dispatch<SetStateAction<LthcIWealthyMode>>;
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
}

// 2. Interface สำหรับข้อมูล iWealthy
interface IWealthyState {
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
    // +++ ADDED: เพิ่ม State สำหรับติดตามสถานะ +++
  iWealthyReductionsNeedReview: boolean;
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
  // +++ ADDED: Action สำหรับให้ผู้ใช้ยืนยันการตรวจสอบ +++
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

interface CIPlannerState {
    ciPlanningAge: number;
    ciGender: Gender;
    ciPolicyOriginMode: CiPolicyOriginMode;
    ciExistingEntryAge?: number;
    ciPlanSelections: CiPlanSelections;
    ciUseIWealthy: boolean; // State สำหรับเปิด/ปิดการใช้ iWealthy
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
export const useAppStore = create<LthcState & IWealthyState & IWealthyUIState & CIPlannerState>((set, get) => {
    
    // ดึงฟังก์ชันคำนวณจาก hook มาใช้ครั้งเดียว
    //const { calculateManualPlanCi, calculateAutomaticPlanCi } = useCiCalculations();

    return {
        // ===================================================================
        // SECTION 1: LTHC State & Actions
        // ===================================================================
        policyholderEntryAge: 30,
        policyholderGender: 'male',
        selectedHealthPlans: { lifeReadySA: 150000, lifeReadyPPT: 18, iHealthyUltraPlan: 'Bronze', mebPlan: 1000 },
        policyOriginMode: 'newPolicy',
        existingPolicyEntryAge: undefined,
        iWealthyMode: 'automatic',
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
        setPolicyholderEntryAge: (arg) => set(state => ({ policyholderEntryAge: typeof arg === 'function' ? arg(state.policyholderEntryAge) : arg })),
        setPolicyholderGender: (arg) => set(state => ({ policyholderGender: typeof arg === 'function' ? arg(state.policyholderGender) : arg })),
        setSelectedHealthPlans: (arg) => set(state => ({ selectedHealthPlans: typeof arg === 'function' ? arg(state.selectedHealthPlans) : arg })),
        setPolicyOriginMode: (arg) => set(state => ({ policyOriginMode: typeof arg === 'function' ? arg(state.policyOriginMode) : arg })),
        setExistingPolicyEntryAge: (arg) => set(state => ({ existingPolicyEntryAge: typeof arg === 'function' ? arg(state.existingPolicyEntryAge) : arg })),
        setIWealthyMode: (arg) => set(state => ({ iWealthyMode: typeof arg === 'function' ? arg(state.iWealthyMode) : arg })),
        setManualRpp: (arg) => set(state => ({ manualRpp: typeof arg === 'function' ? arg(state.manualRpp) : arg })),
        setManualRtu: (arg) => set(state => ({ manualRtu: typeof arg === 'function' ? arg(state.manualRtu) : arg })),
        setManualInvestmentReturn: (arg) => set(state => ({ manualInvestmentReturn: typeof arg === 'function' ? arg(state.manualInvestmentReturn) : arg })),
        setManualIWealthyPPT: (arg) => set(state => ({ manualIWealthyPPT: typeof arg === 'function' ? arg(state.manualIWealthyPPT) : arg })),
        setManualWithdrawalStartAge: (arg) => set(state => ({ manualWithdrawalStartAge: typeof arg === 'function' ? arg(state.manualWithdrawalStartAge) : arg })),
        setAutoInvestmentReturn: (arg) => set(state => ({ autoInvestmentReturn: typeof arg === 'function' ? arg(state.autoInvestmentReturn) : arg })),
        setAutoIWealthyPPT: (arg) => set(state => ({ autoIWealthyPPT: typeof arg === 'function' ? arg(state.autoIWealthyPPT) : arg })),
        setAutoRppRtuRatio: (arg) => set(state => ({ autoRppRtuRatio: typeof arg === 'function' ? arg(state.autoRppRtuRatio) : arg })),
        setSaReductionStrategy: (arg) => set(state => ({ saReductionStrategy: typeof arg === 'function' ? arg(state.saReductionStrategy) : arg })),
        
        // +++ โค้ดส่วนที่เติมให้สมบูรณ์ +++
        runCalculation: async () => {
            set({ isLoading: true, error: null, result: null, calculatedMinPremium: undefined, calculatedRpp: undefined, calculatedRtu: undefined });
            const s = get();
            try {
                if (s.iWealthyMode === 'manual') {
                    const reductionsForManual = s.saReductionStrategy.type === 'auto'
                        ? generateSAReductionsForIWealthy(s.policyholderEntryAge, s.manualRpp)
                        : generateSAReductionsForIWealthy(s.policyholderEntryAge, s.manualRpp, s.saReductionStrategy.ages);
                    
                    const manualResultData = await calculateManualPlan(
                        s.policyholderEntryAge, s.policyholderGender, s.selectedHealthPlans, s.manualRpp, s.manualRtu,
                        s.manualInvestmentReturn, s.manualIWealthyPPT, s.manualWithdrawalStartAge, reductionsForManual,
                        s.policyOriginMode, s.existingPolicyEntryAge
                    );
                    set({ result: manualResultData, isLoading: false });

                } else { // 'automatic' mode
                    const customAgesForAuto = s.saReductionStrategy.type === 'manual' ? s.saReductionStrategy.ages : undefined;
                    
                    const autoResult = await calculateAutomaticPlan(
                        s.policyholderEntryAge, s.policyholderGender, s.selectedHealthPlans, s.autoInvestmentReturn,
                        s.autoIWealthyPPT, s.autoRppRtuRatio, customAgesForAuto, s.policyOriginMode, s.existingPolicyEntryAge
                    );
                    
                    set({
                        result: autoResult.outputIllustration, 
                        calculatedMinPremium: autoResult.minPremiumResult,
                        calculatedRpp: autoResult.rppResult, 
                        calculatedRtu: autoResult.rtuResult,
                        error: autoResult.errorMsg ?? null, 
                        isLoading: false,
                    });
                }
            } catch (err) {
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
        iWealthyReductionsNeedReview: false, // <<< ค่าเริ่มต้น
        iWealthyAdditionalInvestments: [],
        iWealthyFrequencyChanges: [],
        iWealthyWithdrawalPlan: [],
        iWealthyResult: null,
        iWealthyIsLoading: false,
        iWealthyError: null,
        setIWealthyAge: (age) => { const currentRpp = get().iWealthyRpp; const newSumInsured = currentRpp * getSumInsuredFactor(age); set({ iWealthyAge: age, iWealthySumInsured: newSumInsured }); },
        setIWealthyGender: (gender) => set({ iWealthyGender: gender }),
        setIWealthyPaymentFrequency: (freq) => set({ iWealthyPaymentFrequency: freq }),
        setIWealthyRpp: (rpp) => {
            const { iWealthyAge, iWealthySumInsuredReductions } = get();
            const newSumInsured = rpp * getSumInsuredFactor(iWealthyAge);
            const { adjustedList, wasAdjusted } = adjustReductions(rpp, iWealthySumInsuredReductions);
            set({ 
                iWealthyRpp: rpp, 
                iWealthySumInsured: newSumInsured,
                iWealthySumInsuredReductions: adjustedList,
                iWealthyReductionsNeedReview: get().iWealthyReductionsNeedReview || wasAdjusted,
            });
        },
        setIWealthyRtu: (rtu) => set({ iWealthyRtu: rtu }),
        setIWealthySumInsured: (sa) => {
            const { iWealthyAge, iWealthySumInsuredReductions } = get();
            const factor = getSumInsuredFactor(iWealthyAge);
            const newRpp = factor > 0 ? Math.round(sa / factor) : 0;
            const { adjustedList, wasAdjusted } = adjustReductions(newRpp, iWealthySumInsuredReductions);
            set({ 
                iWealthySumInsured: sa, 
                iWealthyRpp: newRpp,
                iWealthySumInsuredReductions: adjustedList,
                iWealthyReductionsNeedReview: get().iWealthyReductionsNeedReview || wasAdjusted,
            });
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
                set({ 
                    iWealthyRpp: newRpp, 
                    iWealthyRtu: newRtu, 
                    iWealthySumInsured: newSumInsured,
                    iWealthySumInsuredReductions: adjustedList,
                    iWealthyReductionsNeedReview: get().iWealthyReductionsNeedReview || wasAdjusted,
                });
            }
        },
        setIWealthyPausePeriods: (periods) => set({ iWealthyPausePeriods: periods }),
        // --- Setter เดิมสำหรับ Modal (เพิ่มการ Reset Flag) ---
        setIWealthySumInsuredReductions: (reductions) => {
            set({ 
                iWealthySumInsuredReductions: reductions,
                iWealthyReductionsNeedReview: false 
            });
        },
        setIWealthyAdditionalInvestments: (investments) => set({ iWealthyAdditionalInvestments: investments }),
        setIWealthyFrequencyChanges: (changes) => set({ iWealthyFrequencyChanges: changes }),
        setIWealthyWithdrawalPlan: (plan) => set({ iWealthyWithdrawalPlan: plan }),
        // --- Action ใหม่สำหรับยืนยัน ---
        acknowledgeIWealthyReductionChanges: () => {
            set({ iWealthyReductionsNeedReview: false });
        },
        
        // +++ โค้ดส่วนที่เติมให้สมบูรณ์ +++
        runIWealthyCalculation: async () => {
            set({ iWealthyIsLoading: true, iWealthyError: null, iWealthyResult: null });
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
              set({ iWealthyResult: result, iWealthyIsLoading: false });
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'An unexpected calculation error occurred';
              set({ iWealthyError: errorMessage, iWealthyIsLoading: false });
            }
        },

        // ===================================================================
        // SECTION 3: iWealthy UI State & Actions
        // ===================================================================
        isPauseModalOpen: false, isReduceModalOpen: false, isWithdrawalModalOpen: false, isChangeFreqModalOpen: false, isAddInvestmentModalOpen: false,
        openPauseModal: () => set({ isPauseModalOpen: true }), closePauseModal: () => set({ isPauseModalOpen: false }),
        openReduceModal: () => set({ isReduceModalOpen: true }), closeReduceModal: () => set({ isReduceModalOpen: false }),
        openWithdrawalModal: () => set({ isWithdrawalModalOpen: true }), closeWithdrawalModal: () => set({ isWithdrawalModalOpen: false }),
        openChangeFreqModal: () => set({ isChangeFreqModalOpen: true }), closeChangeFreqModal: () => set({ isChangeFreqModalOpen: false }),
        openAddInvestmentModal: () => set({ isAddInvestmentModalOpen: true }), closeAddInvestmentModal: () => set({ isAddInvestmentModalOpen: false }),


        // ===================================================================
        // SECTION 4: CI Planner State & Actions
        // ===================================================================
        ciPlanningAge: 30,
        ciGender: 'male',
        ciPolicyOriginMode: 'newPolicy',
        ciExistingEntryAge: undefined,
        // +++ จุดที่แก้ไข +++
        ciPlanSelections: { 
            mainRiderChecked: true, lifeReadySA: 500000, lifeReadyPPT: 20, lifeReadyPlan: 18, // แก้ไข: เปลี่ยน '1' เป็นตัวเลขที่ถูกต้อง เช่น 18
            icareChecked: true, icareSA: 1000000,
            ishieldChecked: false, ishieldSA: 1000000, ishieldPlan: null, 
            rokraiChecked: false, rokraiPlan: null, 
            dciChecked: false, dciSA: 1000000,
        } as CiPlanSelections, // ยืนยัน Type เพื่อแก้ปัญหา
        ciUseIWealthy: false, // เริ่มต้นที่ "ไม่ใช้"
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
                    const manualResult = await calculateManualPlanCi(
                        s.ciPlanningAge, s.ciGender, s.ciPlanSelections,
                        s.ciManualRpp, s.ciManualRtu, s.ciManualInvReturn,
                        s.ciManualPpt, s.ciManualWithdrawalStartAge,
                        s.ciPolicyOriginMode, s.ciExistingEntryAge
                    );
                    set({ ciResult: manualResult, ciIsLoading: false });
                } else { // automatic
                    const autoResult = await calculateAutomaticPlanCi(
                        s.ciPlanningAge, s.ciGender, s.ciPlanSelections,
                        s.ciAutoInvReturn, s.ciAutoPpt, s.ciAutoRppRtuRatio,
                        s.ciAutoWithdrawalStartAge, s.ciPolicyOriginMode,
                        s.ciExistingEntryAge
                    );
                    set({
                        ciResult: autoResult.outputIllustration,
                        ciSolvedMinPremium: autoResult.minPremiumResult,
                        ciSolvedRpp: autoResult.rppResult,
                        ciSolvedRtu: autoResult.rtuResult,
                        ciError: autoResult.errorMsg ?? null,
                        ciIsLoading: false,
                    });
                }
            } catch (err) {
                set({ ciError: err instanceof Error ? err.message : 'An unexpected CI error occurred', ciIsLoading: false });
            }
        },
    };
});