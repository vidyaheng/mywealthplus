import React from 'react';
import { useAppStore } from '@/stores/appStore'; // ปรับ path ตามโครงสร้างโปรเจกต์ของคุณ

const GoalBasedInputs = () => {
  // ดึง State และ Actions ที่จำเป็นสำหรับโหมด Goal-Based มาใช้งาน
  const {
    retirementDesiredMonthlyPension,
    setRetirementDesiredMonthlyPension,
    retirementAssumedInflationRate,
    setRetirementAssumedInflationRate,
    retirementFundingMix,
    setRetirementFundingMix,
    retirementHybridPensionRatio,
    setRetirementHybridPensionRatio,
  } = useAppStore();

  // ใช้ Style เดียวกันกับ Component แม่เพื่อความสอดคล้อง
  const controlRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '12px',
  };

  return (
    <div>
      <h4 style={{ marginTop: 0 }}>กำหนดเป้าหมายของคุณ</h4>
      
      {/* Input สำหรับเงินบำนาญที่คาดหวัง */}
      <div style={controlRowStyle}>
        <label htmlFor="desiredPension">บำนาญที่คาดหวัง/เดือน</label>
        <input
          id="desiredPension"
          type="number"
          value={retirementDesiredMonthlyPension}
          onChange={(e) => setRetirementDesiredMonthlyPension(Number(e.target.value))}
          placeholder="มูลค่าเงินในปัจจุบัน"
          style={{ padding: '8px' }}
        />
      </div>

      {/* Input สำหรับอัตราเงินเฟ้อ */}
      <div style={controlRowStyle}>
        <label htmlFor="inflationRate">เงินเฟ้อคาดการณ์ (% ต่อปี)</label>
        <input
          id="inflationRate"
          type="number"
          value={retirementAssumedInflationRate}
          onChange={(e) => setRetirementAssumedInflationRate(Number(e.target.value))}
          style={{ padding: '8px' }}
        />
      </div>

      {/* Input สำหรับเลือกสัดส่วนการลงทุน */}
      <div style={controlRowStyle}>
        <label htmlFor="fundingMix">สัดส่วนการลงทุน</label>
        <select
          id="fundingMix"
          value={retirementFundingMix}
          onChange={(e) => setRetirementFundingMix(e.target.value as 'hybrid' | 'iWealthyOnly' | 'pensionOnly')}
          style={{ padding: '8px' }}
        >
          <option value="hybrid">แบบผสม (บำนาญ + iWealthy)</option>
          <option value="iWealthyOnly">iWealthy อย่างเดียว</option>
          <option value="pensionOnly">แผนบำนาญอย่างเดียว</option>
        </select>
      </div>

      {/* ส่วนนี้จะแสดงก็ต่อเมื่อเลือกโหมด Hybrid เท่านั้น */}
      {retirementFundingMix === 'hybrid' && (
        <div style={controlRowStyle}>
          <label htmlFor="hybridRatio">
            สัดส่วน บำนาญ / iWealthy
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              id="hybridRatio"
              type="range" // ใช้ slider จะเข้าใจง่าย
              min="0"
              max="100"
              step="5"
              value={retirementHybridPensionRatio}
              onChange={(e) => setRetirementHybridPensionRatio(Number(e.target.value))}
              style={{ flexGrow: 1 }}
            />
            <span>{`${retirementHybridPensionRatio}% / ${100 - retirementHybridPensionRatio}%`}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalBasedInputs;