import React from 'react';
import { useAppStore } from '@/stores/appStore'; // ปรับ path ตามโครงสร้างโปรเจกต์ของคุณ

const PremiumBasedInputs = () => {
  // ดึง State และ Actions ที่จำเป็นสำหรับโหมด Premium-Based
  const {
    retirementManualIWealthyPremium,
    setRetirementManualIWealthyPremium,
    retirementManualPensionPremium,
    setRetirementManualPensionPremium,
  } = useAppStore();

  // ใช้ Style เดียวกันกับ Component อื่นๆ
  const controlRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '12px',
  };

  return (
    <div>
      <h4 style={{ marginTop: 0 }}>กำหนดงบประมาณของคุณ (ต่อปี)</h4>

      {/* Input สำหรับเบี้ย iWealthy */}
      <div style={controlRowStyle}>
        <label htmlFor="manualIwealthy">เบี้ย iWealthy ต่อปี</label>
        <input
          id="manualIwealthy"
          type="number"
          value={retirementManualIWealthyPremium}
          onChange={(e) => setRetirementManualIWealthyPremium(Number(e.target.value))}
          style={{ padding: '8px' }}
        />
      </div>

      {/* Input สำหรับเบี้ยแผนบำนาญ */}
      <div style={controlRowStyle}>
        <label htmlFor="manualPension">เบี้ยแผนบำนาญต่อปี</label>
        <input
          id="manualPension"
          type="number"
          value={retirementManualPensionPremium}
          onChange={(e) => setRetirementManualPensionPremium(Number(e.target.value))}
          style={{ padding: '8px' }}
        />
      </div>
    </div>
  );
};

export default PremiumBasedInputs;