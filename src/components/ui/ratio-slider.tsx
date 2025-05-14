// src/components/ui/ratio-slider.tsx (ไฟล์ใหม่สำหรับ Slider แบบสามเหลี่ยม)

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils' // ตรวจสอบ path การ import 'cn'

// --- ไม่ต้องแก้ไข Interface ---
interface RatioSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  className?: string
}

// --- เปลี่ยนชื่อ Component เป็น RatioSlider ---
const RatioSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RatioSliderProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className // Class ที่ส่งมาจากข้างนอก (เช่น w-..., mx-auto)
    )}
    {...props}
  >
    {/* 1. แก้ไข Track ให้โปร่งใส */}
    <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full bg-transparent border-none"> {/* <<< bg-transparent */}
      {/* 2. แก้ไข Range ให้โปร่งใส */}
      <SliderPrimitive.Range className="absolute h-full bg-transparent" /> {/* <<< bg-transparent */}
    </SliderPrimitive.Track>

    {/* 3. แก้ไข Thumb */}
    <SliderPrimitive.Thumb
       // ลบคลาส Tailwind เดิมเกี่ยวกับ ขนาด/รูปร่าง/สี/ขอบ ออก
       className={cn(
         "block",
         "ring-offset-background transition-colors", // อาจจะไม่จำเป็นแล้ว ถ้าไม่ใช้ ring
         "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
         "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
         // ไม่มี h- w- rounded- border- bg- แล้ว
       )}
       // เพิ่ม Inline Style สร้างสามเหลี่ยม
       style={{
          display: 'block',
          appearance: 'none',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',  // ขนาดครึ่งฐานซ้าย
          borderRight: '10px solid transparent', // ขนาดครึ่งฐานขวา
          borderBottom: '16px solid #F97316', // สีส้ม orange-500 และความสูงสามเหลี่ยม (ชี้ขึ้น)
          borderTop: 'none',
          backgroundColor: 'transparent',
          borderRadius: 0, // ไม่มน
          cursor: 'pointer',
          position: 'relative',
          top: '-4px', // ปรับตำแหน่งแนวตั้ง (ลองค่า -3, -4, -5)

       }}
    />
  </SliderPrimitive.Root>
))

// --- เปลี่ยน Display Name ---
RatioSlider.displayName = "RatioSlider" // ตั้งชื่อใหม่

// --- Export Component ใหม่ ---
export { RatioSlider }