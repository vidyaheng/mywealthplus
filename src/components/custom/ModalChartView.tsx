// src/components/modal_views/ModalChartView.tsx
// (กรุณาปรับ path ของ imports ให้ถูกต้อง)

import React from 'react';
import Graph, { ChartData } from '@/components/GraphComponent'; // ChartData อาจจะ import จากที่เดียวกับที่ GraphComponent ใช้
import ModalChartControls from '@/components/custom/ModalChartControls'; // นี่คือ Component ที่คุณเพิ่งส่งมาล่าสุด


// Props ที่ ModalChartView ต้องการ (รวบรวมจาก Props ของ ModalChartControls และ GraphComponent)
interface ModalChartViewProps {
    // Props สำหรับ ModalChartControls
    hoveredData: ChartData | null;
    initialData: ChartData | null; // initialDataForInfoBox
    currentAge?: number; // currentAgeForInfoBox
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
    onRecalculate: () => void; // สำหรับปุ่ม Update ใน ModalChartControls

    // Props สำหรับ GraphComponent
    chartData: ChartData[]; // data ที่จะใช้พล็อต
    setHoveredData: React.Dispatch<React.SetStateAction<ChartData | null>>;
    onAgeChange: (ageFromGraph: number) => void; // onGraphAgeChange
}

const ModalChartView: React.FC<ModalChartViewProps> = (props) => {
    return (
        // Root div ของ chartContent: className="flex flex-col h-full w-full bg-slate-50"
        // h-full เพื่อให้มันยืดเต็มพื้นที่ของ TabsContent (กราฟ)
        <div className="flex flex-col h-full w-full bg-slate-50"> 
            {/* Controls Section */}
            <div className="flex-shrink-0 p-2 md:p-3 border-b border-slate-300 bg-white shadow-sm">
                <ModalChartControls
                    hoveredData={props.hoveredData}
                    initialData={props.initialData}
                    currentAge={props.currentAge}
                    formatNumber={props.formatNumber}
                    showDeathBenefit={props.showDeathBenefit}
                    setShowDeathBenefit={props.setShowDeathBenefit}
                    showAccountValue={props.showAccountValue}
                    setShowAccountValue={props.setShowAccountValue}
                    showPremiumAnnual={props.showPremiumAnnual}
                    setShowPremiumAnnual={props.setShowPremiumAnnual}
                    showPremiumCumulative={props.showPremiumCumulative}
                    setShowPremiumCumulative={props.setShowPremiumCumulative}
                    rppPercent={props.rppPercent}
                    totalPremium={props.totalPremium}
                    onPercentChange={props.onPercentChange}
                    assumedReturnRate={props.assumedReturnRate}
                    onReturnRateChange={props.onReturnRateChange}
                    onRecalculate={props.onRecalculate}
                    isFullScreenView={true} // <<<< ส่ง true เพื่อให้ ModalChartControls ใช้ layout สำหรับ fullscreen
                />
            </div>

            {/* Graph Container Section */}
            {/* flex-1 เพื่อให้ใช้พื้นที่ที่เหลือ, เพิ่ม flex justify-center items-center เพื่อจัดกราฟ (ที่กว้าง 85%) ให้อยู่กลาง */}
            <div className="flex-1 w-full h-full relative mt-1 flex justify-center items-center">
                {/* Div ใหม่สำหรับกำหนดความกว้าง 85% ของกราฟ */}
                <div 
                    className="w-[85%] h-full bg-white shadow-sm rounded-md overflow-y-auto" // เพิ่ม style ให้เห็นกรอบ และ scroll
                    style={{
                        minHeight: '500px', // ความสูงต่ำสุดที่ต้องการสำหรับพื้นที่แสดงกราฟ
                        maxHeight: '800px', // ความสูงสูงสุดที่ต้องการ (ถ้าพื้นที่จาก flex-1 มากกว่านี้ จะถูกจำกัดที่ค่านี)
                                           // คุณสามารถใช้หน่วย vh ได้ เช่น '70vh' แต่ต้องระวังว่าจะไม่สูงเกิน Modal โดยรวม
                    }}
                >
                    <Graph 
                        data={props.chartData}
                        setHoveredData={props.setHoveredData}
                        showDeathBenefit={props.showDeathBenefit}
                        showAccountValue={props.showAccountValue}
                        showPremiumAnnual={props.showPremiumAnnual}
                        showPremiumCumulative={props.showPremiumCumulative}
                        onAgeChange={props.onAgeChange}
                        // GraphComponent ใช้ ResponsiveContainer width="100%" height="100%" ภายในอยู่แล้ว
                    />
                </div>
            </div>
        </div>
    );
};

export default ModalChartView;