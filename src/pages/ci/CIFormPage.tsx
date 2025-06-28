// src/pages/ci/CIFormPage.tsx



// --- Imports ---
// 1. แก้ไข: import Type ที่จำเป็นจากไฟล์ที่ถูกต้อง
import type { UseCiPlannerReturn, Gender, CiPlanSelections, IShieldPlan, LifeReadyPlan, RokRaiSoShieldPlan, IWealthyMode } from '@/components/ci/types/useCiTypes';
import { FaVenusMars, FaBirthdayCake, FaFileAlt } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatNumber, CalculatorIcon } from '@/components/ci/utils/helpers';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Data Constants (เหมือนเดิม) ---
const ICarePlansData = [ { label: "5 แสน", value: 500000 }, { label: "1 ล้าน", value: 1000000 }, { label: "1.5 ล้าน", value: 1500000 }, { label: "2 ล้าน", value: 2000000 }, { label: "2.5 ล้าน", value: 2500000 }, { label: "3 ล้าน", value: 3000000 }, { label: "4 ล้าน", value: 4000000 }, { label: "5 ล้าน", value: 5000000 }, ];
const IShieldPlanOptionsData: { label: string; value: IShieldPlan }[] = [ { label: "iShield (จ่ายเบี้ย 5 ปี)", value: "05" }, { label: "iShield (จ่ายเบี้ย 10 ปี)", value: "10" }, { label: "iShield (จ่ายเบี้ย 15 ปี)", value: "15" }, { label: "iShield (จ่ายเบี้ย 20 ปี)", value: "20" }, ];
const LifeReadyPlanOptionsData: { label: string; value: LifeReadyPlan }[] = [ { label: "ชำระเบี้ย 6 ปี", value: 6 }, { label: "ชำระเบี้ย 12 ปี", value: 12 }, { label: "ชำระเบี้ย 18 ปี", value: 18 }, { label: "ชำระเบี้ยถึงอายุ 99 ปี", value: 99 }, ];
const RokRaiSoShieldPlanOptionsData: { label: string; value: RokRaiSoShieldPlan }[] = [ { label: "แผน S", value: "S" }, { label: "แผน M", value: "M" }, { label: "แผน L", value: "L" }, { label: "แผน XL", value: "XL" }, ];
const ageOptionsData = Array.from({ length: (70 - 18 + 1) }, (_, i) => 18 + i);


// --- Component Definition ---
// 2. แก้ไข: เปลี่ยนการประกาศฟังก์ชันให้รับ props ที่มี Type เป็น UseCiPlannerReturn
export default function CIFormPage(props: UseCiPlannerReturn) {
    
    // 3. แก้ไข: ลบการเรียกใช้ useCiPlanner และดึงค่าจาก props ที่รับเข้ามาแทน
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
        isLoading,
        error,
        ciPremiumsSchedule,
        calculatedMinPremium, calculatedRpp, calculatedRtu,
        runCalculation,
    } = props;

    // --- Logic และ Handlers ทั้งหมดเหมือนเดิม เพราะทำงานกับ state และ setters ที่ได้รับมาจาก props ---
    const handleCiSelectionChange = <K extends keyof CiPlanSelections>(key: K, value: CiPlanSelections[K]) => {
        setSelectedCiPlans((prev) => { // ไม่ต้องระบุ Type prev ที่นี่แล้ว เพราะ TypeScript รู้จาก Type ของ setSelectedCiPlans
            const newState = { ...prev, [key]: value };
            if (key === 'mainRiderChecked' && !value) {
                newState.rokraiChecked = false;
                newState.dciChecked = false;
            }
            if (key === 'icareChecked') { newState.icareSA = value ? 1000000 : 0; }
            if (key === 'ishieldChecked') {
                if (value) {
                newState.ishieldPlan = '20';
                newState.ishieldSA = 500000;
            } else {
                newState.ishieldPlan = null;
                newState.ishieldSA = 0;
            }
            }
            if (key === 'rokraiChecked') {
            newState.rokraiPlan = value ? 'XL' : null;
            } 
            if (key === 'dciChecked') {
            newState.dciSA = value ? 300000 : 0;
            }
            if (key === 'mainRiderChecked') {
                if (value) {
                newState.lifeReadyPlan = 18;
                newState.lifeReadySA = 150000;
            } else {
                newState.lifeReadyPlan = null;
                newState.lifeReadySA = 0;
                newState.rokraiChecked = false;
                newState.rokraiPlan = null;
                newState.dciChecked = false;
                newState.dciSA = 0;
            }
            }
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
    let gridColsClass = "lg:grid-cols-1";
    if (visibleSectionsCount === 2) { gridColsClass = "lg:grid-cols-2"; } 
    else if (visibleSectionsCount === 3) { gridColsClass = "lg:grid-cols-3"; }
    let titleOrderNumber = 0;
    const showNumbersOnTitles = visibleSectionsCount > 1;
    const getSectionTitle = (defaultTitle: string) => {
        if (showNumbersOnTitles) {
            titleOrderNumber++;
            return `${titleOrderNumber}. ${defaultTitle}`;
        }
        return defaultTitle;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl text-blue-700">ข้อมูลผู้เอาประกัน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 items-end">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaBirthdayCake className="text-blue-600 text-sm flex-shrink-0" />
                                <Label htmlFor="policyholderAge" className="text-sm">อายุ (ปี)</Label>
                            </div>
                            <Select value={String(policyholderEntryAge)} onValueChange={(value) => setPolicyholderEntryAge(Number(value))}>
                                <SelectTrigger id="policyholderAge" className="w-full mt-1"><SelectValue placeholder="เลือกอายุ" /></SelectTrigger>
                                <SelectContent><SelectGroup><SelectLabel>อายุ</SelectLabel>{ageOptionsData.map(age => (<SelectItem key={age} value={String(age)}>{age}</SelectItem>))}</SelectGroup></SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[150px]">
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaVenusMars className="text-blue-600 text-sm flex-shrink-0" />
                                <label className="text-sm font-medium text-gray-700">เพศ</label>
                            </div>
                            <div className="flex items-center h-9 gap-x-6">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="radio" className="w-4 h-4 form-radio accent-blue-600" name="policyholderGender" value="male" checked={policyholderGender === 'male'} onChange={() => setPolicyholderGender('male' as Gender)} />
                                    <span className={`ml-2 text-sm ${policyholderGender === 'male' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>ชาย</span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="radio" className="w-4 h-4 form-radio accent-pink-600" name="policyholderGender" value="female" checked={policyholderGender === 'female'} onChange={() => setPolicyholderGender('female' as Gender)} />
                                    <span className={`ml-2 text-sm ${policyholderGender === 'female' ? 'text-pink-600 font-semibold' : 'text-gray-700'}`}>หญิง</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaFileAlt className="text-blue-600 text-sm flex-shrink-0" />
                                <Label htmlFor="policyOriginModeSwitch" className="block text-sm font-medium">ประเภทกรมธรรม์</Label>
                            </div>
                            <div className="flex items-center h-9 space-x-2">
                                <Switch id="policyOriginModeSwitch" className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300" checked={policyOriginMode === 'newPolicy'} onCheckedChange={(isChecked) => { setPolicyOriginMode(isChecked ? 'newPolicy' : 'existingPolicy'); if (isChecked) { setExistingPolicyEntryAge(undefined); } }} />
                                <Label htmlFor="policyOriginModeSwitch" className="text-sm">{policyOriginMode === 'existingPolicy' ? 'ใช้สัญญาหลักเดิม' : 'สร้างแผนใหม่ทั้งหมด'}</Label>
                            </div>
                        </div>
                        {policyOriginMode === 'existingPolicy' && (
                            <div>
                                <Label htmlFor="existingPolicyEntryAge" className="text-sm">อายุแรกเข้า LifeReady เดิม</Label>
                                <Input id="existingPolicyEntryAge" type="number" min={0} max={policyholderEntryAge - 1} value={existingPolicyEntryAge ?? ''} onChange={(e) => setExistingPolicyEntryAge(e.target.value ? Number(e.target.value) : undefined)} placeholder="กรอกอายุ (ถ้ามี)" className="h-9 mt-1" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/*(titleOrderNumber = 0)*/}
            <div className={`mt-8 grid gap-6 grid-cols-1 ${gridColsClass}`}>
                <Card>
                    <CardHeader><CardTitle className="text-lg">{getSectionTitle("วางแผนดูแลโรคร้าย")}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="icareChecked" 
                                    checked={selectedCiPlans.icareChecked} 
                                    onCheckedChange={(checked) => handleCiSelectionChange('icareChecked', Boolean(checked))} 
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white border-gray-400"
                                />
                                <Label 
                                    htmlFor="icareChecked" 
                                    className={`text-md font-semibold transition-colors cursor-pointer ${
                                        selectedCiPlans.icareChecked ? 'text-blue-700' : 'text-slate-800'
                                    }`}
                                >
                                    iCare
                                </Label>
                            </div>
                            {selectedCiPlans.icareChecked && (<div className="pl-6 space-y-2"><Select value={String(selectedCiPlans.icareSA)} onValueChange={(val) => handleCiSelectionChange('icareSA', Number(val))}><SelectTrigger><SelectValue placeholder="-- เลือกทุนประกัน Rider --" /></SelectTrigger><SelectContent><SelectItem value="0">-- เลือกทุนประกัน Rider --</SelectItem>{ICarePlansData.map((plan) => (<SelectItem key={plan.value} value={String(plan.value)}>{plan.label}</SelectItem>))}</SelectContent></Select><p className="text-xs text-muted-foreground">ทุนประกันส่วนหลัก: {formatNumber(100000)} (คุ้มครองถึง 85)</p></div>)}
                        </div>
                        <Separator />
                        <div className="space-y-2">
                             <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="ishieldChecked" 
                                    checked={selectedCiPlans.ishieldChecked} 
                                    onCheckedChange={(checked) => handleCiSelectionChange('ishieldChecked', Boolean(checked))} 
                                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:text-white border-gray-400"
                                />
                                <Label 
                                    htmlFor="ishieldChecked" 
                                    className={`text-md font-semibold transition-colors cursor-pointer ${
                                        selectedCiPlans.icareChecked ? 'text-purple-600' : 'text-purple-700'
                                    }`}
                                >
                                    iShield
                                </Label>
                            </div>
                             {selectedCiPlans.ishieldChecked && (<div className="pl-6 space-y-3"><Select value={selectedCiPlans.ishieldPlan ?? ''} onValueChange={(val) => handleCiSelectionChange('ishieldPlan', val as IShieldPlan | null)}><SelectTrigger><SelectValue placeholder="-- เลือกแผนชำระเบี้ย --" /></SelectTrigger><SelectContent>{IShieldPlanOptionsData.map((plan) => (<SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>))}</SelectContent></Select><Input type="number" min={500000} step={100000} value={selectedCiPlans.ishieldSA} onChange={(e) => handleCiSelectionChange('ishieldSA', Number(e.target.value))} placeholder="ทุนประกัน iShield" className="h-9"/><p className="text-xs text-muted-foreground">คุ้มครองถึงอายุ 85</p></div>)}
                        </div>
                        <Separator />
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="mainRiderChecked" 
                                    checked={selectedCiPlans.mainRiderChecked} 
                                    onCheckedChange={(checked) => handleCiSelectionChange('mainRiderChecked', Boolean(checked))} 
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:text-white border-gray-400"
                                />
                                <Label 
                                    htmlFor="mainRiderChecked" 
                                    className={`text-md font-semibold transition-colors cursor-pointer ${
                                        selectedCiPlans.icareChecked ? 'text-green-600' : 'text-green-700'
                                    }`}
                                >
                                    LifeReady และสัญญาเพิ่มเติมอื่นๆ
                                </Label>
                            </div>
                            <p className="pl-6 text-xs text-muted-foreground">สัญญาหลักสำหรับ RokeRaiSoShield และ DCI</p>
                        </div>
                        <Separator />
                        <div>
                            <div className="flex items-center gap-1.5 mb-1"><FaWandMagicSparkles className="text-purple-600 text-sm flex-shrink-0" /><Label className="text-sm font-medium">วางแผนด้วย iWealthy</Label></div>
                            <div className="flex items-center h-9 space-x-2">
                                <Switch id="iwealthy-mode-toggle" 
                                    checked={useIWealthy} 
                                    onCheckedChange={setUseIWealthy} 
                                    className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-300" />
                                <Label htmlFor="iwealthy-mode-toggle" className="text-sm">{useIWealthy ? 'ใช้ iWealthy' : 'ไม่ใช้ iWealthy'}</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {isCol2Visible && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">{getSectionTitle("สัญญาหลักและ CI เพิ่มเติม")}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 space-y-3 rounded-md bg-green-50 dark:bg-green-900/20">
                                <p className="text-md font-semibold text-green-800 dark:text-green-300">LifeReady (สัญญาประกันชีวิตหลัก)</p>
                                <div><Label className="block mb-1 text-sm">ระยะเวลาชำระเบี้ย</Label><Select value={selectedCiPlans.lifeReadyPlan ? String(selectedCiPlans.lifeReadyPlan) : ''} onValueChange={(val) => handleCiSelectionChange('lifeReadyPlan', Number(val) as LifeReadyPlan | null)}><SelectTrigger><SelectValue placeholder="-- เลือกระยะเวลา --" /></SelectTrigger><SelectContent>{LifeReadyPlanOptionsData.map((plan) => (<SelectItem key={plan.value} value={String(plan.value)}>{plan.label}</SelectItem>))}</SelectContent></Select></div>
                                <div><Label className="block mb-1 text-sm">ทุนประกัน</Label><Input type="number" value={selectedCiPlans.lifeReadySA} onChange={(e) => handleCiSelectionChange('lifeReadySA', Number(e.target.value))} placeholder="ทุนประกัน" min={150000} step={50000} className="h-9"/></div>
                            </div>
                            <Separator/>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="rokraiChecked" 
                                        checked={selectedCiPlans.rokraiChecked} 
                                        onCheckedChange={(checked) => handleCiSelectionChange('rokraiChecked', Boolean(checked))} 
                                        className="data-[state=checked]:bg-orange-600 data-[state=checked]:text-white border-gray-400"
                                    />
                                    <Label 
                                        htmlFor="rokraiChecked" 
                                        className={`text-md font-semibold transition-colors cursor-pointer ${
                                        selectedCiPlans.icareChecked ? 'text-orange-600' : 'text-orange-700'
                                    }`}
                                    >
                                        RokeRaiSoShield
                                    </Label>
                                </div>
                                {selectedCiPlans.rokraiChecked && (<div className="pl-6"><Select value={selectedCiPlans.rokraiPlan ?? ''} onValueChange={(val) => handleCiSelectionChange('rokraiPlan', val as RokRaiSoShieldPlan | null)}><SelectTrigger><SelectValue placeholder="-- เลือกแผน --" /></SelectTrigger><SelectContent>{RokRaiSoShieldPlanOptionsData.map((plan) => (<SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>))}</SelectContent></Select><p className="mt-1 text-xs text-muted-foreground">คุ้มครองถึง 99</p></div>)}
                            </div>
                            <Separator/>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="dciChecked" 
                                        checked={selectedCiPlans.dciChecked} 
                                        onCheckedChange={(checked) => handleCiSelectionChange('dciChecked', Boolean(checked))} 
                                        className="data-[state=checked]:bg-teal-600 data-[state=checked]:text-white border-gray-400"
                                    />
                                    <Label 
                                        htmlFor="dciChecked" 
                                        className={`text-md font-semibold transition-colors cursor-pointer ${
                                        selectedCiPlans.icareChecked ? 'text-teal-600' : 'text-teal-700'
                                    }`}
                                    >
                                        DCI
                                    </Label>
                                </div>
                                {selectedCiPlans.dciChecked && (<div className="pl-6"><Input type="number" value={selectedCiPlans.dciSA} onChange={(e) => handleCiSelectionChange('dciSA', Number(e.target.value))} placeholder="ทุนประกัน DCI" min={100000} step={50000} className="h-9"/><p className="mt-1 text-xs text-muted-foreground">คุ้มครองถึงอายุ 74</p></div>)}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {isCol3Visible && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">{getSectionTitle("ตั้งค่า iWealthy")}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs value={iWealthyMode} onValueChange={(value) => setIWealthyMode(value as IWealthyMode)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="automatic"
                                    className="transition-colors duration-200 hover:bg-blue-200/60 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:hover:bg-blue-700"
                                    >Auto</TabsTrigger>
                                    <TabsTrigger value="manual"
                                    className="transition-colors duration-200 hover:bg-green-200/60 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:hover:bg-blue-700"
                                    >Manual</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <Label className="block mb-1 text-sm">ผลตอบแทนที่คาดหวัง (%)</Label>
                                    <Input 
                                        type="number" 
                                        value={iWealthyInvestmentReturn} 
                                        onChange={(e) => setIWealthyInvestmentReturn(Number(e.target.value) || 0)} 
                                        className="h-9"
                                    />
                                </div>
                                <div>
                                    <Label className="block mb-1 text-sm">ระยะเวลาชำระเบี้ย iWealthy (ปี)</Label>
                                    <Input 
                                        type="number" 
                                        value={iWealthyOwnPPT} 
                                        onChange={(e) => setIWealthyOwnPPT(Number(e.target.value) || 0)} 
                                        className="h-9"
                                    />
                                </div>

                                {iWealthyMode === 'manual' && (
                                    <>
                                        {/* 👇 จุดแก้ไขสำคัญสำหรับปัญหา withdrawalStartAge */}
                                        <div>
                                            <Label className="block mb-1 text-sm">อายุที่เริ่มถอนจ่ายเบี้ย CI</Label>
                                            <Input 
                                                type="number" 
                                                value={iWealthyWithdrawalStartAge} 
                                                // แก้ไข onChange ให้ปลอดภัยขึ้น
                                                onChange={(e) => setIWealthyWithdrawalStartAge(Number(e.target.value) || 0)} 
                                                className="h-9"
                                            />
                                        </div>

                                        <div className="pt-3 mt-4 space-y-3 border-t">
                                            <h3 className="font-semibold text-purple-600 dark:text-purple-400">กำหนดเบี้ย (Manual)</h3>
                                            <div>
                                                <Label className="block mb-1 text-sm">เบี้ยหลัก RPP ต่อปี</Label>
                                                <Input 
                                                    type="number" 
                                                    value={manualRpp} 
                                                    onChange={(e) => setManualRpp(Number(e.target.value) || 0)} 
                                                    min={18000} 
                                                    step={1000} 
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <Label className="block mb-1 text-sm">เบี้ยส่วนออมทรัพย์ RTU ต่อปี</Label>
                                                <Input 
                                                    type="number" 
                                                    value={manualRtu} 
                                                    onChange={(e) => setManualRtu(Number(e.target.value) || 0)} 
                                                    min={0} 
                                                    step={1000} 
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {iWealthyMode === 'automatic' && (
                                    <div className="pt-3 mt-4 space-y-3 border-t">
                                        <h3 className="font-semibold text-purple-600 dark:text-purple-400">กำหนดสัดส่วน (Auto)</h3>
                                        <div>
                                            <Label className="block mb-1 text-sm">สัดส่วน RPP : RTU</Label>
                                            <Select value={autoRppRtuRatio} onValueChange={setAutoRppRtuRatio}>
                                                <SelectTrigger className="w-full h-9"><SelectValue placeholder="เลือกสัดส่วน" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="100:0">100 : 0</SelectItem>
                                                    <SelectItem value="80:20">80 : 20</SelectItem>
                                                    <SelectItem value="70:30">70 : 30</SelectItem>
                                                    <SelectItem value="60:40">60 : 40</SelectItem>
                                                    <SelectItem value="50:50">50 : 50</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">* ระบบจะคำนวณหาเบี้ยที่เหมาะสมให้</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {error && (
                <Alert variant="destructive" className="mt-6">
                    <AlertTitle>พบข้อผิดพลาด</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            <Card className="mt-10">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-900/30 dark:via-sky-900/30 dark:to-cyan-900/30 rounded-lg">
                    <div className="text-center md:text-left">
                        <p className="text-xl font-bold text-primary">เบี้ย CI รวมปีแรก: {formatNumber(firstYearCiPremium)} บาท</p>
                        {useIWealthy && iWealthySummaryText && ( <p className="mt-1 text-md text-muted-foreground">{iWealthySummaryText}</p> )}
                    </div>
                    <Button onClick={runCalculation} disabled={isLoading} size="lg" className="w-full md:w-auto bg-blue-700 hover:bg-blue-500 text-white font-semibold">
                        {isLoading ? 'กำลังคำนวณ...' : <><CalculatorIcon /> แสดงภาพประกอบการขาย</>}
                    </Button>
                </CardContent>
            </Card>
        </>
    );
}