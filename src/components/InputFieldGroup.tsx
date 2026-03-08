// src/components/InputFieldGroup.tsx (ฉบับเต็ม รองรับ ref, onBlur, compact)

import React, { forwardRef, useCallback } from 'react';
// ใช้ NumericFormat สำหรับการใส่ comma และ input ตัวเลข
import { NumericFormat, type OnValueChange, type NumberFormatValues } from 'react-number-format';
// Import Component จาก Shadcn/ui (ถ้าใช้)
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// Import cn utility (ถ้าใช้)
import { cn } from "@/lib/utils"; // ตรวจสอบ path

// --- ส่วนที่ 1: กำหนด Props Interface ---
interface InputFieldGroupProps {
  label?: string;           // ข้อความ Label (optional - ถ้าไม่ใส่ จะไม่แสดง Label)
  value: number | string;   // ค่าปัจจุบันที่แสดงผล
  onChange: (newValue: number) => void; // ฟังก์ชัน Callback เมื่อค่าเปลี่ยน
  step?: number;            // ขนาด step สำหรับปุ่ม +/- (optional, default = 1, ใส่ 0 ถ้าไม่ต้องการปุ่ม)
  unit?: string;            // หน่วย (optional, default = บาท)
  inputId?: string;         // ID สำหรับ Input และ Label (optional)
  inputBgColor?: string;    // Class สีพื้นหลัง Input (optional, default = bg-white)
  compact?: boolean;        // Flag สำหรับโหมด Compact (optional, default = false)
  min?: number;             // ค่าต่ำสุด (optional, default = 0)
  max?: number;             // ค่าสูงสุด (optional, default = Infinity)
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void; // รับ onBlur handler จากข้างนอก
  disabled?: boolean;
  //inputClassName?: string;  // Class เพิ่มเติมสำหรับ Input/NumericFormat
  //buttonClassName?: string; // Class เพิ่มเติมสำหรับปุ่ม +/-
}
// --- จบ ส่วนที่ 1 ---


// --- ส่วนที่ 2: Component Function (ใช้ forwardRef) ---
// ใช้ forwardRef เพื่อให้ Component นี้สามารถรับ ref จากข้างนอก แล้วส่งต่อไปให้ input ข้างในได้
const InputFieldGroup = forwardRef<HTMLInputElement, InputFieldGroupProps>(
  (
    {
      label,
      value,
      onChange,
      step = 1, // ค่า default
      inputId,
      inputBgColor = "bg-white", // ค่า default
      compact = false, // ค่า default
      min = 0,
      max = Infinity,
      onBlur, // รับ onBlur เข้ามา
      disabled,
      //inputClassName,
      //buttonClassName,
    },
    ref // รับ ref เข้ามา
  ) => {

    // --- ส่วนที่ 2.1: Handlers ---
    const handleValueChange = useCallback<OnValueChange>((values: NumberFormatValues) => {
      const newValue = values.floatValue ?? 0;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      // เรียก onChange ของ Parent เฉพาะเมื่อค่าต่างจาก prop value (อาจจะไม่จำเป็นถ้า Effect ที่ App จัดการดีแล้ว)
      const currentValueForCheck = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : value || 0;
      if (clampedValue !== currentValueForCheck) {
          onChange(clampedValue);
      } {/*else if (value.toString() !== clampedValue.toString()) {
         onChange(clampedValue);
      }*/}
    }, [onChange, min, max, value]); // ใส่ value ใน dependency ของ useCallback

    const currentValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : value || 0;

    const handleStepChange = useCallback((direction: 1 | -1) => {
      const currentStep = Math.abs(step) === 0 ? 1 : Math.abs(step);
      if (currentStep === 0) return;
      const newValue = currentValue + (direction * currentStep);
      const clampedValue = Math.max(min, Math.min(max, newValue));
      const decimalPlaces = currentStep % 1 !== 0 ? 2 : 0;
      const formattedValue = parseFloat(clampedValue.toFixed(decimalPlaces));
      onChange(formattedValue);
    }, [currentValue, step, min, max, onChange]); // ใส่ dependencies ให้ครบ
    // --- จบ ส่วนที่ 2.1 ---


    // --- ส่วนที่ 2.2: สร้าง ID ---
    // สร้าง ID อัตโนมัติถ้าไม่ได้ส่ง inputId มา (ใช้กับ label htmlFor)
    const id = inputId || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
    // --- จบ ส่วนที่ 2.2 ---


    // --- ส่วนที่ 2.3: JSX ---
    return (
      // Container หลัก - ไม่ใส่ style เยอะ ให้ parent จัดการ
      <div className="w-full">
        {/* Label: แสดงผลตามเงื่อนไข และปรับ Style ตาม compact */}
        {label && (
           <Label
             htmlFor={id}
             className={cn(
               "block font-medium text-gray-700 w-full truncate", // Base
               compact ? "text-xs mb-0.5" : "text-sm mb-1" // Compact styles
             )}
           >
             {label}
           </Label>
        )}
        {/* Container ของ Input และปุ่ม +/- */}
        <div className={cn(
           "flex items-center justify-center", // Base layout
           compact ? "gap-1" : "gap-1.5" // Conditional gap (ลด gap ลงจากเดิม)
        )}>

          {/* ปุ่มลบ (-) */}
          {step !== 0 && ( // แสดงปุ่มเมื่อ step ไม่ใช่ 0
              <Button
                  variant="outline" size="icon" // ใช้ Shadcn Button
                  onClick={() => handleStepChange(-1)}
                  className={`flex-shrink-0 flex items-center justify-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                    compact? 'w-5 h-5 text-xs bg-gray-200 hover:bg-blue-200' // Compact style
                            : 'w-6 h-6 text-sm bg-gray-300 hover:bg-blue-300' // Normal style
                            }`}
                  type="button"
                  disabled={currentValue <= min} // Disable ปุ่ม
                  aria-label={`Decrease ${label || 'value'}`}
              >
                  <span className={compact ? "text-sm" : "text-md"}>-</span>
              </Button>
          )}

          {/* NumericFormat Input */}
          <NumericFormat
            id={id}
            // ส่ง ref ต่อไปด้วย getInputRef (สำหรับ react-number-format v5+)
            getInputRef={ref}
            value={value}
            onValueChange={handleValueChange}
            onBlur={onBlur} // <<< ส่งต่อ onBlur prop
            disabled={disabled}
            thousandSeparator=","
            decimalScale={0}
            allowNegative={false}
            className={`border-b border-gray-500 text-blue-800 text-center
                      ${compact ? 'w-24 px-2 py-3 text-lg font-semibold' : 'w-28 px-3 py-5 text-lg font-semibold'}
                      ${inputBgColor}
                      focus:outline-none focus:bg-blue-100
                      `} // ใส่สีพื้นหลังจาก prop
                      />

          {/* หน่วย 
          {unit && (
              <span className={cn(
                  "text-gray-600 flex-shrink-0", // ไม่หด
                  compact ? "text-xs" : "text-sm"
              )}>
                  {unit}
              </span>
          )} */}

          {/* ปุ่มบวก (+) */}
           {step !== 0 && (
              <Button
                  variant="outline" size="icon"
                  onClick={() => handleStepChange(1)}
                  className={`flex-shrink-0 flex items-center justify-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                            compact? 'w-5 h-5 text-xs bg-gray-200 hover:bg-blue-200' // Compact style
                                    : 'w-6 h-6 text-sm bg-gray-300 hover:bg-blue-300' // Normal style
                  }`}
                  type="button"
                  disabled={currentValue >= max} // Disable ปุ่ม
                  aria-label={`Increase ${label || 'value'}`}
              >
                  <span className={compact ? "text-sm" : "text-md"}>+</span>
              </Button>
          )}
        </div>
      </div>
    );
    // --- จบ ส่วนที่ 2.3 ---
  }
);
// --- จบ ส่วนที่ 2 ---

// --- ส่วนที่ 3: Display Name และ Export ---
InputFieldGroup.displayName = 'InputFieldGroup'; // สำหรับ React DevTools
export default InputFieldGroup;
// --- จบ ส่วนที่ 3 ---