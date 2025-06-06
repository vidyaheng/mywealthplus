// อัตราเบี้ยโรคร้าย ESCI (ต่อ 1,000 ทุนประกัน)
export interface ICareCriticalRateRow {
  minAge: number;
  maxAge: number;
  male: number;
  female: number;
}

export const icareCriticalRates: ICareCriticalRateRow[] = [
  { minAge: 0, maxAge: 5, male: 1.80, female: 1.36 },
  { minAge: 6, maxAge: 10, male: 1.59, female: 1.33 },
  { minAge: 11, maxAge: 15, male: 1.43, female: 1.57 },
  { minAge: 16, maxAge: 18, male: 1.37, female: 1.44 },
  { minAge: 19, maxAge: 25, male: 1.32, female: 1.29 },
  { minAge: 26, maxAge: 30, male: 1.59, female: 1.62 },
  { minAge: 31, maxAge: 35, male: 1.92, female: 2.07 },
  { minAge: 36, maxAge: 40, male: 3.19, female: 3.73 },
  { minAge: 41, maxAge: 45, male: 4.81, female: 5.66 },
  { minAge: 46, maxAge: 50, male: 8.77, female: 7.67 },
  { minAge: 51, maxAge: 55, male: 13.81, female: 9.98 },
  { minAge: 56, maxAge: 60, male: 21.91, female: 12.99 },
  { minAge: 61, maxAge: 65, male: 36.54, female: 17.85 },
  { minAge: 66, maxAge: 70, male: 58.00, female: 26.41 },
  { minAge: 71, maxAge: 75, male: 89.17, female: 40.69 },
  { minAge: 76, maxAge: 80, male: 128.14, female: 65.47 },
  { minAge: 81, maxAge: 84, male: 149.57, female: 88.95 },
];