// frontend/src/components/Profile.js
import React, { useState, useEffect, useRef } from 'react';
import * as profileService from "../services/profileService";
import {
    BookOpenIcon, UserCircleIcon, CreditCardIcon, CloudArrowUpIcon,
    TrashIcon, QuestionMarkCircleIcon, ArrowLeftOnRectangleIcon,
    ChevronRightIcon, PencilIcon, CameraIcon, InformationCircleIcon,
} from '@heroicons/react/24/outline';

const SettingsMenuItem = ({ icon: Icon, title, subtitle, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-colors ${
            active
            ? 'bg-blue-100 text-[#0173AE]'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        <Icon className="h-6 w-6 mr-4 flex-shrink-0" />
        <div className="flex-grow">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
    </button>
);

const Profile = () => {
    const [activeSetting, setActiveSetting] = useState('backup');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ message: '', type: '' });

    // State for editing form
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await profileService.getProfile();
                setUserData(data);
                setFullName(data.fullName || '');
                setMobile(data.mobile || '');
                setEmail(data.email || '');
                setProfileImagePreview(data.avatar || '');
            } catch (err) {
                setError('Failed to fetch profile data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);
    
    // Function to dismiss notification
    const clearNotification = () => setNotification({ message: '', type: '' });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        clearNotification();

        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('mobile', mobile);
        formData.append('email', email);
        if (profileImageFile) {
            formData.append('avatar', profileImageFile);
        }

        try {
            // Correctly call the renamed `updateProfile` function
            const updatedUser = await profileService.updateProfile(formData);
            setUserData(updatedUser);
            setProfileImagePreview(updatedUser.avatar);
            setNotification({ message: 'Profile updated successfully!', type: 'success' });
            setTimeout(() => {
                setActiveSetting('backup');
                clearNotification();
            }, 2000);
        } catch (err) {
            setNotification({ message: err.message || 'Failed to update profile.', type: 'error' });
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleBackup = async () => {
        setIsSubmitting(true);
        clearNotification();
        try {
            const backupResponse = await profileService.triggerBackup();
            // Assuming the backend returns the updated user object with the new lastBackup timestamp
            setUserData(prevData => ({ ...prevData, lastBackup: backupResponse.lastBackup }));
            setNotification({ message: backupResponse.message || 'Backup completed!', type: 'success' });
        } catch (err) {
            setNotification({ message: err.message || 'Backup failed.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center w-full">Loading profile...</div>;
    if (error) return <div className="p-8 text-red-500 text-center w-full">{error}</div>;
    if (!userData) return <div className="p-8 text-center w-full">No user data found.</div>;

    const renderContent = () => {
        switch (activeSetting) {
            case 'backup':
                return (
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Backup Information</h2>
                        <p className="mt-2 text-gray-600">Your data is backed-up when connected. You can also trigger a manual backup.</p>
                        <div className="mt-6 border-t pt-4">
                            <p className="text-sm text-gray-500">Last Backup at</p>
                            <p className="text-md font-semibold text-gray-700">
                                {userData.lastBackup ? new Date(userData.lastBackup).toLocaleString() : 'Never'}
                            </p>
                        </div>
                         <div className="mt-6">
                            <button onClick={handleBackup} disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-[#00264B] text-white rounded-lg hover:opacity-90 disabled:bg-gray-400">
                                {isSubmitting ? 'Backing up...' : 'Backup Now'}
                            </button>
                        </div>
                    </div>
                );

            case 'editProfile':
                return (
                    <form onSubmit={handleSaveChanges}>
                        <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
                        <p className="mt-2 text-sm text-gray-500">Update your photo and personal details.</p>
                        {/* Form fields... */}
                        <div className="mt-6 space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <img src={profileImagePreview} alt="Profile" className="h-20 w-20 rounded-full object-cover"/>
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100">
                                        <CameraIcon className="h-5 w-5 text-gray-600"/>
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*"/>
                                </div>
                            </div>
                            <div className="border-t pt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full max-w-sm border rounded-lg p-2.5 text-sm focus:border-[#0173AE] focus:ring-[#0173AE]"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                                    <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="mt-1 w-full max-w-sm border rounded-lg p-2.5 text-sm focus:border-[#0173AE] focus:ring-[#0173AE]"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full max-w-sm border rounded-lg p-2.5 text-sm focus:border-[#0173AE] focus:ring-[#0173AE]"/>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-5 border-t flex justify-end space-x-3">
                            <button type="button" onClick={() => setActiveSetting('backup')} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-[#00264B] text-white rounded-lg hover:opacity-90 disabled:bg-gray-400">
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                );

            default:
                return <div>Select a setting to view details.</div>;
        }
    };

    return (
        <div className="flex h-screen bg-white font-sans">
            <aside className="w-80 bg-gray-50 border-r flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex items-center">
                        <img src={userData.avatar} alt="User" className="h-12 w-12 rounded-full object-cover"/>
                        <div className="ml-3 flex-grow">
                            <p className="font-bold text-gray-800">{userData.fullName}</p>
                            <p className="text-sm text-gray-500">{userData.email}</p>
                        </div>
                        <button onClick={() => { setActiveSetting('editProfile'); clearNotification(); }} className="p-2 rounded-full hover:bg-gray-200"><PencilIcon className="h-5 w-5 text-gray-600"/></button>
                    </div>
                </div>
                <nav className="flex-grow p-4 space-y-2">
                    <SettingsMenuItem icon={UserCircleIcon} title="Account Settings" subtitle="Manage your profile" active={activeSetting === 'account'} onClick={() => { setActiveSetting('account'); clearNotification(); }}/>
                    <SettingsMenuItem icon={CreditCardIcon} title="Plans and Billing" subtitle="Manage your plans and invoices" active={activeSetting === 'billing'} onClick={() => { setActiveSetting('billing'); clearNotification(); }}/>
                    <SettingsMenuItem icon={CloudArrowUpIcon} title="Backup Information" subtitle="Check your data sync status" active={activeSetting === 'backup'} onClick={() => { setActiveSetting('backup'); clearNotification(); }}/>
                    <SettingsMenuItem icon={TrashIcon} title="Recycle Bin" subtitle="Access deleted data" active={activeSetting === 'recycle'} onClick={() => { setActiveSetting('recycle'); clearNotification(); }}/>
                    <SettingsMenuItem icon={QuestionMarkCircleIcon} title="Help & Support" subtitle="Understand how SmartDhandha works" active={activeSetting === 'help'} onClick={() => { setActiveSetting('help'); clearNotification(); }}/>
                    <SettingsMenuItem icon={ArrowLeftOnRectangleIcon} title="Logout" subtitle="You will be logged out" active={activeSetting === 'logout'} onClick={() => { /* Add logout logic here */ }}/>
                </nav>
            </aside>
            <main className="flex-1 p-8 bg-white overflow-y-auto">
                 {/* Notification Area */}
                {notification.message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <InformationCircleIcon className="h-5 w-5 mr-3"/>
                        {notification.message}
                    </div>
                )}
                {renderContent()}
            </main>
        </div>
    );
}

export default Profile;