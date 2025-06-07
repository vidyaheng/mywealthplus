// src/components/ci/DCISummary.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from 'lucide-react';
import { formatNumber } from '@/components/ci/utils/helpers';

interface DCISummaryProps {
    sumAssured: number;
}

const ListItem = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
        <span>{children}</span>
    </li>
);

export default function DCISummary({ sumAssured }: DCISummaryProps) {
    if (sumAssured === 0) return null;

    return (
        <Card className="w-full border-2 border-teal-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-2xl text-teal-800">สรุปความคุ้มครอง DCI</CardTitle>
                <CardDescription>ทุนประกันที่คุณเลือก: {formatNumber(sumAssured)} บาท</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="font-semibold">รับความคุ้มครองเต็มทุนประกัน ({formatNumber(sumAssured)} บาท) ในกรณีต่อไปนี้:</p>
                <ul className="space-y-3 text-base">
                    <ListItem>
                        ตรวจพบ **31 โรคร้ายแรง** ระยะรุนแรง
                    </ListItem>
                    <ListItem>
                        กรณี **ทุพพลภาพสิ้นเชิงถาวร**
                    </ListItem>
                    <ListItem>
                        กรณี **เสียชีวิต**
                    </ListItem>
                </ul>
            </CardContent>
        </Card>
    );
}