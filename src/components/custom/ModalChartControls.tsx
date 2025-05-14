// src/components/custom/ModalChartControls.tsx

import React from 'react';
import { ChartData } from '../GraphComponent'; // ปรับ Path ถ้าจำเป็น
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import RppRtuRatioSlider from '../RppRtuRatioSlider'; // ปรับ Path
import InvestmentReturnInput from '../InvestmentReturnInput'; // ปรับ Path
import { Button } from "@/components/ui/button"; // Import Button

// --- Interface สำหรับ Props ---
interface ModalChartControlsProps {
    hoveredData: ChartData | null;
    initialData: ChartData | null;
    currentAge?: number;
    formatNumber: (num: number | undefined | null) => string;

    showDeathBenefit: boolean;
    setShowDeathBenefit: React.Dispatch<React.SetStateAction<boolean>>;
    showAccountValue: boolean;
    setShowAccountValue: React.Dispatch<React.SetStateAction<boolean>>;
    showPremiumAnnual: boolean;
    setShowPremiumAnnual: React.Dispatch<React.SetStateAction<boolean>>;
    showPremiumCumulative: boolean;
    setShowPremiumCumulative: React.Dispatch<React.SetStateAction<boolean>>;

    rppPercent: number;
    totalPremium: number;
    onPercentChange: (percent: number) => void;

    assumedReturnRate: number; // เป็น %
    onReturnRateChange: (newRate: number) => void; // newRate คือ %

    onRecalculate: () => void; // <<< เพิ่ม prop นี้
}

const ModalChartControls: React.FC<ModalChartControlsProps> = ({
    hoveredData, initialData, currentAge, formatNumber,
    showDeathBenefit, setShowDeathBenefit,
    showAccountValue, setShowAccountValue,
    showPremiumAnnual, setShowPremiumAnnual,
    showPremiumCumulative, setShowPremiumCumulative,
    rppPercent, totalPremium, onPercentChange,
    assumedReturnRate, onReturnRateChange,
    onRecalculate, // <<< รับ prop นี้เข้ามา
}) => {
    const displayData = hoveredData || initialData;

    const createDataRow = (id: string, labelText: string, value: number | undefined | null, colorClass: string, checked: boolean, onCheckedChange: (isChecked: boolean) => void) => (
        <div className="mb-1.5"> {/* Adjust margin slightly */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(val) => typeof val === 'boolean' && onCheckedChange(val)}
                    className={`h-3.5 w-3.5 border-2 rounded-sm data-[state=checked]:bg-transparent data-[state=checked]:text-current`}
                    style={{ borderColor: colorClass, color: colorClass } as React.CSSProperties}
                />
                <Label htmlFor={id} className="text-xs text-gray-700 flex-grow">{labelText}:</Label>
            </div>
            <div className={`ml-6 text-xs font-semibold`} style={{ color: colorClass }}> {/* Adjust margin-left */}
                {formatNumber(value)} <span className="text-gray-600 font-normal text-[10px]">บาท</span> {/* Smaller unit text */}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row w-full text-sm p-2 md:p-0"> {/* Add padding for smaller screens, remove for md+ */}
            {/* ส่วนซ้าย (md:w-3/5) สำหรับ Checkboxes และค่าตัวเลข */}
            <div className="w-full md:w-3/5 md:pr-3 space-y-1 mb-3 md:mb-0 md:border-r md:border-slate-200">
                <div className="text-center mb-1.5">
                    <h3 className="font-semibold text-xs text-gray-800">ข้อมูล ณ อายุ: {currentAge || displayData?.age || '-'} ปี</h3>
                </div>
                {displayData && (
                    <>
                        {createDataRow("mccDeathBenefit", "ผลประโยชน์กรณีเสียชีวิต", displayData.deathBenefit, "#0B4BA0", showDeathBenefit, setShowDeathBenefit)}
                        {createDataRow("mccAccountValue", "มูลค่าบัญชีกรมธรรม์", displayData.accountValue, "#F5A623", showAccountValue, setShowAccountValue)}
                        {createDataRow("mccPremiumCumulative", "เบี้ยประกันภัยสะสม", displayData.premiumCumulative, "green", showPremiumCumulative, setShowPremiumCumulative)}
                        {createDataRow("mccPremiumAnnual", "เบี้ยประกันภัยรายปี", displayData.premiumAnnual, "red", showPremiumAnnual, setShowPremiumAnnual)}
                    </>
                )}
                {!displayData && <p className="text-xs text-gray-500 text-center py-4">เลื่อนเมาส์บนกราฟเพื่อดูข้อมูล</p>}
            </div>

            {/* ส่วนขวา (md:w-2/5) สำหรับ Sliders และปุ่มคำนวณ */}
            <div className="w-full md:w-2/5 md:pl-3 space-y-3 flex flex-col justify-between"> {/* Use flex-col and justify-between */}
                <div className="space-y-3"> {/* Group sliders */}
                    <div>
                        <h4 className="text-xs font-semibold mb-1 text-gray-700">สัดส่วนเบี้ย RPP/RTU</h4>
                        <RppRtuRatioSlider
                            rppPercent={rppPercent}
                            totalPremium={totalPremium}
                            onPercentChange={onPercentChange}
                            compact={true}
                        />
                    </div>
                    <div>
                        {/* InvestmentReturnInput ถูกออกแบบมาให้มี Label ภายในแล้ว */}
                        <InvestmentReturnInput
                            label="ผลตอบแทนคาดหวัง (%ต่อปี)"
                            value={assumedReturnRate} // นี่คือค่า %
                            onChange={onReturnRateChange} // Callback นี้ควรรับค่า %
                            min={0}
                            max={10} // หรือตามที่คุณต้องการ
                            step={0.25} // ปรับ step ตามต้องการ
                            displayPrecision={2}
                            showInputField={false} // ซ่อน input field, แสดงเฉพาะ slider
                            sliderOnlyCompact={true} // เพิ่ม prop เพื่อให้ slider เล็กลง (ถ้ามี)
                        />
                    </div>
                </div>
                <Button
                    onClick={onRecalculate} // <<< เรียกใช้ onRecalculate ที่ได้รับมา
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2 text-xs"
                >
                    ใช้ค่านี้และคำนวณใหม่
                </Button>
            </div>
        </div>
    );
};

export default ModalChartControls;
