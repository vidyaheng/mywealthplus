// src/pages/iwealthy/IWealthyTablePage.tsx

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate สำหรับ redirect
import { useAppOutletContext } from '../../App'; // ปรับ path ตามตำแหน่งไฟล์ App.tsx
import { AnnualCalculationOutputRow } from '../../lib/calculations'; // ปรับ path ตามตำแหน่ง calculations.ts

// Import Components ตาราง และ Button, และ ToggleGroup (ถ้าใช้)

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // <<< Import ToggleGroup
import { ZoomIn, Plus, Minus } from 'lucide-react'; // <<< Import Icons

// <<< Import Components ที่เราสร้างขึ้น >>>
import DisplayTable, { AnnualTableView } from '@/components/DisplayTable'; 
import FullScreenDisplayModal from '@/components/custom/FullScreenDisplayModal'; 


// Import Dialog Components
{/*import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription, // อาจใช้หรือไม่ใช้ก็ได้
    DialogFooter,
} from "@/components/ui/dialog";

// Import Tabs Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";*/}



// Import Components ตารางจาก Shadcn/ui (หรือ Library ที่คุณใช้)
//import {
//    Table,
//    TableBody,
//    TableCaption,
//    TableCell,
//    TableHead,
//    TableHeader,
//    TableRow,
//} from "@/components/ui/table"; // ปรับ path ตามต้องการ

//type AnnualTableView = 'compact' | 'full';

export default function IWealthyTablePage() {
    //const { illustrationData } = useAppOutletContext();
    // ดึงค่าจาก Context ที่ IWealthyTablePage ต้องการ
    const {
        illustrationData,
        age, // << สมมติว่าดึงมาจาก Context ได้
        gender, // << สมมติว่าดึงมาจาก Context ได้
        sumInsured, // << สมมติว่าดึงมาจาก Context ได้
        // ... อาจจะมีค่าอื่นๆ จาก context ที่หน้านี้ใช้
    } = useAppOutletContext();

    const navigate = useNavigate();
    const [showCsv, setShowCsv] = useState(false); // <<< เตรียมไว้สำหรับปุ่ม +/- CSV

    // <<< เพิ่ม State สำหรับ View Mode >>>
    const [viewMode, setViewMode] = useState<AnnualTableView>('compact'); // เริ่มต้นที่ 'compact'

    const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false); // state สำหรับ เต็มจอ 


    // <<< state สำหรับ เปิดปิด modal เต็มจอ
    const handleOpenFullScreenModal = () => setIsFullScreenModalOpen(true);
    const handleCloseFullScreenModal = () => setIsFullScreenModalOpen(false); 

    // <<< ADDED/MODIFIED: กรองข้อมูลก่อนแสดงผลโดยใช้ useMemo >>>
    const filteredAnnualData: AnnualCalculationOutputRow[] = useMemo(() => {
        // ถ้าไม่มีข้อมูล หรือไม่มีข้อมูลรายปี ให้คืนค่า Array ว่าง
        if (!illustrationData?.annual || illustrationData.annual.length === 0) {
            return [];
        }

        const originalAnnualData = illustrationData.annual;

        // หา Index สุดท้ายที่ eoyAccountValue > 0 (อาจจะใช้ > 0.005 เพื่อเผื่อค่าเล็กน้อยมาก)
        let lastPositiveIndex = -1;
        for (let i = originalAnnualData.length - 1; i >= 0; i--) {
            if (originalAnnualData[i].eoyAccountValue > 0.005) { // หรือจะใช้ > 0 ตรงๆ ก็ได้
                lastPositiveIndex = i;
                break; // เจอแล้ว หยุดหา
            }
        }

        // ถ้าไม่เจอแถวที่มีค่าเลย (ทุกแถวเป็น 0 หรือติดลบ)
        if (lastPositiveIndex === -1) {
            // อาจจะเลือกแสดงเฉพาะปีแรก หรือไม่แสดงเลย
            // return originalAnnualData.slice(0, 1); // แสดงปีแรก
            return []; // ไม่แสดงเลย
        }

        // คืนค่า Array ตั้งแต่แถวแรก จนถึงแถวสุดท้ายที่เจอ
        return originalAnnualData.slice(0, lastPositiveIndex + 1);

    }, [illustrationData]); // คำนวณใหม่เมื่อ illustrationData เปลี่ยน

    // 2. จัดการกรณีไม่มีข้อมูล (อาจจะยังคำนวณไม่เสร็จ หรือเข้าหน้านี้โดยตรง)
    useEffect(() => {
        if (!illustrationData) {
            console.log("No illustration data found, redirecting to form.");
            // ถ้าไม่มีข้อมูล ให้ Redirect กลับไปหน้าฟอร์ม
            // navigate('/iwealthy/form', { replace: true });
            // หมายเหตุ: การ redirect ทันทีอาจทำให้ผู้ใช้สับสน อาจจะแค่แสดงข้อความว่า "กรุณากดคำนวณก่อน"
        }
    }, [illustrationData, navigate]);

    

    // ถ้าไม่มีข้อมูล แสดงข้อความ หรือ Loading...
    // --- ส่วนจัดการ Loading / No Data (ปรับปรุงเล็กน้อย) ---
    if (!illustrationData) {
        return (
            <div className="p-4 text-center text-gray-600">
                กรุณากลับไปหน้ากรอกข้อมูลและกด "คำนวณ" เพื่อดูผลประโยชน์
            </div>
        );
    }
    // เช็คข้อมูล *หลังจาก* กรองแล้ว
    if (filteredAnnualData.length === 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                ไม่มีข้อมูลผลประโยชน์ที่มูลค่ากรมธรรม์มากกว่า 0 ให้แสดง
                {/* หรืออาจจะแสดงตารางปีแรกถ้าต้องการ */}
            </div>
        );
    }
    // --------------------------------------------------

    // --- Handler เปลี่ยน View Mode ---
    const handleViewModeChange = (value: AnnualTableView) => {
        if (value) { // Ensure a value is selected
            setViewMode(value);
        }
    };

    // 3. เตรียมข้อมูลสำหรับแสดงผล (เฉพาะข้อมูลรายปี)
    //const annualData: AnnualCalculationOutputRow[] = illustrationData.annual;

        const toggleShowCsv = () => {
        setShowCsv(prevShowCsv => !prevShowCsv);
    };

    // Function สำหรับ Format ตัวเลข (ใส่ comma)
    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return '0'; // หรือ '-'
        // ใช้ toFixed(0) เพื่อไม่เอาทศนิยม หรือ toFixed(2) ถ้าต้องการทศนิยม 2 ตำแหน่ง
        return Math.round(num).toLocaleString('en-US'); // ปัดเศษเป็นจำนวนเต็มก่อนใส่ comma
    };

    const currentProductName = "iWealthy"; // << กำหนด productName ชั่วคราว หรือรอรับจาก Context ในอนาคต

    // 4. Render ตาราง (แบบย่อ - Compact View เบื้องต้น)
    return (
        <div className="p-4 md:p-6 space-y-4">
            <h2 className="text-xl font-semibold text-center text-blue-800 mb-4">
                ตารางสรุปผลประโยชน์ ({viewMode === 'compact' ? 'รายปี (แบบย่อ)' : 'รายปี (แบบเต็ม)'})
            </h2>

            {/* === ADDED: ส่วนควบคุมตาราง และ Modal === */}
            <div className="flex justify-between items-center mb-3">
                {/* ปุ่มเลือกมุมมอง (ซ้าย) */}
                <ToggleGroup
                    type="single"
                    size="sm"
                    value={viewMode}
                    onValueChange={handleViewModeChange}
                    className="border border-gray-300 rounded overflow-hidden w-fit h-8 bg-white"
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

                {/* ปุ่มควบคุมอื่นๆ (ขวา) */}
                <div className="flex items-center space-x-2">
                    {/* ปุ่ม +/- CSV */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCsv(prev => !prev)}
                        className="h-8 px-2"
                        title={showCsv ? "ซ่อนมูลค่าเวนคืน" : "แสดงมูลค่าเวนคืน"}
                    >
                        {showCsv ? <Minus size={16} /> : <Plus size={16} />}
                        <span className="ml-1 text-xs hidden sm:inline">เวนคืน</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        title="แสดงแบบเต็มหน้าจอ"
                        onClick={handleOpenFullScreenModal}
                    >
                        <ZoomIn size={16} />
                    </Button>
                    {/* TODO: เพิ่มปุ่ม "ดูรายละเอียดรายเดือน" */}
                </div>
            </div>
            {/* === จบ ส่วนควบคุมตาราง === */}


            {/* === ใช้ DisplayTable Component สำหรับตารางหลัก === */}
            <DisplayTable
                data={filteredAnnualData}
                viewMode={viewMode}
                showCsv={showCsv}
                formatNumber={formatNumber}
                caption="ตารางสรุปผลประโยชน์โดยประมาณ (ในหน้าหลัก)"
            />

            {/* === เรียกใช้ FullScreenDisplayModal Component === */}
            {illustrationData && filteredAnnualData.length > 0 && ( // ควรแสดง Modal ต่อเมื่อมีข้อมูลจริงๆ
                 <FullScreenDisplayModal
                    isOpen={isFullScreenModalOpen}
                    onClose={handleCloseFullScreenModal}
                    defaultActiveTab="table"
                    modalTitle={`ตารางและกราฟผลประโยชน์ (${currentProductName})`} // ตัวอย่างการใส่ชื่อ Product
                    headerInfo={ // ตัวอย่างการใส่ headerInfo
                        (typeof age === 'number' && gender && typeof sumInsured === 'number') ? (
                            <div className="text-xs">
                                <p>ผู้เอาประกัน: ร่ำรวย มั่นคง</p>
                                <p>อายุ: {age} | เพศ: {gender === 'male' ? 'ชาย' : 'หญิง'}</p>
                                <p>ทุนประกันภัยหลัก: {formatNumber(sumInsured)} บาท</p>
                            </div>
                        ) : (
                            <div className="text-xs">
                                <p>ผู้เอาประกัน: ร่ำรวย มั่นคง</p>
                                <p>(กำลังโหลดข้อมูลสรุปผู้เอาประกัน...)</p>
                            </div>
                        )
                    }
                    tableContent={
                        <DisplayTable
                            data={filteredAnnualData}
                            viewMode={viewMode}
                            showCsv={showCsv}
                            formatNumber={formatNumber}
                            caption="ข้อมูลผลประโยชน์รายปี" // Caption สำหรับตารางใน Modal
                        />
                    }
                    chartContent={
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-md p-4">
                            <p className="text-slate-500">ส่วนแสดงกราฟ (Full Screen) - จะถูกแทนที่ด้วย Component กราฟจริง</p>
                        </div>
                    }
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange} // ส่ง handler ที่มีอยู่ไป
                    showCsv={showCsv}
                    onShowCsvToggle={toggleShowCsv} // ส่ง handler ที่มีอยู่ไป
                />
            )}
        </div>
    );
}