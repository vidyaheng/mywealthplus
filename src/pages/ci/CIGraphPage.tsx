// src/components/ci/CIGraphPage.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { AnnualCiOutputRow } from '@/components/ci/types/useCiTypes'; // ปรับ Path

interface CIGraphPageProps {
    resultData: AnnualCiOutputRow[];
}

export default function CIGraphPage({ resultData }: CIGraphPageProps) {

    // 1. แปลงข้อมูล (ตัวอย่าง: กราฟแสดงมูลค่าบัญชี iWealthy เทียบกับอายุ)
    const chartData = resultData.map(row => ({
        age: row.age,
        "มูลค่าบัญชี iWealthy": row.iWealthyEoyAccountValue,
        "เบี้ย CI ที่จ่าย": row.totalCiPackagePremiumPaid,
    }));

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>กราฟแสดงมูลค่าบัญชี iWealthy เทียบกับอายุ</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="age" label={{ value: 'อายุ (ปี)', position: 'insideBottom', offset: -5 }}/>
                            <YAxis width={80} tickFormatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                            <Tooltip formatter={(value: number) => value.toLocaleString()} />
                            <Legend />
                            <Bar dataKey="มูลค่าบัญชี iWealthy" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}