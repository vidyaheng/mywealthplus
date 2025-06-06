import React, { useState, useCallback, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";

// --- ไม่มีการเปลี่ยนแปลง props และค่า default ---
interface InvestmentReturnInputProps {
    label?: string;
    value: number;
    onChange: (newValue: number) => void;
    min?: number;
    max?: number;
    step?: number;
    displayPrecision?: number;
    showInputField?: boolean;
    sliderOnlyCompact?: boolean;
    isFullScreenView?: boolean;
}

const MIN_VALUE_DEFAULT = 0;
const MAX_VALUE_DEFAULT = 10;
const SNAP_THRESHOLD_DEFAULT = 0.05;
const SLIDER_STEP_DEFAULT = 0.01;
const DISPLAY_PRECISION_DEFAULT = 2;


export default function InvestmentReturnInput({
    label = "ผลตอบแทนการลงทุนคาดหวัง (% ต่อปี)",
    value,
    onChange,
    min = MIN_VALUE_DEFAULT,
    max = MAX_VALUE_DEFAULT,
    step = SLIDER_STEP_DEFAULT,
    displayPrecision = DISPLAY_PRECISION_DEFAULT,
    showInputField = true,
    sliderOnlyCompact = false,
    isFullScreenView = false,
}: InvestmentReturnInputProps) {
    // `inputValue` ยังคงเป็น state ภายในสำหรับแสดงผลในช่อง input
    // เพื่อให้ผู้ใช้สามารถพิมพ์ค่าที่ยังไม่สมบูรณ์ได้ เช่น "5."
    const [inputValue, setInputValue] = useState<string>(value.toFixed(displayPrecision));

    // ✅ [แก้ไข] : ทำให้ useEffect ทำงานเมื่อ `value` จาก parent เปลี่ยนเท่านั้น
    // หน้าที่ของมันคือ "ซิงค์" ค่าจาก Slider มาที่ Input field
    useEffect(() => {
        // อัปเดตค่าในช่อง input ให้ตรงกับ state หลัก (value)
        // โดยจะทำงานเมื่อมีการเลื่อน Slider หรือค่าเริ่มต้นมีการเปลี่ยนแปลง
        // เราจะเปรียบเทียบค่าตัวเลข เพื่อป้องกันการ re-render ที่ไม่จำเป็น
        if (parseFloat(inputValue) !== value) {
            setInputValue(value.toFixed(displayPrecision));
        }
    }, [value, displayPrecision]);


    const updateValue = useCallback((newValue: number) => {
        // Clamp คือการจำกัดค่าให้อยู่ในขอบเขต min-max
        const clampedValue = Math.max(min, Math.min(max, newValue));
        if (clampedValue !== value) {
            onChange(clampedValue);
        }
    }, [onChange, value, min, max]);

    // `snapValue` ไม่มีการเปลี่ยนแปลง
    const snapValue = useCallback((val: number): number => {
        const epsilon = step / 2;
        const workingPrecision = Math.max(displayPrecision + 2, 4);
        const roundedVal = parseFloat(val.toFixed(workingPrecision));
        const integerPart = Math.floor(roundedVal);
        const decimalPart = parseFloat((roundedVal - integerPart).toFixed(workingPrecision));
        if (Math.abs(decimalPart - 0.35) < epsilon) return parseFloat((integerPart + 0.50).toFixed(displayPrecision));
        if (Math.abs(decimalPart - 0.85) < epsilon) return parseFloat((integerPart + 1.00).toFixed(displayPrecision));
        if (Math.abs(decimalPart - 0.15) < epsilon) return parseFloat((integerPart + 0.00).toFixed(displayPrecision));
        if (Math.abs(decimalPart - 0.65) < epsilon) return parseFloat((integerPart + 0.50).toFixed(displayPrecision));
        if (SNAP_THRESHOLD_DEFAULT > 0) {
            const remainder = roundedVal % 0.5;
            const correctedRemainder = parseFloat(remainder.toFixed(workingPrecision));
            if (correctedRemainder <= SNAP_THRESHOLD_DEFAULT || correctedRemainder >= (0.5 - SNAP_THRESHOLD_DEFAULT)) {
                const snappedToHalfOrWhole = Math.round(roundedVal * 2) / 2;
                return parseFloat(snappedToHalfOrWhole.toFixed(displayPrecision));
            }
        }
        return parseFloat(roundedVal.toFixed(displayPrecision));
    }, [step, displayPrecision]);


    // `handleSliderChange` ไม่มีการเปลี่ยนแปลงมากนัก
    const handleSliderChange = useCallback((values: number[]) => {
        updateValue(snapValue(values[0]));
    }, [updateValue, snapValue]);


    // ✅ [แก้ไข] : ทำให้ Input อัปเดตค่ากลับไปที่ parent ทันที
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setInputValue(rawValue); // 1. อัปเดตสิ่งที่ผู้ใช้เห็นในช่อง input ทันที

        // 2. ถ้าค่าที่พิมพ์เป็นตัวเลข, ให้ส่งค่ากลับไปที่ parent เลย
        const parsedValue = parseFloat(rawValue);
        if (!isNaN(parsedValue)) {
            updateValue(parsedValue); // การเรียกฟังก์ชันนี้จะทำให้ Slider ขยับตาม
        }
    }, [updateValue]);


    // ✅ [แก้ไข] : ทำให้ onBlur จัดการเรื่องการ format และค่าที่ไม่ถูกต้อง
    const handleInputBlur = useCallback(() => {
        const parsedValue = parseFloat(inputValue);
        if (!isNaN(parsedValue)) {
            // ถ้าค่าถูกต้อง, ให้ทำการ snap และ clamp ค่าสุดท้าย
            const snappedOnBlur = snapValue(parsedValue);
            updateValue(snappedOnBlur); // ส่งค่าสุดท้ายที่จัดรูปแบบแล้วกลับไป
            // ไม่ต้อง setInputValue ที่นี่ เพราะ useEffect จะจัดการให้เองเมื่อ `value` prop เปลี่ยน
        } else {
            // ถ้าผู้ใช้พิมพ์ค่าผิด หรือลบจนหมด, ให้ค่ากลับไปเป็น state ล่าสุดที่ถูกต้อง
            setInputValue(value.toFixed(displayPrecision));
        }
    }, [inputValue, snapValue, updateValue, value, displayPrecision]);

    // --- ส่วนของ JSX และ Classes ไม่มีการเปลี่ยนแปลง ---
    const isCompactSliderOnlyMode = sliderOnlyCompact && !showInputField;

    const labelClasses = cn(
        "block font-medium truncate",
        isCompactSliderOnlyMode ? "text-[11px]" : "text-xs",
        isFullScreenView ? "text-gray-200" : "text-gray-700"
    );
    const valueDisplayClasses = cn(
        "font-semibold",
        isCompactSliderOnlyMode ? "text-[11px]" : "text-xs",
        isFullScreenView ? "text-sky-300" : (isCompactSliderOnlyMode ? "text-blue-700" : "text-blue-600")
    );
    const minMaxTextClasses = cn(
        "flex justify-between text-[10px] px-0.5 mt-0.5",
        isFullScreenView ? "text-gray-300" : "text-gray-500"
    );
    const sliderWrapperClasses = cn(
        isFullScreenView && "dark-slider-wrapper-for-variables"
    );
    const sliderComponentClasses = cn(
        "w-full cursor-pointer",
        isCompactSliderOnlyMode ? "h-3" : "h-4",
        isFullScreenView && "slider-dark-theme"
    );
    const inputFieldClasses = cn(
        "h-7 text-center outline-none transition-colors focus:bg-opacity-20",
        isFullScreenView ?
        "w-[50px] bg-blue-800 text-white border-b-2 border-blue-600 focus:border-sky-400 focus:bg-blue-700" :
        "w-[50px] sm:w-[60px] bg-blue-50 text-md sm:text-lg text-blue-700 font-semibold border-b-2 border-gray-600 focus:border-blue-600 focus:bg-blue-100"
    );
    const percentSignClasses = cn(
        "text-xs sm:text-sm",
        isFullScreenView ? "text-gray-300" : "text-gray-700"
    );

    return (
        <div className={cn("w-full", isCompactSliderOnlyMode ? "space-y-0.5" : "space-y-1")}>
            {label && (
                <div className="flex justify-between items-center mb-1">
                    <Label
                        htmlFor={`investment-return-slider-${label.replace(/\s+/g, '-')}`}
                        className={labelClasses}
                    >
                        {label}
                    </Label>
                    {(!showInputField || isCompactSliderOnlyMode) && (
                         <span className={valueDisplayClasses}>
                             {value.toFixed(displayPrecision)}%
                         </span>
                    )}
                </div>
            )}

            <div className={`flex items-center w-full ${showInputField && !isFullScreenView ? 'gap-x-2 sm:gap-x-3' : ''}`}>
                <div className={`${showInputField && !isFullScreenView ? 'flex-1' : 'w-full'}`}>
                    <div className={sliderWrapperClasses}>
                        <Slider
                            id={`investment-return-slider-${label ? label.replace(/\s+/g, '-') : 'default'}`}
                            value={[value]}
                            onValueChange={handleSliderChange}
                            min={min}
                            max={max}
                            step={step}
                            className={sliderComponentClasses}
                        />
                    </div>
                    {!isCompactSliderOnlyMode && (
                        <div className={minMaxTextClasses}>
                            <span>{min.toFixed(displayPrecision)}%</span>
                            <span>{max.toFixed(displayPrecision)}%</span>
                        </div>
                    )}
                </div>

                {showInputField && !isFullScreenView && (
                    <div className="flex items-center mb-3 gap-x-1 w-auto flex-shrink-0">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={inputValue}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            className={inputFieldClasses}
                        />
                        <span className={percentSignClasses}>%</span>
                    </div>
                )}
            </div>
        </div>
    );
}