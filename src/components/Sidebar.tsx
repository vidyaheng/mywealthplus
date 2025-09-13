// components/Sidebar.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAppStore } from '../stores/appStore';
import { FaSignOutAlt } from "react-icons/fa";

interface TabItem {
  name: string;
  to: string;
  short: string;
  activePaths: string[];
  logoSrc?: string;
}

const tabs: TabItem[] = [
  { 
    name: "iWealthy", 
    to: "/iwealthy/form", 
    short: "iW",
    activePaths: ["/iwealthy/form", "/iwealthy/table", "/iwealthy/chart"], 
    logoSrc: "/images/iWealthy6-cutout.png"
  },
  { 
    name: "LTHC", 
    to: "/lthc", 
    short: "LtHc",
    activePaths: ["/lthc", "/lthc/*"],
    logoSrc: "/images/LTHCBlue.svg"
  },
  { 
    name: "โรคร้าย", 
    to: "/ci", 
    short: "CI",
    activePaths: ["/ci", "/ci/*"],
    logoSrc: "/images/โรคร้าย Blue.svg" 
  },
  { 
    name: "บำนาญ", 
    to: "/retire", 
    short: "Ret",
    activePaths: ["/retire", "/retire/*"] 
  },
  { 
    name: "คุ้มครองชีวิต", 
    to: "/lifeplan", 
    short: "LP",
    activePaths: ["/lifeplan", "/lifeplan/*"] 
  },
];

const SmartNavLink: React.FC<{
  to: string;
  activePaths: string[];
  children: React.ReactNode;
}> = ({ to, activePaths, children }) => {
  const location = useLocation();
  
  // ฟังก์ชันตรวจสอบว่า path ปัจจุบันตรงกับที่กำหนดหรือไม่
  const checkActive = () => {
    return activePaths.some(path => {
      // ถ้า path ลงท้ายด้วย * ให้ตรวจสอบว่า path ปัจจุบันเริ่มด้วย path นั้น
      if (path.endsWith('/*')) {
        const basePath = path.replace('/*', '');
        return location.pathname.startsWith(basePath);
      }
      return location.pathname === path;
    });
  };

  const isActive = checkActive();
  

  return (
    <NavLink
      to={to}
      className={`
        relative flex items-center h-12 px-3 py-2
        rounded-tl-md rounded-bl-md
        text-sm font-medium transition-colors
        overflow-hidden
        ${isActive 
          ? 'z-10 bg-blue-50 text-blue-700 border-t border-b border-l border-gray-300'
          : 'text-gray-300 hover:bg-gray-100'
        }
      `}
    >
      {children}
      {isActive && (
        <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-blue-500 rounded-l"></div>
      )}
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  const setPin = useAppStore((state) => state.setPin);

  const handleLogout = () => {
      if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
          setPin(null);
      }
  };
  return (
    <div className="relative w-16 hover:w-28 transition-all bg-white h-full overflow-hidden group">
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-300"></div>
      
      <div className="flex flex-col py-2 pl-2 space-y-2 h-full">
        {tabs.map((tab) => (
          <SmartNavLink 
            key={tab.name} 
            to={tab.to} 
            activePaths={tab.activePaths}
          >
            <div className="flex items-center justify-center w-full">
              <div className="group-hover:hidden flex items-center justify-center w-full h-full"> {/* ให้ div นี้จัดกลาง logo/text */}
                                {tab.logoSrc ? (
                                    <img 
                                        src={tab.logoSrc} 
                                        alt={`${tab.name} Logo`} 
                                        className="h-8 w-8 object-contain" // กำหนดขนาด Logo, h-8 w-8 คือ 32px x 32px
                                    />
                                ) : (
                                    <span className="font-bold text-lg text-gray-600">{tab.short}</span> // ปรับสี text-gray-600 สำหรับ non-active
                                )}
                            </div>
              <div className="hidden group-hover:block text-xs truncate whitespace-nowrap">
                {tab.name}
              </div>
            </div>
          </SmartNavLink>
        ))}
        <div className="mt-auto pb-2">
            <button
                onClick={handleLogout}
                className="relative flex items-center w-full h-12 px-3 py-2 rounded-tl-md rounded-bl-md text-sm font-medium transition-colors overflow-hidden text-gray-400 hover:bg-red-50 hover:text-red-700"
            >
                <div className="flex items-center justify-center w-full">
                    <div className="group-hover:hidden flex items-center justify-center w-full h-full">
                        <FaSignOutAlt className="h-6 w-6" />
                    </div>
                    <div className="hidden group-hover:block text-xs truncate whitespace-nowrap">
                        ออกจากระบบ
                    </div>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;