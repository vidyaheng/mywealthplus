import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { Button } from "@/components/ui/button";

import RetirementGraph, { RetirementChartData } from '@/components/ret/RetirementGraph';
import RetirementChartControls from '@/components/ret/RetirementChartControls';

interface RetirementChartPageProps {
    isCaptureMode?: boolean;
    isEmbedded?: boolean;
}

const RetirementChartPage = ({ isCaptureMode = false, isEmbedded = false }: RetirementChartPageProps) => {
    // --- ✨ [อัปเดตแล้ว] ดึง State การแสดงผลมาจาก Store โดยตรง ---
    const { 
        retirementResult, retirementFundingMix, retirementIsLoading, retirementPlanningAge, retirementInvestmentReturn,
        retirementShowFundValue, setRetirementShowFundValue,
        retirementShowPayoutCumulative, setRetirementShowPayoutCumulative,
        retirementShowPremium, setRetirementShowPremium,
        retirementShowDeathBenefit, setRetirementShowDeathBenefit
    } = useAppStore();
    
    const navigate = useNavigate();
    const [hoveredData, setHoveredData] = useState<RetirementChartData | null>(null);
    const [currentAge, setCurrentAge] = useState<number | undefined>(retirementPlanningAge);
    

const chartData = useMemo(() => {
        if (!retirementResult) return [];
        
        let filteredResult = retirementResult;

        // 2. ใช้ 'retirementFundingMix' เป็นเงื่อนไขในการเช็ค
        if (retirementFundingMix === 'pensionOnly') {
            filteredResult = retirementResult.filter(row => row.age <= 88);
        }

        let cumulativePayout = 0;
        return filteredResult.map(row => {
            cumulativePayout += row.totalWithdrawal;
            return {
                age: row.age,
                fundValue: row.iWealthyFundValue + row.pensionCSV,
                payoutCumulative: cumulativePayout,
                premium: row.cumulativePremium,
                deathBenefit: row.iWealthyDeathBenefit + row.pensionDeathBenefit,
            };
        });
    // 3. เปลี่ยน Dependency ให้ถูกต้อง
}, [retirementResult, retirementFundingMix]);


    const handleAgeChange = useCallback((ageFromGraph: number | undefined) => {
        setCurrentAge(ageFromGraph);
        if (typeof ageFromGraph === 'number') {
            const dataPoint = chartData.find(d => d.age === ageFromGraph);
            setHoveredData(dataPoint || null);
        } else {
            setHoveredData(null);
        }
    }, [chartData]);
    
    const initialDataForInfoBox = useMemo(() => chartData.length > 0 ? chartData[0] : null, [chartData]);

    if (retirementIsLoading) {
        return <div className="p-4 text-center">กำลังโหลดข้อมูล...</div>;
    }
    if (!retirementResult || chartData.length === 0) {
        if (isCaptureMode || isEmbedded) return null;
        return (
            <div className="p-4 text-center text-gray-600">
                <p>ไม่มีข้อมูลสำหรับแสดงผล</p>
                <Button onClick={() => navigate('/retire/form')} className="mt-2">กลับไปหน้ากรอกข้อมูล</Button>
            </div>
        );
    }

    if (isCaptureMode) {
        return (
            <RetirementGraph 
                data={chartData}
                onAgeChange={() => {}}
                showFundValue={retirementShowFundValue}
                showPayoutCumulative={retirementShowPayoutCumulative}
                showPremium={retirementShowPremium}
                showDeathBenefit={retirementShowDeathBenefit}
                investmentReturn={retirementInvestmentReturn}
            />
        );
    }
    
    const containerHeightClass = isEmbedded ? 'h-full' : 'h-[calc(100vh-150px)]';

    return (
        <div className={`flex flex-col md:flex-row w-full gap-4 ${containerHeightClass}`}>
            <div className="flex-grow md:w-3/4 border border-gray-200 rounded-lg shadow-sm p-2 bg-white">
                <RetirementGraph 
                    data={chartData}
                    onAgeChange={handleAgeChange}
                    hoveredAge={currentAge}
                    showFundValue={retirementShowFundValue}
                    showPayoutCumulative={retirementShowPayoutCumulative} 
                    showPremium={retirementShowPremium}
                    showDeathBenefit={retirementShowDeathBenefit}
                    investmentReturn={retirementInvestmentReturn} 
                />
            </div>
            {!isEmbedded && (
                <div className="w-full md:w-1/4 flex-shrink-0">
                    <div className="rounded-lg shadow-sm bg-blue-900 h-full overflow-y-auto">
                        <RetirementChartControls 
                            initialData={initialDataForInfoBox}
                            hoveredData={hoveredData}
                            currentAge={currentAge}
                            showFundValue={retirementShowFundValue}
                            setShowFundValue={setRetirementShowFundValue}
                            showPayoutCumulative={retirementShowPayoutCumulative}
                            setShowPayoutCumulative={setRetirementShowPayoutCumulative}
                            showPremium={retirementShowPremium}
                            setShowPremium={setRetirementShowPremium}
                            showDeathBenefit={retirementShowDeathBenefit}
                            setShowDeathBenefit={setRetirementShowDeathBenefit}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetirementChartPage;