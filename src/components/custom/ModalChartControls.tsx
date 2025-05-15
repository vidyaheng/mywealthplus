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

    onRecalculate: () => void; 
    isFullScreenView?: boolean;
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
    isFullScreenView
}) => {
    const displayData = hoveredData || initialData;

    const createDataRow = (id: string, labelText: string, value: number | undefined | null, colorClass: string, checked: boolean, onCheckedChange: (isChecked: boolean) => void, isFullScreen?: boolean) => (
        <div className={isFullScreenView ? "mb-1 mr-2 flex flex-col items-start" : "mb-1.5"}>
            <div className={`flex items-center ${isFullScreen ? 'space-x-1.5' : 'space-x-2'}`}>
                <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(val) => typeof val === 'boolean' && onCheckedChange(val)}
                    className={`h-5 w-5 border-4 data-[state=checked]:bg-transparent data-[state=checked]:text-current`}
                    style={{ borderColor: colorClass, color: colorClass } as React.CSSProperties}
                />
                <Label 
                    htmlFor={id} 
                    className={`${isFullScreen ? 'text-xs' : 'text-xs'} text-gray-700 whitespace-nowrap`} // ใช้ text-[11px] และ nowrap ใน fullscreen
                >
                    {isFullScreen ? labelText.split(" ")[0] : labelText}: {/* ใน fullscreen อาจจะแสดงแค่คำแรก หรือ label สั้นๆ */}
                </Label>
                {isFullScreen && value !== undefined && value !== null && ( /* แสดงค่าต่อท้าย label ใน fullscreen */
                    <span className={`ml-1 text-[11px] font-semibold whitespace-nowrap`} style={{ color: colorClass }}>
                        {formatNumber(value)}
                    </span>
                )}
            </div>
            {!isFullScreen && value !== undefined && value !== null && ( /* การแสดงค่าแบบเดิมสำหรับ non-fullscreen */
                <div className={`ml-8 text-md font-semibold`} style={{ color: colorClass }}>
                    {formatNumber(value)} <span className="text-gray-600 font-normal text-[10px]">บาท</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row w-full text-sm p-2 md:p-0"> {/* Add padding for smaller screens, remove for md+ */}
            {/*} ส่วนซ้าย (md:w-3/5) สำหรับ Checkboxes และค่าตัวเลข */}
            <div className={`w-full ${isFullScreenView ? '' : 'md:w-3/5 md:pr-3 mb-3 md:mb-0 md:border-r md:border-slate-200'}`}>
                {!isFullScreenView && ( // แสดงหัวข้อ "ข้อมูล ณ อายุ" เฉพาะตอนไม่ใช่ Fullscreen
                    <div className="text-center mb-1.5">
                        <h3 className="font-semibold text-xs text-gray-800">ข้อมูล ณ อายุ: {currentAge || displayData?.age || '-'} ปี</h3>
                    </div>
                )}
                {/* ถ้าเป็น Fullscreen ให้ Checkboxes เรียงแนวนอน */}
                {isFullScreenView ? (
                        <div className="flex flex-row flex-wrap items-center justify-between w-full text-md p-1.5 gap-x-3 gap-y-2">
                            {/* Section 1: Checkboxes */}
                            {/* CHANGED: Container นี้จะจัดให้ inner wrapper (ที่มี checkbox items) อยู่กลางแนวนอน */}
                            <div className={`flex justify-center flex-grow order-1 min-w-[280px]`}>
                                {/* Inner wrapper สำหรับจัดเรียง checkbox items, จัดกลางแนวนอน และจัด item ในแถวให้อยู่กลางแนวตั้ง */}
                                <div className={`flex flex-row flex-wrap justify-center items-center gap-x-10 gap-y-2 mt-10`}> {/* CHANGED: เพิ่ม items-center และปรับ gap */}
                                    {displayData ? (
                                        <>
                                            {createDataRow("mccDeathBenefitFS", "ผลประโยชน์กรณีเสียชีวิต", displayData.deathBenefit, "#0B4BA0", showDeathBenefit, setShowDeathBenefit)}
                                            {createDataRow("mccAccountValueFS", "มูลค่าบัญชีกรมธรรม์", displayData.accountValue, "#F5A623", showAccountValue, setShowAccountValue)}
                                            {createDataRow("mccPremiumCumulativeFS", "เบี้ยประกันภัยสะสม", displayData.premiumCumulative, "green", showPremiumCumulative, setShowPremiumCumulative)}
                                            {createDataRow("mccPremiumAnnualFS", "เบี้ยประกันภัยรายปี", displayData.premiumAnnual, "red", showPremiumAnnual, setShowPremiumAnnual)}
                                        </>
                                    ) : <p className="text-md text-gray-500 text-center py-2 w-full">เลื่อนเมาส์บนกราฟเพื่อดูข้อมูล</p>}
                                </div>
                            </div>
                        </div>
                ) : (
                    // Layout เดิมสำหรับ Checkboxes (เรียงแนวตั้ง)
                    displayData && (
                        <div className="space-y-1"> {/* เพิ่ม space-y-1 สำหรับ non-fullscreen */}
                            {createDataRow("mccDeathBenefit", "ผลประโยชน์กรณีเสียชีวิต", displayData.deathBenefit, "#0B4BA0", showDeathBenefit, setShowDeathBenefit, isFullScreenView)}
                            {createDataRow("mccAccountValue", "มูลค่าบัญชีกรมธรรม์", displayData.accountValue, "#F5A623", showAccountValue, setShowAccountValue, isFullScreenView)}
                            {createDataRow("mccPremiumCumulative", "เบี้ยประกันภัยสะสม", displayData.premiumCumulative, "green", showPremiumCumulative, setShowPremiumCumulative, isFullScreenView)}
                            {createDataRow("mccPremiumAnnual", "เบี้ยประกันภัยรายปี", displayData.premiumAnnual, "red", showPremiumAnnual, setShowPremiumAnnual, isFullScreenView)}
                        </div>
                    )
                )}
                {!displayData && <p className="text-md text-gray-500 text-center py-2">เลื่อนเมาส์บนกราฟเพื่อดูข้อมูล</p>}
            </div>

            {/* ส่วนขวา (Sliders และปุ่ม) */}
            {/* ถ้าเป็น Fullscreen จะให้ Sliders อยู่ซ้าย ปุ่มอยู่ขวา */}
            <div className="flex flex-col space-y-1.5 order-2 sm:w-auto md:w-1/4 min-w-[180px]"> {/* w-1/4 for md+, min-width ensures it's not too crushed */}
                    <div className="flex flex-col items-start"> {/* Center label above slider */}
                        {/*<h4 className={`font-semibold text-gray-700 ${isFullScreenView ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>
                            สัดส่วนเบี้ย RPP/RTU
                        </h4>*/}
                        <RppRtuRatioSlider
                            rppPercent={rppPercent}
                            totalPremium={totalPremium}
                            onPercentChange={onPercentChange}
                            compact={true} // compact={true} ช่วยให้ slider เล็กอยู่แล้ว
                        />
                    </div>
                    <div>
                        <InvestmentReturnInput
                            label="ผลตอบแทนคาดหวัง (%ต่อปี)"
                            //labelClassName={isFullScreenView ? "text-[10px] font-semibold text-gray-700 mb-0.5" : "text-xs font-semibold text-gray-700 mb-1"} // ส่ง class ให้ label ถ้า component รองรับ
                            value={assumedReturnRate}
                            onChange={onReturnRateChange}
                            min={0} max={10} step={0.25}
                            displayPrecision={2}
                            showInputField={false}
                            sliderOnlyCompact={true} // sliderOnlyCompact={true} ช่วยให้ slider เล็กอยู่แล้ว
                        />
                    </div>
                </div>
                {/* ส่วนปุ่ม "Update" (อยู่ทางขวา) */}
                <div className="flex items-end order-3 sm:ml-1"> {/* Push to the right on sm+ screens */}
                    <Button
                        onClick={onRecalculate}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5" // ทำให้ปุ่มเล็กลง
                    >
                        Update
                    </Button>
                
                </div>
        </div> // ปิด Root div ของ ModalChartControls
    );
};

export default ModalChartControls;
