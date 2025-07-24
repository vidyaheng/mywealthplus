// src/components/custom/ModalChartControls.tsx

import React from 'react';
import { ChartData } from '../GraphComponent'; // ปรับ Path ให้ถูกต้อง
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import RppRtuRatioSlider from '../RppRtuRatioSlider'; // ปรับ Path
import InvestmentReturnInput from '../InvestmentReturnInput'; // ปรับ Path
import { Button } from "@/components/ui/button";

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
    assumedReturnRate: number;
    onReturnRateChange: (newRate: number) => void;
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
    onRecalculate,
    isFullScreenView,
}) => {
    const displayData = hoveredData || initialData;

    const createDataRow = (
        id: string, 
        labelText: string, 
        //shortLabelText: string, // สำหรับ fullscreen
        value: number | undefined | null, 
        colorClass: string, 
        checked: boolean, 
        onCheckedChange: (isChecked: boolean) => void
    ) => {
        const valueIsPresent = value !== undefined && value !== null;

        if (isFullScreenView) {
        // ----- สำหรับ Fullscreen View -----
        //const displayLabel = shortLabelText || labelText.split(" ")[0];

        return (
            <div className="mb-1 flex flex-col items-start w-[160px]">
                <div className="flex items-center space-x-1.5 w-full">
                    <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(val) => typeof val === 'boolean' && onCheckedChange(val)}
                        className={`h-5 w-5 border-4 data-[state=checked]:bg-white data-[state=checked]:text-current [&>span>svg]:!stroke-[5px]`}
                        style={{ borderColor: colorClass, color: colorClass } as React.CSSProperties}
                    />
                    <Label htmlFor={id} className="text-xs text-white cursor-pointer"> {/* Label สีขาว */}
                        {labelText}:
                    </Label>
                </div>
                {/* แถวสำหรับ Value (จะอยู่ข้างล่าง Label) */}
                {valueIsPresent ? (
                    <div 
                        className="ml-[calc(1rem+0.5rem)] text-md font-semibold whitespace-nowrap leading-tight pt-0.5" // เยื้องให้ตรงกับ Label, ปรับขนาด font, ลด line-height, เพิ่ม padding top เล็กน้อย
                        style={{ color: colorClass } as React.CSSProperties}
                    >
                        {formatNumber(value)}
                    </div>
                ) : ( // สร้าง placeholder ให้ความสูงเท่ากันกรณีไม่มี value เพื่อไม่ให้ layout กระโดด
                    <div className="ml-[calc(1rem+0.375rem)] text-xs invisible leading-tight pt-0.5">0</div>
                )}
            </div>
        );
        } else {
        // ----- สำหรับ Non-Fullscreen View (เหมือนเดิมที่คุณปรับแต่งล่าสุด) -----
        return (
            <div className="mb-2.5">
                <div className="flex items-center space-x-1">
                    <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(val) => typeof val === 'boolean' && onCheckedChange(val)}
                        className="h-5 w-5 border-4 bg-white data-[state=checked]:bg-white data-[state=checked]:text-current [&>span>svg]:!stroke-[5px]"
                        style={{ borderColor: colorClass, color: colorClass } as React.CSSProperties}
                    />
                    <Label htmlFor={id} className="text-xs text-white flex-grow cursor-pointer min-w-0">
                        {labelText}:
                    </Label>
                </div>
                {valueIsPresent && (
                     <div className="ml-8 text-base font-semibold whitespace-nowrap" style={{ color: colorClass }}> {/* ปรับ ml- ตามต้องการ */}
                        {formatNumber(value)} <span className="text-gray-300 font-normal text-xs">บาท</span>
                    </div>
                )}
            </div>
        );
    }
};


    if (isFullScreenView) {
        // ----- Layout ใหม่สำหรับ Fullscreen Modal (บังคับ 6 คอลัมน์) -----
        return (
            <div className="w-full bg-blue-900 p-3">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                    
                    {/* --- คอลัมน์ที่ 1: Title และปุ่ม Update --- */}
                    <div className="flex flex-col space-y-2 items-start">
                        {displayData && (
                            <h3 className="font-semibold text-sm text-gray-100 whitespace-nowrap">
                                ข้อมูล ณ อายุ: {currentAge || displayData?.age || '-'} ปี
                            </h3>
                        )}
                        {onRecalculate && (
                            <Button
                                onClick={onRecalculate}
                                size="sm"
                                className="bg-sky-500 hover:bg-sky-600 text-white text-xs px-3 py-1"
                            >
                                Update
                            </Button>
                        )}
                    </div>

                    {/* --- คอลัมน์ที่ 2-5: กล่องข้อมูล --- */}
                    {displayData ? (
                        <>
                            <div>{createDataRow("mccFSDeathBenefit", "เสียชีวิต", displayData.deathBenefit, "#70A8DB", showDeathBenefit, setShowDeathBenefit)}</div>
                            <div>{createDataRow("mccFSAccountValue", "มูลค่า กธ.", displayData.accountValue, "#F5A623", showAccountValue, setShowAccountValue)}</div>
                            <div>{createDataRow("mccFSPremiumCumulative", "เบี้ยสะสม", displayData.premiumCumulative, "#99BE60", showPremiumCumulative, setShowPremiumCumulative)}</div>
                            <div>{createDataRow("mccFSPremiumAnnual", "เบี้ยรายปี", displayData.premiumAnnual, "#E57373", showPremiumAnnual, setShowPremiumAnnual)}</div>
                        </>
                    ) : <p className="text-xs text-gray-400 col-span-4 text-center py-4">เลื่อนเมาส์บนกราฟ</p>}

                    {/* --- คอลัมน์ที่ 6: Sliders --- */}
                    <div className="flex flex-col space-y-4">
                        <RppRtuRatioSlider 
                            rppPercent={rppPercent} 
                            totalPremium={totalPremium} 
                            onPercentChange={onPercentChange} 
                            compact={true} 
                        />
                        <InvestmentReturnInput
                            value={assumedReturnRate} 
                            onChange={onReturnRateChange} 
                            min={0} max={10} step={0.25}
                            sliderOnlyCompact={true} 
                            isFullScreenView={isFullScreenView}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ----- Layout สำหรับ Non-Fullscreen (ใช้ใน IWealthyChartPage โดยตรง) -----
    // ทั้งหมดเรียงกันในแนวตั้ง, มีแค่ Ratio Slider, ไม่มีปุ่ม Update
    return (
        <div className="w-full h-full bg-blue-900 p-4 flex flex-col space-y-4 overflow-hidden"> {/* Root div เป็น flex-col โดยธรรมชาติของ div และ space-y */}
            {/* ส่วน "ข้อมูล ณ อายุ" */}
            <div className="text-center">
                <h3 className="font-semibold text-sm text-gray-100 mb-2">
                    ข้อมูล ณ อายุ: {currentAge || displayData?.age || '-'} ปี
                </h3>
            </div>
            {/*<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-1">*/}
            {/* ส่วน Checkboxes (เรียงแนวตั้ง) */}
            {displayData ? (
                <div className="space-y-3 pl-2 sm:pl-4"> {/* เพิ่ม padding ซ้ายเล็กน้อยเพื่อให้ดูดี */}
                    {createDataRow("mccPageDeathBenefit", "ผลประโยชน์กรณีเสียชีวิต", displayData.deathBenefit, "#70A8DB", showDeathBenefit, setShowDeathBenefit)}
                    {createDataRow("mccPageAccountValue", "มูลค่าบัญชีกรมธรรม์", displayData.accountValue, "#F5A623", showAccountValue, setShowAccountValue)}
                    {createDataRow("mccPagePremiumCumulative", "เบี้ยประกันภัยสะสม", displayData.premiumCumulative, "#99BE60", showPremiumCumulative, setShowPremiumCumulative)}
                    {createDataRow("mccPagePremiumAnnual", "เบี้ยประกันภัยรายปี", displayData.premiumAnnual, "red", showPremiumAnnual, setShowPremiumAnnual)}
                </div>
            ) : (
                <p className="text-xs text-gray-500 text-center py-2 w-full col-span-full">
                    เลื่อนเมาส์บนกราฟ หรือปรับค่าเพื่อดูข้อมูล
                </p>
            
            )}
            {/*</div>*/}

            {/* ส่วน Ratio Slider (อย่างเดียว) */}
            <div className="pt-2"> {/* เพิ่ม padding top เล็กน้อย */}
                <h4 className="text-[10px] font-semibold mb-1 text-gray-100 px-2 sm:px-4">
                    สัดส่วนเบี้ย RPP/RTU
                </h4>
                <div className="px-2 sm:px-4">
                    <RppRtuRatioSlider
                        rppPercent={rppPercent}
                        totalPremium={totalPremium}
                        onPercentChange={onPercentChange}
                        compact={true} // <<<< ลองตั้งเป็น false เพื่อให้ slider ดูใหญ่ขึ้น เหมาะกับหน้า Page
                    />
                </div>
            </div>
            {/* ไม่มี InvestmentReturnInput และ ไม่มี ปุ่ม Update */}
        </div>
    );
};

export default ModalChartControls;