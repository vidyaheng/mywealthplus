// src/pages/lthc/LthcTablePage.tsx
import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { UseLthcPlannerReturn, AnnualLTHCOutputRow } from '../../hooks/useLthcTypes';
import { PlusCircle, MinusCircle } from 'lucide-react';
// (SVG Icons - คุณสามารถหา SVG icons ที่เหมาะสม หรือใช้ตัวอักษรไปก่อน)
// const PlusCircleIcon = () => <svg className="w-4 h-4" ...>+</svg>;
// const MinusCircleIcon = () => <svg className="w-4 h-4" ...>-</svg>;

export default function LthcTablePage() {
    const context = useOutletContext<UseLthcPlannerReturn>();
    if (!context) {
        return <div className="p-4 text-center text-gray-600">กำลังโหลด Context...</div>;
    }

    const {
        result, isLoading, error,
        selectedHealthPlans, // สำหรับ getPlanDisplayName
        policyOriginMode,    // สำหรับ getPlanDisplayName และ logic อื่นๆ
        iWealthyMode,        // สำหรับหา withdrawal start age ถ้าเป็น auto
        manualWithdrawalStartAge, // สำหรับ manual mode
        autoIWealthyPPT,          // สำหรับคำนวณ withdrawal start age ใน auto mode
        policyholderEntryAge      // สำหรับคำนวณ withdrawal start age ใน auto mode
    } = context;

    const [isHealthDetailsExpanded, setIsHealthDetailsExpanded] = useState<boolean>(false);
    // ⭐ State ใหม่สำหรับตารางที่ 2 ⭐
    const [isIWealthyPremiumExpanded, setIsIWealthyPremiumExpanded] = useState<boolean>(false);
    const [isIWealthyValueDetailsExpanded, setIsIWealthyValueDetailsExpanded] = useState<boolean>(false);

    // ฟังก์ชันสร้างชื่อแผนสำหรับหัวตาราง
    const getPlanDisplayName = () => {
        let lrDisplay = `LR ${selectedHealthPlans.lifeReadySA.toLocaleString()}/${selectedHealthPlans.lifeReadyPPT === 99 ? '99' : selectedHealthPlans.lifeReadyPPT + 'ปี'}`;
        if (policyOriginMode === 'existingPolicy') {
            lrDisplay += " (แผนเดิม)";
        }

        const ihuDisplay = selectedHealthPlans.iHealthyUltraPlan && selectedHealthPlans.iHealthyUltraPlan !== null
            ? `${selectedHealthPlans.iHealthyUltraPlan}` // แสดงเฉพาะชื่อแผน IHU
            : "";

        const mebDisplay = selectedHealthPlans.mebPlan && selectedHealthPlans.mebPlan !== null && selectedHealthPlans.mebPlan !== null
            ? `MEB ${selectedHealthPlans.mebPlan.toLocaleString()}`
            : "";

        const parts = [lrDisplay, ihuDisplay, mebDisplay].filter(Boolean); // กรองค่าว่างออก
        return parts.join(' + ');
    };

    // คำนวณอายุที่เริ่มถอนเงินจาก iWealthy
    const withdrawalStartAge = useMemo(() => {
        if (iWealthyMode === 'manual') {
            return manualWithdrawalStartAge;
        } else { // automatic
            // Logic การคำนวณอายุเริ่มถอนอัตโนมัติ (เหมือนใน useLthcCalculations)
            let startAge = 61;
            const iWealthyPTTEndAge = policyholderEntryAge + autoIWealthyPPT -1;
            if (iWealthyPTTEndAge >= 61) {
                startAge = iWealthyPTTEndAge + 1;
            }
            return startAge;
        }
    }, [iWealthyMode, manualWithdrawalStartAge, policyholderEntryAge, autoIWealthyPPT]);

    // ⭐⭐⭐ คำนวณค่าสำหรับส่วนสรุป ⭐⭐⭐
    const summaryValues = useMemo(() => {
        if (!result || result.length === 0) {
            return {
                totalHealthPremiumIfPaidAlone: 0,
                lthcHealthPremiumPaidByUser: 0,
                lthcTotalIWealthyPremiumPaid: 0,
                lthcTotalCombinedPremiumPaid: 0,
                lthcTotalWithdrawalFromIWealthy: 0,
            };
        }

        let totalHealthPremiumIfPaidAlone = 0;
        let lthcHealthPremiumPaidByUser = 0;
        let lthcTotalIWealthyPremiumPaid = 0;
        let lthcTotalWithdrawalFromIWealthy = 0;

        result.forEach(row => {
            totalHealthPremiumIfPaidAlone += (row.totalHealthPremium || 0);

            if (row.age < withdrawalStartAge) {
                lthcHealthPremiumPaidByUser += (row.totalHealthPremium || 0);
            }
            lthcTotalIWealthyPremiumPaid += (row.iWealthyTotalPremium || 0);
            lthcTotalWithdrawalFromIWealthy += (row.iWealthyWithdrawal || 0);
        });

        const lthcTotalCombinedPremiumPaid = lthcHealthPremiumPaidByUser + lthcTotalIWealthyPremiumPaid;

        return {
            totalHealthPremiumIfPaidAlone,
            lthcHealthPremiumPaidByUser,
            lthcTotalIWealthyPremiumPaid,
            lthcTotalCombinedPremiumPaid,
            lthcTotalWithdrawalFromIWealthy,
        };
    }, [result, withdrawalStartAge]);
    // ⭐⭐⭐ จบส่วนคำนวณค่าสรุป ⭐⭐⭐

    if (isLoading) return <div className="p-4 text-center">กำลังโหลดข้อมูลตาราง...</div>;
    if (error) return <div className="p-4 text-red-600">เกิดข้อผิดพลาด: {error}</div>;
    if (!result || result.length === 0) return <div className="p-4 text-center text-gray-500">ไม่มีข้อมูลผลประโยชน์สำหรับแสดงผล กรุณากลับไปหน้ากรอกข้อมูลแล้วกดคำนวณ</div>;

    // 1. ดึงชื่อแผน iHealthy Ultra (ถ้ายังไม่มีใน scope)
    const iHealthyPlanName = selectedHealthPlans?.iHealthyUltraPlan;

    // 2. คำนวณ colSpans สำหรับแถวบนสุด
    const healthPlanHeaderColSpan = isHealthDetailsExpanded ? 5 : 2;

    let lthcHeaderColSpan = 1; // เบี้ยสุขภาพ (iWealthy text)
    lthcHeaderColSpan += isIWealthyPremiumExpanded ? 3 : 1; // กลุ่ม เบี้ย iW
    lthcHeaderColSpan += 1; // เงินถอน
    lthcHeaderColSpan += isIWealthyValueDetailsExpanded ? 6 : 1; // กลุ่ม มูลค่า กธ
    lthcHeaderColSpan += 1; // คุ้มครองชีวิตรวม

    // สร้าง Suffix สำหรับชื่อแผน
    const planNameSuffix = iHealthyPlanName ? ` (${iHealthyPlanName})` : "";

    return (
        <div className="space-y-8">
            {/* ⭐⭐⭐ ตารางเดียวใหญ่ ⭐⭐⭐ */}
            <div>
                <h2 className="text-xl font-semibold mb-1 text-sky-700">
                    ตารางผลประโยชน์แผนสุขภาพครบวงจร (LTHC Planner)
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                    แผนสุขภาพพที่เลือก: {getPlanDisplayName()}
                </p>
                <div className="overflow-x-auto shadow-md sm:rounded-lg border border-gray-200" style={{ maxHeight: '70vh' }}>
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            {/* แถวที่ 1: หัวข้อแบบ Spanning ตามที่ขอ */}
                            <tr>
                                {/* ช่องว่างสำหรับ "ปีที่" */}
                                <th scope="col" className="px-2 py-3 bg-gray-50"></th>
                                {/* ช่องว่างสำหรับ "อายุ" */}
                                <th scope="col" className="px-2 py-3 bg-gray-50"></th>

                                {/* SPACER COLUMN ในแถวที่ 1 (ไม่มีสีพื้นหลัง) */}
                                <th scope="col" className="px-1 py-3"></th> {/* ลด padding แนวนอนเล็กน้อยเพื่อให้ดูเป็น spacer */}

                                {/* หัวข้อ "แผน สุขภาพ (ชื่อแผนที่เลือก)" */}
                                <th
                                    scope="col"
                                    colSpan={healthPlanHeaderColSpan}
                                    className="px-2 py-3 text-center text-sm font-semibold text-sky-700 uppercase tracking-wider bg-sky-50" // ปรับสีตามต้องการ
                                >
                                    แผน สุขภาพ{planNameSuffix}
                                </th>

                                {/* SPACER COLUMN ในแถวที่ 1 (ไม่มีสีพื้นหลัง) */}
                                <th scope="col" className="px-1 py-3"></th> {/* ลด padding แนวนอนเล็กน้อยเพื่อให้ดูเป็น spacer */}

                                {/* หัวข้อ "แผนสุขภาพ LTHC" */}
                                <th
                                    scope="col"
                                    colSpan={lthcHeaderColSpan}
                                    className="px-2 py-3 text-center text-sm font-semibold text-purple-700 uppercase tracking-wider bg-purple-50" // ปรับสีตามต้องการ
                                >
                                    แผนสุขภาพ LTHC
                                </th>
                            </tr>

                            {/* แถวที่ 2: หัวคอลัมน์เดิม */}
                            <tr>
                                {/* Common Columns */}
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">ปีที่</th>
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">อายุ</th>
                                
                                {/* SPACER COLUMN ในแถวที่ 2 (ไม่มีสีพื้นหลัง) */}
                                <th scope="col" className="px-1 py-3 bg-gray-100"></th> {/* ลด padding แนวนอนเล็กน้อย */}

                                {/* Health Premium Details (Expandable) */}
                                {isHealthDetailsExpanded && (
                                    <>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-sky-50">เบี้ย LR</th>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-sky-50">เบี้ย IHU</th>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-sky-50">เบี้ย MEB</th>
                                    </>
                                )}
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-red-600 uppercase tracking-wider whitespace-nowrap bg-sky-50">
                                    {/*</th><th scope="col" className="relative px-1 py-3 text-center sticky right-[564px] md:right-[calc(3*100px+2*80px)] bg-gray-100 z-20"> {/* Adjust 'right' value based on actual width of subsequent fixed columns */}
                                    <div className="flex flex-col items-center">
                                        <span>เบี้ยสุขภาพ</span>
                                        <button onClick={() => setIsHealthDetailsExpanded(!isHealthDetailsExpanded)} className="p-0.5 rounded-full hover:bg-gray-300 focus:outline-none" title={isHealthDetailsExpanded ? "ยุบ" : "ขยาย"}>
                                            {isHealthDetailsExpanded ? <MinusCircle size={16} /> : <PlusCircle size={16} />}
                                        </button>
                                    </div>
                                </th>
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider whitespace-nowrap bg-sky-50">คุ้มครองชีวิต</th>    

                                {/* SPACER COLUMN ในแถวที่ 2 (ไม่มีสีพื้นหลัง) */}
                                <th scope="col" className="px-1 py-3 bg-gray-100"></th> {/* ลด padding แนวนอนเล็กน้อย */}

                                {/* iWealthy Section */}
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-red-500 uppercase tracking-wider whitespace-nowrap bg-purple-50">เบี้ยสุขภาพ</th>

                                {isIWealthyPremiumExpanded && (
                                    <>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-purple-50">RPP (iW)</th>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-purple-50">RTU (iW)</th>
                                        {/* LSTU column can be added here if iWealthyTotalPremium doesn't include it */}
                                    </>
                                )}
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider whitespace-nowrap bg-purple-50">
                                    <div className="flex flex-col items-center">
                                        <span>เบี้ย iW</span>
                                        <button onClick={() => setIsIWealthyPremiumExpanded(!isIWealthyPremiumExpanded)} className="p-0.5 rounded-full hover:bg-gray-300 focus:outline-none" title={isIWealthyPremiumExpanded ? "ยุบ" : "ขยาย"}>
                                            {isIWealthyPremiumExpanded ? <MinusCircle size={16} /> : <PlusCircle size={16} />}
                                        </button>
                                    </div>
                                </th>
                                


                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-orange-600 uppercase tracking-wider whitespace-nowrap bg-purple-50 sticky right-[156px] md:right-[80px] z-20">เงินถอน</th>

                                {isIWealthyValueDetailsExpanded && (
                                    <>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-purple-50">ค่าธรรมเนียม</th>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-purple-50">COI</th>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-purple-50">AdFEE</th>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-purple-50">ผลตอบแทน</th>
                                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-purple-50">Bonus</th>
                                    </>
                                )}
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider whitespace-nowrap bg-purple-50 sticky right-[80px] md:right-0 z-20">
                                    <div className="flex flex-col items-center">
                                        <span>มูลค่า กธ</span>
                                        <button onClick={() => setIsIWealthyValueDetailsExpanded(!isIWealthyValueDetailsExpanded)} className="p-0.5 rounded-full hover:bg-gray-300 focus:outline-none" title={isIWealthyValueDetailsExpanded ? "ยุบ" : "ขยาย"}>
                                            {isIWealthyValueDetailsExpanded ? <MinusCircle size={16} /> : <PlusCircle size={16} />}
                                        </button>
                                    </div>
                                </th>
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider whitespace-nowrap bg-purple-50">คุ้มครองชีวิตรวม</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {result.map((row: AnnualLTHCOutputRow) => {
                                const healthPremiumPaidByUser = row.age < withdrawalStartAge ? (row.totalHealthPremium || 0) : 0;
                                return (
                                    <tr key={`lthc-${row.policyYear}`} className="hover:bg-slate-50">
                                        <td className="px-2 py-2 whitespace-nowrap text-center">{row.policyYear}</td>
                                        <td className="px-2 py-2 whitespace-nowrap text-center">{row.age}</td>
                                        
                                        {/* SPACER CELL in tbody */}
                                        <td className="px-1 py-2 bg-gray-100"></td> {/* ใช้ padding แนวนอนเท่ากับ spacer ใน header */}

                                        {isHealthDetailsExpanded && (
                                            <>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{Math.round(row.lifeReadyPremium).toLocaleString()}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{Math.round(row.iHealthyUltraPremium).toLocaleString()}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{Math.round(row.mebPremium).toLocaleString()}</td>
                                            </>
                                        )}
                                        <td className="px-2 py-2 whitespace-nowrap text-center font-semibold text-red-500">{Math.round(row.totalHealthPremium).toLocaleString()}</td>
                                        <td className="px-2 py-2 whitespace-nowrap text-center font-semibold text-purple-500">{Math.round(row.lifeReadyDeathBenefit).toLocaleString()}</td>
                                        
                                        {/* SPACER CELL in tbody */}
                                        <td className="px-1 py-2 bg-gray-100"></td> {/* ใช้ padding แนวนอนเท่ากับ spacer ใน header */}

                                        <td className="px-2 py-2 whitespace-nowrap text-center font-semibold text-red-500">{Math.round(healthPremiumPaidByUser).toLocaleString()}</td>

                                        {isIWealthyPremiumExpanded && (
                                            <>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{row.iWealthyRpp !== undefined ? Math.round(row.iWealthyRpp).toLocaleString() : '-'}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{row.iWealthyRtu !== undefined ? Math.round(row.iWealthyRtu).toLocaleString() : '-'}</td>
                                                {/* LSTU data cell */}
                                            </>
                                        )}
                                        <td className="px-2 py-2 whitespace-nowrap text-center font-medium text-blue-500">{row.iWealthyTotalPremium !== undefined ? Math.round(row.iWealthyTotalPremium).toLocaleString() : '-'}</td>
                                        


                                        <td className="px-2 py-2 whitespace-nowrap text-center text-orange-500">{row.iWealthyWithdrawal !== undefined ? Math.round(row.iWealthyWithdrawal).toLocaleString() : '-'}</td>

                                        {isIWealthyValueDetailsExpanded && (
                                            <>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{row.iWealthyPremChargeTotal !== undefined ? Math.round(row.iWealthyPremChargeTotal).toLocaleString() : '-'}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{row.iWealthyCOI !== undefined ? Math.round(row.iWealthyCOI).toLocaleString() : '-'}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{row.iWealthyAdminFee !== undefined ? Math.round(row.iWealthyAdminFee).toLocaleString() : '-'}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{row.iWealthyInvestmentReturn !== undefined ? Math.round(row.iWealthyInvestmentReturn).toLocaleString() : '-'}</td>
                                                <td className="px-2 py-2 whitespace-nowrap text-center">{row.iWealthyRoyaltyBonus !== undefined ? Math.round(row.iWealthyRoyaltyBonus).toLocaleString() : '-'}</td>
                                            </>
                                        )}
                                        <td className="px-2 py-2 whitespace-nowrap text-center font-semibold text-green-500">{row.iWealthyEoyAccountValue !== undefined ? Math.round(row.iWealthyEoyAccountValue).toLocaleString() : '-'}</td>
                                        <td className="px-2 py-2 whitespace-nowrap text-center font-semibold text-purple-500">{row.totalCombinedDeathBenefit !== undefined ? Math.round(row.totalCombinedDeathBenefit).toLocaleString() : '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ⭐⭐⭐ ส่วนสรุปท้ายตาราง ⭐⭐⭐ */}
            {result && result.length > 0 && ( // แสดงส่วนสรุปเมื่อมีผลลัพธ์
                <section className="mt-8 p-6 border-t-2 border-sky-600 bg-slate-50 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">สรุปผลประโยชน์โดยรวม:</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="p-4 bg-white rounded shadow border border-gray-200">
                            <h3 className="font-semibold text-gray-600 mb-1">กรณีจ่ายเบี้ยสุขภาพเองทั้งหมด (โดยไม่มี iWealthy):</h3>
                            <p>เบี้ยประกันสุขภาพรวมตลอดสัญญา:
                                <span className="font-bold text-rose-600 ml-2">
                                    {Math.round(summaryValues.totalHealthPremiumIfPaidAlone).toLocaleString()} บาท
                                </span>
                            </p>
                        </div>

                        <div className="p-4 bg-white rounded shadow border border-gray-200 space-y-1">
                            <h3 className="font-semibold text-gray-600 mb-1">กรณีใช้แผน LTHC (iWealthy ช่วยจ่ายเบี้ยสุขภาพ):</h3>
                            <p>เบี้ยสุขภาพที่จ่ายเอง (ถึงปีก่อนเริ่มถอนจาก iWealthy):
                                <span className="font-bold text-sky-600 ml-2">
                                    {Math.round(summaryValues.lthcHealthPremiumPaidByUser).toLocaleString()} บาท
                                </span>
                            </p>
                            <p>เบี้ย iWealthy ที่จ่ายรวมทั้งหมด:
                                <span className="font-bold text-blue-600 ml-2">
                                    {Math.round(summaryValues.lthcTotalIWealthyPremiumPaid).toLocaleString()} บาท
                                </span>
                            </p>
                            <p className="text-gray-800 font-medium border-t pt-1 mt-1">รวมเบี้ยที่จ่ายทั้งหมดสำหรับแผน LTHC:
                                <span className="font-bold text-emerald-600 ml-2">
                                    {Math.round(summaryValues.lthcTotalCombinedPremiumPaid).toLocaleString()} บาท
                                </span>
                            </p>
                            <p className="text-gray-800 font-medium border-t pt-1 mt-1">รวมเงินที่ถอนจาก iWealthy เพื่อจ่ายเบี้ยสุขภาพ:
                                <span className="font-bold text-orange-600 ml-2">
                                    {Math.round(summaryValues.lthcTotalWithdrawalFromIWealthy).toLocaleString()} บาท
                                </span>
                            </p>
                        </div>
                    </div>
                </section>
            )}
            {/* ⭐⭐⭐ จบส่วนสรุปท้ายตาราง ⭐⭐⭐ */}
        </div>
    );
}

