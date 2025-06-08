// src/components/ci/utils/premiumCalcs.ts

export type { IShieldPlan } from "../data/iShield_rates";
export type { AllRokRaiSoShieldPremiums } from "../data/RokRaiSoShield_rates";


import { icareCriticalRates, ICareCriticalRateRow } from "../data/icare_critical_rate";
import { premiumRates, PremiumRate } from "../data/icare_main_premium";
import { ishieldRates, IShieldRateRow } from "../data/iShield_rates";
import { rokRaiSoShieldPremiums, AllRokRaiSoShieldPremiums } from "../data/RokRaiSoShield_rates";
import { LIFE_READY_RATES, LifeReadyRateEntry } from "@/data/lifeReadyRates";
import { dciRates, DCIRateRow } from "../data/dci_rates";
import type {
    IShieldPlan,
    LifeReadyPlan, 
} from '../types/useCiTypes';

// -------- iCare --------
// This function doesn't take a 'plan' prop, so no changes needed.
export function getICarePremium(age: number, gender: "male" | "female", sumInsured: number) {
    const critical = icareCriticalRates.find(
        (row: ICareCriticalRateRow) => age >= row.minAge && age <= row.maxAge
    );
    const main = premiumRates.find((row: PremiumRate) => row.age === age);
    if (!critical || !main) return 0;

    const genderKey = gender === "male" ? "male" : "female";
    const criticalPremium = (sumInsured / 1000) * critical[genderKey];
    const mainPremium = main[genderKey] * (sumInsured / 1_000_000);
    return Math.round(criticalPremium + mainPremium);
}

// -------- iShield --------
export function getIShieldPremium(
    age: number,
    plan: IShieldPlan | null,
    sumInsured: number,
    gender: "male" | "female"
) {
    // 👇 เพิ่ม Guard Clause
    if (!plan) return 0;

    const rates = ishieldRates[plan];
    const row = rates.find((r: IShieldRateRow) => r.age === age);
    if (!row) return 0;
    const genderKey = gender === "male" ? "male" : "female";
    return Math.round((sumInsured / 1000) * row[genderKey]);
}

// -------- RokRaiSoShield --------
export function getRokRaiSoShieldPremium(
    age: number,
    plan: keyof AllRokRaiSoShieldPremiums,
    gender: "male" | "female"
) {
    // 👇 เพิ่ม Guard Clause
    if (!plan) return 0;

    const premiumsByPlan = rokRaiSoShieldPremiums[plan];
    if (!premiumsByPlan) return 0;
    const genderKey = gender === "male" ? "male" : "female";
    const arr = premiumsByPlan[genderKey];
    if (typeof arr[age] !== "number") return 0;
    return Math.round(arr[age]);
}

// -------- LifeReady --------
export function getLifeReadyPremium(
    age: number,
    plan: LifeReadyPlan,
    sumInsured: number,
    gender: "male" | "female"
) {
    // 👇 เพิ่ม Guard Clause
    if (!plan) return 0;

    const row = LIFE_READY_RATES.find((r: LifeReadyRateEntry) => r.age === age);
    if (!row) return 0;
    let rate = 0;
    if (gender === "male") {
        if (plan === 6) rate = row.male6Yr;
        else if (plan === 12) rate = row.male12Yr;
        else if (plan === 18) rate = row.male18Yr;
        else rate = row.maleTo99;
    } else {
        if (plan === 6) rate = row.female6Yr;
        else if (plan === 12) rate = row.female12Yr;
        else if (plan === 18) rate = row.female18Yr;
        else rate = row.femaleTo99;
    }
    return Math.round((sumInsured / 1000) * rate);
}

// -------- DCI --------
// This function doesn't take a 'plan' prop, so no changes needed.
export function getDCIPremium(
    age: number,
    sumInsured: number,
    gender: "male" | "female"
) {
    const row = dciRates.find((r: DCIRateRow) => r.age === age);
    if (!row) return 0;
    const genderKey = gender === "male" ? "male" : "female";
    return Math.round((sumInsured / 1000) * row[genderKey]);
}