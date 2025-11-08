import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import JsBarcode from "jsbarcode";

import { get, post, put, deleteItem, postInvoice, recordPayment } from "../../services/inventoryService";

// Import React Toastify components and CSS
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/* ---------------------- helpers ---------------------- */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);
const formatINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------------------- Barcode Component ---------------------- */
const Barcode = ({ value }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 14,
          margin: 5
        });
      } catch (e) {
        console.error("Barcode generation failed:", e);
      }
    }
  }, [value]);

  if (!value) {
    return <span className="text-xs text-gray-400">No SKU</span>;
  }

  return <svg ref={ref}></svg>;
};

/* ---------------------- Inventory Page ---------------------- */
const Inventory = ({ businessName = "SmartDhandha" }) => {
  /* Data stores */
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [cashflows, setCashflows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invoice");

  // State for view modals
  const [viewProduct, setViewProduct] = useState(null);
  const [viewSupplier, setViewSupplier] = useState(null);

  // State for reliable PDF generation
  const [invoiceForPdf, setInvoiceForPdf] = useState(null);

  // --- State for Payment Modal ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForInvoice, setPaymentForInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: todayISO(),
    paymentMethod: "Cash",
    note: "",
  });

  // --- NEW: State for Customer Add-on-the-fly ---
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });


  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, invoicesData, cashflowsData, suppliersData, customersData] = await Promise.all([
          get("inventory/products"),
          get("inventory/invoices"),
          get("inventory/cashflows"),
          get("inventory/suppliers"),
          get("inventory/customers"),
        ]);
        setProducts(productsData);
        setInvoices(invoicesData.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setCashflows(cashflowsData);
        setSuppliers(suppliersData);
        setCustomers(customersData);
      } catch (err) {
        toast.error("Failed to fetch initial data. Please try logging in again or refresh.");
        console.error("Fetch Data Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Effect hook to handle PDF generation
  useEffect(() => {
    const generatePdf = async () => {
        if (!invoiceForPdf) return;

        const element = document.getElementById('pdf-generator');
        if (!element) {
            toast.error("PDF generation failed: Template not found.");
            setInvoiceForPdf(null);
            return;
        }

        const loadingToast = toast.info("Generating PDF...", { autoClose: false, closeButton: false });

        try {
            await new Promise(resolve => setTimeout(resolve, 50));

            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
              heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(`${invoiceForPdf.type === 'sale' ? 'Invoice' : 'Bill'}-${invoiceForPdf.customerName.replace(/ /g, '-')}-${invoiceForPdf.date}.pdf`);
            toast.update(loadingToast, { render: "PDF downloaded! 📥", type: "success", autoClose: 3000 });
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            toast.update(loadingToast, { render: "Could not download PDF.", type: "error", autoClose: 5000 });
        } finally {
            setInvoiceForPdf(null);
        }
    };

    generatePdf();
  }, [invoiceForPdf, businessName]);


  /* ---------------------- Top KPIs ---------------------- */
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

  const useCountUp = (value) => value;
  const kpiSales = useCountUp(totals.totalSales);
  const kpiStock = useCountUp(totals.stockValue);
  const kpiNetGST = useCountUp(totals.netGST);
  const kpiIncome = useCountUp(totals.income - totals.expense);

  /* ---------------------- Create Invoice / Purchase Bill ---------------------- */
  const [inv, setInv] = useState({
    type: "sale",
    date: todayISO(),
    customerName: "",
    items: [],
    note: "",
  });

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    productId: "",
    name: "",
    qty: 1,
    price: 0,
    gstRate: 18,
  });
  
  // NEW: Memoized filtered customers for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customerSearch, customers]);

  // NEW: Handler for customer search input change
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearch(value);
    setInv(prev => ({ ...prev, customerName: value }));
    if (!showCustomerSuggestions) {
      setShowCustomerSuggestions(true);
    }
  };

  // NEW: Handler for selecting a customer from suggestions
  const handleSelectCustomer = (customerName) => {
    setCustomerSearch(customerName);
    setInv(prev => ({ ...prev, customerName: customerName }));
    setShowCustomerSuggestions(false);
  };
  
  // NEW: Handler for submitting the Add Customer modal
  const handleAddNewCustomerSubmit = async (e) => {
      e.preventDefault();
      if (!newCustomerForm.name.trim()) {
          toast.warn("Customer name is required.");
          return;
      }
      try {
          // Assuming your 'post' service call to 'ledger/customers' works
          await post('inventory/customers', newCustomerForm);
          const updatedCustomers = await get('inventory/customers'); // Refetch customers
          setCustomers(updatedCustomers);
          
          handleSelectCustomer(newCustomerForm.name); // Select the newly added customer
          
          toast.success(`Customer '${newCustomerForm.name}' added! You can now save the invoice.`);
          setShowAddCustomerModal(false);
          setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
      } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to add new customer.');
          console.error("Add Customer Error:", error.response?.data || error);
      }
  };

    // MODIFIED: This function now automatically checks for new customers on blur.
    const handleCustomerFieldBlur = () => {
        // A small delay is crucial. It allows the user to click on a suggestion
        // before the onBlur event hides the suggestion list.
        setTimeout(() => {
          setShowCustomerSuggestions(false);
    
          const partyName = customerSearch.trim();
    
          // This logic should only run for 'sale' invoices and if a name has been typed.
          if (inv.type === 'sale' && partyName) {
            // Check if the typed customer name already exists in our list (case-insensitive).
            const customerExists = customers.some(c => c.name.toLowerCase() === partyName.toLowerCase());
    
            // If the customer does NOT exist, automatically open the 'Add Customer' modal.
            if (!customerExists) {
              // Pre-fill the new customer form with the name the user typed.
              setNewCustomerForm({ name: partyName, phone: '', email: '', address: '' });
              setShowAddCustomerModal(true);
              toast.info("This is a new customer. Please add their details to continue.");
            }
          }
        }, 200); // 200ms delay to allow click events to process.
      };


  useEffect(() => {
    if (itemForm.productId) {
      const product = products.find(p => p._id === itemForm.productId);
      if (product) {
        setItemForm(prevForm => ({
          ...prevForm,
          price: product.unitPrice,
          gstRate: product.gstRate ?? 18,
        }));
      }
    } else {
        setItemForm(prevForm => ({...prevForm, price: 0, gstRate: 18}));
    }
  }, [itemForm.productId, products]);

  const addItem = () => {
    setShowAddItemModal(true);
    setItemForm({ productId: "", name: "", qty: 1, price: 0, gstRate: 18 });
  };

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    let row = { ...itemForm };
    if (!row.productId) {
        toast.warn("Please select a product.");
        return;
    }
    const p = products.find((x) => x._id === row.productId);
    if (p) {
        row.name = p.name;
        row.gstRate = p.gstRate ?? 18;
    } else {
        toast.error("Selected product not found.");
        return;
    }

    const qty = Number(row.qty || 0);
    const price = Number(row.price || 0);
    const gstRate = Number(row.gstRate || 0);

    if (qty <= 0) { toast.warn("Quantity must be greater than zero."); return; }
    if (price < 0) { toast.warn("Price cannot be negative."); return; }
    if (gstRate < 0) { toast.warn("GST Rate cannot be negative."); return; }

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

        if (field === "productId") {
          const p = products.find((x) => x._id === value);
          if (p) {
            row.name = p.name;
            row.price = p.unitPrice;
            row.gstRate = p.gstRate ?? 18;
          } else {
              row.name = "";
              row.price = 0;
              row.gstRate = 18;
          }
        }
        if (["qty", "price", "gstRate"].includes(field)) {
          const qty = Number(row.qty || 0);
          const price = Number(row.price || 0);
          const gstRate = Number(row.gstRate || 0);
          if (!isNaN(qty) && !isNaN(price) && !isNaN(gstRate)) {
            row.amount = qty * price;
            row.gstAmount = (row.amount * gstRate) / 100;
            row.lineTotal = row.amount + row.gstAmount;
          }
        }
        return row;
      });
      return { ...v, items };
    });
  };

  const totalsInvoice = useMemo(() => {
    const subtotal = inv.items.reduce((s, it) => s + Number(it.amount || 0), 0);
    const totalGST = inv.items.reduce((s, it) => s + Number(it.gstAmount || 0), 0);
    const totalGrand = subtotal + totalGST;
    return { subtotal, totalGST, totalGrand };
  }, [inv.items]);

  const submitInvoice = async (e) => {
    e.preventDefault();
    if (!inv.items.length) { toast.warn("Please add at least one item."); return; }
    const partyName = inv.customerName.trim();
    if (!partyName) { toast.warn(`Please select a ${inv.type === 'sale' ? 'Customer' : 'Supplier'}.`); return; }

    // --- NEW: Check if customer exists for sales invoices ---
    if (inv.type === 'sale') {
      const customerExists = customers.some(c => c.name.toLowerCase() === partyName.toLowerCase());
      if (!customerExists) {
        setNewCustomerForm({ name: partyName, phone: '', email: '', address: '' });
        setShowAddCustomerModal(true);
        toast.info("This customer is not in your list. Please add their details.");
        return;
      }
    }

    const newInvoiceData = {
      type: inv.type,
      date: inv.date,
      customerName: partyName,
      items: inv.items.map(({id, ...rest}) => ({
        ...rest,
        qty: Number(rest.qty),
        price: Number(rest.price),
        gstRate: Number(rest.gstRate),
        amount: Number(rest.amount),
        gstAmount: Number(rest.gstAmount),
        lineTotal: Number(rest.lineTotal),
      })),
      note: inv.note,
      subtotal: totalsInvoice.subtotal,
      totalGST: totalsInvoice.totalGST,
      totalGrand: totalsInvoice.totalGrand,
    };

    try {
      await postInvoice(newInvoiceData);
      
      const [productsData, invoicesData, cashflowsData] = await Promise.all([
        get("inventory/products"),
        get("inventory/invoices"),
        get("inventory/cashflows"),
      ]);
      setProducts(productsData);
      setInvoices(invoicesData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setCashflows(cashflowsData);

      setInv({ type: inv.type, date: todayISO(), customerName: "", items: [], note: "" });
      setCustomerSearch(""); // Clear customer search field
      toast.success(`${inv.type === 'sale' ? 'Invoice' : 'Purchase Bill'} saved & stock updated!`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to save ${inv.type === 'sale' ? 'invoice' : 'bill'}.`);
      console.error("Save Invoice Error:", error.response?.data || error);
    }
  };

  const deleteInvoice = async (invoice) => {
    if (window.confirm(`Are you sure you want to delete this ${invoice.type}? This will also delete ALL related payments and reverse stock changes.`)) {
      try {
        await deleteItem('inventory/invoices', invoice._id);
 
        const [invoicesData, cashflowsData, productsData] = await Promise.all([
            get("inventory/invoices"),
            get("inventory/cashflows"),
            get("inventory/products")
        ]);
        setInvoices(invoicesData.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setCashflows(cashflowsData);
        setProducts(productsData);
 
        toast.success("Invoice and related payments deleted successfully!");
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete invoice.');
        console.error("Delete Invoice Error:", error.response?.data || error);
      }
    }
  };
  
  /* ---------------------- Record Payments ---------------------- */
  const openPaymentModal = (invoice) => {
    setPaymentForInvoice(invoice);
    setPaymentForm({
      amount: invoice.balanceDue?.toFixed(2) || "",
      date: todayISO(),
      paymentMethod: "Cash",
      note: `Payment for ${invoice.type === 'sale' ? 'Invoice' : 'Bill'}`
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.warn("Please enter a valid positive payment amount.");
      return;
    }
    if (amount > (paymentForInvoice.balanceDue + 0.01)) {
        toast.error(`Payment cannot exceed balance due of ₹${formatINR(paymentForInvoice.balanceDue)}.`);
        return;
    }

    try {
        await recordPayment(paymentForInvoice._id, paymentForm);

        const [invoicesData, cashflowsData] = await Promise.all([
            get("inventory/invoices"),
            get("inventory/cashflows")
        ]);
        setInvoices(invoicesData.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setCashflows(cashflowsData);

        toast.success("Payment recorded successfully!");
        setShowPaymentModal(false);
        setPaymentForInvoice(null);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to record payment.');
        console.error("Record Payment Error:", error.response?.data || error);
    }
  };


  /* ---------------------- Manage Products ---------------------- */
  const [showProductModal, setShowProductModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [prodForm, setProdForm] = useState({
    name: "", category: "", sku: "", unitPrice: "", gstRate: 18, stock: "", lowStock: 5, image: ""
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdForm({ ...prodForm, image: reader.result });
      };
      reader.onerror = () => {
          toast.error("Failed to read image file.");
      }
      reader.readAsDataURL(file);
    } else if (file) {
        toast.warn("Image size should be less than 2MB.");
    }
  };

  const openAddProduct = () => {
    setEditId(null);
    setProdForm({ name: "", category: "", sku: "", unitPrice: "", gstRate: 18, stock: "", lowStock: 5, image: "" });
    setShowProductModal(true);
  };

  const openEditProduct = (p) => {
    setEditId(p._id);
    setProdForm({
      name: p.name, category: p.category || "", sku: p.sku || "", unitPrice: p.unitPrice,
      gstRate: p.gstRate ?? 18, stock: p.stock, lowStock: p.lowStock ?? 5, image: p.image || ""
    });
    setShowProductModal(true);
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    if (!prodForm.name.trim()) { toast.warn("Product name is required."); return; }
    const unitPrice = Number(prodForm.unitPrice);
    const stock = Number(prodForm.stock || 0);
    const lowStock = Number(prodForm.lowStock || 5);
    const gstRate = Number(prodForm.gstRate || 18);

    if (isNaN(unitPrice) || unitPrice < 0) { toast.warn("Please enter a valid Unit Price."); return; }
    if (isNaN(stock) || stock < 0) { toast.warn("Please enter a valid Opening Stock (0 or more)."); return; }
    if (isNaN(lowStock) || lowStock < 0) { toast.warn("Please enter a valid Low Stock Alert level (0 or more)."); return; }
    if (isNaN(gstRate) || gstRate < 0) { toast.warn("Please enter a valid GST Rate (0 or more)."); return; }

    const productData = {
      ...prodForm,
      unitPrice, stock, lowStock, gstRate
    };

    try {
      if (editId) {
        await put('inventory/products', { ...productData, id: editId });
        toast.success("Product updated successfully! ");
      } else {
        await post('inventory/products', productData);
        toast.success("Product added successfully! ");
      }
      setProducts(await get('inventory/products'));
      setShowProductModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product.');
      console.error("Save Product Error:", error.response?.data || error);
    }
  };

  const deleteProduct = async (id) => {
    const isInInvoice = invoices.some(inv => inv.items.some(item => item.productId === id));
    if (isInInvoice) {
        toast.error("Cannot delete product: It is used in existing invoices/bills.");
        return;
    }
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        await deleteItem('inventory/products', id);
        setProducts(await get('inventory/products'));
        toast.success("Product deleted successfully! ");
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete product.');
        console.error("Delete Product Error:", error.response?.data || error);
      }
    }
  };

  /* ---------------------- Manage Suppliers ---------------------- */
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState(null);
  const [suppForm, setSuppForm] = useState({
    name: "", contactPerson: "", phone: "", email: "",
  });

  const openAddSupplier = () => {
    setEditSupplierId(null);
    setSuppForm({ name: "", contactPerson: "", phone: "", email: "" });
    setShowSupplierModal(true);
  };

  const openEditSupplier = (s) => {
    setEditSupplierId(s._id);
    setSuppForm({
      name: s.name,
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      email: s.email || "",
    });
    setShowSupplierModal(true);
  };

  const submitSupplier = async (e) => {
    e.preventDefault();
    if (!suppForm.name.trim()) { toast.warn("Supplier name is required."); return; }
    try {
      if (editSupplierId) {
        await put('inventory/suppliers', { ...suppForm, id: editSupplierId });
        toast.success("Supplier updated successfully! ");
      } else {
        await post('inventory/suppliers', suppForm);
        toast.success("Supplier added successfully! ");
      }
      setSuppliers(await get('inventory/suppliers'));
      setShowSupplierModal(false);
    } catch (error)   {
      toast.error(error.response?.data?.message || 'Failed to save supplier.');
      console.error("Save Supplier Error:", error.response?.data || error);
    }
  };

  const deleteSupplier = async (id) => {
      const supplier = suppliers.find(s => s._id === id);
      const supplierName = supplier?.name;
      if (supplierName) {
         const isInPurchaseBill = invoices.some(inv => inv.type === 'purchase' && inv.customerName === supplierName);
         if (isInPurchaseBill) {
             toast.error("Cannot delete supplier: They are associated with existing purchase bills.");
             return;
         }
      }
      if (window.confirm("Are you sure you want to delete this supplier?")) {
        try {
          await deleteItem('inventory/suppliers', id);
          setSuppliers(await get('inventory/suppliers'));
          toast.success("Supplier deleted successfully! ");
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to delete supplier.');
          console.error("Delete Supplier Error:", error.response?.data || error);
        }
      }
  };

  /* ---------------------- GST Report ---------------------- */
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


  /* ---------------------- Stock Tracking ---------------------- */
  const [stockSearch, setStockSearch] = useState("");

  /* ---------------------- Expense/Income ---------------------- */
  const [flowForm, setFlowForm] = useState({
    kind: "expense", date: todayISO(), category: "", amount: "", note: "",
  });

  const submitCashflow = async (e) => {
    e.preventDefault();
    const amt = Number(flowForm.amount || 0);
    if (!amt || amt <= 0) { toast.warn("Please enter a valid positive amount."); return; }
    if (!flowForm.category.trim()) { toast.warn("Please enter a category."); return; }

    try {
      await post('inventory/cashflows', { ...flowForm, amount: amt });
      setCashflows(await get('inventory/cashflows'));
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

  const flowsFiltered = cashflows;

  /* ---------------------- UI ---------------------- */
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading data...</div>;
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
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-wide">Inventory Management</h1>
              <p className="text-white/80 text-sm">Sales, Purchases, Products, Stock & More</p>
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
              { key: "allInvoices", label: "All Invoices"},
              { key: "products", label: "Products" },
              { key: "suppliers", label: "Suppliers" },
              { key: "gst", label: "GST Report" },
              { key: "stock", label: "Stock Tracking" },
              { key: "report", label: "Expense / Income" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${activeTab === t.key ? "bg-white text-[#003B6F]" : "bg-white/10 text-white hover:bg-white/20"
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
        {/* --- CREATE INVOICE / BILL Tab --- */}
        {activeTab === "invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Create {inv.type === 'sale' ? 'Sale Invoice' : 'Purchase Bill'}
              </h2>
              <form onSubmit={submitInvoice} className="space-y-4">
                 <div className="grid sm:grid-cols-3 gap-4">
                 <div>
                    <label className="text-xs text-gray-500 block mb-1">Type</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                      value={inv.type}
                      onChange={(e) => {
                        setInv({ ...inv, type: e.target.value, customerName: "" });
                        setCustomerSearch(""); // Reset search on type change
                      }}
                    >
                      <option value="sale">Sale Invoice</option>
                      <option value="purchase">Purchase Bill</option>
                    </select>
                  </div>
                 <div>
                    <label className="text-xs text-gray-500 block mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none"
                    value={inv.date}
                    onChange={(e) => setInv({ ...inv, date: e.target.value })}
                  />
                  </div>
                  {/* --- MODIFIED: Customer/Supplier input --- */}
                  <div onBlur={handleCustomerFieldBlur}>
                    <label className="text-xs text-gray-500 block mb-1">
                      {inv.type === 'sale' ? 'Customer Name' : 'Supplier Name'}
                    </label>
                    {inv.type === 'sale' ? (
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none bg-white"
                          value={customerSearch}
                          onChange={handleCustomerSearchChange}
                          onFocus={() => setShowCustomerSuggestions(true)}
                          placeholder="Type to search or add new..."
                          autoComplete="off"
                          required
                        />
                        {showCustomerSuggestions && filteredCustomers.length > 0 && (
                          <ul className="absolute z-20 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {filteredCustomers.map(c => (
                              <li 
                                key={c._id} 
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onMouseDown={() => handleSelectCustomer(c.name)}
                               >
                                {c.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                     <select
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none bg-white"
                        value={inv.customerName}
                        onChange={(e) => setInv({ ...inv, customerName: e.target.value })}
                        required
                      >
                        <option value="">— Select Supplier —</option>
                        {suppliers.map((s) => (
                          <option key={s._id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  </div>

                {/* Items Table */}
                <div className="rounded-xl border">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                    <div className="font-medium text-gray-700">Items / Products</div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white hover:opacity-90 transition-opacity"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-[#003B6F] text-white text-xs uppercase">
                        <tr>
                          <th className="px-3 py-2 font-medium">Product</th>
                          <th className="px-3 py-2 font-medium w-24">Qty</th>
                          <th className="px-3 py-2 font-medium w-28">Price (₹)</th>
                          <th className="px-3 py-2 font-medium w-24">GST %</th>
                          <th className="px-3 py-2 font-medium w-32 text-right">Amount (₹)</th>
                          <th className="px-3 py-2 font-medium w-28 text-right">GST (₹)</th>
                          <th className="px-3 py-2 font-medium w-32 text-right">Line Total (₹)</th>
                          <th className="px-3 py-2 font-medium w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.items.length === 0 ? (
                          <tr>
                            <td className="px-3 py-4 text-gray-500 text-center text-sm" colSpan={8}>
                              No items added yet.
                            </td>
                          </tr>
                        ) : (
                          inv.items.map((row) => (
                            <tr key={row.id} className="border-t text-sm hover:bg-gray-50">
                              <td className="px-3 py-2 align-top">
                                <select
                                  className="border rounded-lg px-2 py-1.5 w-full focus:ring-1 focus:ring-[#66B2FF] outline-none bg-white text-sm"
                                  value={row.productId}
                                  onChange={(e) => onItemChange(row.id, "productId", e.target.value)}
                                >
                                  <option value="">— Select —</option>
                                  {products.map((p) => (
                                    <option key={p._id} value={p._id}>
                                      {p.name} {p.sku ? `(${p.sku})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2 align-top">
                                <input
                                  type="number"
                                  min="0.001"
                                  step="any"
                                  className="border rounded-lg px-2 py-1.5 w-full focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                                  value={row.qty}
                                  onChange={(e) => onItemChange(row.id, "qty", e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2 align-top">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="border rounded-lg px-2 py-1.5 w-full focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                                  value={row.price}
                                  onChange={(e) => onItemChange(row.id, "price", e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2 align-top">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="border rounded-lg px-2 py-1.5 w-full focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                                  value={row.gstRate}
                                  onChange={(e) => onItemChange(row.id, "gstRate", e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2 text-right align-top">₹ {formatINR(row.amount)}</td>
                              <td className="px-3 py-2 text-right align-top">₹ {formatINR(row.gstAmount)}</td>
                              <td className="px-3 py-2 text-right align-top font-semibold">₹ {formatINR(row.lineTotal)}</td>
                              <td className="px-3 py-2 text-center align-top">
                                <button
                                  type="button"
                                  onClick={() => removeItem(row.id)}
                                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                                  title="Remove Item"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Totals Section */}
                  <div className="px-4 py-3 grid sm:grid-cols-3 gap-4 border-t">
                    <div className="sm:col-span-2">
                     <label className="text-xs text-gray-500 block mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="Add any notes here..."
                      className="w-full border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm"
                      value={inv.note}
                      onChange={(e) => setInv({ ...inv, note: e.target.value })}
                    />
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sub Total:</span>
                        <span className="font-semibold">₹ {formatINR(totalsInvoice.subtotal)}</span>
                      </div>
                       <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total GST:</span>
                        <span className="font-semibold">₹ {formatINR(totalsInvoice.totalGST)}</span>
                      </div>
                       <div className="flex justify-between text-base mt-2 pt-2 border-t border-gray-200">
                        <span className="font-bold text-[#0066A3]">Grand Total:</span>
                        <span className="font-bold text-[#0066A3]">₹ {formatINR(totalsInvoice.totalGrand)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow hover:opacity-90 transition-opacity font-semibold"
                  >
                    Save {inv.type === 'sale' ? 'Invoice' : 'Purchase Bill'}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Invoices Sidebar */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Activity</h3>
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1 text-sm">
                {invoices.length === 0 ? (
                  <p className="text-sm text-gray-500">No invoices or bills created yet.</p>
                ) : (
                  invoices.slice(0, 10).map((i) => (
                    <div key={i._id} className="rounded-xl border p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${i.type === "sale" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {i.type === "sale" ? "Sale" : "Purchase"}
                        </span>
                        <PaymentStatusBadge status={i.paymentStatus} />
                      </div>
                      <div className="font-medium text-gray-800">{i.customerName}</div>
                      <div className="mt-1 font-semibold text-[#003B6F]">Total: ₹ {formatINR(i.totalGrand)}</div>
                      {i.paymentStatus !== 'paid' && (
                          <div className="text-xs text-red-600 font-medium">Balance Due: ₹ {formatINR(i.balanceDue)}</div>
                      )}
                      <div className="mt-2 space-x-2">
                        {i.paymentStatus !== 'paid' && (
                             <button
                                className="px-3 py-1 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                                onClick={() => openPaymentModal(i)}
                                title="Record Payment"
                              >
                                Record Payment
                              </button>
                        )}
                        <button
                          className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                          onClick={() => setInvoiceForPdf(i)}
                          title="Download PDF"
                        >
                          PDF
                        </button>
                        <button
                          className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                          onClick={() => deleteInvoice(i)}
                          title="Delete Invoice"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ALL INVOICES / BILLS Tab --- */}
        {activeTab === "allInvoices" && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">All Invoices & Purchase Bills</h2>
               <div className="overflow-x-auto">
                 <table className="min-w-full text-left text-sm">
                   <thead className="bg-[#003B6F] text-white text-xs uppercase">
                   <tr>
                       <th className="px-3 py-2 font-medium">Date</th>
                       <th className="px-3 py-2 font-medium">Type</th>
                       <th className="px-3 py-2 font-medium">Customer/Supplier</th>
                       <th className="px-3 py-2 font-medium text-center">Status</th>
                       <th className="px-3 py-2 font-medium text-right">Total (₹)</th>
                       <th className="px-3 py-2 font-medium text-right">Balance Due (₹)</th>
                       <th className="px-3 py-2 font-medium text-center">Actions</th>
                   </tr>
                   </thead>
                   <tbody>
                   {invoices.length === 0 ? (
                       <tr>
                         <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                           No invoices or bills found.
                         </td>
                       </tr>
                   ) : (
                       invoices.map((i) => (
                         <tr key={i._id} className="border-t hover:bg-gray-50">
                           <td className="px-3 py-2">{i.date}</td>
                           <td className="px-3 py-2">
                             <span className={`text-xs px-2 py-0.5 rounded font-medium ${i.type === "sale" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                               {i.type === "sale" ? "Sale" : "Purchase"}
                             </span>
                           </td>
                           <td className="px-3 py-2 font-medium">{i.customerName}</td>
                           <td className="px-3 py-2 text-center"><PaymentStatusBadge status={i.paymentStatus} /></td>
                           <td className="px-3 py-2 text-right font-semibold text-[#003B6F]">₹ {formatINR(i.totalGrand)}</td>
                           <td className="px-3 py-2 text-right font-medium text-red-600">₹ {formatINR(i.balanceDue)}</td>
                           <td className="px-3 py-2 text-center space-x-2 whitespace-nowrap">
                            {i.paymentStatus !== 'paid' && (
                                <button
                                    className="px-2 py-1 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                                    onClick={() => openPaymentModal(i)}
                                    title="Record Payment"
                                >
                                    Pay
                                </button>
                            )}
                             <button
                               className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                               onClick={() => setInvoiceForPdf(i)}
                               title="Download PDF"
                             >
                               PDF
                             </button>
                             <button
                               className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                               onClick={() => deleteInvoice(i)}
                               title="Delete Invoice"
                             >
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

        {/* --- MANAGE PRODUCTS Tab --- */}
        {activeTab === "products" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-semibold text-gray-800">Manage Products</h2>
              <button
                onClick={openAddProduct}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white hover:opacity-90 transition-opacity text-sm font-semibold"
              >
                + Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#003B6F] text-white text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">SKU / Barcode</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium text-right">Unit Price (₹)</th>
                    <th className="px-3 py-2 font-medium text-center">GST %</th>
                    <th className="px-3 py-2 font-medium text-center">Stock</th>
                    <th className="px-3 py-2 font-medium text-center">Low Stock</th>
                    <th className="px-3 py-2 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                        No products added yet.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p._id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 flex items-center gap-3">
                          {p.image ? <img src={p.image} alt={p.name} className="h-10 w-10 object-cover rounded-md flex-shrink-0" /> : <div className="h-10 w-10 bg-gray-100 rounded-md flex-shrink-0" />}
                          <span className="font-medium">{p.name}</span>
                        </td>
                         <td className="px-3 py-2 align-middle">
                           {p.sku ? <Barcode value={p.sku} /> : <span className="text-xs text-gray-400">Not Set</span>}
                         </td>
                        <td className="px-3 py-2 align-middle">{p.category || "—"}</td>
                        <td className="px-3 py-2 text-right align-middle">₹ {formatINR(p.unitPrice)}</td>
                        <td className="px-3 py-2 text-center align-middle">{p.gstRate ?? 18}%</td>
                        <td className="px-3 py-2 text-center align-middle font-medium">{p.stock}</td>
                        <td className="px-3 py-2 text-center align-middle">{p.lowStock ?? 5}</td>
                        <td className="px-3 py-2 text-center align-middle space-x-2 whitespace-nowrap">
                           <button className="text-gray-600 hover:underline text-xs" onClick={() => setViewProduct(p)}>
                             View
                           </button>
                          <button className="text-[#0066A3] hover:underline text-xs" onClick={() => openEditProduct(p)}>
                            Edit
                          </button>
                          <button className="text-red-600 hover:underline text-xs" onClick={() => deleteProduct(p._id)}>
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

        {/* --- MANAGE SUPPLIERS Tab --- */}
        {activeTab === "suppliers" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-semibold text-gray-800">Manage Suppliers</h2>
              <button
                onClick={openAddSupplier}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white hover:opacity-90 transition-opacity text-sm font-semibold"
              >
                + Add Supplier
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#003B6F] text-white text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Supplier Name</th>
                    <th className="px-3 py-2 font-medium">Contact Person</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                        No suppliers added yet.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s._id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{s.name}</td>
                        <td className="px-3 py-2">{s.contactPerson || "—"}</td>
                        <td className="px-3 py-2">{s.phone || "—"}</td>
                        <td className="px-3 py-2">{s.email || "—"}</td>
                        <td className="px-3 py-2 text-center space-x-2 whitespace-nowrap">
                           <button className="text-gray-600 hover:underline text-xs" onClick={() => setViewSupplier(s)}>
                            View
                           </button>
                          <button className="text-[#0066A3] hover:underline text-xs" onClick={() => openEditSupplier(s)}>
                            Edit
                          </button>
                          <button className="text-red-600 hover:underline text-xs" onClick={() => deleteSupplier(s._id)}>
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

        {/* --- STOCK TRACKING Tab --- */}
        {activeTab === "stock" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-semibold text-gray-800">Stock Tracking</h2>
              <input
                type="text"
                placeholder="Search by Product Name or SKU"
                className="border rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#66B2FF] outline-none text-sm w-full sm:w-64"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#003B6F] text-white text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium text-center">Current Stock</th>
                    <th className="px-3 py-2 font-medium text-center">Low Stock Level</th>
                    <th className="px-3 py-2 font-medium text-right">Unit Price (₹)</th>
                    <th className="px-3 py-2 font-medium text-right">Stock Value (₹)</th>
                    <th className="px-3 py-2 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter((p) =>
                        p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                        (p.sku && p.sku.toLowerCase().includes(stockSearch.toLowerCase()))
                    )
                    .map((p) => {
                      const isLow = p.stock <= (p.lowStock ?? 5);
                      const stockValue = p.unitPrice * p.stock;
                      return (
                        <tr key={p._id} className={`border-t hover:bg-gray-50 ${isLow ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2 font-medium">{p.name}</td>
                          <td className="px-3 py-2 text-gray-600">{p.sku || "—"}</td>
                          <td className="px-3 py-2 text-gray-600">{p.category || "—"}</td>
                          <td className={`px-3 py-2 text-center font-semibold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{p.stock}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{p.lowStock ?? 5}</td>
                          <td className="px-3 py-2 text-right">₹ {formatINR(p.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-medium">₹ {formatINR(stockValue)}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                              {isLow ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                   {products.filter(p => p.name.toLowerCase().includes(stockSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(stockSearch.toLowerCase()))).length === 0 && (
                    <tr><td colSpan={8} className="text-center py-4 text-gray-500">No products match your search.</td></tr>
                   )}
                </tbody>
              </table>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Entries</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#003B6F] text-white text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Note</th>
                      <th className="px-3 py-2 font-medium text-right">Amount (₹)</th>
                      <th className="px-3 py-2 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flowsFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                          No income or expense entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      flowsFiltered.sort((a, b) => new Date(b.date) - new Date(a.date)).map((f) => (
                        <tr key={f._id} className="border-t hover:bg-gray-50">
                          <td className="px-3 py-2">{f.date}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${f.kind === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {f.kind === "income" ? "Income" : "Expense"}
                            </span>
                          </td>
                          <td className="px-3 py-2">{f.category || "—"}</td>
                          <td className="px-3 py-2 text-gray-600">{f.note || "—"}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${f.kind === 'income' ? 'text-green-600' : 'text-red-600'}`}>₹ {formatINR(f.amount)}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => deleteCashflow(f._id)} className="text-red-500 hover:text-red-700 text-xs font-medium" title="Delete Entry">Delete</button>
                          </td>
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

      {/* --- MODALS --- */}

      {/* NEW: Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-8">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
              <div className="text-lg font-semibold">Add New Customer</div>
            </div>
            <form onSubmit={handleAddNewCustomerSubmit} className="p-6 space-y-4">
              <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    required
                  />
              </div>
               <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                  />
              </div>
              <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                     placeholder="e.g. contact@example.com"
                  />
              </div>
               <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                  <textarea
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                    rows="3"
                    placeholder="Customer's full address"
                  ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                <button type="button" onClick={() => setShowAddCustomerModal(false)} className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow text-sm font-medium hover:opacity-90">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-8">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
              <div className="text-lg font-semibold">Add Item to {inv.type === 'sale' ? 'Invoice' : 'Bill'}</div>
            </div>
            <form onSubmit={handleAddItemSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Product</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm bg-white"
                  value={itemForm.productId}
                  onChange={(e) => setItemForm({ ...itemForm, productId: e.target.value })}
                  required
                >
                  <option value="">— Select Product —</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Quantity</label>
                  <input type="number" min="0.001" step="any" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" value={itemForm.qty} onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })} required />
                </div>
                <div>
                   <label className="text-sm font-medium text-gray-700 block mb-1">Price (₹)</label>
                  <input type="number" step="0.01" min="0" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} required />
                </div>
                <div>
                   <label className="text-sm font-medium text-gray-700 block mb-1">GST %</label>
                  <input type="number" step="0.01" min="0" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm" value={itemForm.gstRate} onChange={(e) => setItemForm({ ...itemForm, gstRate: e.target.value })} required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                <button type="button" onClick={() => setShowAddItemModal(false)} className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow text-sm font-medium hover:opacity-90">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* Record Payment Modal */}
       {showPaymentModal && paymentForInvoice && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-xl my-8">
                    <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
                        <div className="text-lg font-semibold">Record Payment</div>
                        <p className="text-sm text-white/80">For {paymentForInvoice.customerName}</p>
                    </div>
                    <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                        <div className="text-center">
                            <label className="text-sm text-gray-500">Balance Due</label>
                            <p className="text-3xl font-bold text-red-600">₹ {formatINR(paymentForInvoice.balanceDue)}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Amount to Pay *</label>
                            <input
                                type="number" step="0.01" min="0.01" max={paymentForInvoice.balanceDue?.toFixed(2)}
                                className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-lg"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Payment Date *</label>
                                <input
                                    type="date"
                                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                                    value={paymentForm.date}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Payment Method</label>
                                <select
                                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm bg-white"
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                >
                                    <option>Cash</option>
                                    <option>Bank Transfer</option>
                                    <option>UPI</option>
                                    <option>Cheque</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                            <input
                                type="text"
                                placeholder="Optional (e.g., transaction ID)"
                                className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                                value={paymentForm.note}
                                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                            <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow text-sm font-medium hover:opacity-90">Save Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      {/* Add/Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl my-8">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
              <div className="text-lg font-semibold">{editId ? "Edit Product" : "Add New Product"}</div>
            </div>
            <form onSubmit={submitProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Product Name *</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">SKU / Barcode</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                     placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Unit Price (₹) *</label>
                  <input
                    type="number" step="0.01" min="0"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={prodForm.unitPrice}
                    onChange={(e) => setProdForm({ ...prodForm, unitPrice: e.target.value })}
                    required
                  />
                </div>
                 <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">GST %</label>
                  <input
                    type="number" step="0.01" min="0"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={prodForm.gstRate}
                     placeholder="Default 18"
                    onChange={(e) => setProdForm({ ...prodForm, gstRate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Opening Stock</label>
                  <input
                    type="number" min="0" step="any"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={prodForm.stock}
                     placeholder="Default 0"
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Low Stock Alert Level</label>
                  <input
                    type="number" min="0" step="any"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={prodForm.lowStock}
                     placeholder="Default 5"
                    onChange={(e) => setProdForm({ ...prodForm, lowStock: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Product Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {prodForm.image && <img src={prodForm.image} alt="Preview" className="mt-3 h-24 w-24 object-cover rounded-lg border p-1" />}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow text-sm font-medium hover:opacity-90"
                >
                  {editId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl my-8">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white">
              <div className="text-lg font-semibold">{editSupplierId ? "Edit Supplier" : "Add New Supplier"}</div>
            </div>
            <form onSubmit={submitSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Supplier Name *</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={suppForm.name}
                    onChange={(e) => setSuppForm({ ...suppForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Contact Person</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={suppForm.contactPerson}
                    placeholder="Optional"
                    onChange={(e) => setSuppForm({ ...suppForm, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={suppForm.phone}
                    placeholder="Optional"
                    onChange={(e) => setSuppForm({ ...suppForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#66B2FF] outline-none text-sm"
                    value={suppForm.email}
                     placeholder="Optional"
                    onChange={(e) => setSuppForm({ ...suppForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                   className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] text-white shadow text-sm font-medium hover:opacity-90"
                >
                  {editSupplierId ? "Save Changes" : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto" onClick={() => setViewProduct(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-8" onClick={e => e.stopPropagation()}>
                <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white flex justify-between items-center">
                    <div className="text-lg font-semibold">Product Details</div>
                    <button onClick={() => setViewProduct(null)} className="text-white/80 hover:text-white">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    {viewProduct.image && <img src={viewProduct.image} alt={viewProduct.name} className="w-32 h-32 object-cover rounded-lg mx-auto border p-1" />}
                    <DetailRow label="Product Name" value={viewProduct.name} />
                    <DetailRow label="Category" value={viewProduct.category} />
                    <DetailRow label="Unit Price" value={`₹ ${formatINR(viewProduct.unitPrice)}`} />
                    <DetailRow label="GST Rate" value={`${viewProduct.gstRate ?? 18}%`} />
                    <DetailRow label="Current Stock" value={viewProduct.stock} highlight />
                    <DetailRow label="Low Stock Level" value={viewProduct.lowStock} />
                    <div className="pt-4">
                        <label className="text-sm font-medium text-gray-700 block mb-1">SKU / Barcode</label>
                        {viewProduct.sku ? <Barcode value={viewProduct.sku} /> : <p className="text-gray-500">Not available</p>}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* View Supplier Modal */}
      {viewSupplier && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto" onClick={() => setViewSupplier(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-8" onClick={e => e.stopPropagation()}>
                <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] via-[#0066A3] to-[#66B2FF] px-6 py-4 text-white flex justify-between items-center">
                    <div className="text-lg font-semibold">Supplier Details</div>
                    <button onClick={() => setViewSupplier(null)} className="text-white/80 hover:text-white">&times;</button>
                </div>
                <div className="p-6 space-y-2">
                    <DetailRow label="Supplier Name" value={viewSupplier.name} />
                    <DetailRow label="Contact Person" value={viewSupplier.contactPerson} />
                    <DetailRow label="Phone Number" value={viewSupplier.phone} />
                    <DetailRow label="Email" value={viewSupplier.email} />
                </div>
            </div>
        </div>
      )}

      {/* PDF Generator Container */}
      {invoiceForPdf && (
          <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, width: '210mm' }}>
           <div id="pdf-generator" style={{ width: '210mm', background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '10pt', padding: '10mm' }}>
             {/* --- MODIFIED: Business Name is now dynamic --- */}
             <h1 style={{ textAlign: 'center', color: '#003B6F', fontSize: '24pt', fontWeight: 'bold', margin: '0 0 5px 0' }}>{businessName}</h1>
             <p style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '9pt' }}>Your Company Address, City, Pincode | GSTIN: YOUR_GSTIN</p>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #003B6F', borderBottom: '2px solid #003B6F', paddingTop: '10px', paddingBottom: '10px', marginBottom: '15px' }}>
               <div>
                 <h3 style={{ margin: '0 0 5px 0', fontSize: '10pt', fontWeight: 'bold' }}>{invoiceForPdf.type === 'sale' ? 'Bill To:' : 'Bill From:'}</h3>
                 <p style={{ margin: '2px 0', fontSize: '9pt', fontWeight: 'bold' }}>{invoiceForPdf.customerName}</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                 <h1 style={{ margin: '0 0 5px 0', color: '#003B6F', fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>{invoiceForPdf.type === 'sale' ? 'Tax Invoice' : 'Purchase Bill'}</h1>
                 <p style={{ margin: '2px 0', fontSize: '9pt' }}><strong>Bill No:</strong> {invoiceForPdf._id}</p>
                 <p style={{ margin: '2px 0', fontSize: '9pt' }}><strong>Date:</strong> {invoiceForPdf.date}</p>
               </div>
             </div>

             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: '9pt', marginBottom: '15px' }}>
               <thead style={{ backgroundColor: '#003B6F', color: 'white' }}>
                 <tr>
                   <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>#</th>
                   <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Product / Service</th>
                   <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Qty</th>
                   <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Price (₹)</th>
                   <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>GST %</th>
                   <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Amount (₹)</th>
                   <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>GST Amt (₹)</th>
                   <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Total (₹)</th>
                 </tr>
               </thead>
               <tbody>
                 {invoiceForPdf.items.map((row, index) => (
                   <tr key={index}>
                     <td style={{ padding: '8px', border: '1px solid #ddd' }}>{index + 1}</td>
                     <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.name}</td>
                     <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{row.qty}</td>
                     <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{formatINR(row.price)}</td>
                     <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{row.gstRate}%</td>
                     <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{formatINR(row.amount)}</td>
                     <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{formatINR(row.gstAmount)}</td>
                     <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{formatINR(row.lineTotal)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{fontSize: '9pt'}}>
                    <strong>Payment Status: </strong>
                    <span style={{fontWeight: 'bold', color: invoiceForPdf.paymentStatus === 'paid' ? 'green' : (invoiceForPdf.paymentStatus === 'partially_paid' ? 'orange' : 'red')}}>
                        {invoiceForPdf.paymentStatus.replace('_', ' ').toUpperCase()}
                    </span>
                    <p style={{ margin: '5px 0' }}><strong>Amount Paid:</strong> ₹ {formatINR(invoiceForPdf.paidAmount)}</p>
                    <p style={{ margin: '5px 0' }}><strong>Balance Due:</strong> ₹ {formatINR(invoiceForPdf.balanceDue)}</p>
                </div>
               <table style={{ fontSize: '10pt', width: '45%' }}>
                   <tbody>
                       <tr>
                           <td style={{ padding: '5px', textAlign: 'right' }}>Sub Total:</td>
                           <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>₹ {formatINR(invoiceForPdf.subtotal)}</td>
                       </tr>
                       <tr>
                           <td style={{ padding: '5px', textAlign: 'right' }}>Total GST:</td>
                           <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>₹ {formatINR(invoiceForPdf.totalGST)}</td>
                       </tr>
                       <tr style={{ backgroundColor: '#003B6F', color: 'white', fontWeight: 'bold', fontSize: '12pt' }}>
                           <td style={{ padding: '8px', textAlign: 'right' }}>Grand Total:</td>
                           <td style={{ padding: '8px', textAlign: 'right' }}>₹ {formatINR(invoiceForPdf.totalGrand)}</td>
                       </tr>
                   </tbody>
               </table>
             </div>

             {invoiceForPdf.note && (
               <div style={{ marginBottom: '15px', fontSize: '9pt', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                 <strong>Notes:</strong> {invoiceForPdf.note}
               </div>
             )}

             <div style={{ borderTop: '2px solid #003B6F', paddingTop: '10px', marginTop: 'auto', fontSize: '8pt', textAlign: 'center' }}>
               <p style={{ margin: '0' }}>Thank you for your business!</p>
               <p style={{ margin: '5px 0 0 0' }}>This is a computer-generated document.</p>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

/* --- Small UI components --- */

const KPI = ({ title, value }) => (
  <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
    <div className="text-xs uppercase tracking-wider opacity-80">{title}</div>
    <div className="text-lg font-bold">₹ {formatINR(value)}</div>
  </div>
);

const SummaryRow = ({ label, value, pos = false, highlight = false }) => (
  <div className={`flex items-center justify-between ${highlight ? "text-[#003B6F] font-semibold text-base" : "text-sm"}`}>
    <span className="text-gray-700">{label}</span>
    <span className={`${pos ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-800"} font-semibold`}>
      ₹ {formatINR(Math.abs(value))}
      {value < 0 ? ' (Cr)' : ''}
    </span>
  </div>
);

const DetailRow = ({ label, value, highlight = false }) => (
    <div className="flex justify-between border-b pb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-sm font-medium ${highlight ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>{value || "N/A"}</span>
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


export default Inventory;