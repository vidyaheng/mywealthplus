import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { FaPlusCircle, FaMinusCircle, FaReceipt, FaTimesCircle, FaBullseye } from 'react-icons/fa';
import RetirementTaxModal from '@/components/ret/RetirementTaxModal';
import { calculateRetirementTaxBenefits } from '@/components/ret/hooks/useRetirementCalculations';
import type { AnnualRetirementOutputRow, TaxInfo } from '@/components/ret/hooks/useRetirementTypes';

// --- ✨ [แก้ไขแล้ว] ไม่รับ data ผ่าน props อีกต่อไป ---
const RetirementTablePage = () => {
    // --- ✨ [แก้ไขแล้ว] ดึงข้อมูลดิบและการตั้งค่าภาษีจาก Store โดยตรง ---
    const { 
        retirementResult, retirementIsLoading, retirementError, retirementFundingMix,
        retirementTaxInfo, setRetirementTaxInfo 
    } = useAppStore();
    
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [showPremiumDetails, setShowPremiumDetails] = useState(false);
    const [showPensionDetails, setShowPensionDetails] = useState(false);
    const [showValueDetails, setShowValueDetails] = useState(false);
    const [showDbDetails, setShowDbDetails] = useState(false);
    const [showTargetColumn, setShowTargetColumn] = useState(false);

    // --- ✨ [แก้ไขแล้ว] หน้านี้จะคำนวณภาษีด้วยตัวเอง ---
    const dataWithTax = useMemo(() => {
        if (!retirementResult) return [];
        if (!retirementTaxInfo) return retirementResult;
        return calculateRetirementTaxBenefits(retirementResult, retirementTaxInfo);
    }, [retirementResult, retirementTaxInfo]);


    if (retirementIsLoading) {
        return <div className="text-center p-4">กำลังโหลดข้อมูลตาราง...</div>;
    }
    if (retirementError) {
        return <div className="p-4 text-red-700 bg-red-100 rounded-lg">เกิดข้อผิดพลาด: {retirementError}</div>;
    }
    if (!dataWithTax || dataWithTax.length === 0) {
        return (
            <div className="p-4 text-gray-600 bg-gray-100 rounded-lg text-center">
                <h3 className="font-semibold text-lg">ไม่พบข้อมูลตาราง</h3>
                <p>กรุณากลับไปที่หน้า "กรอกข้อมูล" และคำนวณแผนของคุณก่อน</p>
            </div>
        );
    }
    
    const thClass = "py-3 px-2 text-center border-b border-gray-200";
    const tdClass = "py-2 px-2 text-right border-b border-gray-200";
    const tdCenterClass = `${tdClass} text-center`;

    const ToggleButton = ({ isVisible, toggleFunc }: { isVisible: boolean; toggleFunc: () => void; }) => (
        <button onClick={toggleFunc} className="text-gray-400 hover:text-blue-600 ml-1 focus:outline-none align-middle">
            {isVisible ? <FaMinusCircle size="0.8em"/> : <FaPlusCircle size="0.8em"/>}
        </button>
    );
    
    const formatNum = (num: number | undefined | null) => {
        if (num === undefined || num === null) return '-';
        return num > 0 ? num.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-';
    };

    const renderTableContent = () => {
        if (retirementFundingMix === 'hybrid') {
             return (
                    <>
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                            <tr>
                                <th scope="col" rowSpan={2} className={`${thClass} align-middle`}>อายุ</th>
                                <th scope="col" rowSpan={2} className={`${thClass} align-middle`}>ปีที่</th>
                                <th scope="col" colSpan={showPremiumDetails ? 3 : 1} className={`${thClass} bg-red-50`}>
                                    เบี้ยประกัน <ToggleButton isVisible={showPremiumDetails} toggleFunc={() => setShowPremiumDetails(p => !p)} />
                                </th>
                                {retirementTaxInfo && <th scope="col" rowSpan={2} className={`${thClass} align-middle bg-teal-50`}>คืนภาษี</th>}
                                {showTargetColumn && <th scope="col" rowSpan={2} className={`${thClass} align-middle bg-yellow-50`}>บำนาญเป้าหมาย</th>}
                                <th scope="col" colSpan={showPensionDetails ? 3 : 1} className={`${thClass} bg-green-50`}>
                                    เงินเกษียณ <ToggleButton isVisible={showPensionDetails} toggleFunc={() => setShowPensionDetails(p => !p)} />
                                </th>
                                <th scope="col" colSpan={showValueDetails ? 3 : 1} className={`${thClass} bg-blue-50`}>
                                    มูลค่า กธ. <ToggleButton isVisible={showValueDetails} toggleFunc={() => setShowValueDetails(p => !p)} />
                                </th>
                                <th scope="col" colSpan={showDbDetails ? 3 : 1} className={`${thClass} bg-purple-50`}>
                                    คุ้มครองชีวิต <ToggleButton isVisible={showDbDetails} toggleFunc={() => setShowDbDetails(p => !p)} />
                                </th>
                            </tr>
                            <tr>
                                <th scope="col" className={`${thClass} font-medium bg-red-50`}>รวม</th>
                                {showPremiumDetails && <>
                                    <th scope="col" className={`${thClass} font-medium bg-red-50`}>บำนาญ</th>
                                    <th scope="col" className={`${thClass} font-medium bg-red-50`}>iWealthy</th>
                                </>}
                                <th scope="col" className={`${thClass} font-medium bg-green-50`}>รวม</th>
                                {showPensionDetails && <>
                                    <th scope="col" className={`${thClass} font-medium bg-green-50`}>บำนาญ (แผน)</th>
                                    <th scope="col" className={`${thClass} font-medium bg-green-50`}>ถอน (iWealthy)</th>
                                </>}
                                <th scope="col" className={`${thClass} font-medium bg-blue-50`}>รวม</th>
                                {showValueDetails && <>
                                    <th scope="col" className={`${thClass} font-medium bg-blue-50`}>บำนาญ (CSV)</th>
                                    <th scope="col" className={`${thClass} font-medium bg-blue-50`}>iWealthy</th>
                                </>}
                                <th scope="col" className={`${thClass} font-medium bg-purple-50`}>รวม</th>
                                {showDbDetails && <>
                                    <th scope="col" className={`${thClass} font-medium bg-purple-50`}>บำนาญ</th>
                                    <th scope="col" className={`${thClass} font-medium bg-purple-50`}>iWealthy</th>
                                </>}
                            </tr>
                        </thead>
                        <tbody>
                            {dataWithTax.map((row: AnnualRetirementOutputRow) => (
                                <tr key={row.age} className="bg-white hover:bg-gray-50">
                                    <td className={tdCenterClass}>{row.age}</td>
                                    <td className={tdCenterClass}>{row.policyYear}</td>
                                    <td className={`${tdClass} font-semibold text-red-700 bg-red-50`}>{formatNum(row.totalPremium)}</td>
                                    {showPremiumDetails && <>
                                        <td className={`${tdClass} text-red-700 bg-red-50`}>{formatNum(row.pensionPremium)}</td>
                                        <td className={`${tdClass} text-red-700 bg-red-50`}>{formatNum(row.iWealthyPremium)}</td>
                                    </>}
                                    {retirementTaxInfo && <td className={`${tdClass} bg-teal-50 font-semibold text-teal-700`}>{formatNum(row.taxBenefit)}</td>}
                                    {showTargetColumn && <td className={`${tdClass} bg-yellow-50 font-semibold text-yellow-800`}>{formatNum(row.targetAnnualPension)}</td>}
                                    <td className={`${tdClass} font-semibold text-green-700 bg-green-50`}>{formatNum(row.totalWithdrawal)}</td>
                                    {showPensionDetails && <>
                                        <td className={`${tdClass} text-green-700 bg-green-50`}>{formatNum(row.pensionPayout)}</td>
                                        <td className={`${tdClass} text-green-700 bg-green-50`}>{formatNum(row.iWealthyWithdrawal)}</td>
                                    </>}
                                    <td className={`${tdClass} font-semibold text-blue-700 bg-blue-50`}>{formatNum(row.iWealthyFundValue + row.pensionCSV)}</td>
                                    {showValueDetails && <>
                                        <td className={`${tdClass} text-blue-700 bg-blue-50`}>{formatNum(row.pensionCSV)}</td>
                                        <td className={`${tdClass} text-blue-700 bg-blue-50`}>{formatNum(row.iWealthyFundValue)}</td>
                                    </>}
                                    <td className={`${tdClass} font-semibold text-purple-700 bg-purple-50`}>{formatNum(row.iWealthyDeathBenefit + row.pensionDeathBenefit)}</td>
                                    {showDbDetails && <>
                                        <td className={`${tdClass} text-purple-700 bg-purple-50`}>{formatNum(row.pensionDeathBenefit)}</td>
                                        <td className={`${tdClass} text-purple-700 bg-purple-50`}>{formatNum(row.iWealthyDeathBenefit)}</td>
                                    </>}
                                </tr>
                            ))}
                        </tbody>
                    </>
                );
        }
        
        return retirementFundingMix === 'iWealthyOnly' ? 
            (<>
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                        <th scope="col" className={thClass}>อายุ</th>
                        <th scope="col" className={thClass}>ปีที่</th>
                        <th scope="col" className={`${thClass} bg-red-50`}>เบี้ย iWealthy</th>
                         {retirementTaxInfo && <th scope="col" className={`${thClass} bg-teal-50`}>คืนภาษี</th>}
                        {showTargetColumn && <th scope="col" className={`${thClass} bg-yellow-50`}>บำนาญเป้าหมาย</th>}
                        <th scope="col" className={`${thClass} bg-green-50`}>ถอน (iWealthy)</th>
                        <th scope="col" className={`${thClass} bg-blue-50`}>มูลค่า กธ.</th>
                        <th scope="col" className={`${thClass} bg-purple-50`}>คุ้มครองชีวิต</th>
                    </tr>
                </thead>
                <tbody>
                    {dataWithTax.map(row => (
                        <tr key={row.age} className="bg-white hover:bg-gray-50">
                            <td className={tdCenterClass}>{row.age}</td>
                            <td className={tdCenterClass}>{row.policyYear}</td>
                            <td className={`${tdClass} font-semibold text-red-700 bg-red-50`}>{formatNum(row.iWealthyPremium)}</td>
                             {retirementTaxInfo && <td className={`${tdClass} bg-teal-50 font-semibold text-teal-700`}>{formatNum(row.taxBenefit)}</td>}
                            {showTargetColumn && <td className={`${tdClass} bg-yellow-50 font-semibold text-yellow-800`}>{formatNum(row.targetAnnualPension)}</td>}
                            <td className={`${tdClass} font-semibold text-green-700 bg-green-50`}>{formatNum(row.iWealthyWithdrawal)}</td>
                            <td className={`${tdClass} font-semibold text-blue-700 bg-blue-50`}>{formatNum(row.iWealthyFundValue)}</td>
                            <td className={`${tdClass} font-semibold text-purple-700 bg-purple-50`}>{formatNum(row.iWealthyDeathBenefit)}</td>
                        </tr>
                    ))}
                </tbody>
            </>) : 
            (<>
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                        <th scope="col" className={thClass}>อายุ</th>
                        <th scope="col" className={thClass}>ปีที่</th>
                        <th scope="col" className={`${thClass} bg-red-50`}>เบี้ยบำนาญ</th>
                        {retirementTaxInfo && <th scope="col" className={`${thClass} bg-teal-50`}>คืนภาษี</th>}
                        {showTargetColumn && <th scope="col" className={`${thClass} bg-yellow-50`}>บำนาญเป้าหมาย</th>}
                        <th scope="col" className={`${thClass} bg-green-50`}>บำนาญ (แผน)</th>
                        <th scope="col" className={`${thClass} bg-blue-50`}>มูลค่า กธ. (CSV)</th>
                        <th scope="col" className={`${thClass} bg-purple-50`}>คุ้มครองชีวิต</th>
                    </tr>
                </thead>
                <tbody>
                    {dataWithTax.map(row => (
                        <tr key={row.age} className="bg-white hover:bg-gray-50">
                            <td className={tdCenterClass}>{row.age}</td>
                            <td className={tdCenterClass}>{row.policyYear}</td>
                            <td className={`${tdClass} font-semibold text-red-700 bg-red-50`}>{formatNum(row.pensionPremium)}</td>
                            {retirementTaxInfo && <td className={`${tdClass} bg-teal-50 font-semibold text-teal-700`}>{formatNum(row.taxBenefit)}</td>}
                            {showTargetColumn && <td className={`${tdClass} bg-yellow-50 font-semibold text-yellow-800`}>{formatNum(row.targetAnnualPension)}</td>}
                            <td className={`${tdClass} font-semibold text-green-700 bg-green-50`}>{formatNum(row.pensionPayout)}</td>
                            <td className={`${tdClass} font-semibold text-blue-700 bg-blue-50`}>{formatNum(row.pensionCSV)}</td>
                            <td className={`${tdClass} font-semibold text-purple-700 bg-purple-50`}>{formatNum(row.pensionDeathBenefit)}</td>
                        </tr>
                    ))}
                </tbody>
            </>);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800">ตารางแสดงผลประโยชน์</h2>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setShowTargetColumn(p => !p)} className="flex items-center gap-2 text-sm py-1.5 px-3 border rounded-md hover:bg-gray-100 transition-colors">
                        {showTargetColumn ? <FaMinusCircle className="text-gray-500" /> : <FaBullseye className="text-yellow-600" />}
                        <span>เป้าหมาย</span>
                    </button>
                    <button onClick={retirementTaxInfo ? () => setRetirementTaxInfo(null) : () => setIsTaxModalOpen(true)} className="flex items-center gap-2 text-sm py-1.5 px-3 border rounded-md hover:bg-gray-100 transition-colors">
                        {retirementTaxInfo ? <FaTimesCircle className="text-red-500" /> : <FaReceipt className="text-teal-600" />}
                        <span>คืนภาษี</span>
                        {retirementTaxInfo && <span className="font-bold text-teal-700">({retirementTaxInfo.taxRate}%)</span>}
                    </button>
                    {retirementFundingMix === 'hybrid' && <span className="text-sm font-bold text-indigo-600 px-3 py-1 bg-indigo-100 rounded-full">HYBRID MODE</span>}
                    {retirementFundingMix === 'iWealthyOnly' && <span className="text-sm font-bold text-sky-600 px-3 py-1 bg-sky-100 rounded-full">iWEALTHY ONLY</span>}
                    {retirementFundingMix === 'pensionOnly' && <span className="text-sm font-bold text-emerald-600 px-3 py-1 bg-emerald-100 rounded-full">PENSION ONLY</span>}
                 </div>
            </div>
            <div className="overflow-auto flex-grow">
                <table className="w-full min-w-[900px] text-sm text-left text-gray-600">
                    {renderTableContent()}
                </table>
            </div>
             <RetirementTaxModal
                isOpen={isTaxModalOpen}
                onClose={() => setIsTaxModalOpen(false)}
                onConfirm={(inputs: TaxInfo) => setRetirementTaxInfo(inputs)}
            />
        </div>
    );
};

export default RetirementTablePage;