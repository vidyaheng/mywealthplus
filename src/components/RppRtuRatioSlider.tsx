// src/components/RppRtuRatioSlider.tsx (ปรับแก้)
import { useMemo, useCallback } from 'react'; // เพิ่ม useCallback
import { RatioSlider } from "@/components/ui/ratio-slider"; // ตรวจสอบ path
import { useLocation } from 'react-router-dom';

interface RppRtuRatioSliderProps {
  rppPercent: number;
  totalPremium: number;
  onPercentChange: (percent: number) => void;
  compact?: boolean;
  className?: string;
}

const SLIDER_STEP = 1; // Slider ทำงานกับค่าเปอร์เซ็นต์ที่เป็นจำนวนเต็ม

// Helper function สำหรับการ snap ค่าเปอร์เซ็นต์
const snapPercentValue = (currentPercent: number): number => {
    let snappedP = currentPercent; // ค่าเริ่มต้นคือไม่ snap

    // กฎเฉพาะสำหรับช่วง 90s (มีความสำคัญเหนือกว่ากฎทั่วไป)
    if (currentPercent === 92) {
        snappedP = 90;
    } else if (currentPercent === 97) {
        snappedP = 95;
    } else {
        // กฎทั่วไปตามหลักหน่วยในแต่ละช่วงสิบ (decade)
        const decadeBase = Math.floor(currentPercent / 10) * 10; // เช่น currentPercent=23, decadeBase=20
        const unitInDecade = currentPercent % 10;                 // เช่น currentPercent=23, unitInDecade=3

        if (unitInDecade === 3) { // เช่น 3->5, 13->15, 23->25
            snappedP = decadeBase + 5;
        } else if (unitInDecade === 8) { // เช่น 8->10, 18->20, 88->90
            snappedP = decadeBase + 10;
        }
        // กรณี 98: decadeBase=90, unitInDecade=8 -> snappedP = 90+10=100. ถูกต้องและจะถูก clamp ด้านล่าง
    }

    // ตรวจสอบให้แน่ใจว่าค่าที่ snap แล้วยังอยู่ในช่วง [0, 100]
    return Math.max(0, Math.min(100, snappedP));
};

export default function RppRtuRatioSlider({
  rppPercent,
  totalPremium,
  onPercentChange,
  compact = false,
  className
}: RppRtuRatioSliderProps) {

  const rtuPercent = useMemo(() => 100 - rppPercent, [rppPercent]);
  const displayRpp = useMemo(() => Math.round(totalPremium * (rppPercent / 100)), [totalPremium, rppPercent]);
  const displayRtu = useMemo(() => totalPremium - displayRpp, [totalPremium, displayRpp]);

  const handleSliderChange = useCallback((values: number[]) => {
    if (values && values.length > 0) {
      const proposedPercent = values[0]; // ค่า % ที่ slider ส่งมา (จะเป็นจำนวนเต็มเพราะ SLIDER_STEP = 1)

      // ใช้ logic การ snap เปอร์เซ็นต์แบบใหม่
      const snappedPercent = snapPercentValue(proposedPercent);
      
      // ส่งค่า % ที่ผ่านการ snap (และ clamp ให้อยู่ใน 0-100 แล้ว) กลับไป
      onPercentChange(snappedPercent);
    }
  }, [onPercentChange]); // Dependency มีแค่ onPercentChange เพราะ totalPremium ไม่เกี่ยวกับ logic snap % นี้

  const location = useLocation();
  const isChartPage = location.pathname === '/iwealthy/chart';

  // --- ส่วน JSX (ไม่มีการเปลี่ยนแปลงจากโค้ดที่คุณให้มาในคำถามนี้) ---

  // Compact Version JSX
  if (compact) {
    return (
      <div className="space-y-1 w-full">
        <div className="flex justify-between text-[10px] text-gray-700 font-semibold">
            <span>RPP: {displayRpp.toLocaleString('en-US')}</span>
            <span>RTU: {displayRtu.toLocaleString('en-US')}</span>
        </div>
        <div className="flex w-full h-6 rounded-md overflow-hidden text-[10px]">
          {/* RPP Part - ใส่ Gradient */}
          <div
            style={{ width: `${rppPercent}%` }}
            className={`relative flex items-center justify-center text-white transition-all duration-200 ease-out after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-white ${
              isChartPage ? 'bg-gradient-to-r from-blue-300 to-pink-400' : 'bg-gradient-to-r from-blue-900 to-purple-600'
            }`}
          >
            {rppPercent > 0 && `${rppPercent}%`} {/* แสดง % ถ้าไม่เท่ากับ 0 */}
          </div>
          {/* RTU Part */}
          <div
            style={{ width: `${rtuPercent}%` }}
            className={`relative flex items-center justify-center text-white transition-all duration-200 ease-out after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-white ${
              isChartPage ? 'bg-gradient-to-r from-pink-400 to-orange-500' : 'bg-gradient-to-r from-purple-600 to-orange-500'
            }`}
          >    
            {rtuPercent > 0 && `${rtuPercent}%`} {/* แสดง % ถ้าไม่เท่ากับ 0 */}
          </div>
        </div>
        <RatioSlider
          value={[rppPercent]}
          onValueChange={handleSliderChange}
          min={0} max={100} step={SLIDER_STEP}
          className={`w-full h-2 cursor-pointer ${className}`}
        />
        
      </div>
    );
  }

  // Full Version JSX
  return (
    <div className="space-y-2 w-full">
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>เน้นคุ้มครอง</span><span>เน้นสมดุล</span><span>เน้นลงทุน</span>
      </div>
      {/* Visual Bar - ใส่ Gradient */}
      <div className="flex w-full h-6 rounded-md overflow-hidden text-[10px] sm:text-xs items-stretch"> {/* แก้ไข typo ิflex -> flex */}
        {/* RPP Part - ใส่ Gradient */}
        <div
          style={{ width: `${rppPercent}%` }}
          className={`relative flex flex-col justify-center items-center text-white px-1 py-0.5 transition-all duration-200 ease-out after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-white ${
            isChartPage ? 'bg-gradient-to-r from-blue-300 to-pink-400' : 'bg-gradient-to-r from-blue-900 to-purple-600'
          }`}
        >
          {rppPercent > 0 && ( // แสดงเฉพาะเมื่อ % มากกว่า 0
            <>
              <span className="font-semibold leading-tight">RPP {rppPercent}%</span>
              <span className="leading-tight">{displayRpp.toLocaleString('en-US')} บ.</span>
            </>
          )}
        </div>
        {/* RTU Part */}
        <div
          style={{ width: `${rtuPercent}%` }}
          className={`relative bg-orange-500 flex flex-col justify-center items-center text-white px-1 py-0.5 transition-all duration-200 ease-out after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-white ${
            isChartPage ? 'bg-gradient-to-r from-pink-400 to-orange-500' : 'bg-gradient-to-r from-purple-600 to-orange-500'
          }`}
        >
          {rtuPercent > 0 && ( // แสดงเฉพาะเมื่อ % มากกว่า 0
            <>
              <span className="font-semibold leading-tight">RTU {rtuPercent}%</span>
              <span className="leading-tight">{displayRtu.toLocaleString('en-US')} บ.</span>
            </>
          )}
        </div>
      </div>
      {/* Actual Slider Control */}
      <RatioSlider
        value={[rppPercent]}
        onValueChange={handleSliderChange}
        min={0} max={100} step={SLIDER_STEP}
        className={`w-[calc(100%-16px)] mx-auto cursor-pointer ${className}`}
      />
    </div>
  );
}