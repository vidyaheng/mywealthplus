// src/components/FormInputSection.tsx (ฉบับเต็ม แก้ไขตาม State Lifting และ Layout ล่าสุด)

// --- ส่วนที่ 0: Imports ---
import React, { useMemo } from "react"; // ไม่ต้องใช้ useState, useEffect ที่นี่
import InputFieldGroup from "./InputFieldGroup";       // ตรวจสอบ path
import RppRtuRatioSlider from "./RppRtuRatioSlider";   // ตรวจสอบ path
import { calculateLifeCoverage } from "../lib/calculations"; // ตรวจสอบ path และการ import
//import { Button } from "@/components/ui/button";        // Import Shadcn Button
import { FaBirthdayCake, FaVenusMars } from 'react-icons/fa'; // Import Icons
import { useAppOutletContext } from "../App"; // Import Context Hook (ปรับ path ให้ถูกต้อง)
// --- จบ ส่วนที่ 0 ---


export default function FormInputSection() {
  // --- ส่วนที่ 1: ดึง State และ Setters มาจาก Context ---
  // ค่าและฟังก์ชันเหล่านี้มาจาก App.tsx
  const {
    age, setAge,
    gender, setGender,
    paymentFrequency, setPaymentFrequency,
    rpp, setRpp,
    rtu, setRtu,
    sumInsured, setSumInsured,
    reductionHistory, // ข้อมูลการลดทุน
    handlePercentChange, // Handler สำหรับ Slider
   // handleCalculate
  } = useAppOutletContext();
  // --- จบ ส่วนที่ 1 ---


  // --- ส่วนที่ 2: Effects ย้ายไป App.tsx แล้ว ---
  // ไม่ควรมี useEffect ที่เชื่อม RPP <-> Sum Insured ที่นี่


  // --- ส่วนที่ 3: Derived Values (คำนวณจาก State ที่ได้จาก Context) ---
  // คำนวณความคุ้มครองชีวิต
  const lifeCoverage = useMemo(() => {
    return calculateLifeCoverage(sumInsured); // ใช้ sumInsured จาก Context
  }, [sumInsured]);

  // คำนวณเบี้ยรวม
  const totalPremium = useMemo(() => {
    return (rpp || 0) + (rtu || 0);
  }, [rpp, rtu]);

  // คำนวณ RTU สูงสุด
  const maxRtu = useMemo(() => {
    return (rpp || 0) * 3;
  }, [rpp]);

  // คำนวณ % RPP และ Total สำหรับส่งให้ Slider
   const totalPremiumForSlider = useMemo(() => (rpp || 0) + (rtu || 0), [rpp, rtu]);
   const rppPercentForSlider = useMemo(() => {
       return totalPremiumForSlider > 0 ? Math.round((rpp / totalPremiumForSlider) * 100) : 100;
   }, [rpp, totalPremiumForSlider]);
    
    // คำนวณหาข้อมูลลดทุนล่าสุดจาก Array (ใช้ useMemo)
   const latestReduction = useMemo(() => {
    // 1. เช็คก่อนว่ามีประวัติหรือไม่ ถ้าไม่มี return null
    if (!reductionHistory || reductionHistory.length === 0) {
      return null;
    }
    // 2. ถ้ามี ให้ดึงรายการสุดท้ายออกมา
    // (เรามั่นใจว่า App.tsx sort ตามอายุให้แล้ว ตัวสุดท้ายคือล่าสุด)
    return reductionHistory[reductionHistory.length - 1];
 }, [reductionHistory]); // คำนวณใหม่เมื่อ reductionHistory เปลี่ยน

  // --- จบ ส่วนที่ 3 ---


  // --- ส่วนที่ 4: Handlers (เฉพาะที่ใช้ใน Component นี้) ---
  // Handler สำหรับ Dropdown อายุ
  const handleAgeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAge(parseInt(event.target.value, 10)); // เรียก Setter จาก Context
  };
  // สร้าง Options สำหรับ Dropdown อายุ
  const ageOptions = Array.from({ length: 80 - 1 + 1 }, (_, i) => 1 + i); // อายุ 1-80

  // --- ลบ handler ที่ย้ายไป App.tsx ออก ---
  // --- จบ ส่วนที่ 4 ---


  // --- ส่วนที่ 5: JSX สำหรับแสดงผล UI (จัดระเบียบ Layout) ---
  return (
    // Container หลัก: ใช้ Padding และ Space มาตรฐาน
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-white rounded-lg shadow-sm border border-gray-200">

      {/* === ส่วนที่ 5.1: แถวข้อมูลลูกค้าและสัดส่วน === */}
      {/* ใช้ Grid, ปรับแก้คอลัมน์/Gap/Alignment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

        {/* คอลัมน์ 1: อายุ + เพศ */}
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            {/* อายุ */}
            <div className="min-w-[90px] w-24"> {/* ปรับ width */}
              <div className="flex items-center gap-1.5 mb-1">
                <FaBirthdayCake className="text-blue-700 text-sm flex-shrink-0"/>
                <label htmlFor="age-select" className="text-xs font-medium text-gray-700">อายุ</label>
              </div>
              <select
                id="age-select"
                value={age}
                onChange={handleAgeChange}
                className="w-12 h-8 border-b-2 border-gray-600 px-2 py-1 text-sm text-blue-600 font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {ageOptions.map(ageValue => ( <option key={ageValue} value={ageValue}>{ageValue} ปี</option> ))}
              </select>
            </div>
            {/* เพศ */}
            <div className="min-w-[150px]">
               <div className="flex items-center gap-1.5 mb-1">
                 <FaVenusMars className="text-blue-700 text-sm flex-shrink-0" />
                 <label className="text-xs font-medium text-gray-700">เพศ</label>
               </div>
              <div className="flex gap-3 items-center h-9">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" className="form-radio accent-blue-700 w-4 h-4" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} />
                  <span className={`ml-1 text-xs ${ gender === 'male' ? 'text-blue-700 font-semibold' : 'text-gray-700' }`}>ชาย</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" className="form-radio accent-pink-500 w-4 h-4" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} />
                  <span className={`ml-1 text-xs ${ gender === 'female' ? 'text-pink-500 font-semibold' : 'text-gray-700' }`}>หญิง</span>
                </label>
              </div>
            </div>
        </div>

        {/* คอลัมน์ 2: งวดการชำระ */}
        <div className="w-full sm:w-auto justify-self-start md:justify-self-start"> {/* ปรับ justify */}
          <label className="block mb-1 text-xs font-medium text-gray-700">งวดการชำระ</label>
          <div className="flex border border-gray-500 rounded overflow-hidden w-full h-6">
            {(['monthly', 'semi-annual', 'annual'] as const).map((freq, index) => (
              <button key={freq} type="button" onClick={() => setPaymentFrequency(freq)}
                className={`flex-1 px-3 py-1 text-xs text-center focus:outline-none ${ // เพิ่ม text-center
                  paymentFrequency === freq ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${index > 0 ? 'border-l border-gray-500' : ''}`}
              >
                {freq === 'annual' ? 'รายปี' : freq === 'semi-annual' ? 'ราย 6 เดือน' : 'รายเดือน'}
              </button>
            ))}
          </div>
        </div>

        {/* คอลัมน์ 3: Slider สัดส่วน RPP/RTU */}
        <div className="w-full self-center md:justify-self-end pt-1"> {/* ปรับ justify/align */}
           <RppRtuRatioSlider
               rppPercent={rppPercentForSlider}
               totalPremium={totalPremiumForSlider}
               onPercentChange={handlePercentChange} // ใช้ Handler จาก Context
               compact={false} // ใช้ compact mode
           />
        </div>

      </div>
      {/* === จบ ส่วนที่ 5.1 === */}


      {/* === ส่วนที่ 5.2: Layout 3 คอลัมน์ (RPP | RTU | เบี้ยรวม) === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* คอลัมน์ 1: เบี้ย RPP */}
        <div className="bg-blue-50 p-3 rounded flex flex-col items-center gap-1.5"> {/* ปรับ gap */}
          <label className="block text-center text-sm font-medium text-gray-800">เบี้ยประกันหลัก (RPP)</label>
          <InputFieldGroup label="" value={rpp} step={10000} onChange={setRpp} inputBgColor="bg-blue-50" compact/> {/* ส่ง compact */}
          <p className="text-[11px] text-gray-500 text-center pt-0.5">ขั้นต่ำ 18,000 บาท</p> {/* ปรับ font/pt */}
        </div>

        {/* คอลัมน์ 2: เบี้ย RTU */}
        <div className="bg-blue-50 p-3 rounded flex flex-col items-center gap-1.5"> {/* ปรับ gap */}
          <label className="block text-center text-sm font-medium text-gray-800">เบี้ยลงทุน (RTU)</label>
          <InputFieldGroup label="" value={rtu} step={10000} onChange={setRtu} inputBgColor="bg-blue-50" compact/> {/* ส่ง compact */}
          <p className="text-[11px] text-gray-500 text-center pt-0.5"> {/* ปรับ font/pt */}
            สูงสุดไม่เกิน {maxRtu.toLocaleString('en-US')} บาท
          </p>
        </div>

        {/* คอลัมน์ 3: เบี้ยรวม */}
        <div className="bg-blue-50 p-3 rounded flex flex-col justify-center items-center">
          <div>
            <label className="block text-center text-sm font-medium text-gray-800">เบี้ยประกันรวม</label>
            <div className="text-lg font-semibold text-blue-800 mt-1 py-1 text-center"> {/* ปรับ font */}
              {totalPremium.toLocaleString('en-US')} บาท
            </div>
          </div>
        </div>

      </div>
      {/* === จบ ส่วนที่ 5.2 === */}


      {/* === ส่วนที่ 5.3: ทุนประกัน และ ความคุ้มครองชีวิต === */}
      <div className="flex justify-end pt-4"> {/* ใช้ pt มาตรฐาน */}
         <div className="w-full md:w-auto md:max-w-sm lg:max-w-md space-y-2"> {/* ใช้ space มาตรฐาน */}

             {/* แถว จำนวนเงินเอาประกัน */}
             <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm gap-3">
                <label htmlFor="sum-insured-input" className="text-xs font-medium text-gray-700 whitespace-nowrap">
                    จำนวนเงินเอาประกัน
                </label>
                 <div className="flex items-center gap-1 w-auto">
                    <InputFieldGroup
                       inputId="sum-insured-input"
                       value={sumInsured} // ใช้ State จาก Context
                       step={100000}
                       onChange={setSumInsured} // ใช้ Setter จาก Context
                       label=""
                       inputBgColor="bg-white"
                       compact // <<< ส่ง prop compact
                    />
                 </div>
             </div>

             {/* แสดงข้อมูลลดทุน (ถ้ามี) */}
             {latestReduction && (
                  <div className="text-right pr-2">
                     <p className="text-xs text-orange-600"> {/* ใช้ text-xs */}
                         (ลดทุนเหลือ {latestReduction.amount.toLocaleString('en-US')} ตั้งแต่อายุ {latestReduction.age} ปี)
                     </p>
                  </div>
             )}

             {/* แถว ผลประโยชน์กรณีเสียชีวิต */}
             <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm gap-3">
                 <label id="life-coverage-label" className="text-xs font-medium text-gray-700 whitespace-nowrap">
                    ผลประโยชน์กรณีเสียชีวิต
                 </label>
                 <div className="w-auto text-right">
                     <div className="text-md text-green-700" aria-labelledby="life-coverage-label"> {/* ใช้ text-xs */}
                         <span className="font-semibold">{lifeCoverage.toLocaleString('en-US')}</span>
                         <span className="ml-3 font-normal">บาท</span>
                     </div>
                 </div>
             </div>

         </div>
      </div>
      {/* === จบ ส่วนที่ 5.3 === */}


      {/* === ส่วนที่ 5.4: ปุ่มคำนวณ === */}
      {/*<div className="flex justify-end pt-4"> 
                onClick={() => {
                  console.log("FormInputSection: 'Calculate' button clicked."); // Log เพื่อดูว่าปุ่มทำงานไหม
                  if (typeof handleCalculate === 'function') {
                      console.log("FormInputSection: Calling handleCalculate from context...");
                      handleCalculate();
                  } else {
                      console.error("FormInputSection: handleCalculate from context is undefined or not a function!", handleCalculate);
                  }
              }}
        
        
        >คำนวณ</Button> 
      </div>*/}
      {/* === จบ ส่วนที่ 5.4 === */}

       {/* --- ไม่มี Modal Render ที่นี่ --- */}

    </div> // ปิด div Container หลัก
  );
}
// --- จบ ส่วนที่ 5 ---