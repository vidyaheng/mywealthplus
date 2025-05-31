// src/components/modal_views/ModalTableView.tsx
// (กรุณาปรับ path ของ imports ให้ถูกต้อง)

import React from 'react';
import DisplayTable, { AnnualTableView } from '@/components/DisplayTable';
import { AnnualCalculationOutputRow } from '@/lib/calculations';
import { Button } from "@/components/ui/button";
//import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Minus } from 'lucide-react';

interface ModalTableViewProps {
    data: AnnualCalculationOutputRow[];
    formatNumber: (num: number | undefined | null) => string;
    
    // Props สำหรับ Table Controls
    viewMode: AnnualTableView;
    onViewModeChange: (value: AnnualTableView) => void;
    showCsv: boolean;
    onShowCsvToggle: () => void;
    onRecalculate?: () => void; // สำหรับปุ่ม Update
    
    caption?: string;
}

const ModalTableView: React.FC<ModalTableViewProps> = ({
    data,
    formatNumber,
    viewMode,
    onViewModeChange,
    showCsv,
    onShowCsvToggle,
    //onRecalculate,
    caption = "ตารางผลประโยชน์ (Fullscreen)"
}) => {
    return (
        <div className="flex flex-col h-full w-full">
            {/* Controls Bar for Table */}
            <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-1 p-2 flex-shrink-0 border-b bg-slate-50">
                {/* Left Group: ViewMode Toggle และ CSV Toggle */}
                <div className="flex items-center">
                     <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded-l border border-gray-300 h-6 ${viewMode === 'compact'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-blue-100'
                        }`}
                        aria-label="Compact View"
                        onClick={() => onViewModeChange('compact')}
                    >
                        ย่อ
                    </button>
                    <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded-r border border-gray-300 h-6 border-l-0 ${viewMode === 'full'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-orange-100'
                        }`}
                        aria-label="Full View"
                        onClick={() => onViewModeChange('full')}
                    >
                        เต็ม
                    </button>
                    
                    
                </div>
                <div className="flex items-end space-x-2">
                <Button
                        variant="outline"
                        size="sm"
                        onClick={onShowCsvToggle}
                        className="h-8 px-2"
                        title={showCsv ? "ซ่อนมูลค่าเวนคืน" : "แสดงมูลค่าเวนคืน"}
                    >
                        {showCsv ? <Minus size={16} /> : <Plus size={16} />}
                        <span className="ml-1 text-xs hidden sm:inline">เวนคืน</span>
                    </Button>
                {/* Right Group: ปุ่ม Update 
                {onRecalculate && (
                    <Button
                        onClick={onRecalculate}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5"
                    >
                        Update
                    </Button>
                )}*/}
                </div>
            </div>

            {/* DisplayTable Area */}
            {/* ไม่จำเป็นต้องมี div ครอบที่ overflow-auto อีก 
                เพราะ TabsContent ใน FullScreenDisplayModal จะจัดการ scroll ให้แล้ว
                และ DisplayTable เองก็มี root div ที่ overflow-auto อยู่แล้ว 
                (แต่ถ้า DisplayTable ไม่ได้ h-full มันจะสูงตามเนื้อหา แล้ว TabsContent จะ scroll)
                เพื่อให้ DisplayTable scroll ภายในตัวเองเมื่อ TabsContent ให้พื้นที่จำกัด, DisplayTable ควร h-full
            */}
            <div className="flex-1 overflow-hidden"> {/* ให้ DisplayTable ขยายเต็มพื้นที่ที่เหลือ และถ้า DisplayTable มี overflow ของตัวเอง มันจะ scroll */}
                 <DisplayTable
                    data={data}
                    viewMode={viewMode}
                    showCsv={showCsv}
                    formatNumber={formatNumber}
                    caption={caption}
                    className="h-full" // <<<< เพิ่ม h-full ให้ DisplayTable ใช้พื้นที่เต็มที่ที่ ModalTableView จัดให้
                />
            </div>
        </div>
    );
};

export default ModalTableView;