// src/assets/icons/CalendarSwapIcon.tsx

import React from 'react';

const CalendarSwapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* ส่วนของปฏิทิน */}
    <path 
      d="M38 13C39.1046 13 40 13.8954 40 15V38C40 39.1046 39.1046 40 38 40H10C8.89543 40 8 39.1046 8 38V15C8 13.8954 8.89543 13 10 13H38Z" 
      stroke="currentColor" 
      strokeWidth="3"
    />
    <path 
      d="M8 21.5H40" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
    <path 
      d="M15 13V9C15 8.44772 15.4477 8 16 8H17C17.5523 8 18 8.44772 18 9V13" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
    <path 
      d="M30 13V9C30 8.44772 30.4477 8 31 8H32C32.5523 8 33 8.44772 33 9V13" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
    
    {/* ส่วนของลูกศรสลับกัน */}
    <g transform="translate(0, 2)">
      <path 
        d="M17 29L22 25" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M17 29L21 33" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M31 33L26 37" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M31 33L27 29" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M18 31C20.4237 29.8373 24.3162 29.5 28 31" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        transform="rotate(-20 24 31)"
      />
    </g>
  </svg>
);

export default CalendarSwapIcon;