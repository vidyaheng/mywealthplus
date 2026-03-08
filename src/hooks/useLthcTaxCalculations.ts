import type { AnnualLTHCOutputRow, LthcTaxSavingsResult, TaxSavingsBreakdown, FundingSource } from './useLthcTypes';

export function calculateLthcTaxSavings(
  illustrationData: AnnualLTHCOutputRow[],
  taxRate: number,
  initialUsedFirst100k: number,
  fundingSource: FundingSource,
  taxDeductionEndAge: number
): LthcTaxSavingsResult {
  const taxSavingsResult: LthcTaxSavingsResult = new Map();
  const rate = taxRate / 100;

  for (const row of illustrationData) {
    const savings: TaxSavingsBreakdown = { life: 0, health: 0, iWealthy: 0, pension: 0, total: 0 };

    if (row.age <= taxDeductionEndAge) {
      let usedFirst100kThisYear = initialUsedFirst100k;

      // 1. คำนวณลดหย่อน "สุขภาพ (IHU)" (สูงสุด 25,000)
      const healthPremiumPortion = row.iHealthyUltraPremium ?? 0;
      const deductibleHealth = Math.min(healthPremiumPortion, 25000);
      savings.health = deductibleHealth * rate;

      // 2. คำนวณลดหย่อน "ชีวิต (LR)" (ในโควต้า 100,000)
      const lifePremiumPortion = row.lifeReadyPremium ?? 0;
      const remainingForLife = Math.max(0, 100000 - deductibleHealth);
      const deductibleLife = Math.min(lifePremiumPortion, remainingForLife);
      savings.life = deductibleLife * rate;
      usedFirst100kThisYear += deductibleHealth + deductibleLife;

      // 3. คำนวณลดหย่อน Funding (iWealthy)
      if (fundingSource === 'iWealthy' || fundingSource === 'hybrid') {
        const iWealthyExpenses = (row.iWealthyPremiumCharge ?? 0) + (row.iWealthyCOI ?? 0) + (row.iWealthyAdminFee ?? 0);
        if (iWealthyExpenses > 0) {
          const remaining100kLimit = Math.max(0, 100000 - usedFirst100kThisYear);
          const deductibleIWealthy = Math.min(iWealthyExpenses, remaining100kLimit);
          savings.iWealthy = deductibleIWealthy * rate;
          usedFirst100kThisYear += deductibleIWealthy;
        }
      }

      // 4. คำนวณลดหย่อน Funding (Pension)
      if (fundingSource === 'pension' || fundingSource === 'hybrid') {
        const pensionPremium = row.pensionPremium ?? 0;
        if (pensionPremium > 0) {
          const pensionLimit = Math.max(0, 300000 - usedFirst100kThisYear);
          const deductiblePension = Math.min(pensionPremium, pensionLimit);
          savings.pension = deductiblePension * rate;
        }
      }
    }
    
    savings.total = savings.life + savings.health + savings.iWealthy + savings.pension;
    taxSavingsResult.set(row.policyYear, savings);
  }

  return taxSavingsResult;
}