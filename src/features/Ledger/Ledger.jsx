import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getLedgerEntries,
  addLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  getReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  getRemindersByCustomer
} from "../../services/ledgerService";

/* ---------- helpers ---------- */
const todayISO = () => new Date().toISOString().slice(0, 10);
const formatINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

/* ---------- main component ---------- */
const Ledger = () => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- derived ---------- */
  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId) || null;

  const customerTx = useMemo(
    () => transactions.filter((t) => t.customerId === selectedCustomerId),
    [transactions, selectedCustomerId]
  );

  const balance = useMemo(
    () =>
      customerTx.reduce(
        (acc, t) => acc + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)),
        0
      ),
    [customerTx]
  );

  /* ---------- animated balance ---------- */
  const [displayBal, setDisplayBal] = useState(0);
  const rafRef = useRef(null);

  /* ---------- data fetching ---------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [customersData, transactionsData, remindersData] = await Promise.all([
        getCustomers(),
        getLedgerEntries(),
        getReminders()
      ]);
      
      setCustomers(customersData);
      setTransactions(transactionsData);
      setReminders(remindersData);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  /* ---------- customer operations ---------- */
  const handleAddCustomer = async (customerData) => {
    try {
      const newCustomer = await addCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      setSelectedCustomerId(newCustomer._id);
      
      // Add opening balance transaction if provided
      if (customerData.openingAmount && Number(customerData.openingAmount) > 0) {
        const openingTx = {
          customerId: newCustomer._id,
          type: customerData.openingType || "credit",
          amount: Number(customerData.openingAmount),
          date: todayISO(),
          note: "Opening balance"
        };
        await handleAddTransaction(openingTx);
      }
      
      return newCustomer;
    } catch (err) {
      throw new Error(err.message || "Failed to add customer");
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      const newTransaction = await addLedgerEntry(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      throw new Error(err.message || "Failed to add transaction");
    }
  };

  const handleAddReminder = async (reminderData) => {
    try {
      const newReminder = await addReminder({
        ...reminderData,
        customerId: selectedCustomerId
      });
      setReminders(prev => [newReminder, ...prev]);
      return newReminder;
    } catch (err) {
      throw new Error(err.message || "Failed to add reminder");
    }
  };

  /* ---------- UI helpers ---------- */
  const customerReminders = useMemo(
    () => reminders.filter((r) => r.customerId === selectedCustomerId),
    [reminders, selectedCustomerId]
  );

  const badgeForDue = (dueISO) => {
    const d = new Date(dueISO);
    const t = new Date(todayISO());
    const diffDays = Math.ceil((d - t) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: `Overdue ${Math.abs(diffDays)}d`, cls: "bg-red-100 text-red-700" };
    if (diffDays === 0) return { label: "Due today", cls: "bg-yellow-100 text-yellow-800" };
    return { label: `In ${diffDays}d`, cls: "bg-green-100 text-green-700" };
  };

  /* ---------- loading and error states ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ledger data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide">Ledger Management</h1>
            <p className="text-white/80 text-sm">Track customers, credits, debits & reminders</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2">
              <div className="text-xs uppercase tracking-wider opacity-80">Balance</div>
              <div className={`text-2xl font-bold ${displayBal >= 0 ? "text-green-200" : "text-red-200"}`}>
                ₹ {formatINR(displayBal)}
              </div>
            </div>
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
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
            >
              <option value="">— Select customer —</option>
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
              </div>
            )}
          </div>

          {/* Add Transaction */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Record Credit / Debit</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!selectedCustomerId) return;
              
              const formData = new FormData(e.target);
              const transaction = {
                customerId: selectedCustomerId,
                type: formData.get("type"),
                amount: Number(formData.get("amount")),
                date: formData.get("date") || todayISO(),
                note: formData.get("note") || ""
              };
              
              handleAddTransaction(transaction);
              e.target.reset();
            }} className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <select name="type" className="border rounded-lg px-3 py-2">
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  className="border rounded-lg px-3 py-2"
                  placeholder="Amount"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  name="date"
                  className="border rounded-lg px-3 py-2"
                  defaultValue={todayISO()}
                />
                <input
                  type="text"
                  name="note"
                  className="border rounded-lg px-3 py-2"
                  placeholder="Note (optional)"
                />
              </div>
              <button
                type="submit"
                disabled={!selectedCustomerId}
                className="rounded-lg px-4 py-2 bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white font-medium shadow disabled:opacity-50"
              >
                Add Transaction
              </button>
            </form>
          </div>

          {/* Add Reminder */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Add Reminder</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!selectedCustomerId) return;
              
              const formData = new FormData(e.target);
              const reminder = {
                dueDate: formData.get("dueDate"),
                message: formData.get("message") || "Payment due"
              };
              
              handleAddReminder(reminder);
              e.target.reset();
            }} className="grid grid-cols-1 gap-3">
              <input
                type="date"
                name="dueDate"
                className="border rounded-lg px-3 py-2"
                defaultValue={todayISO()}
                required
              />
              <input
                type="text"
                name="message"
                className="border rounded-lg px-3 py-2"
                placeholder="Reminder message"
              />
              <button
                type="submit"
                disabled={!selectedCustomerId}
                className="rounded-lg px-4 py-2 bg-white text-[#003B6F] border border-[#66B2FF] hover:bg-[#A7E1FF]/40 transition"
              >
                Add Reminder
              </button>
            </form>

            {/* Reminder list */}
            <div className="mt-4 space-y-2">
              {customerReminders.length === 0 ? (
                <p className="text-sm text-gray-500">No reminders yet.</p>
              ) : (
                customerReminders.map((r) => {
                  const badge = badgeForDue(r.dueDate);
                  return (
                    <div
                      key={r._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {r.message}
                        </div>
                        <div className="text-xs text-gray-500">Due: {r.dueDate}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${badge.cls}`}>{badge.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold text-gray-800">Transaction History</h2>
            <p className="text-sm text-gray-500">
              {selectedCustomer ? selectedCustomer.name : "Select a customer"} — {customerTx.length} records
            </p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#003B6F] text-white">
                  <tr className="text-sm">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {customerTx.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                        {selectedCustomerId
                          ? "No transactions found."
                          : "Select a customer to view transactions."}
                      </td>
                    </tr>
                  ) : (
                    customerTx.map((t) => (
                      <tr
                        key={t._id}
                        className={`border-t text-sm ${
                          t.type === "credit"
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800"
                        }`}
                      >
                        <td className="px-4 py-2">{t.date}</td>
                        <td className="px-4 py-2 capitalize font-medium">{t.type}</td>
                        <td className="px-4 py-2">{t.note || "—"}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatINR(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((c) => {
              const bal = transactions
                .filter((t) => t.customerId === c._id)
                .reduce(
                  (acc, t) => acc + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)),
                  0
                );
              return (
                <button
                  key={c._id}
                  onClick={() => setSelectedCustomerId(c._id)}
                  className={`rounded-2xl border shadow-sm p-4 text-left hover:shadow transition ${
                    selectedCustomerId === c._id ? "border-[#66B2FF]" : "border-gray-200"
                  }`}
                >
                  <div className="font-medium text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.phone || "—"}</div>
                  <div
                    className={`mt-2 text-sm font-semibold ${
                      bal >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹ {formatINR(bal)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
