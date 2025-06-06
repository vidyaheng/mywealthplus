import { useCiPlanner } from './hooks/useCiPlanner'; // ปรับ Path ให้ถูกต้อง
import { FaVenusMars, FaBirthdayCake, FaFileAlt  } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import type {
    //Gender,
    CiPlanSelections,
    IShieldPlan,
    LifeReadyPlan,
    RokRaiSoShieldPlan,
    IWealthyMode,
    //PolicyOriginMode,
    //AnnualCiOutputRow,
    //AnnualCiPremiumDetail,
} from './types/useCiTypes'; // ปรับ Path ให้ถูกต้อง

// --- ShadCN/ui Components (ตัวอย่างการ Import - ตรวจสอบ Path และ Components ที่คุณติดตั้ง) ---
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, /*CardFooter*/ } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
//import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // สำหรับ Toggle Switch
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // สำหรับสลับโหมด iWealthy Manual/Auto
import {
    Table, TableBody, TableCell, /*TableCaption*/ TableHead, TableHeader, TableRow, /*TableFooter*/
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator"; // คล้าย <hr/> หรือ divider

// --- Plan Options ---
const ICarePlansData = [
    { label: "5 แสน", value: 500000 },
    { label: "1 ล้าน", value: 1000000 },
    { label: "1.5 ล้าน", value: 1500000 },
    { label: "2 ล้าน", value: 2000000 },
    { label: "2.5 ล้าน", value: 2500000 },
    { label: "3 ล้าน", value: 3000000 },
    { label: "4 ล้าน", value: 4000000 },
    { label: "5 ล้าน", value: 5000000 },
];

const IShieldPlanOptionsData: { label: string; value: IShieldPlan }[] = [
    { label: "iShield (จ่ายเบี้ย 5 ปี)", value: "05" },
    { label: "iShield (จ่ายเบี้ย 10 ปี)", value: "10" },
    { label: "iShield (จ่ายเบี้ย 15 ปี)", value: "15" },
    { label: "iShield (จ่ายเบี้ย 20 ปี)", value: "20" },
];

const LifeReadyPlanOptionsData: { label: string; value: LifeReadyPlan }[] = [
    { label: "ชำระเบี้ย 6 ปี", value: 6 },
    { label: "ชำระเบี้ย 12 ปี", value: 12 },
    { label: "ชำระเบี้ย 18 ปี", value: 18 },
    { label: "ชำระเบี้ยถึงอายุ 99 ปี", value: 99 },
];

const RokRaiSoShieldPlanOptionsData: { label: string; value: RokRaiSoShieldPlan }[] = [
    { label: "แผน S", value: "S" },
    { label: "แผน M", value: "M" },
    { label: "แผน L", value: "L" },
    { label: "แผน XL", value: "XL" },
];

// สร้าง Array ตัวเลือกอายุสำหรับ Dropdown (ตัวอย่าง: อายุ 18 ถึง 70 ปี)
// คุณสามารถปรับช่วงอายุนี้ได้ตามความเหมาะสมของผลิตภัณฑ์
const ageOptionsData = Array.from({ length: (70 - 18 + 1) }, (_, i) => 18 + i);

const formatNumber = (num?: number): string => {
    if (num === undefined || num === null || isNaN(num)) return "-";
    return num.toLocaleString();
};

// Icon ตัวอย่าง (คุณสามารถใช้ SVG หรือ Library Icon ที่คุณมี)
const CalculatorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9S16.97 3 12 3z" />
    </svg>
);
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ErrorIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);


export default function CIFormPage() {
    const {
        policyholderEntryAge, setPolicyholderEntryAge,
        policyholderGender, setPolicyholderGender,
        policyOriginMode, setPolicyOriginMode,
        existingPolicyEntryAge, setExistingPolicyEntryAge,
        selectedCiPlans, setSelectedCiPlans,
        useIWealthy, setUseIWealthy,
        iWealthyMode, setIWealthyMode,
        iWealthyInvestmentReturn, setIWealthyInvestmentReturn,
        iWealthyOwnPPT, setIWealthyOwnPPT,
        iWealthyWithdrawalStartAge, setIWealthyWithdrawalStartAge,
        manualRpp, setManualRpp,
        manualRtu, setManualRtu,
        autoRppRtuRatio, setAutoRppRtuRatio,
        isLoading, error, result, ciPremiumsSchedule,
        calculatedMinPremium, calculatedRpp, calculatedRtu,
        runCalculation,
    } = useCiPlanner({
        initialPolicyholderEntryAge: 30,
        initialPolicyholderGender: 'male',
        initialUseIWealthy: false,
        initialPolicyOriginMode: 'newPolicy',
    });

    const handleCiSelectionChange = <K extends keyof CiPlanSelections>(
        key: K, value: CiPlanSelections[K]
    ) => {
        setSelectedCiPlans(prev => {
            const newState = { ...prev, [key]: value };
            if (key === 'mainRiderChecked' && !value) {
                newState.rokraiChecked = false;
                newState.dciChecked = false;
            }
            if (key === 'icareChecked' && !value) newState.icareSA = 0;
            if (key === 'ishieldChecked' && !value) {
                newState.ishieldPlan = null;
                newState.ishieldSA = 0;
            }
            if (key === 'rokraiChecked' && !value) newState.rokraiPlan = null;
            if (key === 'dciChecked' && !value) newState.dciSA = 0;
            return newState;
        });
    };

    const firstYearCiPremium = ciPremiumsSchedule?.[0]?.totalCiPremium;
    let iWealthySummaryText: string | null = null;
    if (useIWealthy) {
        if (iWealthyMode === 'manual' && (manualRpp > 0 || manualRtu > 0)) {
            iWealthySummaryText = `โหมด Manual: RPP ${formatNumber(manualRpp)}, RTU ${formatNumber(manualRtu)}`;
        } else if (iWealthyMode === 'automatic' && calculatedMinPremium !== undefined) {
            iWealthySummaryText = `โหมด Auto (แนะนำ): RPP ${formatNumber(calculatedRpp)}, RTU ${formatNumber(calculatedRtu)} (รวม ${formatNumber(calculatedMinPremium)})`;
        }
    }

    const isCol2Visible = selectedCiPlans.mainRiderChecked;
    const isCol3Visible = useIWealthy;

    const visibleSectionsCount = [true, isCol2Visible, isCol3Visible].filter(Boolean).length;
    const showNumbersOnTitles = visibleSectionsCount > 1;
    let titleOrderNumber = 0;
    const getSectionTitle = (defaultTitle: string) => {
        if (showNumbersOnTitles) {
            titleOrderNumber++;
            return `${titleOrderNumber}. ${defaultTitle}`;
        }
        return defaultTitle;
    };

    let gridColsClass = "lg:grid-cols-1";
    if (visibleSectionsCount === 2) {
        gridColsClass = "lg:grid-cols-2";
    } else if (visibleSectionsCount === 3) {
        gridColsClass = "lg:grid-cols-3";
    }


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-background text-foreground min-h-screen">
            <header className="text-center py-6">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary pb-2">
                    วางแผนประกันโรคร้ายแรง (CI)
                </h1>
                <p className="text-lg text-muted-foreground">พร้อมทางเลือกชำระเบี้ยด้วย iWealthy</p>
            </header>

            {/* Section: ข้อมูลผู้เอาประกัน และประเภทกรมธรรม์ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">ข้อมูลผู้เอาประกันและบริบทกรมธรรม์</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6 items-end">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaBirthdayCake className="text-blue-600 text-sm flex-shrink-0" />
                                <Label htmlFor="policyholderAge" className="text-sm">อายุผู้เอาประกัน (ปี)</Label>
                            </div>
                            <Select
                                value={String(policyholderEntryAge)}
                                onValueChange={(value) => setPolicyholderEntryAge(Number(value))}
                            >
                                <SelectTrigger id="policyholderAge" className="w-full mt-1">
                                    <SelectValue placeholder="เลือกอายุ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>อายุ</SelectLabel>
                                        {ageOptionsData.map(age => (
                                            <SelectItem key={age} value={String(age)}>{age}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[150px]">
                            {/* Label พร้อมไอคอน */}
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaVenusMars className="text-blue-600 text-sm flex-shrink-0" />
                                <label className="text-sm font-medium text-gray-700">เพศ</label>
                            </div>

                            {/* ตัวเลือก Radio Buttons */}
                            <div className="flex gap-x-6 items-center h-9">
                                {/* === ตัวเลือก: ชาย === */}
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        className="form-radio accent-blue-600 w-4 h-4"
                                        name="policyholderGender" // ใช้ชื่อเดียวกันเพื่อให้เป็นกลุ่มเดียวกัน
                                        value="male"
                                        checked={policyholderGender === 'male'}
                                        onChange={() => setPolicyholderGender('male')}
                                    />
                                    <span className={`ml-2 text-sm ${
                                        policyholderGender === 'male' 
                                        ? 'text-blue-600 font-semibold' 
                                        : 'text-gray-700'
                                    }`}>
                                        ชาย
                                    </span>
                                </label>

                                {/* === ตัวเลือก: หญิง === */}
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        className="form-radio accent-pink-600 w-4 h-4"
                                        name="policyholderGender" // ใช้ชื่อเดียวกันเพื่อให้เป็นกลุ่มเดียวกัน
                                        value="female"
                                        checked={policyholderGender === 'female'}
                                        onChange={() => setPolicyholderGender('female')}
                                    />
                                    <span className={`ml-2 text-sm ${
                                        policyholderGender === 'female' 
                                        ? 'text-pink-600 font-semibold' 
                                        : 'text-gray-700'
                                    }`}>
                                        หญิง
                                    </span>
                                </label>
                            </div>
                        </div>
                        {/* จบส่วนของโค้ดสำหรับเลือกเพศ */}

                        {/* ส่วนของประเภทกรมธรรม์ */}
                         <div>
                            {/* 1. เพิ่มไอคอนข้างๆ Label */}
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaFileAlt className="text-blue-600 text-sm flex-shrink-0" />
                                <Label htmlFor="policyOriginModeSwitch" className="block text-sm font-medium">ประเภทกรมธรรม์</Label>
                            </div>
                            <div className="flex items-center space-x-2 mt-2.5 mb-2"> {/* mt-2.5 ให้ตรงกับ input */}
                                <Switch
                                    id="policyOriginModeSwitch"
                                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                                    checked={policyOriginMode === 'newPolicy'}
                                    onCheckedChange={(isChecked) => {
                                        setPolicyOriginMode(isChecked ? 'newPolicy' : 'existingPolicy');
                                        if (!isChecked) setExistingPolicyEntryAge(undefined);
                                    }}
                                />
                                <Label htmlFor="policyOriginModeSwitch" className="text-sm">
                                    {policyOriginMode === 'existingPolicy' ? 'ใช้สัญญาหลักเดิม (LifeReady)' : 'สร้างแผนใหม่ทั้งหมด'}
                                </Label>
                            </div>
                        </div>
                        {policyOriginMode === 'existingPolicy' && (
                            <div className="sm:col-span-full lg:col-span-1 mt-2 lg:mt-0">
                                <Label htmlFor="existingPolicyEntryAge" className="text-sm">อายุแรกเข้า LifeReady เดิม (ปี)</Label>
                                <Input id="existingPolicyEntryAge" type="number" min={0} max={policyholderEntryAge -1}
                                    value={existingPolicyEntryAge ?? ''}
                                    onChange={(e) => setExistingPolicyEntryAge(e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="กรอกอายุ (ถ้ามี)"
                                    className="mt-1 h-9"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Main Grid for Plan Selections & iWealthy */}
            {(titleOrderNumber = 0) /* Reset titleNumber */}
            <div className={`grid gap-6 grid-cols-1 ${gridColsClass}`}>
                {/* Column 1: วางแผนดูแลโรคร้าย */}
                <Card>
                    <CardHeader><CardTitle className="text-lg">{getSectionTitle("วางแผนดูแลโรคร้าย")}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {/* iCare */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="icareChecked" checked={selectedCiPlans.icareChecked} onCheckedChange={(checked) => handleCiSelectionChange('icareChecked', Boolean(checked))} />
                                <Label htmlFor="icareChecked" className="font-semibold text-md">iCare</Label>
                            </div>
                            {selectedCiPlans.icareChecked && (
                                <div className="pl-7 space-y-2">
                                    <Select value={String(selectedCiPlans.icareSA)} onValueChange={(val) => handleCiSelectionChange('icareSA', Number(val))}>
                                        <SelectTrigger><SelectValue placeholder="-- เลือกทุนประกัน Rider --" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">-- เลือกทุนประกัน Rider --</SelectItem>
                                            {ICarePlansData.map((plan) => (<SelectItem key={plan.value} value={String(plan.value)}>{plan.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">ทุนประกันส่วนหลัก iCare: {formatNumber(100000)} (คุ้มครองถึง 85, ชำระเบี้ยถึง 84)</p>
                                </div>
                            )}
                        </div>
                        <Separator className="my-3"/>
                        {/* iShield */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ishieldChecked" checked={selectedCiPlans.ishieldChecked} onCheckedChange={(checked) => handleCiSelectionChange('ishieldChecked', Boolean(checked))} />
                                <Label htmlFor="ishieldChecked" className="font-semibold text-md">iShield</Label>
                            </div>
                            {selectedCiPlans.ishieldChecked && (
                                <div className="pl-7 space-y-3">
                                    <Select value={selectedCiPlans.ishieldPlan ?? undefined} onValueChange={(val) => handleCiSelectionChange('ishieldPlan', val as IShieldPlan | null)}>
                                        <SelectTrigger><SelectValue placeholder="-- เลือกแผน (ระยะเวลาชำระเบี้ย) --" /></SelectTrigger>
                                        <SelectContent>
                                            {IShieldPlanOptionsData.map((plan) => (<SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    <Input type="number" min={500000} step={100000} value={selectedCiPlans.ishieldSA} onChange={(e) => handleCiSelectionChange('ishieldSA', Number(e.target.value))} placeholder="ทุนประกัน iShield" className="h-9"/>
                                    <p className="text-xs text-muted-foreground">คุ้มครองถึงอายุ 85</p>
                                </div>
                            )}
                        </div>
                        <Separator className="my-3"/>
                        {/* LifeReady + สัญญาเพิ่มเติม (Checkbox) */}
                        <div className="space-y-1">
                             <div className="flex items-center space-x-2">
                                <Checkbox id="mainRiderChecked" checked={selectedCiPlans.mainRiderChecked} onCheckedChange={(checked) => handleCiSelectionChange('mainRiderChecked', Boolean(checked))} />
                                <Label htmlFor="mainRiderChecked" className="font-semibold text-md text-green-700">LifeReady และสัญญาเพิ่มเติมอื่นๆ</Label>
                            </div>
                            <p className="text-xs text-muted-foreground pl-7">เลือกหากต้องการ RokRaiSoShield, DCI หรือสัญญาหลัก LifeReady</p>
                        </div>
                        <Separator className="my-3"/>
                        {/* iWealthy Checkbox */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaWandMagicSparkles className="text-purple-600 text-sm flex-shrink-0" />
                                <Label className="text-sm font-medium text-gray-700">วางแผนด้วย iWealthy</Label>
                            </div>
                            <div className="flex items-center space-x-2 mt-2.5">
                                <Switch
                                    id="iwealthy-mode-toggle"
                                    // 2. ผูก Switch กับ state ที่ได้มาจาก hook
                                    checked={useIWealthy}
                                    onCheckedChange={setUseIWealthy}
                                    className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-300"
                                />
                                <Label htmlFor="iwealthy-mode-toggle" className="text-sm">
                                    {useIWealthy ? 'ใช้ iWealthy' : 'ไม่ใช้ iWealthy'}
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: สัญญาหลักและเลือกสัญญาเพิ่มเติม CI */}
                {isCol2Visible && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">{getSectionTitle("สัญญาหลักและเลือกสัญญาเพิ่มเติม CI")}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-md space-y-3 dark:bg-green-900/20">
                                <p className="font-semibold text-md text-green-800 dark:text-green-300">LifeReady (สัญญาประกันชีวิตหลัก)</p>
                                <div>
                                    <Label className="block text-sm mb-1">ระยะเวลาชำระเบี้ย LifeReady</Label>
                                    <Select value={selectedCiPlans.lifeReadyPlan ? String(selectedCiPlans.lifeReadyPlan) : undefined} onValueChange={(val) => handleCiSelectionChange('lifeReadyPlan', Number(val) as LifeReadyPlan | null)}>
                                        <SelectTrigger><SelectValue placeholder="-- เลือกระยะเวลา --" /></SelectTrigger>
                                        <SelectContent>
                                            {LifeReadyPlanOptionsData.map((plan) => (<SelectItem key={plan.value} value={String(plan.value)}>{plan.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="block text-sm mb-1">ทุนประกัน LifeReady</Label>
                                    <Input type="number" value={selectedCiPlans.lifeReadySA} onChange={(e) => handleCiSelectionChange('lifeReadySA', Number(e.target.value))} placeholder="ทุนประกัน LifeReady" min={150000} step={50000} className="h-9"/>
                                </div>
                            </div>
                            <Separator className="my-3"/>
                            {/* RokRaiSoShield */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="rokraiChecked" checked={selectedCiPlans.rokraiChecked} onCheckedChange={(checked) => handleCiSelectionChange('rokraiChecked', Boolean(checked))} />
                                    <Label htmlFor="rokraiChecked" className="font-medium text-md">RokRaiSoShield</Label>
                                </div>
                                {selectedCiPlans.rokraiChecked && (
                                    <div className="pl-7">
                                        <Select value={selectedCiPlans.rokraiPlan ?? undefined} onValueChange={(val) => handleCiSelectionChange('rokraiPlan', val as RokRaiSoShieldPlan | null)}>
                                            <SelectTrigger><SelectValue placeholder="-- เลือกแผน --" /></SelectTrigger>
                                            <SelectContent>
                                                {RokRaiSoShieldPlanOptionsData.map((plan) => (<SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">คุ้มครองถึง 99, ชำระเบี้ยถึง 98</p>
                                    </div>
                                )}
                            </div>
                            <Separator className="my-3"/>
                            {/* DCI */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="dciChecked" checked={selectedCiPlans.dciChecked} onCheckedChange={(checked) => handleCiSelectionChange('dciChecked', Boolean(checked))} />
                                    <Label htmlFor="dciChecked" className="font-medium text-md">DCI</Label>
                                </div>
                                {selectedCiPlans.dciChecked && (
                                    <div className="pl-7">
                                        <Input type="number" value={selectedCiPlans.dciSA} onChange={(e) => handleCiSelectionChange('dciSA', Number(e.target.value))} placeholder="ทุนประกัน DCI" min={100000} step={50000} className="h-9"/>
                                        <p className="text-xs text-muted-foreground mt-1">คุ้มครองและชำระเบี้ยถึงอายุ 74</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Column 3: iWealthy Configuration */}
                {isCol3Visible && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">{getSectionTitle("ตั้งค่าการชำระเบี้ยด้วย iWealthy")}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs value={iWealthyMode} onValueChange={(value) => setIWealthyMode(value as IWealthyMode)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="automatic">โหมด Auto</TabsTrigger>
                                    <TabsTrigger value="manual">โหมด Manual</TabsTrigger>
                                </TabsList>
                                {/* เนื้อหาของ Tabs อาจจะไม่จำเป็นต้องใส่ TabsContent ถ้า UI ไม่ได้ซับซ้อนมาก */}
                            </Tabs>

                            <div className="space-y-3 mt-4">
                                <div>
                                    <Label className="text-sm mb-1 block">อัตราผลตอบแทนที่คาดหวังจาก iWealthy (%)</Label>
                                    <Input type="number" value={iWealthyInvestmentReturn} onChange={e => setIWealthyInvestmentReturn(Number(e.target.value))} className="h-9"/>
                                </div>
                                <div>
                                    <Label className="text-sm mb-1 block">ระยะเวลาชำระเบี้ย iWealthy (ปี)</Label>
                                    <Input type="number" value={iWealthyOwnPPT} onChange={e => setIWealthyOwnPPT(Number(e.target.value))} className="h-9"/>
                                </div>
                                {iWealthyMode === 'manual' && (
                                <div>
                                     <Label className="text-sm mb-1 block">อายุที่ iWealthy เริ่มถอนจ่ายเบี้ย CI</Label>
                                     <Input type="number" value={iWealthyWithdrawalStartAge} onChange={e => setIWealthyWithdrawalStartAge(Number(e.target.value))} className="h-9"/>
                                </div>
                                )}
                                {iWealthyMode === 'manual' && (
                                    <div className="pt-3 border-t mt-4 space-y-3">
                                        <h3 className="font-semibold text-purple-600 dark:text-purple-400">กำหนดเบี้ย iWealthy (Manual)</h3>
                                        <div>
                                            <Label className="text-sm mb-1 block">เบี้ยหลัก RPP ต่อปี (บาท)</Label>
                                            <Input type="number" value={manualRpp} onChange={e => setManualRpp(Number(e.target.value))} min={18000} step={1000} className="h-9"/>
                                        </div>
                                        <div>
                                            <Label className="text-sm mb-1 block">เบี้ยส่วนออมทรัพย์ RTU ต่อปี (บาท)</Label>
                                            <Input type="number" value={manualRtu} onChange={e => setManualRtu(Number(e.target.value))} min={0} step={1000} className="h-9"/>
                                        </div>
                                    </div>
                                )}
                                {iWealthyMode === 'automatic' && (
                                     <div className="pt-3 border-t mt-4 space-y-3">
                                        <h3 className="font-semibold text-purple-600 dark:text-purple-400">กำหนดสัดส่วน (Auto)</h3>
                                        <div>
                                            <Label className="text-sm mb-1 block">สัดส่วน RPP : RTU</Label>
                                            <Select value={autoRppRtuRatio} onValueChange={e => setAutoRppRtuRatio(e)}>
                                                <SelectTrigger className="w-full h-9"><SelectValue placeholder="เลือกสัดส่วน" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="100:0">100 : 0</SelectItem> <SelectItem value="80:20">80 : 20</SelectItem>
                                                    <SelectItem value="70:30">70 : 30</SelectItem> <SelectItem value="60:40">60 : 40</SelectItem>
                                                    <SelectItem value="50:50">50 : 50</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">* ระบบจะคำนวณหาเบี้ย iWealthy ที่เหมาะสมให้ โดยเริ่มถอนจ่ายเบี้ย CI หลังครบกำหนดชำระเบี้ย iWealthy</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Section: ปุ่มคำนวณ และสรุปเบี้ย */}
            <Card className="mt-10">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-900/30 dark:via-sky-900/30 dark:to-cyan-900/30 rounded-lg">
                    <div className="text-center md:text-left">
                        <p className="font-bold text-xl text-primary">
                            เบี้ย CI รวมปีแรก: {formatNumber(firstYearCiPremium)} บาท
                        </p>
                        {useIWealthy && iWealthySummaryText && ( <p className="text-md text-muted-foreground mt-1">{iWealthySummaryText}</p> )}
                    </div>
                    <Button onClick={runCalculation} disabled={isLoading} size="lg" className="w-full md:w-auto">
                        {isLoading && <span className="loading loading-spinner loading-sm mr-2"></span>}
                        {isLoading ? 'กำลังคำนวณ...' : <><CalculatorIcon /> แสดงภาพประกอบการขาย</>}
                    </Button>
                </CardContent>
            </Card>

            {/* Section: ผลการคำนวณ */}
            {isLoading && ( <div className="mt-8 text-center p-10"><span className="loading loading-lg loading-dots text-primary"></span><p className="text-lg text-muted-foreground mt-2">กำลังคำนวณผลประโยชน์ กรุณารอสักครู่...</p></div> )}

            {error && (
                <Alert variant="destructive" className="mt-8">
                    <ErrorIcon />
                    <AlertTitle>เกิดข้อผิดพลาด!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isLoading && !error && result && (
                <div className="mt-8 space-y-8">
                    <h2 className="text-2xl font-semibold border-b-2 border-primary pb-2">ตารางแสดงผลประโยชน์โดยสังเขป</h2>
                    {ciPremiumsSchedule && ciPremiumsSchedule.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>สรุปเบี้ยประกันภัยโรคร้ายแรง (CI) ต่อปี</CardTitle></CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center">ปีที่</TableHead>
                                                <TableHead className="text-center">อายุ</TableHead>
                                                <TableHead className="text-right">เบี้ย LifeReady</TableHead>
                                                <TableHead className="text-right">เบี้ย iCare</TableHead>
                                                <TableHead className="text-right">เบี้ย iShield</TableHead>
                                                <TableHead className="text-right">เบี้ย RokRaiฯ</TableHead>
                                                <TableHead className="text-right">เบี้ย DCI</TableHead>
                                                <TableHead className="text-right font-semibold">เบี้ย CI รวมต่อปี</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ciPremiumsSchedule.map(row => (
                                                <TableRow key={`ci-${row.policyYear}-${row.age}`}>
                                                    <TableCell className="text-center">{row.policyYear}</TableCell>
                                                    <TableCell className="text-center">{row.age}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.lifeReadyPremium)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.icarePremium)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.ishieldPremium)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.rokraiPremium)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.dciPremium)}</TableCell>
                                                    <TableCell className="text-right font-semibold">{formatNumber(row.totalCiPremium)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                     {useIWealthy && result.some(r => r.iWealthyEoyAccountValue !== undefined || r.iWealthyRpp !== undefined ) && (
                         <Card>
                             <CardHeader><CardTitle>ภาพรวมผลประโยชน์ CI และ iWealthy (รายปี)</CardTitle></CardHeader>
                             <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center">ปีที่</TableHead>
                                                <TableHead className="text-center">อายุ</TableHead>
                                                <TableHead className="text-right">เบี้ย CI รวม</TableHead>
                                                <TableHead className="text-right">iWealthy RPP</TableHead>
                                                <TableHead className="text-right">iWealthy RTU</TableHead>
                                                <TableHead className="text-right">ถอนจาก iWealthy</TableHead>
                                                <TableHead className="text-right font-semibold">มูลค่าบัญชี iWealthy (สิ้นปี)</TableHead>
                                                <TableHead className="text-right font-semibold">ผลประโยชน์เสียชีวิตรวม</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.map(row => (
                                                <TableRow key={`res-${row.policyYear}-${row.age}`}>
                                                    <TableCell className="text-center">{row.policyYear}</TableCell>
                                                    <TableCell className="text-center">{row.age}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.totalCiPackagePremiumPaid)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.iWealthyRpp)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.iWealthyRtu)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.iWealthyWithdrawal)}</TableCell>
                                                    <TableCell className="text-right font-semibold">{formatNumber(row.iWealthyEoyAccountValue)}</TableCell>
                                                    <td className="text-right font-semibold">{formatNumber(row.totalCombinedDeathBenefit)}</td>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                     )}
                     {!isLoading && !error && result && result.length === 0 && (
                        <Alert variant="default" className="mt-8 bg-sky-100 text-sky-800 border-sky-300">
                            <InfoIcon />
                            <AlertTitle>ไม่พบข้อมูล</AlertTitle>
                            <AlertDescription>
                                ไม่พบข้อมูลผลประโยชน์ประกอบการขายสำหรับเงื่อนไขที่เลือก อาจจะยังไม่ได้คำนวณ หรือไม่มีแผน iWealthy ที่เหมาะสม (หากเลือกใช้ iWealthy)
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );
}