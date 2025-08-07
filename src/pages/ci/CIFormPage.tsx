// src/pages/ci/CIFormPage.tsx

// --- Imports ---
// 1. เพิ่ม StopPaymentConfig ใน import
import type { UseCiPlannerReturn, CiPlanSelections, IShieldPlan, LifeReadyPlan, RokRaiSoShieldPlan, IWealthyMode, StopPaymentConfig } from '@/components/ci/types/useCiTypes';
import { FaVenusMars, FaBirthdayCake, FaFileAlt } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatNumber, CalculatorIcon } from '@/components/ci/utils/helpers';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Data Constants ---
const ICarePlansData = [ { label: "5 แสน", value: 500000 }, { label: "1 ล้าน", value: 1000000 }, { label: "1.5 ล้าน", value: 1500000 }, { label: "2 ล้าน", value: 2000000 }, { label: "2.5 ล้าน", value: 2500000 }, { label: "3 ล้าน", value: 3000000 }, { label: "4 ล้าน", value: 4000000 }, { label: "5 ล้าน", value: 5000000 }, ];
const IShieldPlanOptionsData: { label: string; value: IShieldPlan }[] = [ { label: "iShield (จ่ายเบี้ย 5 ปี)", value: "05" }, { label: "iShield (จ่ายเบี้ย 10 ปี)", value: "10" }, { label: "iShield (จ่ายเบี้ย 15 ปี)", value: "15" }, { label: "iShield (จ่ายเบี้ย 20 ปี)", value: "20" }, ];
const LifeReadyPlanOptionsData: { label: string; value: LifeReadyPlan }[] = [ { label: "ชำระเบี้ย 6 ปี", value: 6 }, { label: "ชำระเบี้ย 12 ปี", value: 12 }, { label: "ชำระเบี้ย 18 ปี", value: 18 }, { label: "ชำระเบี้ยถึงอายุ 99 ปี", value: 99 }, ];
const RokRaiSoShieldPlanOptionsData: { label: string; value: RokRaiSoShieldPlan }[] = [ { label: "แผน S", value: "S" }, { label: "แผน M", value: "M" }, { label: "แผน L", value: "L" }, { label: "แผน XL", value: "XL" }, ];
const ageOptionsData = Array.from({ length: (70 - 18 + 1) }, (_, i) => 18 + i);

// --- Helper Components ---
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-3 border rounded-lg shadow-sm bg-white space-y-3 ${className}`}>
        {children}
    </div>
);
const SectionTitle = ({ children, icon, className }: { children: React.ReactNode, icon?: React.ReactNode, className?: string }) => (
    <h2 className={`text-base font-semibold flex items-center gap-2 text-slate-800 ${className}`}>
        {icon}{children}
    </h2>
);

// --- Component Definition ---
export default function CIFormPage(props: UseCiPlannerReturn) {
    const { policyholderEntryAge, setPolicyholderEntryAge, policyholderGender, setPolicyholderGender, policyOriginMode, setPolicyOriginMode, existingPolicyEntryAge, setExistingPolicyEntryAge, selectedCiPlans, setSelectedCiPlans, useIWealthy, setUseIWealthy, iWealthyMode, setIWealthyMode, iWealthyInvestmentReturn, setIWealthyInvestmentReturn, iWealthyOwnPPT, setIWealthyOwnPPT, iWealthyWithdrawalStartAge, setIWealthyWithdrawalStartAge, manualRpp, setManualRpp, manualRtu, setManualRtu, autoRppRtuRatio, setAutoRppRtuRatio, isLoading, error, ciPremiumsSchedule, calculatedMinPremium, calculatedRpp, calculatedRtu, runCalculation, ciUseCustomWithdrawalAge, setCiUseCustomWithdrawalAge } = props;
    const handleCiSelectionChange=<K extends keyof CiPlanSelections>(key:K,value:CiPlanSelections[K])=>{setSelectedCiPlans(e=>{const t={...e,[key]:value};return"mainRiderChecked"===key&&!value&&(t.rokraiChecked=!1,t.dciChecked=!1),"icareChecked"===key&&(t.icareSA=value?1e6:0),"ishieldChecked"===key&&(value?(t.ishieldPlan="20",t.ishieldSA=5e5):(t.ishieldPlan=null,t.ishieldSA=0)),"rokraiChecked"===key&&(t.rokraiPlan=value?"XL":null),"dciChecked"===key&&(t.dciSA=value?3e5:0),"mainRiderChecked"===key&&(value?(t.lifeReadyPlan=18,t.lifeReadySA=15e4):(t.lifeReadyPlan=null,t.lifeReadySA=0,t.rokraiChecked=!1,t.rokraiPlan=null,t.dciChecked=!1,t.dciSA=0)),t})};
    const firstYearCiPremium = ciPremiumsSchedule?.[0]?.totalCiPremium;
    let iWealthySummaryText: string | null = null; if (useIWealthy) { if (iWealthyMode === 'manual' && (manualRpp > 0 || manualRtu > 0)) { iWealthySummaryText = `Manual: RPP ${formatNumber(manualRpp)}, RTU ${formatNumber(manualRtu)}`; } else if (iWealthyMode === 'automatic' && calculatedMinPremium !== undefined) { iWealthySummaryText = `Auto: RPP ${formatNumber(calculatedRpp)}, RTU ${formatNumber(calculatedRtu)} (รวม ${formatNumber(calculatedMinPremium)})`; } }
    const isCol2Visible = selectedCiPlans.mainRiderChecked; const isCol3Visible = useIWealthy; const visibleSectionsCount = [true, isCol2Visible, isCol3Visible].filter(Boolean).length; let gridColsClass = "lg:grid-cols-1"; if (visibleSectionsCount === 2) { gridColsClass = "lg:grid-cols-2"; } else if (visibleSectionsCount === 3) { gridColsClass = "lg:grid-cols-3"; } let titleOrderNumber = 0; const showNumbersOnTitles = visibleSectionsCount > 1; const getSectionTitle = (defaultTitle: string) => { if (showNumbersOnTitles) { titleOrderNumber++; return `${titleOrderNumber}. ${defaultTitle}`; } return defaultTitle; };

    const firstYearPremiums = ciPremiumsSchedule?.[0];

    const includedPlans = [];
    if (selectedCiPlans.icareChecked) includedPlans.push('iCare');
    if (selectedCiPlans.ishieldChecked) includedPlans.push('iShield');
    if (selectedCiPlans.mainRiderChecked) includedPlans.push('LifeReady');
    if (selectedCiPlans.rokraiChecked) includedPlans.push('RokeRaiSoShield');
    if (selectedCiPlans.dciChecked) includedPlans.push('DCI');

    const includedPlansText = includedPlans.length > 0 
        ? `(ประกอบไปด้วยแผน: ${includedPlans.join(' + ')})` 
        : '';

    const withdrawalAgeOptions = Array.from(
        { length: (99 - policyholderEntryAge) + 1 },
        (_, i) => policyholderEntryAge + i
    );

    const handleStopPaymentChange = (
        planKey: 'icareStopPayment' | 'ishieldStopPayment' | 'lifeReadyStopPayment' | 'rokraiStopPayment' | 'dciStopPayment',
        field: keyof StopPaymentConfig,
        value: boolean | number
    ) => {
        setSelectedCiPlans(prev => {
            const newSelections = { ...prev };
            const stopConfig = { ...newSelections[planKey] };
            (stopConfig as any)[field] = value;
            newSelections[planKey] = stopConfig;
            return newSelections;
        });
    };

    // --- 2. สร้างตัวเลือกอายุสำหรับทุกแผน ---
    const iCareStopAgeOptions = Array.from(
        { length: (85 - policyholderEntryAge) },
        (_, i) => policyholderEntryAge + i
    );
    const iShieldStopAgeOptions = Array.from(
        { length: (85 - policyholderEntryAge) },
        (_, i) => policyholderEntryAge + i
    );
    const lifeReadyStopAgeOptions = Array.from(
        { length: (99 - policyholderEntryAge) },
        (_, i) => policyholderEntryAge + i
    );
    const rokraiStopAgeOptions = Array.from(
        { length: (99 - policyholderEntryAge) },
        (_, i) => policyholderEntryAge + i
    );
    const dciStopAgeOptions = Array.from(
        { length: (74 - policyholderEntryAge) },
        (_, i) => policyholderEntryAge + i
    );

    return (
        <div className="space-y-4">
            <Card>
                <SectionTitle>ข้อมูลผู้เอาประกัน</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 items-end pt-1">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1"><FaBirthdayCake className="text-blue-600 text-xs" /><Label htmlFor="policyholderAge" className="text-xs">อายุ (ปี)</Label></div>
                        <Select value={String(policyholderEntryAge)} onValueChange={(value) => setPolicyholderEntryAge(Number(value))}>
                            <SelectTrigger id="policyholderAge" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{ageOptionsData.map(age => (<SelectItem key={age} value={String(age)} className="text-xs">{age}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-1"><FaVenusMars className="text-blue-600 text-xs" /><Label className="text-xs">เพศ</Label></div>
                        <div className="flex items-center h-9 gap-x-4">
                            <Label className="inline-flex items-center cursor-pointer"><Checkbox checked={policyholderGender==='male'} onCheckedChange={()=>setPolicyholderGender('male')} className="h-4 w-4 data-[state=checked]:bg-blue-600" /><span className={`ml-2 text-xs ${policyholderGender === 'male' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>ชาย</span></Label>
                            <Label className="inline-flex items-center cursor-pointer"><Checkbox checked={policyholderGender==='female'} onCheckedChange={()=>setPolicyholderGender('female')} className="h-4 w-4 data-[state=checked]:bg-pink-600" /><span className={`ml-2 text-xs ${policyholderGender === 'female' ? 'text-pink-600 font-semibold' : 'text-gray-700'}`}>หญิง</span></Label>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-1"><FaFileAlt className="text-blue-600 text-xs" /><Label htmlFor="policyOriginModeSwitch" className="text-xs">ประเภทกรมธรรม์</Label></div>
                        <div className="flex items-center h-9 space-x-2">
                            <Switch id="policyOriginModeSwitch" className="data-[state=checked]:bg-blue-600" checked={policyOriginMode === 'newPolicy'} onCheckedChange={(isChecked) => { setPolicyOriginMode(isChecked ? 'newPolicy' : 'existingPolicy'); if (isChecked) { setExistingPolicyEntryAge(undefined); } }} />
                            <Label htmlFor="policyOriginModeSwitch" className="text-xs">{policyOriginMode === 'existingPolicy' ? 'ใช้สัญญาหลักเดิม' : 'สร้างแผนใหม่'}</Label>
                        </div>
                    </div>
                    {policyOriginMode === 'existingPolicy' && (
                        <div>
                            <Label htmlFor="existingPolicyEntryAge" className="text-xs">อายุแรกเข้า LifeReady เดิม</Label>
                            <Input id="existingPolicyEntryAge" type="number" min={0} max={policyholderEntryAge - 1} value={existingPolicyEntryAge ?? ''} onChange={(e) => setExistingPolicyEntryAge(e.target.value ? Number(e.target.value) : undefined)} placeholder="กรอกอายุ" className="h-9 mt-1 text-xs" />
                        </div>
                    )}
                </div>
            </Card>

            <div className={`mt-6 grid gap-4 grid-cols-1 ${gridColsClass}`}>
                <Card>
                    <SectionTitle>{getSectionTitle("วางแผนดูแลโรคร้าย")}</SectionTitle>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label className="flex items-center space-x-2 cursor-pointer">
                                <Checkbox 
                                    id="icareChecked" 
                                    checked={selectedCiPlans.icareChecked} 
                                    onCheckedChange={(c) => handleCiSelectionChange('icareChecked', !!c)} 
                                    className="data-[state=checked]:bg-blue-600"
                                />
                                <span className={`font-semibold text-sm ${selectedCiPlans.icareChecked ? 'text-blue-700' : 'text-slate-800'}`}>iCare</span>
                            </Label>
                            {selectedCiPlans.icareChecked && (
                                <div className="pl-6 space-y-2">
                                    <div>
                                        {/* 3. แก้ไข Typo onValuechange */}
                                        <Select value={String(selectedCiPlans.icareSA)} onValueChange={(v) => handleCiSelectionChange('icareSA', Number(v))}>
                                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>{ICarePlansData.map((p) => (<SelectItem key={p.value} value={String(p.value)} className="text-xs">{p.label}</SelectItem>))}</SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-muted-foreground mt-1">ทุนประกันส่วนหลัก: {formatNumber(100000)} (คุ้มครองถึง 85)</p>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch
                                            id="icare-stop-toggle"
                                            checked={selectedCiPlans.icareStopPayment.useCustomStopAge}
                                            onCheckedChange={(checked) => handleStopPaymentChange('icareStopPayment', 'useCustomStopAge', checked)}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                        <Label htmlFor="icare-stop-toggle" className="text-xs font-normal">
                                            กำหนดปีที่หยุดจ่ายเอง
                                        </Label>
                                    </div>
                                    {selectedCiPlans.icareStopPayment.useCustomStopAge && (
                                        <div className="pl-6">
                                            <Label className="block mb-1 text-xs text-muted-foreground">หยุดจ่ายเบี้ยเมื่ออายุ</Label>
                                            <Select
                                                value={String(selectedCiPlans.icareStopPayment.stopAge)}
                                                onValueChange={(age) => handleStopPaymentChange('icareStopPayment', 'stopAge', Number(age))}
                                            >
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {iCareStopAgeOptions.map(age => (
                                                        <SelectItem key={age} value={String(age)} className="text-xs">{age}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}
                            {firstYearPremiums?.icarePremium !== undefined && (
                                <p className="text-xs text-blue-600 font-medium">เบี้ยปีแรก: {formatNumber(firstYearPremiums.icarePremium)} บาท</p>
                            )}
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="flex items-center space-x-2 cursor-pointer">
                                <Checkbox 
                                    id="ishieldChecked" 
                                    checked={selectedCiPlans.ishieldChecked} 
                                    onCheckedChange={(c) => handleCiSelectionChange('ishieldChecked', !!c)} 
                                    className="data-[state=checked]:bg-purple-600"
                                />
                                <span className={`font-semibold text-sm ${selectedCiPlans.ishieldChecked ? 'text-purple-700' : 'text-slate-800'}`}>iShield</span>
                            </Label>
                            {selectedCiPlans.ishieldChecked && (
                                <div className="pl-6 space-y-2">
                                    <div>
                                        <Select value={selectedCiPlans.ishieldPlan ?? ''} onValueChange={(v) => handleCiSelectionChange('ishieldPlan', v as IShieldPlan|null)}>
                                            <SelectTrigger className="h-9 text-xs"><SelectValue/></SelectTrigger>
                                            <SelectContent>{IShieldPlanOptionsData.map((p) => (<SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Input type="number" min={500000} step={100000} value={selectedCiPlans.ishieldSA} onChange={(e) => handleCiSelectionChange('ishieldSA', Number(e.target.value))} className="h-9 text-xs" />
                                        <p className="text-[11px] text-muted-foreground mt-1">คุ้มครองถึงอายุ 85</p>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch
                                            id="ishield-stop-toggle"
                                            checked={selectedCiPlans.ishieldStopPayment.useCustomStopAge}
                                            onCheckedChange={(checked) => handleStopPaymentChange('ishieldStopPayment', 'useCustomStopAge', checked)}
                                            className="data-[state=checked]:bg-purple-600"
                                        />
                                        <Label htmlFor="ishield-stop-toggle" className="text-xs font-normal">
                                            กำหนดปีที่หยุดจ่ายเอง
                                        </Label>
                                    </div>
                                    {selectedCiPlans.ishieldStopPayment.useCustomStopAge && (
                                        <div className="pl-6">
                                            <Label className="block mb-1 text-xs text-muted-foreground">หยุดจ่ายเบี้ยเมื่ออายุ</Label>
                                            <Select
                                                value={String(selectedCiPlans.ishieldStopPayment.stopAge)}
                                                onValueChange={(age) => handleStopPaymentChange('ishieldStopPayment', 'stopAge', Number(age))}
                                            >
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {iShieldStopAgeOptions.map(age => (
                                                        <SelectItem key={age} value={String(age)} className="text-xs">{age}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}
                            {firstYearPremiums?.ishieldPremium !== undefined && (
                                <p className="text-xs text-purple-600 font-medium">เบี้ยปีแรก: {formatNumber(firstYearPremiums.ishieldPremium)} บาท</p>
                            )}
                        </div>
                        <Separator />
                        <div className="space-y-1">
                            <Label className="flex items-center space-x-2 cursor-pointer">
                                <Checkbox 
                                    id="mainRiderChecked" 
                                    checked={selectedCiPlans.mainRiderChecked} 
                                    onCheckedChange={(c) => handleCiSelectionChange('mainRiderChecked', !!c)} 
                                    className="data-[state=checked]:bg-green-600"
                                />
                                <span className={`font-semibold text-sm ${selectedCiPlans.mainRiderChecked ? 'text-green-700' : 'text-slate-800'}`}>LifeReady และสัญญาเพิ่มเติมอื่นๆ</span>
                            </Label>
                            <p className="pl-6 text-[11px] text-muted-foreground">สัญญาหลักสำหรับ RokeRaiSoShield และ DCI</p>
                        </div>
                        <Separator />
                        <div>
                            <div className="flex items-center gap-1.5"><FaWandMagicSparkles className="text-purple-600 text-sm" /><Label className="text-xs font-medium">วางแผนด้วย iWealthy</Label></div>
                            <div className="flex items-center h-9 space-x-2">
                                <Switch id="iwealthy-mode-toggle" checked={useIWealthy} onCheckedChange={setUseIWealthy} className="data-[state=checked]:bg-purple-600" />
                                <Label htmlFor="iwealthy-mode-toggle" className="text-xs">{useIWealthy ? 'ใช้ iWealthy' : 'ไม่ใช้'}</Label>
                            </div>
                        </div>
                    </div>
                </Card>

                {isCol2Visible && (
                    <Card>
                        <SectionTitle>{getSectionTitle("สัญญาหลักและ CI เพิ่มเติม")}</SectionTitle>
                        <div className="space-y-3">
                            <div className="p-3 space-y-2 rounded-md bg-green-50">
                                <p className="text-sm font-semibold text-green-800">LifeReady (สัญญาหลัก)</p>
                                <div>
                                    <Label className="block mb-1 text-xs">ระยะเวลาชำระเบี้ย</Label>
                                    <Select value={selectedCiPlans.lifeReadyPlan ? String(selectedCiPlans.lifeReadyPlan) : ''} onValueChange={(v) => handleCiSelectionChange('lifeReadyPlan', Number(v) as LifeReadyPlan|null)}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>{LifeReadyPlanOptionsData.map((p) => (<SelectItem key={p.value} value={String(p.value)} className="text-xs">{p.label}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="block mb-1 text-xs">ทุนประกัน</Label>
                                    <Input type="number" value={selectedCiPlans.lifeReadySA} onChange={(e) => handleCiSelectionChange('lifeReadySA', Number(e.target.value))} min={150000} step={50000} className="h-9 text-xs"/>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="lifeready-stop-toggle"
                                        checked={selectedCiPlans.lifeReadyStopPayment.useCustomStopAge}
                                        onCheckedChange={(checked) => handleStopPaymentChange('lifeReadyStopPayment', 'useCustomStopAge', checked)}
                                        className="data-[state=checked]:bg-green-600"
                                    />
                                    <Label htmlFor="lifeready-stop-toggle" className="text-xs font-normal">
                                        กำหนดปีที่ต้องการเวนคืน
                                    </Label>
                                </div>
                                {selectedCiPlans.lifeReadyStopPayment.useCustomStopAge && (
                                    <div className="pl-6">
                                        <Label className="block mb-1 text-xs text-muted-foreground">เวนคืนเมื่ออายุ</Label>
                                        <Select
                                            value={String(selectedCiPlans.lifeReadyStopPayment.stopAge)}
                                            onValueChange={(age) => handleStopPaymentChange('lifeReadyStopPayment', 'stopAge', Number(age))}
                                        >
                                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {lifeReadyStopAgeOptions.map(age => (
                                                    <SelectItem key={age} value={String(age)} className="text-xs">{age}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {firstYearPremiums?.lifeReadyPremium !== undefined && (
                                    <p className="text-xs text-green-600 font-medium pt-1">เบี้ยปีแรก: {formatNumber(firstYearPremiums.lifeReadyPremium)} บาท</p>
                                )}
                            </div>
                            <Separator/>
                            <div className="space-y-2">
                                <Label className="flex items-center space-x-2 cursor-pointer">
                                    <Checkbox 
                                        id="rokraiChecked" 
                                        checked={selectedCiPlans.rokraiChecked} 
                                        onCheckedChange={(c) => handleCiSelectionChange('rokraiChecked', !!c)} 
                                        className="data-[state=checked]:bg-orange-600"
                                    />
                                    <span className={`font-semibold text-sm ${selectedCiPlans.rokraiChecked ? 'text-orange-700' : 'text-slate-800'}`}>RokeRaiSoShield</span>
                                </Label>
                                {selectedCiPlans.rokraiChecked && (
                                    <div className="pl-6 space-y-2">
                                        <div>
                                            <Select value={selectedCiPlans.rokraiPlan ?? ''} onValueChange={(v) => handleCiSelectionChange('rokraiPlan', v as RokRaiSoShieldPlan|null)}>
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>{RokRaiSoShieldPlanOptionsData.map((p) => (<SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>))}</SelectContent>
                                            </Select>
                                            <p className="mt-1 text-[11px] text-muted-foreground">คุ้มครองถึง 99</p>
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch
                                                id="rokrai-stop-toggle"
                                                checked={selectedCiPlans.rokraiStopPayment.useCustomStopAge}
                                                onCheckedChange={(checked) => handleStopPaymentChange('rokraiStopPayment', 'useCustomStopAge', checked)}
                                                className="data-[state=checked]:bg-orange-600"
                                            />
                                            <Label htmlFor="rokrai-stop-toggle" className="text-xs font-normal">
                                                กำหนดปีที่หยุดจ่ายเอง
                                            </Label>
                                        </div>
                                        {selectedCiPlans.rokraiStopPayment.useCustomStopAge && (
                                            <div className="pl-6">
                                                <Label className="block mb-1 text-xs text-muted-foreground">หยุดจ่ายเบี้ยเมื่ออายุ</Label>
                                                <Select
                                                    value={String(selectedCiPlans.rokraiStopPayment.stopAge)}
                                                    onValueChange={(age) => handleStopPaymentChange('rokraiStopPayment', 'stopAge', Number(age))}
                                                >
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {rokraiStopAgeOptions.map(age => (
                                                            <SelectItem key={age} value={String(age)} className="text-xs">{age}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {firstYearPremiums?.rokraiPremium !== undefined && (
                                    <p className="text-xs text-orange-600 font-medium">เบี้ยปีแรก: {formatNumber(firstYearPremiums.rokraiPremium)} บาท</p>
                                )}
                            </div>
                            <Separator/>
                            <div className="space-y-2">
                                <Label className="flex items-center space-x-2 cursor-pointer">
                                    <Checkbox 
                                        id="dciChecked" 
                                        checked={selectedCiPlans.dciChecked} 
                                        onCheckedChange={(c) => handleCiSelectionChange('dciChecked', !!c)} 
                                        className="data-[state=checked]:bg-teal-600"
                                    />
                                    <span className={`font-semibold text-sm ${selectedCiPlans.dciChecked ? 'text-teal-700' : 'text-slate-800'}`}>DCI</span>
                                </Label>
                                {selectedCiPlans.dciChecked && (
                                    <div className="pl-6 space-y-2">
                                        <div>
                                            <Input type="number" value={selectedCiPlans.dciSA} onChange={(e) => handleCiSelectionChange('dciSA', Number(e.target.value))} min={100000} step={50000} className="h-9 text-xs" />
                                            <p className="mt-1 text-[11px] text-muted-foreground">คุ้มครองถึงอายุ 74</p>
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch
                                                id="dci-stop-toggle"
                                                checked={selectedCiPlans.dciStopPayment.useCustomStopAge}
                                                onCheckedChange={(checked) => handleStopPaymentChange('dciStopPayment', 'useCustomStopAge', checked)}
                                                className="data-[state=checked]:bg-teal-600"
                                            />
                                            <Label htmlFor="dci-stop-toggle" className="text-xs font-normal">
                                                กำหนดปีที่หยุดจ่ายเอง
                                            </Label>
                                        </div>
                                        {selectedCiPlans.dciStopPayment.useCustomStopAge && (
                                            <div className="pl-6">
                                                <Label className="block mb-1 text-xs text-muted-foreground">หยุดจ่ายเบี้ยเมื่ออายุ</Label>
                                                <Select
                                                    value={String(selectedCiPlans.dciStopPayment.stopAge)}
                                                    onValueChange={(age) => handleStopPaymentChange('dciStopPayment', 'stopAge', Number(age))}
                                                >
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {dciStopAgeOptions.map(age => (
                                                            <SelectItem key={age} value={String(age)} className="text-xs">{age}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {firstYearPremiums?.dciPremium !== undefined && (
                                    <p className="text-xs text-teal-600 font-medium">เบี้ยปีแรก: {formatNumber(firstYearPremiums.dciPremium)} บาท</p>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {isCol3Visible && (
                    <Card>
                        <SectionTitle>{getSectionTitle("ตั้งค่า iWealthy")}</SectionTitle>
                        <div className="space-y-3">
                            <Tabs value={iWealthyMode} onValueChange={(v) => setIWealthyMode(v as IWealthyMode)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-9">
                                    <TabsTrigger value="automatic" className="text-xs">Auto</TabsTrigger>
                                    <TabsTrigger value="manual" className="text-xs">Manual</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <div className="space-y-2">
                                <div><Label className="block mb-1 text-xs">ผลตอบแทนที่คาดหวัง (%)</Label><Input type="number" value={iWealthyInvestmentReturn} onChange={(e) => setIWealthyInvestmentReturn(Number(e.target.value)||0)} className="h-9 text-xs" /></div>
                                <div><Label className="block mb-1 text-xs">ระยะเวลาชำระเบี้ย iWealthy (ปี)</Label><Input type="number" value={iWealthyOwnPPT} onChange={(e) => setIWealthyOwnPPT(Number(e.target.value)||0)} className="h-9 text-xs" /></div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="custom-withdrawal-age-toggle"
                                        checked={ciUseCustomWithdrawalAge}
                                        onCheckedChange={setCiUseCustomWithdrawalAge}
                                        className="data-[state=checked]:bg-blue-600"
                                    />
                                    <Label htmlFor="custom-withdrawal-age-toggle" className="text-xs font-normal">
                                        กำหนดอายุที่เริ่มถอนเอง
                                    </Label>
                                </div>
                                {ciUseCustomWithdrawalAge && (
                                    <div className="pl-6 pt-1">
                                        <Label className="block mb-1 text-xs text-muted-foreground">อายุที่เริ่มถอนจ่ายเบี้ย CI</Label>
                                        <Select
                                            value={String(iWealthyWithdrawalStartAge)}
                                            onValueChange={(value) => {
                                                console.log(`[CIFormPage] อายุที่เลือก: ${value}`);
                                                setIWealthyWithdrawalStartAge(Number(value));
                                            }}
                                        >
                                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือกอายุ" /></SelectTrigger>
                                            <SelectContent>
                                                {withdrawalAgeOptions.map(age => (
                                                    <SelectItem key={age} value={String(age)} className="text-xs">{age}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {iWealthyMode === 'manual' && ( <>
                                    <Separator className="!my-3"/>
                                    <h3 className="font-semibold text-xs text-purple-600">กำหนดเบี้ย (Manual)</h3>
                                    <div><Label className="block mb-1 text-xs">เบี้ยหลัก RPP ต่อปี</Label><Input type="number" value={manualRpp} onChange={(e) => setManualRpp(Number(e.target.value)||0)} min={18000} step={1000} className="h-9 text-xs" /></div>
                                    <div><Label className="block mb-1 text-xs">เบี้ยออมทรัพย์ RTU ต่อปี</Label><Input type="number" value={manualRtu} onChange={(e) => setManualRtu(Number(e.target.value)||0)} min={0} step={1000} className="h-9 text-xs" /></div>
                                </> )}
                                {iWealthyMode === 'automatic' && ( <>
                                    <Separator className="!my-3"/>
                                    <div><Label className="block mb-1 text-xs">สัดส่วน RPP : RTU</Label><Select value={autoRppRtuRatio} onValueChange={setAutoRppRtuRatio}><SelectTrigger className="w-full h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="100:0" className="text-xs">100 : 0</SelectItem><SelectItem value="80:20" className="text-xs">80 : 20</SelectItem><SelectItem value="70:30" className="text-xs">70 : 30</SelectItem><SelectItem value="60:40" className="text-xs">60 : 40</SelectItem><SelectItem value="50:50" className="text-xs">50 : 50</SelectItem></SelectContent></Select></div>
                                </> )}
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {error && (<Alert variant="destructive" className="mt-4"><AlertTitle className="text-sm">พบข้อผิดพลาด</AlertTitle><AlertDescription className="text-xs">{error}</AlertDescription></Alert>)}
            
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-lg font-bold text-primary">เบี้ยประกัน CI รวมปีแรก: {formatNumber(firstYearCiPremium)} บาท</p>
                        {includedPlansText && (
                            <p className="mt-1 text-xs text-muted-foreground">{includedPlansText}</p>
                        )}
                        {useIWealthy && iWealthySummaryText && (<p className="mt-1 text-sm text-muted-foreground">{iWealthySummaryText}</p>)}
                    </div>
                    <Button onClick={runCalculation} disabled={isLoading} size="lg" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm h-11">
                        {isLoading ? 'กำลังคำนวณ...' : <><CalculatorIcon /> แสดงภาพประกอบการขาย</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}