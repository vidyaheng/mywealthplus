// src/components/SaveRecordModal.tsx

import { useState } from 'react';
import { useAppStore } from '../stores/appStore';

type SaveRecordModalProps = {
  onConfirmSave: (recordName: string) => Promise<void>; // ฟังก์ชันที่จะถูกเรียกเมื่อกดยืนยัน
};

export default function SaveRecordModal({ onConfirmSave }: SaveRecordModalProps) {
  const { isSaveModalOpen, closeSaveModal } = useAppStore();
  const [recordName, setRecordName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isSaveModalOpen) {
    return null; // ถ้า state เป็น false, ไม่ต้องแสดงอะไรเลย
  }

  const handleConfirm = async () => {
    if (!recordName.trim()) {
      alert('กรุณาตั้งชื่อรายการ');
      return;
    }
    setIsLoading(true);
    await onConfirmSave(recordName); // เรียกฟังก์ชันที่ได้รับมาจาก props
    setIsLoading(false);
    setRecordName(''); // ล้างค่าใน input
    closeSaveModal(); // ปิด Modal
  };

  const handleCancel = () => {
    setRecordName('');
    closeSaveModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">ตั้งชื่อรายการที่จะบันทึก</h2>
        <input
          type="text"
          value={recordName}
          onChange={(e) => setRecordName(e.target.value)}
          placeholder="เช่น แผน A สำหรับคุณสมชาย"
          className="border p-2 rounded w-full mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          autoFocus
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={isLoading}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังบันทึก...' : 'ยืนยันการบันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}