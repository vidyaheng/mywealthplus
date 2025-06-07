// src/components/ci/RokRaiSoShieldSummary.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from 'lucide-react';
import type { RokraiPlan } from "@/components/ci/types/useCiTypes";

// --- Props Interface ---
interface RokRaiSoShieldSummaryProps {
    plan: RokraiPlan | '' | null;
    age: number;
}

// --- Data for each plan ---
// การเก็บข้อมูลแบบนี้จะทำให้โค้ดส่วนแสดงผล (JSX) สะอาดและจัดการง่ายมาก
const planDetails = {
    S: {
        name: "แผน S",
        limitYear: "5 แสนบาท",
        limitLifetime: "1.5 ล้านบาท",
        room: "2,000 บาท / วัน",
        icu: "6,000 บาท / วัน",
        rehab: "-",
        tele: "-",
        psychiatric: "-",
        recovery: "-",
    },
    M: {
        name: "แผน M",
        limitYear: "1 ล้านบาท",
        limitLifetime: "3 ล้านบาท",
        room: "3,000 บาท / วัน",
        icu: "9,000 บาท / วัน",
        rehab: "1,500 บาท / ครั้ง (สูงสุด 12 ครั้ง/ปี)",
        tele: "1,500 บาท / ครั้ง (สูงสุด 2 ครั้ง/ปี)",
        psychiatric: "30,000 บาท / รอบปี",
        recovery: "30,000 บาท",
    },
    L: {
        name: "แผน L",
        limitYear: "3 ล้านบาท",
        limitLifetime: "9 ล้านบาท",
        room: "5,000 บาท / วัน",
        icu: "15,000 บาท / วัน",
        rehab: "2,500 บาท / ครั้ง (สูงสุด 12 ครั้ง/ปี)",
        tele: "2,500 บาท / ครั้ง (สูงสุด 2 ครั้ง/ปี)",
        psychiatric: "50,000 บาท / รอบปี",
        recovery: "50,000 บาท",
    },
    XL: {
        name: "แผน XL",
        limitYear: "10 ล้านบาท",
        limitLifetime: "30 ล้านบาท",
        room: "10,000 บาท / วัน",
        icu: "30,000 บาท / วัน",
        rehab: "เหมาจ่ายตามจริง (สูงสุด 12 ครั้ง/ปี)",
        tele: "เหมาจ่ายตามจริง (สูงสุด 12 ครั้ง/ปี)",
        psychiatric: "100,000 บาท / รอบปี",
        recovery: "100,000 บาท",
    }
};

const ListItem = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
        <span>{children}</span>
    </li>
);


export default function RokRaiSoShieldSummary({ plan, age }: RokRaiSoShieldSummaryProps) {
    // 1. ถ้ายังไม่ได้เลือกแผน ให้ return null (ไม่แสดงผล)
    if (!plan) return null;

    // 2. ดึงข้อมูลของแผนที่เลือกจาก object planDetails
    const benefits = planDetails[plan];

    // 3. ป้องกันกรณีที่ plan ที่ส่งมาไม่มีใน object ของเรา
    if (!benefits) {
        return <p>ไม่พบข้อมูลสำหรับแผน {plan}</p>;
    }

    const isChild = age >= 1 && age <= 10;

    return (
        <Card className="w-full border-2 border-green-200 shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-green-800">สรุปความคุ้มครอง RokRaiSoShield ({benefits.name})</CardTitle>
                <CardDescription>สัญญาเพิ่มเติมค่ารักษาพยาบาลโรคร้ายแรง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ul className="space-y-2 text-base mb-6">
                    <ListItem>คุ้มครองค่ารักษาพยาบาล **10 โรคร้ายแรง** ใน 4 กลุ่มหลัก (มะเร็ง, สมอง, หัวใจ, อวัยวะสำคัญ)</ListItem>
                    {isChild && (
                        <ListItem>
                           <span className="font-bold text-pink-500">พิเศษสำหรับเด็ก (อายุ 1-10 ปี)!</span> คุ้มครองเพิ่มกลุ่มโรคร้ายในเด็กอีก **4 โรค**
                        </ListItem>
                    )}
                </ul>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">ความคุ้มครอง</TableHead>
                            <TableHead className="text-right">ผลประโยชน์</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-semibold">วงเงินสูงสุดต่อรอบปีกรมธรรม์</TableCell>
                            <TableCell className="text-right font-bold text-lg text-green-700">{benefits.limitYear}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-semibold">วงเงินสูงสุดตลอดอายุสัญญา</TableCell>
                            <TableCell className="text-right">{benefits.limitLifetime}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-semibold">ค่ารักษาพยาบาลสำหรับโรคร้าย</TableCell>
                            <TableCell className="text-right font-bold text-lg text-red-500">เหมาจ่ายตามจริง</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>ค่าห้องและค่าอาหาร</TableCell>
                            <TableCell className="text-right">{benefits.room}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>ค่าห้องผู้ป่วยหนัก (ICU)</TableCell>
                            <TableCell className="text-right">{benefits.icu}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>ค่าเวชศาสตร์ฟื้นฟู</TableCell>
                            <TableCell className="text-right">{benefits.rehab}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>ค่าบริการ Telemedicine (OPD)</TableCell>
                            <TableCell className="text-right">{benefits.tele}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>ค่ารักษาทางจิตเวช</TableCell>
                            <TableCell className="text-right">{benefits.psychiatric}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>ค่าฟื้นฟูร่างกายหลังออกจากโรงพยาบาล</TableCell>
                            <TableCell className="text-right">{benefits.recovery}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

            </CardContent>
        </Card>
    );
}