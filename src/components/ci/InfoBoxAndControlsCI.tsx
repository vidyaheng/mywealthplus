import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CiChartDataType } from './GraphComponentCI';

// 1. ✅ แก้ไข Props Interface ทั้งหมด
interface InfoBoxAndControlsCIProps {
    hoveredData: CiChartDataType | null;
    initialData: CiChartDataType | null;
    currentAge?: number;
    formatNumber: (num: number | undefined | null) => string;
    useIWealthy: boolean;
    controls: { // รับมาเป็น object ก้อนเดียว
        showCiPremium: boolean;
        showIWealthyPremium: boolean;
        showWithdrawal: boolean;
        showIWealthyAV: boolean;
        showTotalDB: boolean;
    };
    setControls: (updateFn: (prev: any) => any) => void; // รับ setter มา
}

const InfoBoxAndControlsCI: React.FC<InfoBoxAndControlsCIProps> = ({
    hoveredData, initialData, currentAge, formatNumber,
    useIWealthy,
    controls,     // 👈 2. รับ props แบบใหม่
    setControls
}) => {
    const displayData = hoveredData || initialData;
    const displayAge = currentAge || displayData?.age;

    // 3. ✅ สร้าง handler กลางสำหรับอัปเดต State ใน appStore
    const handleCheckChange = (key: keyof typeof controls, value: boolean) => {
        setControls(prev => ({ ...prev, [key]: value }));
    };

    // 4. ✅ แก้ไข allInfoItems ให้ใช้ controls และ handler ใหม่
    const allInfoItems = [
        { id: "ciPremium", label: "เบี้ยรวม CI (สะสม)", value: displayData?.ciPremium, color: "text-blue-400", 
          show: controls.showCiPremium, onCheckedChange: (c: boolean) => handleCheckChange('showCiPremium', c),
          iWealthyOnly: false, borderColorClass: "border-blue-400", checkColorClass: "data-[state=checked]:bg-blue-400" },
        { id: "iWealthyPremium", label: "เบี้ยรวม iWealthy (สะสม)", value: displayData?.iWealthyPremium, color: "text-purple-400", 
          show: controls.showIWealthyPremium, onCheckedChange: (c: boolean) => handleCheckChange('showIWealthyPremium', c),
          iWealthyOnly: true, borderColorClass: "border-purple-400", checkColorClass: "data-[state=checked]:bg-purple-400" },
        { id: "withdrawal", label: "เงินถอนจาก iW (สะสม)", value: displayData?.withdrawal, color: "text-yellow-400", 
          show: controls.showWithdrawal, onCheckedChange: (c: boolean) => handleCheckChange('showWithdrawal', c),
          iWealthyOnly: true, borderColorClass: "border-yellow-400", checkColorClass: "data-[state=checked]:bg-yellow-400" },
        { id: "iWealthyAV", label: "มูลค่าบัญชี iWealthy", value: displayData?.iWealthyAV, color: "text-green-400", 
          show: controls.showIWealthyAV, onCheckedChange: (c: boolean) => handleCheckChange('showIWealthyAV', c),
          iWealthyOnly: true, borderColorClass: "border-green-400", checkColorClass: "data-[state=checked]:bg-green-400" },
        { id: "totalDB", label: "คุ้มครองชีวิตรวม", value: displayData?.totalDB, color: "text-orange-400", 
          show: controls.showTotalDB, onCheckedChange: (c: boolean) => handleCheckChange('showTotalDB', c),
          iWealthyOnly: false, borderColorClass: "border-orange-400", checkColorClass: "data-[state=checked]:bg-orange-400" },
    ];

    const visibleInfoItems = allInfoItems.filter(item => !item.iWealthyOnly || useIWealthy);

    return (
        <div className="w-full h-full bg-blue-800 text-white rounded-md shadow-lg p-3 flex flex-col">
            <div className="text-center mb-2">
                <h3 className="font-semibold text-sm">สรุปข้อมูล ณ</h3>
                {displayAge && <div className="text-lg font-bold">อายุ {displayAge} ปี</div>}
            </div>

            <div className="space-y-2 text-xs mb-3 flex-grow overflow-y-auto pr-1">
                {!displayData && (
                    <p className="text-xs text-gray-400 text-center my-4">เลื่อนเมาส์บนกราฟเพื่อดูข้อมูล</p>
                )}
                {displayData && visibleInfoItems.map(item => (
                    <div key={item.id} className="py-1">
                        <div className="flex items-center">
                            {/* 5. ✅ แก้ไข onCheckedChange ให้เรียกใช้ฟังก์ชันใหม่ */}
                            <Checkbox
                                id={`infoBox-${item.id}`}
                                checked={item.show}
                                onCheckedChange={(checked) => typeof checked === 'boolean' && item.onCheckedChange(checked)}
                                className={`h-4 w-4 rounded-xs border-2 transition-colors 
                                    ${item.borderColorClass} 
                                    ${item.checkColorClass}
                                    data-[state=checked]:text-white
                                `}
                            />
                            <Label htmlFor={`infoBox-${item.id}`} className="ml-2 text-gray-200 cursor-pointer text-xs" title={item.label}>
                                {item.label}
                            </Label>
                        </div>
                        <div className="pl-6 mt-0.5">
                            <span className={`font-semibold text-base whitespace-nowrap ${item.color}`}>
                                {formatNumber(item.value)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InfoBoxAndControlsCI;