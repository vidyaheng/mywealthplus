// ตารางเบี้ยสัญญาหลัก iProtect85 + WP (ทุนประกัน 100,000 บ. เท่านั้น)
export interface ICareMainPremiumRow {
  age: number;
  male: number;
  female: number;
}

export const icareMainPremium: ICareMainPremiumRow[] = [
  { age: 0, male: 966, female: 863 },
  { age: 1, male: 981, female: 873 },
  { age: 2, male: 997, female: 884 },
  // ... เพิ่มจนครบถึง 65
  { age: 65, male: 9445, female: 7670 },
];