import React, { useState, useMemo } from "react";

// The parent component passes these props:
// - activeTab
// - invoices, cashflows (data)
// - setInvoices, setCashflows (setters for data refetch)
// - formatINR (helper function)
// - get, post, deleteItem (service functions)
// - todayISO (helper function)
// - toast (toast notification function)
// --- NEW PROP: suppliers (although we use invoices to map parties) ---
const InventoryGST = ({ 
  activeTab, 
  invoices, 
  cashflows, 
  // suppliers, // Removed unused prop, party name is pulled from invoice
  setInvoices, 
  setCashflows, 
  formatINR, 
  get, 
  post, 
  deleteItem, 
  todayISO, 
  toast,
}) => {

  /* ---------------------- GST Report State and Logic ---------------------- */
  const [gstFilter, setGstFilter] = useState({ from: "", to: "" });

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    try {
        if (gstFilter.from) list = list.filter((i) => i.date >= gstFilter.from);
        if (gstFilter.to) list = list.filter((i) => i.date <= gstFilter.to);
    } catch (e) { console.error("Date filtering error:", e); }
    return list;
  }, [invoices, gstFilter]);

  const outputGST = filteredInvoices.filter((i) => i.type === "sale").reduce((s, i) => s + (i.totalGST || 0), 0);
  const inputGST = filteredInvoices.filter((i) => i.type === "purchase").reduce((s, i) => s + (i.totalGST || 0), 0);
  const netGST_filtered = outputGST - inputGST;

  /* ---------------------- Expense/Income State and Logic ---------------------- */
  const [flowForm, setFlowForm] = useState({
    kind: "expense", date: todayISO(), category: "", amount: "", note: "",
  });

  // NEW: Search state for Cashflow/Report tab
  const [cashflowSearch, setCashflowSearch] = useState("");
  
  // Recalculate totals for the summary box
  const totals = useMemo(() => {
    const income = cashflows.filter((c) => c.kind === "income").reduce((s, c) => s + Number(c.amount), 0);
    const expense = cashflows.filter((c) => c.kind === "expense").reduce((s, c) => s + Number(c.amount), 0);
    return { income, expense };
  }, [cashflows]);
  
  const submitCashflow = async (e) => {
    e.preventDefault();
    const amt = Number(flowForm.amount || 0);
    if (!amt || amt <= 0) { toast.warn("Please enter a valid positive amount."); return; }
    if (!flowForm.category.trim()) { toast.warn("Please enter a category."); return; }

    try {
      await post('inventory/cashflows', { ...flowForm, amount: amt });
      const cashflowsData = await get('inventory/cashflows');
      setCashflows(cashflowsData);
      setFlowForm({ kind: "expense", date: todayISO(), category: "", amount: "", note: "" });
      toast.success("Cashflow entry added! ");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add entry.');
      console.error("Add Cashflow Error:", error.response?.data || error);
    }
  };

  const deleteCashflow = async (id) => {
    if (window.confirm("Are you sure you want to delete this cashflow entry? If it's a payment, the invoice balance will be updated.")) {
      try {
        await deleteItem('inventory/cashflows', id);
        const [cashflowsData, invoicesData] = await Promise.all([
            get('inventory/cashflows'),
            get('inventory/invoices')
        ]);
        setCashflows(cashflowsData.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setInvoices(invoicesData.sort((a, b) => new Date(b.date) - new Date(a.date)));

        toast.success("Cashflow entry deleted!");
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete entry.');
        console.error("Delete Cashflow Error:", error.response?.data || error);
      }
    }
  };
  
  // MODIFIED: Filtering cashflows based on search term
  const flowsFiltered = useMemo(() => {
    const search = cashflowSearch.toLowerCase().trim();
    if (!search) return cashflows;

    // Map invoice IDs to their party names for quick lookup
    const invoicePartyMap = new Map(invoices.map(i => [i._id, i.customerName]));

    return cashflows.filter(f => {
        // 1. Check if the entry is a payment related to an invoice/bill
        if (f.invoiceId) {
            const partyName = invoicePartyMap.get(f.invoiceId);
            if (partyName && partyName.toLowerCase().includes(search)) {
                return true;
            }
        }
        
        // 2. Check general cashflow fields (category, note)
        const categoryMatch = f.category && f.category.toLowerCase().includes(search);
        const noteMatch = f.note && f.note.toLowerCase().includes(search);
        
        return categoryMatch || noteMatch;

    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [cashflows, cashflowSearch, invoices]);


  /* ---------------------- Shared UI Components ---------------------- */

  const SummaryRow = ({ label, value, pos = false, highlight = false }) => (
    <div className={`flex items-center justify-between ${highlight ? "text-[#003B6F] font-semibold text-base" : "text-sm"}`}>
      <span className="text-gray-700">{label}</span>
      <span className={`${pos ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-800"} font-semibold`}>
        ₹ {formatINR(Math.abs(value))}
        {value < 0 ? ' (Cr)' : ''}
      </span>
    </div>
  );

  /* ---------------------- Rendering ---------------------- */

  return (
    <>
      {/* --- GST REPORT Tab --- */}
      {activeTab === "gst" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-semibold text-gray-800">GST Report</h2>
              <div className="flex gap-2 items-center">
                  <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                  value={gstFilter.from}
                  onChange={(e) => setGstFilter({ ...gstFilter, from: e.target.value })}
                />
                  <label className="text-sm text-gray-600 ml-2">To:</label>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                  value={gstFilter.to}
                  onChange={(e) => setGstFilter({ ...gstFilter, to: e.target.value })}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#003B6F] text-white text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Party</th>
                    <th className="px-3 py-2 font-medium text-right">Sub Total (₹)</th>
                    <th className="px-3 py-2 font-medium text-right">GST (₹)</th>
                    <th className="px-3 py-2 font-medium text-right">Grand Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                        No invoices or bills found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((i) => (
                      <tr key={i._id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{i.date}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${i.type === "sale" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                            {i.type === "sale" ? "Sale" : "Purchase"}
                          </span>
                        </td>
                        <td className="px-3 py-2">{i.customerName}</td>
                        <td className="px-3 py-2 text-right">₹ {formatINR(i.subtotal)}</td>
                        <td className="px-3 py-2 text-right">₹ {formatINR(i.totalGST)}</td>
                        <td className="px-3 py-2 text-right font-semibold">₹ {formatINR(i.totalGrand)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 self-start">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">GST Summary</h3>
            <div className="space-y-3 text-sm">
              <SummaryRow label="Output GST (Sales)" value={outputGST} pos />
              <SummaryRow label="Input GST (Purchases)" value={inputGST} />
              <div className="border-t pt-3 mt-3">
                <SummaryRow label="Net GST Payable" value={netGST_filtered} highlight />
                  <p className="text-xs text-gray-500 mt-2">
                    {netGST_filtered >= 0 ? 'Amount payable to government.' : 'Input Tax Credit (ITC) available.'}
                  </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPENSE / INCOME Tab --- */}
      {activeTab === "report" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Add Expense / Income</h2>
              <form onSubmit={submitCashflow} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Type</label>
                   <select
                     className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm bg-white"
                     value={flowForm.kind}
                     onChange={(e) => setFlowForm({ ...flowForm, kind: e.target.value })}
                   >
                     <option value="expense">Expense</option>
                     <option value="income">Income</option>
                   </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Date</label>
                     <input
                      type="date"
                      className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                      value={flowForm.date}
                      onChange={(e) => setFlowForm({ ...flowForm, date: e.target.value })}
                     />
                    </div>
                      <div>
                      <label className="text-xs text-gray-500 block mb-1">Amount (₹)</label>
                     <input
                        type="number"
                        step="0.01" min="0.01"
                        placeholder="0.00"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                        value={flowForm.amount}
                        onChange={(e) => setFlowForm({ ...flowForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Category</label>
                   <input
                   type="text"
                   placeholder="e.g., Rent, Salary, Service Fee"
                   className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                   value={flowForm.category}
                   onChange={(e) => setFlowForm({ ...flowForm, category: e.target.value })}
                   required
                   />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Note (Optional)</label>
                   <input
                   type="text"
                   placeholder="Add a brief description"
                   className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                   value={flowForm.note}
                   onChange={(e) => setFlowForm({ ...flowForm, note: e.target.value })}
                   />
                  </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow hover:opacity-90 transition-opacity font-semibold"
                >
                  Add Entry
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 self-start">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cashflow Summary</h3>
              <div className="space-y-3 text-sm">
                <SummaryRow label="Total Income" value={totals.income} pos />
                <SummaryRow label="Total Expense" value={totals.expense} />
                <div className="border-t pt-3 mt-3">
                  <SummaryRow label="Net (Income - Expense)" value={totals.income - totals.expense} highlight />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6">
            {/* NEW: Search Bar Added */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-800">Recent Entries</h3>
                <input
                    type="text"
                    placeholder="Search Category, Note, or Party Name"
                    className="border rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm w-full sm:w-64"
                    value={cashflowSearch}
                    onChange={(e) => setCashflowSearch(e.target.value)}
                />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#003B6F] text-white text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Category / Party</th>
                    <th className="px-3 py-2 font-medium">Note</th>
                    <th className="px-3 py-2 font-medium text-right">Amount (₹)</th>
                    <th className="px-3 py-2 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flowsFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                        No matching entries found.
                      </td>
                    </tr>
                  ) : (
                    flowsFiltered.map((f) => {
                       // Find the associated invoice to display the party name if it's a payment
                       const relatedInvoice = f.invoiceId ? invoices.find(i => i._id === f.invoiceId) : null;
                       const categoryOrParty = relatedInvoice ? relatedInvoice.customerName : (f.category || 'N/A');

                       return (
                         <tr key={f._id} className="border-t hover:bg-gray-50">
                           <td className="px-3 py-2">{f.date}</td>
                           <td className="px-3 py-2">
                             <span className={`text-xs px-2 py-0.5 rounded font-medium ${f.kind === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                               {f.kind === "income" ? "Income" : "Expense"}
                             </span>
                           </td>
                           <td className="px-3 py-2">
                            <span className={relatedInvoice ? 'font-medium text-[#0066A3]' : ''}>
                               {categoryOrParty}
                            </span>
                           </td>
                           <td className="px-3 py-2 text-gray-600">{f.note || "—"}</td>
                           <td className={`px-3 py-2 text-right font-semibold ${f.kind === 'income' ? 'text-green-600' : 'text-red-600'}`}>₹ {formatINR(f.amount)}</td>
                           <td className="px-3 py-2 text-center">
                             <button onClick={() => deleteCashflow(f._id)} className="text-red-500 hover:text-red-700 text-xs font-medium" title="Delete Entry">Delete</button>
                           </td>
                         </tr>
                       );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryGST;