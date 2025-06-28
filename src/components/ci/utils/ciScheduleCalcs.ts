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
const ICARE_CRITICAL_RIDER_MAX_AGE_FOR_RATE = 84;
const ROKRAI_MAX_PAY_AGE = 98;
const DCI_MIN_AGE_FOR_PREMIUM = 20;
const DCI_MAX_PAY_AGE = 74;
//const FIXED_ICARE_MAIN_SA = 100000;

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

        // 1. LifeReady Premium
        if (selections.mainRiderChecked && selections.lifeReadyPlan !== null && selections.lifeReadySA > 0) {
            let payLifeReadyThisYear = false;
            if (selections.lifeReadyPlan === 99) {
                if (currentAttainedAge <= LIFE_READY_TO_99_MAX_PAY_AGE && currentAttainedAge >= effectiveLifeReadyEntryAge) {
                    payLifeReadyThisYear = true;
                }
            } else { 
                const lifeReadyPolicyYear = currentAttainedAge - effectiveLifeReadyEntryAge + 1;
                if (lifeReadyPolicyYear > 0 && lifeReadyPolicyYear <= selections.lifeReadyPlan) {
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

        // 2. iCare Premium
        if (selections.icareChecked) {
            if (currentAttainedAge <= ICARE_MAX_PAY_AGE && currentAttainedAge >= newComponentsEntryAge) {
                let iCareMainPremiumPart = 0;
                const mainRateEntry = iCareMainPremiumRates.find(r => r.age === effectiveCiRiderEntryAge);
                if (mainRateEntry) {
                    iCareMainPremiumPart = mainRateEntry[gender];
                }

                let iCareCriticalPremiumPart = 0;
                if (selections.icareSA > 0 && currentAttainedAge <= ICARE_CRITICAL_RIDER_MAX_AGE_FOR_RATE) {
                    const criticalRateEntry = icareCriticalRates.find(r => currentAttainedAge >= r.minAge && currentAttainedAge <= r.maxAge);
                    if (criticalRateEntry) {
                        iCareCriticalPremiumPart = (selections.icareSA / 1000) * criticalRateEntry[gender];
                    }
                }
                yearIcarePremium = Math.round(iCareMainPremiumPart + iCareCriticalPremiumPart);
            }
        }

        // 3. iShield Premium
        if (selections.ishieldChecked && selections.ishieldPlan !== null && selections.ishieldSA > 0) {
            const iShieldPaymentTerm = parseInt(selections.ishieldPlan, 10);
            const actualIShieldPolicyYear = currentAttainedAge - effectiveCiRiderEntryAge + 1;
            if (actualIShieldPolicyYear > 0 && actualIShieldPolicyYear <= iShieldPaymentTerm) {
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
            if (currentAttainedAge <= ROKRAI_MAX_PAY_AGE && currentAttainedAge >= newComponentsEntryAge) {
                yearRokraiPremium = getRokRaiSoShieldPremium(
                    currentAttainedAge,
                    selections.rokraiPlan as RokRaiSoShieldPlan,
                    gender
                );
            }
        }

        // 5. DCI Premium
        if (selections.mainRiderChecked && selections.dciChecked && selections.dciSA > 0) {
            if (currentAttainedAge >= DCI_MIN_AGE_FOR_PREMIUM && currentAttainedAge <= DCI_MAX_PAY_AGE && currentAttainedAge >= newComponentsEntryAge) {
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