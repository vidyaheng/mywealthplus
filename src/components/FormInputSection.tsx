// src/components/FormInputSection.tsx

import { useMemo, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { useAppStore } from '../stores/appStore';

// --- Component Imports ---
import InputFieldGroup from "./InputFieldGroup";
import RppRtuRatioSlider from "./RppRtuRatioSlider";
import { calculateLifeCoverage, getPaymentsPerYear } from "../lib/calculations"; // <--- นำ getSumInsuredFactor ออก เพราะไม่ได้ใช้ใน Component แล้ว
import type { PaymentFrequency } from '../lib/calculations';
import { FaBirthdayCake, FaVenusMars } from 'react-icons/fa';

export default function FormInputSection() {
  const {
    iWealthyAge, setIWealthyAge,
    iWealthyGender, setIWealthyGender,
    iWealthyPaymentFrequency, setIWealthyPaymentFrequency,
    iWealthyRpp, setIWealthyRpp,
    iWealthyRtu, setIWealthyRtu,
    iWealthySumInsured, setIWealthySumInsured,
    iWealthySumInsuredReductions,
    handleIWealthyRppRtuSlider,
  } = useAppStore();

  const debouncedSetAge = useMemo(
    () => debounce((newAge: number) => {
      if (newAge !== iWealthyAge) {
        setIWealthyAge(newAge);
      }
    }, 300),
    [setIWealthyAge, iWealthyAge]
  );

  useEffect(() => {
    return () => {
      debouncedSetAge.cancel();
    };
  }, [debouncedSetAge]);

  // ==================================================================
  // STEP 1: ลบ useEffect ที่คำนวณ SA ทิ้งทั้งหมด
  // ==================================================================
  // Logic การคำนวณ RPP <=> SA ถูกจัดการใน appStore.ts เรียบร้อยแล้ว
  // การมี useEffect นี้อยู่คือสาเหตุหลักของ Infinite Loop
  // จึงต้องลบทิ้งทั้งหมด

  // ==================================================================
  // STEP 2: ปรับปรุง LOGIC การแปลงค่าเบี้ยประกัน
  // ==================================================================

  // คำนวณจำนวนงวดต่อปีเพื่อใช้แปลงค่า (จะ re-calculate อัตโนมัติเมื่อ frequency เปลี่ยน)
  const paymentsPerYear = useMemo(() => getPaymentsPerYear(iWealthyPaymentFrequency), [iWealthyPaymentFrequency]);

  // ทำให้ฟังก์ชัน handleFrequencyChange ง่ายลง
  // แค่เปลี่ยน state ของงวดก็พอ แล้ว UI จะ re-render และคำนวณค่าที่แสดงผลใหม่เอง
  const handleFrequencyChange = (newFrequency: PaymentFrequency) => {
    setIWealthyPaymentFrequency(newFrequency);
  };

  // คำนวณค่าเบี้ยรายงวดเพื่อ "แสดงผล" ใน UI
  // State `iWealthyRpp` และ `iWealthyRtu` จะเก็บค่า "รายปี" เสมอ
  const periodicRpp = useMemo(() => {
    return paymentsPerYear > 0 ? Math.round(iWealthyRpp / paymentsPerYear) : iWealthyRpp;
  }, [iWealthyRpp, paymentsPerYear]);

  const periodicRtu = useMemo(() => {
    return paymentsPerYear > 0 ? Math.round(iWealthyRtu / paymentsPerYear) : iWealthyRtu;
  }, [iWealthyRtu, paymentsPerYear]);

  // ฟังก์ชันสำหรับรับค่าจาก Input Field แล้วแปลงกลับเป็น "รายปี" ก่อนส่งเข้า Store
  const handleRppChange = (periodicValue: number) => {
    if (paymentsPerYear > 0) {
      setIWealthyRpp(periodicValue * paymentsPerYear);
    }
  };

  const handleRtuChange = (periodicValue: number) => {
    if (paymentsPerYear > 0) {
      setIWealthyRtu(periodicValue * paymentsPerYear);
    }
  };

  // ==================================================================
  // STEP 3: แก้ไข LOGIC การคำนวณสำหรับ UI (ใช้ค่ารายปีจาก State)
  // ==================================================================
  const lifeCoverage = useMemo(() => calculateLifeCoverage(iWealthySumInsured), [iWealthySumInsured]);
  
  // เบี้ยรวมรายปี
  const totalAnnualPremium = useMemo(() => (iWealthyRpp || 0) + (iWealthyRtu || 0), [iWealthyRpp, iWealthyRtu]);
  
  // เบี้ยรวมรายงวด (สำหรับแสดงผล)
  const totalPeriodicPremium = useMemo(() => periodicRpp + periodicRtu, [periodicRpp, periodicRtu]);
  
  // RTU สูงสุด (คำนวณจาก RPP รายปี)
  const maxRtu = useMemo(() => (iWealthyRpp || 0) * 3, [iWealthyRpp]);
  
  // เปอร์เซ็นต์สำหรับ Slider (คำนวณจากค่ารายปี)
  const rppPercentForSlider = useMemo(() => totalAnnualPremium > 0 ? Math.round((iWealthyRpp / totalAnnualPremium) * 100) : 100, [iWealthyRpp, totalAnnualPremium]);
  
  const latestReduction = useMemo(() => {
    if (!iWealthySumInsuredReductions || iWealthySumInsuredReductions.length === 0) return null;
    return iWealthySumInsuredReductions[iWealthySumInsuredReductions.length - 1];
  }, [iWealthySumInsuredReductions]);

  const ageOptions = Array.from({ length: 80 - 1 + 1 }, (_, i) => 1 + i);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-white rounded-lg shadow-sm border border-gray-200">
      
      {/* === ส่วนข้อมูลลูกค้าและสัดส่วน === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* คอลัมน์ 1: อายุ, เพศ */}
        <div className="flex flex-wrap items-start gap-x-4 gap-y-4">
          <div className="min-w-[90px] w-24">
            <div className="flex items-center gap-1.5 mb-1"><FaBirthdayCake className="text-blue-700"/> <label htmlFor="age-select" className="text-xs font-medium text-gray-700">อายุ</label></div>
            <select
              id="age-select"
              value={iWealthyAge}
              onChange={(e) => debouncedSetAge(Number(e.target.value))}
              className="w-18 h-8 border-b border-gray-600 px-2 py-1 text-sm text-blue-600 font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-50 appearance-none bg-no-repeat bg-[url('...')] bg-[length:1.5em_1.5em] bg-[position:right_0.05rem_center] pr-8 rounded-none"
            >
              {ageOptions.map(ageValue => <option key={ageValue} value={ageValue}>{ageValue} ปี</option>)}
            </select>
          </div>
          <div className="min-w-[150px]">
            <div className="flex items-center gap-1.5 mb-1"><FaVenusMars className="text-blue-700"/> <label className="text-xs font-medium text-gray-700">เพศ</label></div>
            <div className="flex gap-3 items-center h-9">
              <label className="inline-flex items-center cursor-pointer">
                <input type="radio" className="form-radio accent-blue-700 w-4 h-4" name="gender" value="male" checked={iWealthyGender === 'male'} onChange={() => setIWealthyGender('male')} />
                <span className={`ml-1 text-xs ${iWealthyGender === 'male' ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>ชาย</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input type="radio" className="form-radio accent-pink-500 w-4 h-4" name="gender" value="female" checked={iWealthyGender === 'female'} onChange={() => setIWealthyGender('female')} />
                <span className={`ml-1 text-xs ${iWealthyGender === 'female' ? 'text-pink-500 font-semibold' : 'text-gray-700'}`}>หญิง</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* คอลัมน์ 2: งวดการชำระ */}
        <div className="w-full justify-self-start md:justify-self-start">
          <label className="block mb-1 text-xs font-medium text-gray-700">งวดการชำระ</label>
          <div className="flex border border-gray-500 rounded overflow-hidden w-full h-6">
            {(['monthly', 'semi-annual', 'annual'] as const).map((freq, index) => (
              <button key={freq} type="button" onClick={() => handleFrequencyChange(freq)} className={`flex-1 px-3 py-1 text-xs text-center focus:outline-none ${iWealthyPaymentFrequency === freq ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} ${index > 0 ? 'border-l border-gray-500' : ''}`}>
                {freq === 'annual' ? 'รายปี' : freq === 'semi-annual' ? 'ราย 6 เดือน' : 'รายเดือน'}
              </button>
            ))}
          </div>
        </div>
        
        {/* คอลัมน์ 3: Slider สัดส่วน RPP/RTU */}
        <div className="w-full self-center md:justify-self-end pt-1">
          {/* ส่ง Total "Annual" Premium เข้าไปเพื่อให้ Slider คำนวณได้ถูกต้อง */}
          <RppRtuRatioSlider rppPercent={rppPercentForSlider} totalPremium={totalAnnualPremium} onPercentChange={handleIWealthyRppRtuSlider} compact={false} />
        </div>
      </div>
      
      {/* === ส่วนเบี้ยประกัน 3 คอลัมน์ === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded flex flex-col items-center gap-1.5">
          <label className="block text-center text-sm font-medium text-gray-800">เบี้ยประกันหลัก (RPP)</label>
          {/* ================================================================== */}
          {/* STEP 4: แก้ไข Input Fields ให้แสดงค่ารายงวด และส่งค่ารายปี */}
          {/* ================================================================== */}
          <InputFieldGroup label="" value={periodicRpp} step={1000} onChange={handleRppChange} inputBgColor="bg-blue-50" compact />
          <p className="text-[11px] text-gray-500 text-center pt-0.5">ขั้นต่ำ 18,000 บาท/ปี</p>
        </div>
        <div className="bg-blue-50 p-3 rounded flex flex-col items-center gap-1.5">
          <label className="block text-center text-sm font-medium text-gray-800">เบี้ยลงทุน (RTU)</label>
          <InputFieldGroup label="" value={periodicRtu} step={1000} onChange={handleRtuChange} inputBgColor="bg-blue-50" compact />
          <p className="text-[11px] text-gray-500 text-center pt-0.5">สูงสุดไม่เกิน {maxRtu.toLocaleString('en-US')} บาท/ปี</p>
        </div>
        <div className="bg-blue-50 p-3 rounded flex flex-col justify-center items-center">
          <div>
            <label className="block text-center text-sm font-medium text-gray-800">เบี้ยประกันรวม</label>
            {/* แสดงเบี้ยรวม "รายงวด" */}
            <div className="text-lg font-semibold text-blue-800 mt-1 py-1 text-center">{totalPeriodicPremium.toLocaleString('en-US')} บาท</div>
          </div>
        </div>
      </div>
      
      {/* === ส่วนทุนประกัน และ ความคุ้มครองชีวิต === */}
      <div className="flex justify-end pt-4">
        <div className="w-full md:w-auto md:max-w-sm lg:max-w-md space-y-2">
          <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm gap-3">
            <label htmlFor="sum-insured-input" className="text-xs font-medium text-gray-700 whitespace-nowrap">จำนวนเงินเอาประกัน</label>
            <div className="flex items-center gap-1 w-auto">
              <InputFieldGroup inputId="sum-insured-input" value={iWealthySumInsured} step={100000} onChange={setIWealthySumInsured} label="" inputBgColor="bg-white" compact />
            </div>
          </div>
          {latestReduction && (
            <div className="text-right pr-2">
              <p className="text-xs text-orange-600">(ลดทุนเหลือ {latestReduction.newSumInsured.toLocaleString('en-US')} ตั้งแต่อายุ {latestReduction.age} ปี)</p>
            </div>
          )}
          <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm gap-3">
            <label id="life-coverage-label" className="text-xs font-medium text-gray-700 whitespace-nowrap">ผลประโยชน์กรณีเสียชีวิต</label>
            <div className="w-auto text-right">
              <div className="text-md text-green-700" aria-labelledby="life-coverage-label">
                <span className="font-semibold">{lifeCoverage.toLocaleString('en-US')}</span>
                <span className="ml-3 font-normal">บาท</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}