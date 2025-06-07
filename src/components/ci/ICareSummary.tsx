// src/components/ci/ICareSummary.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, HeartPulse, BrainCircuit, ShieldCheck, Bone, Star } from 'lucide-react'; // ตัวอย่าง Icon
import { formatNumber } from '@/components/ci/utils/helpers';

// รับ props เข้ามา 2 ตัวคือ ทุนประกันที่เลือก และอายุของผู้เอาประกัน
interface ICareSummaryProps {
    sumAssured: number;
    age: number;
}

const ListItem = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
        <span>{children}</span>
    </li>
);

export default function ICareSummary({ sumAssured, age }: ICareSummaryProps) {
    // ไม่แสดงผลถ้าทุนประกันเป็น 0
    if (sumAssured === 0) return null;

    const maxCoverage = sumAssured * 5;
    const isChild = age >= 0 && age <= 18;

    return (
        <Card className="w-full border-2 border-blue-200 shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-blue-800">สรุปความคุ้มครอง iCare</CardTitle>
                <CardDescription>ทุนประกันที่คุณเลือก: {formatNumber(sumAssured)} บาท</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-lg font-bold text-blue-700">
                        รับความคุ้มครองโรคร้ายแรงสูงสุด <span className="text-3xl">{formatNumber(maxCoverage)}</span> บาท
                    </p>
                </div>
                
                <ul className="space-y-3 text-base">
                    <ListItem>
                        {/* ส่วนข้อความเดิม */}
                        คุ้มครองโรคร้ายแรง **5 กลุ่มโรค** (มะเร็ง, หัวใจ, สมอง, อวัยวะสำคัญ, และอื่นๆ) ครอบคลุมทั้งหมด **90 โรค**

                        {/* 👇 เพิ่มโค้ดส่วนนี้เข้าไปข้างใน ListItem */}
                        <ul className="pl-6 mt-3 space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-red-500" /> กลุ่มโรคมะเร็งและเนื้องอก</li>
                            <li className="flex items-center gap-2"><HeartPulse size={16} className="text-rose-500" /> กลุ่มโรคหัวใจและหลอดเลือด</li>
                            <li className="flex items-center gap-2"><BrainCircuit size={16} className="text-blue-500" /> กลุ่มโรคเกี่ยวกับสมองและระบบประสาท</li>
                            <li className="flex items-center gap-2"><Bone size={16} className="text-indigo-500" /> กลุ่มโรคเกี่ยวกับอวัยวะและระบบที่สำคัญ</li>
                            <li className="flex items-center gap-2"><Star size={16} className="text-gray-500" /> กลุ่มโรคร้ายแรงอื่นๆ</li>
                        </ul>
                    </ListItem>
                    
                    <ListItem>
                        แต่ละกลุ่มโรคเคลมได้สูงสุด <span className="font-semibold">{formatNumber(sumAssured)}</span> บาท โดยจ่ายตามระยะของโรค:
                        <ul className="list-disc pl-8 mt-2 space-y-1">
                            <li>ระยะเริ่มต้น: จ่าย <span className="font-semibold">25%</span> ({formatNumber(sumAssured * 0.25)} บาท)</li>
                            <li>ระยะปานกลาง: จ่าย <span className="font-semibold">50%</span> ({formatNumber(sumAssured * 0.50)} บาท)</li>
                            <li>ระยะรุนแรง: จ่าย <span className="font-semibold">100%</span> ({formatNumber(sumAssured)} บาท)</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <span className="font-bold text-green-600">ยกเว้นการชำระเบี้ย!</span> เมื่อตรวจพบโรคร้ายแรงระยะรุนแรงครั้งแรก แต่ยังคงได้รับความคุ้มครองในอีก 4 กลุ่มโรคที่เหลือต่อเนื่อง
                    </ListItem>
                    {isChild && (
                            <ListItem>
                                <span className="font-bold text-pink-500">พิเศษสำหรับเด็ก!</span> เพิ่มความคุ้มครอง <span className="font-semibold">กลุ่มโรคในเด็กอีก 10 โรค</span>
                            </ListItem>
                    )}
                        <ListItem>
                        กรณีเสียชีวิต รับเงิน <span className="font-semibold">100,000</span> บาท
                    </ListItem>
                </ul>
            </CardContent>
        </Card>
    );
}