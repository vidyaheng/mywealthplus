import { useState, useEffect } from 'react';
import type { WithdrawalPlanRecord } from '@/lib/calculations';
import { FaPlus, FaTrash } from 'react-icons/fa';

interface RetirementWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: WithdrawalPlanRecord[];
    onSave: (newPlan: WithdrawalPlanRecord[]) => void;
    retirementAge: number;
}

const RetirementWithdrawalModal = ({ isOpen, onClose, currentPlan, onSave, retirementAge }: RetirementWithdrawalModalProps) => {
    // ใช้ state ภายในเพื่อจัดการการแก้ไขแผนชั่วคราวก่อนกดบันทึก
    const [plan, setPlan] = useState<WithdrawalPlanRecord[]>([]);

    // เมื่อ Modal เปิดขึ้นมา ให้คัดลอกแผนปัจจุบันมาใส่ใน state ของ Modal
    useEffect(() => {
        if (isOpen) {
            // ใช้ JSON.parse(JSON.stringify(...)) เพื่อ deep copy array
            // ป้องกันการแก้ไข state หลักโดยตรงก่อนกดบันทึก
            setPlan(JSON.parse(JSON.stringify(currentPlan)));
        }
    }, [isOpen, currentPlan]);

    if (!isOpen) return null;

    const handleAddRow = () => {
        setPlan([...plan, {
            id: `wd-${Date.now()}`,
            type: 'annual',
            amount: 50000,
            startAge: retirementAge, // ใช้อายุเกษียณเป็นค่าเริ่มต้น
            endAge: 98,
            refType: 'age'
        }]);
    };

    const handleUpdateRow = (id: string, field: keyof WithdrawalPlanRecord, value: any) => {
        setPlan(plan.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleRemoveRow = (id: string) => {
        setPlan(plan.filter(row => row.id !== id));
    };

    const handleSave = () => {
        onSave(plan); // ส่งแผนที่แก้ไขแล้วกลับไปที่ state หลัก
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-lg font-semibold mb-4 text-slate-800">วางแผนการถอนเงินจาก iWealthy</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {plan.length === 0 && (
                        <p className="text-center text-gray-500 py-4">ยังไม่มีแผนการถอนเงิน<br/>คลิก "เพิ่มรายการ" เพื่อเริ่มต้น</p>
                    )}
                    {plan.map(row => (
                        <div key={row.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-3 border rounded-md bg-gray-50">
                            <div>
                                <label className="text-xs font-medium text-gray-600">จำนวนเงิน/ปี</label>
                                <input type="number" step="10000" value={row.amount} onChange={e => handleUpdateRow(row.id, 'amount', Number(e.target.value))} className="p-2 w-full border rounded-md text-sm mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">เริ่มอายุ</label>
                                <input type="number" value={row.startAge} onChange={e => handleUpdateRow(row.id, 'startAge', Number(e.target.value))} className="p-2 w-full border rounded-md text-sm mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600">ถึงอายุ</label>
                                <input type="number" value={row.endAge} onChange={e => handleUpdateRow(row.id, 'endAge', Number(e.target.value))} className="p-2 w-full border rounded-md text-sm mt-1" />
                            </div>
                            <button onClick={() => handleRemoveRow(row.id)} className="bg-red-500 text-white p-2 rounded-md h-10 w-full md:w-auto hover:bg-red-600 transition-colors flex items-center justify-center"><FaTrash /></button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddRow} className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                    <FaPlus /> เพิ่มรายการถอนเงิน
                </button>
                <div className="flex justify-end gap-4 mt-6 border-t pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">ยกเลิก</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold">บันทึกแผน</button>
                </div>
            </div>
        </div>
    );
};

export default RetirementWithdrawalModal;