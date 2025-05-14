// src/pages/iwealthy/IWealthyChartPage.tsx

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useAppOutletContext } from '../../App'; // ตรวจสอบ path
import Graph, { ChartData } from '../../components/GraphComponent'; // ตรวจสอบ path
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AnnualCalculationOutputRow } from '../../lib/calculations'; // ตรวจสอบ path
import GraphInfoBox from '../../components/GraphInfoBox'; // ตรวจสอบ path
import { ZoomIn, Plus, Minus } from 'lucide-react';
import FullScreenDisplayModal from '@/components/custom/FullScreenDisplayModal';
import DisplayTable, { AnnualTableView } from '@/components/DisplayTable';
import ModalChartControls from '@/components/custom/ModalChartControls';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const IWealthyChartPage = () => {
    const {
        illustrationData,
        rpp,
        rtu,
        handlePercentChange,
        age,
        investmentReturn,
        setInvestmentReturn,
        handleCalculate,
    } = useAppOutletContext();

    const navigate = useNavigate();
    const location = useLocation();
    const [hoveredGraphData, setHoveredGraphData] = useState<ChartData | null>(null);
    const [showDeathBenefit, setShowDeathBenefit] = useState(true);
    const [showAccountValue, setShowAccountValue] = useState(true);
    const [showPremiumAnnual, setShowPremiumAnnual] = useState(true);
    const [showPremiumCumulative, setShowPremiumCumulative] = useState(true);
    const [currentAgeForInfoBox, setCurrentAgeInfoBox] = useState<number | undefined>();

    const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
    const [modalTableViewMode, setModalTableViewMode] = useState<AnnualTableView>('compact');
    const [modalTableShowCsv, setModalTableShowCsv] = useState(false);

    const openFullScreenModal = () => setIsFullScreenModalOpen(true);
    const closeFullScreenModal = () => setIsFullScreenModalOpen(false);

    const handleModalTableViewModeChange = (value: AnnualTableView) => {
        if (value) setModalTableViewMode(value);
    };
    const toggleModalTableShowCsv = () => setModalTableShowCsv(prev => !prev);

    const currentAssumedReturnRatePercent = useMemo(() => {
        return investmentReturn;
    }, [investmentReturn]);

    const handleModalReturnRateChange = useCallback((newRatePercentage: number) => {
        if (investmentReturn !== newRatePercentage) {
            setInvestmentReturn(newRatePercentage);
            // การคำนวณใหม่จะถูกเรียกจากปุ่มใน ModalChartControls ผ่าน prop onRecalculate
        }
    }, [investmentReturn, setInvestmentReturn]);

    const handleSliderPercentChange = useCallback((newRppPercent: number) => {
        handlePercentChange(newRppPercent);
        // การคำนวณใหม่จะถูกเรียกจากปุ่มใน ModalChartControls หรือ GraphInfoBox
    }, [handlePercentChange]);


    const initialDataForInfoBox = useMemo(() => (illustrationData?.annual?.[0] ? {
        age: illustrationData.annual[0].age,
        deathBenefit: illustrationData.annual[0].eoyDeathBenefit,
        accountValue: illustrationData.annual[0].eoyAccountValue,
        premiumCumulative: illustrationData.annual[0].totalPremiumYear,
        premiumAnnual: illustrationData.annual[0].totalPremiumYear,
    } : null), [illustrationData]);

    const chartData: ChartData[] = useMemo(() => {
        if (!illustrationData?.annual) return [];
        let cumulativePremium = 0;
        return illustrationData.annual.map((row: AnnualCalculationOutputRow) => {
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

    const handleGraphAgeChange = (ageFromGraph: number) => {
        setCurrentAgeInfoBox(ageFromGraph);
    };

    useEffect(() => {
        if (!illustrationData && location.pathname.includes('/iwealthy/chart')) {
            console.log("[ChartPage] No illustration data on chart page.");
        }
    }, [illustrationData, location.pathname]);


    const totalPremiumForSlider = useMemo(() => (rpp || 0) + (rtu || 0), [rpp, rtu]);
    const rppPercentForSlider = useMemo(() => (totalPremiumForSlider > 0 ? Math.round(((rpp || 0) / totalPremiumForSlider) * 100) : 100), [rpp, totalPremiumForSlider]);

    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return '0';
        return Math.round(num).toLocaleString('en-US');
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

    if (!illustrationData?.annual || chartData.length === 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณากลับไปหน้ากรอกข้อมูลและกด "คำนวณ" เพื่อดูผลประโยชน์
                <Button onClick={() => navigate('/iwealthy/form')} className="ml-2">ไปหน้ากรอกข้อมูล</Button>
            </div>
        );
    }

    // --- Content for Chart Tab in Modal ---
    const chartContentForModal = (
        // ลบ h-full และ overflow-y-auto ออกจาก div นี้
        // ให้ TabsContent ใน FullScreenDisplayModal เป็นตัวจัดการ scroll
        <div className="flex flex-col h-full w-full bg-slate-50">
            <div className="flex-shrink-0 p-2 md:p-3 border-b border-slate-300 bg-white shadow-sm">
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
                    onPercentChange={handleSliderPercentChange}
                    assumedReturnRate={currentAssumedReturnRatePercent}
                    onReturnRateChange={handleModalReturnRateChange}
                    onRecalculate={handleCalculate}
                />
            </div>
            {/* Graph container: กำหนดความสูงตายตัว (หรือจะใช้ flex-grow ถ้าระบบ Layout ของ Modal แม่นยำ) */}
            <div className="flex-grow min-h-0 p-1"> {/* หรือความสูงอื่นๆ ที่ต้องการ */}
                <Graph
                    data={chartData}
                    setHoveredData={setHoveredGraphData}
                    showDeathBenefit={showDeathBenefit}
                    showAccountValue={showAccountValue}
                    showPremiumAnnual={showPremiumAnnual}
                    showPremiumCumulative={showPremiumCumulative}
                    onAgeChange={handleGraphAgeChange}
                />
            </div>
        </div>
    );

    const tableContentForModal = (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-2 flex-wrap justify-start items-center gap-2 mb-2">
                <ToggleGroup
                    type="single"
                    size="sm"
                    value={modalTableViewMode}
                    onValueChange={handleModalTableViewModeChange}
                    className="border border-gray-300 rounded w-fit h-8 bg-white" //overflow-hidden
                >
                    <ToggleGroupItem value="compact" aria-label="Compact View (Modal)" className={`px-3 py-1 text-xs data-[state=on]:bg-blue-600 data-[state=on]:text-white focus:z-10 focus:outline-none ${modalTableViewMode === 'compact' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        มุมมองย่อ
                    </ToggleGroupItem>
                    <ToggleGroupItem value="full" aria-label="Full View (Modal)" className={`px-3 py-1 text-xs data-[state=on]:bg-blue-600 data-[state=on]:text-white border-l border-gray-300 focus:z-10 focus:outline-none ${modalTableViewMode === 'full' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        มุมมองเต็ม
                    </ToggleGroupItem>
                </ToggleGroup>
                <Button variant="outline" size="sm" onClick={toggleModalTableShowCsv} className="h-8 px-2" title={modalTableShowCsv ? "ซ่อนมูลค่าเวนคืน" : "แสดงมูลค่าเวนคืน"}>
                    {modalTableShowCsv ? <Minus size={16} /> : <Plus size={16} />}
                    <span className="ml-1 text-xs hidden sm:inline">เวนคืน</span>
                </Button>
            </div>
            <div className="flex-grow min-h-0 overflow-hidden">
                <div className="h-full overflow-auto p-2">
                <DisplayTable
                    data={filteredAnnualDataForModalTable}
                    viewMode={modalTableViewMode}
                    showCsv={modalTableShowCsv}
                    formatNumber={formatNumber}
                    caption="ข้อมูลผลประโยชน์รายปี (Modal)"
                />
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6 space-y-4 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-800">
                    กราฟแสดงผลประโยชน์
                </h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/iwealthy/table')}>
                        กลับไปที่ตาราง
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" title="แสดงผลเต็มหน้าจอ" onClick={openFullScreenModal}>
                        <ZoomIn size={16} />
                    </Button>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-700">
                    อายุผู้เอาประกัน: {age} ปี | ช่วงอายุในกราฟ: {chartData[0]?.age} - {chartData[chartData.length - 1]?.age} ปี
                </p>
                <p className="text-xs text-gray-500">ผลตอบแทนที่ใช้คำนวณ: {currentAssumedReturnRatePercent}%</p>
            </div>

            <div className="flex flex-col md:flex-row w-full h-[calc(100vh-250px)] gap-4">
                <div className="flex-grow md:w-3/4 border border-gray-300 rounded-md shadow-md p-1 overflow-y-auto relative"> {/*overflow-hidden*/}
                     <div className="absolute inset-0">
                        <Graph
                            data={chartData}
                            setHoveredData={setHoveredGraphData}
                            showDeathBenefit={showDeathBenefit}
                            showAccountValue={showAccountValue}
                            showPremiumAnnual={showPremiumAnnual}
                            showPremiumCumulative={showPremiumCumulative}
                            onAgeChange={handleGraphAgeChange}
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/4">
                    <GraphInfoBox
                        data={hoveredGraphData}
                        initialData={initialDataForInfoBox}
                        currentAge={currentAgeForInfoBox}
                        setShowDeathBenefit={setShowDeathBenefit}
                        setShowAccountValue={setShowAccountValue}
                        setShowPremiumAnnual={setShowPremiumAnnual}
                        setShowPremiumCumulative={setShowPremiumCumulative}
                        showDeathBenefit={showDeathBenefit}
                        showAccountValue={showAccountValue}
                        showPremiumCumulative={showPremiumCumulative}
                        showPremiumAnnual={showPremiumAnnual}
                        rppPercent={rppPercentForSlider}
                        totalPremium={totalPremiumForSlider}
                        onPercentChange={handleSliderPercentChange}
                    />
                </div>
            </div>

            {(illustrationData && chartData.length > 0) && (
                <FullScreenDisplayModal
                    isOpen={isFullScreenModalOpen}
                    onClose={closeFullScreenModal}
                    defaultActiveTab="graph"
                    modalTitle="รายละเอียดผลประโยชน์"
                    headerInfo={null}
                    showDefaultHeaderAndControls={false}
                    chartContent={chartContentForModal}
                    tableContent={tableContentForModal}
                    viewMode={modalTableViewMode}
                    onViewModeChange={handleModalTableViewModeChange}
                    showCsv={modalTableShowCsv}
                    onShowCsvToggle={toggleModalTableShowCsv}
                />
            )}
        </div>
    );
};

export default IWealthyChartPage;
