
import { RetirementChartData } from './RetirementGraph';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RetirementChartControlsProps {
    hoveredData: RetirementChartData | null;
    initialData: RetirementChartData | null;
    currentAge?: number;
    showFundValue: boolean; setShowFundValue: (show: boolean) => void;
    showPayoutCumulative: boolean; setShowPayoutCumulative: (show: boolean) => void;
    showPremium: boolean;   setShowPremium: (show: boolean) => void;
    showDeathBenefit: boolean; setShowDeathBenefit: (show: boolean) => void;
}

const RetirementChartControls = ({
    hoveredData, initialData, currentAge,
    showFundValue, setShowFundValue,
    showPayoutCumulative, setShowPayoutCumulative,
    showPremium, setShowPremium,
    showDeathBenefit, setShowDeathBenefit
}: RetirementChartControlsProps) => {

    const displayData = hoveredData || initialData;
    const formatNum = (num?: number) => num ? num.toLocaleString('en-US', {maximumFractionDigits: 0}) : '0';

    return (
        <div className="w-full h-full bg-blue-900 text-white rounded-lg shadow-lg p-4 flex flex-col">
            <div className="text-center mb-4">
                <h3 className="font-semibold text-base">สรุปผลประโยชน์</h3>
                {currentAge && (
                    <div className="text-lg font-bold mt-1">อายุ {currentAge} ปี</div>
                )}
            </div>
            
            {displayData ? (
                <div className="space-y-3 text-sm flex-grow">
                    <div className="flex items-center">
                        <Checkbox id="showPremium" checked={showPremium} onCheckedChange={(c) => setShowPremium(!!c)} className="mr-2 h-4 w-4 bg-white border-2 border-red-500 data-[state=checked]:border-red-500 data-[state=checked]:bg-white [&[data-state=checked]>span>svg]:stroke-red-700 [&[data-state=checked]>span>svg]:stroke-[3]"/>
                        <Label htmlFor="showPremium" className="flex-1 text-red-300">เบี้ยสะสม:</Label>
                        <span className="font-semibold text-lg text-red-300">{formatNum(displayData.premium)}</span>
                    </div>
                     <div className="flex items-center">
                        <Checkbox id="showPayoutCumulative" checked={showPayoutCumulative} onCheckedChange={(c) => setShowPayoutCumulative(!!c)} className="mr-2 h-4 w-4 bg-white border-2 border-green-500 data-[state=checked]:border-green-500 data-[state=checked]:bg-white [&[data-state=checked]>span>svg]:stroke-green-600 [&[data-state=checked]>span>svg]:stroke-[3]"/>
                        <Label htmlFor="showPayoutCumulative" className="flex-1 text-green-300">เงินเกษียณสะสม:</Label>
                        <span className="font-semibold text-lg text-green-300">{formatNum(displayData.payoutCumulative)}</span>
                    </div>
                     <div className="flex items-center">
                        <Checkbox id="showFundValue" checked={showFundValue} onCheckedChange={(c) => setShowFundValue(!!c)} className="mr-2 h-4 w-4 bg-white border-2 border-blue-400 data-[state=checked]:border-blue-400 data-[state=checked]:bg-white [&[data-state=checked]>span>svg]:stroke-blue-700 [&[data-state=checked]>span>svg]:stroke-[3]"/>
                        <Label htmlFor="showFundValue" className="flex-1 text-blue-300">มูลค่า กธ.:</Label>
                        <span className="font-semibold text-lg text-blue-300">{formatNum(displayData.fundValue)}</span>
                    </div>
                     <div className="flex items-center">
                        <Checkbox id="showDeathBenefit" checked={showDeathBenefit} onCheckedChange={(c) => setShowDeathBenefit(!!c)} className="mr-2 h-4 w-4 bg-white border-2 border-purple-400 data-[state=checked]:border-purple-400 data-[state=checked]:bg-white [&[data-state=checked]>span>svg]:stroke-purple-700 [&[data-state=checked]>span>svg]:stroke-[3]"/>
                        <Label htmlFor="showDeathBenefit" className="flex-1 text-purple-300">คุ้มครองชีวิต:</Label>
                        <span className="font-semibold text-lg text-purple-300">{formatNum(displayData.deathBenefit)}</span>
                    </div>
                </div>
            ) : (
                 <p className="text-xs text-gray-400 text-center my-4">เลื่อนเมาส์บนกราฟเพื่อดูข้อมูล</p>
            )}
        </div>
    );
};

export default RetirementChartControls;
