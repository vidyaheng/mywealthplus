
import { useAppStore } from '@/stores/appStore';
import { FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

const ResultCard = ({ title, value, unit, description, colorClass = 'text-blue-600' }: { title: string, value: string | number, unit: string, description: string, colorClass?: string }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex-1">
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value.toLocaleString()}</p>
        <p className="text-sm text-gray-800">{unit}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
);

const ResultsDisplay = () => {
    const {
        retirementIsLoading,
        retirementError,
        retirementResult,
        retirementPlanningMode,
        // Auto results
        retirementSolvedIWealthyPremium,
        retirementSolvedPensionPremium,
        // Manual results
        retirementAchievedMonthlyPension,
    } = useAppStore();

    if (retirementIsLoading) {
        return (
            <div className="text-center p-8">
                <p className="text-lg font-semibold animate-pulse">กำลังคำนวณผลลัพธ์...</p>
            </div>
        );
    }

    if (retirementError) {
        return (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md flex items-center gap-3">
                <FaExclamationTriangle className="text-2xl" />
                <div>
                    <p className="font-bold">เกิดข้อผิดพลาด</p>
                    <p className="text-sm">{retirementError}</p>
                </div>
            </div>
        );
    }

    if (!retirementResult) {
        return (
            <div className="text-center p-8 bg-gray-100 rounded-lg">
                <p className="text-gray-500">ผลลัพธ์จะแสดงที่นี่หลังจากทำการคำนวณ</p>
            </div>
        );
    }

    const totalPremium = (retirementSolvedIWealthyPremium ?? 0) + (retirementSolvedPensionPremium ?? 0);

    return (
        <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FaChartLine /> สรุปผลการวางแผน</h2>
            <div className="flex flex-col sm:flex-row gap-4">
                {retirementPlanningMode === 'goalBased' ? (
                    <>
                        <ResultCard 
                            title="เบี้ย iWealthy ที่ต้องชำระ" 
                            value={retirementSolvedIWealthyPremium ?? 0} 
                            unit="บาท/ปี"
                            description="เบี้ยสำหรับสร้างการเติบโต"
                            colorClass="text-indigo-600"
                        />
                        <ResultCard 
                            title="เบี้ยบำนาญที่ต้องชำระ" 
                            value={retirementSolvedPensionPremium ?? 0}
                            unit="บาท/ปี"
                            description="เบี้ยสำหรับสร้างความมั่นคง"
                            colorClass="text-teal-600"
                        />
                         <ResultCard 
                            title="เบี้ยรวมทั้งหมด" 
                            value={totalPremium}
                            unit="บาท/ปี"
                            description="ยอดรวมที่ต้องเตรียมต่อปี"
                            colorClass="text-blue-600"
                        />
                    </>
                ) : (
                    <ResultCard 
                        title="เงินบำนาญที่จะได้รับ" 
                        value={Math.round(retirementAchievedMonthlyPension ?? 0)}
                        unit="บาท/เดือน"
                        description="ประมาณการรายรับหลังเกษียณ"
                        colorClass="text-green-600"
                    />
                )}
            </div>
        </div>
    );
};

export default ResultsDisplay;