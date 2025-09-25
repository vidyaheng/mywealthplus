
import { useAppStore } from '@/stores/appStore';
import { FaWrench } from 'react-icons/fa';

interface IWealthyOptionsCardProps {
    onOpenWithdrawalModal: () => void;
}

const ModeButton = ({ label, isActive, onClick, className = '' }: { label: string, isActive: boolean, onClick: () => void, className?: string }) => (
    <button onClick={onClick} className={`flex-1 px-2 py-1.5 rounded-md font-medium text-xs transition-all ${isActive ? `${className} text-white shadow-sm` : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
        {label}
    </button>
);

const IWealthyOptionsCard = ({ onOpenWithdrawalModal }: IWealthyOptionsCardProps) => {
    const {
        retirementPlanningMode,
        retirementInvestmentReturn, setRetirementInvestmentReturn,
        retirementIWealthyPPT, setRetirementIWealthyPPT,
        retirementManualIWealthyPremium, setRetirementManualIWealthyPremium,
        retirementSolvedIWealthyPremium,
        retirementIWealthyWithdrawalMode, setRetirementIWealthyWithdrawalMode,
    } = useAppStore();

    return (
        <div className="p-4 border rounded-lg shadow-md bg-white space-y-4 h-full flex flex-col">
            <h3 className="text-base font-semibold text-slate-700">
                ตั้งค่า iWealthy
            </h3>
            <div className="space-y-3 flex-grow">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ผลตอบแทนคาดหวัง (% ต่อปี)</label>
                    <input type="number" value={retirementInvestmentReturn} onChange={(e) => setRetirementInvestmentReturn(Number(e.target.value))} className="p-2 w-full border rounded-md shadow-sm text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ระยะเวลาชำระเบี้ย (ปี)</label>
                    <input type="number" value={retirementIWealthyPPT} onChange={(e) => setRetirementIWealthyPPT(Number(e.target.value))} className="p-2 w-full border rounded-md shadow-sm text-sm" />
                </div>
                
                {/* --- 🎨 ส่วนควบคุมการถอนเงินที่อัปเดตใหม่ --- */}
                <div className="pt-2 space-y-2">
                     <label className="block text-xs font-medium text-gray-700">รูปแบบการถอนเงิน</label>
                     <div className="flex space-x-2">
                        <ModeButton label="อัตโนมัติ" isActive={retirementIWealthyWithdrawalMode === 'automatic'} onClick={() => setRetirementIWealthyWithdrawalMode('automatic')} className="bg-sky-600 hover:bg-sky-700"/>
                        <ModeButton label="วางแผนเอง" isActive={retirementIWealthyWithdrawalMode === 'manual'} onClick={() => setRetirementIWealthyWithdrawalMode('manual')} className="bg-emerald-600 hover:bg-emerald-700"/>
                    </div>
                    {/* ปุ่ม "วางแผนเอง" จะแสดงก็ต่อเมื่อเลือกโหมด Manual เท่านั้น */}
                    {retirementIWealthyWithdrawalMode === 'manual' && (
                        <button onClick={onOpenWithdrawalModal} className="w-full mt-2 flex items-center justify-center gap-2 text-sm py-2 px-3 border border-emerald-600 text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors animate-fadeIn">
                            <FaWrench />
                            <span>แก้ไขแผนการถอนเงิน...</span>
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mt-auto">
                 {retirementPlanningMode === 'premiumBased' ? (
                    <div className="animate-fadeIn">
                        <label className="block text-xs font-medium text-gray-700 mb-1">เบี้ยประกันที่จ่าย (ต่อปี)</label>
                        <input type="number" value={retirementManualIWealthyPremium} onChange={(e) => setRetirementManualIWealthyPremium(Number(e.target.value))} className="p-2 w-full border rounded-md shadow-sm text-sm" />
                    </div>
                ) : (
                    <div className="text-center p-2 bg-gray-100 rounded-md animate-fadeIn">
                        <p className="text-xs text-gray-600">เบี้ยประกันที่คำนวณได้</p>
                        <p className="text-lg font-bold text-blue-600">{retirementSolvedIWealthyPremium?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '-'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IWealthyOptionsCard;