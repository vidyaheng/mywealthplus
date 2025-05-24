// src/pages/lthc/LthcTablePage.tsx


import { useOutletContext } from 'react-router-dom';
import type { UseLthcPlannerReturn } from '../../hooks/useLthcTypes'; // Import types

// (ในอนาคตจะ Import LHCOutputTable Component ที่จะสร้างขึ้น)
// import LHCOutputTable from './components/LHCOutputTable';


export default function LthcTablePage() {
    const context = useOutletContext<UseLthcPlannerReturn>();
    if (!context) {
        return <div>Loading context or context not available...</div>;
    }

    const { result, isLoading, error } = context; // ดึง result, isLoading, error มาจาก context

    if (isLoading) {
        return <div className="text-center p-4"><p className="text-blue-600 font-semibold">กำลังโหลดข้อมูลตาราง...</p></div>;
    }
    if (error) {
        return <div className="mt-4 p-4 text-red-700 bg-red-100 border border-red-400 rounded-lg"><p className="font-bold">เกิดข้อผิดพลาด:</p><p>{error}</p></div>;
    }
    if (!result || result.length === 0) {
        return <div className="text-center p-4 text-gray-600">ไม่มีข้อมูลผลประโยชน์สำหรับแสดงผล กรุณากลับไปหน้ากรอกข้อมูลแล้วกดคำนวณ</div>;
    }

    return (
        <div className="space-y-6">
            <header className="text-center">
                <h2 className="text-2xl font-bold text-sky-700">ตารางแสดงผลประโยชน์ LTHC Planner</h2>
            </header>
            
            {/* TODO: ในอนาคต ส่วนนี้จะเรียก Component <LHCOutputTable data={result} /> 
                ซึ่ง LHCOutputTable จะมีการจัดการ View 'summary' (เปรียบเทียบ) และ 'full' (รายละเอียด) ภายใน
                และอาจจะมีปุ่มให้สลับมุมมอง หรือ export ข้อมูล
            */}
            {/*<div className="text-sm text-gray-700 mb-2">ตัวอย่างข้อมูลผลลัพธ์ (10 แถวแรก) - (Full View):</div>*/}
            <div className="overflow-y-auto overflow-x-auto shadow-md sm:rounded-lg" style={{ maxHeight: '70vh' }}> {/* <--- SCROLL */}
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-100 sticky top-0 z-10"> {/* <--- Sticky Header */}
                        <tr>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider">ปีที่</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wider">อายุ</th>
                            {/* Health Premiums */}
                            <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider">เบี้ย LR</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider">เบี้ย IHU</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider">เบี้ย MEB</th>
                            <th className="px-3 py-2 text-right font-semibold text-red-600 uppercase tracking-wider">เบี้ยสุขภาพรวม</th>
                            {/* iWealthy Premiums & Details */}
                            <th className="px-3 py-2 text-right font-semibold text-blue-600 uppercase tracking-wider">RPP (iW)</th>
                            <th className="px-3 py-2 text-right font-semibold text-blue-600 uppercase tracking-wider">RTU (iW)</th>
                            <th className="px-3 py-2 text-right font-semibold text-blue-600 uppercase tracking-wider">เบี้ยรวม (iW)</th>
                            <th className="px-3 py-2 text-right font-semibold text-orange-600 uppercase tracking-wider">ถอนจาก iW</th>
                            <th className="px-3 py-2 text-right font-semibold text-green-600 uppercase tracking-wider">มูลค่าสิ้นปี iW (AV)</th>
                            <th className="px-3 py-2 text-right font-semibold text-teal-600 uppercase tracking-wider">มูลค่าเวนคืน iW (CSV)</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider">ทุน iW</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider">คุ้มครอง iW</th>
                            <th className="px-3 py-2 text-right font-semibold text-purple-600 uppercase tracking-wider">คุ้มครองรวม (LR+iW)</th>
                            {/* เพิ่มคอลัมน์สำหรับ "Full View" ของ iWealthy ได้อีก เช่น ค่าใช้จ่าย, ผลตอบแทน */}
            </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {result.map((row) => ( // แสดง 20 แถวแรก
                            <tr key={row.policyYear} className="hover:bg-slate-50">
                                <td className="px-3 py-2 whitespace-nowrap text-center">{row.policyYear}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">{row.age}</td>
                                {/* Health Data */}
                                <td className="px-3 py-2 whitespace-nowrap text-right">{Math.round(row.lifeReadyPremium).toLocaleString()}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right">{Math.round(row.iHealthyUltraPremium).toLocaleString()}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right">{Math.round(row.mebPremium).toLocaleString()}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-red-500">{row.totalHealthPremium.toLocaleString()}</td>
                                {/* iWealthy Data */}
                                <td className="px-3 py-2 whitespace-nowrap text-right text-blue-500">{row.iWealthyRpp !== undefined ? Math.round(row.iWealthyRpp).toLocaleString() : '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-blue-500">{row.iWealthyRtu !== undefined ? Math.round(row.iWealthyRtu).toLocaleString() : '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-blue-700 font-medium">{row.iWealthyTotalPremium !== undefined ? Math.round(row.iWealthyTotalPremium).toLocaleString() : '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-orange-500">{row.iWealthyWithdrawal !== undefined ? Math.round(row.iWealthyWithdrawal).toLocaleString() : '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-green-500">{row.iWealthyEoyAccountValue !== undefined ? Math.round(row.iWealthyEoyAccountValue).toLocaleString() : '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-teal-500">{row.iWealthyEOYCSV !== undefined ? Math.round(row.iWealthyEOYCSV).toLocaleString() : '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right">{row.iWealthySumAssured !== undefined ? Math.round(row.iWealthySumAssured).toLocaleString() : '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right">{row.iWealthyEoyDeathBenefit !== undefined ? Math.round(row.iWealthyEoyDeathBenefit).toLocaleString() : '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-purple-500">{row.totalCombinedDeathBenefit !== undefined ? Math.round(row.totalCombinedDeathBenefit).toLocaleString() : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/*{result.length > 20 && <p className="text-xs text-center mt-2 text-gray-500">... และข้อมูลอื่นๆ อีก {result.length - 20} แถว (แสดงตัวอย่างสูงสุด 20 แถว)</p>}*/}
        </div>
    );
}