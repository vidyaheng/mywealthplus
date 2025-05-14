// src/components/InvestmentReturnInput.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Slider } from '@/components/ui/slider'; // ตรวจสอบ path
import { Label } from '@/components/ui/label'; // ตรวจสอบ path
import { cn } from "@/lib/utils"; // Optional: for combining class names

interface InvestmentReturnInputProps {
    label?: string;
    value: number;
    onChange: (newValue: number) => void;
    min?: number;
    max?: number;
    step?: number; // Step for the slider component
    inputStep?: number; // Step for the number input field
    displayPrecision?: number;
    showInputField?: boolean;
    sliderOnlyCompact?: boolean;
}

// ค่าคงที่ (Constants)
const MIN_VALUE_DEFAULT = 0;
const MAX_VALUE_DEFAULT = 10;
//const INPUT_STEP_DEFAULT = 0.01;
const SNAP_THRESHOLD_DEFAULT = 0.05; // For general snapping to .0 or .5
const SLIDER_STEP_DEFAULT = 0.01;    // Default step for the slider
const DISPLAY_PRECISION_DEFAULT = 2;

export default function InvestmentReturnInput({
    label = "ผลตอบแทนการลงทุนคาดหวัง (% ต่อปี)",
    value,
    onChange,
    min = MIN_VALUE_DEFAULT,
    max = MAX_VALUE_DEFAULT,
    step = SLIDER_STEP_DEFAULT, // This is the actual slider step
    //inputStep = INPUT_STEP_DEFAULT,
    displayPrecision = DISPLAY_PRECISION_DEFAULT,
    showInputField = true,
    sliderOnlyCompact = false,
}: InvestmentReturnInputProps) {
    const [inputValue, setInputValue] = useState<string>(value.toFixed(displayPrecision));

    // The actual step value used by the slider, crucial for epsilon calculation
    const currentSliderStep = step;

    const snapValue = useCallback((val: number): number => {
        const epsilon = currentSliderStep / 2; // e.g., 0.01 / 2 = 0.005, for precise matching

        // Round initial val to a higher precision to mitigate floating point issues for calculations
        const workingPrecision = Math.max(displayPrecision + 2, 4);
        const roundedVal = parseFloat(val.toFixed(workingPrecision));

        const integerPart = Math.floor(roundedVal);
        const decimalPart = parseFloat((roundedVal - integerPart).toFixed(workingPrecision));

        // --- Custom Snapping Rules ---
        // Rule: x.35 -> x.50
        if (Math.abs(decimalPart - 0.35) < epsilon) {
            return parseFloat((integerPart + 0.50).toFixed(displayPrecision));
        }
        // Rule: x.85 -> (x+1).00
        if (Math.abs(decimalPart - 0.85) < epsilon) {
            return parseFloat((integerPart + 1.00).toFixed(displayPrecision));
        }
        // Rule: x.15 -> x.00
        if (Math.abs(decimalPart - 0.15) < epsilon) {
            return parseFloat((integerPart + 0.00).toFixed(displayPrecision));
        }
        // Rule: x.65 -> x.50
        if (Math.abs(decimalPart - 0.65) < epsilon) {
            return parseFloat((integerPart + 0.50).toFixed(displayPrecision));
        }

        // --- Fallback to Original General Snapping Logic (snapToHalfOrWhole) ---
        if (SNAP_THRESHOLD_DEFAULT > 0) {
            const remainder = roundedVal % 0.5;
            // Correct remainder for floating point inaccuracies before comparison
            const correctedRemainder = parseFloat(remainder.toFixed(workingPrecision));

            if (correctedRemainder <= SNAP_THRESHOLD_DEFAULT || correctedRemainder >= (0.5 - SNAP_THRESHOLD_DEFAULT)) {
                const snappedToHalfOrWhole = Math.round(roundedVal * 2) / 2;
                return parseFloat(snappedToHalfOrWhole.toFixed(displayPrecision));
            }
        }

        // If no snapping rules apply, return the value formatted to displayPrecision
        return parseFloat(roundedVal.toFixed(displayPrecision));
    }, [currentSliderStep, displayPrecision]);

    useEffect(() => {
        const currentNumericInputValue = parseFloat(inputValue);
        const valueAsFixedString = value.toFixed(displayPrecision);
        // Update inputValue if it's NaN, significantly different, or not matching the exact string format of `value`
        if (isNaN(currentNumericInputValue) ||
            Math.abs(currentNumericInputValue - value) > (currentSliderStep / 10) || // Tolerance for float comparison
            inputValue !== valueAsFixedString) {
            setInputValue(valueAsFixedString);
        }
    }, [value, displayPrecision, inputValue, currentSliderStep]);

    const updateValue = useCallback((newValue: number) => {
        let clampedValue = Math.max(min, Math.min(max, newValue));
        // Ensure the final value sent to onChange is also precisely formatted
        clampedValue = parseFloat(clampedValue.toFixed(displayPrecision));

        const valueAsFixedString = value.toFixed(displayPrecision);
        const clampedValueAsFixedString = clampedValue.toFixed(displayPrecision);

        // Check if there's a meaningful change before calling onChange
        if (clampedValueAsFixedString !== valueAsFixedString) {
            onChange(clampedValue);
        } else if (inputValue !== valueAsFixedString) {
            // If underlying 'value' didn't change but 'inputValue' is out of sync (e.g. user typed "5" for value 5.00)
            // This can be triggered by blur if parsed input results in same snapped value.
            setInputValue(valueAsFixedString);
        }
    }, [onChange, value, min, max, displayPrecision, inputValue]);


    const handleSliderChange = useCallback((values: number[]) => {
        updateValue(snapValue(values[0]));
    }, [updateValue, snapValue]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        // Allow more flexible typing, validation and formatting will happen on blur
        if (rawValue === '' || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
            setInputValue(rawValue);
        }
    }, []);

    const handleInputBlur = useCallback(() => {
        let parsedValue = parseFloat(inputValue);
        if (!isNaN(parsedValue)) {
            const snappedOnBlur = snapValue(parsedValue); // Apply snapping
            // Clamping should happen after snapping to ensure snapped value is within bounds
            const clampedValue = Math.max(min, Math.min(max, snappedOnBlur));
            updateValue(clampedValue);
            // If updateValue doesn't cause an immediate re-render that updates inputValue via useEffect,
            // we might need to set it directly here for responsiveness.
            // However, the useEffect should handle it.
            // Forcing inputValue to the final clamped and formatted value.
            setInputValue(clampedValue.toFixed(displayPrecision));
        } else {
            // Reset to current valid prop value if input is invalid
            setInputValue(value.toFixed(displayPrecision));
        }
    }, [inputValue, snapValue, updateValue, value, min, max, displayPrecision]);

    const isCompactSliderOnly = sliderOnlyCompact && !showInputField;

    return (
        <div className={cn("w-full", isCompactSliderOnly ? "space-y-0.5" : "space-y-1")}>
            {label && (
                <div className="flex justify-between items-center mb-1">
                    <Label
                        htmlFor={`investment-return-slider-${label.replace(/\s+/g, '-')}`}
                        className={cn(
                            "block font-medium text-gray-700 truncate",
                            isCompactSliderOnly ? "text-[11px]" : "text-xs"
                        )}
                    >
                        {label}
                    </Label>
                    {(!showInputField || isCompactSliderOnly) && (
                         <span className={cn(
                            "font-semibold",
                            isCompactSliderOnly ? "text-[11px] text-blue-700" : "text-xs text-blue-600"
                         )}>
                             {value.toFixed(displayPrecision)}%
                         </span>
                    )}
                </div>
            )}

            <div className={`flex items-center w-full ${showInputField ? 'gap-x-2 sm:gap-x-3' : ''}`}>
                <div className={`${showInputField ? 'flex-1' : 'w-full'}`}>
                    <Slider
                        id={`investment-return-slider-${label ? label.replace(/\s+/g, '-') : 'default'}`}
                        value={[value]}
                        onValueChange={handleSliderChange}
                        min={min}
                        max={max}
                        step={currentSliderStep} // Use the actual slider step from props
                        className={cn(
                            "w-full cursor-pointer",
                            isCompactSliderOnly ? "h-3" : "h-4"
                        )}
                    />
                    {!isCompactSliderOnly && (
                        <div className="flex justify-between text-[10px] text-gray-500 px-0.5 mt-0.5">
                            <span>{min.toFixed(displayPrecision)}%</span>
                            <span>{max.toFixed(displayPrecision)}%</span>
                        </div>
                    )}
                </div>

                {showInputField && (
                    <div className="flex items-center gap-x-1 w-auto flex-shrink-0">
                        <input
                            type="text" // Using text allows for more control over input, parsing to number later
                            inputMode="decimal" // Helps mobile keyboards show decimal input
                            value={inputValue}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            className="w-[50px] sm:w-[60px] h-7 mb-4 bg-blue-50 text-md sm:text-lg text-blue-700 font-semibold border-b-2 border-gray-600 focus:border-blue-600 text-center outline-none transition-colors focus:bg-blue-100"
                        />
                        <span className="text-xs sm:text-sm text-gray-700">%</span>
                    </div>
                )}
            </div>
        </div>
    );
}