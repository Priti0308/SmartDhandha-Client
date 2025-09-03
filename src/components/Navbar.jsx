import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false); // mobile menu
  const [dropdownOpen, setDropdownOpen] = useState(false); // features dropdown

  return (
    <nav className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] shadow-lg fixed w-full z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-white">
          SmartDhandha
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8 relative">
          <Link to="/" className="text-white hover:text-[#A7E1FF] transition">
            Home
          </Link>

          {/* Features with Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button className="flex items-center text-white hover:text-[#A7E1FF] transition">
              Features <ChevronDown size={16} className="ml-1" />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                <Link
                  to="/inventory"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Inventory
                </Link>
                <Link
                  to="/ledger"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Ledger
                </Link>
                <Link
                  to="/report"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Report
                </Link>
                <Link
                  to="/visitor"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Visitor
                </Link>
              </div>
            )}
          </div>

          <Link to="/contact" className="block text-white hover:text-[#A7E1FF]">
            Contact
          </Link>
          <Link to="/feedback" className="block text-white hover:text-[#A7E1FF]">
            Feedback
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex space-x-4">
          <Link
            to="/login"
            className="px-4 py-2 border border-white text-white rounded-md hover:bg-white hover:text-[#003B6F] transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-white text-[#003B6F] font-semibold rounded-md hover:bg-gray-100 transition"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#003B6F] px-6 pb-4 space-y-4">
          <Link to="/" className="block text-white hover:text-[#A7E1FF]">
            Home
          </Link>

          {/* Mobile Dropdown */}
          <div>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center w-full text-left text-white hover:text-[#A7E1FF] transition"
            >
              Features <ChevronDown size={16} className="ml-1" />
            </button>
            {dropdownOpen && (
              <div className="mt-2 pl-4 space-y-2">
                <Link to="/inventory" className="block text-white hover:text-[#A7E1FF]">
                  Inventory
                </Link>
                <Link to="/ledger" className="block text-white hover:text-[#A7E1FF]">
                  Ledger
                </Link>
                <Link to="/report" className="block text-white hover:text-[#A7E1FF]">
                  Report
                </Link>
                <Link to="/visitor" className="block text-white hover:text-[#A7E1FF]">
                  Visitor
                </Link>
              </div>
            )}
          </div>

          <Link to="/contact" className="block text-white hover:text-[#A7E1FF]">
            Contact
          </Link>
          <Link to="/feedback" className="block text-white hover:text-[#A7E1FF]">
            Feedback
          </Link>
         
          <Link to="/login" className="block text-white hover:text-[#A7E1FF]">
            Login
          </Link>
          <Link
            to="/register"
            className="block bg-white text-[#003B6F] rounded-md px-4 py-2 text-center hover:bg-gray-100 transition"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
