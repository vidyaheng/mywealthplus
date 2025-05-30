// src/pages/iwealthy/IWealthyTablePage.tsx

import { useEffect, useState, useMemo, useCallback } from 'react'; // เพิ่ม React และ useCallback
import { useNavigate } from 'react-router-dom';
import { useAppOutletContext } from '../../App';
import { AnnualCalculationOutputRow } from '../../lib/calculations'; // ใช้สำหรับ type checking
import { ChartData } from '../../components/GraphComponent'; // Import ChartData (ปรับ path ให้ถูกต้อง)

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ZoomIn, Plus, Minus } from 'lucide-react';

import DisplayTable, { AnnualTableView } from '@/components/DisplayTable'; 
import FullScreenDisplayModal from '@/components/custom/FullScreenDisplayModal'; 
import ModalTableView from '@/components/custom/ModalTableView'; // << IMPORT
import ModalChartView from '@/components/custom/ModalChartView'; // << IMPORT

export default function IWealthyTablePage() {
    const {
        illustrationData,
        age, 
        gender, 
        sumInsured,
        rpp, 
        rtu,
        handlePercentChange, 
        investmentReturn, 
        setInvestmentReturn,
        handleCalculate, // onRecalculate สำหรับทั้ง ModalTableView และ ModalChartView
        // rppPercent, // จะถูกคำนวณเป็น rppPercentForSliderModal
    } = useAppOutletContext();

    const navigate = useNavigate();

    // States สำหรับ Table View บน Page นี้ (ส่วนที่แสดงผลนอก Modal)
    const [pageViewMode, setPageViewMode] = useState<AnnualTableView>('compact');
    const [pageShowCsv, setPageShowCsv] = useState(false);

    // State สำหรับควบคุมการเปิด/ปิด Fullscreen Modal
    const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
    
    // States สำหรับ Table Controls ที่จะใช้ภายใน ModalTableView (เพื่อให้เป็นอิสระจาก Page)
    const [modalTableViewMode, setModalTableViewMode] = useState<AnnualTableView>('compact');
    const [modalTableShowCsv, setModalTableShowCsv] = useState(false);

    // States สำหรับ Graph Controls และ Graph Display ที่จะใช้ภายใน ModalChartView
    const [hoveredGraphDataModal, setHoveredGraphDataModal] = useState<ChartData | null>(null);
    const [showDeathBenefitModal, setShowDeathBenefitModal] = useState(true);
    const [showAccountValueModal, setShowAccountValueModal] = useState(true);
    const [showPremiumAnnualModal, setShowPremiumAnnualModal] = useState(false); // ตั้งค่าเริ่มต้นตามที่คุณใช้ใน ModalChartControls
    const [showPremiumCumulativeModal, setShowPremiumCumulativeModal] = useState(true);
    const [currentAgeForInfoBoxModal, setCurrentAgeInfoBoxModal] = useState<number | undefined>(age);

    const handleOpenFullScreenModal = () => setIsFullScreenModalOpen(true);
    const handleCloseFullScreenModal = () => {
        setIsFullScreenModalOpen(false);
        // Reset state ที่เกี่ยวข้องกับ modal เมื่อปิด (ถ้าต้องการ)
        setHoveredGraphDataModal(null);
        setCurrentAgeInfoBoxModal(age); // Reset เป็นอายุเริ่มต้น
    };

    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return '0';
        return Math.round(num).toLocaleString('en-US');
    };

    const filteredAnnualData: AnnualCalculationOutputRow[] = useMemo(() => {
        if (!illustrationData?.annual || illustrationData.annual.length === 0) return [];
        const originalAnnualData = illustrationData.annual;
        let lastPositiveIndex = -1;
        for (let i = originalAnnualData.length - 1; i >= 0; i--) {
            if (originalAnnualData[i].eoyAccountValue > 0.005) {
                lastPositiveIndex = i;
                break;
            }
        }
        if (lastPositiveIndex === -1) return [];
        return originalAnnualData.slice(0, lastPositiveIndex + 1);
    }, [illustrationData]);

    // --- Data and Handlers for ModalChartView ---
    const chartDataForModal: ChartData[] = useMemo(() => {
        if (!illustrationData?.annual) return [];
        let cumulativePremium = 0;
        return illustrationData.annual.map(row => {
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

    const initialDataForInfoBoxModal = useMemo(() => {
        if (chartDataForModal.length > 0) return chartDataForModal[0];
        return null;
    }, [chartDataForModal]);
    
    const totalPremiumForSliderModal = useMemo(() => (rpp || 0) + (rtu || 0), [rpp, rtu]);
    const rppPercentForSliderModal = useMemo(() => (totalPremiumForSliderModal > 0 ? Math.round(((rpp || 0) / totalPremiumForSliderModal) * 100) : 100), [rpp, totalPremiumForSliderModal]);
    const currentAssumedReturnRatePercentModal = useMemo(() => investmentReturn, [investmentReturn]);

    const handleSliderPercentChangeInModal = useCallback((newPercent: number) => {
        handlePercentChange(newPercent);
        // ถ้าต้องการให้คำนวณใหม่ทันทีหลังจากเปลี่ยน Slider ให้เรียก handleCalculate()
        // หรือจะให้ผู้ใช้กดยืนยันจากปุ่ม "Update" ใน ModalChartControls
    }, [handlePercentChange]);

    const handleModalReturnRateChangeInModal = useCallback((newRate: number) => {
        setInvestmentReturn(newRate);
        // ถ้าต้องการให้คำนวณใหม่ทันทีหลังจากเปลี่ยน Slider ให้เรียก handleCalculate()
        // หรือจะให้ผู้ใช้กดยืนยันจากปุ่ม "Update" ใน ModalChartControls
    }, [setInvestmentReturn]);
    
    const handleGraphAgeChangeInModal = (ageFromGraph: number) => {
        setCurrentAgeInfoBoxModal(ageFromGraph); // แก้ไขการเรียกใช้ setter
        const dataPoint = chartDataForModal.find(d => d.age === ageFromGraph);
        if (dataPoint) {
            setHoveredGraphDataModal(dataPoint);
        }
    };

    useEffect(() => {
        if (!illustrationData) {
            console.log("[IWealthyTablePage] No illustration data found.");
            // navigate('/iwealthy/form', { replace: true }); // พิจารณาการ redirect
        }
    }, [illustrationData, navigate]);

    if (!illustrationData) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณากลับไปหน้ากรอกข้อมูลและกด "คำนวณ" เพื่อดูผลประโยชน์
                <Button onClick={() => navigate('/iwealthy/form')} className="ml-2">ไปหน้ากรอกข้อมูล</Button>
            </div>
        );
    }
    if (filteredAnnualData.length === 0 && illustrationData.annual && illustrationData.annual.length > 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                ไม่มีข้อมูลผลประโยชน์ที่มูลค่ากรมธรรม์มากกว่า 0 ให้แสดง
            </div>
        );
    }

    // --- JSX for Tab Contents in Modal ---
    const tableTabContentNode = (
        <ModalTableView
            data={filteredAnnualData} // หรือจะใช้ filter logic แยกสำหรับ modal table ก็ได้
            formatNumber={formatNumber}
            viewMode={modalTableViewMode} // << ใช้ state สำหรับ modal
            onViewModeChange={setModalTableViewMode} // << handler สำหรับ modal
            showCsv={modalTableShowCsv} // << ใช้ state สำหรับ modal
            onShowCsvToggle={() => setModalTableShowCsv(prev => !prev)} // << handler สำหรับ modal
            onRecalculate={handleCalculate} // ปุ่ม Update ใน ModalTableView
        />
    );

    const graphTabContentNode = (
        <ModalChartView
            chartData={chartDataForModal}
            hoveredData={hoveredGraphDataModal}
            setHoveredData={setHoveredGraphDataModal}
            initialData={initialDataForInfoBoxModal}
            currentAge={currentAgeForInfoBoxModal}
            formatNumber={formatNumber}
            showDeathBenefit={showDeathBenefitModal}
            setShowDeathBenefit={setShowDeathBenefitModal}
            showAccountValue={showAccountValueModal}
            setShowAccountValue={setShowAccountValueModal}
            showPremiumAnnual={showPremiumAnnualModal}
            setShowPremiumAnnual={setShowPremiumAnnualModal}
            showPremiumCumulative={showPremiumCumulativeModal}
            setShowPremiumCumulative={setShowPremiumCumulativeModal}
            rppPercent={rppPercentForSliderModal}
            totalPremium={totalPremiumForSliderModal}
            onPercentChange={handleSliderPercentChangeInModal}
            assumedReturnRate={currentAssumedReturnRatePercentModal}
            onReturnRateChange={handleModalReturnRateChangeInModal}
            onRecalculate={handleCalculate} // ปุ่ม Update ใน ModalChartControls
            onAgeChange={handleGraphAgeChangeInModal}
        />
    );
    
    const currentProductName = "iWealthy"; // หรือดึงมาจาก context/config

    return (
        <div className="p-4 md:p-6 space-y-4">
            <h2 className="text-xl font-semibold text-center text-blue-800 mb-4">
                ตารางสรุปผลประโยชน์ ({pageViewMode === 'compact' ? 'แบบย่อ' : 'แบบเต็ม'})
            </h2>

            <div className="flex justify-between items-center mb-3">
                <ToggleGroup
                    type="single"
                    size="sm"
                    value={pageViewMode} // ใช้ pageViewMode สำหรับตารางบนหน้านี้
                    onValueChange={(value) => { if (value) setPageViewMode(value as AnnualTableView); }}
                    className="border border-gray-300 rounded overflow-hidden w-fit h-8 bg-white"
                >
                    <ToggleGroupItem value="compact" aria-label="Compact View" className={`px-3 py-1 text-xs data-[state=on]:bg-blue-600 data-[state=on]:text-white focus:z-10 focus:outline-none ${pageViewMode === 'compact' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        มุมมองแบบย่อ
                    </ToggleGroupItem>
                    <ToggleGroupItem value="full" aria-label="Full View" className={`px-3 py-1 text-xs data-[state=on]:bg-blue-600 data-[state=on]:text-white border-l border-gray-300 focus:z-10 focus:outline-none ${pageViewMode === 'full' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        มุมมองแบบเต็ม
                    </ToggleGroupItem>
                </ToggleGroup>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageShowCsv(prev => !prev)} // ใช้ pageShowCsv สำหรับตารางบนหน้านี้
                        className="h-8 px-2"
                        title={pageShowCsv ? "ซ่อนมูลค่าเวนคืน" : "แสดงมูลค่าเวนคืน"}
                    >
                        {pageShowCsv ? <Minus size={16} /> : <Plus size={16} />}
                        <span className="ml-1 text-xs hidden sm:inline">เวนคืน</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        title="แสดงแบบเต็มหน้าจอ"
                        onClick={handleOpenFullScreenModal}
                    >
                        <ZoomIn size={16} />
                    </Button>
                </div>
            </div>
            
            <DisplayTable
                data={filteredAnnualData}
                viewMode={pageViewMode} // ใช้ pageViewMode
                showCsv={pageShowCsv}   // ใช้ pageShowCsv
                formatNumber={formatNumber}
                //caption="ตารางสรุปผลประโยชน์โดยประมาณ (ในหน้าหลัก)"
            />

            {isFullScreenModalOpen && illustrationData && (
                <FullScreenDisplayModal
                    isOpen={isFullScreenModalOpen}
                    onClose={handleCloseFullScreenModal}
                    defaultActiveTab="table" // เมื่อเปิดจาก TablePage ให้ default เป็น table
                    modalTitle={`ภาพรวมผลประโยชน์ (${currentProductName})`}
                    headerInfo={
                         (typeof age === 'number' && typeof gender === 'string' && typeof sumInsured === 'number') ? (
                            <div className="text-xs">
                                <p>ผู้เอาประกัน: (ตัวอย่าง)</p> {/* ควรดึงชื่อจริงมาแสดงถ้ามี */}
                                <p>อายุ: {age} | เพศ: {gender === 'male' ? 'ชาย' : 'หญิง'}</p>
                                <p>ทุนประกันภัยหลัก: {formatNumber(sumInsured)} บาท</p>
                            </div>
                        ) : (<div className="text-xs"><p>(โหลดข้อมูลสรุป...)</p></div>)
                    }
                    tableTabContent={tableTabContentNode}
                    graphTabContent={graphTabContentNode}
                />
            )}
        </div>
    );
}