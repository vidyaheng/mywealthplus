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
        // ----- Layout สำหรับ Fullscreen Modal (พยายามจัดแนวนอน, compact) -----
        return (
            <div className="bg-blue-900 flex flex-row flex-wrap items-center justify-between w-full text-sm p-1.5 gap-x-1 gap-y-2">
                {/* Section 1: Checkboxes (เรียงแนวนอนและ wrap, พยายามใช้พื้นที่) */}
                <div className="flex-auto order-1 min-w-[150px] xs:min-w-[180px] sm:min-w-[220px]">
                    <div className="flex flex-row flex-wrap justify-center sm:justify-start items-center gap-x-2 gap-y-1">
                        {/* คอลัมน์ซ้าย: Title "ข้อมูล ณ อายุ" และ ปุ่ม "Update" */}
                        <div className="flex flex-col space-y-2 flex-shrink-0 items-start py-1 border-r border-gray-200 mr-8"> {/* flex-shrink-0 เพื่อไม่ให้คอลัมน์นี้หด */}
                            {displayData && (
                                <div className="text-center">
                                    <h3 className="w-[180px] font-semibold text-sm text-gray-100 whitespace-nowrap">
                                        ข้อมูล ณ อายุ: {currentAge || displayData?.age || '-'} ปี
                                    </h3>
                                </div>
                            )}
                            {onRecalculate && (
                                <Button
                                    onClick={onRecalculate}
                                    size="sm"
                                    className="ml-[calc(1rem+1rem)] bg-sky-500 hover:bg-sky-600 text-white text-xs px-4 py-1.5 w-full sm:w-auto" // ลองเปลี่ยนสีปุ่มและให้กว้างเต็มในจอเล็ก
                                >
                                    Update
                                </Button>
                            )}
                        </div>
                        {displayData ? (
                            <>
                                {createDataRow("mccFSDeathBenefit", "เสียชีวิต", displayData.deathBenefit, "#70A8DB", showDeathBenefit, setShowDeathBenefit)}
                                {createDataRow("mccFSAccountValue", "มูลค่า กธ", displayData.accountValue, "#F5A623", showAccountValue, setShowAccountValue)}
                                {createDataRow("mccFSPremiumCumulative", "เบี้ยสะสม", displayData.premiumCumulative, "#99BE60", showPremiumCumulative, setShowPremiumCumulative)}
                                {createDataRow("mccFSPremiumAnnual", "เบี้ยรายปี", displayData.premiumAnnual, "red", showPremiumAnnual, setShowPremiumAnnual)}
                            </>
                        ) : <p className="text-xs text-gray-500 text-center py-2 w-full">เลื่อนเมาส์บนกราฟเพื่อดูข้อมูล</p>}
                    </div>
                </div>

                {/* Section 2: Sliders (เรียงแนวตั้งภายใน Section นี้, Section นี้จะพยายามแคบ) */}
                <div className="flex flex-col space-y-1.5 order-2 w-full xs:w-auto xs:min-w-[160px] sm:max-w-[180px] md:max-w-[200px]">
                    <div className="flex flex-col items-center w-full">
                        {/*<h4 className="text-[11px] font-semibold text-gray-100 mb-0.5 whitespace-nowrap">
                            สัดส่วนเบี้ย RPP/RTU
                        </h4>*/}
                        <RppRtuRatioSlider rppPercent={rppPercent} totalPremium={totalPremium} onPercentChange={onPercentChange} compact={true} />
                    </div>
                    <div className="w-full">
                        <InvestmentReturnInput
                            label="ผลตอบแทนคาดหวัง (%ต่อปี)"
                            // labelClassName ถูกลบออกแล้ว
                            value={assumedReturnRate} onChange={onReturnRateChange} min={0} max={10} step={0.25}
                            displayPrecision={2} showInputField={false} sliderOnlyCompact={true} isFullScreenView={isFullScreenView}
                            // อาจจะต้องเพิ่ม prop สำหรับปรับขนาด label ภายใน InvestmentReturnInput ถ้าต้องการให้เล็กกว่า text-xs default
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