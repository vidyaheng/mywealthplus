// src/data/pensionRates.ts
// ตารางค่าเบี้ยประกันแผนบำนาญ (Pension Plan) ต่อทุนประกัน 1,000 บาท

import type { Gender } from "../lib/calculations";

export type PensionPlanType = 'pension8' | 'pension60';

export const pensionTable = [
  {
    age: 20,
    pension8: { male: 190, female: 200 },
    pension60: { male: 54, female: 56 },
  },
  {
    age: 21,
    pension8: { male: 196, female: 206 },
    pension60: { male: 56, female: 58 },
  },
  {
    age: 22,
    pension8: { male: 202, female: 212 },
    pension60: { male: 59, female: 61 },
  },
  {
    age: 23,
    pension8: { male: 208, female: 218 },
    pension60: { male: 61, female: 63 },
  },
  {
    age: 24,
    pension8: { male: 214, female: 224 },
    pension60: { male: 64, female: 66 },
  },
  {
    age: 25,
    pension8: { male: 220, female: 230 },
    pension60: { male: 66, female: 69 },
  },
  {
    age: 26,
    pension8: { male: 226, female: 235 },
    pension60: { male: 69, female: 72 },
  },
  {
    age: 27,
    pension8: { male: 232, female: 241 },
    pension60: { male: 72, female: 75 },
  },
  {
    age: 28,
    pension8: { male: 238, female: 247 },
    pension60: { male: 76, female: 79 },
  },
  {
    age: 29,
    pension8: { male: 244, female: 253 },
    pension60: { male: 79, female: 82 },
  },
  {
    age: 30,
    pension8: { male: 250, female: 260 },
    pension60: { male: 83, female: 86 },
  },
  {
    age: 31,
    pension8: { male: 256, female: 266 },
    pension60: { male: 87, female: 90 },
  },
  {
    age: 32,
    pension8: { male: 263, female: 273 },
    pension60: { male: 91, female: 95 },
  },
  {
    age: 33,
    pension8: { male: 269, female: 280 },
    pension60: { male: 96, female: 100 },
  },
  {
    age: 34,
    pension8: { male: 276, female: 287 },
    pension60: { male: 101, female: 105 },
  },
  {
    age: 35,
    pension8: { male: 283, female: 294 },
    pension60: { male: 107, female: 111 },
  },
  {
    age: 36,
    pension8: { male: 290, female: 302 },
    pension60: { male: 113, female: 117 },
  },
  {
    age: 37,
    pension8: { male: 298, female: 309 },
    pension60: { male: 119, female: 124 },
  },
  {
    age: 38,
    pension8: { male: 306, female: 317 },
    pension60: { male: 126, female: 132 },
  },
  {
    age: 39,
    pension8: { male: 314, female: 326 },
    pension60: { male: 134, female: 140 },
  },
  {
    age: 40,
    pension8: { male: 322, female: 333 },
    pension60: { male: 143, female: 149 },
  },
  {
    age: 41,
    pension8: { male: 331, female: 344 },
    pension60: { male: 153, female: 159 },
  },
  {
    age: 42,
    pension8: { male: 342, female: 354 },
    pension60: { male: 163, female: 170 },
  },
  {
    age: 43,
    pension8: { male: 353, female: 364 },
    pension60: { male: 175, female: 183 },
  },
  {
    age: 44,
    pension8: { male: 365, female: 375 },
    pension60: { male: 189, female: 197 },
  },
  {
    age: 45,
    pension8: { male: 376, female: 385 },
    pension60: { male: 204, female: 214 },
  },
  {
    age: 46,
    pension8: { male: 389, female: 398 },
    pension60: { male: 222, female: 232 },
  },
  {
    age: 47,
    pension8: { male: 402, female: 410 },
    pension60: { male: 250, female: 260 },
  },
  {
    age: 48,
    pension8: { male: 415, female: 423 },
    pension60: { male: 280, female: 290 },
  },
  {
    age: 49,
    pension8: { male: 429, female: 436 },
    pension60: { male: 315, female: 325 },
  },
  {
    age: 50,
    pension8: { male: 443, female: 449 },
    pension60: { male: 360, female: 368 },
  },
  {
    age: 51,
    pension8: { male: 465, female: 470 },
    pension60: { male: 420, female: 420 },
  },
  {
    age: 52,
    pension8: { male: 485, female: 490 },
    pension60: { male: 480, female: 480 },
  },
  {
    age: 53,
    pension8: null,
    pension60: { male: 560, female: 560 },
  },
  {
    age: 54,
    pension8: null,
    pension60: { male: 675, female: 675 },
  },
  {
    age: 55,
    pension8: null,
    pension60: { male: 850, female: 850 },
  },
];

/**
 * Helper function to get the premium rate for a specific plan.
 * @returns premium rate per 1,000 SA, or null if not available.
 */
export const getPensionPremiumRate = (
    age: number,
    gender: Gender,
    plan: PensionPlanType
): number | null => {
    const ageData = pensionTable.find(row => row.age === age);
    if (!ageData) return null;

    const planData = ageData[plan];
    if (!planData) return null;

    return planData[gender];
}