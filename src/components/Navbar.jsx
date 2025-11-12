import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiBookOpen, FiUsers, FiUserCheck, FiBarChart2, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { toast } from 'react-toastify';

// 💎 ADDED: Helper function for avatar initials (for consistency)
const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// 💎 CHANGED: Added 'avatar' prop
const Navbar = ({ businessName, userName, userEmail, avatar }) => {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    const handleLogout = () => {
        setDropdownOpen(false);
        toast.info("Logging you out...");
        // Replace with your actual logout logic (e.g., clearing tokens)
        setTimeout(() => navigate('/login'), 1500);
    };

    const navItems = [
        { to: "/dashboard", icon: <FiGrid />, label: "Dashboard" },
        { to: "/inventory", icon: <FiPackage />, label: "Inventory" },
        { to: "/ledger", icon: <FiBookOpen />, label: "Ledger" },
        { to: "/customer", icon: <FiUsers />, label: "Customers" },
        { to: "/visitor", icon: <FiUserCheck />, label: "Visitors" },
        { to: "/report", icon: <FiBarChart2 />, label: "Reports" },
    ];

    const activeLinkStyle = {
        color: '#00529B',
        backgroundColor: '#E6F4FF'
    };

    // 💎 ADDED: Placeholder for avatar fallback
    const placeholderAvatar = `https://placehold.co/40x40/cccccc/333333?text=${getInitials(userName)}`;

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    {/* Left Side: Business Name & Navigation */}
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-slate-800">{businessName || 'My Business'}</h1>
                        <div className="hidden md:flex items-center space-x-1">
                            {navItems.map(item => (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: User Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00529B]"
                        >
                            {/* 💎 UPDATED: Conditional Avatar/Initial logic */}
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt="User"
                                    className="w-9 h-9 rounded-full object-cover"
                                    // Fallback to placeholder if the image URL is broken
                                    onError={(e) => e.target.src = placeholderAvatar}
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#003B6F] to-[#007BFF] text-white font-bold flex items-center justify-center text-sm">
                                    {getInitials(userName)}
                                </div>
                            )}
                            
                            <FiChevronDown className={`hidden lg:block h-5 w-5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100 animate-fade-in-down">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="font-semibold text-gray-800 text-sm">{userName || 'Business Owner'}</p>
                                    <p className="text-xs text-gray-500 truncate">{userEmail || 'user@example.com'}</p>
                                </div>
                                <div className="py-1">
                                    <NavLink to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <FiUser className="h-4 w-4" /> My Profile
                                    </NavLink>
                                </div>
                                <div className="border-t border-gray-100 py-1">
                                    <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <FiLogOut className="h-4 w-4" /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;