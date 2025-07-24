// src/pages/iwealthy/IWealthyChartPage.tsx

import { useMemo, useState, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';

// --- Type and Component Imports ---
import Graph, { ChartData } from '../../components/GraphComponent';
import ModalChartControls from '../../components/custom/ModalChartControls';
import { Button } from "@/components/ui/button";
//import { AnnualCalculationOutputRow } from '../../lib/calculations';
import { ZoomIn } from 'lucide-react';
import FullScreenDisplayModal from '@/components/custom/FullScreenDisplayModal';
import ModalTableView from '@/components/custom/ModalTableView'; 
import ModalChartView from '../../components/custom/ModalChartView';
import { AnnualTableView } from '@/components/DisplayTable';

export default function IWealthyChartPage() {
    // --- ดึง State และ Actions จาก Store (เหมือนเดิม) ---
    const {
        iWealthyResult, iWealthyIsLoading, iWealthyRpp, iWealthyRtu,
        iWealthyAge, iWealthyGender, iWealthySumInsured, iWealthyInvestmentReturn,
        setIWealthyInvestmentReturn, handleIWealthyRppRtuSlider, runIWealthyCalculation,
        annualMIRRData
    } = useAppStore();

    const navigate = useNavigate();

    // --- Local State สำหรับ UI Controls (เหมือนเดิม) ---
    const [hoveredGraphData, setHoveredGraphData] = useState<ChartData | null>(null);
    const [showDeathBenefit, setShowDeathBenefit] = useState(true);
    const [showAccountValue, setShowAccountValue] = useState(true);
    const [showPremiumAnnual, setShowPremiumAnnual] = useState(false);
    const [showPremiumCumulative, setShowPremiumCumulative] = useState(true);
    const [currentAgeForInfoBox, setCurrentAgeForInfoBox] = useState<number | undefined>(iWealthyAge);
    const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
    const [modalTableViewMode, setModalTableViewMode] = useState<AnnualTableView>('compact');
    const [modalTableShowCsv, setModalTableShowCsv] = useState(false);
    const [hoveredMirrValue, setHoveredMirrValue] = useState<string | undefined>(undefined);
    
    // --- Handlers (ส่วนใหญ่เหมือนเดิม) ---
    const openFullScreenModal = useCallback(() => setIsFullScreenModalOpen(true), []);
    const closeFullScreenModal = useCallback(() => {
        setIsFullScreenModalOpen(false);
        setHoveredGraphData(null); 
        setCurrentAgeForInfoBox(iWealthyAge); 
        setHoveredMirrValue(undefined);
    }, [iWealthyAge]);
    
    // +++ จุดที่แก้ไข +++
    const formatNumber = useCallback((num: number | undefined | null): string => {
        if (num == null) return '0'; // Handles both undefined and null
        return Math.round(num).toLocaleString('en-US');
    }, []);

    // +++ จุดที่แก้ไข: เปลี่ยน Logic การกรองข้อมูลให้เหมือนกับหน้า Table +++
    const chartDataForGraph = useMemo((): ChartData[] => {
        if (!iWealthyResult?.annual || iWealthyResult.annual.length === 0) return [];
        
        const originalData = iWealthyResult.annual;

        // 1. หา index ของแถว "แรก" ที่มูลค่ากรมธรรม์ (eoyAccountValue) เป็น 0 หรือน้อยกว่า
        const firstZeroIndex = originalData.findIndex(row => (row.eoyAccountValue ?? 0) <= 0.005);
        
        // 2. ถ้าไม่เจอแถวที่เป็น 0 เลย ให้ใช้ข้อมูลทั้งหมด
        const dataToProcess = firstZeroIndex === -1 
            ? originalData 
            : originalData.slice(0, firstZeroIndex + 1);

        // 3. แปลงข้อมูลที่กรองแล้วให้เป็นรูปแบบของ ChartData
        let cumulativePremium = 0;
        return dataToProcess.map(row => {
            cumulativePremium += row.totalPremiumYear;
            return {
                age: row.age,
                deathBenefit: row.eoyDeathBenefit,
                accountValue: row.eoyAccountValue,
                premiumAnnual: row.totalPremiumYear,
                premiumCumulative: cumulativePremium,
            };
        });
    }, [iWealthyResult]);

    const initialDataForInfoBox = useMemo(() => chartDataForGraph.length > 0 ? chartDataForGraph[0] : null, [chartDataForGraph]);
    const totalPremiumForSlider = useMemo(() => iWealthyRpp + iWealthyRtu, [iWealthyRpp, iWealthyRtu]);
    const rppPercentForSlider = useMemo(() => (totalPremiumForSlider > 0 ? Math.round((iWealthyRpp / totalPremiumForSlider) * 100) : 100), [iWealthyRpp, totalPremiumForSlider]);
    
    const handleGraphAgeChange = useCallback((ageFromGraph: number | undefined) => { // เปลี่ยน type เป็น number | undefined
        if (ageFromGraph !== undefined && !isNaN(ageFromGraph)) { // เพิ่มการตรวจสอบ isNaN
            setCurrentAgeForInfoBox(ageFromGraph);
            const dataPoint = chartDataForGraph.find(d => d.age === ageFromGraph);
            if (dataPoint) {
                setHoveredGraphData(dataPoint);
            }
            const mirrForAge = annualMIRRData?.get(ageFromGraph);
            if (mirrForAge !== undefined && mirrForAge !== null) {
                setHoveredMirrValue(`${(mirrForAge * 100).toFixed(2)}%`);
            } else {
                setHoveredMirrValue(undefined);
            }
        } else { // เมื่อเมาส์ออกจากกราฟ
            setCurrentAgeForInfoBox(iWealthyAge); // กลับไปใช้ age เริ่มต้น
            setHoveredGraphData(null);
            setHoveredMirrValue(undefined);
        }
    }, [chartDataForGraph, annualMIRRData, setHoveredGraphData, setCurrentAgeForInfoBox, setHoveredMirrValue, iWealthyAge]);

    // --- ตรวจสอบ Loading และ Data (ไม่มีการเปลี่ยนแปลง) ---
    //useEffect(() => {
    //    if (!iWealthyIsLoading && !iWealthyResult) {
    //        navigate('/iwealthy/form', { replace: true });
    //    }
    //}, [iWealthyIsLoading, iWealthyResult, navigate]);

    if (iWealthyIsLoading) return <div className="p-4 text-center">กำลังคำนวณ...</div>;
    if (!iWealthyResult || chartDataForGraph.length === 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณากลับไปหน้ากรอกข้อมูลและกด "คำนวณ"...
                <Button onClick={() => navigate('/iwealthy/form')} className="ml-2 mt-2">
                        ไปหน้ากรอกข้อมูล
                </Button>   
            </div>
        );
    }

    // --- สร้าง Content Node สำหรับ Modal (เหมือนเดิม) ---
    const tableTabContentNode = <ModalTableView data={iWealthyResult.annual} onRecalculate={runIWealthyCalculation} viewMode={modalTableViewMode} onViewModeChange={setModalTableViewMode} showCsv={modalTableShowCsv} onShowCsvToggle={() => setModalTableShowCsv(p => !p)} formatNumber={formatNumber} />;
    //const graphTabContentNode = <ModalChartView chartData={chartDataForGraph} hoveredData={hoveredGraphData} setHoveredData={setHoveredGraphData} initialData={initialDataForInfoBox} currentAge={currentAgeForInfoBox} formatNumber={formatNumber} showDeathBenefit={showDeathBenefit} setShowDeathBenefit={setShowDeathBenefit} showAccountValue={showAccountValue} setShowAccountValue={setShowAccountValue} showPremiumAnnual={showPremiumAnnual} setShowPremiumAnnual={setShowPremiumAnnual} showPremiumCumulative={showPremiumCumulative} setShowPremiumCumulative={setShowPremiumCumulative} rppPercent={rppPercentForSlider} totalPremium={totalPremiumForSlider} onPercentChange={handleIWealthyRppRtuSlider} assumedReturnRate={iWealthyInvestmentReturn} onReturnRateChange={setIWealthyInvestmentReturn} onRecalculate={runIWealthyCalculation} onAgeChange={handleGraphAgeChange} isFullScreenView={true} />;

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-800">กราฟแสดงผลประโยชน์</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/iwealthy/table')}>ไปที่ตาราง</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" title="แสดงผลเต็มหน้าจอ" onClick={openFullScreenModal}>
                        <ZoomIn size={16} />
                    </Button>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-700">อายุผู้เอาประกัน: {iWealthyAge} ปี | ช่วงอายุในกราฟ: {chartDataForGraph[0]?.age} - {chartDataForGraph[chartDataForGraph.length - 1]?.age} ปี</p>
                <p className="text-xs text-gray-500">ผลตอบแทนที่ใช้คำนวณ: {iWealthyInvestmentReturn}%</p>
            </div>
            
            {/* +++ Layout ที่แก้ไขแล้ว (Side-by-side on Medium screens) +++ */}
             <div className="flex flex-col md:flex-row w-full h-[calc(100vh-220px)] gap-4">
                {/* ส่วนของกราฟ (ซ้าย) */}
                <div className="flex-grow md:w-3/4 border border-gray-200 rounded-lg shadow-sm p-2 bg-white">
                    <Graph
                        data={chartDataForGraph}
                        setHoveredData={setHoveredGraphData}
                        showDeathBenefit={showDeathBenefit}
                        showAccountValue={showAccountValue}
                        showPremiumAnnual={showPremiumAnnual}
                        showPremiumCumulative={showPremiumCumulative}
                        onAgeChange={handleGraphAgeChange}
                        hoveredAge={currentAgeForInfoBox} // <--- เพิ่ม: ส่ง hoveredAge ไปยัง Graph
                        hoveredMirr={hoveredMirrValue} // <--- เพิ่ม: ส่ง hoveredMirr ไปยัง Graph
                        mirrData={annualMIRRData} // <--- เพิ่ม: ส่ง mirrData ไปยัง Graph
                    />
                </div>

                {/* ส่วนแผงควบคุม (ขวา) */}
                <div className="w-full md:w-1/4 flex-shrink-0">
                    <div className="rounded-lg shadow-sm bg-blue-900 h-full overflow-y-auto">
                        <ModalChartControls
                            hoveredData={hoveredGraphData}
                            initialData={initialDataForInfoBox}
                            currentAge={currentAgeForInfoBox}
                            formatNumber={formatNumber}
                            showDeathBenefit={showDeathBenefit}
                            setShowDeathBenefit={setShowDeathBenefit}
                            showAccountValue={showAccountValue}
                            setShowAccountValue={setShowAccountValue}
                            showPremiumAnnual={showPremiumAnnual}
                            setShowPremiumAnnual={setShowPremiumAnnual}
                            showPremiumCumulative={showPremiumCumulative}
                            setShowPremiumCumulative={setShowPremiumCumulative}
                            rppPercent={rppPercentForSlider}
                            totalPremium={totalPremiumForSlider}
                            onPercentChange={handleIWealthyRppRtuSlider}
                            assumedReturnRate={iWealthyInvestmentReturn}
                            onReturnRateChange={setIWealthyInvestmentReturn}
                            onRecalculate={runIWealthyCalculation}
                            isFullScreenView={false} // ส่ง false เพราะเป็นการแสดงผลในหน้าปกติ
                        />
                    </div>
                </div>
            </div>

            {/* FullScreenModal จะใช้ Logic เดิม */}
            {isFullScreenModalOpen && (
                <FullScreenDisplayModal
                    isOpen={isFullScreenModalOpen}
                    onClose={closeFullScreenModal}
                    defaultActiveTab="graph"
                    modalTitle="ภาพรวมผลประโยชน์ (iWealthy)"
                    headerInfo={
                        <div className="text-xs">
                            <p>ผู้เอาประกัน: (iWealthy)</p>
                            <p>อายุ: {iWealthyAge} | เพศ: {iWealthyGender === 'male' ? 'ชาย' : 'หญิง'}</p>
                            <p>ทุนประกันภัยหลัก: {formatNumber(iWealthySumInsured)} บาท</p>
                        </div>
                    }
                    tableTabContent={tableTabContentNode}
                    graphTabContent={
                        <ModalChartView 
                            chartData={chartDataForGraph} 
                            hoveredData={hoveredGraphData} 
                            setHoveredData={setHoveredGraphData} 
                            initialData={initialDataForInfoBox} 
                            currentAge={currentAgeForInfoBox} 
                            formatNumber={formatNumber} 
                            showDeathBenefit={showDeathBenefit} 
                            setShowDeathBenefit={setShowDeathBenefit} 
                            showAccountValue={showAccountValue} 
                            setShowAccountValue={setShowAccountValue} 
                            showPremiumAnnual={showPremiumAnnual} 
                            setShowPremiumAnnual={setShowPremiumAnnual} 
                            showPremiumCumulative={showPremiumCumulative} 
                            setShowPremiumCumulative={setShowPremiumCumulative} 
                            rppPercent={rppPercentForSlider} 
                            totalPremium={totalPremiumForSlider} 
                            onPercentChange={handleIWealthyRppRtuSlider} 
                            assumedReturnRate={iWealthyInvestmentReturn} 
                            onReturnRateChange={setIWealthyInvestmentReturn} 
                            onRecalculate={runIWealthyCalculation} 
                            onAgeChange={handleGraphAgeChange} 
                            isFullScreenView={true} 
                            hoveredAge={currentAgeForInfoBox} 
                            hoveredMirr={hoveredMirrValue} 
                            mirrData={annualMIRRData} // <--- ส่ง mirrData ไปให้ ModalChartView
                        />
                    }
                />
            )}
        </div>
    );
}