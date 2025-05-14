// src/components/custom/DisplayTable.tsx (หรือตาม Path ที่คุณต้องการ)

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
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

  return (
    <div className={`overflow-x-auto overflow-y-auto ${className || ''}`}>
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {/* คอลัมน์ที่แสดงเสมอ */}
            <TableHead className="text-center text-xs">ปีที่</TableHead>
            <TableHead className="text-center text-xs">อายุ</TableHead>
            <TableHead className="text-right text-xs">เบี้ยหลัก RPP (บาท)</TableHead>
            <TableHead className="text-right text-xs">เบี้ยลงทุน RTU (บาท)</TableHead>

            {/* คอลัมน์สำหรับ Full View */}
            {viewMode === 'full' && (
              <TableHead className="text-right text-xs">เบี้ย LSTU (บาท)</TableHead>
            )}

            {/* คอลัมน์ที่แสดงเสมอ */}
            <TableHead className="text-right text-xs">เบี้ยรวมปีนี้ (บาท)</TableHead>

            {/* คอลัมน์สำหรับ Full View (ค่าธรรมเนียมแยก) */}
            {viewMode === 'full' && (
              <>
                <TableHead className="text-right text-xs">Charge RPP (บาท)</TableHead>
                <TableHead className="text-right text-xs">Charge RTU (บาท)</TableHead>
                <TableHead className="text-right text-xs">Charge รวม (บาท)</TableHead>
                <TableHead className="text-right text-xs">COI (บาท)</TableHead>
                <TableHead className="text-right text-xs">Admin Fee (บาท)</TableHead>
              </>
            )}

            {/* คอลัมน์ที่แสดงเสมอ */}
            <TableHead className="text-right text-xs">รวมค่าธรรมเนียม (บาท)</TableHead>

            {/* คอลัมน์สำหรับ Full View */}
            {viewMode === 'full' && (
              <>
                <TableHead className="text-right text-xs">เงินลงทุน (บาท)</TableHead>
                <TableHead className="text-right text-xs">ผลตอบแทน (บาท)</TableHead>
              </>
            )}

            {/* คอลัมน์ที่แสดงเสมอ */}
            <TableHead className="text-right text-xs">Bonus (บาท)</TableHead>
            <TableHead className="text-right text-xs">มูลค่ากรมธรรม์สิ้นปี (บาท)</TableHead>

            {/* หัวตาราง CSV แสดงตามเงื่อนไข */}
            {showCsv && (
              <TableHead className="text-right text-xs">มูลค่าเวนคืนสิ้นปี (บาท)</TableHead>
            )}

            {/* คอลัมน์ที่แสดงเสมอ */}
            <TableHead className="text-right text-xs">ผลประโยชน์กรณีเสียชีวิต (บาท)</TableHead>
            <TableHead className="text-right text-xs">เงินถอนปีนี้ (บาท)</TableHead>
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
      </Table>
    </div>
  );
}