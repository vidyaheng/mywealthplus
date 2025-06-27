// src/components/FormInputSection.tsx

import { useMemo } from 'react';

// +++ STEP 1: เปลี่ยน Import จาก Context มาเป็น Store +++
import { useAppStore } from '../stores/appStore';

// --- REMOVED ---
// import { useAppOutletContext } from "../App"; 

// --- Component Imports (เหมือนเดิม) ---
import InputFieldGroup from "./InputFieldGroup";
import RppRtuRatioSlider from "./RppRtuRatioSlider";
import { calculateLifeCoverage } from "../lib/calculations";
import { FaBirthdayCake, FaVenusMars } from 'react-icons/fa';

export default function FormInputSection() {
  // +++ STEP 2: ดึง State และ Actions ทั้งหมดมาจาก useAppStore +++
  const {
    iWealthyAge, setIWealthyAge,
    iWealthyGender, setIWealthyGender,
    iWealthyPaymentFrequency, setIWealthyPaymentFrequency,
    //iWealthyPPT, setIWealthyPPT,
    iWealthyRpp, setIWealthyRpp,
    iWealthyRtu, setIWealthyRtu,
    iWealthySumInsured, setIWealthySumInsured,
    iWealthySumInsuredReductions,
    handleIWealthyRppRtuSlider,
  } = useAppStore();

  // +++ STEP 3: อัปเดต useMemo ให้ใช้ State จาก Store +++
  // Logic การคำนวณเหมือนเดิม แต่เปลี่ยนตัวแปรที่อ้างอิง
  const lifeCoverage = useMemo(() => calculateLifeCoverage(iWealthySumInsured), [iWealthySumInsured]);
  const totalPremium = useMemo(() => (iWealthyRpp || 0) + (iWealthyRtu || 0), [iWealthyRpp, iWealthyRtu]);
  const maxRtu = useMemo(() => (iWealthyRpp || 0) * 3, [iWealthyRpp]);
  const rppPercentForSlider = useMemo(() => totalPremium > 0 ? Math.round((iWealthyRpp / totalPremium) * 100) : 100, [iWealthyRpp, totalPremium]);
  
  const latestReduction = useMemo(() => {
    if (!iWealthySumInsuredReductions || iWealthySumInsuredReductions.length === 0) return null;
    // สมมติว่าข้อมูลใน array ถูก sort มาแล้ว
    return iWealthySumInsuredReductions[iWealthySumInsuredReductions.length - 1];
  }, [iWealthySumInsuredReductions]);

  const ageOptions = Array.from({ length: 80 - 1 + 1 }, (_, i) => 1 + i);

  // +++ STEP 4: Render JSX โดยผูกกับ State และ Setters จาก Store ทั้งหมด +++
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-white rounded-lg shadow-sm border border-gray-200">
      
      {/* === ส่วนข้อมูลลูกค้าและสัดส่วน === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* คอลัมน์ 1: อายุ, เพศ, และ PPT */}
        <div className="flex flex-wrap items-start gap-x-4 gap-y-4">
          <div className="min-w-[90px] w-24">
            <div className="flex items-center gap-1.5 mb-1"><FaBirthdayCake className="text-blue-700"/> <label htmlFor="age-select" className="text-xs font-medium text-gray-700">อายุ</label></div>
            <select
              id="age-select"
              value={iWealthyAge}
              onChange={(e) => setIWealthyAge(Number(e.target.value))}
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
          {/*<div className="min-w-[90px] w-32">
            <div className="flex items-center gap-1.5 mb-1"><FaRegClock className="text-blue-700"/> <label className="text-xs font-medium text-gray-700">ระยะชำระเบี้ย (ปี)</label></div>
            <InputFieldGroup value={iWealthyPPT} onChange={setIWealthyPPT} step={1} min={5} max={98 - iWealthyAge} compact />
          </div>
          */}
        </div>
        
        {/* คอลัมน์ 2: งวดการชำระ */}
        <div className="w-full justify-self-start md:justify-self-start">
          <label className="block mb-1 text-xs font-medium text-gray-700">งวดการชำระ</label>
          <div className="flex border border-gray-500 rounded overflow-hidden w-full h-6">
            {(['monthly', 'semi-annual', 'annual'] as const).map((freq, index) => (
              <button key={freq} type="button" onClick={() => setIWealthyPaymentFrequency(freq)} className={`flex-1 px-3 py-1 text-xs text-center focus:outline-none ${iWealthyPaymentFrequency === freq ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} ${index > 0 ? 'border-l border-gray-500' : ''}`}>
                {freq === 'annual' ? 'รายปี' : freq === 'semi-annual' ? 'ราย 6 เดือน' : 'รายเดือน'}
              </button>
            ))}
          </div>
        </div>
        
        {/* คอลัมน์ 3: Slider สัดส่วน RPP/RTU */}
        <div className="w-full self-center md:justify-self-end pt-1">
          <RppRtuRatioSlider rppPercent={rppPercentForSlider} totalPremium={totalPremium} onPercentChange={handleIWealthyRppRtuSlider} compact={false} />
        </div>
      </div>
      
      {/* === ส่วนเบี้ยประกัน 3 คอลัมน์ === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded flex flex-col items-center gap-1.5">
          <label className="block text-center text-sm font-medium text-gray-800">เบี้ยประกันหลัก (RPP)</label>
          <InputFieldGroup label="" value={iWealthyRpp} step={10000} onChange={setIWealthyRpp} inputBgColor="bg-blue-50" compact />
          <p className="text-[11px] text-gray-500 text-center pt-0.5">ขั้นต่ำ 18,000 บาท</p>
        </div>
        <div className="bg-blue-50 p-3 rounded flex flex-col items-center gap-1.5">
          <label className="block text-center text-sm font-medium text-gray-800">เบี้ยลงทุน (RTU)</label>
          <InputFieldGroup label="" value={iWealthyRtu} step={10000} onChange={setIWealthyRtu} inputBgColor="bg-blue-50" compact />
          <p className="text-[11px] text-gray-500 text-center pt-0.5">สูงสุดไม่เกิน {maxRtu.toLocaleString('en-US')} บาท</p>
        </div>
        <div className="bg-blue-50 p-3 rounded flex flex-col justify-center items-center">
          <div>
            <label className="block text-center text-sm font-medium text-gray-800">เบี้ยประกันรวม</label>
            <div className="text-lg font-semibold text-blue-800 mt-1 py-1 text-center">{totalPremium.toLocaleString('en-US')} บาท</div>
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