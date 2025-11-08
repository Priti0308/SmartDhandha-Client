import React, { useState, useEffect } from 'react';
import { get, post, put, deleteItem } from '../../services/inventoryService'; // Adjust path if needed
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- HELPER COMPONENTS ---

const formatINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DetailRow = ({ label, value }) => (
    <div className="flex justify-between border-b py-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-800 text-right">{value || "N/A"}</span>
    </div>
);

const PaymentStatusBadge = ({ status }) => {
    const statusStyles = {
        paid: 'bg-green-100 text-green-700',
        partially_paid: 'bg-yellow-100 text-yellow-700',
        unpaid: 'bg-red-100 text-red-700',
    };
    const text = (status || 'unpaid').replace('_', ' ');
    return (
        <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusStyles[status] || statusStyles.unpaid}`}>
            {text}
        </span>
    );
};

// --- PRINTABLE INVOICE COMPONENT ---
const PrintableInvoice = ({ invoiceData, businessName, onClose }) => {
  if (!invoiceData) return null;

  return (
    <div className="bg-gray-200 min-h-screen p-4 sm:p-8 print:bg-white print:p-0">
      {/* --- Action Buttons (Hidden on Print) --- */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end gap-3 print:hidden">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          &larr; Back to Customers
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] to-[#0066A3] text-white shadow text-sm font-medium hover:opacity-90"
        >
          Print Invoice
        </button>
      </div>

      {/* --- Invoice Paper --- */}
      <div id="invoice-paper" className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-lg print:shadow-none">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#003B6F]">{businessName}</h1>
          <p className="text-sm text-gray-500">
            Your Company Address, City, Pincode | GSTIN: YOUR_GSTIN
          </p>
        </header>

        {/* Bill Details */}
        <section className="flex justify-between items-start border-y-2 border-[#003B6F] py-6 mb-8">
          <div>
            <h3 className="font-semibold text-gray-700 uppercase mb-1">
              {invoiceData.type === 'sale' ? 'Bill To:' : 'Bill From:'}
            </h3>
            <p className="font-bold text-lg text-gray-900">{invoiceData.customerName}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase text-[#003B6F]">
              {invoiceData.type === 'sale' ? 'Tax Invoice' : 'Purchase Bill'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Bill No:</strong> {invoiceData._id}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Date:</strong> {invoiceData.date}
            </p>
          </div>
        </section>

        {/* Items Table */}
        <section className="mb-8">
          <table className="w-full text-left">
            <thead className="bg-[#003B6F] text-white">
              <tr>
                <th className="p-3 text-sm font-medium">#</th>
                <th className="p-3 text-sm font-medium w-2/5">Product / Service</th>
                <th className="p-3 text-sm font-medium text-right">Qty</th>
                <th className="p-3 text-sm font-medium text-right">Price</th>
                <th className="p-3 text-sm font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500">GST @ {item.gstRate}%</div>
                  </td>
                  <td className="p-3 text-right">{item.qty}</td>
                  <td className="p-3 text-right">₹{formatINR(item.price)}</td>
                  <td className="p-3 text-right">₹{formatINR(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals and Payment Status */}
        <section className="flex justify-between items-start gap-6">
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold text-gray-800 mb-2">Payment Details</h4>
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold
                ${invoiceData.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                  invoiceData.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'}`}>
                {invoiceData.paymentStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="mt-1"><strong>Amount Paid:</strong> ₹{formatINR(invoiceData.paidAmount)}</p>
            <p className="font-bold"><strong>Balance Due:</strong> ₹{formatINR(invoiceData.balanceDue)}</p>
            {invoiceData.note && <div className="mt-4"><strong>Notes:</strong> {invoiceData.note}</div>}
          </div>

          <div className="w-2/5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{formatINR(invoiceData.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total GST:</span>
                <span className="font-medium">₹{formatINR(invoiceData.totalGST)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white bg-[#003B6F] p-3 rounded-lg mt-2">
                <span>Grand Total:</span>
                <span>₹{formatINR(invoiceData.totalGrand)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 mt-12 pt-6 border-t">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated document.</p>
        </footer>
      </div>
    </div>
  );
};


// --- MAIN CUSTOMER COMPONENT ---
const Customers = ({ businessName = "SmartDhandha" }) => {
    const [customers, setCustomers] = useState([]);
    const [allInvoices, setAllInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for modals
    const [showModal, setShowModal] = useState(false);
    const [viewCustomer, setViewCustomer] = useState(null);
    const [customerForInvoices, setCustomerForInvoices] = useState(null);
    const [printableInvoice, setPrintableInvoice] = useState(null);

    // State for form
    const [editId, setEditId] = useState(null);
    const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [customerData, invoiceData] = await Promise.all([
                get('inventory/customers'),
                get('inventory/invoices')
            ]);
            setCustomers(customerData);
            setAllInvoices(invoiceData);
        } catch (error) {
            toast.error("Failed to fetch data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerForm(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setEditId(null);
        setCustomerForm({ name: '', phone: '', email: '', address: '' });
        setShowModal(true);
    };

    const openEditModal = (customer) => {
        setEditId(customer._id);
        setCustomerForm({
            name: customer.name, phone: customer.phone || '',
            email: customer.email || '', address: customer.address || ''
        });
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!customerForm.name.trim()) return toast.warn("Customer name is required.");
        
        try {
            if (editId) {
                await put('inventory/customers', { ...customerForm, id: editId });
                toast.success("Customer updated successfully! ✅");
            } else {
                await post('inventory/customers', customerForm);
                toast.success("Customer added successfully! 🎉");
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save customer.');
        }
    };

    const handleDelete = async (customerId) => {
        if (window.confirm("Are you sure? This may fail if the customer is linked to existing invoices.")) {
            try {
                await deleteItem('inventory/customers', customerId);
                toast.success("Customer deleted successfully! 🗑️");
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete customer.');
            }
        }
    };

    const customerInvoices = allInvoices.filter(
        inv => inv.customerName === customerForInvoices?.name && inv.type === 'sale'
    );

    // --- RENDER LOGIC ---
    if (printableInvoice) {
        return (
            <PrintableInvoice
                invoiceData={printableInvoice}
                businessName={businessName}
                onClose={() => setPrintableInvoice(null)}
            />
        );
    }
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Customers...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            {/* Header */}
            <div className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-wide">Manage Customers</h1>
                            <p className="text-white/80 text-sm">Add, view, and edit your customer details.</p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="mt-4 md:mt-0 px-5 py-2.5 rounded-xl bg-white text-[#003B6F] shadow hover:bg-gray-100 transition-colors font-semibold"
                        >
                            + Add New Customer
                        </button>
                    </div>
                </div>
            </div>

            {/* Customer List Table */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-[#003B6F] text-white text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Customer Name</th>
                                    <th className="px-4 py-3 font-medium">Contact Phone</th>
                                    <th className="px-4 py-3 font-medium">Email Address</th>
                                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-gray-500">
                                            No customers found. Click "Add New Customer" to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map(customer => (
                                        <tr key={customer._id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">{customer.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{customer.phone || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{customer.email || '—'}</td>
                                            <td className="px-4 py-3 text-center space-x-3 whitespace-nowrap">
                                                <button onClick={() => setCustomerForInvoices(customer)} className="text-blue-600 hover:underline text-xs font-medium">Invoices</button>
                                                <button onClick={() => setViewCustomer(customer)} className="text-gray-600 hover:underline text-xs font-medium">View</button>
                                                <button onClick={() => openEditModal(customer)} className="text-[#0066A3] hover:underline text-xs font-medium">Edit</button>
                                                <button onClick={() => handleDelete(customer._id)} className="text-red-600 hover:underline text-xs font-medium">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-8">
                        <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
                            <h2 className="text-lg font-semibold">{editId ? "Edit Customer" : "Add New Customer"}</h2>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Customer Name *</label>
                                <input name="name" value={customerForm.name} onChange={handleInputChange} type="text" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Contact Phone</label>
                                    <input name="phone" value={customerForm.phone} onChange={handleInputChange} type="tel" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Email Address</label>
                                    <input name="email" value={customerForm.email} onChange={handleInputChange} type="email" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                                <textarea name="address" value={customerForm.address} onChange={handleInputChange} rows="3" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow text-sm font-medium hover:opacity-90">{editId ? "Save Changes" : "Add Customer"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewCustomer && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setViewCustomer(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl my-8" onClick={e => e.stopPropagation()}>
                        <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Customer Details</h2>
                            <button onClick={() => setViewCustomer(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                        </div>
                        <div className="p-6 space-y-2">
                            <DetailRow label="Customer Name" value={viewCustomer.name} />
                            <DetailRow label="Contact Phone" value={viewCustomer.phone} />
                            <DetailRow label="Email Address" value={viewCustomer.email} />
                            <DetailRow label="Address" value={<p className="whitespace-pre-wrap">{viewCustomer.address}</p>} />
                        </div>
                    </div>
                </div>
            )}

            {customerForInvoices && (
                 <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl my-8">
                        <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Invoices for {customerForInvoices.name}</h2>
                            <button onClick={() => setCustomerForInvoices(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
                        </div>
                        <div className="p-4 md:p-6">
                            {customerInvoices.length > 0 ? (
                                <ul className="space-y-3 max-h-96 overflow-y-auto">
                                    {customerInvoices.map(invoice => (
                                        <li key={invoice._id} className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">Date: {invoice.date}</div>
                                                <div className="text-xs text-gray-500">ID: {invoice._id}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <PaymentStatusBadge status={invoice.paymentStatus}/>
                                                <div className="font-bold text-lg text-[#003B6F]">₹{formatINR(invoice.totalGrand)}</div>
                                                <button
                                                    onClick={() => {
                                                        setPrintableInvoice(invoice);
                                                        setCustomerForInvoices(null);
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200"
                                                >
                                                    View &amp; Print
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No sales invoices found for this customer.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;