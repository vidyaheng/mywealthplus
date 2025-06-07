// src/components/ci/CITablePage.tsx

// --- Imports ---
import { useState } from 'react';
import type { AnnualCiOutputRow, AnnualCiPremiumDetail } from '@/components/ci/types/useCiTypes';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatNumber } from '@/components/ci/utils/helpers';


// --- Interface ---
// 1. รับ props เข้ามาครบถ้วน
interface CITablePageProps {
    resultData: AnnualCiOutputRow[];
    ciPremiumsScheduleData: AnnualCiPremiumDetail[] | null;
    useIWealthy: boolean;
    showCiOnlyView: boolean;
    withdrawalStartAge: number;
}

// --- Component Definition ---
export default function CITablePage({
    resultData,
    ciPremiumsScheduleData,
    useIWealthy,
    showCiOnlyView,
    withdrawalStartAge
}: CITablePageProps) {

    console.log("ค่า withdrawalStartAge ที่ CITablePage ได้รับ:", withdrawalStartAge);
    // สร้างตัวแปร isIWealthyMode เพื่อให้เงื่อนไขอ่านง่ายขึ้น
    const isIWealthyMode = useIWealthy;

    // --- คำนวณผลรวมสำหรับตารางที่ 1 (ตารางเบี้ย CI) ---
const ciPremiumTotals = (ciPremiumsScheduleData ?? []).reduce(
    (acc, row) => {
        acc.lifeReady += row.lifeReadyPremium ?? 0;
        acc.icare += row.icarePremium ?? 0;
        acc.ishield += row.ishieldPremium ?? 0;
        acc.rokrai += row.rokraiPremium ?? 0;
        acc.dci += row.dciPremium ?? 0;
        acc.total += row.totalCiPremium ?? 0;
        return acc;
    },
    { lifeReady: 0, icare: 0, ishield: 0, rokrai: 0, dci: 0, total: 0 }
);

    // --- 👇 ขั้นตอนที่ 1: เตรียม State และคำนวณผลรวมสำหรับตาราง iWealthy ---

    // State สำหรับสลับการแสดงคอลัมน์ RPP/RTU
    const [showRppRtu, setShowRppRtu] = useState<boolean>(false);

    // คำนวณผลรวมสำหรับแถวสรุป (Footer) ใหม่ทั้งหมด
    const iWealthyTotals = resultData.reduce(
        (acc, row) => {
            if (row.age < withdrawalStartAge) {
                acc.totalCIPaid += row.totalCiPackagePremiumPaid ?? 0;
            }
            acc.rpp += row.iWealthyRpp ?? 0;
            acc.rtu += row.iWealthyRtu ?? 0;
            acc.totalIWealthyPaid += row.iWealthyTotalPremium ?? 0;
            acc.totalWithdrawal += row.iWealthyWithdrawal ?? 0;
            return acc;
        },
        { totalCIPaid: 0, rpp: 0, rtu: 0, totalIWealthyPaid: 0, totalWithdrawal: 0 }
    );


    return (
        <div className="space-y-8 mt-4">

            {/* 🔥 ตารางที่ 1: สรุปเบี้ยประกันภัย CI (ฉบับอัปเดต) */}
            {/* เงื่อนไขการแสดงผลเหมือนเดิม */}
            {(!isIWealthyMode || showCiOnlyView) && ciPremiumsScheduleData && ciPremiumsScheduleData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>สรุปเบี้ยประกันภัยโรคร้ายแรง (CI) ต่อปี</CardTitle>
                    </CardHeader>
                    {/* 1. ทำให้ CardContent scroll ได้ และกำหนดความสูง */}
                    <CardContent className="overflow-y-auto h-[600px] relative">
                        <Table>
                            {/* 2. ทำให้ Header ติดหนึบ (Sticky) */}
                            <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                                <TableRow>
                                    <TableHead className="text-center">ปีที่</TableHead>
                                    <TableHead className="text-center">อายุ</TableHead>
                                    <TableHead className="text-right">เบี้ย LifeReady</TableHead>
                                    <TableHead className="text-right">เบี้ย iCare</TableHead>
                                    <TableHead className="text-right">เบี้ย iShield</TableHead>
                                    <TableHead className="text-right">เบี้ย RokRaiฯ</TableHead>
                                    <TableHead className="text-right">เบี้ย DCI</TableHead>
                                    <TableHead className="text-right font-semibold">เบี้ย CI รวมต่อปี</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ciPremiumsScheduleData.map(row => (
                                    <TableRow key={`ci-${row.policyYear}-${row.age}`}>
                                        <TableCell className="text-center">{row.policyYear}</TableCell>
                                        <TableCell className="text-center">{row.age}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.lifeReadyPremium)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.icarePremium)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.ishieldPremium)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.rokraiPremium)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.dciPremium)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatNumber(row.totalCiPremium)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            {/* 3. เพิ่มส่วนท้ายตาราง (Table Footer) สำหรับผลรวม */}
                            <TableFooter className="sticky bottom-0 bg-white dark:bg-slate-900 font-bold">
                                <TableRow>
                                    <TableCell colSpan={2}>ผลรวมตลอดสัญญา</TableCell>
                                    <TableCell className="text-right">{formatNumber(ciPremiumTotals.lifeReady)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(ciPremiumTotals.icare)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(ciPremiumTotals.ishield)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(ciPremiumTotals.rokrai)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(ciPremiumTotals.dci)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(ciPremiumTotals.total)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            )}

           {/* 🔥 ตารางที่ 2: ภาพรวมผลประโยชน์ CI และ iWealthy (ฉบับแก้ไขใหม่ทั้งหมด) */}
            {isIWealthyMode && !showCiOnlyView && resultData && resultData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>ภาพรวมผลประโยชน์ CI และ iWealthy (รายปี)</CardTitle>
                    </CardHeader>
                    {/* 2. ทำให้ CardContent scroll ได้ และสูง 600px */}
                    <CardContent className="relative h-[600px] overflow-y-auto">
                        <Table>
                            {/* 3. ทำให้ Header ติดหนึบ และมีพื้นหลังทึบ */}
                            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                                <TableRow>
                                    <TableHead className="text-center w-[60px]">ปีที่</TableHead>
                                    <TableHead className="text-center w-[60px]">อายุ</TableHead>
                                    <TableHead className="text-right">เบี้ย CI รวม</TableHead>
                                    
                                    {/* 4. แสดงคอลัมน์ RPP/RTU แบบไดนามิก */}
                                    {showRppRtu && (
                                        <>
                                            <TableHead className="text-right">iWealthy RPP</TableHead>
                                            <TableHead className="text-right">iWealthy RTU</TableHead>
                                        </>
                                    )}

                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span>เบี้ยรวม iWealthy</span>
                                            {/* ปุ่มสำหรับ Expand/Collapse คอลัมน์ */}
                                            <button 
                                                onClick={() => setShowRppRtu(prev => !prev)} 
                                                className="h-5 w-5 rounded-full border flex items-center justify-center text-blue-500 hover:bg-muted"
                                                title={showRppRtu ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
                                            >
                                                {showRppRtu ? '−' : '+'}
                                            </button>
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-right">ถอนจาก iWealthy</TableHead>
                                    <TableHead className="text-right font-semibold">มูลค่าบัญชี iWealthy</TableHead>
                                    <TableHead className="text-right font-semibold">ผลประโยชน์เสียชีวิตรวม</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resultData.map(row => (
                                    <TableRow key={`res-${row.policyYear}`}>
                                        <TableCell className="text-center">{row.policyYear}</TableCell>
                                        <TableCell className="text-center">{row.age}</TableCell>
                                        <TableCell className="text-right">
                                            {row.age < withdrawalStartAge ? formatNumber(row.totalCiPackagePremiumPaid) : '-'}
                                        </TableCell>
                                        
                                        {/* 5. แสดง Cell ของ RPP/RTU แบบไดนามิก */}
                                        {showRppRtu && (
                                            <>
                                                <TableCell className="text-right text-muted-foreground">{formatNumber(row.iWealthyRpp)}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatNumber(row.iWealthyRtu)}</TableCell>
                                            </>
                                        )}

                                        <TableCell className="text-right">{formatNumber(row.iWealthyTotalPremium)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.iWealthyWithdrawal)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatNumber(Math.round(row.iWealthyEoyAccountValue ?? 0))}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatNumber(row.totalCombinedDeathBenefit)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            {/* 6. ส่วนท้ายตารางที่ติดหนึบและแสดงผลรวมไดนามิก */}
                            <TableFooter className="sticky bottom-0 z-10 bg-background/95 font-bold">
                                <TableRow>
                                    <TableCell colSpan={2}>ผลรวม</TableCell>
                                    <TableCell className="text-right">{formatNumber(iWealthyTotals.totalCIPaid)}</TableCell>

                                    {showRppRtu && (
                                        <>
                                            <TableCell className="text-right">{formatNumber(iWealthyTotals.rpp)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(iWealthyTotals.rtu)}</TableCell>
                                        </>
                                    )}

                                    <TableCell className="text-right">{formatNumber(iWealthyTotals.totalIWealthyPaid)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(iWealthyTotals.totalWithdrawal)}</TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}