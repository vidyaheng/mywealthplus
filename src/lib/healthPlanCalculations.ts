// src/lib/healthPlanCalculations.ts

// Import ตารางเบี้ย (ตรวจสอบ Path ให้ถูกต้องตามโครงสร้างโปรเจกต์ของคุณ)
import { LIFE_READY_RATES, type LifeReadyRateEntry } from '@/data/lifeReadyRates'; // สมมติ Path นี้
import { IHEALTHY_ULTRA_RATES, type IHealthyUltraRateEntry } from '@/data/iHealthyUltraRates'; // สมมติ Path นี้
import { MEB_RATES, type MEBRateEntry } from '@/data/mebRates'; // สมมติ Path นี้

// ====================================================================================
// SECTION 1: Base Type Definitions Exported from this Module
// (Types เหล่านี้จะถูก import และ re-export หรือ extend ใน useLthcTypes.ts)
// ====================================================================================

export type Gender = 'male' | 'female';

export type LifeReadyPaymentTerm = 6 | 12 | 18 | 99; // 99 หมายถึงจ่ายถึงอายุ 99

// Type สำหรับชื่อแผน iHealthy Ultra จริงๆ (ไม่รวม 'NONE' หรือค่าที่หมายถึง "ไม่เลือก")
export type IHealthyUltraPlan = 'Smart' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Platinum';

// Type สำหรับค่าแผน MEB จริงๆ (ไม่รวม 0 หรือค่าที่หมายถึง "ไม่เลือก")
export type MEBPlan = 500 | 1000 | 2000 | 3000 | 4000 | 5000;

// --- Utility Functions (internal to this module, not exported) ---

function findLifeReadyRate(age: number, rates: LifeReadyRateEntry[]): LifeReadyRateEntry | undefined {
    return rates.find(r => r.age === age);
}

function findIHealthyUltraRate(age: number, rates: IHealthyUltraRateEntry[]): IHealthyUltraRateEntry | undefined {
    if (rates.length === 0) return undefined;
    // หากต้องการให้คืนค่าสุดท้ายถ้าอายุเกินตาราง ให้ uncomment ส่วนนี้
    // if (age > rates[rates.length - 1].age) {
    //     return rates[rates.length - 1];
    // }
    return rates.find(r => r.age === age);
}

function findMEBRate(age: number, rates: MEBRateEntry[]): MEBRateEntry | undefined {
    if (rates.length === 0) return undefined;
    // MEB มีเบี้ยถึงอายุ 74
    // if (age > rates[rates.length - 1].age) {
    //     return undefined;
    // }
    return rates.find(r => r.age === age);
}

// ====================================================================================
// SECTION 2: Exported Premium Calculation Functions
// (ฟังก์ชันเหล่านี้คาดหวังจะได้รับ Plan ที่ "เลือกแล้วจริงๆ" ไม่ใช่ค่า 'NONE' หรือ 0)
// ====================================================================================

/**
 * คำนวณเบี้ยประกันรายปีสำหรับ Life Ready
 * เบี้ยนี้จะคงที่ตามอายุแรกเข้า ตลอดระยะเวลาชำระเบี้ย
 */
export function calculateLifeReadyPremium(
    entryAge: number,
    gender: Gender,
    sumAssured: number,
    paymentTerm: LifeReadyPaymentTerm
): number {
    const rateEntry = findLifeReadyRate(entryAge, LIFE_READY_RATES);
    if (!rateEntry) {
        console.warn(`[LifeReady] Rate not found for entry age: ${entryAge}`);
        return 0;
    }

    let ratePer1000: number;
    if (gender === 'male') {
        if (paymentTerm === 6) ratePer1000 = rateEntry.male6Yr;
        else if (paymentTerm === 12) ratePer1000 = rateEntry.male12Yr;
        else if (paymentTerm === 18) ratePer1000 = rateEntry.male18Yr;
        else if (paymentTerm === 99) ratePer1000 = rateEntry.maleTo99;
        else {
            console.warn(`[LifeReady] Invalid payment term for male: ${paymentTerm}`);
            return 0;
        }
    } else { // female
        if (paymentTerm === 6) ratePer1000 = rateEntry.female6Yr;
        else if (paymentTerm === 12) ratePer1000 = rateEntry.female12Yr;
        else if (paymentTerm === 18) ratePer1000 = rateEntry.female18Yr;
        else if (paymentTerm === 99) ratePer1000 = rateEntry.femaleTo99;
        else {
            console.warn(`[LifeReady] Invalid payment term for female: ${paymentTerm}`);
            return 0;
        }
    }

    if (paymentTerm !== 99 && entryAge > 70 && ratePer1000 > 0) {
        // console.warn(`[LifeReady] Entry age ${entryAge} may exceed max entry age (70) for payment term ${paymentTerm}yr, but rate found.`);
        // Allow calculation if rate exists, as table might have specific overrides
    }
    if (paymentTerm === 99 && entryAge > 80 && ratePer1000 > 0) {
        // console.warn(`[LifeReady] Entry age ${entryAge} may exceed max entry age (80) for payment term to 99, but rate found.`);
    }

    if (ratePer1000 === undefined || ratePer1000 < 0) {
        console.warn(`[LifeReady] Invalid rate per 1000: ${ratePer1000} for age ${entryAge}, gender ${gender}, term ${paymentTerm}`);
        return 0;
    }
    return (ratePer1000 / 1000) * sumAssured;
}

/**
 * คำนวณเบี้ยประกันรายปีสำหรับ iHealthy Ultra
 * เบี้ยนี้จะปรับตามอายุที่ต่อสัญญา (attainedAge)
 * พารามิเตอร์ plan คาดหวัง Type IHealthyUltraPlan (ที่เป็น Union ของชื่อแผนจริงๆ ไม่รวม 'NONE')
 */
export function calculateIHealthyUltraPremium(
    attainedAge: number,
    gender: Gender,
    plan: IHealthyUltraPlan // คาดหวังชื่อแผนจริงๆ
): number {
    const rateEntry = findIHealthyUltraRate(attainedAge, IHEALTHY_ULTRA_RATES);
    if (!rateEntry) {
        // console.warn(`[iHealthyUltra] Rate not found for attained age: ${attainedAge}, plan: ${plan}`);
        return 0; // ถ้าอายุเกินตารางเบี้ย
    }

    let premium: number | undefined;
    if (gender === 'male') {
        switch (plan) {
            case 'Smart': premium = rateEntry.maleSmart; break;
            case 'Bronze': premium = rateEntry.maleBronze; break;
            case 'Silver': premium = rateEntry.maleSilver; break;
            case 'Gold': premium = rateEntry.maleGold; break;
            case 'Diamond': premium = rateEntry.maleDiamond; break;
            case 'Platinum': premium = rateEntry.malePlatinum; break;
            default: // Should not happen if 'plan' is of type IHealthyUltraPlan
                console.warn(`[iHealthyUltra] Invalid plan (male): ${plan}`); return 0;
        }
    } else { // female
        switch (plan) {
            case 'Smart': premium = rateEntry.femaleSmart; break;
            case 'Bronze': premium = rateEntry.femaleBronze; break;
            case 'Silver': premium = rateEntry.femaleSilver; break;
            case 'Gold': premium = rateEntry.femaleGold; break;
            case 'Diamond': premium = rateEntry.femaleDiamond; break;
            case 'Platinum': premium = rateEntry.femalePlatinum; break;
            default: // Should not happen
                console.warn(`[iHealthyUltra] Invalid plan (female): ${plan}`); return 0;
        }
    }
    return premium !== undefined && premium > 0 ? premium : 0;
}

/**
 * คำนวณเบี้ยประกันรายปีสำหรับ MEB (ชดเชยรายได้)
 * เบี้ยนี้จะปรับตามอายุที่ต่อสัญญา (attainedAge)
 * พารามิเตอร์ plan คาดหวัง Type MEBPlan (ที่เป็น Union ของค่าแผนจริงๆ ไม่รวม 0 หรือค่า "ไม่เลือก")
 */
export function calculateMEBPremium(
    attainedAge: number,
    plan: MEBPlan // คาดหวังค่าแผนจริงๆ
): number {
    // MEB จ่ายเบี้ยถึงอายุ MEB_TERMINATION_AGE_TYPE (เช่น 74), คุ้มครองถึงอายุถัดไป
    if (attainedAge > MEB_TERMINATION_AGE_TYPE_FROM_TYPES) { // ใช้ค่าคงที่ที่ import มา
        return 0;
    }
    const rateEntry = findMEBRate(attainedAge, MEB_RATES);
    if (!rateEntry) {
        // console.warn(`[MEB] Rate not found for attained age: ${attainedAge}, plan: ${plan}`);
        return 0;
    }

    let premium: number | undefined;
    switch (plan) {
        case 500: premium = rateEntry.plan500; break;
        case 1000: premium = rateEntry.plan1000; break;
        case 2000: premium = rateEntry.plan2000; break;
        case 3000: premium = rateEntry.plan3000; break;
        case 4000: premium = rateEntry.plan4000; break;
        case 5000: premium = rateEntry.plan5000; break;
        default: // Should not happen if 'plan' is of type MEBPlan
             console.warn(`[MEB] Invalid plan value: ${plan}`); return 0;
    }
    return premium !== undefined && premium > 0 ? premium : 0;
}

// เพิ่มการ import ค่าคงที่จาก useLthcTypes ถ้าจะใช้
// import { MEB_TERMINATION_AGE_TYPE as MEB_TERMINATION_AGE_TYPE_FROM_TYPES } from '../../hooks/useLthcTypes'; // ตัวอย่าง
// หรือถ้า MEB_TERMINATION_AGE_TYPE ถูก define ในไฟล์นี้แล้ว ก็ใช้ตัวนั้น
const MEB_TERMINATION_AGE_TYPE_FROM_TYPES = 74; // Placeholder ถ้ายังไม่ได้ import