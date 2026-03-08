
import { NavLink } from 'react-router-dom';
import { FaWpforms, FaTable, FaChartBar, FaFilePdf } from 'react-icons/fa';

const navItems = [
    { to: "/retire/form", label: "กรอกข้อมูล", icon: <FaWpforms /> },
    { to: "/retire/table", label: "ตารางผลประโยชน์", icon: <FaTable /> },
    { to: "/retire/chart", label: "กราฟ", icon: <FaChartBar /> },
    { to: "/retire/report", label: "รายงาน", icon: <FaFilePdf /> },
];

const RetirementNav = () => {
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            isActive
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
        }`;

    return (
        <nav className="flex items-center border-b border-gray-200 bg-gray-50 rounded-t-lg">
            {navItems.map(item => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                    {item.icon}
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default RetirementNav;