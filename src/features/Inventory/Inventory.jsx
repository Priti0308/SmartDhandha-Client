import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ---------------------- helpers ---------------------- */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);
const formatINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const load = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------------------- Inventory Page ---------------------- */
const Inventory = () => {
  /* Data stores */
  const [products, setProducts] = useState(() =>
    load("sd_products", [
      { id: uid(), name: "A4 Paper Pack", category: "Stationery", unitPrice: 250, gstRate: 18, stock: 40, lowStock: 10 },
      { id: uid(), name: "Printer Ink", category: "Electronics", unitPrice: 600, gstRate: 18, stock: 12, lowStock: 5 },
       { id: uid(), name: "USB Cable", category: "Accessories", unitPrice: 120, gstRate: 18, stock: 75, lowStock: 20 },
    ])
  );

  const [invoices, setInvoices] = useState(() => load("sd_invoices", [])); // sale/purchase
  const [cashflows, setCashflows] = useState(() => load("sd_cashflows", [])); // expense/income entries

  const [activeTab, setActiveTab] = useState("invoice"); // invoice | products | gst | stock | report

  useEffect(() => save("sd_products", products), [products]);
  useEffect(() => save("sd_invoices", invoices), [invoices]);
  useEffect(() => save("sd_cashflows", cashflows), [cashflows]);

  /* ---------------------- Top KPIs (animated) ---------------------- */
  const totals = useMemo(() => {
    const sales = invoices.filter((i) => i.type === "sale");
    const purchases = invoices.filter((i) => i.type === "purchase");

    const totalSales = sales.reduce((s, i) => s + i.totalGrand, 0);
    const totalPurchases = purchases.reduce((s, i) => s + i.totalGrand, 0);

    const outputGST = sales.reduce((s, i) => s + i.totalGST, 0);
    const inputGST = purchases.reduce((s, i) => s + i.totalGST, 0);
    const netGST = outputGST - inputGST;

    const stockValue = products.reduce((s, p) => s + p.unitPrice * p.stock, 0);

    const income = cashflows.filter((c) => c.kind === "income").reduce((s, c) => s + Number(c.amount), 0);
    const expense = cashflows.filter((c) => c.kind === "expense").reduce((s, c) => s + Number(c.amount), 0);

    return { totalSales, totalPurchases, outputGST, inputGST, netGST, stockValue, income, expense };
  }, [invoices, products, cashflows]);

  // small, dependency-free number animation
  const useCountUp = (value) => {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);
    useEffect(() => {
      const start = display;
      const end = value;
      const dur = 600;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Number((start + (end - start) * eased).toFixed(2)));
        if (p < 1) rafRef.current = requestAnimationFrame(step);
      };
      cancelAnimationFrame(rafRef.current || 0);
      rafRef.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafRef.current || 0);
      // eslint-disable-next-line
    }, [value]);
    return display;
  };

  const kpiSales = useCountUp(totals.totalSales);
  const kpiStock = useCountUp(totals.stockValue);
  const kpiNetGST = useCountUp(totals.netGST);
  const kpiIncome = useCountUp(totals.income - totals.expense);

  /* ---------------------- Create Invoice ---------------------- */
  const [inv, setInv] = useState({
    type: "sale", // sale | purchase
    date: todayISO(),
    customerName: "",
    items: [], // { id, productId, name, qty, price, gstRate, amount, gstAmount, lineTotal }
    note: "",
  });

  // Add Item Modal for Invoice
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    productId: "",
    name: "",
    qty: 1,
    price: 0,
    gstRate: 18,
  });

  const addItem = () => {
    setShowAddItemModal(true);
    setItemForm({ productId: "", name: "", qty: 1, price: 0, gstRate: 18 });
  };

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    let row = { ...itemForm };
    // if product selected, auto-fill name/price/gstRate
    if (row.productId) {
      const p = products.find((x) => x.id === row.productId);
      if (p) {
        row.name = p.name;
        row.price = p.unitPrice;
        row.gstRate = p.gstRate ?? 18;
      }
    }
    const qty = Number(row.qty || 0);
    const price = Number(row.price || 0);
    const gstRate = Number(row.gstRate || 0);
    row.amount = qty * price;
    row.gstAmount = (row.amount * gstRate) / 100;
    row.lineTotal = row.amount + row.gstAmount;
    row.id = uid();
    setInv((v) => ({ ...v, items: [...v.items, row] }));
    setShowAddItemModal(false);
  };

  const removeItem = (rowId) => setInv((v) => ({ ...v, items: v.items.filter((r) => r.id !== rowId) }));

  const onItemChange = (rowId, field, value) => {
    setInv((v) => {
      const items = v.items.map((r) => {
        if (r.id !== rowId) return r;
        let row = { ...r, [field]: value };

        // if product selected, auto-fill name/price/gstRate
        if (field === "productId") {
          const p = products.find((x) => x.id === value);
          if (p) {
            row.name = p.name;
            row.price = p.unitPrice;
            row.gstRate = p.gstRate ?? 18;
          }
        }
        // recalc amount/gst/line total
        const qty = Number(row.qty || 0);
        const price = Number(row.price || 0);
        const gstRate = Number(row.gstRate || 0);
        row.amount = qty * price;
        row.gstAmount = (row.amount * gstRate) / 100;
        row.lineTotal = row.amount + row.gstAmount;
        return row;
      });
      return { ...v, items };
    });
  };

  const totalsInvoice = useMemo(() => {
    const subtotal = inv.items.reduce((s, it) => s + Number(it.amount), 0);
    const totalGST = inv.items.reduce((s, it) => s + Number(it.gstAmount), 0);
    const totalGrand = subtotal + totalGST;
    return { subtotal, totalGST, totalGrand };
  }, [inv.items]);

  const submitInvoice = (e) => {
    e.preventDefault();
    if (!inv.items.length) return;

    const newInvoice = {
      id: uid(),
      type: inv.type,
      date: inv.date,
      customerName: inv.customerName || (inv.type === "purchase" ? "Supplier" : "Customer"),
      items: inv.items,
      note: inv.note,
      subtotal: totalsInvoice.subtotal,
      totalGST: totalsInvoice.totalGST,
      totalGrand: totalsInvoice.totalGrand,
    };

    // Adjust stock: sale -> decrease, purchase -> increase
    setProducts((prev) =>
      prev.map((p) => {
        const used = inv.items.find((it) => it.productId === p.id);
        if (!used) return p;
        const q = Number(used.qty || 0);
        return {
          ...p,
          stock: Math.max(0, p.stock + (inv.type === "sale" ? -q : q)),
        };
      })
    );

    setInvoices((prev) => [newInvoice, ...prev]);

    // Reset form
    setInv({
      type: "sale",
      date: todayISO(),
      customerName: "",
      items: [],
      note: "",
    });
  };

  /* ---------------------- Manage Products ---------------------- */
  const [showProductModal, setShowProductModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    category: "",
    unitPrice: "",
    gstRate: 18,
    stock: "",
    lowStock: 5,
  });

  const openAddProduct = () => {
    setEditId(null);
    setProdForm({ name: "", category: "", unitPrice: "", gstRate: 18, stock: "", lowStock: 5 });
    setShowProductModal(true);
  };

  const openEditProduct = (p) => {
    setEditId(p.id);
    setProdForm({
      name: p.name,
      category: p.category || "",
      unitPrice: p.unitPrice,
      gstRate: p.gstRate ?? 18,
      stock: p.stock,
      lowStock: p.lowStock ?? 5,
    });
    setShowProductModal(true);
  };

  const submitProduct = (e) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return;

    if (editId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editId ? { ...p, ...prodForm, unitPrice: Number(prodForm.unitPrice), stock: Number(prodForm.stock), lowStock: Number(prodForm.lowStock), gstRate: Number(prodForm.gstRate) } : p))
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: uid(),
          name: prodForm.name,
          category: prodForm.category,
          unitPrice: Number(prodForm.unitPrice),
          gstRate: Number(prodForm.gstRate),
          stock: Number(prodForm.stock || 0),
          lowStock: Number(prodForm.lowStock || 5),
        },
      ]);
    }
    setShowProductModal(false);
  };

  const deleteProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id));

  /* ---------------------- GST Report ---------------------- */
  const [gstFilter, setGstFilter] = useState({ from: "", to: "" });
  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (gstFilter.from) list = list.filter((i) => i.date >= gstFilter.from);
    if (gstFilter.to) list = list.filter((i) => i.date <= gstFilter.to);
    return list;
  }, [invoices, gstFilter]);

  const outputGST = filteredInvoices.filter((i) => i.type === "sale").reduce((s, i) => s + i.totalGST, 0);
  const inputGST = filteredInvoices.filter((i) => i.type === "purchase").reduce((s, i) => s + i.totalGST, 0);
  const netGST = outputGST - inputGST;

  /* ---------------------- Stock Tracking ---------------------- */
  const [stockSearch, setStockSearch] = useState("");

  /* ---------------------- Expense/Income ---------------------- */
  const [flowForm, setFlowForm] = useState({
    kind: "expense", // expense | income
    date: todayISO(),
    category: "",
    amount: "",
    note: "",
  });

  const submitCashflow = (e) => {
    e.preventDefault();
    const amt = Number(flowForm.amount || 0);
    if (!amt) return;
    setCashflows((prev) => [
      { id: uid(), ...flowForm, amount: amt },
      ...prev,
    ]);
    setFlowForm({ kind: "expense", date: todayISO(), category: "", amount: "", note: "" });
  };

  const flowsFiltered = cashflows; // extend with filters if needed

  /* ---------------------- Download Invoice PDF ---------------------- */
  const downloadInvoicePDF = async (invoice) => {
    const input = document.getElementById(`invoice-pdf-${invoice.id}`);
    if (!input) return;
    const canvas = await window.html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice_${invoice.id}.pdf`);
  };

  /* ---------------------- UI ---------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-wide">Inventory Management</h1>
              <p className="text-white/80 text-sm">Create invoices, manage products, GST & stock, expenses/income</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
              <KPI title="Sales (₹)" value={kpiSales} />
              <KPI title="Stock Value (₹)" value={kpiStock} />
              <KPI title="Net GST (₹)" value={kpiNetGST} />
              <KPI title="Net Income (₹)" value={kpiIncome} />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { key: "invoice", label: "Create Invoice" },
              { key: "products", label: "Manage Products" },
              { key: "gst", label: "GST Report" },
              { key: "stock", label: "Stock Tracking" },
              { key: "report", label: "Expense / Income" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  activeTab === t.key ? "bg-white text-[#003B6F]" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Invoice</h2>
              <form onSubmit={submitInvoice} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <select
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={inv.type}
                    onChange={(e) => setInv({ ...inv, type: e.target.value })}
                  >
                    <option value="sale">Sale</option>
                    <option value="purchase">Purchase</option>
                  </select>
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={inv.date}
                    onChange={(e) => setInv({ ...inv, date: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder={inv.type === "sale" ? "Customer Name" : "Supplier Name"}
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={inv.customerName}
                    onChange={(e) => setInv({ ...inv, customerName: e.target.value })}
                  />
                </div>

                {/* Items */}
                <div className="rounded-xl border">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                    <div className="font-medium text-gray-700">Items</div>
                    <button
                      type="button"
                      onClick={handleAddItemSubmit}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-[#003B6F] text-white">
                        <tr className="text-sm">
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2">Qty</th>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2">GST %</th>
                          <th className="px-3 py-2">Amount</th>
                          <th className="px-3 py-2">GST</th>
                          <th className="px-3 py-2">Line Total</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.items.length === 0 ? (
                          <tr>
                            <td className="px-3 py-4 text-gray-500 text-center" colSpan={8}>
                              No items yet. Click “Add Item”.
                            </td>
                          </tr>
                        ) : (
                          inv.items.map((row) => (
                            <tr key={row.id} className="border-t text-sm">
                              <td className="px-3 py-2">
                                <select
                                  className="border rounded-lg px-2 py-1.5 w-56 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                                  value={row.productId}
                                  onChange={(e) => onItemChange(row.id, "productId", e.target.value)}
                                >
                                  <option value="">— Select —</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  className="border rounded-lg px-2 py-1.5 w-20 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                                  value={row.qty}
                                  onChange={(e) => onItemChange(row.id, "qty", e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="border rounded-lg px-2 py-1.5 w-24 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                                  value={row.price}
                                  onChange={(e) => onItemChange(row.id, "price", e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="border rounded-lg px-2 py-1.5 w-20 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                                  value={row.gstRate}
                                  onChange={(e) => onItemChange(row.id, "gstRate", e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2">₹ {formatINR(row.amount)}</td>
                              <td className="px-3 py-2">₹ {formatINR(row.gstAmount)}</td>
                              <td className="px-3 py-2 font-semibold">₹ {formatINR(row.lineTotal)}</td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeItem(row.id)}
                                  className="text-red-600 hover:underline text-sm"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 grid sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Invoice note (optional)"
                        className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#66B2FF] outline-none"
                        value={inv.note}
                        onChange={(e) => setInv({ ...inv, note: e.target.value })}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                      <div className="text-xs text-gray-500">Sub Total</div>
                      <div className="font-semibold">₹ {formatINR(totalsInvoice.subtotal)}</div>
                      <div className="text-xs text-gray-500 mt-2">GST</div>
                      <div className="font-semibold">₹ {formatINR(totalsInvoice.totalGST)}</div>
                      <div className="text-xs text-gray-500 mt-2">Grand Total</div>
                      <div className="text-lg font-bold text-[#0066A3]">₹ {formatINR(totalsInvoice.totalGrand)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow"
                  >
                    Save Invoice & Update Stock
                  </button>
                </div>
              </form>
            </div>

            {/* Latest Invoices */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Recent Invoices</h3>
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {invoices.length === 0 ? (
                  <p className="text-sm text-gray-500">No invoices yet.</p>
                ) : (
                  invoices.slice(0, 8).map((i) => (
                    <div key={i.id} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded ${i.type === "sale" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {i.type === "sale" ? "Sale" : "Purchase"}
                        </span>
                        <span className="text-xs text-gray-500">{i.date}</span>
                      </div>
                      <div className="mt-1 font-medium">{i.customerName}</div>
                      <div className="text-sm text-gray-600">
                        {i.items.length} items • GST ₹{formatINR(i.totalGST)}
                      </div>
                      <div className="mt-1 font-semibold text-[#003B6F]">₹ {formatINR(i.totalGrand)}</div>
                      <button
                        className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white"
                        onClick={() => downloadInvoicePDF(i)}
                      >
                        Download PDF
                      </button>
                      <div style={{ display: "none" }}>
                        <div id={`invoice-pdf-${i.id}`}> {/* Hidden invoice for PDF generation */}
                          <h2>Invoice</h2>
                          <div>Date: {i.date}</div>
                          <div>Type: {i.type}</div>
                          <div>Customer: {i.customerName}</div>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>GST %</th>
                                <th>Amount</th>
                                <th>GST</th>
                                <th>Line Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {i.items.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.name}</td>
                                  <td>{row.qty}</td>
                                  <td>{row.price}</td>
                                  <td>{row.gstRate}</td>
                                  <td>{formatINR(row.amount)}</td>
                                  <td>{formatINR(row.gstAmount)}</td>
                                  <td>{formatINR(row.lineTotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div>Sub Total: ₹ {formatINR(i.subtotal)}</div>
                          <div>GST: ₹ {formatINR(i.totalGST)}</div>
                          <div>Grand Total: ₹ {formatINR(i.totalGrand)}</div>
                        </div>
                      </div>


                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Manage Products</h2>
              <button
                onClick={openAddProduct}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white"
              >
                + Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              {/* Add Item Modal */}
              {showAddItemModal && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
                  <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                    <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
                      <div className="text-lg font-semibold">Add Item</div>
                    </div>
                    <form onSubmit={handleAddItemSubmit} className="p-6 space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Product</label>
                        <select
                          className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                          value={itemForm.productId}
                          onChange={(e) => setItemForm({ ...itemForm, productId: e.target.value })}
                        >
                          <option value="">— Select —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-600">Qty</label>
                          <input type="number" min="1" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none" value={itemForm.qty} onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })} required />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Price</label>
                          <input type="number" step="0.01" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} required />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">GST %</label>
                          <input type="number" step="0.01" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none" value={itemForm.gstRate} onChange={(e) => setItemForm({ ...itemForm, gstRate: e.target.value })} required />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddItemModal(false)} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow">Add</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <table className="min-w-full text-left">
                <thead className="bg-[#003B6F] text-white">
                  <tr className="text-sm">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Unit Price</th>
                    <th className="px-3 py-2">GST %</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Low Stock</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                        No products yet.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="border-t text-sm">
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2">{p.category || "—"}</td>
                        <td className="px-3 py-2">₹ {formatINR(p.unitPrice)}</td>
                        <td className="px-3 py-2">{p.gstRate ?? 18}%</td>
                        <td className="px-3 py-2">{p.stock}</td>
                        <td className="px-3 py-2">{p.lowStock ?? 5}</td>
                        <td className="px-3 py-2 space-x-3">
                          <button className="text-[#0066A3] hover:underline" onClick={() => openEditProduct(p)}>
                            Edit
                          </button>
                          <button className="text-red-600 hover:underline" onClick={() => deleteProduct(p.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "gst" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">GST Report</h2>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={gstFilter.from}
                    onChange={(e) => setGstFilter({ ...gstFilter, from: e.target.value })}
                  />
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={gstFilter.to}
                    onChange={(e) => setGstFilter({ ...gstFilter, to: e.target.value })}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#003B6F] text-white">
                    <tr className="text-sm">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Party</th>
                      <th className="px-3 py-2">Sub Total</th>
                      <th className="px-3 py-2">GST</th>
                      <th className="px-3 py-2">Grand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                          No invoices for selected period.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((i) => (
                        <tr key={i.id} className="border-t text-sm">
                          <td className="px-3 py-2">{i.date}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-1 rounded ${i.type === "sale" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                              {i.type === "sale" ? "Sale" : "Purchase"}
                            </span>
                          </td>
                          <td className="px-3 py-2">{i.customerName}</td>
                          <td className="px-3 py-2">₹ {formatINR(i.subtotal)}</td>
                          <td className="px-3 py-2">₹ {formatINR(i.totalGST)}</td>
                          <td className="px-3 py-2 font-semibold">₹ {formatINR(i.totalGrand)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GST summary */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Summary</h3>
              <div className="space-y-3">
                <SummaryRow label="Output GST (Sales)" value={outputGST} pos />
                <SummaryRow label="Input GST (Purchases)" value={inputGST} />
                <div className="border-t pt-3">
                  <SummaryRow label="Net GST Payable" value={netGST} highlight />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Stock Tracking</h2>
              <input
                type="text"
                placeholder="Search product"
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#003B6F] text-white">
                  <tr className="text-sm">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Low Stock</th>
                    <th className="px-3 py-2">Unit Price</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter((p) => p.name.toLowerCase().includes(stockSearch.toLowerCase()))
                    .map((p) => {
                      const isLow = p.stock <= (p.lowStock ?? 5);
                      return (
                        <tr key={p.id} className="border-t text-sm">
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2">{p.category || "—"}</td>
                          <td className="px-3 py-2">{p.stock}</td>
                          <td className="px-3 py-2">{p.lowStock ?? 5}</td>
                          <td className="px-3 py-2">₹ {formatINR(p.unitPrice)}</td>
                          <td className="px-3 py-2">₹ {formatINR(p.unitPrice * p.stock)}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-1 rounded ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                              {isLow ? "Low Stock" : "OK"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "report" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add entry */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Add Expense / Income</h2>
              <form onSubmit={submitCashflow} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={flowForm.kind}
                    onChange={(e) => setFlowForm({ ...flowForm, kind: e.target.value })}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={flowForm.date}
                    onChange={(e) => setFlowForm({ ...flowForm, date: e.target.value })}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Category (e.g., Rent, Delivery, Service)"
                  className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#66B2FF] outline-none"
                  value={flowForm.category}
                  onChange={(e) => setFlowForm({ ...flowForm, category: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#66B2FF] outline-none"
                  value={flowForm.amount}
                  onChange={(e) => setFlowForm({ ...flowForm, amount: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#66B2FF] outline-none"
                  value={flowForm.note}
                  onChange={(e) => setFlowForm({ ...flowForm, note: e.target.value })}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow w-full"
                >
                  Add Entry
                </button>
              </form>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Summary</h3>
              <div className="space-y-3">
                <SummaryRow label="Total Income" value={totals.income} pos />
                <SummaryRow label="Total Expense" value={totals.expense} />
                <div className="border-t pt-3">
                  <SummaryRow label="Net (Income - Expense)" value={totals.income - totals.expense} highlight />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Entries</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#003B6F] text-white">
                    <tr className="text-sm">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Note</th>
                      <th className="px-3 py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flowsFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                          No entries yet.
                        </td>
                      </tr>
                    ) : (
                      flowsFiltered.map((f) => (
                        <tr key={f.id} className="border-t text-sm">
                          <td className="px-3 py-2">{f.date}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-1 rounded ${f.kind === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {f.kind === "income" ? "Income" : "Expense"}
                            </span>
                          </td>
                          <td className="px-3 py-2">{f.category || "—"}</td>
                          <td className="px-3 py-2">{f.note || "—"}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatINR(f.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
              <div className="text-lg font-semibold">{editId ? "Edit Product" : "Add Product"}</div>
            </div>
            <form onSubmit={submitProduct} className="p-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Category</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={prodForm.unitPrice}
                    onChange={(e) => setProdForm({ ...prodForm, unitPrice: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">GST %</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={prodForm.gstRate}
                    onChange={(e) => setProdForm({ ...prodForm, gstRate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Opening Stock</label>
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Low Stock Alert At</label>
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={prodForm.lowStock}
                    onChange={(e) => setProdForm({ ...prodForm, lowStock: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow"
                >
                  {editId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------- small UI components ---------------------- */
const KPI = ({ title, value }) => (
  <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
    <div className="text-xs uppercase tracking-wider opacity-80">{title}</div>
    <div className="text-lg font-bold">₹ {formatINR(value)}</div>
  </div>
);

const SummaryRow = ({ label, value, pos = false, highlight = false }) => (
  <div className={`flex items-center justify-between ${highlight ? "text-[#003B6F] font-semibold" : ""}`}>
    <span className="text-gray-700">{label}</span>
    <span className={`${pos ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-800"} font-semibold`}>
      ₹ {formatINR(value)}
    </span>
  </div>
);

export default Inventory; 