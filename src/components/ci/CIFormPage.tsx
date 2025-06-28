// src/pages/ci/CIFormPage.tsx


// --- Imports ---
import type { UseCiPlannerReturn, CiPlanSelections, IShieldPlan, LifeReadyPlan, RokRaiSoShieldPlan, IWealthyMode } from '@/components/ci/types/useCiTypes';
import { FaVenusMars, FaBirthdayCake, FaFileAlt } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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


// --- Component Definition ---
export default function CIFormPage(props: UseCiPlannerReturn) {
    
    // --- CHANGED: ดึง State และ Actions ทั้งหมดมาจาก props ---
    // ไม่มีการเรียกใช้ useCiPlanner ที่นี่แล้ว
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
        setSelectedCiPlans((prev: CiPlanSelections) => {
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
    if (visibleSectionsCount === 2) { gridColsClass = "lg:grid-cols-2"; } 
    else if (visibleSectionsCount === 3) { gridColsClass = "lg:grid-cols-3"; }


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle className="text-xl text-blue-700">ข้อมูลผู้เอาประกัน</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 items-end">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1"><FaBirthdayCake className="text-blue-600" /> <Label htmlFor="policyholderAge">อายุ (ปี)</Label></div>
                            <Select value={String(policyholderEntryAge)} onValueChange={(value) => setPolicyholderEntryAge(Number(value))}><SelectTrigger id="policyholderAge"><SelectValue /></SelectTrigger><SelectContent>{ageOptionsData.map(age => (<SelectItem key={age} value={String(age)}>{age}</SelectItem>))}</SelectContent></Select>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1"><FaVenusMars className="text-blue-600" /> <Label>เพศ</Label></div>
                            <div className="flex items-center h-9 gap-x-6">
                                <Label className="flex items-center"><input type="radio" name="gender" value="male" checked={policyholderGender === 'male'} onChange={() => setPolicyholderGender('male')} className="form-radio" /> <span className="ml-2">ชาย</span></Label>
                                <Label className="flex items-center"><input type="radio" name="gender" value="female" checked={policyholderGender === 'female'} onChange={() => setPolicyholderGender('female')} className="form-radio" /> <span className="ml-2">หญิง</span></Label>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1"><FaFileAlt className="text-blue-600" /> <Label htmlFor="policyOriginModeSwitch">ประเภทกรมธรรม์</Label></div>
                            <div className="flex items-center h-9 space-x-2"><Switch id="policyOriginModeSwitch" checked={policyOriginMode === 'newPolicy'} onCheckedChange={(c) => setPolicyOriginMode(c ? 'newPolicy' : 'existingPolicy')} /> <Label>{policyOriginMode === 'existingPolicy' ? 'ใช้สัญญาหลักเดิม' : 'สร้างแผนใหม่'}</Label></div>
                        </div>
                        {policyOriginMode === 'existingPolicy' && (
                            <div>
                                <Label htmlFor="existingAge">อายุแรกเข้าเดิม</Label>
                                <Input id="existingAge" type="number" value={existingPolicyEntryAge ?? ''} onChange={(e) => setExistingPolicyEntryAge(e.target.value ? Number(e.target.value) : undefined)} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className={`grid gap-6 grid-cols-1 ${gridColsClass}`}>
                <Card>
                    <CardHeader><CardTitle className="text-lg">{getSectionTitle("วางแผนดูแลโรคร้าย")}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><div className="flex items-center space-x-2"><Checkbox id="icareChecked" checked={selectedCiPlans.icareChecked} onCheckedChange={(c) => handleCiSelectionChange('icareChecked', !!c)} /><Label htmlFor="icareChecked">iCare</Label></div>{selectedCiPlans.icareChecked && <div className="pl-6"><Select value={String(selectedCiPlans.icareSA)} onValueChange={v => handleCiSelectionChange('icareSA', Number(v))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ICarePlansData.map(p => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}</SelectContent></Select></div>}</div>
                        <Separator />
                        <div className="space-y-2"><div className="flex items-center space-x-2"><Checkbox id="ishieldChecked" checked={selectedCiPlans.ishieldChecked} onCheckedChange={c => handleCiSelectionChange('ishieldChecked', !!c)} /><Label htmlFor="ishieldChecked">iShield</Label></div>{selectedCiPlans.ishieldChecked && <div className="pl-6 space-y-2"><Select value={selectedCiPlans.ishieldPlan || ''} onValueChange={v => handleCiSelectionChange('ishieldPlan', v as IShieldPlan)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{IShieldPlanOptionsData.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select><Input type="number" value={selectedCiPlans.ishieldSA} onChange={e=>handleCiSelectionChange('ishieldSA', Number(e.target.value))} /></div>}</div>
                        <Separator />
                        <div className="space-y-1"><div className="flex items-center space-x-2"><Checkbox id="mainRiderChecked" checked={selectedCiPlans.mainRiderChecked} onCheckedChange={c => handleCiSelectionChange('mainRiderChecked', !!c)} /><Label htmlFor="mainRiderChecked">LifeReady และสัญญาเพิ่มเติมอื่นๆ</Label></div><p className="text-xs text-muted-foreground pl-7">สัญญาหลักสำหรับ RokRaiSoShield, DCI</p></div>
                        <Separator />
                        <div><div className="flex items-center gap-1.5 mb-1"><FaWandMagicSparkles /><Label>วางแผนด้วย iWealthy</Label></div><div className="flex items-center space-x-2 mt-2.5"><Switch id="iwealthy-toggle" checked={useIWealthy} onCheckedChange={setUseIWealthy} /><Label htmlFor="iwealthy-toggle">{useIWealthy ? 'ใช้' : 'ไม่ใช้'}</Label></div></div>
                    </CardContent>
                </Card>

                {isCol2Visible && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">{getSectionTitle("สัญญาหลักและ CI เพิ่มเติม")}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-md space-y-3"><p>LifeReady (สัญญาหลัก)</p><div><Label>ระยะเวลาชำระเบี้ย</Label><Select value={String(selectedCiPlans.lifeReadyPlan)} onValueChange={v => handleCiSelectionChange('lifeReadyPlan', Number(v) as LifeReadyPlan)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{LifeReadyPlanOptionsData.map(p=><SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}</SelectContent></Select></div><div><Label>ทุนประกัน</Label><Input type="number" value={selectedCiPlans.lifeReadySA} onChange={e=>handleCiSelectionChange('lifeReadySA', Number(e.target.value))} /></div></div>
                            <Separator/>
                            <div className="space-y-2"><div className="flex items-center space-x-2"><Checkbox id="rokraiChecked" checked={selectedCiPlans.rokraiChecked} onCheckedChange={c=>handleCiSelectionChange('rokraiChecked', !!c)} /><Label htmlFor="rokraiChecked">RokRaiSoShield</Label></div>{selectedCiPlans.rokraiChecked && <div className="pl-7"><Select value={selectedCiPlans.rokraiPlan||''} onValueChange={v=>handleCiSelectionChange('rokraiPlan', v as RokRaiSoShieldPlan)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{RokRaiSoShieldPlanOptionsData.map(p=><SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>}</div>
                            <Separator/>
                            <div className="space-y-2"><div className="flex items-center space-x-2"><Checkbox id="dciChecked" checked={selectedCiPlans.dciChecked} onCheckedChange={c=>handleCiSelectionChange('dciChecked', !!c)} /><Label htmlFor="dciChecked">DCI</Label></div>{selectedCiPlans.dciChecked && <div className="pl-7"><Input type="number" value={selectedCiPlans.dciSA} onChange={e=>handleCiSelectionChange('dciSA', Number(e.target.value))} /></div>}</div>
                        </CardContent>
                    </Card>
                )}

                {isCol3Visible && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">{getSectionTitle("ตั้งค่า iWealthy")}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs value={iWealthyMode} onValueChange={v => setIWealthyMode(v as IWealthyMode)}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="automatic">Auto</TabsTrigger><TabsTrigger value="manual">Manual</TabsTrigger></TabsList></Tabs>
                            <div className="mt-4 space-y-3">
                                <div><Label>ผลตอบแทนที่คาดหวัง (%)</Label><Input type="number" value={iWealthyInvestmentReturn} onChange={e => setIWealthyInvestmentReturn(Number(e.target.value))} /></div>
                                <div><Label>ระยะเวลาชำระเบี้ย iWealthy (ปี)</Label><Input type="number" value={iWealthyOwnPPT} onChange={e => setIWealthyOwnPPT(Number(e.target.value))} /></div>
                                {iWealthyMode === 'manual' && <div><Label>อายุที่เริ่มถอน</Label><Input type="number" value={iWealthyWithdrawalStartAge} onChange={e => setIWealthyWithdrawalStartAge(Number(e.target.value))} /></div>}
                                {iWealthyMode === 'manual' && <div className="pt-3 border-t"><h3 className="font-semibold">กำหนดเบี้ย (Manual)</h3><div><Label>RPP ต่อปี</Label><Input type="number" value={manualRpp} onChange={e => setManualRpp(Number(e.target.value))} /></div><div><Label>RTU ต่อปี</Label><Input type="number" value={manualRtu} onChange={e => setManualRtu(Number(e.target.value))} /></div></div>}
                                {iWealthyMode === 'automatic' && <div className="pt-3 border-t"><h3 className="font-semibold">กำหนดสัดส่วน (Auto)</h3><div><Label>RPP : RTU</Label><Select value={autoRppRtuRatio} onValueChange={setAutoRppRtuRatio}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="100:0">100:0</SelectItem><SelectItem value="80:20">80:20</SelectItem></SelectContent></Select></div></div>}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card className="mt-10">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center ...">
                    <div><p>เบี้ย CI รวมปีแรก: {formatNumber(firstYearCiPremium)} บาท</p>{useIWealthy && iWealthySummaryText && ( <p>{iWealthySummaryText}</p> )}</div>
                    <Button onClick={runCalculation} disabled={isLoading} size="lg"><CalculatorIcon />{isLoading ? 'กำลังคำนวณ...' : 'แสดงภาพประกอบการขาย'}</Button>
                </CardContent>
            </Card>

            {error && <Alert variant="destructive"><AlertTitle>Error!</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </div>
    );
}