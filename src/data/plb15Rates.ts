// src/data/plb15Rates.ts

import type { Gender } from '../lib/calculations'; // Import Type จากไฟล์เดิม

/**
 * โครงสร้างข้อมูลสำหรับเบี้ยประกัน Term แต่ละช่วงอายุ
 * อัตราเบี้ยต่อทุนประกัน 1,000 บาท
 */
export interface TermRateEntry {
  age: number;
  maleRate: number;
  femaleRate: number;
}

// ข้อมูลเบี้ยประกัน PLB15 (Term 15 ปี) ตั้งแต่อายุ 20-59 ปี
export const PLB15_RATES: TermRateEntry[] = [
  { age: 20, maleRate: 4.42, femaleRate: 2.74 },
  { age: 21, maleRate: 4.49, femaleRate: 2.76 },
  { age: 22, maleRate: 4.56, femaleRate: 2.79 },
  { age: 23, maleRate: 4.64, femaleRate: 2.83 },
  { age: 24, maleRate: 4.73, femaleRate: 2.86 },
  { age: 25, maleRate: 4.83, femaleRate: 2.90 },
  { age: 26, maleRate: 4.95, femaleRate: 2.95 },
  { age: 27, maleRate: 5.07, femaleRate: 3.01 },
  { age: 28, maleRate: 5.22, femaleRate: 3.07 },
  { age: 29, maleRate: 5.38, femaleRate: 3.14 },
  { age: 30, maleRate: 5.56, femaleRate: 3.22 },
  { age: 31, maleRate: 5.77, femaleRate: 3.31 },
  { age: 32, maleRate: 5.99, femaleRate: 3.41 },
  { age: 33, maleRate: 6.23, femaleRate: 3.52 },
  { age: 34, maleRate: 6.50, femaleRate: 3.65 },
  { age: 35, maleRate: 6.80, femaleRate: 3.78 },
  { age: 36, maleRate: 7.12, femaleRate: 3.93 },
  { age: 37, maleRate: 7.47, femaleRate: 4.10 },
  { age: 38, maleRate: 7.86, femaleRate: 4.28 },
  { age: 39, maleRate: 8.27, femaleRate: 4.49 },
  { age: 40, maleRate: 8.73, femaleRate: 4.71 },
  { age: 41, maleRate: 9.22, femaleRate: 4.96 },
  { age: 42, maleRate: 9.76, femaleRate: 5.24 },
  { age: 43, maleRate: 10.36, femaleRate: 5.55 },
  { age: 44, maleRate: 11.01, femaleRate: 5.90 },
  { age: 55, maleRate: 11.73, femaleRate: 6.29 },
  { age: 46, maleRate: 12.52, femaleRate: 6.73 },
  { age: 47, maleRate: 13.40, femaleRate: 7.22 },
  { age: 48, maleRate: 14.37, femaleRate: 7.78 },
  { age: 49, maleRate: 15.46, femaleRate: 8.41 },
  { age: 50, maleRate: 16.66, femaleRate: 9.12 },
  { age: 51, maleRate: 18.01, femaleRate: 9.93 },
  { age: 52, maleRate: 19.52, femaleRate: 10.87 },
  { age: 53, maleRate: 21.20, femaleRate: 11.94 },
  { age: 54, maleRate: 23.10, femaleRate: 13.17 },
  { age: 55, maleRate: 25.22, femaleRate: 14.60 },
  { age: 56, maleRate: 27.61, femaleRate: 16.24 },
  { age: 57, maleRate: 30.29, femaleRate: 18.14 },
  { age: 58, maleRate: 33.30, femaleRate: 20.32 },
  { age: 59, maleRate: 36.66, femaleRate: 22.82 },
];

// --- ค่าคงที่สำหรับการประมาณการเบี้ยประกันหลังอายุ 59 ปี ---
const LAST_KNOWN_AGE = 59;
// จากการวิเคราะห์ข้อมูล 5 ปีสุดท้าย อัตราเบี้ยชายโตเฉลี่ยปีละ 10% และหญิง 12%
const MALE_ANNUAL_GROWTH_RATE = 0.10; // 10%
const FEMALE_ANNUAL_GROWTH_RATE = 0.12; // 12%


/**
 * ดึงอัตราเบี้ยประกัน Term 15 ปี (PLB15) ต่อทุน 1,000 บาท
 * หากอายุเกิน 59 ปี จะทำการประมาณการเบี้ยโดยใช้อัตราเติบโตแบบทบต้น
 * @param age - อายุ
 * @param gender - เพศ
 * @returns อัตราเบี้ยประกัน
 */
export function getPlb15TermRate(age: number, gender: Gender): number {
  const effectiveAge = Math.max(20, Math.min(age, 98)); // จำกัดอายุในช่วงที่สมเหตุสมผล

  const rateEntry = PLB15_RATES.find(entry => entry.age === effectiveAge);

  if (rateEntry) {
    return gender === 'male' ? rateEntry.maleRate : rateEntry.femaleRate;
  }

  // หากอายุเกินขอบเขตข้อมูล (มากกว่า 59 ปี) ให้ทำการประมาณการ
  if (effectiveAge > LAST_KNOWN_AGE) {
    const lastRateEntry = PLB15_RATES[PLB15_RATES.length - 1];
    const yearsToExtrapolate = effectiveAge - LAST_KNOWN_AGE;
    
    if (gender === 'male') {
      const extrapolatedRate = lastRateEntry.maleRate * Math.pow(1 + MALE_ANNUAL_GROWTH_RATE, yearsToExtrapolate);
      return extrapolatedRate;
    } else {
      const extrapolatedRate = lastRateEntry.femaleRate * Math.pow(1 + FEMALE_ANNUAL_GROWTH_RATE, yearsToExtrapolate);
      return extrapolatedRate;
    }
  }
  
  // ในกรณีที่ไม่คาดคิด ให้คืนค่าสุดท้าย
  return gender === 'male' ? PLB15_RATES[PLB15_RATES.length - 1].maleRate : PLB15_RATES[PLB15_RATES.length - 1].femaleRate;
}


/**
 * ฟังก์ชันผู้ช่วยสำหรับคำนวณเบี้ยประกัน Term 15 ปี ทั้งหมดต่อปี
 * @param age - อายุ
 * @param gender - เพศ
 * @param sumAssured - ทุนประกันที่ต้องการ
 * @returns เบี้ยประกันที่ต้องจ่ายต่อปี
 */
export function calculatePlb15TermPremium(age: number, gender: Gender, sumAssured: number): number {
  if (sumAssured <= 0) return 0;
  
  const ratePerThousand = getPlb15TermRate(age, gender);
  const premium = ratePerThousand * (sumAssured / 1000);
  
  return premium;
}