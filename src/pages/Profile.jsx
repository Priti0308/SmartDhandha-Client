import React, { useState, useEffect, useRef } from 'react';
import * as profileService from "../services/profileService"; 
import {
    UserCircleIcon, CreditCardIcon, CloudArrowUpIcon,
    TrashIcon, QuestionMarkCircleIcon, ArrowLeftOnRectangleIcon,
    ChevronRightIcon, PencilIcon, CameraIcon, InformationCircleIcon,
    ArrowTopRightOnSquareIcon, ChatBubbleBottomCenterTextIcon,
    BookOpenIcon, XMarkIcon, MapPinIcon, AtSymbolIcon, 
    PhoneIcon, UserIcon, BuildingOffice2Icon, Bars3Icon // 💎 NEW: Bars3Icon for hamburger
} from '@heroicons/react/24/outline';
import { FiMenu } from 'react-icons/fi'; // 💎 NEW: Adding FiMenu (as fallback/simplicity)

// --- Helper function for avatar initials (from your code) ---
const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// --- Reusable UI Components (unchanged) ---
const SettingsMenuItem = ({ icon: Icon, title, subtitle, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center text-left p-4 rounded-xl transition-colors ${
            active
            ? 'bg-[#0173AE]/10 text-[#0173AE] shadow-sm font-semibold'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        <Icon className="h-6 w-6 mr-4 flex-shrink-0" />
        <div className="flex-grow">
            <p className="font-medium text-base">{title}</p>
            <p className={`text-xs ${active ? 'text-[#0173AE]/80' : 'text-gray-500'}`}>{subtitle}</p>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
    </button>
);

const IconInput = ({ icon: Icon, label, id, as = 'input', ...props }) => {
    const InputComponent = as;
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <InputComponent
                    id={id}
                    {...props}
                    className="w-full pl-10 border border-gray-300 rounded-lg p-3 text-sm focus:border-[#0173AE] focus:ring-1 focus:ring-[#0173AE] transition"
                    style={as === 'textarea' ? { minHeight: '100px', paddingTop: '12px' } : {}}
                />
            </div>
        </div>
    );
};

const ImageModal = ({ src, onClose }) => (
    <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white z-20 bg-gray-800/50 rounded-full p-2 hover:bg-gray-700 transition"
        >
            <XMarkIcon className="h-7 w-7" />
        </button>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img 
                src={src} 
                alt="Profile Avatar Large" 
                className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
            />
        </div>
    </div>
);


const Profile = () => {
    // --- State Management ---
    const [activeSetting, setActiveSetting] = useState('account');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ message: '', type: '' });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [businessName, setBusinessName] = useState(''); 
    const [address, setAddress] = useState(''); 
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState('');
    const [placeholderAvatar, setPlaceholderAvatar] = useState('https://placehold.co/96x96/cccccc/333333?text=A');
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 💎 NEW: Sidebar state
    const fileInputRef = useRef(null);

    // --- Data Fetching --- (Remains the same)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await profileService.getProfile(); 
                
                const initials = getInitials(data.fullName || 'U');
                const placeholder = `https://placehold.co/96x96/cccccc/333333?text=${initials}`;
                setPlaceholderAvatar(placeholder);

                setUserData(data);
                setFullName(data.fullName || '');
                setMobile(data.mobile || '');
                setEmail(data.email || '');
                setBusinessName(data.businessName || ''); 
                setAddress(data.address || '');
                setProfileImagePreview(data.avatar || placeholder); 
            } catch (err) {
                setError('Failed to fetch profile data. Please check connection.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);
    
    const clearNotification = () => setNotification({ message: '', type: '' });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    // --- Save Logic (Remains the same) ---
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        clearNotification();

        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('mobile', mobile);
        formData.append('email', email);
        formData.append('businessName', businessName); 
        formData.append('address', address); 
        if (profileImageFile) {
            formData.append('avatar', profileImageFile);
        }

        try {
            const updatedUser = await profileService.updateProfile(formData);
            setUserData(updatedUser);
            const initials = getInitials(updatedUser.fullName || 'U');
            const placeholder = `https://placehold.co/96x96/cccccc/333333?text=${initials}`;
            setPlaceholderAvatar(placeholder);
            setProfileImagePreview(updatedUser.avatar || placeholder);

            setNotification({ message: 'Profile updated successfully!', type: 'success' });
            setTimeout(() => {
                setActiveSetting('account'); 
                clearNotification();
            }, 2000);
        } catch (err) {
            setNotification({ message: err.message || 'Failed to update profile.', type: 'error' });
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Backup & Logout Logic (Remains the same) ---
    const handleBackup = async () => {
        setIsSubmitting(true);
        clearNotification();
        try {
            const backupResponse = await profileService.triggerBackup();
            setUserData(prevData => ({ ...prevData, lastBackup: backupResponse.lastBackup }));
            setNotification({ message: backupResponse.message || 'Backup completed!', type: 'success' });
        } catch (err) {
            setNotification({ message: err.message || 'Backup failed.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        setNotification({ message: 'Logging out (simulated)...', type: 'error' });
        setTimeout(() => {
            console.log("Simulated Logout complete.");
            setNotification({ message: 'Logged out successfully!', type: 'success' });
        }, 1000);
    };


    if (loading) return <div className="p-8 text-center w-full min-h-screen flex items-center justify-center text-gray-500">Loading profile data...</div>;
    if (error) return <div className="p-8 text-red-600 text-center w-full">{error}</div>;
    if (!userData) return <div className="p-8 text-center w-full">No user data found.</div>;

    // --- Content Renderers (Remains the same) ---
    const renderProfileSummary = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Account Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner space-y-1">
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-lg font-semibold text-gray-800">{userData.fullName}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner space-y-1">
                    <p className="text-sm font-medium text-gray-500">Business Name</p>
                    <p className="text-lg font-semibold text-gray-800">{userData.businessName || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner space-y-1">
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-lg font-semibold text-gray-800">{userData.email}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner space-y-1">
                    <p className="text-sm font-medium text-gray-500">Mobile</p>
                    <p className="text-lg font-semibold text-gray-800">{userData.mobile}</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner md:col-span-2 space-y-1">
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-lg font-semibold text-gray-800 whitespace-pre-line">
                        {userData.address || 'N/A'}
                    </p>
                </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
                <button 
                    onClick={() => setActiveSetting('editProfile')} 
                    className="flex items-center px-4 py-2 text-sm font-semibold bg-[#0173AE] text-white rounded-lg hover:bg-[#005F92] transition"
                >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Details
                </button>
            </div>
        </div>
    );

    const renderBackupInfo = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Data & Backup Management</h2>
            <p className="mt-4 text-gray-600">Your application data is regularly synchronized with the cloud. Trigger a manual backup if needed.</p>
            <div className="mt-8 bg-gray-50 p-6 rounded-xl shadow-inner">
                <p className="text-sm text-gray-500">Last Successful Backup</p>
                <p className="text-md font-bold text-gray-700 mt-1">
                    {userData.lastBackup ? new Date(userData.lastBackup).toLocaleString() : 'Never Backed Up'}
                </p>
            </div>
            <div className="mt-6 border-t pt-5">
                <button 
                    onClick={handleBackup} 
                    disabled={isSubmitting} 
                    className="px-6 py-3 text-base font-semibold bg-[#00264B] text-white rounded-xl shadow-md hover:opacity-90 disabled:bg-gray-400 transition"
                >
                    {isSubmitting ? 'Backing up data...' : 'Trigger Manual Backup'}
                </button>
            </div>
        </div>
    );

    const renderEditProfileForm = () => {
        const isImageZoomable = profileImagePreview && !profileImagePreview.includes('placehold.co');
        
        return (
            <form onSubmit={handleSaveChanges}>
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Edit Profile & Business Details</h2>
                <p className="mt-4 text-sm text-gray-500">Update your account and business information.</p>
                
                {/* Image Upload Area */}
                <div className="mt-8 flex items-center space-x-6">
                    <div className="relative">
                        <img 
                            src={profileImagePreview} 
                            alt="Profile Avatar" 
                            className={`h-24 w-24 rounded-full object-cover ring-4 ring-[#0173AE]/20 ${isImageZoomable ? 'cursor-pointer' : ''}`}
                            onError={(e) => e.target.src = placeholderAvatar} 
                            onClick={() => isImageZoomable && setIsModalOpen(true)}
                        />
                        <button type="button" onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-100 transition">
                            <CameraIcon className="h-5 w-5 text-gray-600"/>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*"/>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-800">{fullName}</p>
                        <p className="text-sm text-gray-500">Max size 2MB. {isImageZoomable ? 'Click image to zoom.' : ''}</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Business Details</h3>
                    </div>

                    <IconInput
                        label="Business Name"
                        id="businessName"
                        icon={BuildingOffice2Icon}
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                    />

                    <div className="md:col-span-2">
                        <IconInput
                            as="textarea"
                            label="Business Address"
                            id="address"
                            icon={MapPinIcon}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="123 Main St&#10;City, State 12345"
                        />
                    </div>
                    
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 pt-4">Personal Details</h3>
                    </div>
                    
                    <IconInput
                        label="Full Name"
                        id="fullName"
                        icon={UserIcon}
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                    <IconInput
                        label="Mobile Number"
                        id="mobile"
                        icon={PhoneIcon}
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                    />
                    <div className="md:col-span-2">
                        <IconInput
                            label="Email Address"
                            id="email"
                            icon={AtSymbolIcon}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-10 pt-6 border-t flex justify-end space-x-4">
                    <button 
                        type="button" 
                        onClick={() => setActiveSetting('account')} 
                        className="px-6 py-3 text-sm font-semibold bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="px-6 py-3 text-sm font-semibold bg-[#00264B] text-white rounded-xl shadow-md hover:opacity-90 disabled:bg-gray-400 transition"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        )
    };
    
    // 🚨 NEW RENDERER: Help & Support Content
    const renderHelpAndSupport = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Help & Support</h2>
            <p className="mt-4 text-gray-600">Find quick answers, detailed guides, or contact our support team directly.</p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* FAQ / Documentation Link */}
                <a href="/documentation" target="_blank" className="block p-6 bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow group">
                    <BookOpenIcon className="h-8 w-8 text-[#0173AE] group-hover:text-[#005F92] transition"/>
                    <h3 className="mt-3 text-lg font-bold text-gray-800">Knowledge Base & FAQs</h3>
                    <p className="text-sm text-gray-500 mt-1">Search our detailed documentation for step-by-step guides on using all SmartDhandha features.</p>
                    <span className="mt-3 inline-flex items-center text-sm font-semibold text-[#0173AE] group-hover:underline">
                        View Documentation
                        <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4"/>
                    </span>
                </a>

                {/* Direct Support Contact */}
                <a href="mailto:support@smartdhandha.com" className="block p-6 bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow group">
                    <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-green-600 group-hover:text-green-700 transition"/>
                    <h3 className="mt-3 text-lg font-bold text-gray-800">Contact Support</h3>
                    <p className="text-sm text-gray-500 mt-1">If you can't find your answer, send us an email. We typically respond within 1 business day.</p>
                    <span className="mt-3 inline-flex items-center text-sm font-semibold text-green-600 group-hover:underline">
                        Email support@smartdhandha.com
                    </span>
                </a>
            </div>

            <div className="mt-10 pt-6 border-t">
                 <h3 className="text-lg font-bold text-gray-800">System Information</h3>
                 <p className="text-sm text-gray-500 mt-2">
                      App Version: <span className="font-semibold text-gray-700">1.2.0</span> | 
                      Last Server Sync: <span className="font-semibold text-gray-700">{userData.lastBackup ? new Date(userData.lastBackup).toLocaleTimeString() : 'N/A'}</span>
                 </p>
            </div>
        </div>
    );

    
    // --- Main Renderer ---
    const renderContent = () => {
        switch (activeSetting) {
            case 'account':
                return renderProfileSummary();
            case 'editProfile':
                return renderEditProfileForm();
            case 'backup':
                return renderBackupInfo();
            case 'billing':
                return <div className="p-4 bg-yellow-50 rounded-lg text-gray-700">Billing details go here. (Not yet implemented)</div>;
            case 'recycle':
                return <div className="p-4 bg-yellow-50 rounded-lg text-gray-700">Recycle Bin and data recovery options go here. (Not yet implemented)</div>;
            case 'help':
                return renderHelpAndSupport(); 
            case 'logout':
                // Note: The logout logic is handled by the button, this just returns the default view
                return renderProfileSummary(); 
            default:
                return renderProfileSummary();
        }
    };

    return (
        <div className="flex w-full min-h-screen bg-gray-50">
            {/* 💎 ADDED: Render modal if open */}
            {isModalOpen && <ImageModal src={profileImagePreview} onClose={() => setIsModalOpen(false)} />}
            
            {/* 💎 NEW: Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* --- Sidebar (Navigation) --- */}
            <aside className={`
                w-80 bg-white border-r shadow-lg flex-shrink-0 flex flex-col p-6
                md:relative md:translate-x-0 md:z-0
                fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            `}>
                {/* 💎 NEW: Mobile Close Button (inside sidebar) */}
                <div className="flex justify-between items-center mb-8 p-4 border-b pb-5">
                    <h1 className="text-2xl font-extrabold text-[#00264B]">Settings</h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-900 transition">
                        <XMarkIcon className="h-7 w-7" />
                    </button>
                </div>

                {/* User Info Card */}
                <div className="bg-gray-50 p-4 rounded-xl shadow-inner mb-6">
                    <div className="flex items-center">
                        <img 
                            src={profileImagePreview} // 💎 Uses state-managed preview
                            alt="User" 
                            className="h-14 w-14 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) => e.target.src = placeholderAvatar} // 💎 Uses dynamic placeholder
                        />
                        <div className="ml-4">
                            <p className="font-bold text-gray-800">{userData.fullName}</p>
                            <p className="text-xs text-gray-500">Business: {userData.businessName || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-grow space-y-3">
                    <SettingsMenuItem 
                        icon={UserCircleIcon} 
                        title="Account Overview" 
                        subtitle="View and manage personal details" 
                        active={activeSetting === 'account'} 
                        onClick={() => { setActiveSetting('account'); clearNotification(); setIsSidebarOpen(false); }}
                    />
                    <SettingsMenuItem 
                        icon={PencilIcon} 
                        title="Edit Profile" 
                        subtitle="Update photo, name, and contact info" 
                        active={activeSetting === 'editProfile'} 
                        onClick={() => { setActiveSetting('editProfile'); clearNotification(); setIsSidebarOpen(false); }}
                    />
                    <div className="border-t border-gray-200 my-4"></div>
                    <SettingsMenuItem 
                        icon={CloudArrowUpIcon} 
                        title="Backup & Sync" 
                        subtitle="Data synchronization status" 
                        active={activeSetting === 'backup'} 
                        onClick={() => { setActiveSetting('backup'); clearNotification(); setIsSidebarOpen(false); }}
                    />
                    <SettingsMenuItem 
                        icon={CreditCardIcon} 
                        title="Plans & Billing" 
                        subtitle="Subscription and payment history" 
                        active={activeSetting === 'billing'} 
                        onClick={() => { setActiveSetting('billing'); clearNotification(); setIsSidebarOpen(false); }}
                    />
                    <SettingsMenuItem 
                        icon={TrashIcon} 
                        title="Recycle Bin" 
                        subtitle="Restore deleted items" 
                        active={activeSetting === 'recycle'} 
                        onClick={() => { setActiveSetting('recycle'); clearNotification(); setIsSidebarOpen(false); }}
                    />
                    <div className="border-t border-gray-200 my-4"></div>
                    <SettingsMenuItem 
                        icon={QuestionMarkCircleIcon} 
                        title="Help & Support" 
                        subtitle="Guides and contact info" 
                        active={activeSetting === 'help'} 
                        onClick={() => { setActiveSetting('help'); clearNotification(); setIsSidebarOpen(false); }}
                    />
                    <SettingsMenuItem 
                        icon={ArrowLeftOnRectangleIcon} 
                        title="Logout" 
                        subtitle="Sign out of SmartDhandha" 
                        active={activeSetting === 'logout'} 
                        onClick={handleLogout} 
                    />
                </nav>
            </aside>
            
            {/* --- Main Content Area --- */}
            <main className="flex-1 p-4 sm:p-6 lg:p-10 bg-gray-50 overflow-y-auto">
                {/* 💎 NEW: Mobile Hamburger Button (top of main content) */}
                <div className="md:hidden mb-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-100 transition"
                    >
                        <FiMenu className="h-6 w-6" />
                    </button>
                </div>

                <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
                    {/* Notification Area */}
                    {notification.message && (
                        <div className={`mb-8 p-4 rounded-xl flex items-center shadow-md text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                            <InformationCircleIcon className="h-5 w-5 mr-3"/>
                            <p className="font-semibold">{notification.message}</p>
                        </div>
                    )}
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default Profile;