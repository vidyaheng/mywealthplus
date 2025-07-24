// src/components/GraphControlLTHC.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox";

// --- Type Definitions ---
interface ControlsState {
    showPremiums: boolean;
    showHealthPremiumAlone: boolean;
    showLthcCombinedPremium: boolean;
    showLthcHealthPaidByUser: boolean;
    showIWealthyPremium: boolean;
    showPensionPremium: boolean;
    showDeathBenefits: boolean;
    showHealthDeathBenefit: boolean;
    showLthcDeathBenefit: boolean;
    showAccountValue: boolean;
    showIWealthyAV: boolean;
    showPensionCSV: boolean;
    showIWealthyWithdrawal: boolean;
    showPensionAnnuity: boolean;
    showHybridWithdrawal: boolean;
}

interface GraphControlsProps {
    controls: ControlsState;
    handleControlChange: (key: keyof ControlsState, value: boolean) => void;
    fundingSource: string | null;
    lineColors: Record<string, string>;
}

// --- Helper Sub-component (ไม่มีการเปลี่ยนแปลง) ---
const ControlItem = ({ id, checked, onCheckedChange, label, color }: { id: string, checked: boolean, onCheckedChange: (val: boolean) => void, label: string, color: string }) => (
    <div className="flex items-center space-x-2 py-0.5 cursor-pointer" onClick={() => onCheckedChange(!checked)}>
        <Checkbox 
            id={id} 
            checked={checked} 
            onCheckedChange={onCheckedChange}
            style={{ '--checkbox-color': color } as React.CSSProperties} 
            className="h-3.5 w-3.5 rounded-sm border-gray-400 data-[state=checked]:text-white data-[state=checked]:border-transparent lthc-checkbox" 
        />
        <Label htmlFor={id} className="text-xs cursor-pointer" style={{ color: checked ? '#374151' : '#6b7280' }}>
            {label}
        </Label>
    </div>
);

// --- Main Controls Component (แก้ไขการเรียกใช้ ControlItem) ---
export const GraphControls: React.FC<GraphControlsProps> = ({ controls, handleControlChange, fundingSource, lineColors }) => {
    const showPension = fundingSource === 'pension' || fundingSource === 'hybrid';
    const showIWealthy = fundingSource === 'iWealthy' || fundingSource === 'hybrid';

    return (
        <Card className="h-full flex flex-col bg-slate-50 shadow-sm">
            <CardHeader className="p-3 border-b">
                <CardTitle className="text-base text-slate-800">ตัวเลือกแสดงผลกราฟ</CardTitle>
            </CardHeader>

            <CardContent className="flex-grow overflow-y-auto p-3 space-y-3">
                {/* --- กลุ่มเบี้ยประกัน --- */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="font-medium text-sm text-slate-700">เบี้ยสะสม</Label>
                        <Switch id="show-premiums" checked={controls.showPremiums} onCheckedChange={(val) => handleControlChange('showPremiums', val)} className="data-[state=checked]:bg-blue-600 h-4 w-7 thumb:w-3 thumb:h-3" />
                    </div>
                    {controls.showPremiums && (
                        <div className="pl-3 space-y-1 mt-1">
                            {/* +++ CHANGED: แก้ไข Props ที่ส่งให้ ControlItem +++ */}
                            <ControlItem id="showHealthPremiumAlone" label="แผนสุขภาพ (อย่างเดียว)" color={lineColors.healthPremiumAlone} checked={controls.showHealthPremiumAlone} onCheckedChange={(v) => handleControlChange('showHealthPremiumAlone', v)} />
                            <ControlItem id="showLthcCombinedPremium" label="แผน LTHC (รวม)" color={lineColors.lthcCombinedPremium} checked={controls.showLthcCombinedPremium} onCheckedChange={(v) => handleControlChange('showLthcCombinedPremium', v)} />
                            <div className="pl-4 space-y-1 border-l ml-2">
                                <ControlItem id="showLthcHealthPaidByUser" label="แผนสุขภาพ (แบบLTHC)" color={lineColors.lthcHealthPaidByUser} checked={controls.showLthcHealthPaidByUser} onCheckedChange={(v) => handleControlChange('showLthcHealthPaidByUser', v)} />
                                {showIWealthy && <ControlItem id="showIWealthyPremium" label="เบี้ย iWealthy" color={lineColors.iWealthyPremium} checked={controls.showIWealthyPremium} onCheckedChange={(v) => handleControlChange('showIWealthyPremium', v)} />}
                                {showPension && <ControlItem id="showPensionPremium" label="เบี้ยบำนาญ" color={lineColors.pensionPremium} checked={controls.showPensionPremium} onCheckedChange={(v) => handleControlChange('showPensionPremium', v)} />}
                            </div>
                        </div>
                    )}
                </div>

                <Separator className="bg-slate-200" />

                {/* --- กลุ่มความคุ้มครองชีวิต --- */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="font-medium text-sm text-slate-700">ความคุ้มครองชีวิต</Label>
                        <Switch checked={controls.showDeathBenefits} onCheckedChange={(val) => handleControlChange('showDeathBenefits', val)} className="data-[state=checked]:bg-blue-600 h-4 w-7 thumb:w-3 thumb:h-3" />
                    </div>
                    {controls.showDeathBenefits && (
                         <div className="pl-3 space-y-1 mt-1">
                            <ControlItem id="showHealthDeathBenefit" label="แผนสุขภาพ" color={lineColors.healthDeathBenefit} checked={controls.showHealthDeathBenefit} onCheckedChange={(v) => handleControlChange('showHealthDeathBenefit', v)} />
                            <ControlItem id="showLthcDeathBenefit" label="แผน LTHC" color={lineColors.lthcDeathBenefit} checked={controls.showLthcDeathBenefit} onCheckedChange={(v) => handleControlChange('showLthcDeathBenefit', v)} />
                        </div>
                    )}
                </div>
                
                <Separator className="bg-slate-200" />

                {/* --- กลุ่มมูลค่าและเงินถอน --- */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="font-medium text-sm text-slate-700">มูลค่าและเงินถอน</Label>
                        <Switch checked={controls.showAccountValue} onCheckedChange={(val) => handleControlChange('showAccountValue', val)} className="data-[state=checked]:bg-blue-600 h-4 w-7 thumb:w-3 thumb:h-3" />
                    </div>
                    {controls.showAccountValue && (
                        <div className="pl-3 space-y-1 mt-1">
                            {showIWealthy && <ControlItem id="showIWealthyAV" label="มูลค่า iWealthy" color={lineColors.iWealthyAV} checked={controls.showIWealthyAV} onCheckedChange={(v) => handleControlChange('showIWealthyAV', v)} />}
                            {showPension && <ControlItem id="showPensionCSV" label="มูลค่าเวนคืนบำนาญ" color={lineColors.pensionCSV} checked={controls.showPensionCSV} onCheckedChange={(v) => handleControlChange('showPensionCSV', v)} />}
                            {showIWealthy && <ControlItem id="showIWealthyWithdrawal" label="เงินถอนสะสม iWealthy" color={lineColors.iWealthyWithdrawal} checked={controls.showIWealthyWithdrawal} onCheckedChange={(v) => handleControlChange('showIWealthyWithdrawal', v)} />}
                            {showPension && <ControlItem id="showPensionAnnuity" label="เงินบำนาญสะสม" color={lineColors.pensionAnnuity} checked={controls.showPensionAnnuity} onCheckedChange={(v) => handleControlChange('showPensionAnnuity', v)} />}
                            {fundingSource === 'hybrid' && <ControlItem id="showHybridWithdrawal" label="เงินถอนรวมสะสม (Hybrid)" color={lineColors.hybridTotalWithdrawal} checked={controls.showHybridWithdrawal} onCheckedChange={(v) => handleControlChange('showHybridWithdrawal', v)} />}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};