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

// 🎨 Step 2: สร้างคอมโพเนนต์ Tax Modal (วางไว้ในไฟล์เดียวกันเพื่อความง่าย)

{/*type TaxModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (inputs: { taxRate: number; usedFirst100k: number; endAge: number; }) => void;
};

const TaxModal = ({ isOpen, onClose, onConfirm }: TaxModalProps) => {
    const commonTaxRates = [5, 10, 15, 20];
    const otherTaxRates = [25, 30, 35];

    const [rate, setRate] = useState(10);
    const [used, setUsed] = useState(0);
    const [endAge, setEndAge] = useState(98);
    const [showOtherRates, setShowOtherRates] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({ taxRate: rate, usedFirst100k: used, endAge: endAge });
        onClose();
    };

    const handleUsedChange = (value: number) => {
        const clampedValue = Math.max(0, Math.min(100000, value));
        setUsed(clampedValue);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-6 text-gray-800">ตั้งค่าเพื่อคำนวณลดหย่อนภาษี</h3>

                <div className="space-y-6">
                    {/* 1. Tax Rate: แก้ไขให้ซ่อนกลับได้ (Toggle) 
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ฐานภาษีสูงสุดของคุณ</label>
                        <div className="flex flex-wrap gap-2">
                            {commonTaxRates.map((taxRate) => (
                                <button key={taxRate} onClick={() => setRate(taxRate)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${rate === taxRate ? 'bg-sky-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                    {taxRate}%
                                </button>
                            ))}
                            <button onClick={() => setShowOtherRates(!showOtherRates)} className="px-4 py-2 text-sm font-medium text-sky-600 rounded-lg hover:bg-sky-100 transition-colors">
                                {showOtherRates ? 'ซ่อน' : 'อื่นๆ...'}
                            </button>
                        </div>
                        {showOtherRates && (
                            <div className="flex flex-wrap gap-2 mt-2 animate-fade-in-down"> {/* Optional: Add a simple animation *
                                {otherTaxRates.map((taxRate) => (
                                    <button key={taxRate} onClick={() => setRate(taxRate)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${rate === taxRate ? 'bg-sky-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                        {taxRate}%
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Used Deduction: แก้ไขความกว้างของ Input 
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ค่าลดหย่อนประกันชีวิตที่ใช้ไปแล้ว (สูงสุด 100,000)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100000"
                                step="1000"
                                value={used}
                                onChange={(e) => handleUsedChange(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                            />
                            <div className="relative flex-shrink-0"> {/* Container to prevent shrinking 
                                <input
                                    type="number"
                                    value={used}
                                    onChange={(e) => handleUsedChange(Number(e.target.value))}
                                    className="w-36 border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-right focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-gray-500 pointer-events-none">฿</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* 3. End Age 
                    <div>
                         <label htmlFor="endAge" className="block text-sm font-semibold text-gray-700">คำนวณผลประโยชน์ถึงอายุ</label>
                         <input type="number" id="endAge" value={endAge} onChange={(e) => setEndAge(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3"/>
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                    <button onClick={handleConfirm} className="px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700">ยืนยัน</button>
                </div>
            </div>
        </div>
    );
};

*/}

export default function LthcTablePage() {
    // --- ส่วนของ Hooks และ Logic คำนวณ (เหมือนเดิม) ---
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
    //const [isPensionSurplusExpanded, setIsPensionSurplusExpanded] = useState<boolean>(false);
    const [isIWealthyPremiumExpanded, setIsIWealthyPremiumExpanded] = useState<boolean>(false);
    //const [isHybridValueExpanded, setIsHybridValueExpanded] = useState<boolean>(false);
    const [isTotalDbExpanded, setIsTotalDbExpanded] = useState<boolean>(false);
    const [showFullPensionTerm, setShowFullPensionTerm] = useState<boolean>(false);
    const [isHybridPremiumExpanded, setIsHybridPremiumExpanded] = useState<boolean>(false);

    


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

        displayedResult.forEach(row => {
            totalHealthPremiumIfPaidAlone += row.totalHealthPremium || 0;
            
            let isUserPayingHealth = row.age < 60;
            if (fundingSource === 'pension' && showFullPensionTerm && row.age > 88) {
                isUserPayingHealth = true;
            }

            if (isUserPayingHealth) {
                lthcHealthPremiumPaidByUser += row.totalHealthPremium || 0;
            }
            
            lthcTotalFundingPremium += (row.iWealthyTotalPremium || 0) + (row.pensionPremium || 0);
        });

        const lthcTotalCombinedPremiumPaid = lthcHealthPremiumPaidByUser + lthcTotalFundingPremium;
        const totalSavings = totalHealthPremiumIfPaidAlone - lthcTotalCombinedPremiumPaid;

        return { totalHealthPremiumIfPaidAlone, lthcHealthPremiumPaidByUser, lthcTotalFundingPremium, lthcTotalCombinedPremiumPaid, totalSavings };
    }, [displayedResult, fundingSource, showFullPensionTerm]);



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
                    const fundIsActive = (row.iWealthyWithdrawal ?? 0) > 0 || (row.pensionPayout ?? 0) > 0;
                    if (!fundIsActive) {
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

    // --- 🎨 FIX: สร้างตัวแปรควบคุมการแสดงผลให้ชัดเจน ---
    const showPensionCols = fundingSource === 'pension' || fundingSource === 'hybrid';
    const showIWealthyCols = fundingSource === 'iWealthy' || fundingSource === 'hybrid';
    const showTaxDeduction = isTaxDeductionEnabled;

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

                <div className="overflow-x-auto shadow-md sm:rounded-lg border border-gray-200" style={{ maxHeight: '70vh' }}>
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th rowSpan={2} className="px-2 py-3 text-center font-medium text-gray-500 uppercase bg-gray-100">ปีที่</th>
                                <th rowSpan={2} className="px-2 py-3 text-center font-medium text-gray-500 uppercase bg-gray-100">อายุ</th>
                                <th rowSpan={2} className="px-1 py-3 bg-gray-200 w-1"></th>

                                {/* 🎨 FIX: แก้ไข colSpan ให้ถูกต้อง */}
                                <th colSpan={2 + (isHealthDetailsExpanded ? 3 : 0) + (showTaxDeduction ? 1 : 0)} className="px-2 py-3 text-center text-sm font-semibold text-sky-700 uppercase tracking-wider bg-sky-50 border-x">
                                    {getPlanDisplayName('health')}
                                </th>
                                {fundingSource !== 'none' && <th rowSpan={2} className="px-1 py-3 bg-gray-200 w-1"></th>}
                                {fundingSource !== 'none' && (
                                    <th colSpan={100} className="px-2 py-3 text-center text-sm font-semibold text-purple-700 uppercase tracking-wider bg-purple-50 border-x">
                                        {getPlanDisplayName('lthc')}
                                    </th>
                                )}
                            </tr>
                            <tr>
                                {/* 🎨 FIX: จัดเรียงคอลัมน์ใน thead ใหม่ทั้งหมด */}
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
                                        {/* 🎨 START: แก้ไขส่วนของ LTHC */}
                                        <th className="px-2 py-3 text-center text-xs font-medium text-red-500 uppercase bg-purple-50">เบี้ยสุขภาพ</th>
                                        {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน (สุขภาพ)</th>}
                                        
                                        {fundingSource === 'pension' && (
                                            <>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 uppercase bg-purple-50">เบี้ยบำนาญ</th>
                                                {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน (บำนาญ)</th>}
                                                <th className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase bg-purple-50">เงินบำนาญ</th>
                                            </>
                                        )}
                                        
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
                                            </>
                                        )}

                                        {fundingSource === 'hybrid' && (
                                            <>
                                                {isHybridPremiumExpanded && (
                                                    <>
                                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">เบี้ยบำนาญ</th>
                                                        {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน</th>}
                                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">เบี้ย iW</th>
                                                        {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">ลดหย่อน</th>}
                                                    </>
                                                )} 
                                                        
                                                
                                                <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 uppercase bg-purple-50">
                                                    <div className="flex flex-col items-center"><span>เบี้ยรวม</span><button onClick={() => setIsHybridPremiumExpanded(!isHybridPremiumExpanded)} className="p-0.5">{isHybridPremiumExpanded ? <MinusCircle size={14} /> : <PlusCircle size={14} />}</button></div>
                                                </th>
                                                {showTaxDeduction && <th className="px-2 py-3 text-center text-xs font-medium text-teal-600 uppercase bg-purple-50">รวมลดหย่อนภาษี</th>}
                                                
                                                <th className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase bg-purple-50">เงินบำนาญ</th>
                                                <th className="px-2 py-3 text-center text-xs font-medium text-orange-600 uppercase bg-purple-50">เงินถอน iW</th>
                                            </>
                                        )}

                                        {showPensionCols && <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">ส่วนต่าง</th>}
                                        
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
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayedResult.map((row: AnnualLTHCOutputRow) => {
                                const taxRow = taxSavingsData?.get(row.policyYear);
                                //const fundIsActive = (row.iWealthyWithdrawal ?? 0) > 0 || (row.pensionPayout ?? 0) > 0;
                                const healthPremiumPaidByUser = row.age < 60 ? row.totalHealthPremium : 0;

                                const totalFundingPremium = (row.pensionPremium ?? 0) + (row.iWealthyTotalPremium ?? 0);

                                return (
                                    <tr key={`lthc-${row.policyYear}`} className="hover:bg-slate-50">
                                        <td className="px-2 py-2 whitespace-nowrap text-center">{row.policyYear}</td>
                                        <td className="px-2 py-2 whitespace-nowrap text-center font-semibold">{row.age}</td>
                                        <td className="px-1 py-2 bg-gray-200"></td>

                                        {/* 🎨 FIX: จัดเรียงคอลัมน์ใน tbody ให้ตรงกับ thead ใหม่ */}
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
                                                {/* 🎨 START: แก้ไขส่วนของ LTHC */}
                                                <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-red-500 bg-red-50">{formatNum(healthPremiumPaidByUser)}</td>
                                                {showTaxDeduction && 
                                                    <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">
                                                        {formatNum(healthPremiumPaidByUser > 0 && row.age <= taxDeductionEndAge ? (taxRow?.life ?? 0) + (taxRow?.health ?? 0) : 0)}
                                                    </td>
                                                }
                                                
                                                {fundingSource === 'pension' && (
                                                    <>
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-blue-600">{formatNum(row.pensionPremium)}</td>
                                                        {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.pension)}</td>}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-green-600">{formatNum(row.pensionPayout)}</td>
                                                    </>
                                                )}

                                                {fundingSource === 'iWealthy' && (
                                                    <>
                                                        {isIWealthyPremiumExpanded && (
                                                            <>
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iWealthyRpp)}</td>
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iWealthyRtu)}</td>
                                                            </>
                                                        )}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-blue-600">{formatNum(row.iWealthyTotalPremium)}</td>
                                                        {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.iWealthy)}</td>}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-orange-600">{formatNum(row.iWealthyWithdrawal)}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-green-600">{formatNum(row.iWealthyEoyAccountValue)}</td>
                                                    </>
                                                )}

                                                {fundingSource === 'hybrid' && (
                                                    <>
                                                        {isHybridPremiumExpanded && (
                                                            <>
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.pensionPremium)}</td>
                                                                {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.pension)}</td>}
                                                                <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iWealthyTotalPremium)}</td>
                                                                {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.iWealthy)}</td>}
                                                            </>
                                                        )}
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-blue-600">{formatNum(totalFundingPremium)}</td>
                                                        {showTaxDeduction && <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-teal-600 bg-teal-50">{formatNum(taxRow?.total)}</td>}
                                                        
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-green-600">{formatNum(row.pensionPayout)}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap text-right text-orange-600">{formatNum(row.iWealthyWithdrawal)}</td>
                                                    </>
                                                )}

                                                {showPensionCols && <td className={`px-2 py-2 whitespace-nowrap text-right font-medium ${(row.pensionSurplusShortfall ?? 0) < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatNum(row.pensionSurplusShortfall)}</td>}
                                                
                                                {isTotalDbExpanded && (
                                                    <>
                                                        {showIWealthyCols && <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.iWealthyEoyDeathBenefit)}</td>}
                                                        {showPensionCols && <td className="px-2 py-2 whitespace-nowrap text-right">{formatNum(row.pensionDeathBenefit)}</td>}
                                                    </>
                                                )}
                                                <td className="px-2 py-2 whitespace-nowrap text-right font-bold text-purple-700 bg-purple-100">{formatNum(row.totalCombinedDeathBenefit)}</td>
                                                
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
                        สรุปเปรียบเทียบค่าใช้จ่าย (ถึงอายุ {isTaxDeductionEnabled ? taxDeductionEndAge : (fundingSource === 'pension' && !showFullPensionTerm ? 88 : 99)} ปี):
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                         <div className="p-4 bg-white rounded shadow border border-gray-200">
                            <h3 className="font-semibold text-gray-600 mb-1">1. กรณีจ่ายเบี้ยสุขภาพเองทั้งหมด:</h3>
                            <p className="font-bold text-xl text-rose-600">{formatNum(summaryValues.totalHealthPremiumIfPaidAlone)} บาท</p>
                        </div>
                        {fundingSource !== 'none' && (
                            <div className="p-4 bg-white rounded shadow border border-gray-200 space-y-1">
                                <h3 className="font-semibold text-gray-600 mb-1">2. กรณีใช้แผน LTHC:</h3>
                                <p>เบี้ยสุขภาพที่จ่ายเอง: <span className="font-bold text-sky-600 ml-2">{formatNum(summaryValues.lthcHealthPremiumPaidByUser)} บาท</span></p>
                                <p>{getFundingSummaryLabel()} <span className="font-bold text-blue-600 ml-2">{formatNum(summaryValues.lthcTotalFundingPremium)} บาท</span></p>
                                <p className="text-gray-800 font-medium border-t pt-2 mt-2">รวมเบี้ยที่จ่ายทั้งหมด: <span className="font-bold text-xl text-emerald-600 ml-2">{formatNum(summaryValues.lthcTotalCombinedPremiumPaid)} บาท</span></p>
                            </div>
                        )}
                    </div>
                    {fundingSource !== 'none' && summaryValues.totalSavings > 0 && (
                        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-center">
                            <p className="text-lg font-semibold">คุณประหยัดค่าใช้จ่ายโดยรวมไปได้ถึง <span className="text-2xl font-bold">{formatNum(summaryValues.totalSavings)}</span> บาท!</p>
                        </div>
                    )}
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