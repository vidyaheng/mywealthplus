// src/components/custom/FullScreenDisplayModal.tsx

import { ReactNode } from 'react';
//import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    //DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
//import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
//import { Plus, Minus } from 'lucide-react';
//import { AnnualTableView } from "@/components/DisplayTable"; // << ตรวจสอบ Path ให้ถูกต้อง
//import { VisuallyHidden } from '@radix-ui/react-visually-hidden'; // <<< ตรวจสอบว่า Import ถูกต้อง

interface FullScreenDisplayModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultActiveTab?: 'table' | 'graph';
    modalTitle?: string;
    headerInfo?: ReactNode;
    tableTabContent: ReactNode;  
    graphTabContent: ReactNode;
    
    //tableContent: ReactNode;
    //chartContent: ReactNode;
    //viewMode: AnnualTableView; // สำหรับ default controls
    //onViewModeChange: (value: AnnualTableView) => void; // สำหรับ default controls
    //showCsv: boolean; // สำหรับ default controls
    //onShowCsvToggle: () => void; // สำหรับ default controls
    //showDefaultHeaderAndControls?: boolean;
}

export default function FullScreenDisplayModal({
    isOpen,
    onClose,
    defaultActiveTab = 'table',
    modalTitle = "แสดงผลเต็มหน้าจอ",
    headerInfo,
    tableTabContent,
    graphTabContent,
    //tableContent,
    //chartContent,
    //viewMode,
    //onViewModeChange,
    //showCsv,
    //onShowCsvToggle,
    //showDefaultHeaderAndControls = true,
}: FullScreenDisplayModalProps) {
    {/*}
    const handleViewModeToggle = (value: AnnualTableView) => {
        if (value) {
            onViewModeChange(value);
        }
    }; */}

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] max-h-[100vh] md:max-h-[100vh] flex flex-col p-1 sm:p-2 overflow-hidden"> {/*overflow-hidden*/}
                {/* Accessible Title: ใส่ Title เสมอเพื่อ Accessibility */}
                {/* ถ้าไม่แสดง Header ของ Modal เอง ให้ซ่อน Title นี้ด้วย VisuallyHidden */}
                {/*}
                {!showDefaultHeaderAndControls && (
                    <VisuallyHidden asChild>
                        <DialogTitle>{modalTitle || "รายละเอียดผลประโยชน์"}</DialogTitle>
                    </VisuallyHidden>
                )} */}

                {/* ส่วน Header และ Controls ของ Modal (ถ้าแสดง) */}
                {/*}
                {showDefaultHeaderAndControls && (
                    <> */}
                        {/*<DialogHeader className="flex-shrink-0 pb-1">
                            <DialogTitle>{modalTitle}</DialogTitle>
                            {headerInfo && (
                                <DialogDescription asChild>
                                    <div className="mt-1 p-1 bg-slate-50 rounded text-xs border border-slate-200">
                                        {headerInfo}
                                    </div>
                                </DialogDescription>
                            )}
                        </DialogHeader>*/}
                        {/*
                        <div className="flex flex-wrap justify-start items-center gap-1 my-1 flex-shrink-0 px-1">
                            <ToggleGroup
                                type="single"
                                size="sm"
                                value={viewMode}
                                onValueChange={handleViewModeToggle}
                                className="border border-gray-300 rounded w-fit h-8 bg-white" //overflow-hidden
                            >
                                <ToggleGroupItem
                                    value="compact"
                                    aria-label="Compact View"
                                    className={`px-3 py-1 text-xs data-[state=on]:bg-blue-600 data-[state=on]:text-white focus:z-10 focus:outline-none ${viewMode === 'compact' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    มุมมองแบบย่อ
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="full"
                                    aria-label="Full View"
                                    className={`px-3 py-1 text-xs data-[state=on]:bg-blue-600 data-[state=on]:text-white border-l border-gray-300 focus:z-10 focus:outline-none ${viewMode === 'full' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    มุมมองแบบเต็ม
                                </ToggleGroupItem>
                            </ToggleGroup>

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
                        </div>
                    </>
                )}
                */}

                {/* Tabs Container - This div should allow Tabs to grow and manage its own height */}
                <div className="flex flex-col flex-grow h-full overflow-hidden"> {/* overflow-hidden is key here overflow-hidden*/}
                    <Tabs defaultValue={defaultActiveTab} className="w-full h-full flex flex-col overflow-hidden">
                        <TabsList className="h-7 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground inline-flex self-start flex-shrink-0">
                            <TabsTrigger value="table">ตาราง</TabsTrigger>
                            <TabsTrigger value="graph">กราฟ</TabsTrigger>
                        </TabsList>

                        {/* Table Content - This will scroll if its content (tableContent) is taller */}
                        {/*<div className="flex-grow min-h-0 overflow-hidden mt-2"></div> */}
                        <TabsContent value="table" className="mt-1 flex-1 min-h-0 overflow-auto">
                            {/*<div className="h-full overflow-auto">*/}
                                <DialogHeader className="flex-shrink-0 pb-1">
                            <DialogTitle>{modalTitle}</DialogTitle>
                                {headerInfo && (
                                    <DialogDescription asChild>
                                        <div className="mt-1 p-1 bg-slate-50 rounded text-xs border border-slate-200">
                                            {headerInfo}
                                        </div>
                                    </DialogDescription>
                                )}
                            </DialogHeader>
                                {tableTabContent}
                            {/*</div>*/}
                        </TabsContent>

                        {/* Chart Content - This will scroll if its content (chartContent) is taller */}
                        <TabsContent value="graph" className="mt-1 flex-1 min-h-0 overflow-auto">
                            <div className="h-full w-full">
                                {graphTabContent}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                {/*
                <DialogFooter className="mt-1 pt-2 border-t border-slate-200 flex-shrink-0">
                    <Button type="button" variant="outline" onClick={onClose}>
                        ปิด
                    </Button>
                </DialogFooter>*/}
            </DialogContent>
        </Dialog>
    );
}
