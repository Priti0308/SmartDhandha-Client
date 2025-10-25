import React, { useState, useEffect, useMemo } from 'react';
import { get, post, put, deleteItem } from '../../services/inventoryService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper to format currency
const formatINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    customerType: 'Retail', // <-- Field re-added
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customerData, invoiceData] = await Promise.all([
            get('customers'),
            get('invoices')
        ]);
        setCustomers(customerData);
        setInvoices(invoiceData);
      } catch (err) {
        toast.error('Failed to fetch data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Modal handlers
  const openAddModal = () => {
    setEditId(null);
    setCustomerForm({ name: '', email: '', phone: '', address: '', gstin: '', customerType: 'Retail' });
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditId(customer._id);
    setCustomerForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      gstin: customer.gstin || '',
      customerType: customer.customerType || 'Retail', // <-- Field re-added
    });
    setShowModal(true);
  };
  
  const openViewModal = (customer) => {
    setViewCustomer(customer);
  };

  // Form submission (Add/Edit)
  const submitCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      toast.warn('Customer name is required.');
      return;
    }

    try {
      if (editId) {
        await put('customers', { ...customerForm, id: editId });
        toast.success('Customer updated successfully! ✅');
      } else {
        await post('customers', customerForm);
        toast.success('Customer added successfully! 🎉');
      }
      setCustomers(await get('customers'));
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save customer. Please try again.');
      console.error(error);
    }
  };

  // Delete customer with dependency check
  const deleteCustomer = async (customerId, customerName) => {
    const hasInvoices = invoices.some(inv => inv.customerName === customerName);
    if (hasInvoices) {
        toast.error("Cannot delete: This customer has existing invoices.");
        return;
    }

    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteItem('customers', customerId);
        setCustomers(await get('customers'));
        toast.success('Customer deleted successfully! 🗑️');
      } catch (error) {
        toast.error('Failed to delete customer.');
        console.error(error);
      }
    }
  };

  // Memoized calculations for search and pagination
  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  
  // Dashboard KPI calculation
  const dashboardStats = useMemo(() => {
    const salesByCustomer = invoices.filter(inv => inv.type === 'sale').reduce((acc, inv) => {
            acc[inv.customerName] = (acc[inv.customerName] || 0) + inv.totalGrand;
            return acc;
        }, {});
    
    let topCustomer = 'N/A';
    let maxSales = 0;
    for (const customer in salesByCustomer) {
        if (salesByCustomer[customer] > maxSales) {
            maxSales = salesByCustomer[customer];
            topCustomer = customer;
        }
    }
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const newCustomersThisMonth = customers.filter(c => c.createdAt && c.createdAt >= firstDayOfMonth).length;

    return {
        total: customers.length,
        topCustomer: { name: topCustomer, sales: maxSales },
        newThisMonth: newCustomersThisMonth,
    };
  }, [customers, invoices]);


  // PDF Download Handler
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 14, 16);
    doc.autoTable({
        startY: 20,
        head: [['Name', 'Phone', 'Email', 'Type', 'GSTIN', 'Address']], // <-- Column added
        body: customers.map(c => [
            c.name,
            c.phone || 'N/A',
            c.email || 'N/A',
            c.customerType || 'N/A', // <-- Data added
            c.gstin || 'N/A',
            (c.address || 'N/A').replace(/\n/g, ', ')
        ]),
        headStyles: { fillColor: [0, 59, 111] },
        styles: { fontSize: 8 },
    });
    doc.save('customers.pdf');
    toast.success("PDF downloaded!");
  };

  // Excel (CSV) Download Handler
  const downloadCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Type', 'GSTIN', 'Address']; // <-- Column added
    const rows = customers.map(c => [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        c.phone || '',
        c.email || '',
        c.customerType || '', // <-- Data added
        c.gstin || '',
        `"${(c.address || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(',') + '\n' 
        + rows.map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel (CSV) downloaded!");
  };
  

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading customers...</div>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-semibold tracking-wide">Customer Management</h1>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPI title="Total Customers" value={dashboardStats.total} isCurrency={false} />
                <KPI title="Top Customer" value={dashboardStats.topCustomer.name} subValue={`₹ ${formatINR(dashboardStats.topCustomer.sales)}`} />
                <KPI title="New This Month" value={dashboardStats.newThisMonth} isCurrency={false} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-gray-800">All Customers ({filteredCustomers.length})</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <input 
                    type="text"
                    placeholder="Search..."
                    className="border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm w-full sm:w-48"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
                <button onClick={downloadPDF} className="px-3 py-2 text-xs font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200">Download PDF</button>
                <button onClick={downloadCSV} className="px-3 py-2 text-xs font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200">Export Excel</button>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white hover:opacity-90 transition-opacity text-sm font-semibold whitespace-nowrap"
                >
                  + Add Customer
                </button>
              </div>
            </div>
            
            {/* Customer Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#003B6F] text-white text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Customer Name</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Type</th> {/* <-- Column re-added */}
                    <th className="px-3 py-2 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-6 text-center text-gray-500">
                        {searchTerm ? 'No customers match your search.' : 'No customers added yet.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((c) => (
                      <tr key={c._id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{c.name}</td>
                        <td className="px-3 py-2">{c.phone || '—'}</td>
                        <td className="px-3 py-2">{c.email || '—'}</td>
                        <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-700">{c.customerType || 'N/A'}</span></td> {/* <-- Data re-added */}
                        <td className="px-3 py-2 text-center space-x-2 whitespace-nowrap">
                          <button className="text-gray-600 hover:underline text-xs" onClick={() => openViewModal(c)}>View</button>
                          <button className="text-[#0066A3] hover:underline text-xs" onClick={() => openEditModal(c)}>Edit</button>
                          <button className="text-red-600 hover:underline text-xs" onClick={() => deleteCustomer(c._id, c.name)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 text-sm">
                <span className="text-gray-600">
                    Page {currentPage} of {totalPages || 1}
                </span>
                <div className="space-x-2">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl my-8">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
              <div className="text-lg font-semibold">{editId ? 'Edit Customer' : 'Add New Customer'}</div>
            </div>
            <form onSubmit={submitCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Customer Name *</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number</label>
                  <input type="tel" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <input type="email" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">GSTIN</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" placeholder="e.g., 27ABCDE1234F1Z5" value={customerForm.gstin} onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Customer Type</label> {/* <-- Field re-added --> */}
                  <select className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm bg-white" value={customerForm.customerType} onChange={(e) => setCustomerForm({ ...customerForm, customerType: e.target.value })}>
                      <option>Retail</option>
                      <option>Wholesale</option>
                      <option>Corporate</option>
                      <option>Online</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                   <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                   <textarea className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" rows="3" value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow text-sm font-medium hover:opacity-90">{editId ? 'Save Changes' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto" onClick={() => setViewCustomer(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl my-8" onClick={e => e.stopPropagation()}>
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white flex justify-between items-center">
              <div className="text-lg font-semibold">Customer Details</div>
              <button onClick={() => setViewCustomer(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <DetailRow label="Customer Name" value={viewCustomer.name} />
                    <DetailRow label="Phone Number" value={viewCustomer.phone} />
                    <DetailRow label="Email Address" value={viewCustomer.email} />
                    <DetailRow label="GSTIN" value={viewCustomer.gstin} />
                    <DetailRow label="Customer Type" value={viewCustomer.customerType} /> {/* <-- Field re-added */}
                    <DetailRow label="Address" value={viewCustomer.address} />
                </div>
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2 border-b pb-2">Transaction History</h4>
                    <div className="max-h-60 overflow-y-auto pr-2">
                        {invoices.filter(inv => inv.customerName === viewCustomer.name).length > 0 ? (
                            invoices.filter(inv => inv.customerName === viewCustomer.name).sort((a,b) => new Date(b.date) - new Date(a.date)).map(inv => (
                                    <div key={inv._id} className="text-sm border-b py-2 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-700">Invoice #{inv._id.slice(-6)}</p>
                                            <p className="text-xs text-gray-500">{inv.date}</p>
                                        </div>
                                        <p className="font-semibold text-[#003B6F]">₹ {formatINR(inv.totalGrand)}</p>
                                    </div>
                                ))
                        ) : (
                            <p className="text-sm text-gray-500 pt-4 text-center">No transaction history found.</p>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Reusable UI Components
const KPI = ({ title, value, subValue, isCurrency = true }) => (
    <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
      <div className="text-xs uppercase tracking-wider opacity-80">{title}</div>
      <div className="text-lg font-bold truncate">{isCurrency ? `₹ ${formatINR(value)}` : value}</div>
      {subValue && <div className="text-xs opacity-80">{subValue}</div>}
    </div>
);

const DetailRow = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words whitespace-pre-wrap">{value || "N/A"}</p>
    </div>
);

export default Customers;