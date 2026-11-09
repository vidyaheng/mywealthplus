import type {
  AddInvestmentRecord,
  FrequencyChangeRecord,
  Gender,
  PausePeriodRecord,
  PaymentFrequency,
  SumInsuredReductionRecord,
  WithdrawalPlanRecord,
} from './calculations';

// Saved data is not trusted: older records may lack fields, while malformed arrays
// must never be applied over the active plan or silently coerced into empty arrays.
const MAX_ENTRIES = 200;
const MAX_AMOUNT = 1_000_000_000_000_000;
const MAX_AGE = 130;
const frequencies = ['monthly', 'quarterly', 'semi-annual', 'annual'] as const;

type PlanningData = {
  iWealthyAge: number;
  iWealthyGender: Gender;
  iWealthyPaymentFrequency: PaymentFrequency;
  iWealthyRpp: number;
  iWealthyRtu: number;
  iWealthySumInsured: number;
  iWealthyInvestmentReturn: number;
  iWealthyPausePeriods: PausePeriodRecord[];
  iWealthySumInsuredReductions: SumInsuredReductionRecord[];
  iWealthyWithdrawalPlan: WithdrawalPlanRecord[];
  iWealthyFrequencyChanges: FrequencyChangeRecord[];
  iWealthyAdditionalInvestments: AddInvestmentRecord[];
};

export type SavedIWealthyData = {
  age: number;
  gender: Gender;
  paymentFrequency: PaymentFrequency;
  rpp: number;
  rtu: number;
  sumInsured: number;
  iWealthyInvestmentReturn: number;
  iWealthyPausePeriods: PausePeriodRecord[];
  iWealthySumInsuredReductions: SumInsuredReductionRecord[];
  iWealthyWithdrawalPlan: WithdrawalPlanRecord[];
  iWealthyFrequencyChanges: FrequencyChangeRecord[];
  iWealthyAdditionalInvestments: AddInvestmentRecord[];
};

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (value: unknown, min = 0, max = MAX_AMOUNT): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const string = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 128;
const identifier = (value: unknown): boolean =>
  value === undefined || (string(value) && value.length > 0);
const inList = (value: unknown, options: readonly string[]): boolean =>
  typeof value === 'string' && options.includes(value);
const optionalNumber = (value: unknown, min = 0, max = MAX_AGE): boolean =>
  value === undefined || number(value, min, max);
const range = (row: Record<string, unknown>): boolean =>
  number(row.startAge, 0, MAX_AGE) && number(row.endAge, 0, MAX_AGE) &&
  row.startAge <= row.endAge;

function validatedArray<T>(
  parent: Record<string, unknown>,
  key: string,
  valid: (value: Record<string, unknown>) => boolean,
): T[] {
  const raw = parent[key];
  if (raw === undefined) return []; // missing on legacy records is not stale state
  if (!Array.isArray(raw) || raw.length > MAX_ENTRIES ||
      !raw.every((row: unknown) => object(row) && valid(row))) {
    throw new Error(`ข้อมูลแผน ${key} ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่บันทึกไว้`);
  }
  // A new array/object graph prevents accidental mutation of a previously loaded record.
  return raw.map((row: T) => ({ ...row }));
}

const validatePause = (row: Record<string, unknown>): boolean =>
  identifier(row.id) && range(row) && inList(row.type, ['age', 'year']) &&
  optionalNumber(row.startPolicyYear) && optionalNumber(row.endPolicyYear) &&
  (row.isAutoAdjusted === undefined || typeof row.isAutoAdjusted === 'boolean');
const validateReduction = (row: Record<string, unknown>): boolean =>
  identifier(row.id) && number(row.age, 0, MAX_AGE) && number(row.newSumInsured);
const validateWithdrawal = (row: Record<string, unknown>): boolean =>
  identifier(row.id) && inList(row.type, ['single', 'annual']) &&
  number(row.amount) && range(row) && inList(row.refType, ['age', 'year']);
const validateFrequency = (row: Record<string, unknown>): boolean =>
  identifier(row.id) && range(row) && inList(row.frequency, frequencies) &&
  (row.type === undefined || inList(row.type, ['age', 'year']));
const validateInvestment = (row: Record<string, unknown>): boolean =>
  identifier(row.id) && inList(row.type, ['single', 'annual']) &&
  number(row.amount) && range(row) &&
  (row.refType === undefined || inList(row.refType, ['age', 'year']));

export function serializeIWealthyPlan(state: PlanningData): SavedIWealthyData {
  return {
    age: state.iWealthyAge,
    gender: state.iWealthyGender,
    paymentFrequency: state.iWealthyPaymentFrequency,
    rpp: state.iWealthyRpp,
    rtu: state.iWealthyRtu,
    sumInsured: state.iWealthySumInsured,
    iWealthyInvestmentReturn: state.iWealthyInvestmentReturn,
    iWealthyPausePeriods: state.iWealthyPausePeriods,
    iWealthySumInsuredReductions: state.iWealthySumInsuredReductions,
    iWealthyWithdrawalPlan: state.iWealthyWithdrawalPlan,
    iWealthyFrequencyChanges: state.iWealthyFrequencyChanges,
    iWealthyAdditionalInvestments: state.iWealthyAdditionalInvestments,
  };
}

export function deserializeIWealthyPlan(value: unknown): PlanningData {
  if (!object(value)) throw new Error('ข้อมูลแผน iWealthy ไม่ถูกต้อง');
  if (!number(value.age, 0, MAX_AGE) || !inList(value.gender, ['male', 'female']) ||
      !inList(value.paymentFrequency, frequencies) || !number(value.rpp) ||
      !number(value.rtu) || !number(value.sumInsured)) {
    throw new Error('ข้อมูลพื้นฐานของแผน iWealthy ไม่ถูกต้อง');
  }
  // Legacy files did not save the investment return; restore the store's
  // original 5% default rather than inherit Plan A's value.
  const investmentReturn = value.iWealthyInvestmentReturn === undefined
    ? 5 : value.iWealthyInvestmentReturn;
  if (!number(investmentReturn, 0, 100)) {
    throw new Error('อัตราผลตอบแทนของแผน iWealthy ไม่ถูกต้อง');
  }
  const reductionsKey = value.iWealthySumInsuredReductions === undefined
    ? 'sumInsuredReductions' : 'iWealthySumInsuredReductions';
  return {
    iWealthyAge: value.age,
    iWealthyGender: value.gender as Gender,
    iWealthyPaymentFrequency: value.paymentFrequency as PaymentFrequency,
    iWealthyRpp: value.rpp,
    iWealthyRtu: value.rtu,
    iWealthySumInsured: value.sumInsured,
    iWealthyInvestmentReturn: investmentReturn,
    iWealthyPausePeriods: validatedArray<PausePeriodRecord>(value, 'iWealthyPausePeriods', validatePause),
    iWealthySumInsuredReductions: validatedArray<SumInsuredReductionRecord>(value, reductionsKey, validateReduction),
    iWealthyWithdrawalPlan: validatedArray<WithdrawalPlanRecord>(value, 'iWealthyWithdrawalPlan', validateWithdrawal),
    iWealthyFrequencyChanges: validatedArray<FrequencyChangeRecord>(value, 'iWealthyFrequencyChanges', validateFrequency),
    iWealthyAdditionalInvestments: validatedArray<AddInvestmentRecord>(value, 'iWealthyAdditionalInvestments', validateInvestment),
  };
}

// The old Save payload omitted four controls. Their historical values cannot
// be inferred from the record; overwriting must require explicit user consent.
export function hasMissingIWealthyControls(value: unknown): boolean {
  if (!object(value)) return true;
  return ['iWealthyPausePeriods', 'iWealthyWithdrawalPlan',
    'iWealthyFrequencyChanges', 'iWealthyAdditionalInvestments',
    'iWealthyInvestmentReturn'].some((key) => value[key] === undefined);
}
