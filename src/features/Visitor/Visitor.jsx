import React, { useState, useEffect, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- API Service Functions (Local to this component) ---
// Using a base URL for your API. Adjust if needed.
const API_BASE_URL = '/api';

const getVisitors = async () => {
    const response = await fetch(`${API_BASE_URL}/visitors`);
    if (!response.ok) throw new Error('Failed to fetch visitors');
    return response.json();
};

const addVisitor = async (visitorData) => {
    const response = await fetch(`${API_BASE_URL}/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData),
    });
    if (!response.ok) throw new Error('Failed to add visitor');
    return response.json();
};

const updateVisitor = async (visitorId, updateData) => {
    const response = await fetch(`${API_BASE_URL}/visitors/${visitorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new Error('Failed to update visitor');
    return response.json();
};


// --- Helper Functions ---
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};


// --- Child Components ---

// 1. Header with KPI Cards
const VisitorHeader = ({ businessName, stats }) => (
    <div className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-semibold tracking-wide">Visitor Log Book</h1>
            <p className="text-white/80 text-sm">Monitor and manage visitors for {businessName}</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPI title="Visitors Today" value={stats.totalToday} />
                <KPI title="Currently Inside" value={stats.currentlyInside} />
                <KPI title="Total Entries" value={stats.totalEntries} />
            </div>
        </div>
    </div>
);

const KPI = ({ title, value }) => (
    <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
        <div className="text-xs uppercase tracking-wider opacity-80">{title}</div>
        <div className="text-2xl font-bold truncate">{value}</div>
    </div>
);

// 2. Actions Bar (Search and Add Button)
const VisitorActions = ({ searchTerm, onSearchChange, onAddVisitorClick }) => (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Visitor Entries</h2>
        <div className="flex items-center gap-3">
            <input
                type="text"
                placeholder="Search by name, phone, date..."
                className="border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            <button
                onClick={onAddVisitorClick}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap"
            >
                + Add Visitor
            </button>
        </div>
    </div>
);

// 3. Visitor Table
const VisitorTable = ({ visitors, onCheckOut }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
            <thead className="bg-[#003B6F] text-white text-xs uppercase">
                <tr>
                    <th className="px-3 py-2 font-medium">Visitor Name</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Purpose</th>
                    <th className="px-3 py-2 font-medium">Whom to Meet</th>
                    <th className="px-3 py-2 font-medium">Check-in Time</th>
                    <th className="px-3 py-2 font-medium">Check-out Time</th>
                    <th className="px-3 py-2 font-medium text-center">Status / Actions</th>
                </tr>
            </thead>
            <tbody>
                {visitors.length === 0 ? (
                    <tr>
                        <td colSpan="7" className="px-3 py-6 text-center text-gray-500">
                            No visitors to display.
                        </td>
                    </tr>
                ) : (
                    visitors.map((v) => (
                        <tr key={v._id} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">{v.name}</td>
                            <td className="px-3 py-2">{v.phone}</td>
                            <td className="px-3 py-2">{v.purpose}</td>
                            <td className="px-3 py-2">{v.whomToMeet || '—'}</td>
                            <td className="px-3 py-2">{formatDateTime(v.checkInTime)}</td>
                            <td className="px-3 py-2">{formatDateTime(v.checkOutTime)}</td>
                            <td className="px-3 py-2 text-center">
                                {v.checkOutTime ? (
                                    <span className="text-xs px-2 py-1 rounded-full font-semibold bg-gray-200 text-gray-700">
                                        Checked Out
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => onCheckOut(v._id)}
                                        className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Check-out
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

// 4. Visitor Check-in Modal
const VisitorCheckInModal = ({ show, onClose, onCheckIn }) => {
    const [visitorForm, setVisitorForm] = useState({
        name: '',
        phone: '',
        purpose: 'Meeting',
        whomToMeet: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onCheckIn(visitorForm);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-8">
                <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
                    <div className="text-lg font-semibold">New Visitor Check-in</div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name *</label>
                            <input
                                className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                                value={visitorForm.name}
                                onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number *</label>
                            <input
                                type="tel"
                                className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                                value={visitorForm.phone}
                                onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Purpose of Visit</label>
                        <select
                            className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm bg-white"
                            value={visitorForm.purpose}
                            onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                        >
                            <option>Meeting</option>
                            <option>Delivery</option>
                            <option>Official</option>
                            <option>Interview</option>
                            <option>Personal</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Whom to Meet</label>
                        <input
                            className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                            placeholder="e.g., Mr. Sharma"
                            value={visitorForm.whomToMeet}
                            onChange={(e) => setVisitorForm({ ...visitorForm, whomToMeet: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow text-sm font-medium hover:opacity-90"
                        >
                            Check In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Parent Component ---

const Visitors = ({ businessName = "SmartDhandha" }) => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAndSetVisitors = async () => {
        try {
            const data = await getVisitors();
            setVisitors(data.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)));
        } catch (err) {
            toast.error('Failed to fetch visitor data.');
            console.error(err);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchAndSetVisitors().finally(() => setLoading(false));
    }, []);

    const handleCheckIn = async (visitorFormData) => {
        if (!visitorFormData.name.trim() || !visitorFormData.phone.trim()) {
            toast.warn('Name and Phone Number are required.');
            return;
        }

        const newVisitor = {
            ...visitorFormData,
            checkInTime: new Date().toISOString(),
            checkOutTime: null,
        };

        try {
            await addVisitor(newVisitor);
            toast.success('Visitor checked in successfully! ✅');
            setShowModal(false);
            fetchAndSetVisitors(); // Refresh the list
        } catch (error) {
            toast.error('Failed to check in visitor.');
            console.error(error);
        }
    };

    const handleCheckOut = async (visitorId) => {
        if (window.confirm('Are you sure you want to check out this visitor?')) {
            const payload = { checkOutTime: new Date().toISOString() };
            try {
                await updateVisitor(visitorId, payload);
                toast.success('Visitor checked out successfully! 🕒');
                fetchAndSetVisitors(); // Refresh the list
            } catch (error) {
                toast.error('Failed to check out visitor.');
                console.error(error);
            }
        }
    };

    const filteredVisitors = useMemo(() => {
        return visitors.filter(v =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.phone.includes(searchTerm) ||
            (v.checkInTime && v.checkInTime.startsWith(searchTerm))
        );
    }, [visitors, searchTerm]);

    const dashboardStats = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const visitorsToday = visitors.filter(v => v.checkInTime && v.checkInTime.startsWith(todayStr));
        const currentlyInside = visitors.filter(v => !v.checkOutTime).length;
        return {
            totalToday: visitorsToday.length,
            currentlyInside: currentlyInside,
            totalEntries: visitors.length,
        };
    }, [visitors]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Visitor Log...</div>;
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <div className="min-h-screen bg-gray-50">
                <VisitorHeader businessName={businessName} stats={dashboardStats} />
                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-2xl shadow p-6">
                        <VisitorActions
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            onAddVisitorClick={() => setShowModal(true)}
                        />
                        <VisitorTable visitors={filteredVisitors} onCheckOut={handleCheckOut} />
                    </div>
                </main>
            </div>
            <VisitorCheckInModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onCheckIn={handleCheckIn}
            />
        </>
    );
};

export default Visitors;