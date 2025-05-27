// src/components/lthc/InfoBoxAndControlsLTHC.tsx
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { LthcChartDataType } from './GraphComponentLTHC';

interface InfoBoxAndControlsLTHCProps {
    hoveredData: LthcChartDataType | null;
    initialData: LthcChartDataType | null;
    currentAge?: number;
    formatNumber: (num: number | undefined | null) => string;
    showHealthPremiumAlone: boolean;
    setShowHealthPremiumAlone: React.Dispatch<React.SetStateAction<boolean>>;
    showLthcCombinedPremium: boolean;
    setShowLthcCombinedPremium: React.Dispatch<React.SetStateAction<boolean>>;
    showTotalCombinedDB: boolean;
    setShowTotalCombinedDB: React.Dispatch<React.SetStateAction<boolean>>;
    showCumulativeWithdrawal: boolean;
    setShowCumulativeWithdrawal: React.Dispatch<React.SetStateAction<boolean>>;
    showIWealthyAV: boolean;
    setShowIWealthyAV: React.Dispatch<React.SetStateAction<boolean>>;
    // isFullScreenView?: boolean; // อาจจะไม่จำเป็นแล้ว
}

const InfoBoxAndControlsLTHC: React.FC<InfoBoxAndControlsLTHCProps> = ({
    hoveredData, initialData, currentAge, formatNumber,
    showHealthPremiumAlone, setShowHealthPremiumAlone,
    showLthcCombinedPremium, setShowLthcCombinedPremium,
    showTotalCombinedDB, setShowTotalCombinedDB,
    showCumulativeWithdrawal, setShowCumulativeWithdrawal,
    showIWealthyAV, setShowIWealthyAV,
}) => {
    const displayData = hoveredData || initialData;
    const displayAge = currentAge || displayData?.age;

    const infoItems = [
        { id: "healthPremiumAlone", label: "เบี้ยสุขภาพรวม", value: displayData?.healthPremiumAlone, color: "text-red-400", lineColorCSSClass: "lthc-checkbox-healthPremiumAlone", show: showHealthPremiumAlone, setShow: setShowHealthPremiumAlone },
        { id: "lthcCombinedPremium", label: "เบี้ยรวม LTHC", value: displayData?.lthcCombinedPremium, color: "text-green-400", lineColorCSSClass: "lthc-checkbox-lthcCombinedPremium", show: showLthcCombinedPremium, setShow: setShowLthcCombinedPremium },  
        { id: "cumulativeWithdrawal", label: "เงินถอนจากรวม", value: displayData?.cumulativeWithdrawal, color: "text-yellow-500", lineColorCSSClass: "lthc-checkbox-cumulativeWithdrawal", show: showCumulativeWithdrawal, setShow: setShowCumulativeWithdrawal },
        { id: "totalCombinedDB", label: "คุ้มครองชีวิตรวม", value: displayData?.totalCombinedDeathBenefit, color: "text-purple-400", lineColorCSSClass: "lthc-checkbox-totalCombinedDB", show: showTotalCombinedDB, setShow: setShowTotalCombinedDB },
        { id: "eoyAccountValue", label: "มูลค่ากรมธรรม์", value: displayData?.eoyAccountValue, color: "text-teal-400", lineColorCSSClass: "lthc-checkbox-eoyAccountValue", show: showIWealthyAV, setShow: setShowIWealthyAV },
    ];

    return (
        <div className="w-full h-full bg-blue-800 text-white rounded-md shadow-lg p-3 flex flex-col">
            <div className="text-center mb-2">
                <h3 className="font-semibold text-sm ">สรุปผลประโยชน์</h3>
                {displayAge && <div className="text-md font-bold">ช่วงอายุ {displayAge} ปี</div>}
            </div>

            <div className="space-y-2 text-xs mb-3 flex-grow overflow-y-auto pr-1"> {/* ลด space-y ถ้าต้องการให้ชิดกันมากขึ้น */}
                {!displayData && (
                    <p className="text-xs text-gray-400 text-center my-4">เลื่อนเมาส์บนกราฟเพื่อดูข้อมูล</p>
                )}
                {displayData && infoItems.map(item => (
                    // ⭐⭐⭐ เริ่มการแก้ไข Layout ของแต่ละ Item ⭐⭐⭐
                    <div key={item.id} className="py-0.5"> {/* แต่ละ item เป็น block */}
                        <div className="flex items-center"> {/* แถวสำหรับ Checkbox และ Label */}
                            <Checkbox
                                id={`infoBox-${item.id}`}
                                checked={item.show}
                                onCheckedChange={(checked) => typeof checked === 'boolean' && item.setShow(checked)}
                                className={`lthc-checkbox-base h-4 w-4 flex-shrink-0 rounded-xs
                                        ${item.lineColorCSSClass}
                                        data-[state=checked]:bg-white 
                                        data-[state=unchecked]:bg-white
                                      `}
                            />
                            <Label htmlFor={`infoBox-${item.id}`} className="ml-2 text-gray-100 cursor-pointer text-xs" title={item.label}>
                                {item.label.split('(')[0].trim()} {/* แสดงเฉพาะส่วนแรกของ label */}
                            </Label>
                        </div>
                        <div className="pl-5 mt-0.5"> {/* เพิ่ม padding-left เพื่อเยื้อง และ mt เล็กน้อย */}
                            <span className={`font-semibold text-base whitespace-nowrap ${item.color || 'text-white'}`}>
                                {formatNumber(item.value)}
                            </span>
                        </div>
                    </div>
                    // ⭐⭐⭐ จบการแก้ไข Layout ของแต่ละ Item ⭐⭐⭐
                ))}
            </div>
            {/* ไม่ต้องมีส่วน Toggle Switches ด้านล่างอีกต่อไป */}
        </div>
    );
};

export default InfoBoxAndControlsLTHC;