// CiPage.tsx

// --- Import ที่จำเป็น ---
import { useAppStore } from '@/stores/appStore';
import type { UseCiPlannerReturn } from '@/components/ci/types/useCiTypes';
import CIForm from "@/components/ci/CIFormPage"; // <-- Import คอมโพเนนต์แสดงผล

export default function CiPage() {
  // 1. ดึง State และ Actions ทั้งหมดจาก AppStore (Zustand)
  // นี่คือขั้นตอนการ "เชื่อมต่อกับแหล่งข้อมูล"
  const store = useAppStore();

  // 2. "ประกอบร่าง" props ทั้งหมดที่ CIForm ต้องการ
  // โดยดึงค่าจาก store มาใส่ให้ตรงกับชื่อ props ที่ CIForm คาดหวัง
  const plannerProps: UseCiPlannerReturn = {
    // Results
    isLoading: store.ciIsLoading,
    error: store.ciError,
    result: store.ciResult,
    ciPremiumsSchedule: null, // ในหน้านี้อาจยังไม่มีข้อมูลนี้
    calculatedMinPremium: store.ciSolvedMinPremium,
    calculatedRpp: store.ciSolvedRpp,
    calculatedRtu: store.ciSolvedRtu,

    // Inputs
    policyholderEntryAge: store.ciPlanningAge,
    policyholderGender: store.ciGender,
    policyOriginMode: store.ciPolicyOriginMode,
    existingPolicyEntryAge: store.ciExistingEntryAge,
    selectedCiPlans: store.ciPlanSelections,
    
    // iWealthy Config
    useIWealthy: store.ciUseIWealthy,
    iWealthyMode: store.ciIWealthyMode,
    iWealthyInvestmentReturn: store.ciIWealthyMode === 'manual' ? store.ciManualInvReturn : store.ciAutoInvReturn,
    iWealthyOwnPPT: store.ciIWealthyMode === 'manual' ? store.ciManualPpt : store.ciAutoPpt,
    iWealthyWithdrawalStartAge: store.ciIWealthyMode === 'manual' ? store.ciManualWithdrawalStartAge : store.ciAutoWithdrawalStartAge,
    ciUseCustomWithdrawalAge: store.ciUseCustomWithdrawalAge,
    setCiUseCustomWithdrawalAge: store.setCiUseCustomWithdrawalAge,
    manualRpp: store.ciManualRpp,
    manualRtu: store.ciManualRtu,
    autoRppRtuRatio: store.ciAutoRppRtuRatio,
    
    // Setters (ฟังก์ชันสำหรับอัปเดตค่าใน Store)
    setPolicyholderEntryAge: store.setCiPlanningAge,
    setPolicyholderGender: store.setCiGender,
    setPolicyOriginMode: store.setCiPolicyOriginMode,
    setExistingPolicyEntryAge: store.setCiExistingEntryAge,
    setSelectedCiPlans: store.setCiPlanSelections,
    setUseIWealthy: store.setCiUseIWealthy,
    setIWealthyMode: store.setCiIWealthyMode,
    setIWealthyInvestmentReturn: store.ciIWealthyMode === 'manual' ? store.setCiManualInvReturn : store.setCiAutoInvReturn,
    setIWealthyOwnPPT: store.ciIWealthyMode === 'manual' ? store.setCiManualPpt : store.setCiAutoPpt,
    setIWealthyWithdrawalStartAge: store.ciIWealthyMode === 'manual' ? store.setCiManualWithdrawalStartAge : store.setCiAutoWithdrawalStartAge,
    setManualRpp: store.setCiManualRpp,
    setManualRtu: store.setCiManualRtu,
    setAutoRppRtuRatio: store.setCiAutoRppRtuRatio,
    
    // Main Action
    runCalculation: store.runCiCalculation,
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">หน้าโรคร้ายแรง (CI - Critical Illness)</h2>
      {/* 3. ส่ง props ที่ประกอบร่างเสร็จแล้วทั้งหมดเข้าไปใน CIForm
           ด้วย Spread syntax ({...plannerProps})
      */}
      <CIForm {...plannerProps} />
    </div>
  );
}