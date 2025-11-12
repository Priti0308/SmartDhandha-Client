import React, { useEffect, useMemo, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- EXPORT LIBRARIES (UPDATED IMPORT) ---
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable'; 
import * as XLSX from "xlsx";

import {
  get,
  post,
  put,
  deleteItem,
  sendWhatsappReminder,
  sendWhatsappOffer
} from "../../services/ledgerService";

/* ---------------------- helpers ---------------------- */
const nowISOForInput = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const formatINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });


/* ---------------------- main component ---------------------- */
const Ledger = () => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersData, transactionsData, remindersData] = await Promise.all([
        get("customers"),
        get("transactions"),
        get("reminders"),
      ]);
      setCustomers(customersData);
      setTransactions(transactionsData);
      setReminders(remindersData);
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      toast.error("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------- derived ---------- */
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c._id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const transactionsToDisplay = useMemo(
    () => {
      if (selectedCustomerId) {
        return transactions.filter((t) => t.customerId === selectedCustomerId);
      }
      return transactions;
    },
    [transactions, selectedCustomerId]
  );

  const balance = useMemo(
    () =>
      transactionsToDisplay.reduce(
        (acc, t) => acc + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)),
        0
      ),
    [transactionsToDisplay]
  );

  const totalCredit = useMemo(
    () =>
      transactionsToDisplay
        .filter(t => t.type === 'credit')
        .reduce((acc, t) => acc + Number(t.amount), 0),
    [transactionsToDisplay]
  );

  const totalDebit = useMemo(
    () =>
      transactionsToDisplay
        .filter(t => t.type === 'debit')
        .reduce((acc, t) => acc + Number(t.amount), 0),
    [transactionsToDisplay]
  );

  /* ---------- animated balance ---------- */
  const [displayBal, setDisplayBal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const start = displayBal;
    const end = balance;
    const duration = 600;
    const startTime = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayBal(Number((start + (end - start) * eased).toFixed(2)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(rafRef.current || 0);
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current || 0);
  }, [balance]);

  /* ---------- add/edit customer modal ---------- */
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [custForm, setCustForm] = useState({
    name: "", phone: "", email: "", address: "", openingType: "credit", openingAmount: ""
  });
  const [editingCustomer, setEditingCustomer] = useState(null);

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustForm({ name: "", phone: "", email: "", address: "", openingType: "credit", openingAmount: "" });
    setShowCustomerModal(true);
  };

  const openEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustForm({ ...customer, openingType: "credit", openingAmount: "" });
    setShowCustomerModal(true);
    setShowDetailsModal(false);
  };

  const showCustomerDetails = (customer) => {
    setSelectedCustomerId(customer._id);
    setShowDetailsModal(true);
  };

  const submitCustomer = async (e) => {
    e.preventDefault();
    if (!custForm.name.trim()) {
      toast.warn("Customer name is required.");
      return;
    }

    try {
      if (editingCustomer) {
        await put("customers", { _id: editingCustomer._id, ...custForm });
        await fetchData();
        toast.success("Customer updated successfully! ");
      } else {
        const newCustomer = await post("customers", custForm);
        const openingAmt = Number(custForm.openingAmount || 0);
        if (openingAmt > 0) {
          await post("transactions", {
            customerId: newCustomer._id,
            type: custForm.openingType.toLowerCase(),
            amount: openingAmt,
            date: new Date().toISOString().slice(0, 10),
            note: "Opening balance",
          });
        }
        await fetchData(); // Full fetch is ok here since a new customer is added
        setSelectedCustomerId(newCustomer._id);
        toast.success("New customer added!");
      }
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast.error("Failed to save customer. Please try again.");
    }
  };

  const deleteCustomer = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer and all associated data?")) {
      try {
        await deleteItem("customers", id);
        await fetchData(); // Full fetch is needed as this affects customers and transactions
        if (selectedCustomerId === id) {
          setSelectedCustomerId(null);
        }
        toast.success("Customer deleted successfully! ");
        setShowDetailsModal(false);
      } catch (error) {
        console.error("Failed to delete customer:", error);
        toast.error("Failed to delete customer.");
      }
    }
  };

  /* ---------- add transaction form ---------- */
  const [txForm, setTxForm] = useState({
    type: "credit", amount: "", date: new Date().toISOString().slice(0, 10), note: ""
  });

  // **UPDATED**: This function no longer does a full page data refresh.
  const submitTx = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.warn("Please select a customer first.");
      return;
    }
    const amt = Number(txForm.amount);
    if (!amt || amt <= 0) {
      toast.warn("Please enter a valid amount.");
      return;
    }
    try {
      // Assuming your post service returns the newly created transaction
      const newTransaction = await post("transactions", {
        customerId: selectedCustomerId,
        type: txForm.type.toLowerCase(),
        amount: amt,
        date: txForm.date || new Date().toISOString().slice(0, 10),
        note: txForm.note,
      });

      // Update state locally instead of fetching all data again
      setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
      
      setTxForm({ type: "credit", amount: "", date: new Date().toISOString().slice(0, 10), note: "" });
      toast.success("Transaction recorded successfully! ");
      
      window.alert(`Transaction of ₹${formatINR(amt)} for ${selectedCustomer.name} was added successfully!`);

    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast.error("Failed to add transaction.");
    }
  };

  const deleteTransaction = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteItem("transactions", id);
        // Update state locally for a smoother experience
        setTransactions(prev => prev.filter(tx => tx._id !== id));
        toast.success("Transaction deleted! ");
      } catch (error) {
        console.error("Failed to delete transaction:", error);
        toast.error("Failed to delete transaction.");
      }
    }
  };

  /* ---------- reminders ---------- */
  const [remForm, setRemForm] = useState({
    dueDate: nowISOForInput(), message: ""
  });

  const submitReminder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.warn("Please select a customer first.");
      return;
    }
    try {
      const newReminder = await post("reminders", {
        customerId: selectedCustomerId,
        dueDate: remForm.dueDate,
        message: remForm.message || "Payment due",
      });
      setReminders(prev => [...prev, newReminder]); // Local update
      setRemForm({ dueDate: nowISOForInput(), message: "" });
      toast.success("Reminder added successfully! ");
    } catch (error) {
      console.error("Failed to add reminder:", error);
      toast.error("Failed to add reminder.");
    }
  };

  const toggleReminderCompleted = async (reminder) => {
    try {
      const updatedReminder = await put("reminders", { ...reminder, isCompleted: !reminder.isCompleted });
      setReminders(prev => prev.map(r => r._id === updatedReminder._id ? updatedReminder : r)); // Local update
      toast.success(`Reminder marked as ${reminder.isCompleted ? 'incomplete' : 'completed'}!`);
    } catch (error) {
      console.error("Failed to update reminder:", error);
      toast.error("Failed to update reminder.");
    }
  };

  const deleteReminder = async (id) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      try {
        await deleteItem("reminders", id);
        setReminders(prev => prev.filter(r => r._id !== id)); // Local update
        toast.success("Reminder deleted! ");
      } catch (error) {
        console.error("Failed to delete reminder:", error);
        toast.error("Failed to delete reminder.");
      }
    }
  };

  const customerReminders = useMemo(
    () => reminders.filter((r) => r.customerId === selectedCustomerId),
    [reminders, selectedCustomerId]
  );

  const badgeForDue = (dueDateTime) => {
    const d = new Date(dueDateTime);
    const today = new Date();
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = d.getTime() - t.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `Overdue ${Math.abs(diffDays)}d`, cls: "bg-red-100 text-red-700" };
    if (diffDays === 0) return { label: "Due today", cls: "bg-yellow-100 text-yellow-800" };
    return { label: `In ${diffDays}d`, cls: "bg-green-100 text-green-700" };
  };

  const handleSendReminder = async (reminder) => {
    const customer = customers.find(c => c._id === reminder.customerId);
    if (!customer?.phone) {
      toast.error(`Customer ${customer.name} has no phone number.`);
      return;
    }
    if (window.confirm(`Send reminder to ${customer.name} via WhatsApp?`)) {
      try {
        await sendWhatsappReminder(reminder._id);
        toast.success("WhatsApp reminder sent successfully! ");
      } catch (error) {
        console.error("Failed to send WhatsApp reminder:", error);
        toast.error(error.response?.data?.message || "Failed to send reminder.");
      }
    }
  };

  const handleSendOffer = async (customer) => {
    if (!customer?.phone) {
      toast.error(`Customer ${customer.name} has no phone number.`);
      return;
    }
    const message = window.prompt(`Enter the message you want to send to ${customer.name}:`);
    if (message && message.trim()) {
      try {
        await sendWhatsappOffer(customer._id, message);
        toast.success("WhatsApp message sent successfully! ");
      } catch (error) {
        console.error("Failed to send custom message:", error);
        toast.error(error.response?.data?.message || "Failed to send message.");
      }
    }
  };

  /* ---------- search / filter ---------- */
  const [search, setSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const filteredTx = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = transactionsToDisplay;

    if (txTypeFilter !== "all") {
      list = list.filter((t) => t.type === txTypeFilter);
    }

    if (!term) return list.sort((a, b) => new Date(b.date) - new Date(a.date));

    return list.filter((t) => {
      const customerName = !selectedCustomerId ? (customers.find(c => c._id === t.customerId)?.name || '').toLowerCase() : '';
      return (
        (t.note || "").toLowerCase().includes(term) ||
        (t.type || "").toLowerCase().includes(term) ||
        (t.date || "").toLowerCase().includes(term) ||
        (!selectedCustomerId && customerName.includes(term))
      )
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactionsToDisplay, search, txTypeFilter, customers, selectedCustomerId]);


  /* ---------------------- EXPORT HANDLERS (FIXED & UPDATED) ---------------------- */
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const reportTitle = "Ledger Transaction Report";
      const subTitle = selectedCustomer ? `For: ${selectedCustomer.name}` : "For: All Customers";
      const fileName = `Ledger_Report_${selectedCustomer ? selectedCustomer.name.replace(/\s/g, '_') : 'All'}_${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.setFontSize(18);
      doc.text(reportTitle, 14, 22);
      doc.setFontSize(12);
      doc.text(subTitle, 14, 30);

      const tableColumns = selectedCustomerId
        ? ["Date", "Type", "Note", "Amount (₹)"]
        : ["Customer", "Date", "Type", "Note", "Amount (₹)"];
      
      const dataToExport = showDetailsModal ? transactionsToDisplay : filteredTx;

      const tableRows = dataToExport.map(t => {
        const customerName = customers.find(c => c._id === t.customerId)?.name || "N/A";
        const rowData = [
          t.date,
          t.type.charAt(0).toUpperCase() + t.type.slice(1),
          t.note || "-",
          { content: formatINR(t.amount), styles: { halign: 'right' } }
        ];
        if (!selectedCustomerId) {
          rowData.unshift(customerName);
        }
        return rowData;
      });

      const summaryRows = [
        ['', '', '', 'Total Credit:', { content: `₹ ${formatINR(totalCredit)}`, styles: { halign: 'right' } }],
        ['', '', '', 'Total Debit:', { content: `₹ ${formatINR(totalDebit)}`, styles: { halign: 'right' } }],
        ['', '', '', 'Balance:', { content: `₹ ${formatINR(balance)}`, styles: { halign: 'right', fontStyle: 'bold' } }]
      ];
      if (!selectedCustomerId) {
          summaryRows.forEach(row => row.unshift('')); 
      }
      
      // **FIXED**: Call autoTable as a function on the doc instance
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [0, 59, 111] },
        didDrawPage: (data) => {
          doc.setFontSize(10);
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });
      
      // **FIXED**: Use the correct property to get the final Y position
      const finalY = (doc).lastAutoTable.finalY;
      autoTable(doc, {
          body: summaryRows,
          startY: finalY + 10,
          theme: 'plain',
          styles: { fontSize: 11 }
      });
      
      doc.save(fileName);
      toast.success("PDF downloaded successfully!");

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Could not download PDF. See console for details.");
    }
  };

  const handleExportExcel = () => {
    try {
        const fileName = `Ledger_Report_${selectedCustomer ? selectedCustomer.name.replace(/\s/g, '_') : 'All'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const dataToUse = showDetailsModal ? transactionsToDisplay : filteredTx;
        
        const dataForSheet = dataToUse.map(t => {
          const baseData = {
            Date: t.date,
            Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
            Note: t.note || "-",
            'Amount (₹)': Number(t.amount)
          };
          if (!selectedCustomerId) {
            const customerName = customers.find(c => c._id === t.customerId)?.name || "N/A";
            return { Customer: customerName, ...baseData };
          }
          return baseData;
        });

        const ws = XLSX.utils.json_to_sheet(dataForSheet);
        XLSX.utils.sheet_add_json(ws, [
            {}, 
            { Date: 'Total Credit', 'Amount (₹)': totalCredit },
            { Date: 'Total Debit', 'Amount (₹)': totalDebit },
            { Date: 'Balance', 'Amount (₹)': balance },
        ], { skipHeader: true, origin: -1 });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, fileName);
        toast.success("Excel file downloaded successfully!");
    } catch (error) {
        console.error("Failed to generate Excel:", error);
        toast.error("Could not download Excel file.");
    }
  };


  /* ---------- UI ---------- */
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* Top bar */}
      <div className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide">Ledger Management</h1>
            <p className="text-white/80 text-sm">
              {selectedCustomer ? `Viewing records for ${selectedCustomer.name}` : 'Viewing records for all customers'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-xs uppercase tracking-wider opacity-80">Total Credit</div>
              <div className="text-2xl font-bold text-green-200">
                ₹ {formatINR(totalCredit)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-xs uppercase tracking-wider opacity-80">Total Debit</div>
              <div className="text-2xl font-bold text-red-200">
                ₹ {formatINR(totalDebit)}
              </div>
            </div>

            {/* ---------- MODIFIED BALANCE BLOCK (AAPKO MILENGE / AAP DENGE) ---------- */}
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
              <div className="text-xs uppercase tracking-wider opacity-80">
                {displayBal >= 0 ? "Aap Denge" : "Aapko Milenge"}
              </div>
              <div className={`text-2xl font-bold ${displayBal >= 0 ? "text-green-200" : "text-red-200"}`}>
                ₹ {formatINR(Math.abs(displayBal))}
              </div>
            </div>
            {/* ---------- END MODIFIED BLOCK ---------- */}

            <button
              onClick={openAddCustomer}
              className="rounded-xl px-4 py-2 bg-white text-[#003B6F] font-medium shadow hover:bg-[#A7E1FF] transition"
            >
              Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: customer & forms */}
        <div className="space-y-6 lg:col-span-1">
          {/* Select Customer */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Customer</h2>
              <button
                onClick={openAddCustomer}
                className="text-sm text-[#0066A3] hover:underline"
              >
                New
              </button>
            </div>
            <select
              value={selectedCustomerId || ""}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
            >
              <option value="">— All Customers —</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-3 text-sm text-gray-600">
                <div>{selectedCustomer.email}</div>
                <div className="truncate">{selectedCustomer.address}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => showCustomerDetails(selectedCustomer)} className="text-xs text-[#0066A3] hover:underline">View Details</button>
                </div>
              </div>
            )}
          </div>

          {/* Add Transaction */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Record Credit / Debit</h2>
            <form onSubmit={submitTx} className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                  value={txForm.type}
                  onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                  placeholder="Amount"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                  value={txForm.date}
                  onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                />
                <input
                  type="text"
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                  placeholder="Note (optional)"
                  value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={!selectedCustomerId}
                className="rounded-lg px-4 py-2 bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white font-medium shadow disabled:opacity-50"
              >
                Add Transaction
              </button>
              {!selectedCustomerId && (
                <p className="text-xs text-red-600">Select a customer to add transactions.</p>
              )}
            </form>
          </div>

          {/* Auto Reminder */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Auto Reminder</h2>
            <form onSubmit={submitReminder} className="grid grid-cols-1 gap-3">
              <input
                type="datetime-local"
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                value={remForm.dueDate}
                onChange={(e) => setRemForm({ ...remForm, dueDate: e.target.value })}
              />
              <input
                type="text"
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                placeholder="Reminder message (optional)"
                value={remForm.message}
                onChange={(e) => setRemForm({ ...remForm, message: e.target.value })}
              />
              <button
                type="submit"
                disabled={!selectedCustomerId}
                className="rounded-lg px-4 py-2 bg-white text-[#003B6F] border border-[#66B2FF] hover:bg-[#A7E1FF]/40 transition disabled:opacity-50"
              >
                Add Reminder
              </button>
              {!selectedCustomerId && (
                <p className="text-xs text-red-600">Select a customer to set reminders.</p>
              )}
            </form>

            <div className="mt-4 space-y-2">
              {customerReminders.length === 0 ? (
                <p className="text-sm text-gray-500">{selectedCustomerId ? "No reminders for this customer." : "Select a customer to see reminders."}</p>
              ) : (
                customerReminders.map((r) => {
                  const badge = badgeForDue(r.dueDate);
                  const isCompleted = r.isCompleted;
                  return (
                    <div
                      key={r._id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${isCompleted ? 'bg-gray-100 border-gray-300' : 'bg-white'}`}
                    >
                      <div className="flex-1">
                        <div className={`font-medium text-gray-800 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                          {r.message || "Payment due"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Due: {new Date(r.dueDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!isCompleted && (
                          <span className={`text-xs px-2 py-1 rounded ${badge.cls}`}>{badge.label}</span>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={() => handleSendReminder(r)}
                            className="text-xs text-green-600 hover:underline"
                            title="Send via WhatsApp"
                          >
                            Send WA
                          </button>
                        )}
                        <button onClick={() => toggleReminderCompleted(r)} className="text-xs text-[#0066A3] hover:underline">
                          {isCompleted ? 'Undo' : 'Done'}
                        </button>
                        <button onClick={() => deleteReminder(r._id)} className="text-xs text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search, Filter & EXPORT BUTTONS */}
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-gray-800">Transaction History</h2>
                  {selectedCustomerId && (
                    <button
                      onClick={() => setSelectedCustomerId(null)}
                      className="text-xs font-semibold text-[#0066A3] hover:underline"
                    >
                      (Show All)
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {selectedCustomer ? selectedCustomer.name : "All Customers"} —{" "}
                  {filteredTx.length} records found
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="w-full md:w-auto border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits</option>
                  <option value="debit">Debits</option>
                </select>
                <input
                  type="text"
                  placeholder={selectedCustomerId ? "Search note / date" : "Search customer / note / date"}
                  className="border rounded-lg px-3 py-2 w-full max-w-sm focus:ring-2 focus:ring-[#66B2FF] outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-3 border-t">
                <span className="text-sm font-medium text-gray-600">Report:</span>
                <button
                    onClick={handleExportPDF}
                    disabled={filteredTx.length === 0}
                    className="px-5 py-2 text-sm font-medium rounded-lg border text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Download PDF
                </button>
                <button
                    onClick={handleExportExcel}
                    disabled={filteredTx.length === 0}
                    className="px-5 py-2 text-sm font-medium rounded-lg border text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Download Excel
                </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#003B6F] text-white">
                  <tr className="text-sm">
                    {!selectedCustomerId && (
                      <th className="px-4 py-3">Customer</th>
                    )}
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={selectedCustomerId ? 5 : 6}>
                        No matching records.
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map((t) => {
                      const customerName = customers.find(c => c._id === t.customerId)?.name || "N/A";
                      return (
                        <tr
                          key={t._id}
                          className={`border-t text-sm ${t.type === "credit"
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800"
                            }`}
                        >
                          {!selectedCustomerId && (
                            <td className="px-4 py-2 font-medium text-gray-700">{customerName}</td>
                          )}
                          <td className="px-4 py-2">{t.date}</td>
                          <td className="px-4 py-2 capitalize font-medium">
                            {t.type}
                          </td>
                          <td className="px-4 py-2">{t.note || "—"}</td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {formatINR(t.amount)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => deleteTransaction(t._id)} className="text-red-600 hover:underline">Delete</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer cards (quick glance) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">All Customers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((c) => {
                
                // ---------- MODIFIED CUSTOMER CARD LOGIC ----------
                const bal = transactions
                  .filter((t) => t.customerId === c._id)
                  .reduce(
                    (acc, t) => acc + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)),
                    0
                  );
                const balLabel = bal >= 0 ? "Aap Denge" : "Aapko Milenge";
                const balCls = bal >= 0 ? "text-green-600" : "text-red-600";
                
                return (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCustomerId(c._id)}
                    className={`cursor-pointer rounded-2xl border shadow-sm p-4 text-left hover:shadow transition ${selectedCustomerId === c._id ? "border-2 border-[#0066A3] bg-blue-50" : "border-gray-200 bg-white"
                      }`}
                  >
                    <div className="font-medium text-gray-800">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.phone || "—"}</div>
                    
                    <div className="mt-2">
                      <div className={`text-lg font-semibold ${balCls}`}>
                        ₹ {formatINR(Math.abs(bal))}
                      </div>
                      <div className={`text-xs font-medium ${balCls}`}>
                        {balLabel}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showCustomerDetails(c);
                        }}
                        className="text-xs font-semibold text-[#0066A3] hover:underline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
                // ---------- END MODIFIED CUSTOMER CARD ----------
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
              <div className="text-lg font-semibold">{editingCustomer ? "Edit Customer" : "Add Customer"}</div>
            </div>
            <form onSubmit={submitCustomer} className="p-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={custForm.name}
                    onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Phone</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={custForm.phone}
                    onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={custForm.email}
                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-gray-600">Address</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={custForm.address}
                    onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                  />
                </div>
              </div>

              {!editingCustomer && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-sm text-gray-600">Opening Type</label>
                    <select
                      className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                      value={custForm.openingType}
                      onChange={(e) => setCustForm({ ...custForm, openingType: e.target.value })}
                    >
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm text-gray-600">Opening Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                      value={custForm.openingAmount}
                      onChange={(e) => setCustForm({ ...custForm, openingAmount: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow"
                >
                  {editingCustomer ? "Save Changes" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white flex items-center justify-between">
              <div className="text-lg font-semibold">{selectedCustomer.name}'s Details</div>
              <button onClick={() => setShowDetailsModal(false)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="mt-1 w-full border-b pb-1 text-gray-800">{selectedCustomer.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="mt-1 w-full border-b pb-1 text-gray-800">{selectedCustomer.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="mt-1 w-full border-b pb-1 text-gray-800">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Address</label>
                <p className="mt-1 w-full border-b pb-1 text-gray-800">{selectedCustomer.address || 'N/A'}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={handleExportPDF}
                    className="px-4 py-2 rounded-lg border text-red-600 hover:bg-red-50"
                >
                    Download PDF
                </button>
                <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-4 py-2 rounded-lg border text-green-600 hover:bg-green-50"
                >
                    Download Excel
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOffer(selectedCustomer)}
                  className="px-4 py-2 rounded-lg border text-blue-600 hover:bg-blue-50"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => openEditCustomer(selectedCustomer)}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white shadow hover:bg-gray-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteCustomer(selectedCustomer._id)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white shadow hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;