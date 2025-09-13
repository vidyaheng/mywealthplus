// src/components/LoadRecordModal.tsx

import { useEffect, useState } from 'react';
import { useAppStore, SavedRecord } from '../stores/appStore';
import { FaTrash } from 'react-icons/fa';

export default function LoadRecordModal() {
  const { 
    isLoadModalOpen, closeLoadModal, 
    pin, 
    isAdmin,
    savedRecords, setSavedRecords,
    loadIWealthyState 
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // เมื่อ Modal ถูกเปิด ให้ดึงข้อมูลรายการที่เคยบันทึกไว้
  useEffect(() => {
    if (isLoadModalOpen && pin) {
      const fetchRecords = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/records/${pin}`);
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

  // เมื่อ User คลิกเลือกรายการที่ต้องการโหลด
  const handleSelectRecord = async (recordId: string) => {
    if (!pin) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/record/${recordId}`, {
        headers: { 'x-user-pin': pin } // ส่ง PIN ไปใน Header เพื่อยืนยันสิทธิ์
      });
      const data = await res.json();
      if (data.success) {
        loadIWealthyState(data.record.data); // นำข้อมูลไปใส่ในฟอร์ม
        closeLoadModal(); // ปิด Modal
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
    
    // ยืนยันก่อนลบเพื่อประสบการณ์ใช้งานที่ดี
    const isConfirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ:\n"${recordName}"?`);
    if (!isConfirmed) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/record/${recordId}`, {
        method: 'DELETE',
        headers: { 'x-user-pin': pin }
      });
      const data = await res.json();
      if (data.success) {
        // ลบรายการออกจาก State เพื่อให้ UI อัปเดตทันที
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
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">เลือกรายการที่จะโหลด</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {!isLoading && savedRecords.length === 0 && <p>ไม่พบรายการที่เคยบันทึกไว้</p>}
          {savedRecords.map((record: SavedRecord) => (
            <div key={record._id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded border">
              <button 
                onClick={() => handleSelectRecord(record._id)}
                className="text-left flex-grow mr-4"
              >
                <p className="font-semibold text-blue-800">{record.recordName}</p>
                <p className="text-xs text-gray-500">
                  บันทึกเมื่อ: {new Date(record.createdAt).toLocaleString()}
                </p>
                {isAdmin && (
                  <p className="text-xs text-red-600 font-semibold mt-1">
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
          ))}
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