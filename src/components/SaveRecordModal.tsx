import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore, SavedRecord } from '../stores/appStore';
import { calculateLifeCoverage } from '../lib/calculations';
import { FaShieldAlt, FaHeartbeat, FaBrain, FaFileAlt } from 'react-icons/fa';

// ตัวช่วยสำหรับจัดการ Style ของแต่ละโปรเจกต์
const projectStyles = {
  iWealthy: { 
    icon: <FaShieldAlt className="mr-1.5" />, 
    color: 'bg-blue-100 text-blue-800 border-blue-200' 
  },
  LTHC: { 
    icon: <FaHeartbeat className="mr-1.5" />, 
    color: 'bg-green-100 text-green-800 border-green-200' 
  },
  CI: { 
    icon: <FaBrain className="mr-1.5" />, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
  },
  default: {
    icon: <FaFileAlt className="mr-1.5" />, 
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

export default function SaveRecordModal() {
  const location = useLocation();

  // --- 1. ดึง State ทั้งหมดที่จำเป็นจาก Store ---
  const {
    // State สำหรับควบคุม Modal และ User
    isSaveModalOpen, closeSaveModal,
    pin, activeRecordId, activeRecordName,
    savedRecords, setSavedRecords,
    
    // States ของ iWealthy
    iWealthyAge, iWealthyGender, iWealthyPaymentFrequency, iWealthyRpp, iWealthyRtu, iWealthySumInsured, iWealthySumInsuredReductions,
    
    // States ของ LTHC
    policyholderEntryAge, policyholderGender, selectedHealthPlans, 
    policyOriginMode, existingPolicyEntryAge, fundingSource, 
    iWealthyMode, pensionMode, pensionFundingOptions, manualPensionPremium,
    manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT,
    manualWithdrawalStartAge, autoInvestmentReturn, autoIWealthyPPT,
    autoRppRtuRatio, saReductionStrategy,

    // States ของ CI
    ciPlanningAge, ciGender, ciPolicyOriginMode, ciExistingEntryAge,
    ciPlanSelections, ciUseIWealthy, ciIWealthyMode, ciManualRpp,
    ciManualRtu, ciManualInvReturn, ciManualPpt, ciManualWithdrawalStartAge,
    ciAutoInvReturn, ciAutoPpt, ciAutoRppRtuRatio, ciAutoWithdrawalStartAge,
    ciUseCustomWithdrawalAge,
  } = useAppStore();

  // --- State ภายในสำหรับจัดการ UI ของ Modal ---
  const [recordNameInput, setRecordNameInput] = useState('');
  const [selectedIdToOverwrite, setSelectedIdToOverwrite] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 2. Logic การรวบรวมข้อมูลตามโปรเจกต์ปัจจุบัน (ดูจาก URL) ---
  const { projectName, dataToSave } = useMemo(() => {
    const path = location.pathname;

    if (path.startsWith('/iwealthy')) {
      return {
        projectName: 'iWealthy',
        dataToSave: { 
            age: iWealthyAge, gender: iWealthyGender, paymentFrequency: iWealthyPaymentFrequency,
            rpp: iWealthyRpp, rtu: iWealthyRtu, sumInsured: iWealthySumInsured,
            sumInsuredReductions: iWealthySumInsuredReductions,
            lifeCoverage: calculateLifeCoverage(iWealthySumInsured), 
            totalAnnualPremium: (iWealthyRpp || 0) + (iWealthyRtu || 0)
        }
      };
    } 
    else if (path.startsWith('/lthc')) {
      return {
        projectName: 'LTHC',
        dataToSave: {
          policyholderEntryAge, policyholderGender, selectedHealthPlans,
          policyOriginMode, existingPolicyEntryAge, fundingSource,
          iWealthyMode, pensionMode, pensionFundingOptions, manualPensionPremium,
          manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT,
          manualWithdrawalStartAge, autoInvestmentReturn, autoIWealthyPPT,
          autoRppRtuRatio, saReductionStrategy
        }
      };
    }
    else if (path.startsWith('/ci')) {
      return {
        projectName: 'CI',
        dataToSave: {
          ciPlanningAge, ciGender, ciPolicyOriginMode, ciExistingEntryAge,
          ciPlanSelections, ciUseIWealthy, ciIWealthyMode, ciManualRpp,
          ciManualRtu, ciManualInvReturn, ciManualPpt, ciManualWithdrawalStartAge,
          ciAutoInvReturn, ciAutoPpt, ciAutoRppRtuRatio, ciAutoWithdrawalStartAge,
          ciUseCustomWithdrawalAge
        }
      };
    }
    
    return { projectName: 'Unknown', dataToSave: {} };
  }, [
    location.pathname, 
    // Dependency array ต้องมี state ทั้งหมดที่ใช้ในการ save
    iWealthyAge, iWealthyGender, iWealthyPaymentFrequency, iWealthyRpp, iWealthyRtu, iWealthySumInsured, iWealthySumInsuredReductions,
    policyholderEntryAge, policyholderGender, selectedHealthPlans, policyOriginMode, existingPolicyEntryAge, fundingSource, iWealthyMode, pensionMode, pensionFundingOptions, manualPensionPremium, manualRpp, manualRtu, manualInvestmentReturn, manualIWealthyPPT, manualWithdrawalStartAge, autoInvestmentReturn, autoIWealthyPPT, autoRppRtuRatio, saReductionStrategy,
    ciPlanningAge, ciGender, ciPolicyOriginMode, ciExistingEntryAge, ciPlanSelections, ciUseIWealthy, ciIWealthyMode, ciManualRpp, ciManualRtu, ciManualInvReturn, ciManualPpt, ciManualWithdrawalStartAge, ciAutoInvReturn, ciAutoPpt, ciAutoRppRtuRatio, ciAutoWithdrawalStartAge, ciUseCustomWithdrawalAge
  ]);

  // --- 3. Effect สำหรับดึงรายการไฟล์เก่าและตั้งค่าเริ่มต้นเมื่อ Modal เปิด ---
  useEffect(() => {
    if (isSaveModalOpen && pin) {
      setIsLoading(true);
      setError(null);
      
      const fetchRecords = async () => {
        try {
          const res = await fetch(`/api/records/${pin}`);
          const data = await res.json();
          if (data.success) {
            setSavedRecords(data.records);
          }
        } catch (e) {
          setError('Could not fetch records list.');
        } finally {
            setIsLoading(false);
        }
      };
      
      fetchRecords();
      setRecordNameInput(activeRecordName || '');
      setSelectedIdToOverwrite(activeRecordId);
    }
  }, [isSaveModalOpen, pin, activeRecordName, activeRecordId, setSavedRecords]);
  
  // --- 4. Logic การยืนยันการบันทึก ---
  const handleConfirm = async () => {
    if (!recordNameInput.trim()) {
      alert('กรุณาตั้งชื่อรายการ');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
        let response;
        const idToUpdate = selectedIdToOverwrite;

        if (idToUpdate) {
          // UPDATE (บันทึกทับ)
          response = await fetch(`/api/record/${idToUpdate}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-pin': pin! },
            body: JSON.stringify({ recordName: recordNameInput, data: dataToSave }),
          });
        } else {
          // CREATE (สร้างใหม่)
          response = await fetch('/api/save-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, projectName: projectName, recordName: recordNameInput, data: dataToSave }),
          });
        }
        
        const result = await response.json();
        if (response.ok) {
            alert('🎉 บันทึกข้อมูลสำเร็จ!');
            closeSaveModal();
        } else {
            setError(result.error || 'Failed to save data.');
        }
    } catch (e) {
        setError('Could not connect to the server.');
    } finally {
        setIsLoading(false);
    }
  };

  // --- 5. Logic การเลือกรายการเพื่อบันทึกทับ ---
  const handleSelectRecord = (record: SavedRecord) => {
    setRecordNameInput(record.recordName);
    setSelectedIdToOverwrite(record._id);
  };
  
  if (!isSaveModalOpen) return null;

  // --- 6. JSX ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl flex flex-col">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">บันทึกรายการ {projectName}</h2>
        
        <input
          type="text"
          value={recordNameInput}
          onChange={(e) => {
            setRecordNameInput(e.target.value);
            setSelectedIdToOverwrite(null);
          }}
          placeholder="-- พิมพ์ชื่อใหม่เพื่อสร้าง หรือเลือกรายการด้านล่างเพื่อบันทึกทับ --"
          className="border p-2 rounded w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          autoFocus
        />

        <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-2 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2 px-1">หรือเลือกรายการเดิมเพื่อบันทึกทับ:</p>
          {isLoading && <p className="text-sm text-gray-500 text-center py-4">Loading list...</p>}
          {!isLoading && savedRecords.length === 0 && <p className="text-sm text-gray-400 text-center py-4">ไม่พบรายการที่เคยบันทึกไว้</p>}
          
          {/* 👇👇👇 นี่คือส่วน JSX ที่เราคัดลอกและปรับปรุงมาจาก LoadRecordModal 👇👇👇 */}
          {!isLoading && savedRecords.map(record => {
            const style = projectStyles[record.projectName as keyof typeof projectStyles] || projectStyles.default;
            const isSelected = selectedIdToOverwrite === record._id;

            return (
              <button
                key={record._id}
                onClick={() => handleSelectRecord(record)}
                className={`w-full text-left p-3 rounded transition-colors flex justify-between items-center border ${
                  isSelected 
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                  : 'bg-white hover:bg-blue-50 border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      isSelected ? 'bg-white/20 border-white/30' : style.color
                    }`}>
                      {style.icon}
                      {record.projectName}
                    </span>
                    <p className={`font-semibold text-base ${
                      isSelected ? 'text-white' : 'text-blue-800'
                    }`}>{record.recordName}</p>
                  </div>
                  <p className={`text-xs ml-1 ${
                    isSelected ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    บันทึกเมื่อ: {new Date(record.createdAt).toLocaleString()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        
        {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
        
        <div className="flex justify-end gap-4 mt-4 pt-4 border-t">
          <button onClick={closeSaveModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" disabled={isLoading}>
            ยกเลิก
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400" disabled={isLoading}>
            {isLoading ? 'กำลังบันทึก...' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}