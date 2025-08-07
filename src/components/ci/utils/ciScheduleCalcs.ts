// src/components/ci/utils/ciScheduleCalcs.ts

import type {
    Gender,
    CiPlanSelections,
    AnnualCiPremiumDetail,
    PolicyOriginMode,
    LifeReadyPlan,
    IShieldPlan,
    RokRaiSoShieldPlan
} from '../types/useCiTypes';

import {
    getLifeReadyPremium,
    getIShieldPremium,
    getRokRaiSoShieldPremium,
    getDCIPremium,
} from './premiumCalcs';

import { premiumRates as iCareMainPremiumRates } from '../data/icare_main_premium';
import { icareCriticalRates } from '../data/icare_critical_rate';

// --- Constants ---
const MAX_SCHEDULE_AGE_DEFAULT = 98;
const LIFE_READY_TO_99_MAX_PAY_AGE = 98;
const ICARE_MAX_PAY_AGE = 84;
const ROKRAI_MAX_PAY_AGE = 98;
const DCI_MIN_AGE_FOR_PREMIUM = 20;
const DCI_MAX_PAY_AGE = 74;
const ICARE_CRITICAL_RIDER_MAX_AGE_FOR_RATE = 84;


export function calculateAllCiPremiumsSchedule(
    currentPlanningAge: number,
    gender: Gender,
    selections: CiPlanSelections,
    policyOriginMode: PolicyOriginMode,
    existingOriginalEntryAge?: number,
    maxScheduleAge: number = MAX_SCHEDULE_AGE_DEFAULT
): AnnualCiPremiumDetail[] {
    const premiumSchedule: AnnualCiPremiumDetail[] = [];

    const effectiveLifeReadyEntryAge =
        policyOriginMode === 'existingPolicy' &&
        selections.mainRiderChecked &&
        existingOriginalEntryAge !== undefined
            ? existingOriginalEntryAge
            : currentPlanningAge;

    const newComponentsEntryAge = currentPlanningAge;

    const effectiveCiRiderEntryAge = 
    policyOriginMode === 'existingPolicy' && existingOriginalEntryAge !== undefined
        ? existingOriginalEntryAge
        : currentPlanningAge;

    // --- จุดที่แก้ไข 1: กำหนด "อายุที่เวนคืน LifeReady" ก่อนเริ่ม Loop ---
    // นี่จะเป็น "อายุสูงสุด" ที่สัญญาเพิ่มเติมจะมีผลบังคับได้
    const lifeReadySurrenderAge = selections.lifeReadyStopPayment.useCustomStopAge
        ? selections.lifeReadyStopPayment.stopAge
        : LIFE_READY_TO_99_MAX_PAY_AGE;

    for (let policyYear = 1; ; policyYear++) {
        const currentAttainedAge = currentPlanningAge + policyYear - 1;

        if (currentAttainedAge > maxScheduleAge) {
            break;
        }

        let yearLifeReadyPremium = 0;
        let yearIcarePremium = 0;
        let yearIshieldPremium = 0;
        let yearRokraiPremium = 0;
        let yearDciPremium = 0;

        // 1. LifeReady Premium (ใช้ lifeReadySurrenderAge ที่คำนวณไว้)
        if (selections.mainRiderChecked && selections.lifeReadyPlan !== null && selections.lifeReadySA > 0) {
            let payLifeReadyThisYear = false;
            if (selections.lifeReadyPlan === 99) {
                if (currentAttainedAge <= lifeReadySurrenderAge && currentAttainedAge >= effectiveLifeReadyEntryAge) {
                    payLifeReadyThisYear = true;
                }
            } else { 
                const lifeReadyPolicyYear = currentAttainedAge - effectiveLifeReadyEntryAge + 1;
                if (lifeReadyPolicyYear > 0 && lifeReadyPolicyYear <= selections.lifeReadyPlan && currentAttainedAge <= lifeReadySurrenderAge) {
                     payLifeReadyThisYear = true;
                }
            }

            if (payLifeReadyThisYear) {
                yearLifeReadyPremium = getLifeReadyPremium(
                    effectiveLifeReadyEntryAge,
                    selections.lifeReadyPlan as LifeReadyPlan,
                    selections.lifeReadySA,
                    gender
                );
            }
        }

        // 2. iCare Premium (Logic เดิม)
        if (selections.icareChecked) {
            const iCareStopAge = selections.icareStopPayment.useCustomStopAge
                ? selections.icareStopPayment.stopAge
                : ICARE_MAX_PAY_AGE;
            if (currentAttainedAge <= iCareStopAge && currentAttainedAge >= newComponentsEntryAge) {
                let iCareMainPremiumPart = 0;
                const mainRateEntry = iCareMainPremiumRates.find(r => r.age === effectiveCiRiderEntryAge);
                if (mainRateEntry) { iCareMainPremiumPart = mainRateEntry[gender]; }
                let iCareCriticalPremiumPart = 0;
                if (selections.icareSA > 0 && currentAttainedAge <= ICARE_CRITICAL_RIDER_MAX_AGE_FOR_RATE) {
                    const criticalRateEntry = icareCriticalRates.find(r => currentAttainedAge >= r.minAge && currentAttainedAge <= r.maxAge);
                    if (criticalRateEntry) { iCareCriticalPremiumPart = (selections.icareSA / 1000) * criticalRateEntry[gender]; }
                }
                yearIcarePremium = Math.round(iCareMainPremiumPart + iCareCriticalPremiumPart);
            }
        }

        // 3. iShield Premium (Logic เดิม)
        if (selections.ishieldChecked && selections.ishieldPlan !== null && selections.ishieldSA > 0) {
            const iShieldStopAge = selections.ishieldStopPayment.useCustomStopAge
                ? selections.ishieldStopPayment.stopAge
                : 84;
            const iShieldPaymentTerm = parseInt(selections.ishieldPlan, 10);
            const actualIShieldPolicyYear = currentAttainedAge - effectiveCiRiderEntryAge + 1;
            if (actualIShieldPolicyYear > 0 && actualIShieldPolicyYear <= iShieldPaymentTerm && currentAttainedAge <= iShieldStopAge) {
                yearIshieldPremium = getIShieldPremium(
                    effectiveCiRiderEntryAge,
                    selections.ishieldPlan as IShieldPlan,
                    selections.ishieldSA,
                    gender
                );
            }
        }

        // 4. RokRaiSoShield Premium
        if (selections.mainRiderChecked && selections.rokraiChecked && selections.rokraiPlan !== null) {
            const rokraiStopAge = selections.rokraiStopPayment.useCustomStopAge
                ? selections.rokraiStopPayment.stopAge
                : ROKRAI_MAX_PAY_AGE;
            
            // --- จุดที่แก้ไข 2: เพิ่มเงื่อนไข && currentAttainedAge <= lifeReadySurrenderAge ---
            // RokRai จะจ่ายเบี้ยได้ก็ต่อเมื่อ LifeReady ยังไม่ถูกเวนคืน
            if (currentAttainedAge <= rokraiStopAge && currentAttainedAge >= newComponentsEntryAge && currentAttainedAge <= lifeReadySurrenderAge) {
                yearRokraiPremium = getRokRaiSoShieldPremium(
                    currentAttainedAge,
                    selections.rokraiPlan as RokRaiSoShieldPlan,
                    gender
                );
            }
        }

        // 5. DCI Premium
        if (selections.mainRiderChecked && selections.dciChecked && selections.dciSA > 0) {
            const dciStopAge = selections.dciStopPayment.useCustomStopAge
                ? selections.dciStopPayment.stopAge
                : DCI_MAX_PAY_AGE;

            // --- จุดที่แก้ไข 3: เพิ่มเงื่อนไข && currentAttainedAge <= lifeReadySurrenderAge ---
            // DCI จะจ่ายเบี้ยได้ก็ต่อเมื่อ LifeReady ยังไม่ถูกเวนคืน
            if (currentAttainedAge >= DCI_MIN_AGE_FOR_PREMIUM && currentAttainedAge <= dciStopAge && currentAttainedAge >= newComponentsEntryAge && currentAttainedAge <= lifeReadySurrenderAge) {
                yearDciPremium = getDCIPremium(
                    currentAttainedAge,
                    selections.dciSA,
                    gender
                );
            }
        }

        const totalCiPremiumForYear =
            yearLifeReadyPremium +
            yearIcarePremium +
            yearIshieldPremium +
            yearRokraiPremium +
            yearDciPremium;

        premiumSchedule.push({
            policyYear: policyYear,
            age: currentAttainedAge,
            totalCiPremium: Math.round(totalCiPremiumForYear),
            lifeReadyPremium: yearLifeReadyPremium > 0 ? Math.round(yearLifeReadyPremium) : undefined,
            icarePremium: yearIcarePremium > 0 ? Math.round(yearIcarePremium) : undefined,
            ishieldPremium: yearIshieldPremium > 0 ? Math.round(yearIshieldPremium) : undefined,
            rokraiPremium: yearRokraiPremium > 0 ? Math.round(yearRokraiPremium) : undefined,
            dciPremium: yearDciPremium > 0 ? Math.round(yearDciPremium) : undefined,
        });
    }

    return premiumSchedule;
}