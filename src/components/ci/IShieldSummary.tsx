// src/components/ci/IShieldSummary.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from 'lucide-react';
import { formatNumber } from '@/components/ci/utils/helpers';

interface IShieldSummaryProps {
    sumAssured: number;
}

const ListItem = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
        <span>{children}</span>
    </li>
);

export default function IShieldSummary({ sumAssured }: IShieldSummaryProps) {
    if (sumAssured === 0) return null;

    return (
        <Card className="w-full border-2 border-purple-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-2xl text-purple-800">สรุปความคุ้มครอง iShield</CardTitle>
                <CardDescription>ทุนประกันที่คุณเลือก: {formatNumber(sumAssured)} บาท</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ul className="space-y-3 text-base">
                    <ListItem>
                        คุ้มครอง **70 โรคร้ายแรง** แบ่งการจ่ายเป็น 2 ระยะ:
                        <ul className="list-disc pl-8 mt-2 space-y-1">
                            <li>ระยะเริ่มต้น: จ่าย <span className="font-semibold">25%</span> ของทุนประกัน ({formatNumber(sumAssured * 0.25)} บาท)</li>
                            <li>ระยะรุนแรง: จ่าย <span className="font-semibold">100%</span> ของทุนประกัน ({formatNumber(sumAssured)} บาท)</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        กรณีเสียชีวิต: รับเงินเท่าทุนประกัน <span className="font-semibold">{formatNumber(sumAssured)}</span> บาท
                    </ListItem>
                    <ListItem>
                        กรณีอยู่ครบสัญญา: รับเงินคืนเท่าทุนประกัน <span className="font-semibold">{formatNumber(sumAssured)}</span> บาท
                    </ListItem>
                </ul>
            </CardContent>
        </Card>
    );
}