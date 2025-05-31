//import React from "react";
import { AnnualCalculationOutputRow } from "../lib/calculations";

export type AnnualTableView = 'compact' | 'full';

interface DisplayTableProps {
  data: AnnualCalculationOutputRow[];
  viewMode: AnnualTableView;
  showCsv: boolean;
  formatNumber: (num: number | undefined | null) => string;
  caption?: string;
  className?: string;
}

export default function DisplayTable({
  data,
  viewMode,
  showCsv,
  formatNumber,
  //caption = "ตารางสรุปผลประโยชน์โดยประมาณ",
  className
}: DisplayTableProps) {

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        ไม่มีข้อมูลสำหรับแสดงในตาราง
      </div>
    );
  }

  const totals = data.reduce((acc, row) => {
    acc.premiumRPPYear += row.premiumRPPYear || 0;
    acc.premiumRTUYear += row.premiumRTUYear || 0;
    acc.premiumLSTUYearGross += row.premiumLSTUYearGross || 0;
    acc.totalPremiumYear += row.totalPremiumYear || 0;
    acc.premiumChargeRPPYear += row.premiumChargeRPPYear || 0;
    acc.premiumChargeRTUYear += row.premiumChargeRTUYear || 0;
    acc.totalPremiumChargeYear += row.totalPremiumChargeYear || 0;
    acc.totalCOIYear += row.totalCOIYear || 0;
    acc.totalAdminFeeYear += row.totalAdminFeeYear || 0;
    acc.totalFeesYear += row.totalFeesYear || 0;
    acc.investmentReturnYear += row.investmentReturnYear || 0;
    acc.royaltyBonusYear += row.royaltyBonusYear || 0;
    acc.withdrawalYear += row.withdrawalYear || 0;
    return acc;
  }, {
    premiumRPPYear: 0,
    premiumRTUYear: 0,
    premiumLSTUYearGross: 0,
    totalPremiumYear: 0,
    premiumChargeRPPYear: 0,
    premiumChargeRTUYear: 0,
    totalPremiumChargeYear: 0,
    totalCOIYear: 0,
    totalAdminFeeYear: 0,
    totalFeesYear: 0,
    investmentReturnYear: 0,
    royaltyBonusYear: 0,
    withdrawalYear: 0,
  });

  const headerCellStickyBg = "bg-slate-100 dark:bg-slate-800";
  const footerCellStickyBg = "bg-slate-200 dark:bg-slate-700";

// Default classes for table cells from Shadcn UI (example)
  const thBaseClass = "h-10 px-3 align-middle font-medium text-muted-foreground text-xs"; // ปรับ padding ตามความเหมาะสม
  const tdBaseClass = "p-2 align-middle text-xs"; // ปรับ padding

  return (
    <div className={`overflow-x-auto overflow-y-auto relative ${className || ''} max-h-[600px]`}>
      <table className="min-w-full border-collapse text-xs"> {/* เพิ่ม text-xs ให้ table เพื่อให้ default */}
        {/*caption && <caption className="mt-4 text-sm text-muted-foreground">{caption}</caption>*/}
        <thead className={`sticky top-0 z-10 ${headerCellStickyBg}`}> {/* ทำให้ thead ทั้งก้อน sticky */}
          {/* <TableRow> เดิมของคุณมีสีพื้นหลังอยู่แล้ว ซึ่งดีครับ */}
          <tr className={`${headerCellStickyBg}`}>
            {/* --- ปรับ className ของ th --- */}
            <th className={`${thBaseClass} text-center sticky top-0 z-10 ${headerCellStickyBg}`}>ปีที่</th>
            <th className={`${thBaseClass} text-center sticky top-0 z-10 ${headerCellStickyBg}`}>อายุ</th>
            <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>เบี้ยหลัก RPP (บาท)</th>
            <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>เบี้ยลงทุน RTU (บาท)</th>
            {viewMode === 'full' && (
              <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>เบี้ย LSTU (บาท)</th>
            )}
            <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>เบี้ยรวมปีนี้ (บาท)</th>
            {viewMode === 'full' && (
              <>
                <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>Charge RPP (บาท)</th>
                <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>Charge RTU (บาท)</th>
                <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>Charge รวม (บาท)</th>
                <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>COI (บาท)</th>
                <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>Admin Fee (บาท)</th>
                <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>รวมค่าธรรมเนียม (บาท)</th>
              </>
            )}
            
            {viewMode === 'full' && (
              <>
                <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>เงินลงทุน (บาท)</th>
                <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>ผลตอบแทน (บาท)</th>
              </>
            )}
            <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>Bonus (บาท)</th>
            <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>มูลค่ากรมธรรม์สิ้นปี (บาท)</th>
            {showCsv && (
              <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>มูลค่าเวนคืนสิ้นปี (บาท)</th>
            )}
            <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>ผลประโยชน์กรณีเสียชีวิต (บาท)</th>
            <th className={`${thBaseClass} text-right sticky top-0 z-10 ${headerCellStickyBg}`}>เงินถอนปีนี้ (บาท)</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0"> {/* เพิ่ม class นี้เพื่อให้เส้นขอบแถวสุดท้ายใน body หายไป (ถ้า footer ไม่มี border-top) */}
          {data.map((row) => (
            <tr key={row.policyYear} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              {/* --- ปรับ className ของ td --- */}
              <td className={`${tdBaseClass} text-center font-medium`}>{row.policyYear}</td>
              <td className={`${tdBaseClass} text-center`}>{row.age}</td>
              <td className={`${tdBaseClass} text-right`}>{formatNumber(row.premiumRPPYear)}</td>
              <td className={`${tdBaseClass} text-right`}>{formatNumber(row.premiumRTUYear)}</td>
              {viewMode === 'full' && (
                <td className={`${tdBaseClass} text-right`}>{formatNumber(row.premiumLSTUYearGross)}</td>
              )}
              <td className={`${tdBaseClass} text-right`}>{formatNumber(row.totalPremiumYear)}</td>
              {viewMode === 'full' && (
                <>
                  <td className={`${tdBaseClass} text-right text-orange-600`}>{formatNumber(row.premiumChargeRPPYear)}</td>
                  <td className={`${tdBaseClass} text-right text-orange-600`}>{formatNumber(row.premiumChargeRTUYear)}</td>
                  <td className={`${tdBaseClass} text-right text-orange-600`}>{formatNumber(row.totalPremiumChargeYear)}</td>
                  <td className={`${tdBaseClass} text-right text-red-600`}>{formatNumber(row.totalCOIYear)}</td>
                  <td className={`${tdBaseClass} text-right text-red-600`}>{formatNumber(row.totalAdminFeeYear)}</td>
                  <td className={`${tdBaseClass} text-right text-red-600`}>{formatNumber(row.totalFeesYear)}</td>
                </>
              )}
              
              {viewMode === 'full' && (
                <>
                  <td className={`${tdBaseClass} text-right`}>{formatNumber(row.investmentBaseYear)}</td>
                  <td className={`${tdBaseClass} text-right text-blue-600`}>{formatNumber(row.investmentReturnYear)}</td>
                </>
              )}
              <td className={`${tdBaseClass} text-right text-green-600`}>{formatNumber(row.royaltyBonusYear)}</td>
              <td className={`${tdBaseClass} text-right font-semibold`}>{formatNumber(row.eoyAccountValue)}</td>
              {showCsv && (
                <td className={`${tdBaseClass} text-right`}>{formatNumber(row.eoyCashSurrenderValue)}</td>
              )}
              <td className={`${tdBaseClass} text-right`}>{formatNumber(row.eoyDeathBenefit)}</td>
              <td className={`${tdBaseClass} text-right`}>{formatNumber(row.withdrawalYear)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t"> {/* เพิ่ม border-t ให้ tfoot */}
          <tr className={`${footerCellStickyBg} font-semibold`}>
            {/* --- ปรับ className ของ td ใน footer --- */}
            <td className={`${tdBaseClass} text-center font-semibold`}>รวม</td>
            <td className={`${tdBaseClass} text-center`}>-</td>
            <td className={`${tdBaseClass} text-right`}>{formatNumber(totals.premiumRPPYear)}</td>
            <td className={`${tdBaseClass} text-right`}>{formatNumber(totals.premiumRTUYear)}</td>
            {viewMode === 'full' && (
              <td className={`${tdBaseClass} text-right`}>{formatNumber(totals.premiumLSTUYearGross)}</td>
            )}
            <td className={`${tdBaseClass} text-right`}>{formatNumber(totals.totalPremiumYear)}</td>
            {viewMode === 'full' && (
              <>
                <td className={`${tdBaseClass} text-right text-orange-600`}>{formatNumber(totals.premiumChargeRPPYear)}</td>
                <td className={`${tdBaseClass} text-right text-orange-600`}>{formatNumber(totals.premiumChargeRTUYear)}</td>
                <td className={`${tdBaseClass} text-right text-orange-600`}>{formatNumber(totals.totalPremiumChargeYear)}</td>
                <td className={`${tdBaseClass} text-right text-red-600`}>{formatNumber(totals.totalCOIYear)}</td>
                <td className={`${tdBaseClass} text-right text-red-600`}>{formatNumber(totals.totalAdminFeeYear)}</td>
                <td className={`${tdBaseClass} text-right text-red-600`}>{formatNumber(totals.totalFeesYear)}</td>
              </>
            )}
            
            {viewMode === 'full' && (
              <>
                <td className={`${tdBaseClass} text-right`}>-</td>
                <td className={`${tdBaseClass} text-right text-blue-600`}>{formatNumber(totals.investmentReturnYear)}</td>
              </>
            )}
            <td className={`${tdBaseClass} text-right text-green-600`}>{formatNumber(totals.royaltyBonusYear)}</td>
            <td className={`${tdBaseClass} text-right font-semibold`}>-</td>
            {showCsv && (
              <td className={`${tdBaseClass} text-right`}>-</td>
            )}
            <td className={`${tdBaseClass} text-right`}>-</td>
            <td className={`${tdBaseClass} text-right`}>{formatNumber(totals.withdrawalYear)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}