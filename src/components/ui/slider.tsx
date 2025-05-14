// src/components/ui/slider.tsx (Standard Shadcn/ui Version)

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider" // ใช้ Radix UI เป็นพื้นฐาน

import { cn } from "@/lib/utils" // ใช้ cn utility (ตรวจสอบ path)

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      // --- Base Styles ---
      "relative flex w-full touch-none select-none items-center",
      className // Class ที่ส่งมาจากข้างนอก
    )}
    {...props}
  >
    {/* --- Track (รางเลื่อน) --- */}
    {/* ปกติสูง h-2, พื้นหลังสีรอง (secondary) หรือเทาอ่อน */}
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-gray-300"> {/* หรือ bg-gray-200 / bg-muted */}
      {/* --- Range (ส่วนที่เติมสีแล้ว) --- */}
      {/* ปกติพื้นหลังเป็นสีหลัก (primary) */}
      <SliderPrimitive.Range className="absolute h-full bg-blue-600" /> {/* หรือ bg-blue-600 */}
    </SliderPrimitive.Track>

    {/* --- Thumb (ปุ่มเลื่อน) --- */}
    {/* ปกติเป็นวงกลม h-5 w-5, มีขอบสี primary, พื้นหลังสี background */}
    <SliderPrimitive.Thumb className={cn(
      "block h-3 w-3 rounded-full border-2 border-blue-600 bg-white", // <<< กำหนดสีขอบน้ำเงินไว้แล้ว
      "ring-offset-background transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    )} />

  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }