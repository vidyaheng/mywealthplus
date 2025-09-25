import React from 'react';
import { useAppStore } from '@/stores/appStore'; // ปรับ path ตามโครงสร้างโปรเจกต์ของคุณ

//  komponenย่อยที่เราจะสร้างในขั้นตอนถัดไป
// ในตอนแรกให้สร้างเป็นไฟล์ว่างๆ ที่ return <div>Hello</div> ไปก่อนก็ได้
import GoalBasedInputs from '@/components/ret/GoalBasedInputs';
import PremiumBasedInputs from '@/components/ret/PremiumBasedInputs';

const InputControls = () => {
  // ดึง State และ Actions ทั้งหมดที่เกี่ยวข้องกับการ Input มาใช้งาน
  const {
    // Mode
    retirementPlanningMode,
    setRetirementPlanningMode,
    // Common Inputs
    retirementPlanningAge,
    setRetirementPlanningAge,
    retirementGender,
    setRetirementGender,
    retirementDesiredAge,
    setRetirementDesiredAge,
    retirementInvestmentReturn,
    setRetirementInvestmentReturn,
    retirementIWealthyPPT,
    setRetirementIWealthyPPT,
    // Action and Status
    runRetirementCalculation,
    retirementIsLoading,
  } = useAppStore();

  const controlRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '12px',
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px' }}>
      <h3>ข้อมูลสำหรับวางแผน</h3>

      {/* 1. ตัวสลับโหมดการวางแผน */}
      <div style={controlRowStyle}>
        <label htmlFor="planningMode">โหมดการวางแผน</label>
        <select
          id="planningMode"
          value={retirementPlanningMode}
          onChange={(e) =>
            setRetirementPlanningMode(e.target.value as 'goalBased' | 'premiumBased')
          }
          style={{ padding: '8px' }}
        >
          <option value="goalBased">วางแผนตามเป้าหมาย (อยากได้เงินบำนาญ)</option>
          <option value="premiumBased">วางแผนตามเบี้ย (มีงบประมาณ)</option>
        </select>
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* 2. Input ที่ใช้ร่วมกันทั้งสองโหมด */}
      <div style={controlRowStyle}>
        <label htmlFor="planningAge">อายุ ณ ปัจจุบัน</label>
        <input
          id="planningAge"
          type="number"
          value={retirementPlanningAge}
          onChange={(e) => setRetirementPlanningAge(Number(e.target.value))}
          style={{ padding: '8px' }}
        />
      </div>
      <div style={controlRowStyle}>
        <label htmlFor="gender">เพศ</label>
        <select
          id="gender"
          value={retirementGender}
          onChange={(e) => setRetirementGender(e.target.value as 'male' | 'female')}
          style={{ padding: '8px' }}
        >
          <option value="male">ชาย</option>
          <option value="female">หญิง</option>
        </select>
      </div>
      <div style={controlRowStyle}>
        <label htmlFor="retireAge">อายุที่ต้องการเกษียณ</label>
        <input
          id="retireAge"
          type="number"
          value={retirementDesiredAge}
          onChange={(e) => setRetirementDesiredAge(Number(e.target.value))}
          style={{ padding: '8px' }}
        />
      </div>
      <div style={controlRowStyle}>
        <label htmlFor="invReturn">ผลตอบแทนคาดหวัง (% ต่อปี)</label>
        <input
          id="invReturn"
          type="number"
          value={retirementInvestmentReturn}
          onChange={(e) => setRetirementInvestmentReturn(Number(e.target.value))}
          style={{ padding: '8px' }}
        />
      </div>
      <div style={controlRowStyle}>
        <label htmlFor="iwealthyPPT">ระยะเวลาชำระเบี้ย iWealthy (ปี)</label>
        <input
          id="iwealthyPPT"
          type="number"
          value={retirementIWealthyPPT}
          onChange={(e) => setRetirementIWealthyPPT(Number(e.target.value))}
          style={{ padding: '8px' }}
        />
      </div>
      
      <hr style={{ margin: '20px 0' }} />

      {/* 3. ส่วนของ Input ที่เปลี่ยนไปตามโหมด */}
      <div>
        {retirementPlanningMode === 'goalBased' ? (
          <GoalBasedInputs />
        ) : (
          <PremiumBasedInputs />
        )}
      </div>
      
      {/* 4. ปุ่มสำหรับคำนวณ */}
      <button
        onClick={runRetirementCalculation}
        disabled={retirementIsLoading}
        style={{ 
          width: '100%', 
          padding: '12px', 
          marginTop: '20px', 
          backgroundColor: retirementIsLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {retirementIsLoading ? 'กำลังคำนวณ...' : 'คำนวณแผนเกษียณ'}
      </button>
    </div>
  );
};

export default InputControls;