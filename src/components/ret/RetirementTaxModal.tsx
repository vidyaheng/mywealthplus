import { useState } from 'react';

type TaxModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (inputs: { 
        taxRate: number; 
        usedFirst100k: number;
        usedPensionDeduction: number; // ✨ เพิ่มช่องสำหรับลดหย่อนบำนาญ
        endAge: number; 
    }) => void;
};

const RetirementTaxModal = ({ isOpen, onClose, onConfirm }: TaxModalProps) => {
    const [rate, setRate] = useState(10);
    const [used100k, setUsed100k] = useState(0);
    const [usedPension, setUsedPension] = useState(0);
    const [endAge, setEndAge] = useState(98);
    const [showOtherRates, setShowOtherRates] = useState(false);

    const commonTaxRates = [5, 10, 15, 20];
    const otherTaxRates = [25, 30, 35];

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({ 
            taxRate: rate, 
            usedFirst100k: used100k, 
            usedPensionDeduction: usedPension,
            endAge: endAge 
        });
        onClose();
    };

    const handleUsedChange = (setter: React.Dispatch<React.SetStateAction<number>>, maxValue: number, value: number) => {
        setter(Math.max(0, Math.min(maxValue, value)));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-6 text-gray-800">ตั้งค่าเพื่อคำนวณลดหย่อนภาษี</h3>
                <div className="space-y-6">
                    {/* ส่วนเลือกฐานภาษี */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ฐานภาษีสูงสุดของคุณ</label>
                        <div className="flex flex-wrap gap-2">
                            {commonTaxRates.map((taxRate) => (
                                <button key={taxRate} onClick={() => setRate(taxRate)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${rate === taxRate ? 'bg-sky-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                    {taxRate}%
                                </button>
                            ))}
                            <button onClick={() => setShowOtherRates(!showOtherRates)} className="px-4 py-2 text-sm font-medium text-sky-600 rounded-lg hover:bg-sky-100 transition-colors">
                                {showOtherRates ? 'ซ่อน' : 'อื่นๆ...'}
                            </button>
                        </div>
                        {showOtherRates && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {otherTaxRates.map((taxRate) => (
                                    <button key={taxRate} onClick={() => setRate(taxRate)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${rate === taxRate ? 'bg-sky-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                        {taxRate}%
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ✨ ส่วนลดหย่อนบำนาญ */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ค่าลดหย่อนบำนาญที่ใช้ไปแล้ว (จาก RMF, SSF, กองทุนสำรองเลี้ยงชีพ)</label>
                        <div className="flex items-center gap-4">
                            <input type="range" min="0" max="200000" step="1000" value={usedPension} onChange={(e) => handleUsedChange(setUsedPension, 200000, Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"/>
                            <input type="number" value={usedPension} onChange={(e) => handleUsedChange(setUsedPension, 200000, Number(e.target.value))} className="w-36 border border-gray-300 rounded-lg py-2 text-right px-3"/>
                        </div>
                    </div>

                    {/* ส่วนลดหย่อนประกันชีวิต */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ค่าลดหย่อนประกันชีวิต (100,000 บาท) ที่ใช้ไปแล้ว</label>
                        <div className="flex items-center gap-4">
                             <input type="range" min="0" max="100000" step="1000" value={used100k} onChange={(e) => handleUsedChange(setUsed100k, 100000, Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-600"/>
                             <input type="number" value={used100k} onChange={(e) => handleUsedChange(setUsed100k, 100000, Number(e.target.value))} className="w-36 border border-gray-300 rounded-lg py-2 text-right px-3"/>
                        </div>
                    </div>
                    
                    <div>
                         <label htmlFor="endAge" className="block text-sm font-semibold text-gray-700">คำนวณผลประโยชน์ถึงอายุ</label>
                         <input type="number" id="endAge" value={endAge} onChange={(e) => setEndAge(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3"/>
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                    <button onClick={handleConfirm} className="px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700">ยืนยัน</button>
                </div>
            </div>
        </div>
    );
};

export default RetirementTaxModal;