// src/pages/iwealthy/IWealthyTablePage.tsx

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// +++ STEP 1: เปลี่ยนมา Import Store แทนการรับ Context +++
import { useAppStore } from '../../stores/appStore';

// --- Type and Component Imports (เหมือนเดิม) ---
//import { AnnualCalculationOutputRow } from '../../lib/calculations';
import { ChartData } from '../../components/GraphComponent';
import { Button } from "@/components/ui/button";
//import { Input } from "@/components/ui/input";
//import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ZoomIn, Plus, Minus, Receipt, XCircle } from 'lucide-react';
import DisplayTable, { AnnualTableView, AnnualDataRowWithTax } from '@/components/DisplayTable'; 
import FullScreenDisplayModal from '@/components/custom/FullScreenDisplayModal'; 
import ModalTableView from '@/components/custom/ModalTableView';
import ModalChartView from '@/components/custom/ModalChartView';
import TaxModal from '@/components/custom/TaxModal';

export default function IWealthyTablePage() {
    // +++ ดึง State และ Actions ทั้งหมดมาจาก useAppStore +++
    const {
        iWealthyResult,
        iWealthyIsLoading,
        iWealthyAge,
        iWealthyGender,
        iWealthySumInsured,
        iWealthyRpp,
        iWealthyRtu,
        iWealthyInvestmentReturn,
        handleSliderChange,
        runIWealthyCalculation,
        //handleIWealthyRppRtuSlider,
        //setIWealthyRpp,
        setIWealthyInvestmentReturn,
    } = useAppStore();

    const navigate = useNavigate();

    // --- Local State สำหรับ UI Controls ---
    const [pageViewMode, setPageViewMode] = useState<AnnualTableView>('compact');
    const [pageShowCsv, setPageShowCsv] = useState(false);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [taxInfo, setTaxInfo] = useState<{ taxRate: number; usedFirst100k: number; endAge: number; } | null>(null);
    const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
    
    // Local states สำหรับ Controls ภายใน Fullscreen Modal
    const [modalTableViewMode, setModalTableViewMode] = useState<AnnualTableView>('compact');
    const [modalTableShowCsv, setModalTableShowCsv] = useState(false);
    const [hoveredGraphDataModal, setHoveredGraphDataModal] = useState<ChartData | null>(null);
    const [showDeathBenefitModal, setShowDeathBenefitModal] = useState(true);
    const [showAccountValueModal, setShowAccountValueModal] = useState(true);
    const [showPremiumAnnualModal, setShowPremiumAnnualModal] = useState(false);
    const [showPremiumCumulativeModal, setShowPremiumCumulativeModal] = useState(true);
    const [currentAgeForInfoBoxModal, setCurrentAgeForInfoBoxModal] = useState<number | undefined>(iWealthyAge);

    // --- useMemo และ Logic ต่างๆ (อ้างอิงจาก Store State) ---
    const filteredAnnualData = useMemo((): AnnualDataRowWithTax[] => {
        // ถ้าไม่มีข้อมูลผลลัพธ์ ให้ return array ว่าง
        if (!iWealthyResult?.annual || iWealthyResult.annual.length === 0) return [];
        
        const originalData = iWealthyResult.annual;

        // 1. หา index ของแถว "แรก" ที่มูลค่ากรมธรรม์ (eoyAccountValue) เป็น 0 หรือน้อยกว่า
        const firstZeroIndex = originalData.findIndex(row => (row.eoyAccountValue ?? 0) <= 0.005);

        // 2. ถ้าไม่เจอแถวที่เป็น 0 เลย (firstZeroIndex === -1) แปลว่ากรมธรรม์อยู่จนครบสัญญา
        //    ในกรณีนี้ ให้แสดงข้อมูลทั้งหมด
        if (firstZeroIndex === -1) {
            return originalData;
        }

        // 3. ถ้าเจอแถวที่เป็น 0 ให้ตัด array เพื่อแสดงผลถึงแถวนั้น (รวมแถวที่เป็น 0 ด้วย)
        //    เราต้อง +1 เพราะ slice() จะตัด "ก่อน" index ที่ระบุ
        return originalData.slice(0, firstZeroIndex + 1);

    }, [iWealthyResult]);

    // 1. กรองข้อมูลตาม "อายุ" ที่ระบุใน Modal ก่อน
const dataWithTaxBenefit = useMemo((): AnnualDataRowWithTax[] => {
    // ถ้าไม่มีข้อมูลภาษี ก็แสดงข้อมูลทั้งหมดตามปกติ
    if (!taxInfo) {
        return filteredAnnualData;
    }

    // ถ้ามีข้อมูลภาษี ให้ map ข้อมูลทั้งหมดโดยเพิ่มเงื่อนไข
    return filteredAnnualData.map(row => {
        // ตรวจสอบอายุในแต่ละแถว
        const shouldCalculateTax = row.age <= taxInfo.endAge;

        return {
            ...row,
            // ถ้าเงื่อนไขเป็นจริง ให้คำนวณภาษี, ถ้าไม่ ให้เป็น 0
            taxBenefit: shouldCalculateTax 
                ? row.totalFeesYear * (taxInfo.taxRate / 100) 
                : 0
        };
    });
}, [filteredAnnualData, taxInfo]);

    const chartDataForModal = useMemo((): ChartData[] => {
        if (!iWealthyResult?.annual) return [];
        let cumulativePremium = 0;
        return iWealthyResult.annual.map(row => {
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

    // --- Handlers ---
    const handleOpenFullScreenModal = () => setIsFullScreenModalOpen(true);
    const handleCloseFullScreenModal = () => setIsFullScreenModalOpen(false);
    const handleOpenTaxModal = () => setIsTaxModalOpen(true);
    const handleCloseTaxModal = () => setIsTaxModalOpen(false);
    const handleConfirmTax = (inputs: { taxRate: number; usedFirst100k: number; endAge: number; }) => {
    setTaxInfo(inputs);
    };
    const handleResetTaxBenefit = () => setTaxInfo(null);
    const formatNumber = (num: number | undefined | null): string => {
        if (num == null) return '0'; // ตรวจสอบทั้ง undefined และ null
        return Math.round(num).toLocaleString('en-US'); 
    };

    // --- Handlers สำหรับส่งให้ Fullscreen Modal ---
    const totalPremiumForSliderModal = useMemo(() => iWealthyRpp + iWealthyRtu, [iWealthyRpp, iWealthyRtu]);
    //const rppPercentForSliderModal = useMemo(() => (totalPremiumForSliderModal > 0 ? Math.round((iWealthyRpp / totalPremiumForSliderModal) * 100) : 100), [iWealthyRpp, totalPremiumForSliderModal]);
    const handleGraphAgeChangeInModal = useCallback((ageFromGraph: number | undefined) => {
        setCurrentAgeForInfoBoxModal(ageFromGraph);
        
        if (typeof ageFromGraph === 'number') {
            const dataPoint = chartDataForModal.find(d => d.age === ageFromGraph);
            if (dataPoint) {
                setHoveredGraphDataModal(dataPoint);
            }
        } else {
            setHoveredGraphDataModal(null); // Clear hovered data if age is undefined
        }
    }, [chartDataForModal]);
    const initialDataForInfoBoxModal = useMemo(() => {
        return chartDataForModal.length > 0 ? chartDataForModal[0] : null;
    }, [chartDataForModal]);

    // --- ตรวจสอบ Loading และ Data จาก Store ---
    //useEffect(() => {
    //    if (!iWealthyIsLoading && !iWealthyResult) {
    //        navigate('/iwealthy/form', { replace: true });
    //    }
    //}, [iWealthyIsLoading, iWealthyResult, navigate]);

    if (iWealthyIsLoading) {
        return <div className="p-4 text-center">กำลังคำนวณผลประโยชน์...</div>;
    }
    
    if (filteredAnnualData.length === 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                <p>ไม่มีข้อมูลสำหรับแสดงผล กรุณากด "คำนวณ" ที่หน้ากรอกข้อมูล</p>
                <Button onClick={() => navigate('/iwealthy/form')} className="ml-2 mt-2">
                    ไปหน้ากรอกข้อมูล
                </Button>
            </div>
        );
    }
    
    // --- JSX Rendering (กรอก props ที่หายไป) ---
    const tableTabContentNode = (
        <ModalTableView
            data={dataWithTaxBenefit}
            formatNumber={formatNumber}
            viewMode={modalTableViewMode}
            onViewModeChange={setModalTableViewMode}
            showCsv={modalTableShowCsv}
            onShowCsvToggle={() => setModalTableShowCsv(prev => !prev)}
            onRecalculate={runIWealthyCalculation}
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
            rppPremium={iWealthyRpp}
            totalPremium={totalPremiumForSliderModal}
            onRppPremiumChange={handleSliderChange}
            assumedReturnRate={iWealthyInvestmentReturn}
            onReturnRateChange={setIWealthyInvestmentReturn}
            onRecalculate={runIWealthyCalculation}
            onAgeChange={handleGraphAgeChangeInModal}
            isFullScreenView={true}
        />
    );

    return (
        <div className="p-4 md:p-6 space-y-4">
            <h2 className="text-xl font-semibold text-center text-blue-800 mb-4">ตารางสรุปผลประโยชน์</h2>
            
            {/* Control Buttons (ฉบับเต็ม) */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex flex-row w-fit border border-gray-300 rounded-md overflow-hidden bg-white">
                    <button onClick={() => setPageViewMode('compact')} className={`px-3 py-1 text-xs font-medium transition-colors border-r border-gray-300 ${pageViewMode === 'compact' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-blue-100'}`}>มุมมองแบบย่อ</button>
                    <button onClick={() => setPageViewMode('full')} className={`px-3 py-1 text-xs font-medium transition-colors ${pageViewMode === 'full' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-orange-100'}`}>มุมมองแบบเต็ม</button>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPageShowCsv(prev => !prev)} className="h-8 px-2" title={pageShowCsv ? "ซ่อนมูลค่าเวนคืน" : "แสดงมูลค่าเวนคืน"}>
                        {pageShowCsv ? <Minus size={16} /> : <Plus size={16} />}<span className="ml-1 text-xs hidden sm:inline">เวนคืน</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={taxInfo === null ? handleOpenTaxModal : handleResetTaxBenefit} className="h-8 px-2" title={taxInfo === null ? "คำนวณผลประโยชน์ทางภาษี" : "ยกเลิกการแสดงผลประโยชน์ทางภาษี"}>
                        {taxInfo === null ? <Receipt size={16} className="text-teal-700" /> : <XCircle size={16} className="text-red-600" />}<span className="ml-1 text-xs hidden sm:inline">คืนภาษี</span>{taxInfo !== null && <span className="ml-1.5 text-xs font-bold">({taxInfo.taxRate}%)</span>}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleOpenFullScreenModal} className="h-8 w-8" title="แสดงแบบเต็มหน้าจอ">
                        <ZoomIn size={16} />
                    </Button>
                </div>
            </div>

            <DisplayTable
                data={dataWithTaxBenefit}
                viewMode={pageViewMode}
                showCsv={pageShowCsv}
                showTaxBenefitColumn={taxInfo !== null}
                formatNumber={formatNumber}
            />
            
            <TaxModal 
                isOpen={isTaxModalOpen}
                onClose={handleCloseTaxModal}
                onConfirm={handleConfirmTax}
                //currentPercent={taxInfo}
            />

            {isFullScreenModalOpen && (
                <FullScreenDisplayModal
                    isOpen={isFullScreenModalOpen}
                    onClose={handleCloseFullScreenModal} 
                    defaultActiveTab="table"
                    modalTitle="ภาพรวมผลประโยชน์ (iWealthy)"
                    headerInfo={
                        <div className="text-xs">
                            <p>ผู้เอาประกัน: (iWealthy)</p>
                            <p>อายุ: {iWealthyAge} | เพศ: {iWealthyGender === 'male' ? 'ชาย' : 'หญิง'}</p>
                            <p>ทุนประกันภัยหลัก: {formatNumber(iWealthySumInsured)} บาท</p>
                        </div>
                    }
                    tableTabContent={tableTabContentNode}
                    graphTabContent={graphTabContentNode}
                />
            )}
        </div>
    );
}