// src/components/ci/CITablePage.tsx

import { useState } from 'react';

// --- Imports ---
import type { UseCiPlannerReturn } from '@/components/ci/types/useCiTypes';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatNumber } from '@/components/ci/utils/helpers';

// --- Props Interface ---
type CITablePageProps = Pick<
    UseCiPlannerReturn,
    'isLoading' | 'error' | 'result' | 'ciPremiumsSchedule' | 'useIWealthy' | 'iWealthyWithdrawalStartAge'
>;

// --- Component Definition ---
export default function CITablePage({
    isLoading,
    error,
    result,
    ciPremiumsSchedule,
    useIWealthy,
    iWealthyWithdrawalStartAge
}: CITablePageProps) {

    // --- State Management for UI Interaction ---
    const [showCiOnlyView, setShowCiOnlyView] = useState(false);
    const [showRppRtu, setShowRppRtu] = useState<boolean>(false);

    // --- Render Guards ---
    if (isLoading) {
        return <div className="flex justify-center items-center h-full min-h-[600px]">กำลังโหลดข้อมูลตาราง...</div>;
    }
    if (error) {
        return <div className="flex justify-center items-center h-full min-h-[600px] text-red-600">เกิดข้อผิดพลาด: {error}</div>;
    }
    if (!result) {
        return (
            <div className="flex justify-center items-center h-full min-h-[600px] text-muted-foreground">
                <p>ไม่มีข้อมูลสำหรับแสดงผล กรุณากด "คำนวณ" ที่หน้ากรอกข้อมูล</p>
            </div>
        );
    }

    // --- Pre-render Calculations for Totals ---
    const ciPremiumTotals = (ciPremiumsSchedule ?? []).reduce(
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

    const iWealthyTotals = result.reduce(
        (acc, row) => {
            if (row.age < iWealthyWithdrawalStartAge) {
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

    // --- Render Variables ---
    const isIWealthyMode = useIWealthy;
    const toggleLabel = showCiOnlyView ? 'แสดงตาราง iWealthy' : 'แสดงตารางเบี้ย CI';

    return (
        <div className="space-y-8">
            
            {/* ตารางที่ 1: สรุปเบี้ยประกันภัย CI */}
            {(!isIWealthyMode || showCiOnlyView) && ciPremiumsSchedule && ciPremiumsSchedule.length > 0 && (
                <Card className="bg-white dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-blue-800 dark:text-blue-200">สรุปเบี้ยประกันภัยโรคร้ายแรง (CI) ต่อปี</CardTitle>
                            {isIWealthyMode && (
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="view-toggle-ci" className="text-sm font-normal">{toggleLabel}</Label>
                                    <Switch 
                                        id="view-toggle-ci" 
                                        checked={showCiOnlyView} 
                                        onCheckedChange={setShowCiOnlyView}
                                        className="data-[state=checked]:bg-blue-600"
                                    />
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="relative h-[600px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-blue-100/80 dark:bg-blue-900/80 backdrop-blur">
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
                                {ciPremiumsSchedule.map(row => (
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
                            <TableFooter className="sticky bottom-0 bg-blue-100/80 dark:bg-blue-900/80 font-bold">
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

            {/* ตารางที่ 2: ภาพรวมผลประโยชน์ CI และ iWealthy */}
            {isIWealthyMode && !showCiOnlyView && result && result.length > 0 && (
                <Card className="bg-white dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-blue-800 dark:text-blue-200">ภาพรวมผลประโยชน์ CI และ iWealthy</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="view-toggle-iwealthy" className="text-sm font-normal">{toggleLabel}</Label>
                                <Switch id="view-toggle-iwealthy" checked={showCiOnlyView} onCheckedChange={setShowCiOnlyView} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative h-[600px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-blue-100/80 dark:bg-blue-900/80 backdrop-blur">
                                <TableRow>
                                    <TableHead className="text-center w-[60px]">ปีที่</TableHead>
                                    <TableHead className="text-center w-[60px]">อายุ</TableHead>
                                    <TableHead className="text-right">เบี้ย CI รวม</TableHead>
                                    {showRppRtu && (
                                        <>
                                            <TableHead className="text-right">iWealthy RPP</TableHead>
                                            <TableHead className="text-right">iWealthy RTU</TableHead>
                                        </>
                                    )}
                                    <TableHead className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span>เบี้ยรวม iWealthy</span>
                                            <button onClick={() => setShowRppRtu(prev => !prev)} className="h-5 w-5 rounded-full border flex items-center justify-center text-blue-500 hover:bg-muted" title={showRppRtu ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}>
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
                                {result.map(row => (
                                    <TableRow key={`res-${row.policyYear}-${row.age}`}>
                                        <TableCell className="text-center">{row.policyYear}</TableCell>
                                        <TableCell className="text-center">{row.age}</TableCell>
                                        <TableCell className="text-right">
                                            {row.age < iWealthyWithdrawalStartAge ? formatNumber(row.totalCiPackagePremiumPaid) : '0'}
                                        </TableCell>
                                        {showRppRtu && (
                                            <>
                                                <TableCell className="text-right text-muted-foreground">{formatNumber(row.iWealthyRpp)}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatNumber(row.iWealthyRtu)}</TableCell>
                                            </>
                                        )}
                                        <TableCell className="text-right">{formatNumber(row.iWealthyTotalPremium)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(row.iWealthyWithdrawal)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatNumber(Math.round(row.iWealthyEoyAccountValue ?? 0))}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatNumber(Math.round(row.totalCombinedDeathBenefit ?? 0))}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter className="sticky bottom-0 bg-blue-100/80 dark:bg-blue-900/80 font-bold">
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