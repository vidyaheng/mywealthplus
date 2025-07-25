// src/data/plb15Rates.ts

import type { Gender } from '../lib/calculations';
import { COI_RATES } from './coiRates';

/**
 * โครงสร้างข้อมูลสำหรับเบี้ยประกัน Term แต่ละช่วงอายุ
 * อัตราเบี้ยต่อทุนประกัน 1,000 บาท
 */
export interface TermRateEntry {
  age: number;
  maleRate: number;
  femaleRate: number;
}

// --- ค่าคงที่สำหรับแบบจำลองทางคณิตศาสตร์ ---
const MALE_LOADING_FACTOR = 1.53;
const FEMALE_LOADING_FACTOR = 1.41;
const MAX_AGE = 99;

// ข้อมูลเบี้ยประกัน PLB15 (Term 15 ปี) ฉบับสมบูรณ์
// โดยช่วงอายุ 0-19 ปี เป็นค่าที่ได้จากการประมาณการด้วยแบบจำลอง
// และช่วงอายุ 20-59 ปี เป็นข้อมูลตามตารางเดิม
export const PLB15_RATES_EXTENDED: TermRateEntry[] = [
  // -- Estimated Rates (Age 0-19) --
  { age: 0, maleRate: 2.22, femaleRate: 1.83 },
  { age: 1, maleRate: 0.99, femaleRate: 0.82 },
  { age: 2, maleRate: 1.01, femaleRate: 0.83 },
  { age: 3, maleRate: 1.04, femaleRate: 0.84 },
  { age: 4, maleRate: 1.08, femaleRate: 0.86 },
  { age: 5, maleRate: 1.13, femaleRate: 0.89 },
  { age: 6, maleRate: 1.18, femaleRate: 0.92 },
  { age: 7, maleRate: 1.24, femaleRate: 0.95 },
  { age: 8, maleRate: 1.31, femaleRate: 0.98 },
  { age: 9, maleRate: 1.39, femaleRate: 1.02 },
  { age: 10, maleRate: 1.48, femaleRate: 1.07 },
  { age: 11, maleRate: 1.59, femaleRate: 1.12 },
  { age: 12, maleRate: 1.70, femaleRate: 1.18 },
  { age: 13, maleRate: 1.82, femaleRate: 1.24 },
  { age: 14, maleRate: 1.95, femaleRate: 1.30 },
  { age: 15, maleRate: 2.08, femaleRate: 1.36 },
  { age: 16, maleRate: 2.21, femaleRate: 1.43 },
  { age: 17, maleRate: 2.35, femaleRate: 1.50 },
  { age: 18, maleRate: 2.48, femaleRate: 1.56 },
  { age: 19, maleRate: 2.61, femaleRate: 1.63 },
  // -- Original Rates (Age 20-59) --
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
  { age: 45, maleRate: 11.73, femaleRate: 6.29 },
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

// สร้าง Map เพื่อให้การค้นหา COI และ PLB15 เร็วขึ้น (O(1) complexity)
const coiRateMap = new Map(COI_RATES.map(rate => [rate.age, rate]));
const plb15RateMap = new Map(PLB15_RATES_EXTENDED.map(rate => [rate.age, rate]));

/**
 * ฟังก์ชันผู้ช่วยสำหรับดึงค่า COI ณ อายุและเพศที่กำหนด
 */
function getCoiRate(age: number, gender: Gender): number {
    const rate = coiRateMap.get(age);
    if (!rate) {
        const lastRate = COI_RATES[COI_RATES.length - 1];
        return gender === 'male' ? lastRate.maleRate : lastRate.femaleRate;
    }
    return gender === 'male' ? rate.maleRate : rate.femaleRate;
}

/**
 * ดึงอัตราเบี้ยประกัน Term 15 ปี (PLB15) ต่อทุน 1,000 บาท
 * @param age - อายุ
 * @param gender - เพศ
 * @returns อัตราเบี้ยประกัน
 */
export function getPlb15TermRate(age: number, gender: Gender): number {
    const effectiveAge = Math.max(0, Math.min(age, MAX_AGE)); // ปรับอายุขั้นต่ำเป็น 0

    // 1. ค้นหาเบี้ยจากตารางข้อมูลหลัก (0-59 ปี)
    const rateEntry = plb15RateMap.get(effectiveAge);
    if (rateEntry) {
        return gender === 'male' ? rateEntry.maleRate : rateEntry.femaleRate;
    }

    // 2. หากไม่พบ (อายุ >= 60) ให้ใช้แบบจำลองในการประมาณการ
    const termLength = Math.min(15, MAX_AGE - effectiveAge + 1);
    if (termLength <= 0) return 0; // ควรไม่เกิดขึ้น แต่ป้องกันไว้

    let totalCoi = 0;
    for (let i = 0; i < termLength; i++) {
        totalCoi += getCoiRate(effectiveAge + i, gender);
    }
    
    const avgCoi = totalCoi / termLength;
    const loadingFactor = gender === 'male' ? MALE_LOADING_FACTOR : FEMALE_LOADING_FACTOR;
    
    return avgCoi * loadingFactor;
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
    
    return Math.round(premium * 100) / 100;
}