
import { useAppStore } from '@/stores/appStore';

const GoalBasedInputs = () => {
  // --- ✨ [แก้ไขแล้ว] เปลี่ยนมาใช้ State และ Setter สำหรับ "รายปี" ---
  const {
    retirementDesiredAnnualPension,
    setRetirementDesiredAnnualPension,
    retirementAssumedInflationRate,
    setRetirementAssumedInflationRate,
  } = useAppStore();

  return (
    <div className="space-y-3 pt-2 animate-fadeIn">
        <div>
            {/* --- ✨ [แก้ไขแล้ว] อัปเดต Label และ State ที่เชื่อมต่อ --- */}
            <label htmlFor="desiredPension" className="block text-xs font-medium text-gray-700 mb-1">บำนาญที่คาดหวัง/ปี (มูลค่าปัจจุบัน)</label>
            <input 
                id="desiredPension" 
                type="number" 
                value={retirementDesiredAnnualPension} 
                onChange={(e) => setRetirementDesiredAnnualPension(Number(e.target.value))} 
                className="p-2 w-full border rounded-md shadow-sm text-sm" 
            />
        </div>
        <div>
            <label htmlFor="inflationRate" className="block text-xs font-medium text-gray-700 mb-1">เงินเฟ้อคาดการณ์ (% ต่อปี)</label>
            <input 
                id="inflationRate" 
                type="number" 
                value={retirementAssumedInflationRate} 
                onChange={(e) => setRetirementAssumedInflationRate(Number(e.target.value))} 
                className="p-2 w-full border rounded-md shadow-sm text-sm" 
            />
        </div>
    </div>
  );
};

export default GoalBasedInputs;