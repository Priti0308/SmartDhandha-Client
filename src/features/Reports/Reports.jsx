import React, { useState } from "react";
import { FileText, Download, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Reports = () => {
  const [transactions] = useState([
    { id: 1, date: "2025-08-01", description: "Product Sale", type: "credit", amount: 12000, category: "Sales" },
    { id: 2, date: "2025-08-02", description: "Raw Material Purchase", type: "debit", amount: 5000, category: "Purchase" },
    { id: 3, date: "2025-08-05", description: "GST Paid", type: "debit", amount: 1500, category: "Tax" },
    { id: 4, date: "2025-08-07", description: "Consultancy Income", type: "credit", amount: 8000, category: "Services" },
  ]);

  const totalIncome = transactions.filter(t => t.type === "credit").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "debit").reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const gstCollected = transactions.filter(t => t.category === "Tax").reduce((acc, t) => acc + t.amount, 0);

  // Export Excel
  const exportExcel = () => {
    const ws = utils.json_to_sheet(transactions);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Reports");
    writeFile(wb, "reports.xlsx");
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Business Report", 14, 10);
    doc.autoTable({
      head: [["Date", "Description", "Type", "Amount", "Category"]],
      body: transactions.map(t => [t.date, t.description, t.type, t.amount, t.category]),
    });
    doc.save("reports.pdf");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-[#001B48] via-[#02457A] to-[#018ABE] p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">📊 Reports & Analytics</h1>
        <p className="text-sm opacity-90">Track income, expenses, GST and profit insights</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Total Income", value: `₹${totalIncome}`, color: "bg-gradient-to-r from-green-400 to-green-600 text-white" },
            { title: "Total Expense", value: `₹${totalExpense}`, color: "bg-gradient-to-r from-red-400 to-red-600 text-white" },
            { title: "Net Profit", value: `₹${netProfit}`, color: "bg-gradient-to-r from-blue-400 to-blue-600 text-white" },
            { title: "GST Collected", value: `₹${gstCollected}`, color: "bg-gradient-to-r from-yellow-300 to-yellow-500 text-[#001B48]" },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className={`p-6 rounded-xl shadow-lg ${card.color}`}
            >
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="text-2xl font-bold">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter & Export */}
        <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <Calendar className="text-[#018ABE]" />
            <input type="date" className="border rounded-lg px-3 py-1" />
            <span>-</span>
            <input type="date" className="border rounded-lg px-3 py-1" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportExcel}
              className="px-4 py-2 bg-gradient-to-r from-[#02457A] to-[#018ABE] text-white rounded-lg flex items-center gap-2"
            >
              <Download size={18} /> Excel
            </button>
            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-gradient-to-r from-[#001B48] to-[#02457A] text-white rounded-lg flex items-center gap-2"
            >
              <FileText size={18} /> PDF
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-[#001B48] mb-4">📑 Transactions</h2>
          <table className="w-full text-left border rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-[#02457A] to-[#018ABE] text-white">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
                <th className="p-2">Type</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Category</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr
                  key={t.id}
                  className={`${
                    t.type === "credit" ? "bg-green-50" : "bg-red-50"
                  } border-b hover:bg-gray-50`}
                >
                  <td className="p-2">{t.date}</td>
                  <td className="p-2">{t.description}</td>
                  <td className="p-2 capitalize">{t.type}</td>
                  <td className="p-2">₹{t.amount}</td>
                  <td className="p-2">{t.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income vs Expense Line Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-bold text-[#001B48] mb-4">📈 Income vs Expense</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={transactions}>
                <Line type="monotone" dataKey="amount" stroke="#018ABE" strokeWidth={2} />
                <CartesianGrid stroke="#97CADB" strokeDasharray="5 5" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category-wise Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-bold text-[#001B48] mb-4">📊 Category-wise Report</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={transactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#02457A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
