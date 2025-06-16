// src/pages/iwealthy/IWealthyChartPage.tsx

import { useMemo, useState, useCallback, useEffect } from 'react'; // React import
import { useAppOutletContext } from '../../App';
import Graph, { ChartData } from '../../components/GraphComponent'; // ใช้ ChartData จากที่นี่
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AnnualCalculationOutputRow } from '../../lib/calculations';
import { ZoomIn } from 'lucide-react'; // Plus, Minus อาจจะไม่จำเป็นแล้ว
import FullScreenDisplayModal from '@/components/custom/FullScreenDisplayModal';
// DisplayTable, ToggleGroup ไม่ต้อง import โดยตรงที่นี่แล้ว
import ModalChartControls from '@/components/custom/ModalChartControls';

// --- Import Modal View Components ---
import ModalTableView from '@/components/custom/ModalTableView'; 
import ModalChartView from '@/components/custom/ModalChartView'; 
import { AnnualTableView } from '@/components/DisplayTable';

const IWealthyChartPage = () => {
    const {
        illustrationData,
        rpp,
        rtu,
        handlePercentChange,
        age, // Policyholder's current age from context
        //gender, // For modal headerInfo
        //sumInsured, // For modal headerInfo
        investmentReturn, // currentAssumedReturnRatePercent
        setInvestmentReturn, // onReturnRateChange
        handleCalculate, // onRecalculate
        // rppPercent, // This is calculated below as rppPercentForSlider
    } = useAppOutletContext();

    const navigate = useNavigate();
    const location = useLocation();

    // States for Graph interactions and controls (used by both on-page graph and modal graph)
    const [hoveredGraphData, setHoveredGraphData] = useState<ChartData | null>(null);
    const [showDeathBenefit, setShowDeathBenefit] = useState(true);
    const [showAccountValue, setShowAccountValue] = useState(true);
    const [showPremiumAnnual, setShowPremiumAnnual] = useState(true); // Default to false as per your ModalChartControls
    const [showPremiumCumulative, setShowPremiumCumulative] = useState(true);
    const [currentAgeForInfoBox, setCurrentAgeInfoBox] = useState<number | undefined>(age);

    // States specifically for the Table View within the Modal
    const [modalTableViewMode, setModalTableViewMode] = useState<AnnualTableView>('compact');
    const [modalTableShowCsv, setModalTableShowCsv] = useState(false);

    // Modal visibility state
    const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
    const openFullScreenModal = () => setIsFullScreenModalOpen(true);
    const closeFullScreenModal = () => {
        setIsFullScreenModalOpen(false);
        // Reset modal-specific hover/age states if desired
        setHoveredGraphData(null); 
        setCurrentAgeInfoBox(age); 
    };

    // Memoized values for controls/props
    const currentAssumedReturnRatePercent = useMemo(() => investmentReturn, [investmentReturn]);
    const totalPremiumForSlider = useMemo(() => (rpp || 0) + (rtu || 0), [rpp, rtu]);
    const rppPercentForSlider = useMemo(() => (totalPremiumForSlider > 0 ? Math.round(((rpp || 0) / totalPremiumForSlider) * 100) : 100), [rpp, totalPremiumForSlider]);

    // Callbacks for controls (can be used by both on-page and modal controls if logic is the same)
    const handleReturnRateChangeForControls = useCallback((newRatePercentage: number) => {
        if (investmentReturn !== newRatePercentage) {
            setInvestmentReturn(newRatePercentage);
            // Recalculation is typically triggered by an "Update" button calling handleCalculate
        }
    }, [investmentReturn, setInvestmentReturn]);

    const handlePercentChangeForControls = useCallback((newRppPercent: number) => {
        handlePercentChange(newRppPercent);
        // Recalculation is typically triggered by an "Update" button
    }, [handlePercentChange]);

    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return '0';
        return Math.round(num).toLocaleString('en-US');
    };

    const initialDataForInfoBoxToUse = useMemo(() => {
        if (illustrationData?.annual && illustrationData.annual.length > 0) {
            const firstRecord = illustrationData.annual[0];
            return {
                age: firstRecord.age,
                deathBenefit: firstRecord.eoyDeathBenefit / Math.pow(1.0035, firstRecord.policyYear),
                accountValue: firstRecord.eoyAccountValue,
                premiumCumulative: firstRecord.totalPremiumYear, 
                premiumAnnual: firstRecord.totalPremiumYear,
            };
        }
        return null;
    }, [illustrationData]);

    const chartDataForGraph: ChartData[] = useMemo(() => {
        if (!illustrationData?.annual) return [];
        let cumulativePremium = 0;
        return illustrationData.annual
            .filter((row: AnnualCalculationOutputRow) => row.eoyAccountValue > 0) // <--- เพิ่ม filter ตรงนี้
            .map((row: AnnualCalculationOutputRow) => {
                cumulativePremium += row.totalPremiumYear;
                return {
                    age: row.age,
                    deathBenefit: row.eoyDeathBenefit,
                    accountValue: row.eoyAccountValue,
                    premiumAnnual: row.totalPremiumYear,
                    premiumCumulative: cumulativePremium,
                };
            });
    }, [illustrationData]);
    
    const handleGraphAgeChangeFromComponent = (ageFromGraph: number) => {
        setCurrentAgeInfoBox(ageFromGraph);
        const dataPoint = chartDataForGraph.find(d => d.age === ageFromGraph);
        if (dataPoint) {
            setHoveredGraphData(dataPoint);
        }
    };
    
    const filteredAnnualDataForModalTable: AnnualCalculationOutputRow[] = useMemo(() => {
        if (!illustrationData?.annual || illustrationData.annual.length === 0) return [];
        const originalAnnualData = illustrationData.annual;
        let lastPositiveIndex = -1;
        for (let i = originalAnnualData.length - 1; i >= 0; i--) {
            if (originalAnnualData[i].eoyAccountValue > 0.005) {
                lastPositiveIndex = i;
                break;
            }
        }
        if (lastPositiveIndex === -1 && originalAnnualData.length > 0) return [];
        if (lastPositiveIndex === -1) return [];
        return originalAnnualData.slice(0, lastPositiveIndex + 1);
    }, [illustrationData]);

    useEffect(() => {
        if (!illustrationData && location.pathname.includes('/iwealthy/chart')) {
            console.log("[IWealthyChartPage] No illustration data. Navigating to form might be an option if this state is unexpected.");
            // navigate('/iwealthy/form', { replace: true });
        }
    }, [illustrationData, location.pathname, navigate]);

    if (!illustrationData?.annual || chartDataForGraph.length === 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณากลับไปหน้ากรอกข้อมูลและกด "คำนวณ" เพื่อดูผลประโยชน์
                <Button onClick={() => navigate('/iwealthy/form')} className="ml-2">ไปหน้ากรอกข้อมูล</Button>
            </div>
        );
    }

    // --- Prepare content for Tabs in Modal ---
    const tableTabContentNode = (
        <ModalTableView
            data={filteredAnnualDataForModalTable}
            formatNumber={formatNumber}
            viewMode={modalTableViewMode}
            onViewModeChange={setModalTableViewMode} // Use modal-specific state handlers
            showCsv={modalTableShowCsv}
            onShowCsvToggle={() => setModalTableShowCsv(prev => !prev)} // Use modal-specific state handlers
            onRecalculate={handleCalculate}
            caption="ตารางผลประโยชน์ใน Modal"
        />
    );

    const graphTabContentNode = (
        <ModalChartView
            chartData={chartDataForGraph}
            hoveredData={hoveredGraphData} // Can use page's hover state
            setHoveredData={setHoveredGraphData} // Can use page's hover state setter
            initialData={initialDataForInfoBoxToUse}
            currentAge={currentAgeForInfoBox} // Can use page's current age state for infobox
            formatNumber={formatNumber}
            showDeathBenefit={showDeathBenefit} // Use page's show/hide states
            setShowDeathBenefit={setShowDeathBenefit}
            showAccountValue={showAccountValue}
            setShowAccountValue={setShowAccountValue}
            showPremiumAnnual={showPremiumAnnual}
            setShowPremiumAnnual={setShowPremiumAnnual}
            showPremiumCumulative={showPremiumCumulative}
            setShowPremiumCumulative={setShowPremiumCumulative}
            rppPercent={rppPercentForSlider}
            totalPremium={totalPremiumForSlider}
            onPercentChange={handlePercentChangeForControls}
            assumedReturnRate={currentAssumedReturnRatePercent}
            onReturnRateChange={handleReturnRateChangeForControls}
            onRecalculate={handleCalculate}
            onAgeChange={handleGraphAgeChangeFromComponent}
        />
    );

    return (
        <div className="p-4 md:p-6 space-y-4 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-800">
                    กราฟแสดงผลประโยชน์ (iWealthy)
                </h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/iwealthy/table')}>
                        ไปที่ตาราง
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" title="แสดงผลเต็มหน้าจอ" onClick={openFullScreenModal}>
                        <ZoomIn size={16} />
                    </Button>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-700">
                    อายุผู้เอาประกัน: {age} ปี | ช่วงอายุในกราฟ: {chartDataForGraph[0]?.age} - {chartDataForGraph[chartDataForGraph.length - 1]?.age} ปี
                </p>
                <p className="text-xs text-gray-500">ผลตอบแทนที่ใช้คำนวณ: {currentAssumedReturnRatePercent}%</p>
            </div>

            {/* On-page graph display */}
            <div className="flex flex-col md:flex-row w-full h-[calc(100vh-180px)] gap-1"> {/* Adjusted height slightly */}
                <div className="flex-grow md:w-3/4 border border-gray-300 rounded-md shadow-md p-1 overflow-hidden relative">
                    <div className="relative" 
                        style={{
                            flexGrow: 1, // ⭐ กำหนดความสูงที่ต้องการให้เป็น viewport ของกราฟ
                            overflowY: 'auto', // ⭐ ทำให้ scroll ได้เมื่อเนื้อหาเกิน
                            minHeight: 0,
                            // width: '100%', // อาจจะกำหนดความกว้างด้วยถ้าจำเป็น
                            // border: '1px solid red' // ใส่ border เพื่อดูขอบเขต (สำหรับ debug)
                        }}
                        >
                        <Graph
                            data={chartDataForGraph}
                            setHoveredData={setHoveredGraphData}
                            showDeathBenefit={showDeathBenefit}
                            showAccountValue={showAccountValue}
                            showPremiumAnnual={showPremiumAnnual}
                            showPremiumCumulative={showPremiumCumulative}
                            onAgeChange={handleGraphAgeChangeFromComponent}
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/4">
                    <div className="rounded-md shadow-md bg-white h-full overflow-y-auto">
                        <ModalChartControls
                            hoveredData={hoveredGraphData}
                            initialData={initialDataForInfoBoxToUse}
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
                            onPercentChange={handlePercentChangeForControls} // Use the page level handler
                            assumedReturnRate={currentAssumedReturnRatePercent}
                            onReturnRateChange={handleReturnRateChangeForControls} // Use the page level handler
                            onRecalculate={handleCalculate}
                            isFullScreenView={false} // For on-page controls
                        />
                    </div>
                </div>
            </div>

            {isFullScreenModalOpen && illustrationData && (
                <FullScreenDisplayModal
                    isOpen={isFullScreenModalOpen}
                    onClose={closeFullScreenModal}
                    defaultActiveTab="graph" // Default to graph tab when opened from chart page
                    
                    
                    //modalTitle="รายละเอียดผลประโยชน์ (Fullscreen)"
                    
                    //headerInfo={
                    //     (typeof age === 'number' && typeof gender === 'string' && typeof sumInsured === 'number') ? (
                    //        <div className="text-xs">
                    //            <p>ผู้เอาประกัน: (ตัวอย่าง)</p>
                    //            <p>อายุ: {age} | เพศ: {gender === 'male' ? 'ชาย' : 'หญิง'}</p>
                    //            <p>ทุนประกันภัยหลัก: {formatNumber(sumInsured)} บาท</p>
                    //        </div>
                    //    ) : (<div className="text-xs"><p>(โหลดข้อมูลสรุป...)</p></div>)
                    //}
                    
                    headerInfo = {null}
                    tableTabContent={tableTabContentNode}
                    graphTabContent={graphTabContentNode}
                />
            )}
        </div>
    );
};

export default IWealthyChartPage;