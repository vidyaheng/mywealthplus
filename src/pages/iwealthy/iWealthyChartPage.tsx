// src/pages/iwealthy/IWealthyChartPage.tsx

import React, { useMemo, useState, useCallback } from 'react'; // ลบ useRef ถ้าไม่ได้ใช้
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';

// --- Type and Component Imports ---
import Graph, { ChartData } from '../../components/GraphComponent';
import ModalChartControls from '../../components/custom/ModalChartControls';
import { Button } from "@/components/ui/button";
import { ZoomIn } from 'lucide-react';
import FullScreenDisplayModal from '@/components/custom/FullScreenDisplayModal';
import ModalTableView from '@/components/custom/ModalTableView';
import ModalChartView from '../../components/custom/ModalChartView';
import { AnnualTableView } from '@/components/DisplayTable';

interface IWealthyChartPageProps {
  chartRefForCapture?: React.Ref<HTMLDivElement>;
  isCaptureMode?: boolean;
  captureHeight?: string | number; // <--- มีอยู่แล้ว ถูกต้อง
}

export default function IWealthyChartPage({ chartRefForCapture, isCaptureMode = false, captureHeight }: IWealthyChartPageProps) {
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

    const formatNumber = useCallback((num: number | undefined | null): string => {
        if (num == null) return '0';
        return Math.round(num).toLocaleString('en-US');
    }, []);

    const chartDataForGraph = useMemo((): ChartData[] => {
        if (!iWealthyResult?.annual || iWealthyResult.annual.length === 0) return [];
        const originalData = iWealthyResult.annual;
        const firstZeroIndex = originalData.findIndex(row => (row.eoyAccountValue ?? 0) <= 0.005);
        const dataToProcess = firstZeroIndex === -1 ? originalData : originalData.slice(0, firstZeroIndex + 1);

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

    const handleGraphAgeChange = useCallback((ageFromGraph: number | undefined) => {
        if (ageFromGraph !== undefined && !isNaN(ageFromGraph)) {
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
        } else {
            setCurrentAgeForInfoBox(iWealthyAge);
            setHoveredGraphData(null);
            setHoveredMirrValue(undefined);
        }
    }, [chartDataForGraph, annualMIRRData, setHoveredGraphData, setCurrentAgeForInfoBox, setHoveredMirrValue, iWealthyAge]);

    if (iWealthyIsLoading) return <div className="p-4 text-center">กำลังคำนวณ...</div>;
    if (!iWealthyResult || chartDataForGraph.length === 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณาใส่ข้อมูลที่หน้ากรอกข้อมูลและกด "คำนวณ"...
                <Button onClick={() => navigate('/iwealthy/form')} className="ml-2 mt-2">
                    ไปหน้ากรอกข้อมูล
                </Button>
            </div>
        );
    }

    const tableTabContentNode = <ModalTableView data={iWealthyResult.annual} onRecalculate={runIWealthyCalculation} viewMode={modalTableViewMode} onViewModeChange={setModalTableViewMode} showCsv={modalTableShowCsv} onShowCsvToggle={() => setModalTableShowCsv(p => !p)} formatNumber={formatNumber} />;

    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* **แก้ไข:** เพิ่มเงื่อนไขการ Render UI ตาม isCaptureMode */}
            {!isCaptureMode && ( // ส่วนนี้จะแสดงเฉพาะเมื่อไม่ได้อยู่ในโหมด capture
                <>
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
                </>
            )}

            {/* **แก้ไข:** ใช้เงื่อนไข isCaptureMode เพื่อเลือก Render Layout */}
            {isCaptureMode ? (
                // **ส่วนนี้สำหรับโหมด capture เท่านั้น**
                // กำหนดความสูงของ div ที่ครอบ Graph ตาม captureHeight
                <div style={{ width: '100%', height: captureHeight || '100%' }}> {/* <--- ตรงนี้ใช้ captureHeight */}
                    <Graph
                        ref={chartRefForCapture} // Ref สำหรับ capture
                        data={chartDataForGraph}
                        setHoveredData={setHoveredGraphData}
                        showDeathBenefit={showDeathBenefit}
                        showAccountValue={showAccountValue}
                        showPremiumAnnual={showPremiumAnnual}
                        showPremiumCumulative={showPremiumCumulative}
                        onAgeChange={handleGraphAgeChange}
                        hoveredAge={currentAgeForInfoBox}
                        hoveredMirr={hoveredMirrValue}
                        mirrData={annualMIRRData}
                    />
                </div>
            ) : (
                // **ส่วนนี้สำหรับแสดงผลบนหน้าเว็บปกติ**
                <div className="flex flex-col md:flex-row w-full h-[calc(100vh-220px)] gap-4">
                    {/* ส่วนของกราฟ (ซ้าย) */}
                    <div className="flex-grow md:w-3/4 border border-gray-200 rounded-lg shadow-sm p-2 bg-white">
                        <Graph
                            // **สำคัญ:** ตรงนี้ไม่ต้องส่ง chartRefForCapture เพราะไม่ใช่โหมด capture
                            data={chartDataForGraph}
                            setHoveredData={setHoveredGraphData}
                            showDeathBenefit={showDeathBenefit}
                            showAccountValue={showAccountValue}
                            showPremiumAnnual={showPremiumAnnual}
                            showPremiumCumulative={showPremiumCumulative}
                            onAgeChange={handleGraphAgeChange}
                            hoveredAge={currentAgeForInfoBox}
                            hoveredMirr={hoveredMirrValue}
                            mirrData={annualMIRRData}
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
                                isFullScreenView={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* FullScreenModal จะใช้ Logic เดิม (ไม่มีการเปลี่ยนแปลง) */}
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
                            mirrData={annualMIRRData}
                        />
                    }
                />
            )}
        </div>
    );
}