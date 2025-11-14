import React, { useState, useEffect, useMemo } from 'react';
import { get } from '../../services/inventoryService'; 
import { get as getLedger } from '../../services/ledgerService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Helper Functions ---
const todayISO = () => new Date().toISOString().slice(0, 10);
const firstDayOfMonthISO = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const formatINR = (n) => (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// --- Child Components ---

// KPI Card for displaying key numbers
const KPI = ({ title, value, color = 'text-blue-600' }) => (
    <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-sm text-gray-500 uppercase font-semibold">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

// Main Reports Page Component
const Reports = () => {
    // --- State Management ---
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [cashflows, setCashflows] = useState([]);
    const [ledgers, setLedgers] = useState([]); // 🚨 NEW STATE
    const [loading, setLoading] = useState(true);
    const [activeReport, setActiveReport] = useState('p&l'); // Default to Profit & Loss
    const [dateFilter, setDateFilter] = useState({
        from: firstDayOfMonthISO(),
        to: todayISO(),
    });

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [invoicesData, productsData, cashflowsData, ledgersData] = await Promise.all([
                    get('invoices'),
                    get('products'),
                    get('cashflows'),
                    get('ledger'), // 🚨 NEW API CALL
                ]);
                setInvoices(invoicesData);
                setProducts(productsData);
                setCashflows(cashflowsData);
                setLedgers(ledgersData); // Set ledger state
            } catch (err) {
                toast.error('Failed to fetch report data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    // --- Memoized Data Filtering ---
    const filteredData = useMemo(() => {
        const { from, to } = dateFilter;
        if (!from || !to) {
            // Include ledgers in the return object structure
            return { sales: [], purchases: [], expenses: [], ledgers: [] }; 
        }
        
        const sales = invoices.filter(i => i.type === 'sale' && i.date >= from && i.date <= to);
        const purchases = invoices.filter(i => i.type === 'purchase' && i.date >= from && i.date <= to);
        
        const expenses = cashflows.filter(c => 
            c.kind === 'expense' && 
            c.category !== 'Product Purchase' && 
            c.date >= from && 
            c.date <= to
        );

        // Filter ledger transactions by date range
        const filteredLedgers = ledgers.filter(l => l.date >= from && l.date <= to);
        
        return { sales, purchases, expenses, ledgers: filteredLedgers };
    }, [invoices, cashflows, ledgers, dateFilter]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Generating Reports...</div>;
    }

    const renderReport = () => {
        switch (activeReport) {
            case 'sales': return <SalesReport sales={filteredData.sales} products={products} />;
            case 'purchases': return <PurchaseReport purchases={filteredData.purchases} />;
            case 'stock': return <StockReport products={products} />;
            case 'gst': return <GstReport sales={filteredData.sales} purchases={filteredData.purchases} />;
            case 'ledger': return <LedgerReport ledgers={ledgers} />; // 🚨 NEW REPORT
            case 'p&l':
            default:
                return <ProfitAndLossStatement data={filteredData} />;
        }
    };
    
    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <div className="min-h-screen bg-gray-50">
                {/* Top Bar */}
                <div className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <h1 className="text-2xl font-semibold tracking-wide">Business Reports</h1>
                        <p className="text-white/80 text-sm">Insights into your Sales, Stock, and Profitability</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-2xl shadow p-4 mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Report Tabs */}
                            <div className="flex flex-wrap gap-2">
                                {['p&l', 'sales', 'purchases', 'stock', 'gst', 'ledger'].map(reportKey => (
                                    <button
                                        key={reportKey}
                                        onClick={() => setActiveReport(reportKey)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeReport === reportKey ? 'bg-[#003B6F] text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        { { 'p&l': 'Profit & Loss', 'sales': 'Sales', 'purchases': 'Purchases', 'stock': 'Stock', 'gst': 'GST', 'ledger': 'Ledger' }[reportKey] }
                                    </button>
                                ))}
                            </div>

                            {/* Date Filter */}
                            {['p&l', 'sales', 'purchases', 'gst', 'ledger'].includes(activeReport) && (
                                <div className="flex items-center gap-2 text-sm">
                                    <label>From:</label>
                                    <input type="date" value={dateFilter.from} onChange={e => setDateFilter({...dateFilter, from: e.target.value})} className="border rounded-lg px-2 py-1" />
                                    <label>To:</label>
                                    <input type="date" value={dateFilter.to} onChange={e => setDateFilter({...dateFilter, to: e.target.value})} className="border rounded-lg px-2 py-1" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Render the active report component */}
                    {renderReport()}
                </div>
            </div>
        </>
    );
};

// --- Ledger Report Component ---
const LedgerReport = ({ ledgers }) => {
    // Group transactions by customer/supplier
    const ledgerBalances = useMemo(() => {
        const balances = {};
        // Note: Logic assumes each ledger transaction has 'customerName' or 'supplierName' and 'type' (Credit/Debit)
        ledgers.forEach(l => {
            const name = l.customerName || l.supplierName || 'Unknown Party'; 
            const type = l.type; 

            if (!balances[name]) {
                balances[name] = { credit: 0, debit: 0, balance: 0, transactions: [] };
            }

            const amount = Number(l.amount) || 0;

            if (type && type.toLowerCase() === 'credit') {
                balances[name].credit += amount;
                balances[name].balance += amount; // Credit increases balance due to us (receivable)
            } else if (type && type.toLowerCase() === 'debit') {
                balances[name].debit += amount;
                balances[name].balance -= amount; // Debit decreases balance due to us (or increases payable)
            }
            balances[name].transactions.push(l);
        });
        return Object.entries(balances).map(([name, data]) => ({ name, ...data }));
    }, [ledgers]);

    // Calculate overall business status
    const totalReceivable = ledgerBalances.reduce((sum, b) => sum + (b.balance > 0 ? b.balance : 0), 0);
    const totalPayable = ledgerBalances.reduce((sum, b) => sum + (b.balance < 0 ? Math.abs(b.balance) : 0), 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPI title="Total Receivables (To Collect)" value={`₹ ${formatINR(totalReceivable)}`} color="text-green-600" />
                <KPI title="Total Payables (To Pay)" value={`₹ ${formatINR(totalPayable)}`} color="text-red-600" />
                <KPI title="Net Position" value={`₹ ${formatINR(totalReceivable - totalPayable)}`} color={totalReceivable - totalPayable >= 0 ? 'text-blue-600' : 'text-orange-500'} />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-semibold mb-4">Party Balances (Net Position)</h3>
                <div className="overflow-y-auto max-h-[60vh]">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 font-medium text-left">Customer/Supplier</th>
                                <th className="px-3 py-2 font-medium text-right">Total Credit (Rec.)</th>
                                <th className="px-3 py-2 font-medium text-right">Total Debit (Paid/Due)</th>
                                <th className="px-3 py-2 font-medium text-right">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledgerBalances.map((item, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-3 py-2 font-medium">{item.name}</td>
                                    <td className="px-3 py-2 text-right text-green-600">₹ {formatINR(item.credit)}</td>
                                    <td className="px-3 py-2 text-right text-red-600">₹ {formatINR(item.debit)}</td>
                                    <td className={`px-3 py-2 text-right font-semibold ${item.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                        ₹ {formatINR(item.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
// --- Report Specific Components (Unchanged) ---

const SalesReport = ({ sales, products }) => {
    const totalSales = sales.reduce((sum, inv) => sum + inv.totalGrand, 0);
    const totalGst = sales.reduce((sum, inv) => sum + inv.totalGST, 0);

    const topSellingProducts = useMemo(() => {
        const productCount = {};
        sales.forEach(inv => {
            inv.items.forEach(item => {
                productCount[item.productId] = (productCount[item.productId] || 0) + item.qty;
            });
        });

        return Object.entries(productCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // Top 5 products
            .map(([productId, qty]) => ({
                name: products.find(p => p._id === productId)?.name || 'Unknown Product',
                qty,
            }));
    }, [sales, products]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPI title="Total Sales" value={`₹ ${formatINR(totalSales)}`} />
                <KPI title="Total GST Collected" value={`₹ ${formatINR(totalGst)}`} />
                <div className="bg-white rounded-xl shadow-md p-4">
                    <h3 className="text-sm text-gray-500 uppercase font-semibold">Top Selling Products</h3>
                    {topSellingProducts.length > 0 ? (
                        <ol className="text-sm list-decimal list-inside mt-2 space-y-1">
                            {topSellingProducts.map(p => <li key={p.name}><strong>{p.name}</strong> ({p.qty} units)</li>)}
                        </ol>
                    ) : <p className="text-sm text-gray-400 mt-2">No sales data in this period.</p>}
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-semibold mb-2">Invoices in this Period</h3>
                <div className="overflow-y-auto max-h-96">
                    <table className="min-w-full text-xs">
                        {/* Table similar to 'All Invoices' tab */}
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 font-medium">Date</th>
                                <th className="px-3 py-2 font-medium">Customer</th>
                                <th className="px-3 py-2 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(inv => (
                                <tr key={inv._id} className="border-t">
                                    <td className="px-3 py-2">{inv.date}</td>
                                    <td className="px-3 py-2">{inv.customerName}</td>
                                    <td className="px-3 py-2 text-right font-semibold">₹ {formatINR(inv.totalGrand)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PurchaseReport = ({ purchases }) => {
    const totalPurchases = purchases.reduce((sum, inv) => sum + inv.totalGrand, 0);
    const totalGst = purchases.reduce((sum, inv) => sum + inv.totalGST, 0);
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KPI title="Total Purchases" value={`₹ ${formatINR(totalPurchases)}`} color="text-red-600" />
                <KPI title="Total GST Paid (ITC)" value={`₹ ${formatINR(totalGst)}`} color="text-orange-500" />
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-semibold mb-2">Purchase Bills in this Period</h3>
                <div className="overflow-y-auto max-h-96">
                    <table className="min-w-full text-xs">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 font-medium">Date</th>
                                <th className="px-3 py-2 font-medium">Supplier</th>
                                <th className="px-3 py-2 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map(inv => (
                                <tr key={inv._id} className="border-t">
                                    <td className="px-3 py-2">{inv.date}</td>
                                    <td className="px-3 py-2">{inv.customerName}</td>
                                    <td className="px-3 py-2 text-right font-semibold">₹ {formatINR(inv.totalGrand)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StockReport = ({ products }) => {
    const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.unitPrice), 0);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Stock & Valuation Report</h3>
                <KPI title="Total Stock Value" value={`₹ ${formatINR(totalStockValue)}`} />
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 font-medium text-left">Product Name</th>
                            <th className="px-3 py-2 font-medium text-center">Current Stock</th>
                            <th className="px-3 py-2 font-medium text-right">Unit Price</th>
                            <th className="px-3 py-2 font-medium text-right">Stock Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p._id} className="border-t">
                                <td className="px-3 py-2 font-medium">{p.name}</td>
                                <td className="px-3 py-2 text-center font-bold">{p.stock}</td>
                                <td className="px-3 py-2 text-right">₹ {formatINR(p.unitPrice)}</td>
                                <td className="px-3 py-2 text-right font-semibold text-blue-600">₹ {formatINR(p.stock * p.unitPrice)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GstReport = ({ sales, purchases }) => {
    const outputGst = sales.reduce((sum, inv) => sum + inv.totalGST, 0);
    const inputGst = purchases.reduce((sum, inv) => sum + inv.totalGST, 0);
    const netGst = outputGst - inputGst;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-center mb-4">GST Summary</h3>
            <div className="space-y-3">
                <div className="flex justify-between text-base">
                    <span className="text-gray-600">Output GST (on Sales)</span>
                    <span className="font-semibold text-green-600">₹ {formatINR(outputGst)}</span>
                </div>
                <div className="flex justify-between text-base">
                    <span className="text-gray-600">Input GST (on Purchases)</span>
                    <span className="font-semibold text-red-600">- ₹ {formatINR(inputGst)}</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between text-lg font-bold">
                    <span>Net GST Payable</span>
                    <span className={netGst >= 0 ? 'text-blue-600' : 'text-orange-500'}>₹ {formatINR(netGst)}</span>
                </div>
                <p className="text-xs text-gray-500 text-center pt-2">
                    {netGst >= 0 ? "This is the amount payable to the government." : "You have an Input Tax Credit (ITC) to claim."}
                </p>
            </div>
        </div>
    );
};

const ProfitAndLossStatement = ({ data }) => {
    const { sales, purchases, expenses } = data;
    const totalRevenue = sales.reduce((sum, inv) => sum + inv.totalGrand, 0);
    const cogs = purchases.reduce((sum, inv) => sum + inv.totalGrand, 0);
    const grossProfit = totalRevenue - cogs;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-center text-[#003B6F] mb-4">Profit & Loss Statement</h3>
            <div className="space-y-4 text-base">
                {/* Revenue */}
                <div className="flex justify-between">
                    <span className="font-semibold">Total Revenue (Sales)</span>
                    <span className="font-bold text-green-600">₹ {formatINR(totalRevenue)}</span>
                </div>
                {/* COGS */}
                <div className="flex justify-between">
                    <span className="font-semibold">Less: Cost of Goods Sold (Purchases)</span>
                    <span className="font-bold text-red-600">- ₹ {formatINR(cogs)}</span>
                </div>
                {/* Gross Profit */}
                <div className="border-t-2 border-b-2 py-2 my-2 flex justify-between font-bold text-lg">
                    <span>Gross Profit</span>
                    <span className={grossProfit >= 0 ? 'text-gray-800' : 'text-red-600'}>₹ {formatINR(grossProfit)}</span>
                </div>
                {/* Expenses */}
                <div className="flex justify-between">
                    <span className="font-semibold">Less: Operating Expenses</span>
                    <span className="font-bold text-red-600">- ₹ {formatINR(totalExpenses)}</span>
                </div>
                {/* Net Profit */}
                <div className="bg-blue-100 p-3 rounded-lg flex justify-between font-extrabold text-xl text-[#003B6F]">
                    <span>Net Profit</span>
                    <span className={netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}>₹ {formatINR(netProfit)}</span>
                </div>
            </div>
        </div>
    );
};

export default Reports;