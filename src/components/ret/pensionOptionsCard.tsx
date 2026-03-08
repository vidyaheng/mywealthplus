
import { useAppStore } from '@/stores/appStore';
import type { PensionPlanType } from '@/data/pensionRates';

const ModeButton = ({ label, isActive, onClick, className = '' }: { label: string, isActive: boolean, onClick: () => void, className?: string }) => (
    <button onClick={onClick} className={`flex-1 px-2 py-1.5 rounded-md font-medium text-xs transition-all ${isActive ? `${className} text-white shadow-sm` : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
        {label}
    </button>
);

const PensionOptionsCard = () => {
    const {
        retirementPlanningMode,
        retirementFundingMix,
        retirementPensionOptions, setRetirementPensionOptions,
        // Manual mode
        retirementManualPensionPremium, setRetirementManualPensionPremium,
        // Auto mode results
        retirementSolvedPensionPremium,
        // Hybrid controls
        retirementHybridMode, setRetirementHybridMode,
        retirementHybridPensionRatio, setRetirementHybridPensionRatio,
    } = useAppStore();

    const isGoalBasedHybrid = retirementPlanningMode === 'goalBased' && retirementFundingMix === 'hybrid';

    return (
        <div className="p-4 border rounded-lg shadow-md bg-white space-y-4 h-full flex flex-col">
            <h3 className="text-base font-semibold text-slate-700">
                ตั้งค่าแผนบำนาญ
            </h3>
            <div className="space-y-3 flex-grow">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">เลือกแผนบำนาญ</label>
                    <select value={retirementPensionOptions.planType} onChange={(e) => setRetirementPensionOptions({ planType: e.target.value as PensionPlanType })} className="p-2 w-full border rounded-md shadow-sm text-sm">
                        <option value="pension8">บำนาญ 8 (จ่ายเบี้ย 8 ปี)</option>
                        <option value="pension60">บำนาญ 60 (จ่ายเบี้ยถึงอายุ 59)</option>
                    </select>
                </div>

                {/* --- [ใหม่] Logic การแสดงผลสำหรับโหมด Hybrid --- */}
                {isGoalBasedHybrid && (
                    <div className="pt-2 space-y-2">
                         <label className="block text-xs font-medium text-gray-700">รูปแบบการจัดสรร</label>
                         <div className="flex space-x-2">
                            <ModeButton label="อัตโนมัติ (ตามสัดส่วน)" isActive={retirementHybridMode === 'automatic'} onClick={() => setRetirementHybridMode('automatic')} className="bg-sky-600 hover:bg-sky-700"/>
                            <ModeButton label="กำหนดเบี้ยเอง" isActive={retirementHybridMode === 'manual'} onClick={() => setRetirementHybridMode('manual')} className="bg-emerald-600 hover:bg-emerald-700"/>
                        </div>
                        
                        {retirementHybridMode === 'automatic' ? (
                             <div className="space-y-2 pt-2 animate-fadeIn">
                                <label className="block text-xs font-medium text-gray-700">สัดส่วน บำนาญ / iWealthy</label>
                                <div className="flex items-center gap-3">
                                    <input type="range" min="0" max="100" step="5" value={retirementHybridPensionRatio} onChange={(e) => setRetirementHybridPensionRatio(Number(e.target.value))} className="w-full" />
                                    <span className="text-xs font-semibold text-gray-600 w-24 text-center">{`${retirementHybridPensionRatio}% / ${100 - retirementHybridPensionRatio}%`}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fadeIn pt-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">เบี้ยบำนาญที่ต้องการ (ต่อปี)</label>
                                <input type="number" value={retirementManualPensionPremium} onChange={(e) => setRetirementManualPensionPremium(Number(e.target.value))} className="p-2 w-full border rounded-md shadow-sm text-sm" />
                                <p className="text-[11px] text-gray-500 mt-1">iWealthy จะคำนวณเบี้ยที่เหลือให้โดยอัตโนมัติ</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="mt-auto">
                 {retirementPlanningMode === 'premiumBased' || (isGoalBasedHybrid && retirementHybridMode === 'manual') ? (
                    <div className="animate-fadeIn">
                        <label className="block text-xs font-medium text-gray-700 mb-1">เบี้ยประกันที่จ่าย (ต่อปี)</label>
                        <input type="number" value={retirementManualPensionPremium} onChange={(e) => setRetirementManualPensionPremium(Number(e.target.value))} className="p-2 w-full border rounded-md shadow-sm text-sm" />
                    </div>
                ) : (
                    <div className="text-center p-2 bg-gray-100 rounded-md animate-fadeIn">
                        <p className="text-xs text-gray-600">เบี้ยประกันที่คำนวณได้</p>
                        <p className="text-lg font-bold text-teal-600">{retirementSolvedPensionPremium?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '-'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PensionOptionsCard;