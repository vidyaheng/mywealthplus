import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { AnnualLTHCOutputRow, LthcTaxSavingsResult } from '../../hooks/useLthcTypes';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { calculateLthcTaxSavings } from '../../hooks/useLthcTaxCalculations';
import TaxModal from '@/components/custom/TaxModal';

// Helper function to format numbers
const formatNum = (value: number | undefined | null, digits = 0) => {
    if (value === undefined || value === null || isNaN(value)) return '-';
    return Math.round(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};

export default function LthcTablePage({ isReportMode }: { isReportMode?: boolean }) {
    // --- ส่วนของ Hooks และ Logic คำนวณ ---
    const {
        result, isLoading, error,
        selectedHealthPlans, fundingSource,
        pensionFundingOptions,
        isTaxDeductionEnabled,
        isTaxModalOpen,
        taxRate,
        usedFirst100k,
        taxDeductionEndAge,
        handleTaxButtonClick,
        setTaxInputs,
        closeTaxModal
    } = useAppStore();

    const [isHealthDetailsExpanded, setIsHealthDetailsExpanded] = useState<boolean>(false);
    const [isIWealthyPremiumExpanded, setIsIWealthyPremiumExpanded] = useState<boolean>(false);
    const [isTotalDbExpanded, setIsTotalDbExpanded] = useState<boolean>(false);
    const [showFullPensionTerm, setShowFullPensionTerm] = useState<boolean>(false);
    // 💡 [FIXED] สถานะการขยายเบี้ย Hybrid
    const [isHybridPremiumExpanded, setIsHybridPremiumExpanded] = useState<boolean>(false);
    // 💡 [FIXED] สถานะการขยายมูลค่าเวนคืนรวม
    const [isTotalCsvExpanded, setIsTotalCsvExpanded] = useState<boolean>(false);

    
    const getPlanDisplayName = (source: 'health' | 'lthc') => {
        const ihuDisplay = selectedHealthPlans.iHealthyUltraPlan ? `iHealthy Ultra (${selectedHealthPlans.iHealthyUltraPlan})` : "แผนสุขภาพ";
        if (source === 'health') {
            return ihuDisplay;
        }

        let fundingDisplayName = '';
        switch(fundingSource) {
            case 'iWealthy':
                fundingDisplayName = '+ iWealthy';
                break;
            case 'pension':
                const pensionPlanName = pensionFundingOptions.planType === 'pension8' ? 'บำนาญ 8' : 'บำนาญ 60';
                fundingDisplayName = `+ ${pensionPlanName}`;
                break;
            case 'hybrid':
                const hybridPensionName = pensionFundingOptions.planType === 'pension8' ? 'บำนาญ 8' : 'บำนาญ 60';
                fundingDisplayName = `+ iWealthy + ${hybridPensionName}`;
                break;
        }
        return `แผนสุขภาพ LTHC - ${ihuDisplay} ${fundingDisplayName}`;
    };
    
    const displayedResult = useMemo(() => {
        if (!result) return [];
        
        if (fundingSource === 'pension' && !showFullPensionTerm) {
            return result.filter(row => row.age <= 88);
        }

        return result;
    }, [result, fundingSource, showFullPensionTerm]);

    const taxSavingsData: LthcTaxSavingsResult | null = useMemo(() => {
    if (!result || !isTaxDeductionEnabled) return null;
    
    // 🎨 3. ส่ง taxDeductionEndAge เข้าไปเป็นพารามิเตอร์สุดท้าย
    return calculateLthcTaxSavings(result, taxRate, usedFirst100k, fundingSource, taxDeductionEndAge);

}, [result, isTaxDeductionEnabled, taxRate, usedFirst100k, fundingSource, taxDeductionEndAge]); // 🎨 เพิ่ม taxDeductionEndAge ใน dependency array

    const summaryValues = useMemo(() => {
        if (!displayedResult || displayedResult.length === 0) return null;

        let totalHealthPremiumIfPaidAlone = 0;
        let lthcHealthPremiumPaidByUser = 0;
        let lthcTotalFundingPremium = 0;
        
        // 🎨 ผลประโยชน์ฝั่งสุขภาพอย่างเดียว
        const lifeReadyMaturityBenefit = selectedHealthPlans.lifeReadySA || 150000;
        
        // 🎨 ผลประโยชน์ฝั่ง LTHC
        let lthcFundingBenefits = 0;

        displayedResult.forEach(row => {
            totalHealthPremiumIfPaidAlone += row.totalHealthPremium || 0;
            
            // Logic: ตรวจสอบว่ามีเงินไหลออกมาจาก Funding (iW/บำนาญ) หรือไม่
            const isFundingActiveThisYear = (row.iWealthyWithdrawal ?? 0) > 0 || (row.pensionPayout ?? 0) > 0;

            if (!isFundingActiveThisYear) {
                // ถ้า Funding ไม่ active (ก่อนเริ่ม หรือหลังหมด) ผู้ใช้ต้องจ่ายเอง
                lthcHealthPremiumPaidByUser += row.totalHealthPremium || 0;
            }

            lthcTotalFundingPremium += (row.iWealthyTotalPremium || 0) + (row.pensionPremium || 0);
            
            // 🎨 คำนวณผลประโยชน์จาก Funding (เงินถอน + เงินบำนาญ) 
            if (fundingSource === 'iWealthy') {
                lthcFundingBenefits += row.iWealthyWithdrawal || 0;
            } else if (fundingSource === 'pension') {
                lthcFundingBenefits += row.pensionPayout || 0;
            } else if (fundingSource === 'hybrid') {
                lthcFundingBenefits += (row.pensionPayout || 0) + (row.iWealthyWithdrawal || 0);
            }
        });

        // 🎨 เพิ่มมูลค่าบัญชีสุดท้าย (ต้องรวม Pension CSV และ iW AV)
        const lastRow = displayedResult[displayedResult.length - 1];
        let finalAccountValue = 0;
        if (fundingSource === 'pension' || fundingSource === 'hybrid') {
            finalAccountValue += lastRow.pensionEOYCSV || 0;
        }
        if (fundingSource === 'iWealthy' || fundingSource === 'hybrid') {
            finalAccountValue += lastRow.iWealthyEoyAccountValue || 0;
        }
        lthcFundingBenefits += finalAccountValue;
        
        // 🎨 คำนวณผลประโยชน์รวมและสุทธิ
        const healthOnlyTotalBenefit = lifeReadyMaturityBenefit;
        const healthOnlyNetBenefit = lifeReadyMaturityBenefit - totalHealthPremiumIfPaidAlone;
        
        const lthcTotalPremium = lthcHealthPremiumPaidByUser + lthcTotalFundingPremium;
        const lthcTotalBenefit = lthcFundingBenefits + lifeReadyMaturityBenefit;
        const lthcNetBenefit = lthcTotalBenefit - lthcTotalPremium;

        return { 
            totalHealthPremiumIfPaidAlone, 
            lthcHealthPremiumPaidByUser, 
            lthcTotalFundingPremium, 
            lifeReadyMaturityBenefit,
            lthcFundingBenefits,
            healthOnlyTotalBenefit,
            lthcTotalBenefit,
            lthcNetBenefit,
            healthOnlyNetBenefit,
        };
    }, [displayedResult, fundingSource, showFullPensionTerm, selectedHealthPlans]);



    const taxSummaryValues = useMemo(() => {
        if (!displayedResult || !taxSavingsData) return null;

        let healthOnlySaving = 0;
        let lthcHealthSaving = 0;
        let lthcFundingSaving = 0;

        for (const row of displayedResult) {
            // คำนวณถึงอายุที่กำหนดเท่านั้น
            if (row.age <= taxDeductionEndAge) {
                const taxRow = taxSavingsData.get(row.policyYear);
                if (taxRow) {
                    healthOnlySaving += (taxRow.life ?? 0) + (taxRow.health ?? 0);
                    
                    // เช็คว่าปีนั้นผู้ใช้จ่ายเบี้ยสุขภาพเองหรือไม่
                    const isFundingActive = (row.iWealthyWithdrawal ?? 0) > 0 || (row.pensionPayout ?? 0) > 0;
                    if (!isFundingActive) {
                        lthcHealthSaving += (taxRow.life ?? 0) + (taxRow.health ?? 0);
                    }
                    
                    lthcFundingSaving += (taxRow.iWealthy ?? 0) + (taxRow.pension ?? 0);
                }
            }
        }
        
        const lthcTotalSaving = lthcHealthSaving + lthcFundingSaving;

        return { healthOnlySaving, lthcHealthSaving, lthcFundingSaving, lthcTotalSaving };
    }, [displayedResult, taxSavingsData, taxDeductionEndAge]);
    
    const getFundingSummaryLabel = () => {
        switch(fundingSource) {
            case 'iWealthy':
                return "เบี้ย iWealthy รวม:";
            case 'pension':
                const pensionPlanName = pensionFundingOptions.planType === 'pension8' ? 'บำนาญ 8' : 'บำนาญ 60';
                return `เบี้ย ${pensionPlanName} รวม:`;
            case 'hybrid':
                const hybridPensionName = pensionFundingOptions.planType === 'pension8' ? 'บำนาญ 8' : 'บำนาญ 60';
                return `เบี้ย iWealthy + ${hybridPensionName} รวม:`;
            default:
                return "เบี้ย Funding ที่จ่ายเพิ่ม:";
        }
    };

    if (isLoading) return <div className="p-4 text-center">กำลังโหลดข้อมูลตาราง...</div>;
    if (error) return <div className="p-4 text-red-600">เกิดข้อผิดพลาด: {error}</div>;
    if (!result || result.length === 0) return <div className="p-4 text-center text-gray-500">ไม่มีข้อมูลผลประโยชน์สำหรับแสดงผล</div>;

    // --- FIX: สร้างตัวแปรควบคุมการแสดงผลให้ชัดเจน ---
    const showPensionCols = fundingSource === 'pension' || fundingSource === 'hybrid';
    const showIWealthyCols = fundingSource === 'iWealthy' || fundingSource === 'hybrid';
    const showTaxDeduction = isTaxDeductionEnabled;

    // 💡 [FIXED] คำนวณ Colspan สำหรับส่วน LTHC ในแถวแรกของ Thead
    let lthcColSpan = 0;

    // A: คอลัมน์ที่ต้องแสดงในทุก Funding (Hybrid/Pension/iWealthy)
    lthcColSpan += 1; // 1. เบี้ยสุขภาพ (จ่ายเอง)
    if (showTaxDeduction) lthcColSpan += 1; // 2. ลดหย่อน (สุขภาพ)

    // B: คอลัมน์เฉพาะ Pension
    if (fundingSource === 'pension') {
        lthcColSpan += 1; // 3. เบี้ยบำนาญ
        if (showTaxDeduction) lthcColSpan += 1; // 4. ลดหย่อน (บำนาญ)
        lthcColSpan += 1; // 5. เงินบำนาญ
        lthcColSpan += 1; // 6. ส่วนต่าง
        lthcColSpan += 1; // 7. มูลค่าเวนคืน
        lthcColSpan += 1; // 8. คุ้มครองชีวิต
    }
    
    // C: คอลัมน์เฉพาะ iWealthy
    if (fundingSource === 'iWealthy') {
        if (isIWealthyPremiumExpanded) {
            lthcColSpan += 1; // 3. เบี้ย RPP
            lthcColSpan += 1; // 4. เบี้ย RTU
        }
        lthcColSpan += 1; // 5. เบี้ย iW รวม
        if (showTaxDeduction) lthcColSpan += 1; // 6. ลดหย่อน (iW)
        lthcColSpan += 1; // 7. เงินถอน iW
        lthcColSpan += 1; // 8. มูลค่าบัญชี iW
        lthcColSpan += 1; // 9. คุ้มครองชีวิต
    }

    // D: คอลัมน์เฉพาะ Hybrid [FIXED: ปรับปรุงการนับคอลัมน์ใหม่ทั้งหมดสำหรับ Hybrid]
    if (fundingSource === 'hybrid') {
        if (isHybridPremiumExpanded) {
            lthcColSpan += 1; // 3. เบี้ยบำนาญ
            if (showTaxDeduction) lthcColSpan += 1; // 4. ลดหย่อน (บำนาญ)
            lthcColSpan += 1; // 5. เบี้ย iW
            if (showTaxDeduction) lthcColSpan += 1; // 6. ลดหย่อน (iW)
        }
        lthcColSpan += 1; // 7. เบี้ยรวม
        if (showTaxDeduction) lthcColSpan += 1; // 8. รวมลดหย่อนภาษี
        lthcColSpan += 1; // 9. เงินบำนาญ
        lthcColSpan += 1; // 10. เงินถอน iW
        lthcColSpan += 1; // 11. ส่วนต่าง
        
        if (isTotalCsvExpanded) {
            lthcColSpan += 1; // 12. มูลค่าเวนคืน (บำนาญ)
            lthcColSpan += 1; // 13. มูลค่าบัญชี iW
        }
        lthcColSpan += 1; // 14. มูลค่าเวนคืนรวม
        
        if (isTotalDbExpanded) {
            lthcColSpan += 1; // 15. DB iW
            lthcColSpan += 1; // 16. DB บำนาญ
        }
        lthcColSpan += 1; // 17. คุ้มครองชีวิตรวม
    }
    
    // E: คอลัมน์ DB รวม (สำหรับ Pension และ iWealthy ที่ไม่ได้ถูกนับใน Block B/C)
    // สำหรับ Pension และ iWealthy เราต้องนับคอลัมน์ DB ที่ซ่อนอยู่ด้วย
    if (fundingSource === 'pension') {
        if (isTotalDbExpanded) {
            // Pension: DB iW (ไม่แสดง) + DB บำนาญ (แสดง) => เพิ่มแค่ 1 คอลัมน์
            // แต่เนื่องจาก DB บำนาญถูกแสดงในช่อง "คุ้มครองชีวิต" ของ Pension Block แล้ว
            // เราจึงนับเฉพาะส่วนขยายของ DB รวม
            // 💡 PENSION: 
            // - DB บำนาญ (แสดงอยู่แล้ว)
            // - คุ้มครองชีวิตรวม (แสดงอยู่แล้ว)
            // - DB iW (ไม่แสดง) 
            // => ดังนั้นจึงไม่มีคอลัมน์เพิ่มเติมที่ต้องนับในส่วนขยายนี้ (ยกเว้นเราจะย้ายคอลัมน์ DB บำนาญมาอยู่ในส่วนขยาย) 
            // 💡 จากโค้ดเดิม: isTotalDbExpanded ใช้ได้เฉพาะ Hybrid/iW? ซึ่งใน iW/Pension DB จะซ่อนอยู่แล้ว
            // 💡 เราจะนับแค่ 'คุ้มครองชีวิตรวม' ใน Pension/iWealthy Block และแสดง DB ย่อยใน Hybrid เท่านั้น
            // 💡 FIXED: ลบคอลัมน์ DB iW และ DB บำนาญที่ซ้ำซ้อนใน Pension/iWealthy Block ออก
            // และใช้ `totalCombinedDeathBenefit` เป็นตัวแสดงผลสุดท้าย
        }
    }
    if (fundingSource === 'iWealthy') {
        if (isTotalDbExpanded) {
             // iWealthy: DB iW (แสดงอยู่แล้ว) + DB บำนาญ (ไม่แสดง) => เพิ่มแค่ 0 คอลัมน์
        }
    }


    // 💡 [FIXED] คำนวณ Colspan สำหรับส่วน Health Plan ในแถวแรกของ Thead
    // Health Plan: เบี้ย 3 (LR/IHU/MEB) + เบี้ยรวม 1 + ลดหย่อน 1 + คุ้มครองชีวิต 1 = 6 คอลัมน์ (เมื่อขยาย)
    const healthColSpan = 1 + // เบี้ยรวม 
        (showTaxDeduction ? 1 : 0) + // ลดหย่อนภาษี
        1 + // คุ้มครองชีวิต
        (isHealthDetailsExpanded ? 3 : 0); // เบี้ยย่อย 3 
    

    return (
        <div className="space-y-8">
            <TaxModal isOpen={isTaxModalOpen} onClose={closeTaxModal} onConfirm={setTaxInputs} />
            <div>
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-semibold text-sky-700">ตารางเปรียบเทียบผลประโยชน์</h2>
                        <div className="text-right">
                            <button
                                onClick={handleTaxButtonClick}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 border-2 ${showTaxDeduction
                                        ? 'bg-sky-600 text-white border-sky-600'
                                        : 'bg-white text-sky-600 border-sky-600 hover:bg-sky-50'
                                        }`}
                            >
                                ลดหย่อนภาษี
                            </button>
                            {showTaxDeduction && (
                                <p className="text-xs text-gray-500 mt-1">
                                    (ผลประโยชน์ทางภาษีถึงอายุ: {taxDeductionEndAge} ปี)
                                </p>
                            )}
                        </div>
                </div>

                <div 
                    className={isReportMode 
                        ? "shadow-none" // ถ้าเป็นโหมดรายงาน ไม่ต้องมี scroll, shadow, หรือขอบ
                        : "overflow-x-auto shadow-md sm:rounded-lg border border-gray-200"
                    }
                    style={isReportMode ? {} : { maxHeight: '70vh' }}
                >
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th rowSpan={2} className="px-2 py-3 text-center font-medium text-gray-500 uppercase bg-gray-100">ปีที่</th>
                                <th rowSpan={2} className="px-2 py-3 text-center font-medium text-gray-500 uppercase bg-gray-100">อายุ</th>
                                <th rowSpan={2} className="px-1 py-3 bg-gray-200 w-1"></th>

                                {/* 🎨 [FIXED] ใช้ healthColSpan ที่คำนวณแล้ว */}
                                <th colSpan={healthColSpan} className="px-2 py-3 text-center text-sm font-semibold text-sky-700 uppercase tracking-wider bg-sky-50 border-x whitespace-nowrap">
                                    {getPlanDisplayName('health')}
                                </th>
                                {fundingSource !== 'none' && <th rowSpan={2} className="px-1 py-3 bg-gray-200 w-1"></th>}
                                {fundingSource !== 'none' && (
                                    <th colSpan={lthcColSpan} className="px-2 py-3 text-center text-sm font-semibold text-purple-700 uppercase tracking-wider bg-purple-50 border-x whitespace-nowrap">
                                        {getPlanDisplayName('lthc')}
                                    </th>
                                )}
                            </tr>
                            <tr>
                                {/* Health Plan Columns */}
                                {isHealthDetailsExpanded && (
                                    <>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-sky-50">เบี้ย LR</th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-sky-50">เบี้ย IHU</th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-sky-50">เบี้ย MEB</th>
                                    </>
                                )}
                                <th className="px-2 py-3 text-center text-xs font-medium text-red-600 uppercase bg-sky-50">
                                    <div className="flex flex-col items-center"><span>เบี้ยสุขภาพรวม</span><button onClick={() => setIsHealthDetailsExpanded(!isHealthDetailsExpanded)} className="p-0.5">{isHealthDetailsExpanded ? <MinusCircle size={14} /> : <PlusCircle size={14} />}</button></div>
                                </th>
                                {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-sky-50">ลดหย่อนภาษี</th>}
                                <th className="px-2 py-3 text-center text-xs font-medium text-purple-600 uppercase bg-sky-50">คุ้มครองชีวิต</th>
                                

                                {/* --- LTHC Plan Columns --- */}
                                {fundingSource !== 'none' && (
                                    <>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-red-500 uppercase bg-purple-50">เบี้ยสุขภาพ</th>
                                        {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน (สุขภาพ)</th>}
                                        
                                        {/* PENSION Thead */}
                                        {fundingSource === 'pension' && (
                                            <>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 uppercase bg-purple-50">เบี้ยบำนาญ</th>
                                                {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน (บำนาญ)</th>}
                                                <th className="px-2 py-3 text-center text-xs font-medium text-orange-600 uppercase bg-purple-50">เงินบำนาญ</th>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase bg-purple-50">ส่วนต่าง</th>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-pink-600 uppercase bg-purple-50">มูลค่าเวนคืน</th>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-purple-600 uppercase bg-purple-50">คุ้มครองชีวิต</th>
                                            </>
                                        )}
                                        
                                        {/* iWEALTHY Thead */}
                                        {fundingSource === 'iWealthy' && (
                                            <>
                                                {isIWealthyPremiumExpanded && (
                                                    <>
                                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">เบี้ย RPP</th>
                                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">เบี้ย RTU</th>
                                                    </>
                                                )}
                                                <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 uppercase bg-purple-50">
                                                    <div className="flex flex-col items-center">
                                                        <span>เบี้ย iW รวม</span>
                                                        <button onClick={() => setIsIWealthyPremiumExpanded(!isIWealthyPremiumExpanded)} className="p-0.5">
                                                            {isIWealthyPremiumExpanded ? <MinusCircle size={14} /> : <PlusCircle size={14} />}
                                                        </button>
                                                    </div>
                                                </th>
                                                {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน (iW)</th>}
                                                <th className="px-2 py-3 text-center text-xs font-medium text-orange-600 uppercase bg-purple-50">เงินถอน iW</th>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase bg-purple-50">มูลค่าบัญชี iW</th>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-purple-600 uppercase bg-purple-50">คุ้มครองชีวิต</th>
                                            </>
                                        )}

                                        {/* 👇 [FIXED] Hybrid Thead: ปรับให้ตรงกับ Tbody ใหม่ */}
                                        {fundingSource === 'hybrid' && (
                                            <>
                                                {isHybridPremiumExpanded && (
                                                    <>
                                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">เบี้ยบำนาญ</th>
                                                        {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน (บำนาญ)</th>}
                                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">เบี้ย iW</th>
                                                        {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน (iW)</th>}
                                                    </>
                                                )} 
                                                
                                                <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 uppercase bg-purple-50">
                                                    <div className="flex flex-col items-center"><span>เบี้ยรวม</span><button onClick={() => setIsHybridPremiumExpanded(!isHybridPremiumExpanded)} className="p-0.5">{isHybridPremiumExpanded ? <MinusCircle size={14} /> : <PlusCircle size={14} />}</button></div>
                                                </th>
                                                {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">รวมลดหย่อนภาษี</th>}
                                                
                                                <th className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase bg-purple-50">เงินบำนาญ</th>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-orange-600 uppercase bg-purple-50">เงินถอน iW</th>

                                                {/* คอลัมน์ส่วนต่าง */}
                                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">ส่วนต่าง</th>

                                                {/* 👇 [NEW/FIXED] มูลค่าเวนคืนรวมสำหรับ Hybrid (อยู่หลังส่วนต่าง) */}
                                                {isTotalCsvExpanded && (
                                                    <>
                                                        <th className="px-2 py-3 text-center text-xs font-medium text-purple-600 uppercase bg-purple-50">มูลค่าเวนคืน (บำนาญ)</th>
                                                        <th className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase bg-purple-50">มูลค่าบัญชี iW</th>
                                                    </>
                                                )}
                                                <th className="px-2 py-3 text-center text-xs font-medium text-purple-700 uppercase bg-purple-50">
                                                    <div className="flex flex-col items-center">
                                                        <span>มูลค่ารวม</span>
                                                        <button onClick={() => setIsTotalCsvExpanded(!isTotalCsvExpanded)} className="p-0.5">
                                                            {isTotalCsvExpanded ? <MinusCircle size={14} /> : <PlusCircle size={14} />}
                                                        </button>
                                                    </div>
                                                </th>
                                                
                                                {isTotalDbExpanded && (
                                                    <>
                                                        {showIWealthyCols && <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">DB iW</th>}
                                                        {showPensionCols && <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">DB บำนาญ</th>}
                                                    </>
                                                )}
                                                <th className="px-2 py-3 text-center text-xs font-medium text-purple-600 uppercase bg-purple-50">
                                                    <div className="flex flex-col items-center"><span>คุ้มครองชีวิตรวม</span><button onClick={() => setIsTotalDbExpanded(!isTotalDbExpanded)} className="p-0.5">{isTotalDbExpanded ? <MinusCircle size={14} /> : <PlusCircle size={14} />}</button></div>
                                                </th>
                                                
                                            </>
                                        )}
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayedResult.map((row: AnnualLTHCOutputRow) => {
                                const taxRow = taxSavingsData?.get(row.policyYear);
                                
                                // 💡 Logic ที่แก้ไขเพื่อหาว่า Funding Active หรือไม่
                                const isFundingActiveInThisYear = (row.iWealthyWithdrawal ?? 0) > 0 || (row.pensionPayout ?? 0) > 0;
                                const lthcHealthPremiumToDisplay = isFundingActiveInThisYear ? 0 : (row.totalHealthPremium ?? 0); 
                                
                                const totalFundingPremium = (row.pensionPremium ?? 0) + (row.iWealthyTotalPremium ?? 0);
                                const hybridNetCashflow = (row.pensionPayout ?? 0) + (row.iWealthyWithdrawal ?? 0) - (row.totalHealthPremium ?? 0);

                                const totalCsvValue = (row.pensionEOYCSV ?? 0) + (row.iWealthyEoyAccountValue ?? 0);

                                return (
                                    <tr key={`lthc-${row.policyYear}`} className="hover:bg-slate-50">
                                        <td className="px-2 py-2 whitespace-nowrap text-center">{row.policyYear}</td>
                                        <td className="px-2 py-2 whitespace-nowrap text-center font-semibold">{row.age}</td>
                                        <td className="px-1 py-2 bg-gray-200"></td>

                                        {/* Health Plan Columns */}
                                        {isHealthDetailsExpanded && (
                                            <>
                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.lifeReadyPremium)}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iHealthyUltraPremium)}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.mebPremium)}</td>
                                            </>
                                        )}
                                        <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-red-500 bg-red-50">{formatNum(row.totalHealthPremium)}</td>
                                        {showTaxDeduction && 
                                            <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">
                                                {formatNum(row.age <= taxDeductionEndAge ? (taxRow?.life ?? 0) + (taxRow?.health ?? 0) : 0)}
                                            </td>
                                        }
                                        <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-purple-500 bg-purple-50">{formatNum(row.lifeReadyDeathBenefit)}</td>
                                        
                                        
                                        
                                        {fundingSource !== 'none' && <td className="px-1 py-2 bg-gray-200"></td>}

                                        {fundingSource !== 'none' && (
                                            <>
                                                {/* 1. เบี้ยสุขภาพที่ผู้ใช้จ่ายเอง */}
                                                <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-red-500 bg-red-50">{formatNum(lthcHealthPremiumToDisplay)}</td>
                                                
                                                {/* 2. Tax Health (ถ้าจ่ายเอง) */}
                                                {showTaxDeduction && 
                                                    <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">
                                                        {formatNum(lthcHealthPremiumToDisplay > 0 && row.age <= taxDeductionEndAge ? (taxRow?.life ?? 0) + (taxRow?.health ?? 0) : 0)}
                                                    </td>
                                                }
                                                
                                                {/* PENSION Tbody (3-8) [FIXED: เรียงลำดับคอลัมน์ใหม่ให้ตรงกับ Thead] */}
                                                {fundingSource === 'pension' && (
                                                    <>
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-blue-600">{formatNum(row.pensionPremium)}</td> {/* 3. เบี้ยบำนาญ */}
                                                        {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.pension)}</td>} {/* 4. ลดหย่อน (บำนาญ) */}
                                                        
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-orange-600">{formatNum(row.pensionPayout)}</td> {/* 5. เงินบำนาญ */}
                                                        {/* 6. ส่วนต่าง (Shortfall/Surplus) */}
                                                        <td className={`px-2 py-2 whitespace-nowrap text-right font-medium ${
                                                            (row.pensionSurplusShortfall ?? 0) < 0 ? 'text-red-600' : 'text-green-700' 
                                                        }`}>
                                                            {row.age < 60 ? formatNum(0) : formatNum(row.pensionSurplusShortfall)}
                                                        </td>
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-pink-600">{formatNum(row.pensionEOYCSV)}</td> {/* 7. มูลค่าเวนคืน */}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-purple-600">{formatNum(row.pensionDeathBenefit)}</td> {/* 8. คุ้มครองชีวิต */}
                                                    </>
                                                )}

                                                {/* iWEALTHY Tbody (3-9) */}
                                                {fundingSource === 'iWealthy' && (
                                                    <>
                                                        {isIWealthyPremiumExpanded && (
                                                            <>
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iWealthyRpp)}</td> {/* 3. เบี้ย RPP */}
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iWealthyRtu)}</td> {/* 4. เบี้ย RTU */}
                                                            </>
                                                        )}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-blue-600">{formatNum(row.iWealthyTotalPremium)}</td> {/* 5. เบี้ย iW รวม */}
                                                        {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.iWealthy)}</td>} {/* 6. ลดหย่อน (iW) */}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-orange-600">{formatNum(row.iWealthyWithdrawal)}</td> {/* 7. เงินถอน iW */}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-green-600">{formatNum(row.iWealthyEoyAccountValue)}</td> {/* 8. มูลค่าบัญชี iW */}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-purple-600">{formatNum(row.iWealthyEoyDeathBenefit)}</td> {/* 9. คุ้มครองชีวิต */}
                                                    </>
                                                )}

                                                {/* HYBRID Tbody (3-17) [FIXED: ปรับลำดับคอลัมน์ให้ตรงกับ Thead และ Colspan] */}
                                                {fundingSource === 'hybrid' && (
                                                    <>
                                                        {isHybridPremiumExpanded && (
                                                            <>
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.pensionPremium)}</td> {/* 3. เบี้ยบำนาญ */}
                                                                {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.pension)}</td>} {/* 4. ลดหย่อน (บำนาญ) */}
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iWealthyTotalPremium)}</td> {/* 5. เบี้ย iW */}
                                                                {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.iWealthy)}</td>} {/* 6. ลดหย่อน (iW) */}
                                                            </>
                                                        )}
                                                        
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-blue-600">{formatNum(totalFundingPremium)}</td> {/* 7. เบี้ยรวม */}
                                                        {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.total)}</td>} {/* 8. รวมลดหย่อนภาษี */}
                                                        
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-green-600">{formatNum(row.pensionPayout)}</td> {/* 9. เงินบำนาญ */}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-orange-600">{formatNum(row.iWealthyWithdrawal)}</td> {/* 10. เงินถอน iW */}

                                                        {/* 11. ส่วนต่าง (Shortfall/Surplus) */}
                                                        <td className={`px-2 py-2 whitespace-nowrap text-right font-medium ${
                                                            hybridNetCashflow < 0 ? 'text-red-600' : 'text-green-700' 
                                                        }`}>
                                                            {row.age < 60 ? formatNum(0) : formatNum(Math.round(hybridNetCashflow))}
                                                        </td>
                                                        
                                                        {isTotalCsvExpanded && (
                                                            <>
                                                                <td className="px-2 py-2 whitespace-nowrap text-right text-purple-600">{formatNum(row.pensionEOYCSV)}</td> {/* 12. มูลค่าเวนคืน (บำนาญ) */}
                                                                <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-green-600">{formatNum(row.iWealthyEoyAccountValue)}</td> {/* 13. มูลค่าบัญชี iW */}
                                                            </>
                                                        )}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right font-bold text-purple-700 bg-purple-50"> {/* 14. มูลค่าเวนคืนรวม */}
                                                            {formatNum(totalCsvValue)}
                                                        </td>
                                                        
                                                        {isTotalDbExpanded && (
                                                            <>
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iWealthyEoyDeathBenefit)}</td> {/* 15. DB iW */}
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.pensionDeathBenefit)}</td> {/* 16. DB บำนาญ */}
                                                            </>
                                                        )}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right font-bold text-purple-700 bg-purple-100">{formatNum(row.totalCombinedDeathBenefit)}</td> {/* 17. คุ้มครองชีวิตรวม (สุดท้าย) */}
                                                        
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                    {fundingSource === 'pension' && result.length > 0 && result[result.length-1].age > 88 && (
                        <div className="text-center mt-4">
                            <button onClick={() => setShowFullPensionTerm(prev => !prev)} className="text-sm text-blue-600 hover:underline">
                                {showFullPensionTerm ? 'แสดงผลถึงอายุ 88 ปี' : 'แสดงผลถึงอายุ 99 ปี'}
                            </button>
                        </div>
                    )}
            </div>
            {summaryValues && (
                <section className="mt-8 p-6 border-t-2 border-sky-600 bg-slate-50 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">
                        สรุปผลประโยชน์ (ถึงอายุ {isTaxDeductionEnabled ? taxDeductionEndAge : (fundingSource === 'pension' && !showFullPensionTerm ? 88 : 99)} ปี):
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="p-4 bg-white rounded shadow border border-gray-200 space-y-3">
                            <h3 className="font-semibold text-gray-600 mb-3">1. กรณีจ่ายเบี้ยสุขภาพเองทั้งหมด:</h3>
                            
                            {/* กลุ่มเบี้ย */}
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">💰 เบี้ยที่จ่าย</p>
                                <p className="font-bold text-rose-600 text-xl">{formatNum(summaryValues.totalHealthPremiumIfPaidAlone)} บาท</p>
                            </div>
                            
                            {/* กลุ่มผลประโยชน์ */}
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">🎁 ผลประโยชน์รวม</p>
                                <p className="text-sm mb-1">• ทุนประกัน (Life Ready): <span className="font-semibold text-green-600">{formatNum(summaryValues.lifeReadyMaturityBenefit)} บาท</span></p>
                                <p className="font-bold text-purple-600 text-xl mt-2 pt-2 border-t border-purple-300">รวม: {formatNum(summaryValues.healthOnlyTotalBenefit)} บาท</p>
                            </div>
                            
                            {/* ผลประโยชน์สุทธิ */}
                            <div className={`p-3 rounded-lg border-2 ${summaryValues.healthOnlyNetBenefit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">📊 ผลประโยชน์สุทธิ</p>
                                <p className={`font-bold text-2xl ${summaryValues.healthOnlyNetBenefit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {summaryValues.healthOnlyNetBenefit >= 0 ? '+' : ''}{formatNum(summaryValues.healthOnlyNetBenefit)} บาท
                                </p>
                            </div>
                        </div>
                        
                        {fundingSource !== 'none' && (
                            <div className="p-4 bg-white rounded shadow border border-gray-200 space-y-3">
                                <h3 className="font-semibold text-gray-600 mb-3">2. กรณีใช้แผน LTHC:</h3>
                                
                                {/* กลุ่มเบี้ย */}
                                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">💰 เบี้ยที่จ่าย</p>
                                    <p className="text-sm mb-1">• เบี้ยสุขภาพที่จ่ายเอง: <span className="font-semibold text-rose-600">{formatNum(summaryValues.lthcHealthPremiumPaidByUser)} บาท</span></p>
                                    <p className="text-sm mb-1">• {getFundingSummaryLabel()}: <span className="font-semibold text-blue-600">{formatNum(summaryValues.lthcTotalFundingPremium)} บาท</span></p>
                                    <p className="font-bold text-rose-600 text-xl mt-2 pt-2 border-t border-red-300">รวม: {formatNum((summaryValues.lthcHealthPremiumPaidByUser || 0) + (summaryValues.lthcTotalFundingPremium || 0))} บาท</p>
                                </div>
                                
                                {/* กลุ่มผลประโยชน์ */}
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">🎁 ผลประโยชน์รวม</p>
                                    <p className="text-sm mb-1">• ผลประโยชน์จาก {(() => {
                                        switch(fundingSource) {
                                            case 'iWealthy': return 'iWealthy';
                                            case 'pension': return pensionFundingOptions.planType === 'pension8' ? 'บำนาญ 8' : 'บำนาญ 60';
                                            case 'hybrid': return 'iWealthy + บำนาญ';
                                            default: return 'Funding';
                                        }
                                    })()}: <span className="font-semibold text-orange-600">{formatNum(summaryValues.lthcFundingBenefits)} บาท</span></p>
                                    <p className="text-sm mb-1">• ทุนประกัน (Life Ready): <span className="font-semibold text-green-600">{formatNum(summaryValues.lifeReadyMaturityBenefit)} บาท</span></p>
                                    <p className="font-bold text-purple-600 text-xl mt-2 pt-2 border-t border-purple-300">รวม: {formatNum(summaryValues.lthcTotalBenefit)} บาท</p>
                                </div>
                                
                                {/* ผลประโยชน์สุทธิ */}
                                <div className={`p-3 rounded-lg border-2 ${summaryValues.lthcNetBenefit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">📊 ผลประโยชน์สุทธิ</p>
                                    <p className={`font-bold text-2xl ${summaryValues.lthcNetBenefit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {summaryValues.lthcNetBenefit >= 0 ? '+' : ''}{formatNum(summaryValues.lthcNetBenefit)} บาท
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    {/*{fundingSource !== 'none' && (
                        <div className={`mt-6 p-4 rounded-lg text-center ${summaryValues.lthcNetBenefit > summaryValues.healthOnlyNetBenefit ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            <p className="text-lg font-semibold">
                                {summaryValues.lthcNetBenefit > summaryValues.healthOnlyNetBenefit ? (
                                    <>คุณได้รับผลประโยชน์เพิ่มขึ้น <span className="text-2xl font-bold">{formatNum(summaryValues.lthcNetBenefit - summaryValues.healthOnlyNetBenefit)}</span> บาท เมื่อใช้แผน LTHC!</>
                                ) : (
                                    <>ผลประโยชน์สุทธิจากแผน LTHC: <span className="text-2xl font-bold">{formatNum(summaryValues.lthcNetBenefit)}</span> บาท</>
                                )}
                            </p>
                        </div>
                    )}*/}
                </section>
            )}
            {showTaxDeduction && taxSummaryValues && (
                <section className="mt-8 p-6 border-t-2 border-teal-600 bg-slate-50 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">
                        สรุปผลประโยชน์ทางภาษี (ถึงอายุ {taxDeductionEndAge} ปี):
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="p-4 bg-white rounded shadow border border-gray-200">
                            <h3 className="font-semibold text-gray-600 mb-1">1. กรณีจ่ายเบี้ยสุขภาพเองทั้งหมด:</h3>
                            <p className="font-bold text-xl text-teal-600">{formatNum(taxSummaryValues.healthOnlySaving)} บาท</p>
                        </div>

                        <div className="p-4 bg-white rounded shadow border border-gray-200 space-y-1">
                            <h3 className="font-semibold text-gray-600 mb-1">2. กรณีใช้แผน LTHC:</h3>
                            <p>ประหยัดจากเบี้ยที่จ่ายเอง: <span className="font-bold text-sky-600 ml-2">{formatNum(taxSummaryValues.lthcHealthSaving)} บาท</span></p>
                            <p>
                                ประหยัดจากแผน {(() => {
                                    switch(fundingSource) {
                                        case 'iWealthy':
                                            return 'iWealthy';
                                        case 'pension':
                                            return pensionFundingOptions.planType === 'pension8' ? 'บำนาญ 8' : 'บำนาญ 60';
                                        case 'hybrid':
                                            const pensionName = pensionFundingOptions.planType === 'pension8' ? 'บำนาญ 8' : 'บำนาญ 60';
                                            return `Hybrid (iWealthy + ${pensionName})`;
                                        default:
                                            return 'Funding';
                                    }
                                })()}:
                                <span className="font-bold text-blue-600 ml-2">{formatNum(taxSummaryValues.lthcFundingSaving)} บาท</span>
                            </p>
                            <p className="text-gray-800 font-medium border-t pt-2 mt-2">รวมประหยัดภาษีทั้งหมด: <span className="font-bold text-xl text-teal-600 ml-2">{formatNum(taxSummaryValues.lthcTotalSaving)} บาท</span></p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}