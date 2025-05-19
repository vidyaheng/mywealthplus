// healthPlanCalculations.ts

import { LIFE_READY_RATES, LifeReadyRateEntry } from '@/data/lifeReadyRates';
import { IHEALTHY_ULTRA_RATES, IHealthyUltraRateEntry } from '@/data/iHealthyUltraRates';
import { MEB_RATES, MEBRateEntry } from '@/data/mebRates';
// หาก Gender type จาก iWealthy calculations ถูก export ออกมา ก็สามารถ import มาใช้ได้
// หรือจะนิยามใหม่ที่นี่ถ้าต้องการให้เป็นอิสระต่อกัน
// import { Gender } from './iWealthy/calculations'; // ตัวอย่าง Path

// นิยาม Type ที่ใช้ใน LTHC context (อาจจะรวมไว้ในไฟล์ types.ts แยกต่างหากก็ได้)
export type Gender = 'male' | 'female'; // นิยาม Gender ที่นี่หากไม่ได้ import

export type LifeReadyPaymentTerm = 6 | 12 | 18 | 99; // 99 หมายถึงจ่ายถึงอายุ 99
export type IHealthyUltraPlan = 'Smart' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Platinum';
export type MEBPlan = 500 | 1000 | 2000 | 3000 | 4000 | 5000;

export interface HealthPlanSelections { // <--- ต้องมี export
  lifeReadySA: number;
  lifeReadyPPT: LifeReadyPaymentTerm;
  iHealthyUltraPlan: IHealthyUltraPlan;
  mebPlan: MEBPlan;
}

// --- Utility Functions (ฟังก์ชันช่วยค้นหาข้อมูลจากตารางเบี้ย) ---

function findLifeReadyRate(age: number, rates: LifeReadyRateEntry[]): LifeReadyRateEntry | undefined {
  return rates.find(r => r.age === age);
}

function findIHealthyUltraRate(age: number, rates: IHealthyUltraRateEntry[]): IHealthyUltraRateEntry | undefined {
  // สำหรับ iHealthy Ultra ตารางเบี้ยอาจจะมีถึงอายุ 98 หรือ 99
  // หาก attainedAge เกินอายุสูงสุดในตาราง ควรจะคืนค่า entry สุดท้าย หรือ 0 หรือ error ตามนโยบาย
  if (rates.length === 0) return undefined;
  if (age > rates[rates.length - 1].age) {
    // ตัวอย่าง: ถ้าอายุเกินตาราง ให้ใช้เบี้ยของอายุสูงสุดในตาราง (สำหรับการต่ออายุ)
    // หรือจะ return undefined; แล้วให้ฟังก์ชันเรียกใช้จัดการต่อก็ได้
    // return rates[rates.length - 1];
    return undefined; // ให้ฟังก์ชันที่เรียกจัดการ
  }
  return rates.find(r => r.age === age);
}

function findMEBRate(age: number, rates: MEBRateEntry[]): MEBRateEntry | undefined {
  // MEB มีเบี้ยถึงอายุ 74
  if (rates.length === 0) return undefined;
  if (age > rates[rates.length - 1].age) {
    return undefined; // อายุเกินตารางที่กำหนด (74 ปี)
  }
  return rates.find(r => r.age === age);
}

// --- ฟังก์ชันคำนวณเบี้ยประกันรายแผน (Individual Plan Premium Calculation Functions) ---

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

  // ตรวจสอบเงื่อนไขอายุรับประกันสำหรับแต่ละระยะเวลาชำระเบี้ย
  if (paymentTerm !== 99 && entryAge > 70) {
    // ระยะเวลาชำระเบี้ย 6, 12, 18 ปี รับประกันถึงอายุ 70 ปี
    // ถ้า ratePer1000 จากตารางเป็น 0 อยู่แล้วก็ถือว่าถูกต้อง
    if (ratePer1000 > 0) console.warn(`[LifeReady] Entry age ${entryAge} exceeds max entry age (70) for payment term ${paymentTerm}yr.`);
    return ratePer1000 > 0 ? (ratePer1000 / 1000) * sumAssured : 0; // ใช้ค่าจากตารางถ้ามี แม้จะเกิน 70 แต่ให้ตารางเป็นตัวกำหนด
  }
  if (paymentTerm === 99 && entryAge > 80) {
    // ระยะเวลาชำระเบี้ยถึงอายุ 99 ปี รับประกันถึงอายุ 80 ปี
    if (ratePer1000 > 0) console.warn(`[LifeReady] Entry age ${entryAge} exceeds max entry age (80) for payment term to 99.`);
    return ratePer1000 > 0 ? (ratePer1000 / 1000) * sumAssured : 0;
  }
  
  if (ratePer1000 === undefined || ratePer1000 < 0) { // กรณีค่าในตารางอาจไม่ถูกต้อง
      console.warn(`[LifeReady] Invalid rate per 1000: ${ratePer1000} for age ${entryAge}, gender ${gender}, term ${paymentTerm}`);
      return 0;
  }


  return (ratePer1000 / 1000) * sumAssured;
}

/**
 * คำนวณเบี้ยประกันรายปีสำหรับ iHealthy Ultra
 * เบี้ยนี้จะปรับตามอายุที่ต่อสัญญา (attainedAge)
 */
export function calculateIHealthyUltraPremium(
  attainedAge: number,
  gender: Gender,
  plan: IHealthyUltraPlan
): number {
  const rateEntry = findIHealthyUltraRate(attainedAge, IHEALTHY_ULTRA_RATES);

  if (!rateEntry) {
    // อาจจะหมายถึงอายุเกินตารางที่รองรับการต่ออายุ (เช่น เกิน 98 ปี)
    // console.warn(`[iHealthyUltra] Rate not found for attained age: ${attainedAge}, plan: ${plan}`);
    return 0;
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
      default:
        console.warn(`[iHealthyUltra] Invalid plan for male: ${plan}`);
        return 0;
    }
  } else { // female
    switch (plan) {
      case 'Smart': premium = rateEntry.femaleSmart; break;
      case 'Bronze': premium = rateEntry.femaleBronze; break;
      case 'Silver': premium = rateEntry.femaleSilver; break;
      case 'Gold': premium = rateEntry.femaleGold; break;
      case 'Diamond': premium = rateEntry.femaleDiamond; break;
      case 'Platinum': premium = rateEntry.femalePlatinum; break;
      default:
        console.warn(`[iHealthyUltra] Invalid plan for female: ${plan}`);
        return 0;
    }
  }
  
  if (premium === undefined || premium < 0) {
      console.warn(`[iHealthyUltra] Invalid premium: ${premium} for age ${attainedAge}, gender ${gender}, plan ${plan}`);
      return 0;
  }

  return premium;
}

/**
 * คำนวณเบี้ยประกันรายปีสำหรับ MEB (ชดเชยรายได้)
 * เบี้ยนี้จะปรับตามอายุที่ต่อสัญญา (attainedAge) และไม่แยกเพศ
 * รับประกันถึงอายุ 74 ปี (จ่ายเบี้ยปีสุดท้าย) คุ้มครองถึง 75 ปี
 */
export function calculateMEBPremium(
  attainedAge: number,
  plan: MEBPlan
): number {
  if (attainedAge > 74) { // เบี้ยปีสุดท้ายที่อายุ 74
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
    default:
      console.warn(`[MEB] Invalid plan: ${plan}`);
      return 0;
  }
  
  if (premium === undefined || premium < 0) {
      console.warn(`[MEB] Invalid premium: ${premium} for age ${attainedAge}, plan ${plan}`);
      return 0;
  }
  return premium;
}

// --- ฟังก์ชันคำนวณเบี้ยสุขภาพรวมรายปี ---

export interface HealthPlanSelections {
  lifeReadySA: number;
  lifeReadyPPT: LifeReadyPaymentTerm;
  iHealthyUltraPlan: IHealthyUltraPlan;
  mebPlan: MEBPlan;
  // อาจจะเพิ่ม field อื่นๆ ที่จำเป็นสำหรับการเลือกแผนสุขภาพในอนาคต
}

/**
 * คำนวณเบี้ยประกันสุขภาพรวมสำหรับปีนั้นๆ (ตามอายุที่ต่อสัญญา)
 * @param initialEntryAge อายุแรกเข้าของผู้เอาประกัน (สำหรับ Life Ready)
 * @param currentPolicyYear ปีกรมธรรม์ปัจจุบัน (เริ่มที่ 1)
 * @param gender เพศ
 * @param selections การเลือกแผนสุขภาพทั้งหมด
 */
export function getAnnualTotalHealthPremium(
  initialEntryAge: number,
  currentPolicyYear: number,
  gender: Gender,
  selections: HealthPlanSelections
): number {
  const attainedAge = initialEntryAge + currentPolicyYear - 1;
  let totalAnnualPremium = 0;

  // 1. Life Ready Premium
  // Life Ready จ่ายเบี้ยตามระยะเวลาชำระเบี้ยของแผน Life Ready เอง
  let lifeReadyStillPaying = false;
  if (selections.lifeReadyPPT === 99) {
    // จ่ายถึงอายุ 99 (เบี้ยปีสุดท้ายที่อายุ 98 ถ้าคุ้มครองถึง 99)
    // หรืออาจจะถึง 99 ถ้าตารางเบี้ยมีถึงอายุ 99
    // จากตาราง Life Ready รับถึงอายุ 80 สำหรับแบบจ่ายถึง 99
    // ดังนั้นจะจ่ายเบี้ยจนถึงอายุ 98 หากเริ่มก่อนหรือที่อายุ 80 (สมมติว่ากรมธรรม์คุ้มครองถึง 99)
    // แต่ตารางเบี้ยมีถึงอายุ 80 สำหรับจ่ายถึง 99 ดังนั้น จ่ายถึงอายุที่ระบุในตารางเบี้ย
    lifeReadyStillPaying = attainedAge <= 98 && initialEntryAge <= 80 ; // ตรวจสอบเงื่อนไขการจ่ายเบี้ยที่อายุ 99
  } else {
    lifeReadyStillPaying = currentPolicyYear <= selections.lifeReadyPPT && initialEntryAge <= 70;
  }

  if (lifeReadyStillPaying) {
    totalAnnualPremium += calculateLifeReadyPremium(
      initialEntryAge,
      gender,
      selections.lifeReadySA,
      selections.lifeReadyPPT
    );
  }

  // 2. iHealthy Ultra Premium
  // สมมติว่า iHealthy Ultra ต่ออายุได้จนถึงอายุ 98 ปี (จ่ายเบี้ยปีสุดท้ายที่อายุ 98 เพื่อคุ้มครองถึง 99)
  // หรือตามอายุสูงสุดในตาราง IHEALTHY_ULTRA_RATES
  const maxIHealthyUltraAge = IHEALTHY_ULTRA_RATES.length > 0 ? IHEALTHY_ULTRA_RATES[IHEALTHY_ULTRA_RATES.length - 1].age : 0;
  if (attainedAge <= maxIHealthyUltraAge) { 
    totalAnnualPremium += calculateIHealthyUltraPremium(
      attainedAge,
      gender,
      selections.iHealthyUltraPlan
    );
  }

  // 3. MEB Premium
  // จ่ายเบี้ยถึงอายุ 74 ปี คุ้มครองถึงอายุ 75 ปี
  if (attainedAge <= 74) {
    totalAnnualPremium += calculateMEBPremium(
      attainedAge,
      selections.mebPlan
    );
  }

  return totalAnnualPremium;
}

// สามารถเพิ่มฟังก์ชันอื่นๆ ที่เกี่ยวข้องกับการคำนวณสุขภาพได้ที่นี่
// เช่น ฟังก์ชันคำนวณผลประโยชน์รวมของแผนสุขภาพ (ถ้ามี)