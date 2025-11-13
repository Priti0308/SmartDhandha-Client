import React from 'react';
// Import icons for phone, globe, map pin
import { FiPhone, FiGlobe, FiMapPin } from 'react-icons/fi';
// Import Heroicons for the header question mark
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

// Define the primary blue color (matching your project's style: #00264B)
const PRIMARY_BLUE = '#00264B'; 
const ACCENT_BLUE = '#0173AE'; 
const BASE_URL = 'www.prambh-pvt-ltd.com'; // Placeholder for the new name

const PrarambhSupportCard = () => {
    // UPDATED: Company name and data
    const supportData = {
        name: 'Prarambh Pvt. Ltd.', // Changed to Pvt. Ltd.
        tagline: 'Committed to your business success.',
        contactNumber: '+91 82083 15170', 
        website: BASE_URL,
        officeAddress: '505, Shivcity Center,\nVijaynagar, Sangli – 416416, Maharashtra, India',
    };
    
    return (
        <div className="max-w-4xl mx-auto my-10 font-sans p-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                
                {/* --- 1. Header Section (Dark Blue Background) --- */}
                <div className="text-white p-10 text-center" style={{ backgroundColor: PRIMARY_BLUE }}>
                    {/* Using Heroicon for better consistency */}
                    <QuestionMarkCircleIcon className="w-10 h-10 mx-auto mb-3 text-white" />
                    <h1 className="text-3xl font-extrabold tracking-wide">Customer Support</h1>
                    <p className="text-sm text-gray-300 mt-1">We are here to assist you with your inquiries.</p>
                </div>

                {/* --- 2. Company Identity & Contact Details --- */}
                <div className="p-8 md:p-12">
                    <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-4">{supportData.name}</h2>
                    <p className="text-xl text-gray-600 text-center mb-10 border-b pb-8">{supportData.tagline}</p>
                    
                    {/* Contact Grid (Larger Icons, Clearer Separation) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        
                        {/* Contact Number Card */}
                        <div className="flex items-center p-5 border border-gray-100 rounded-xl shadow-md transition-shadow hover:shadow-lg">
                            <FiPhone className="w-7 h-7 mr-4 flex-shrink-0" style={{ color: ACCENT_BLUE }} />
                            <div>
                                <p className text-sm font-medium text-gray-500>Contact Number</p>
                                <a href={`tel:${supportData.contactNumber}`} className="text-xl font-bold text-gray-800 hover:text-blue-700 transition">
                                    {supportData.contactNumber}
                                </a>
                            </div>
                        </div>

                        {/* Official Website Card */}
                        <div className="flex items-center p-5 border border-gray-100 rounded-xl shadow-md transition-shadow hover:shadow-lg">
                            <FiGlobe className="w-7 h-7 mr-4 flex-shrink-0" style={{ color: ACCENT_BLUE }} />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Official Website</p>
                                <a href={`https://${supportData.website}`} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-gray-800 hover:text-blue-700 transition">
                                    {supportData.website}
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    {/* Corporate Office Block (Full Width, Prominent) */}
                    <div className="flex items-start p-6 bg-gray-100 rounded-xl border border-gray-200 mt-10 shadow-inner">
                        <FiMapPin className="w-7 h-7 mr-5 mt-1 flex-shrink-0" style={{ color: ACCENT_BLUE }} />
                        <div>
                            <p className="text-base font-bold text-gray-700 mb-2">Corporate Office</p>
                            <p className="text-lg text-gray-800 whitespace-pre-line">
                                {supportData.officeAddress}
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- 3. Footer Commitment --- */}
                <div className="p-5 bg-gray-50 text-center rounded-b-2xl border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-medium">
                        Our dedicated team is committed to providing you with exceptional support and guidance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrarambhSupportCard;