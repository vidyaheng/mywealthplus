// src/components/custom/DisplayTable.tsx (หรือตาม Path ที่คุณต้องการ)

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter, // เพิ่ม TableFooter สำหรับแถวผลรวม
    
} from "@/components/ui/table"; // ปรับ path ตาม UI Library ของคุณ
import { AnnualCalculationOutputRow } from "../lib/calculations"; // << ปรับ path ให้ถูกต้องไปยัง type ของคุณ

// นิยาม Type สำหรับ viewMode (อาจจะย้ายไปไฟล์ shared types ถ้าใช้ที่อื่นด้วย)
export type AnnualTableView = 'compact' | 'full';

interface DisplayTableProps {
  data: AnnualCalculationOutputRow[];
  viewMode: AnnualTableView;
  showCsv: boolean;
  formatNumber: (num: number | undefined | null) => string;
  caption?: string; // Caption ของตาราง (optional)
  className?: string; // สำหรับ custom class เพิ่มเติม (optional)
}

export default function DisplayTable({
  data,
  viewMode,
  showCsv,
  formatNumber,
  caption = "ตารางสรุปผลประโยชน์โดยประมาณ", // Default caption
  className
}: DisplayTableProps) {

  // ถ้าไม่มีข้อมูล ให้แสดงข้อความหรือ return null (จัดการโดย Parent Component แล้วส่วนหนึ่ง)
  if (!data || data.length === 0) {
    return (
        <div className="p-4 text-center text-gray-600">
            ไม่มีข้อมูลสำหรับแสดงในตาราง
        </div>
    );
  }

  // คำนวณผลรวม
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
    // คอลัมน์ที่ไม่ต้องการรวม:
    // investmentBaseYear, eoyAccountValue, eoyCashSurrenderValue, eoyDeathBenefit, eoySumInsured
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

  // กำหนดสีพื้นหลังสำหรับ header และ footer cells ที่จะ sticky
  // ควรเลือกสีทึบแสง และเข้ากับ theme ของคุณ (อาจใช้ utility class จาก Shadcn/ui เช่น bg-background, bg-muted)
  const headerCellStickyBg = "bg-slate-50 dark:bg-slate-800"; // ตัวอย่างสีพื้นหลัง header
  const footerCellStickyBg = "bg-slate-100 dark:bg-slate-700"; // ตัวอย่างสีพื้นหลัง footer (เหมือนเดิม)

  return (
    // --- ขั้นตอนที่ 1: ตรวจสอบและตั้งค่า Scroll Container ---
    // div นี้ทำหน้าที่เป็น container ที่จะมีการ scroll เนื้อหาภายใน
    // `relative` ช่วยให้ z-index ของ sticky children ทำงานถูกต้อง
    // `max-h-[600px]` (หรือค่าอื่น) จำกัดความสูงเพื่อให้เกิด vertical scroll และ sticky top/bottom ทำงาน
    <div className={`overflow-x-auto overflow-y-auto relative ${className || ''} max-h-[600px]`}>
      {/* `border-collapse` ช่วยให้การแสดงผล sticky กับเส้นขอบดูดีขึ้น */}
      <Table className="min-w-full border-collapse">
        {caption && <TableCaption>{caption}</TableCaption>}

        {/* --- ขั้นตอนที่ 2: ทำให้เซลล์ส่วนหัว (TableHead) ทั้งหมด Sticky --- */}
        <TableHeader>

          {/* TableRow ของ Header ไม่ต้องใส่ sticky แต่สามารถใส่สีพื้นหลังเพื่อให้ครอบคลุมช่องว่างระหว่างเซลล์ (ถ้ามี) */}
          {/* หาก TableHead ทุกอันมีสีพื้นหลังของตัวเองแล้ว สีพื้นหลังของ TableRow นี้อาจจะไม่จำเป็น */}

          <TableRow className={`${headerCellStickyBg}`}>
            {/* คอลัมน์ที่แสดงเสมอ */}

            {/* เพิ่ม `sticky top-0 z-10` และสีพื้นหลังให้กับ TableHead แต่ละอัน */}
            {/* `z-10` เป็นค่าเริ่มต้น อาจต้องปรับถ้ามี element อื่นซ้อนทับ */}
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-center text-xs`}>ปีที่</TableHead>
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-center text-xs`}>อายุ</TableHead>
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-center text-xs`}>เบี้ยหลัก RPP (บาท)</TableHead>
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-center text-xs`}>เบี้ยลงทุน RTU (บาท)</TableHead>
            {/* คอลัมน์สำหรับ Full View */}
            {viewMode === 'full' && (
              <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>เบี้ย LSTU (บาท)</TableHead>
            )}
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>เบี้ยรวมปีนี้ (บาท)</TableHead>
            {viewMode === 'full' && (
              <>
                <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>Charge RPP (บาท)</TableHead>
                <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>Charge RTU (บาท)</TableHead>
                <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>Charge รวม (บาท)</TableHead>
                <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>COI (บาท)</TableHead>
                <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>Admin Fee (บาท)</TableHead>
              </>
            )}
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>รวมค่าธรรมเนียม (บาท)</TableHead>
            {viewMode === 'full' && (
              <>
                <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>เงินลงทุน (บาท)</TableHead>
                <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>ผลตอบแทน (บาท)</TableHead>
              </>
            )}
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>Bonus (บาท)</TableHead>
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>มูลค่ากรมธรรม์สิ้นปี (บาท)</TableHead>
            {showCsv && (
              <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>มูลค่าเวนคืนสิ้นปี (บาท)</TableHead>
            )}
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>ผลประโยชน์กรณีเสียชีวิต (บาท)</TableHead>
            <TableHead className={`sticky top-0 z-10 ${headerCellStickyBg} text-right text-xs`}>เงินถอนปีนี้ (บาท)</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row) => (
            <TableRow key={row.policyYear}>
              {/* Cells ที่แสดงเสมอ */}
              <TableCell className="text-center text-xs font-medium">{row.policyYear}</TableCell>
              <TableCell className="text-center text-xs">{row.age}</TableCell>
              <TableCell className="text-right text-xs">{formatNumber(row.premiumRPPYear)}</TableCell>
              <TableCell className="text-right text-xs">{formatNumber(row.premiumRTUYear)}</TableCell>

              {/* Cell สำหรับ Full View */}
              {viewMode === 'full' && (
                <TableCell className="text-right text-xs">{formatNumber(row.premiumLSTUYearGross)}</TableCell>
              )}

              {/* Cells ที่แสดงเสมอ */}
              <TableCell className="text-right text-xs">{formatNumber(row.totalPremiumYear)}</TableCell>

              {/* Cell สำหรับ Full View (ค่าธรรมเนียมแยก) */}
              {viewMode === 'full' && (
                <>
                  <TableCell className="text-right text-xs text-orange-600">{formatNumber(row.premiumChargeRPPYear)}</TableCell>
                  <TableCell className="text-right text-xs text-orange-600">{formatNumber(row.premiumChargeRTUYear)}</TableCell>
                  <TableCell className="text-right text-xs text-orange-600">{formatNumber(row.totalPremiumChargeYear)}</TableCell>
                  <TableCell className="text-right text-xs text-red-600">{formatNumber(row.totalCOIYear)}</TableCell>
                  <TableCell className="text-right text-xs text-red-600">{formatNumber(row.totalAdminFeeYear)}</TableCell>
                </>
              )}

              {/* Cells ที่แสดงเสมอ */}
              <TableCell className="text-right text-xs text-red-600">{formatNumber(row.totalFeesYear)}</TableCell>

              {/* Cell สำหรับ Full View */}
              {viewMode === 'full' && (
                <>
                  <TableCell className="text-right text-xs">{formatNumber(row.investmentBaseYear)}</TableCell>
                  <TableCell className="text-right text-xs text-blue-600">{formatNumber(row.investmentReturnYear)}</TableCell>
                </>
              )}

              {/* Cells ที่แสดงเสมอ */}
              <TableCell className="text-right text-xs text-green-600">{formatNumber(row.royaltyBonusYear)}</TableCell>
              <TableCell className="text-right text-xs font-semibold">{formatNumber(row.eoyAccountValue)}</TableCell>

              {/* Cell CSV แสดงตามเงื่อนไข */}
              {showCsv && (
                <TableCell className="text-right text-xs">{formatNumber(row.eoyCashSurrenderValue)}</TableCell>
              )}

              {/* Cells ที่แสดงเสมอ */}
              <TableCell className="text-right text-xs">{formatNumber(row.eoyDeathBenefit)}</TableCell>
              <TableCell className="text-right text-xs">{formatNumber(row.withdrawalYear)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {/* --- แถวผลรวม --- */}
        {/* --- ขั้นตอนที่ 3: ทำให้เซลล์ส่วนท้าย (TableCell ใน TableFooter) ทั้งหมด Sticky --- */}
        <TableFooter>
          {/* TableRow ของ Footer ไม่ต้องใส่ sticky แต่สามารถใส่สีพื้นหลังเพื่อให้ครอบคลุมช่องว่างระหว่างเซลล์ (ถ้ามี) */}
          <TableRow className={`${footerCellStickyBg} font-semibold`}>
            {/* เพิ่ม `sticky bottom-0 z-10` และสีพื้นหลังให้กับ TableCell แต่ละอันในแถวผลรวม */}
            <TableCell className={` text-center text-xs font-semibold`}>รวม</TableCell>
            <TableCell className={` text-center text-xs`}>-</TableCell>
            <TableCell className={` text-right text-xs`}>{formatNumber(totals.premiumRPPYear)}</TableCell>
            <TableCell className={` text-right text-xs`}>{formatNumber(totals.premiumRTUYear)}</TableCell>
            {viewMode === 'full' && (
              <TableCell className={` text-right text-xs`}>{formatNumber(totals.premiumLSTUYearGross)}</TableCell>
            )}
            <TableCell className={` text-right text-xs`}>{formatNumber(totals.totalPremiumYear)}</TableCell>
            {viewMode === 'full' && (
              <>
                <TableCell className={` text-right text-xs text-orange-600`}>{formatNumber(totals.premiumChargeRPPYear)}</TableCell>
                <TableCell className={` text-right text-xs text-orange-600`}>{formatNumber(totals.premiumChargeRTUYear)}</TableCell>
                <TableCell className={` text-right text-xs text-orange-600`}>{formatNumber(totals.totalPremiumChargeYear)}</TableCell>
                <TableCell className={` text-right text-xs text-red-600`}>{formatNumber(totals.totalCOIYear)}</TableCell>
                <TableCell className={` text-right text-xs text-red-600`}>{formatNumber(totals.totalAdminFeeYear)}</TableCell>
              </>
            )}
            <TableCell className={` text-right text-xs text-red-600`}>{formatNumber(totals.totalFeesYear)}</TableCell>
            {viewMode === 'full' && (
              <>
                <TableCell className={` text-right text-xs`}>-</TableCell>
                <TableCell className={` text-right text-xs text-blue-600`}>{formatNumber(totals.investmentReturnYear)}</TableCell>
              </>
            )}
            <TableCell className={` text-right text-xs text-green-600`}>{formatNumber(totals.royaltyBonusYear)}</TableCell>
            <TableCell className={` text-right text-xs font-semibold`}>-</TableCell>
            {showCsv && (
              <TableCell className={` text-right text-xs`}>-</TableCell>
            )}
            <TableCell className={` text-right text-xs`}>-</TableCell>
            <TableCell className={` text-right text-xs`}>{formatNumber(totals.withdrawalYear)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}