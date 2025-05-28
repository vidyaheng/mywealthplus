// src/components/InvestmentReturnInput.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";

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
    isFullScreenView?: boolean; // Prop เพื่อบอกว่าเป็น Fullscreen view หรือไม่
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
    showInputField = true, // ใน ModalChartControls สำหรับ Fullscreen คุณตั้งค่านี้เป็น false
    sliderOnlyCompact = false,
    isFullScreenView = false, // Default เป็น false
}: InvestmentReturnInputProps) {
    const [inputValue, setInputValue] = useState<string>(value.toFixed(displayPrecision));
    const currentSliderStep = step;

    const snapValue = useCallback((val: number): number => {
        const epsilon = currentSliderStep / 2;
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
    }, [currentSliderStep, displayPrecision]);

    useEffect(() => {
        const currentNumericInputValue = parseFloat(inputValue);
        const valueAsFixedString = value.toFixed(displayPrecision);
        if (isNaN(currentNumericInputValue) || Math.abs(currentNumericInputValue - value) > (currentSliderStep / 10) || inputValue !== valueAsFixedString) {
            setInputValue(valueAsFixedString);
        }
    }, [value, displayPrecision, inputValue, currentSliderStep]);

    const updateValue = useCallback((newValue: number) => {
        let clampedValue = Math.max(min, Math.min(max, newValue));
        clampedValue = parseFloat(clampedValue.toFixed(displayPrecision));
        const valueAsFixedString = value.toFixed(displayPrecision);
        const clampedValueAsFixedString = clampedValue.toFixed(displayPrecision);
        if (clampedValueAsFixedString !== valueAsFixedString) {
            onChange(clampedValue);
        } else if (inputValue !== valueAsFixedString) {
            setInputValue(valueAsFixedString);
        }
    }, [onChange, value, min, max, displayPrecision, inputValue]);

    const handleSliderChange = useCallback((values: number[]) => {
        updateValue(snapValue(values[0]));
    }, [updateValue, snapValue]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        if (rawValue === '' || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
            setInputValue(rawValue);
        }
    }, []);

    const handleInputBlur = useCallback(() => {
        let parsedValue = parseFloat(inputValue);
        if (!isNaN(parsedValue)) {
            const snappedOnBlur = snapValue(parsedValue);
            const clampedValue = Math.max(min, Math.min(max, snappedOnBlur));
            updateValue(clampedValue);
            setInputValue(clampedValue.toFixed(displayPrecision));
        } else {
            setInputValue(value.toFixed(displayPrecision));
        }
    }, [inputValue, snapValue, updateValue, value, min, max, displayPrecision]);

    const isCompactSliderOnlyMode = sliderOnlyCompact && !showInputField;

    // กำหนดสีและสไตล์ตาม isFullScreenView
    const labelClasses = cn(
        "block font-medium truncate",
        isCompactSliderOnlyMode ? "text-[11px]" : "text-xs",
        isFullScreenView ? "text-gray-200" : "text-gray-700" // สี Label
    );
    const valueDisplayClasses = cn(
        "font-semibold",
        isCompactSliderOnlyMode ? "text-[11px]" : "text-xs",
        isFullScreenView ? "text-sky-300" : (isCompactSliderOnlyMode ? "text-blue-700" : "text-blue-600") // สี Value ข้าง Label
    );
    const minMaxTextClasses = cn(
        "flex justify-between text-[10px] px-0.5 mt-0.5",
        isFullScreenView ? "text-gray-300" : "text-gray-500" // สี Min/Max text
    );
    const sliderWrapperClasses = cn( // Class สำหรับ div ครอบ Slider โดยตรง
        isFullScreenView && "dark-slider-wrapper-for-variables" // Class นี้อาจจะไม่จำเป็นถ้า Slider ไม่ตอบสนองต่อ .dark โดยตรง
                                                              // หรือจะใช้ class นี้เพื่อ scope CSS Variables ถ้าจำเป็น
    );
     const sliderComponentClasses = cn(
        "w-full cursor-pointer",
        isCompactSliderOnlyMode ? "h-3" : "h-4",
        isFullScreenView && "slider-dark-theme" // << Class หลักสำหรับ Custom CSS ใน index.css
    );
    const inputFieldClasses = cn(
        "h-7 text-center outline-none transition-colors focus:bg-opacity-20",
        isFullScreenView ? // ใน Fullscreen มักจะ showInputField={false} อยู่แล้ว แต่เผื่อไว้
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
                    <div className={sliderWrapperClasses}> {/* Wrapper นี้อาจจะใช้ใส่ .dark หรือ custom CSS vars */}
                        <Slider
                            id={`investment-return-slider-${label ? label.replace(/\s+/g, '-') : 'default'}`}
                            value={[value]}
                            onValueChange={handleSliderChange}
                            min={min}
                            max={max}
                            step={currentSliderStep}
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