import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import all services
import * as profileService from '../services/profileService';

// Import Chart.js components
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Import Navbar and Icons
import Navbar from '../components/Navbar';
import {
    FiTrendingUp, FiDollarSign, FiTrendingDown, FiAlertTriangle, FiFilePlus, FiFileMinus,
    FiUsers, FiUserPlus, FiFileText, FiArrowRightCircle, FiArrowLeftCircle, FiUserCheck, FiBell
} from 'react-icons/fi';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Helper Functions ---
const formatINR = (n) => (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDateTime = (isoString) => new Date(isoString).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });


// --- Child Components ---
// (Keeping these here as you had them, for a single-file component)

const KPICard = ({ title, value, subtext, icon, colorClass }) => (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-5 transition-transform transform hover:scale-105">
        <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
    </div>
);

const ActionButton = ({ to, icon, label }) => (
    <Link to={to} className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl shadow p-4 text-center hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1">
        <div className="w-16 h-16 bg-blue-100 text-[#003B6F] rounded-full flex items-center justify-center text-3xl">
            {icon}
        </div>
        <span className="font-semibold text-gray-700 text-sm mt-2">{label}</span>
    </Link>
);

const ActivityItem = ({ item }) => {
    const activityTypes = {
        INVOICE: { icon: <FiFileText />, color: 'bg-green-100 text-green-600' },
        INCOME: { icon: <FiArrowRightCircle />, color: 'bg-blue-100 text-blue-600' },
        EXPENSE: { icon: <FiArrowLeftCircle />, color: 'bg-orange-100 text-orange-600' },
        VISITOR: { icon: <FiUserCheck />, color: 'bg-purple-100 text-purple-600' },
    };
    const { icon, color } = activityTypes[item.type] || activityTypes['INVOICE'];
    return (
        <div className="flex items-start gap-4">
            <div className={`w-10 h-10 text-lg rounded-full flex-shrink-0 flex items-center justify-center ${color}`}>{icon}</div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-gray-700">{item.text}</p>
                <p className="text-xs text-gray-400">{formatDateTime(item.date)}</p>
            </div>
            {item.amount != null && ( // Check for not null or undefined
                <p className={`text-sm font-semibold whitespace-nowrap ${item.type === 'EXPENSE' ? 'text-orange-600' : 'text-gray-800'}`}>
                    ₹ {formatINR(item.amount)}
                </p>
            )}
        </div>
    );
};


// --- Main Dashboard Component ---
const Dashboard = () => {
    // State for all dynamic data
    const [userProfile, setUserProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fetch all data in parallel
                const results = await Promise.allSettled([
                    profileService.getProfile(),
                    profileService.getDashboardStats(),
                    profileService.getSalesChartData(),
                    profileService.getRecentActivity(),
                    profileService.getLowStockItems()
                ]);

                // Process results
                if (results[0].status === 'fulfilled') {
                    setUserProfile(results[0].value);
                } else {
                    toast.error('Failed to load user profile.');
                    console.error(results[0].reason);
                }

                if (results[1].status === 'fulfilled') {
                    setStats(results[1].value);
                } else {
                    toast.error('Failed to load dashboard stats.');
                    console.error(results[1].reason);
                }

                if (results[2].status === 'fulfilled') {
                    setChartData(results[2].value);
                } else {
                    toast.error('Failed to load chart data.');
                    console.error(results[2].reason);
                }

                if (results[3].status === 'fulfilled') {
                    setRecentActivity(results[3].value);
                } else {
                    toast.error('Failed to load recent activity.');
                    console.error(results[3].reason);
                }
                
                if (results[4].status === 'fulfilled') {
                    setLowStockItems(results[4].value);
                } else {
                    toast.error('Failed to load low stock items.');
                    console.error(results[4].reason);
                }

            } catch (err) {
                // This catch block is for general errors, though Promise.allSettled handles most.
                toast.error('An unexpected error occurred.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Chart options
    const chartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                ticks: {
                    // Format Y-axis ticks as currency
                    callback: function(value) {
                        return '₹' + (value / 1000) + 'k';
                    }
                }
            }
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Dashboard...</div>;
    }

    if (!userProfile || !stats) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">Error: Could not load essential dashboard data. Please try logging in again.</div>;
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Navbar
                businessName={userProfile.businessName}
                userName={userProfile.fullName}
                userEmail={userProfile.email}
                avatar={userProfile.avatar} // Pass avatar to Navbar
            />
            <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-screen-xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {userProfile.fullName.split(' ')[0]}!</h1>
                        <p className="text-gray-500 mt-1">Here's a snapshot of your business today.</p>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard title="Sales Today" value={`₹ ${formatINR(stats.salesToday)}`} icon={<FiTrendingUp className="h-7 w-7 text-green-600" />} colorClass="bg-green-100" />
                        <KPICard title="Total Receivables" value={`₹ ${formatINR(stats.totalReceivables)}`} icon={<FiDollarSign className="h-7 w-7 text-blue-600" />} colorClass="bg-blue-100" />
                        <KPICard title="Expenses (This Month)" value={`₹ ${formatINR(stats.expensesThisMonth)}`} icon={<FiTrendingDown className="h-7 w-7 text-orange-600" />} colorClass="bg-orange-100" />
                        <KPICard title="Low Stock Alerts" value={stats.lowStockCount} subtext="items" icon={<FiAlertTriangle className="h-7 w-7 text-red-600" />} colorClass="bg-red-100" />
                    </div>

                    {/* Quick Actions (Static) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <ActionButton to="/inventory/new-invoice" icon={<FiFilePlus />} label="New Invoice" />
                        <ActionButton to="/cashflow/new-expense" icon={<FiFileMinus />} label="Add Expense" />
                        <ActionButton to="/customers" icon={<FiUsers />} label="Manage Customers" />
                        <ActionButton to="/visitors/new" icon={<FiUserPlus />} label="Log Visitor" />
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sales Chart */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales This Week</h3>
                            <div className="h-80">
                                {chartData ? (
                                    <Bar data={chartData} options={chartOptions} />
                                ) : (
                                    <p className="text-sm text-gray-400 text-center pt-8">Loading chart data...</p>
                                )}
                            </div>
                        </div>

                        {/* Low Stock Alerts */}
                        <div className="bg-white rounded-2xl shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Items</h3>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {lowStockItems.length > 0 ? lowStockItems.map(item => (
                                    <div key={item._id} className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                        <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{item.stock} left</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400 text-center pt-8">All products are well-stocked!</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Activity */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {recentActivity.length > 0 ? recentActivity.map(item => <ActivityItem key={item.id} item={item} />) : <p className="text-sm text-gray-400">No recent activity.</p>}
                            </div>
                        </div>

                        {/* Payment Reminders (Static placeholder) */}
                        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center text-center">
                            <FiBell className="h-12 w-12 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-800 mt-4">Payment Reminders</h3>
                            <p className="text-sm text-gray-500 mt-2">Upcoming payment reminders from your ledger will appear here.</p>

                            <Link to="/customers" className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200">View Customers</Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Dashboard;
