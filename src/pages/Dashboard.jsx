import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import all services (assuming profileService is where API calls are wrapped)
import * as profileService from '../services/profileService';

// Import Chart.js components
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler // <-- ADDED FILLER
} from 'chart.js';

// Import Navbar and Icons
import Navbar from '../components/Navbar'; // Assuming this component exists
import {
    FiTrendingUp, FiDollarSign, FiTrendingDown, FiAlertTriangle, FiFileText, FiArrowRightCircle, FiArrowLeftCircle, FiUserCheck,
    FiArchive, FiTarget
} from 'react-icons/fi';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler); // <-- REGISTERED FILLER

// --- Helper Functions ---
const formatINR = (n) => (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDateTime = (isoString) => new Date(isoString).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });


// --- Child Components ---

const KPICard = ({ title, value, subtext, icon, colorClass }) => (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-5 transition-transform transform hover:scale-105">
        <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            {/* The value format is set here */}
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
    </div>
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
        <div className="flex items-start gap-4 p-2 -m-2 rounded-lg hover:bg-gray-50">
            <div className={`w-10 h-10 text-lg rounded-full flex-shrink-0 flex items-center justify-center ${color}`}>{icon}</div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-gray-700">{item.text}</p>
                <p className="text-xs text-gray-400">{formatDateTime(item.date)}</p>
            </div>
            {item.amount != null && (
                <p className={`text-sm font-semibold whitespace-nowrap ${item.type === 'EXPENSE' ? 'text-orange-600' : 'text-gray-800'}`}>
                    ₹ {formatINR(item.amount)}
                </p>
            )}
        </div>
    );
};

// MODIFIED: This component is already showing the revenue, which is the "price" of the top selling product in aggregate.
const TopSellingProductItem = ({ product, index }) => (
    <div className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center gap-4">
            <div className="text-lg font-bold text-gray-400 w-4">{index + 1}.</div>
            <div className="flex-grow">
                <p className="font-medium text-gray-800">{product.name}</p>
                <p className="text-xs text-gray-500">{product.category}</p>
            </div>
            <div className="font-semibold text-gray-700 whitespace-nowrap">
                ₹{formatINR(product.revenue)} {/* Displaying total revenue as the "price" */}
            </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 ml-8">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${product.percentage}%` }}></div>
        </div>
    </div>
);

// New LowStockItem component (used in previous logic)
const LowStockItem = ({ item }) => (
    <div key={item._id} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 -m-2 rounded-lg">
        <div className='flex-grow'>
            <span className="font-medium text-gray-700">{item.name}</span>
            <span className='text-xs text-gray-400 ml-2'>({item.category})</span> 
        </div>
        <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0">{item.stock} left</span>
    </div>
);


// --- Main Dashboard Component ---
const Dashboard = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [salesChartData, setSalesChartData] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [incomeVsExpenseData, setIncomeVsExpenseData] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                const results = await Promise.allSettled([
                    profileService.getProfile(),
                    profileService.getDashboardStats(),
                    profileService.getSalesChartData(),
                    profileService.getRecentActivity(),
                    profileService.getLowStockItems(),
                    profileService.getTopSellingProducts(),
                    profileService.getIncomeVsExpenseChartData()
                ]);

                const processResult = (result, setData, errorMsg) => {
                    if (result.status === 'fulfilled') {
                        setData(result.value);
                    } else {
                        toast.error(errorMsg);
                        console.error(errorMsg, result.reason);
                    }
                };
                
                processResult(results[0], setUserProfile, 'Failed to load user profile.');
                processResult(results[1], setStats, 'Failed to load dashboard stats.');
                processResult(results[2], setSalesChartData, 'Failed to load sales chart.');
                processResult(results[3], setRecentActivity, 'Failed to load recent activity.');
                processResult(results[4], setLowStockItems, 'Failed to load low stock items.');
                processResult(results[5], setTopSellingProducts, 'Failed to load top products.');
                processResult(results[6], setIncomeVsExpenseData, 'Failed to load income/expense chart.');

            } catch (err) {
                toast.error('An unexpected error occurred.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const barChartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { 
            legend: { 
                display: false 
            },
            title: {
                display: true,
                text: 'Total Sales Revenue (Last 7 Days)', 
                font: { size: 16 }
            }
        },
        scales: { 
            y: { 
                ticks: { 
                    callback: value => '₹' + (value / 1000) + 'k' 
                },
                title: { display: true, text: 'Revenue (INR)' } 
            },
            x: {
                title: { display: true, text: 'Day' } 
            }
        }
    };
    
    const lineChartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { 
            legend: { 
                position: 'top', 
                align: 'end' 
            },
            title: {
                display: true,
                text: 'Cash Flow: Income vs. Expense (Last 30 Days)', 
                font: { size: 16 }
            }
        },
        scales: { 
            y: { 
                ticks: { 
                    callback: value => '₹' + (value / 1000) + 'k' 
                },
                title: { display: true, text: 'Amount (INR)' } 
            },
            x: {
                title: { display: true, text: 'Date' } 
            }
        },
        tension: 0.4,
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Dashboard...</div>;
    }

    // Defensive check, though stats should be populated if loading is false
    const s = stats || {}; 

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
            {/* Assuming userProfile is available */}
            <Navbar businessName={userProfile?.businessName || 'Business'} userName={userProfile?.fullName || 'User'} userEmail={userProfile?.email || 'email@example.com'} avatar={userProfile?.avatar} />
            <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-screen-2xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {userProfile?.fullName.split(' ')[0] || 'User'}!</h1>
                        <p className="text-gray-500 mt-1">Here's your complete business overview for today.</p>
                    </div>

                    {/* KPIs - 3x2 Grid (Using 's' for safer access to stats) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <KPICard title="Sales Today" value={`₹ ${formatINR(s.salesToday)}`} icon={<FiTrendingUp className="h-7 w-7 text-green-600" />} colorClass="bg-green-100" />
                        <KPICard title="Gross Profit Today" value={`₹ ${formatINR(s.profitToday)}`} icon={<FiTarget className="h-7 w-7 text-indigo-600" />} colorClass="bg-indigo-100" />
                        <KPICard title="Total Receivables" value={`₹ ${formatINR(s.totalReceivables)}`} icon={<FiDollarSign className="h-7 w-7 text-blue-600" />} colorClass="bg-blue-100" />
                        <KPICard title="Expenses (Month)" value={`₹ ${formatINR(s.expensesThisMonth)}`} icon={<FiTrendingDown className="h-7 w-7 text-orange-600" />} colorClass="bg-orange-100" />
                        <KPICard title="Inventory Value" value={`₹ ${formatINR(s.inventoryValue)}`} icon={<FiArchive className="h-7 w-7 text-teal-600" />} colorClass="bg-teal-100" />
                        <KPICard title="Low Stock Alerts" value={s.lowStockCount} subtext="items" icon={<FiAlertTriangle className="h-7 w-7 text-red-600" />} colorClass="bg-red-100" />
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Column (Charts and Top Products) */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs. Expense (Last 30 Days)</h3>
                                <div className="h-80">
                                    {incomeVsExpenseData ? <Line data={incomeVsExpenseData} options={lineChartOptions} /> : <p>Loading chart...</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-2xl shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales This Week</h3>
                                    <div className="h-80">
                                        {salesChartData ? <Bar data={salesChartData} options={barChartOptions} /> : <p>Loading chart...</p>}
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products (by Revenue)</h3>
                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                        {topSellingProducts.length > 0 ? topSellingProducts.map((p, i) => <TopSellingProductItem key={p.id} product={p} index={i} />) : <p className="text-sm text-gray-400 text-center pt-8">No sales data available.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Activity and Stock) */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {recentActivity.length > 0 ? recentActivity.map(item => <ActivityItem key={item.id} item={item} />) : <p className="text-sm text-gray-400 text-center pt-8">No recent activity.</p>}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Items</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {lowStockItems.length > 0 ? lowStockItems.map(item => <LowStockItem key={item._id} item={item} />) : <p className="text-sm text-gray-400 text-center pt-8">All products are well-stocked!</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </>
    );
};

export default Dashboard;
