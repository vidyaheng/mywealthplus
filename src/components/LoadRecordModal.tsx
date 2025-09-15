// src/components/LoadRecordModal.tsx

import { useEffect, useState } from 'react';
import { useAppStore, SavedRecord } from '../stores/appStore';
import { FaTrash, FaShieldAlt, FaHeartbeat, FaBrain, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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

export default function LoadRecordModal() {

  const navigate = useNavigate();

  const { 
    isLoadModalOpen, closeLoadModal, 
    pin, isAdmin,
    savedRecords, setSavedRecords,
    loadIWealthyState, // หมายเหตุ: ฟังก์ชันนี้จะโหลดได้แค่ state ของ iWealthy
    loadLthcState,
    loadCiState 
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadModalOpen && pin) {
      const fetchRecords = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch(`http://localhost:3001/api/records/${pin}`);
          const data = await res.json();
          if (data.success) {
            setSavedRecords(data.records);
          } else {
            setError(data.error || 'Failed to fetch records.');
          }
        } catch (e) {
          setError('Could not connect to the server.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchRecords();
    }
  }, [isLoadModalOpen, pin, setSavedRecords]);

  const handleSelectRecord = async (record: SavedRecord) => {
    if (!pin) return;
  

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/record/${record._id}`, {
        headers: { 'x-user-pin': pin }
      });
      const data = await res.json();
      if (data.success) {
        // --- ✅ Logic ใหม่ที่ฉลาดขึ้น ---
        const recordData = data.record.data;
        const projectName = data.record.projectName;

        if (projectName === 'iWealthy') {
          loadIWealthyState(recordData);

          navigate('/iwealthy/form');
        } else if (projectName === 'LTHC') {
          loadLthcState(recordData);
          navigate('/lthc/form');
        } else if (projectName === 'CI') {
          loadCiState(recordData);
          navigate('/ci');
        } else {
          // สำหรับโปรเจกต์อื่นๆ ในอนาคต
          alert(`ยังไม่รองรับการโหลดข้อมูลสำหรับโปรเจกต์ "${projectName}"`);
        }
        
        closeLoadModal();
      } else {
        setError(data.error || 'Failed to load selected record.');
      }
    } catch (e) {
      setError('Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: string, recordName: string) => {
    if (!pin) return;
    const isConfirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ:\n"${recordName}"?`);
    if (!isConfirmed) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/record/${recordId}`, {
        method: 'DELETE',
        headers: { 'x-user-pin': pin }
      });
      const data = await res.json();
      if (data.success) {
        setSavedRecords(savedRecords.filter(r => r._id !== recordId));
      } else {
        setError(data.error || 'Failed to delete record.');
      }
    } catch (e) {
      setError('Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoadModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          {isAdmin ? 'Admin - All Records' : 'เลือกรายการที่จะโหลด/จัดการ'}
        </h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {!isLoading && savedRecords.length === 0 && <p>ไม่พบรายการที่เคยบันทึกไว้</p>}
          {savedRecords.map((record: SavedRecord) => {
            const style = projectStyles[record.projectName as keyof typeof projectStyles] || projectStyles.default;
            return (
              <div key={record._id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded border">
                <button 
                  onClick={() => handleSelectRecord(record)}
                  className="text-left flex-grow mr-4"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    {/* แสดง Tag ของโปรเจกต์ */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.color}`}>
                      {style.icon}
                      {record.projectName}
                    </span>
                    <p className="font-semibold text-blue-800 text-base">{record.recordName}</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-1">
                    บันทึกเมื่อ: {new Date(record.createdAt).toLocaleString()}
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-red-600 font-semibold mt-1 ml-1">
                      Owner PIN: {record.pin}
                    </p>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRecord(record._id, record.recordName);
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                  title="ลบรายการนี้"
                >
                  <FaTrash />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={closeLoadModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}