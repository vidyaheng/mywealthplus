import type {
    Gender,
    CiPlanSelections,
    AnnualCiPremiumDetail,
    PolicyOriginMode,
    // Aliases from useCiTypes if you prefer to use them for clarity, e.g.:
    // LifeReadyPlan as CiLifeReadyPlan,
    // IShieldPlan as CiIShieldPlan,
    // RokRaiSoShieldPlan as CiRokRaiSoShieldPlan,
} from '../types/useCiTypes'; // ปรับ Path ให้ถูกต้อง

import {
    getLifeReadyPremium,
    getIShieldPremium,
    getRokRaiSoShieldPremium,
    getDCIPremium,
} from './premiumCalcs'; // ปรับ Path ให้ถูกต้อง

import { premiumRates as iCareMainPremiumRates } from '../data/icare_main_premium'; // ปรับ Path ให้ถูกต้อง
import { icareCriticalRates } from '../data/icare_critical_rate'; // ปรับ Path ให้ถูกต้อง

// --- Constants for premium calculation logic ---
const MAX_SCHEDULE_AGE_DEFAULT = 98;

const LIFE_READY_TO_99_MAX_PAY_AGE = 98;
const ICARE_MAX_PAY_AGE = 84;
const ICARE_CRITICAL_RIDER_MAX_AGE_FOR_RATE = 84;
const ROKRAI_MAX_PAY_AGE = 98;
const DCI_MIN_AGE_FOR_PREMIUM = 20;
const DCI_MAX_PAY_AGE = 74;
const FIXED_ICARE_MAIN_SA = 100000; // ทุนประกันส่วนหลักของ iCare คงที่

export function calculateAllCiPremiumsSchedule(
    currentPlanningAge: number, // อายุ ณ ปัจจุบันที่ใช้ในการเริ่มวางแผน
    gender: Gender, // 'male' | 'female'
    selections: CiPlanSelections,
    policyOriginMode: PolicyOriginMode,
    existingOriginalEntryAge?: number, // อายุแรกเข้าของสัญญาหลักเดิม (ถ้ามี)
    maxScheduleAge: number = MAX_SCHEDULE_AGE_DEFAULT
): AnnualCiPremiumDetail[] {
    const premiumSchedule: AnnualCiPremiumDetail[] = [];

    // อายุแรกเข้าสำหรับสัญญาหลัก (LifeReady) ที่อาจมีอยู่แล้ว
    const effectiveLifeReadyEntryAge =
        policyOriginMode === 'existingPolicy' &&
        selections.mainRiderChecked && // ตรวจสอบว่า LifeReady ถูกพิจารณา
        existingOriginalEntryAge !== undefined
            ? existingOriginalEntryAge
            : currentPlanningAge;

    // อายุแรกเข้าสำหรับสัญญาเพิ่มเติม CI หรือ iCare ที่เพิ่มใหม่ในแผนนี้
    const newComponentsEntryAge = currentPlanningAge;

    for (let policyYear = 1; ; policyYear++) {
        // อายุที่เปลี่ยนแปลงไปในแต่ละปี โดยอิงจากอายุ ณ ปัจจุบันที่เริ่มวางแผน
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
            if (selections.lifeReadyPlan === 99) { // Plan "To 99"
                // สำหรับ LifeReady ที่จ่ายถึง 99, ระยะเวลาชำระเบี้ยจะขึ้นกับ effectiveLifeReadyEntryAge
                if (currentAttainedAge <= LIFE_READY_TO_99_MAX_PAY_AGE && currentAttainedAge >= effectiveLifeReadyEntryAge) {
                    payLifeReadyThisYear = true;
                }
            } else { // Plans 6, 12, 18 years
                // ระยะเวลาชำระเบี้ยนับจากปีที่ LifeReady เริ่ม (effectiveLifeReadyEntryAge)
                // policyYearInLR = currentAttainedAge - effectiveLifeReadyEntryAge + 1
                // แต่เนื่องจาก loop นี้อิงจาก currentPlanningAge, เราต้องดูว่า LifeReady จ่ายครบหรือยัง
                const lifeReadyPolicyYear = currentAttainedAge - effectiveLifeReadyEntryAge + 1;
                if (lifeReadyPolicyYear > 0 && lifeReadyPolicyYear <= selections.lifeReadyPlan) {
                     payLifeReadyThisYear = true;
                }
            }

            if (payLifeReadyThisYear) {
                yearLifeReadyPremium = getLifeReadyPremium(
                    effectiveLifeReadyEntryAge, // ใช้อายุแรกเข้าที่แท้จริงของ LifeReady
                    selections.lifeReadyPlan,
                    selections.lifeReadySA,
                    gender
                );
            }
        }

        // 2. iCare Premium (จ่ายเบี้ยถึงอายุ 84)
        // สมมติว่า iCare ที่เลือกใน CIForm เป็นการซื้อใหม่ ณ currentPlanningAge เสมอ
        if (selections.icareChecked) {
            if (currentAttainedAge <= ICARE_MAX_PAY_AGE && currentAttainedAge >= newComponentsEntryAge) {
                let iCareMainPremiumPart = 0;
                const mainRateEntry = iCareMainPremiumRates.find(r => r.age === newComponentsEntryAge); // ส่วนหลักใช้อายุแรกเข้าของ iCare (newComponentsEntryAge)
                if (mainRateEntry) {
                    iCareMainPremiumPart = mainRateEntry[gender] * (FIXED_ICARE_MAIN_SA / 1_000_000);
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
        // สมมติว่า iShield ที่เลือกใน CIForm เป็นการซื้อใหม่ ณ currentPlanningAge เสมอ
        if (selections.ishieldChecked && selections.ishieldPlan !== null && selections.ishieldSA > 0) {
            const iShieldPaymentTerm = parseInt(selections.ishieldPlan, 10);
            const iShieldPolicyYear = currentAttainedAge - newComponentsEntryAge + 1; // ปีที่ของกรมธรรม์ iShield
            if (iShieldPolicyYear > 0 && iShieldPolicyYear <= iShieldPaymentTerm) {
                yearIshieldPremium = getIShieldPremium(
                    newComponentsEntryAge, // เบี้ย iShield คงที่ตามอายุแรกเข้าของ iShield (newComponentsEntryAge)
                    selections.ishieldPlan,
                    selections.ishieldSA,
                    gender
                );
            }
        }

        // 4. RokRaiSoShield Premium (ต้องมี LifeReady และจ่ายเบี้ยถึงอายุ 98)
        if (selections.mainRiderChecked && selections.rokraiChecked && selections.rokraiPlan !== null) {
            if (currentAttainedAge <= ROKRAI_MAX_PAY_AGE && currentAttainedAge >= newComponentsEntryAge) { // เริ่มจ่ายเมื่ออายุถึง newComponentsEntryAge
                yearRokraiPremium = getRokRaiSoShieldPremium(
                    currentAttainedAge,
                    selections.rokraiPlan,
                    gender
                );
            }
        }

        // 5. DCI Premium (ต้องมี LifeReady และจ่ายเบี้ย 20-74 ปี)
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
            policyYear: policyYear, // ปีที่ของแพ็กเกจ CI ที่กำลังวางแผน
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