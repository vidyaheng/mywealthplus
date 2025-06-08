// src/components/ci/InfoBoxAndControlsCI.tsx

import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CiChartDataType } from './GraphComponentCI';

// 1. แก้ไข: เพิ่ม useIWealthy เข้าไปใน Props Interface
interface InfoBoxAndControlsCIProps {
    hoveredData: CiChartDataType | null;
    initialData: CiChartDataType | null;
    currentAge?: number;
    formatNumber: (num: number | undefined | null) => string;
    useIWealthy: boolean; // 👈 เพิ่ม prop นี้
    showCiPremium: boolean;
    setShowCiPremium: React.Dispatch<React.SetStateAction<boolean>>;
    showIWealthyPremium: boolean;
    setShowIWealthyPremium: React.Dispatch<React.SetStateAction<boolean>>;
    showWithdrawal: boolean;
    setShowWithdrawal: React.Dispatch<React.SetStateAction<boolean>>;
    showIWealthyAV: boolean;
    setShowIWealthyAV: React.Dispatch<React.SetStateAction<boolean>>;
    showTotalDB: boolean;
    setShowTotalDB: React.Dispatch<React.SetStateAction<boolean>>;
}

const InfoBoxAndControlsCI: React.FC<InfoBoxAndControlsCIProps> = ({
    hoveredData, initialData, currentAge, formatNumber,
    useIWealthy, // 👈 2. รับ prop เข้ามาใช้งาน
    showCiPremium, setShowCiPremium,
    showIWealthyPremium, setShowIWealthyPremium,
    showWithdrawal, setShowWithdrawal,
    showIWealthyAV, setShowIWealthyAV,
    showTotalDB, setShowTotalDB
}) => {
    const displayData = hoveredData || initialData;
    const displayAge = currentAge || displayData?.age;

    // 3. แก้ไข: กรองรายการที่จะแสดงผลตามค่าของ useIWealthy
    const allInfoItems = [
        { id: "ciPremium", label: "เบี้ยรวม CI (สะสม)", value: displayData?.ciPremium, color: "text-blue-400", show: showCiPremium, setShow: setShowCiPremium, iWealthyOnly: false, borderColorClass: "border-blue-400", checkColorClass: "data-[state=checked]:bg-blue-400" },
        { id: "iWealthyPremium", label: "เบี้ยรวม iWealthy (สะสม)", value: displayData?.iWealthyPremium, color: "text-purple-400", show: showIWealthyPremium, setShow: setShowIWealthyPremium, iWealthyOnly: true, borderColorClass: "border-purple-400", checkColorClass: "data-[state=checked]:bg-purple-400" },
        { id: "withdrawal", label: "เงินถอนจาก iW (สะสม)", value: displayData?.withdrawal, color: "text-yellow-400", show: showWithdrawal, setShow: setShowWithdrawal, iWealthyOnly: true, borderColorClass: "border-yellow-400", checkColorClass: "data-[state=checked]:bg-yellow-400" },
        { id: "iWealthyAV", label: "มูลค่าบัญชี iWealthy", value: displayData?.iWealthyAV, color: "text-green-400", show: showIWealthyAV, setShow: setShowIWealthyAV, iWealthyOnly: true, borderColorClass: "border-green-400", checkColorClass: "data-[state=checked]:bg-green-400" },
        { id: "totalDB", label: "คุ้มครองชีวิตรวม", value: displayData?.totalDB, color: "text-orange-400", show: showTotalDB, setShow: setShowTotalDB, iWealthyOnly: false, borderColorClass: "border-orange-400", checkColorClass: "data-[state=checked]:bg-orange-400" },
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
                            {/* 🔥 2. แก้ไข: นำ Class สีมาใส่ใน className ของ Checkbox */}
                            <Checkbox
                                id={`infoBox-${item.id}`}
                                checked={item.show}
                                onCheckedChange={(checked) => typeof checked === 'boolean' && item.setShow(checked)}
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