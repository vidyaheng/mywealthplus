// src/hooks/useLthcCalculations.ts
import { useCallback } from 'react';
import {
    generateIllustrationTables,
    getSumInsuredFactor,
    //type CalculationInput as IWealthyCalculationInputOriginal, // ใช้ชื่อ Original ก่อน
    //type AnnualCalculationOutputRow as IWealthyAnnualOutputRowOriginal, // ใช้ชื่อ Original ก่อน
} from '../lib/calculations';
import {
    calculateLifeReadyPremium,
    calculateIHealthyUltraPremium,
    calculateMEBPremium,
} from '../lib/healthPlanCalculations'; // สมมติว่า healthPlanCalculations export ฟังก์ชันเหล่านี้

// Import Types จาก useLthcTypes.ts ที่เราเพิ่งแก้ไข
import type {
    Gender,
    HealthPlanSelections,       // Property iHealthyUltraPlan ของตัวนี้คือ IHealthyUltraPlanSelection
    SumInsuredReductionRecord,
    FrequencyChangeRecord,
    WithdrawalPlanRecord,
    IHealthyUltraPlan,          // <<--- Type ของชื่อแผนจริงๆ (Smart, Bronze, etc. ไม่รวม 'NONE') - **ต้องมี**
    //IHealthyUltraPlanSelection, // <<--- Type ที่รวม 'NONE' ด้วย - **Uncomment และต้องมี**
    //MEBPlan,
    //LifeReadyPaymentTerm,       // เพิ่มเข้ามาถ้า HealthPlanSelections ใช้
    AnnualLTHCOutputRow,
    AnnualHealthPremiumDetail,
    CalculationInput,           // ควรจะ import มาจาก useLthcTypes ถ้ามีการ re-export ที่นั่น
    IWealthyAnnualOutputRow,    // ควรจะ import มาจาก useLthcTypes ถ้ามีการ re-export ที่นั่น
} from './useLthcTypes';

// ค่าคงที่ (อาจจะ import มาจาก useLthcTypes.ts หรือ constants.ts)
const MINIMUM_ALLOWABLE_SYSTEM_RPP = 18000;
const MAX_POLICY_AGE = 98; // อายุสูงสุดที่คำนวณถึง (จ่ายเบี้ยปี 98 คุ้มครองถึง 99)
const MEB_TERMINATION_AGE = 74; // อายุจ่ายเบี้ย MEB ปีสุดท้าย

const roundUpToNearestThousand = (num: number): number => {
    if (num <= 0) return 0; // ถ้าเป็น 0 หรือติดลบ ก็ให้เป็น 0
    return Math.ceil(num / 1000) * 1000;
};

// ประเภทสำหรับข้อมูลเบี้ยสุขภาพรายปีภายใน Hook นี้
//interface AnnualHealthPremiumDetail {
//    year: number;
//    age: number;
//    lrPrem: number;
//    ihuPrem: number;
//    mebPrem: number;
//    totalPremium: number;
//}

interface OptimalRppResult {
    solvedTotalPremium: number | null; // เบี้ยรวม iWealthy ที่ต่ำที่สุดที่ Solver หาได้ (บนฐาน RPP 100% หรือตาม Ratio)
    solvedRpp: number | null;          // ส่วน RPP ของ solvedTotalPremium
    solvedRtu: number | null;          // ส่วน RTU ของ solvedTotalPremium
    finalIllustrationData?: IWealthyAnnualOutputRow[]; // ผลลัพธ์ iWealthy จากเบี้ยที่ดีที่สุด
    errorMessage?: string;             // ข้อความ Error ถ้า Solver ไม่สำเร็จ
}

export const useLthcCalculations = () => {

    // 1. คำนวณเบี้ยสุขภาพรายปี
    const calculateAllHealthPremiums = useCallback((
        entryAge: number,
        gender: Gender,
        plans: HealthPlanSelections
    ): AnnualHealthPremiumDetail[] => {
        const premiums: AnnualHealthPremiumDetail[] = [];
        for (let policyYear = 1; entryAge + policyYear - 1 <= MAX_POLICY_AGE + 1; policyYear++) { // เผื่อปีที่อายุ 99
            const attainedAge = entryAge + policyYear - 1;
            if (attainedAge > 99) break; // ไม่คำนวณเกินอายุ 99

            // คำนวณเบี้ย LifeReady
            let lrPremium = 0;
            if (plans.lifeReadyPPT === 99) { // จ่ายถึง 99
                if (attainedAge <= MAX_POLICY_AGE && entryAge <= 80) { // เบี้ยปีสุดท้ายที่อายุ 98 (ถ้าเข้าก่อน 80)
                    lrPremium = calculateLifeReadyPremium(entryAge, gender, plans.lifeReadySA, plans.lifeReadyPPT);
                }
            } else { // จ่ายตาม Term (6, 12, 18)
                if (policyYear <= plans.lifeReadyPPT && entryAge <= 70) {
                    lrPremium = calculateLifeReadyPremium(entryAge, gender, plans.lifeReadySA, plans.lifeReadyPPT);
                }
            }

            // คำนวณเบี้ย iHealthy Ultra (สมมติต่ออายุถึง MAX_POLICY_AGE)
            let ihuPremium = 0;
            // ตรวจสอบว่ามีการเลือกแผน IHU (ไม่ใช่ 'NONE') และยังอยู่ในช่วงอายุที่คำนวณเบี้ย
            if (plans.iHealthyUltraPlan !== 'NONE' && attainedAge <= MAX_POLICY_AGE) { // <--- ใช้ MAX_POLICY_AGE_TYPE
                ihuPremium = calculateIHealthyUltraPremium(
                    attainedAge,
                    gender,
                    plans.iHealthyUltraPlan as IHealthyUltraPlan // Cast เป็น IHealthyUltraPlan (ที่ไม่มี 'NONE')
                                                              // เพราะเราได้ตรวจสอบแล้วว่าไม่ใช่ 'NONE'
                );
            }

            // คำนวณเบี้ย MEB (จ่ายจนถึงอายุ MEB_TERMINATION_AGE)
            let mebPremium = 0;
            // ... (Logic คำนวณ mebPremium เหมือนเดิม - ตรวจสอบว่า plans.mebPlan ไม่ใช่ค่า "ไม่เลือก" เช่น 0)
            if (plans.mebPlan !== 0 && attainedAge <= MEB_TERMINATION_AGE) { // สมมติ 0 คือไม่เลือก MEB
                mebPremium = calculateMEBPremium(attainedAge, plans.mebPlan);
            }
            premiums.push({
                year: policyYear,
                age: attainedAge,
                lrPrem: lrPremium,
                ihuPrem: ihuPremium,
                mebPrem: mebPremium,
                totalPremium: lrPremium + ihuPremium + mebPremium,
            });
        }
        return premiums;
    }, []); // Dependencies: calculateLifeReadyPremium, etc. ถ้ามันมาจาก context หรือ prop ของ hook นี้

    // 2. สร้างการลดทุนประกันอัตโนมัติ
    const generateSAReductionsForIWealthy = useCallback((entryAge: number, rpp: number): SumInsuredReductionRecord[] => {
        const reductions: SumInsuredReductionRecord[] = [];
        if (rpp <= 0) return reductions;

        const getFactorForMilestone = (milestoneAge: number, currentEntryAge: number): number => {
            if (milestoneAge === currentEntryAge + 1) { // ปีที่ 2
                if (currentEntryAge <= 40) return 40;
                if (currentEntryAge <= 50) return 30;
                if (currentEntryAge <= 60) return 20;
                if (currentEntryAge <= 65) return 15;
                return 5;
            }
            if (milestoneAge === 41) return 30;
            if (milestoneAge === 51) return 20;
            if (milestoneAge === 61) return 15;
            if (milestoneAge === 66) return 5;
            return 0; // ไม่ใช่ milestone ที่รู้จัก
        };

        const milestones = [entryAge + 1, 41, 51, 61, 66];
        const reductionMap = new Map<number, number>();

        milestones.forEach(milestoneAge => {
            if (milestoneAge > entryAge && milestoneAge <= MAX_POLICY_AGE) {
                const factor = getFactorForMilestone(milestoneAge, entryAge);
                if (factor > 0) {
                    const newSA = Math.round(rpp * factor);
                    if (!reductionMap.has(milestoneAge) || newSA < (reductionMap.get(milestoneAge) ?? Infinity)) {
                        reductionMap.set(milestoneAge, newSA);
                    }
                }
            }
        });
        reductionMap.forEach((newSumInsured, age) => {
            reductions.push({ age, newSumInsured });
        });
        return reductions.sort((a, b) => a.age - b.age);
    }, []);

    // 3. ฟังก์ชันตรวจสอบความเพียงพอของกรมธรรม์ (Solvency Check)
   const checkIWealthySolvency = useCallback((
        iWealthyAnnualData: IWealthyAnnualOutputRow[] | undefined,
        plannedWithdrawals: WithdrawalPlanRecord[],
        //entryAge: number // เปลี่ยน _entryAge เป็น entryAge เพื่อความชัดเจน (ถ้ายังจำเป็น)
    ): boolean => {
        if (!iWealthyAnnualData || iWealthyAnnualData.length === 0) {
            // console.warn("[checkIWealthySolvency] No iWealthy annual data or empty.");
            return false;
        }

        const MINIMUM_REQUIRED_VALUE = 500000; // <--- มูลค่าขั้นต่ำที่ต้องการ
        const START_AGE_FOR_MINIMUM_VALUE_CHECK = 65; // <--- อายุที่เริ่มตรวจสอบมูลค่าขั้นต่ำนี้
        const EXPECTED_LAST_POLICY_AGE = MAX_POLICY_AGE; // เช่น 98, อายุสุดท้ายที่กรมธรรม์ควรจะยัง active

        // 1. ตรวจสอบว่ากรมธรรม์คำนวณได้ถึงอายุที่คาดหวังหรือไม่
        const lastYearData = iWealthyAnnualData[iWealthyAnnualData.length - 1];
        if (lastYearData.age < EXPECTED_LAST_POLICY_AGE) {
            // ถ้าจบก่อนอายุเป้าหมาย และมูลค่าเหลือน้อยมาก (แสดงว่าเงินหมดก่อน) -> ไม่ผ่าน
            if ((lastYearData.eoyAccountValue ?? -1) < 1.00) {
                // console.warn(`[checkIWealthySolvency] Fail: Policy ended prematurely at age ${lastYearData.age} with low/zero AV.`);
                return false;
            }
            // ถ้าจบก่อนแต่เงินยังเหลือเยอะ อาจจะยังไม่ fail ทันที แต่ถ้า Solver ควรจะดันให้ถึงอายุเป้าหมาย
            // การ return false ตรงนี้เลยจะบังคับให้ Solver หา RPP ที่สูงขึ้นเพื่อให้ถึงอายุเป้าหมาย
            // console.warn(`[checkIWealthySolvency] Fail: Policy did not reach expected age ${EXPECTED_LAST_POLICY_AGE}. Ended at ${lastYearData.age}.`);
            return false;
        }

        const withdrawalMap = new Map<number, number>();
        plannedWithdrawals.forEach(wd => {
            if (wd.type === 'annual' && wd.amount > 0) {
                withdrawalMap.set(wd.startAge, (withdrawalMap.get(wd.startAge) || 0) + wd.amount);
            }
        });

        for (const row of iWealthyAnnualData) {
            // 2. ตรวจสอบมูลค่าบัญชีสิ้นปีไม่ติดลบ (ยังคงสำคัญ)
            if ((row.eoyAccountValue ?? -1) < -0.005) { // ยอมรับค่า error เล็กน้อย
                // console.warn(`[checkIWealthySolvency] Fail: Negative EOY Account Value at age ${row.age} (${row.eoyAccountValue?.toFixed(2)})`);
                return false;
            }

            // 3. ตรวจสอบว่าการถอนเงินจริงตรงกับแผนหรือไม่ (ถ้าปีนั้นมีแผนจะถอน)
            const plannedAmountForYear = withdrawalMap.get(row.age);
            if (plannedAmountForYear && plannedAmountForYear > 0) {
                const actualWithdrawal = row.withdrawalYear || 0;
                // ถ้าถอนได้น้อยกว่าแผน และมูลค่าสิ้นปีก็ต่ำมาก (แสดงว่าเงินอาจจะหมดจริงๆ)
                if (actualWithdrawal < (plannedAmountForYear * 0.999) && (row.eoyAccountValue ?? 0) < 1.00) {
                    // console.warn(`[checkIWealthySolvency] Fail: Insufficient funds for withdrawal at age ${row.age}. Planned: ${plannedAmountForYear.toFixed(2)}, Actual: ${actualWithdrawal.toFixed(2)}, EOY AV: ${row.eoyAccountValue?.toFixed(2)}`);
                    return false;
                }
            }

            // 4. ⭐ ตรวจสอบมูลค่าขั้นต่ำหลังจากอายุที่กำหนด (เงื่อนไขใหม่) ⭐
            if (row.age >= START_AGE_FOR_MINIMUM_VALUE_CHECK) {
                if ((row.eoyAccountValue ?? -1) < MINIMUM_REQUIRED_VALUE) {
                    // console.warn(`[checkIWealthySolvency] Fail: EOY AV at age ${row.age} (${row.eoyAccountValue?.toFixed(2)}) is below minimum required ${MINIMUM_REQUIRED_VALUE}`);
                    return false;
                }
            }
        }

        // 5. ตรวจสอบมูลค่า ณ ปีสุดท้ายอีกครั้ง (ถ้าผ่าน loop มาได้)
        //    (เงื่อนไขนี้จะซ้ำกับข้อ 4 ถ้า EXPECTED_LAST_POLICY_AGE >= START_AGE_FOR_MINIMUM_VALUE_CHECK)
        //    แต่เป็นการยืนยัน
        if (lastYearData.age >= EXPECTED_LAST_POLICY_AGE) { // ตรวจสอบเมื่อถึงอายุเป้าหมายจริงๆ
            if ((lastYearData.eoyAccountValue ?? -1) < MINIMUM_REQUIRED_VALUE && lastYearData.age >= START_AGE_FOR_MINIMUM_VALUE_CHECK) {
                // console.warn(`[checkIWealthySolvency] Fail: Final EOY AV at age ${lastYearData.age} (${lastYearData.eoyAccountValue?.toFixed(2)}) is below minimum ${MINIMUM_REQUIRED_VALUE}`);
                return false;
            }
            // ถ้าอายุสุดท้ายที่คำนวณได้ < START_AGE_FOR_MINIMUM_VALUE_CHECK แต่กรมธรรม์ยัง Active
            // อาจจะไม่ต้องเช็ค MINIMUM_REQUIRED_VALUE นี้ แต่ Solver ควรจะพยายามดันให้ถึง START_AGE_FOR_MINIMUM_VALUE_CHECK ก่อน
        }


        // console.log("[checkIWealthySolvency] Pass: All checks passed.");
        return true;
    }, []); // Dependency array ว่าง เพราะรับทุกอย่างผ่าน arguments และไม่ได้ใช้ state/prop ของ hook โดยตรง

    // 4. ฟังก์ชันประมวลผลผลลัพธ์เพื่อสร้าง Output สำหรับ LTHC Planner
    const processIWealthyResultsToLTHC = useCallback((
        healthPremiums: AnnualHealthPremiumDetail[],
        iWealthyAnnualData: IWealthyAnnualOutputRow[] | undefined,
        currentSelectedHealthPlans: HealthPlanSelections,
        iWealthyInitialSA: number,
        iWealthyReductions: SumInsuredReductionRecord[]
    ): AnnualLTHCOutputRow[] => {
        const illustration: AnnualLTHCOutputRow[] = [];
        if (!iWealthyAnnualData) return illustration;

        let currentActualIWealthySA = iWealthyInitialSA;
        for (const healthEntry of healthPremiums) {
            if (healthEntry.age > 99) break; // ให้สอดคล้องกับ Output ที่ต้องการ (อาจจะ MAX_POLICY_AGE + 1)
            const iWealthyYearData = iWealthyAnnualData.find(iw => iw.policyYear === healthEntry.year);

            const applicableReductions = iWealthyReductions.filter(r => r.age <= healthEntry.age);
            if (applicableReductions.length > 0) {
                currentActualIWealthySA = applicableReductions[applicableReductions.length - 1].newSumInsured;
            } else if (healthEntry.year === 1) {
                currentActualIWealthySA = iWealthyInitialSA;
            }

            illustration.push({
                policyYear: healthEntry.year, age: healthEntry.age,
                lifeReadyPremium: healthEntry.lrPrem,
                lifeReadyDeathBenefit: currentSelectedHealthPlans.lifeReadySA,
                iHealthyUltraPremium: healthEntry.ihuPrem,
                mebPremium: healthEntry.mebPrem,
                totalHealthPremium: healthEntry.totalPremium,
                iWealthyRpp: iWealthyYearData?.premiumRPPYear,
                iWealthyRtu: iWealthyYearData?.premiumRTUYear,
                iWealthyTotalPremium: iWealthyYearData?.totalPremiumYear,
                iWealthyWithdrawal: iWealthyYearData?.withdrawalYear,
                iWealthyEoyAccountValue: iWealthyYearData?.eoyAccountValue,
                iWealthyEoyDeathBenefit: iWealthyYearData?.eoyDeathBenefit,
                iWealthySumAssured: currentActualIWealthySA,
                iWealthyPremChargeRPP: iWealthyYearData?.premiumChargeRPPYear,
                iWealthyPremChargeRTU: iWealthyYearData?.premiumChargeRTUYear,
                iWealthyPremChargeTotal: iWealthyYearData?.totalPremiumChargeYear,
                iWealthyCOI: iWealthyYearData?.totalCOIYear,
                iWealthyAdminFee: iWealthyYearData?.totalAdminFeeYear,
                iWealthyTotalFees: iWealthyYearData?.totalFeesYear,
                iWealthyInvestmentBase: iWealthyYearData?.investmentBaseYear,
                iWealthyInvestmentReturn: iWealthyYearData?.investmentReturnYear,
                iWealthyRoyaltyBonus: iWealthyYearData?.royaltyBonusYear,
                iWealthyEOYCSV: iWealthyYearData?.eoyCashSurrenderValue,
                totalCombinedDeathBenefit: (iWealthyYearData?.eoyDeathBenefit ?? 0) + currentSelectedHealthPlans.lifeReadySA,
            });
        }
        return illustration;
    }, []);


    // 5. ฟังก์ชัน Solver สำหรับ Automatic Mode (Heuristic + Binary Search)
    const findOptimalIWealthyPremium = useCallback(async (
    entryAge: number,
    gender: Gender,
    allHealthPremiums: AnnualHealthPremiumDetail[],
    iWealthyPPT: number,
    investmentReturnRate: number,
    targetRppRtuRatio: string // เช่น '80/20', '100/0'
): Promise<OptimalRppResult> => { // OptimalRppResult type ควรมี solvedTotalPremium

    const [rppPercStr, rtuPercStr] = targetRppRtuRatio.split('/');
    const rppRatio = parseFloat(rppPercStr) / 100;
    const rtuRatio = parseFloat(rtuPercStr) / 100;

    let totalExpectedWithdrawal = 0;
    const withdrawalPlanAuto: WithdrawalPlanRecord[] = [];
    let autoWithdrawalStartAgeDetermined = 61;
    const iWealthyPTTEndAge = entryAge + iWealthyPPT - 1;
    if (iWealthyPTTEndAge >= 61) autoWithdrawalStartAgeDetermined = iWealthyPTTEndAge + 1;

    allHealthPremiums.forEach(hp => {
        if (hp.age >= autoWithdrawalStartAgeDetermined && hp.age <= MAX_POLICY_AGE && hp.totalPremium > 0) {
            totalExpectedWithdrawal += hp.totalPremium;
            withdrawalPlanAuto.push({ id: `wd-a-${hp.age}-${targetRppRtuRatio.replace('/', '')}`, type: 'annual', amount: hp.totalPremium, startAge: hp.age, endAge: hp.age, refType: 'age' });
        }
    });

    const frequencyChangesAuto: FrequencyChangeRecord[] = [{ id: `lthc-a-mth-y2-${targetRppRtuRatio.replace('/', '')}`, startAge: entryAge + 1, endAge: MAX_POLICY_AGE, frequency: 'monthly', type: 'age' }];

    // ---- Heuristic Phase (หา "Total Premium" ที่ "น่าจะ" ผ่าน) ----
    let totalPremiumThatWorksHeuristic: number | null = null;
    let divisor = 3.0;
    const divisorStepDown = 0.1;
    const minDivisor = 0.5; // อาจจะต้องปรับตาม %ผลตอบแทน
    const maxHeuristicIterations = 30;

    for (let i = 0; i < maxHeuristicIterations; i++) {
        let totalPremiumTrial = (totalExpectedWithdrawal / Math.max(divisor, 0.01)) / Math.max(iWealthyPPT, 1);
        
        // คำนวณ RPP part จาก Total Premium Trial เพื่อเช็คขั้นต่ำ
        let rppPartForCheck = Math.round(totalPremiumTrial * rppRatio);
        if (rppRatio > 0 && rppPartForCheck < MINIMUM_ALLOWABLE_SYSTEM_RPP) {
            // ถ้า RPP part ต่ำกว่าขั้นต่ำ ให้ปรับ Total Premium ขึ้นเพื่อให้ RPP part เท่าขั้นต่ำ
            totalPremiumTrial = MINIMUM_ALLOWABLE_SYSTEM_RPP / rppRatio;
        } else if (rppRatio === 0 && totalPremiumTrial > 0) { // กรณี RTU 100% (ไม่มี RPP)
             // ถ้าไม่มี RPP แต่มีเบี้ยรวม (RTU) ก็ยังต้องมี RPP ขั้นต่ำสมมติสำหรับคำนวณ SA/COI
             // หรืออาจจะกำหนดว่า SA เป็น 0 ถ้าไม่มี RPP (ขึ้นกับ business logic)
             // เพื่อความง่าย จะยังคง logic เดิมที่ COI จะน้อยมากถ้า RPP ต่ำ
        }
        totalPremiumTrial = Math.max(totalPremiumTrial, MINIMUM_ALLOWABLE_SYSTEM_RPP); // เบี้ยรวมอย่างน้อยต้องเท่า RPP ขั้นต่ำ
        totalPremiumTrial = Math.ceil(totalPremiumTrial / 100) * 100;

        const rppTrialForSolver = Math.round(totalPremiumTrial * rppRatio);
        const rtuTrialForSolver = Math.round(totalPremiumTrial * rtuRatio);

        // ตรวจสอบอีกครั้งว่า rppTrialForSolver ไม่ต่ำกว่าขั้นต่ำ (หลังการปัดเศษ)
        if (rppRatio > 0 && rppTrialForSolver < MINIMUM_ALLOWABLE_SYSTEM_RPP) {
             // ควรจะเกิดขึ้นได้ยากถ้า logic ด้านบนถูกต้อง
            // console.warn("Heuristic: RPP part became too low after rounding, adjusting divisor.");
            divisor -= divisorStepDown;
            if (divisor < minDivisor) break;
            continue;
        }


        const initialSATrial = Math.round(getSumInsuredFactor(entryAge) * rppTrialForSolver); // SA อิงจาก RPP part
        const sumInsuredReductionsTrial = generateSAReductionsForIWealthy(entryAge, rppTrialForSolver);

        const inputTrial: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender,
            initialPaymentFrequency: 'annual', initialSumInsured: initialSATrial,
            rppPerYear: rppTrialForSolver, rtuPerYear: rtuTrialForSolver, // ใช้ RPP/RTU ที่แบ่งตามสัดส่วน
            assumedInvestmentReturnRate: investmentReturnRate / 100,
            premiumPayingTermYears: iWealthyPPT,
            pausePeriods: [], sumInsuredReductions: sumInsuredReductionsTrial,
            additionalInvestments: [], frequencyChanges: frequencyChangesAuto,
            withdrawalPlan: withdrawalPlanAuto,
        };
        try {
            const result = await generateIllustrationTables(inputTrial);
            if (checkIWealthySolvency(result.annual, withdrawalPlanAuto)) {
                totalPremiumThatWorksHeuristic = totalPremiumTrial;
                break;
            } else {
                divisor -= divisorStepDown; if (divisor < minDivisor) break;
            }
        } catch (e) { divisor -= divisorStepDown; if (divisor < minDivisor) break; }
    }

    if (!totalPremiumThatWorksHeuristic) {
        return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: `Heuristic failed (Ratio: ${targetRppRtuRatio})` };
    }

    // ---- Binary Search Phase (หา "Total Premium" ต่ำสุด) ----
    let searchHighTotalPremium = totalPremiumThatWorksHeuristic;
    let searchLowTotalPremium = rppRatio > 0 ? Math.ceil((MINIMUM_ALLOWABLE_SYSTEM_RPP / rppRatio) / 100) * 100 : MINIMUM_ALLOWABLE_SYSTEM_RPP;
    searchLowTotalPremium = Math.max(searchLowTotalPremium, MINIMUM_ALLOWABLE_SYSTEM_RPP);

    let minViableTotalPremium = searchHighTotalPremium;
    const binarySearchIterations = 20; const tolerance = 100;

    for (let i = 0; i < binarySearchIterations && (searchHighTotalPremium - searchLowTotalPremium > tolerance); i++) {
        let midTotalPremium = Math.max(searchLowTotalPremium, Math.floor((searchLowTotalPremium + searchHighTotalPremium) / 2 / 100) * 100);
        // ... (Logic ปรับ midTotalPremium เพื่อไม่ให้ติด loop เหมือนเดิม) ...
        if (midTotalPremium >= searchHighTotalPremium && searchHighTotalPremium > searchLowTotalPremium + tolerance) midTotalPremium = searchHighTotalPremium - tolerance;
        else if (midTotalPremium <= searchLowTotalPremium && searchLowTotalPremium < searchHighTotalPremium - tolerance) midTotalPremium = searchLowTotalPremium + tolerance;
        if (midTotalPremium === searchLowTotalPremium && midTotalPremium === searchHighTotalPremium && searchHighTotalPremium - searchLowTotalPremium > tolerance) break;
        else if (midTotalPremium === searchLowTotalPremium && midTotalPremium === searchHighTotalPremium) break;

        const rppForBinary = Math.round(midTotalPremium * rppRatio);
        const rtuForBinary = Math.round(midTotalPremium * rtuRatio);

        if (rppRatio > 0 && rppForBinary < MINIMUM_ALLOWABLE_SYSTEM_RPP) {
            searchLowTotalPremium = midTotalPremium; // midTotalPremium นี้ต่ำไป (ทำให้ RPP ต่ำไป)
            continue;
        }

        const initialSAMid = Math.round(getSumInsuredFactor(entryAge) * rppForBinary);
        const saReductionsMid = generateSAReductionsForIWealthy(entryAge, rppForBinary);
        const inputMid: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender,
            initialPaymentFrequency: 'annual', initialSumInsured: initialSAMid,
            rppPerYear: rppForBinary, rtuPerYear: rtuForBinary,
            assumedInvestmentReturnRate: investmentReturnRate / 100,
            premiumPayingTermYears: iWealthyPPT,
            pausePeriods: [], sumInsuredReductions: saReductionsMid,
            additionalInvestments: [], frequencyChanges: frequencyChangesAuto,
            withdrawalPlan: withdrawalPlanAuto,
        };
        let isSolvent = false;
        try {
            const resultMid = await generateIllustrationTables(inputMid);
            isSolvent = checkIWealthySolvency(resultMid.annual, withdrawalPlanAuto);
        } catch (e) { isSolvent = false; }

        if (isSolvent) { searchHighTotalPremium = midTotalPremium; minViableTotalPremium = midTotalPremium; }
        else { searchLowTotalPremium = midTotalPremium; }
    }
    
    // minViableTotalPremium คือเบี้ยรวมที่ต่ำที่สุดที่ Solver หาได้สำหรับ Ratio ที่กำหนด
    const finalRppResult = roundUpToNearestThousand(minViableTotalPremium * rppRatio);
    const finalRtuResult = roundUpToNearestThousand(minViableTotalPremium * rtuRatio);

    // ตรวจสอบ RPP ขั้นต่ำครั้งสุดท้าย
    if (rppRatio > 0 && finalRppResult < MINIMUM_ALLOWABLE_SYSTEM_RPP) {
        return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: `Calculated RPP (${finalRppResult}) for ratio ${targetRppRtuRatio} is below minimum after solver.` };
    }

    // คำนวณครั้งสุดท้ายด้วย RPP/RTU ที่ได้ เพื่อให้ได้ illustration ที่ถูกต้อง
    const finalInitialSA = Math.round(getSumInsuredFactor(entryAge) * finalRppResult);
    const finalSaReductions = generateSAReductionsForIWealthy(entryAge, finalRppResult);
    const finalInputForIllustration: CalculationInput = {
        policyholderAge: entryAge, policyholderGender: gender, initialPaymentFrequency: 'annual', initialSumInsured: finalInitialSA,
        rppPerYear: finalRppResult, rtuPerYear: finalRtuResult, assumedInvestmentReturnRate: investmentReturnRate / 100,
        premiumPayingTermYears: iWealthyPPT, pausePeriods: [], sumInsuredReductions: finalSaReductions,
        additionalInvestments: [], frequencyChanges: frequencyChangesAuto, withdrawalPlan: withdrawalPlanAuto,
    };
    try {
        const finalIWealthyResult = await generateIllustrationTables(finalInputForIllustration);
        // ตรวจสอบ solvency อีกครั้งด้วยค่าที่แบ่ง RPP/RTU แล้วจริงๆ
        if (checkIWealthySolvency(finalIWealthyResult.annual, withdrawalPlanAuto)) {
            return {
                solvedTotalPremium: finalRppResult + finalRtuResult,
                solvedRpp: finalRppResult,
                solvedRtu: finalRtuResult,
                finalIllustrationData: finalIWealthyResult.annual,
            };
        } else {
            return { solvedTotalPremium: minViableTotalPremium, solvedRpp: finalRppResult, solvedRtu: finalRtuResult, errorMessage: `Final check with RPP/RTU ratio ${targetRppRtuRatio} failed solvency. Try increasing investment return or PPT.` };
        }
    } catch (error) {
         return { solvedTotalPremium: null, solvedRpp: null, solvedRtu: null, errorMessage: error instanceof Error ? error.message : "Error in final solver calculation step." };
    }
}, [generateSAReductionsForIWealthy, checkIWealthySolvency]); // Dependencies



    // ฟังก์ชันที่ `useLthcPlanner` จะเรียกใช้
    const calculateManualPlan = useCallback(async (
        entryAge: number, gender: Gender, plans: HealthPlanSelections,
        rpp: number, rtu: number, invReturn: number, ppt: number, withdrawalStartAge: number
    ): Promise<AnnualLTHCOutputRow[]> => {
        const rppActual = Math.max(rpp, MINIMUM_ALLOWABLE_SYSTEM_RPP);
        const allHealthPremiumsData = calculateAllHealthPremiums(entryAge, gender, plans);
        
        const withdrawalPlan: WithdrawalPlanRecord[] = allHealthPremiumsData
            .filter(p => p.age >= withdrawalStartAge && p.age <= MAX_POLICY_AGE && p.totalPremium > 0)
            .map(p => ({
                id: `wd-m-${p.age}`, type: 'annual', amount: p.totalPremium,
                startAge: p.age, endAge: p.age, refType: 'age'
            }));

        const sumInsuredReductions = generateSAReductionsForIWealthy(entryAge, rppActual);
        const frequencyChanges: FrequencyChangeRecord[] = [{
            id: 'lthc-m-mth-y2', startAge: entryAge + 1, endAge: MAX_POLICY_AGE,
            frequency: 'monthly', type: 'age'
        }];
        const initialSA = Math.round(getSumInsuredFactor(entryAge) * rppActual);

        const input: CalculationInput = {
            policyholderAge: entryAge, policyholderGender: gender,
            initialPaymentFrequency: 'annual', initialSumInsured: initialSA,
            rppPerYear: rppActual, rtuPerYear: rtu,
            assumedInvestmentReturnRate: invReturn / 100,
            premiumPayingTermYears: ppt,
            pausePeriods: [], sumInsuredReductions: sumInsuredReductions,
            additionalInvestments: [], frequencyChanges: frequencyChanges,
            withdrawalPlan: withdrawalPlan,
        };
        const iWealthyResult = await generateIllustrationTables(input);
        return processIWealthyResultsToLTHC(allHealthPremiumsData, iWealthyResult.annual, plans, initialSA, sumInsuredReductions);
    }, [calculateAllHealthPremiums, generateSAReductionsForIWealthy, processIWealthyResultsToLTHC]);


    const calculateAutomaticPlan = useCallback(async (
        entryAge: number, gender: Gender, plans: HealthPlanSelections,
        invReturn: number, currentAutoPPT: number, currentRppRtuRatio: string
    ): Promise<{
        outputIllustration: AnnualLTHCOutputRow[] | null;
        minPremiumResult: number | null;
        rppResult: number | null;
        rtuResult: number | null;
        errorMsg?: string;
    }> => {
        const allHealthPremiumsData = calculateAllHealthPremiums(entryAge, gender, plans);
        
        const solverResult = await findOptimalIWealthyPremium(
            entryAge, gender, allHealthPremiumsData, currentAutoPPT, invReturn, currentRppRtuRatio // ส่ง targetRppRtuRatio เข้าไป
        );

        if (solverResult.solvedTotalPremium !== null && solverResult.finalIllustrationData) {
            const processedOutput = processIWealthyResultsToLTHC(
                allHealthPremiumsData,
                solverResult.finalIllustrationData,
                plans,
                Math.round(getSumInsuredFactor(entryAge) * (solverResult.solvedRpp || 0)), // Initial SA for final display
                generateSAReductionsForIWealthy(entryAge, (solverResult.solvedRpp || 0))
            );
            return {
                outputIllustration: processedOutput,
                minPremiumResult: solverResult.solvedTotalPremium,
                rppResult: solverResult.solvedRpp,
                rtuResult: solverResult.solvedRtu,
            };
        } else {
            return {
                outputIllustration: null,
                minPremiumResult: null,
                rppResult: null,
                rtuResult: null,
                errorMsg: solverResult.errorMessage || "Automatic calculation failed to find a solution.",
            };
        }
    }, [calculateAllHealthPremiums, findOptimalIWealthyPremium, processIWealthyResultsToLTHC, generateSAReductionsForIWealthy]);


    return {
        calculateHealthPremiums: calculateAllHealthPremiums, // เปลี่ยนชื่อ export ให้สอดคล้อง
        generateSAReductions: generateSAReductionsForIWealthy, // เปลี่ยนชื่อ export ให้สอดคล้อง
        calculateManualPlan,     // Export ฟังก์ชันที่ปรับปรุงแล้ว
        calculateAutomaticPlan,  // Export ฟังก์ชันที่ปรับปรุงแล้ว
    };
};