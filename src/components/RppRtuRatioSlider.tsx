import { useState, useEffect, useMemo, useCallback } from 'react';
import { RatioSlider } from "@/components/ui/ratio-slider";
import { useLocation } from 'react-router-dom';

interface RppRtuRatioSliderProps {
    rppPremium: number;
    totalPremium: number;
    onRppPremiumChange: (newPremium: number) => void;
    compact?: boolean;
    className?: string;
}

export default function RppRtuRatioSlider({
    rppPremium,
    totalPremium,
    onRppPremiumChange,
    compact = false,
    className
}: RppRtuRatioSliderProps) {

    // --- 1. สร้าง Local State เพื่อควบคุมค่าเปอร์เซ็นต์ของ Slider โดยตรง ---
    const [localPercent, setLocalPercent] = useState(() => 
        totalPremium > 0 ? Math.round((rppPremium / totalPremium) * 100) : 0
    );

    // --- 2. ใช้ useEffect เพื่อ Sync ค่าจากภายนอก (appStore) เข้ามาที่ Local State ---
    //    จะทำงานเมื่อ rppPremium หรือ totalPremium จาก props เปลี่ยนเท่านั้น
    useEffect(() => {
        const newPercent = totalPremium > 0 ? Math.round((rppPremium / totalPremium) * 100) : 0;
        setLocalPercent(newPercent);
    }, [rppPremium, totalPremium]);

    // --- 3. คำนวณค่าต่างๆ ที่จะแสดงผลจาก Local State ---
    const displayRpp = useMemo(() => Math.round(totalPremium * (localPercent / 100)), [totalPremium, localPercent]);
    const displayRtu = useMemo(() => totalPremium - displayRpp, [totalPremium, displayRpp]);
    const rtuPercent = useMemo(() => 100 - localPercent, [localPercent]);

    // --- 4. สร้าง Handlers สำหรับ Slider ---
    // onValueChange: อัปเดตแค่ Local State ระหว่างที่เลื่อน ทำให้ลื่นไหล
    const handleValueChange = useCallback((values: number[]) => {
        if (values && values.length > 0) {
            setLocalPercent(values[0]);
        }
    }, []);
    
    // onValueCommit: ทำงานตอน "ปล่อย" เมาส์/คีย์บอร์ด เพื่อส่งค่าสุดท้ายไปอัปเดต appStore
    const handleValueCommit = useCallback((values: number[]) => {
        if (values && values.length > 0 && totalPremium > 0) {
            const finalPercent = values[0];
            const finalRppPremium = Math.round(totalPremium * (finalPercent / 100));
            onRppPremiumChange(finalRppPremium); // เรียก action ของ appStore แค่ครั้งเดียว
        }
    }, [onRppPremiumChange, totalPremium]);
    
    const location = useLocation();
    const isChartPage = location.pathname === '/iwealthy/chart';

    // --- JSX Rendering ---

    // Compact Version
    if (compact) {
        return (
          <div className="space-y-1 w-full">
            <div className="flex justify-between text-[10px] text-pink-400 font-semibold">
                <span>RPP: {displayRpp.toLocaleString('en-US')}</span>
                <span>RTU: {displayRtu.toLocaleString('en-US')}</span>
            </div>
            <div className="flex w-full h-4 rounded-md overflow-hidden text-[10px]">
              <div
                style={{ width: `${localPercent}%` }}
                className={`relative flex items-center justify-center text-white transition-all duration-200 ease-out after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-white ${
                    isChartPage ? 'bg-gradient-to-r from-blue-300 to-pink-400' : 'bg-gradient-to-r from-blue-300 to-pink-400'
                }`}
              >
                {localPercent > 0 && `${localPercent}%`}
              </div>
              <div
                style={{ width: `${rtuPercent}%` }}
                className={`relative flex items-center justify-center text-white transition-all duration-200 ease-out after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-white ${
                    isChartPage ? 'bg-gradient-to-r from-pink-400 to-orange-500' : 'bg-gradient-to-r from-purple-600 to-orange-500'
                }`}
              >
                {rtuPercent > 0 && `${rtuPercent}%`}
              </div>
            </div>
            <RatioSlider
              value={[localPercent]}
              onValueChange={handleValueChange}
              onValueCommit={handleValueCommit}
              min={0} max={100} step={1}
              className={`w-full h-2 cursor-pointer ${className}`}
            />
          </div>
        );
    }

    // Full Version
    return (
        <div className="space-y-1 w-full">
            <div className="flex justify-between text-[10px] text-gray-500 px-1">
                <span>เน้นคุ้มครอง</span><span>เน้นสมดุล</span><span>เน้นลงทุน</span>
            </div>
            <div className="flex w-full h-6 rounded-md overflow-hidden text-[8px] sm:text-[10px] items-stretch">
                <div
                    style={{ width: `${localPercent}%` }}
                    className={`relative flex flex-col justify-center items-center text-white px-1 py-0.5 transition-all duration-200 ease-out after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-white ${
                        isChartPage ? 'bg-gradient-to-r from-blue-300 to-pink-400' : 'bg-gradient-to-r from-blue-900 to-purple-600'
                    }`}
                >
                    {localPercent > 0 && (
                        <>
                            <span className="font-semibold leading-tight">RPP {localPercent}%</span>
                            <span className="leading-tight">{displayRpp.toLocaleString('en-US')} บ.</span>
                        </>
                    )}
                </div>
                <div
                    style={{ width: `${rtuPercent}%` }}
                    className={`relative bg-orange-500 flex flex-col justify-center items-center text-white px-1 py-0.5 transition-all duration-200 ease-out after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-white ${
                        isChartPage ? 'bg-gradient-to-r from-pink-400 to-orange-500' : 'bg-gradient-to-r from-purple-600 to-orange-500'
                    }`}
                >
                    {rtuPercent > 0 && (
                        <>
                            <span className="font-semibold leading-tight">RTU {rtuPercent}%</span>
                            <span className="leading-tight">{displayRtu.toLocaleString('en-US')} บ.</span>
                        </>
                    )}
                </div>
            </div>
            <RatioSlider
                value={[localPercent]}
                onValueChange={handleValueChange}
                onValueCommit={handleValueCommit}
                min={0} max={100} step={1}
                className={`w-[calc(100%-16px)] mx-auto cursor-pointer ${className}`}
            />
        </div>
    );
}