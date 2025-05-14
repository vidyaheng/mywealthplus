// src/components/GraphInfoBox.tsx
import React from 'react';
import { ChartData } from './GraphComponent'; // ตรวจสอบ path ให้ถูกต้อง
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import RppRtuRatioSlider from './RppRtuRatioSlider'; // ตรวจสอบ path ให้ถูกต้อง
// import { Button } from "@/components/ui/button"; // ไม่ได้ใช้งานในโค้ดนี้

interface GraphInfoBoxProps {
    data: ChartData | null; // ข้อมูลจากจุดที่ hover บนกราฟ
    currentAge?: number; // อายุ ณ จุดที่ hover (อาจจะซ้ำกับ data.age)
    initialData: ChartData | null; // ข้อมูลเริ่มต้นที่จะแสดง (เช่น ปีแรก)
    showDeathBenefit: boolean;
    showAccountValue: boolean;
    showPremiumCumulative: boolean;
    showPremiumAnnual: boolean;
    setShowDeathBenefit: React.Dispatch<React.SetStateAction<boolean>>;
    setShowAccountValue: React.Dispatch<React.SetStateAction<boolean>>;
    setShowPremiumCumulative: React.Dispatch<React.SetStateAction<boolean>>;
    setShowPremiumAnnual: React.Dispatch<React.SetStateAction<boolean>>;
    rppPercent: number;
    totalPremium: number;
    onPercentChange: (percent: number) => void; // Handler เมื่อมีการเปลี่ยน % RPP/RTU
}

const GraphInfoBox: React.FC<GraphInfoBoxProps> = ({
    data,
    currentAge,
    initialData,
    setShowDeathBenefit,
    setShowAccountValue,
    setShowPremiumAnnual,
    setShowPremiumCumulative,
    showDeathBenefit,
    showAccountValue,
    showPremiumAnnual,
    showPremiumCumulative,
    rppPercent,
    totalPremium,
    onPercentChange
}) => {
    // ถ้ามี data (จาก hover) ให้ใช้ data นั้น, ถ้าไม่มี (เช่น ตอนเริ่ม) ให้ใช้ initialData
    const displayData = data || initialData;

    // Helper function สำหรับ format ตัวเลข (อาจจะย้ายไป utils)
    const formatDisplayNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return 'N/A';
        return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // ไม่เอาทศนิยม
    };

    return (
        <div className="w-full h-full bg-blue-900 text-white rounded-md shadow-lg p-4 flex flex-col overflow-y-auto"> {/* เพิ่ม shadow และ overflow */}
            <div className="text-center mb-3"> {/* ลด mb */}
                <h3 className="font-semibold text-base mt-2">สรุปผลประโยชน์</h3> {/* ปรับขนาด font */}
                {currentAge && (
                    <div className="text-lg font-bold mt-2">ช่วงอายุ {currentAge} ปี</div> 
                )}
            </div>

            {/* ส่วนแสดงข้อมูลตัวเลข */}
            {displayData ? (
                <div className="space-y-2 text-xs mb-3"> {/* ลด mb */}
                    {/* Death Benefit */}
                    <div className="flex items-center">
                        <Checkbox
                            id="infoBoxShowDeathBenefit"
                            checked={showDeathBenefit}
                            onCheckedChange={(checked) => typeof checked === 'boolean' && setShowDeathBenefit(checked)}
                            className="mr-2 h-4 w-4 mb-2 mt-4 bg-white border-blue-400 data-[state=checked]:border-blue-400 data-[state=checked]:bg-white [&[data-state=checked]>span>svg]:stroke-blue-700 [&>span>svg]:!stroke-[5px]"
                        />
                        <Label htmlFor="infoBoxShowDeathBenefit" className="flex-1 text-gray-300 text-xs pt-2">ผลประโยชน์เสียชีวิต:</Label>
                        <span className="font-semibold text-lg text-blue-300">{formatDisplayNumber(displayData.deathBenefit)}</span>
                    </div>
                    {/* Account Value */}
                    <div className="flex items-center">
                        <Checkbox
                            id="infoBoxShowAccountValue"
                            checked={showAccountValue}
                            onCheckedChange={(checked) => typeof checked === 'boolean' && setShowAccountValue(checked)}
                            className="mr-2 h-4 w-4 my-2 bg-white border-orange-400 data-[state=checked]:border-orange-400 data-[state=checked]:bg-white [&[data-state=checked]>span>svg]:stroke-orange-600 [&>span>svg]:!stroke-[5px]"
                        />
                        <Label htmlFor="infoBoxShowAccountValue" className="flex-1 text-gray-300 text-xs">มูลค่ากรมธรรม์:</Label>
                        <span className="font-semibold text-lg text-orange-300">{formatDisplayNumber(displayData.accountValue)}</span>
                    </div>
                    {/* Premium Cumulative */}
                    <div className="flex items-center">
                        <Checkbox
                            id="infoBoxShowPremiumCumulative"
                            checked={showPremiumCumulative}
                            onCheckedChange={(checked) => typeof checked === 'boolean' && setShowPremiumCumulative(checked)}
                            className="mr-2 h-4 w-4 my-2 bg-white border-green-500 data-[state=checked]:border-green-500 data-[state=checked]:bg-white [&[data-state=checked]>span>svg]:stroke-green-600 [&>span>svg]:!stroke-[5px]"
                        />
                        <Label htmlFor="infoBoxShowPremiumCumulative" className="flex-1 text-gray-300 text-xs">เบี้ยสะสม:</Label>
                        <span className="font-semibold text-lg text-green-300">{formatDisplayNumber(displayData.premiumCumulative)}</span>
                    </div>
                    {/* Premium Annual */}
                    <div className="flex items-center">
                        <Checkbox
                            id="infoBoxShowPremiumAnnual"
                            checked={showPremiumAnnual}
                            onCheckedChange={(checked) => typeof checked === 'boolean' && setShowPremiumAnnual(checked)}
                            className="mr-2 h-4 w-4 my-2 bg-white border-red-500 data-[state=checked]:border-red-500 data-[state=checked]:bg-white [&[data-state=checked]>span>svg]:stroke-red-700 [&>span>svg]:!stroke-[5px]"
                        />
                        <Label htmlFor="infoBoxShowPremiumAnnual" className="flex-1 text-gray-300 text-xs">เบี้ยรายปี:</Label>
                        <span className="font-semibold text-lg text-red-300">{formatDisplayNumber(displayData.premiumAnnual)}</span>
                    </div>
                </div>
            ) : (
                <p className="text-xs text-gray-400 text-center my-4">เลื่อนเมาส์บนกราฟเพื่อดูข้อมูล</p>
            )}

            {/* RPP/RTU Ratio Slider */}
            <div className="mt-auto pt-3 border-t border-blue-700"> {/* mt-auto ดันลงล่าง, pt-3 เพิ่มระยะห่าง */}
                <h3 className="font-semibold text-xs mb-1.5 text-center text-gray-300">ปรับสัดส่วนเบี้ย</h3>
                <RppRtuRatioSlider
                    rppPercent={rppPercent}
                    totalPremium={totalPremium}
                    onPercentChange={onPercentChange} // Handler จาก IWealthyChartPage -> App.tsx
                    compact={true}
                    className="ratio-slider-info-box" // ให้ className เฉพาะสำหรับ InfoBox ถ้าต้องการ style แยก
                    // อาจจะต้องปรับ style ของ Slider ให้เข้ากับพื้นหลังสีเข้ม
                />
                {/* ปุ่มคำนวณใหม่ (ถ้าต้องการให้คำนวณทันทีหลังปรับ Slider) */}
                {/* <Button
                    size="sm"
                    onClick={() => {
                        // อาจจะเรียก handleCalculate จาก Context โดยตรง หรือผ่าน prop
                        // onPercentChange ควรจะ set state ใน App.tsx แล้ว
                        // ถ้าต้องการคำนวณทันที อาจจะต้องให้ onPercentChange ใน App.tsx เรียก handleCalculate ด้วย
                        // หรือมี prop onRecalculate จาก IWealthyChartPage มาเรียก handleCalculate
                        console.log("Recalculate from InfoBox (Not implemented yet)");
                    }}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                    คำนวณใหม่
                </Button> */}
            </div>
        </div>
    );
};

export default GraphInfoBox;
