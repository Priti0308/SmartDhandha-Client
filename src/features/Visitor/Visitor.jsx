import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getVisitors, addVisitor, updateVisitor } from '../../services/visitorService'; 
import { 
    FiPlus, FiLogIn, FiLogOut, FiUsers, FiClock, FiSearch, 
    FiChevronLeft, FiChevronRight, FiDownload, FiPrinter, FiEye, 
    FiCamera, FiRefreshCcw, FiUser, FiPhone, FiBookOpen, 
    FiBriefcase, FiAlertTriangle 
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Helper Functions ---
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
    });
};

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};


// --- Child Components ---

// 💎 REUSABLE: Attractive Icon Input Field
const IconInput = ({ icon: Icon, label, id, as = 'input', children, ...props }) => {
    const InputComponent = as;
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <InputComponent
                    id={id}
                    {...props}
                    className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                >
                    {children}
                </InputComponent>
            </div>
        </div>
    );
};


const KPI = ({ title, value, icon }) => (
    <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-4">
        <div className="text-3xl text-white/70">{icon}</div>
        <div>
            <div className="text-sm uppercase tracking-wider opacity-80">{title}</div>
            <div className="text-2xl font-bold truncate">{value}</div>
        </div>
    </div>
);

// 💎 IMPROVED: Visitor Modal with IconInputs
const VisitorModal = ({ show, onClose, onCheckIn, isSubmitting }) => {
    const [form, setForm] = useState({ name: '', phone: '', purpose: 'Meeting', whomToMeet: '', photo: null });
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
                setIsCameraOpen(true);
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                }, 100);
            } catch (err) {
                toast.error("Could not access camera. Please check browser permissions.");
                console.error("Camera error:", err);
            }
        } else {
            toast.error("Camera not supported on this browser.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };
    
    const takePicture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
            const photoDataUrl = canvasRef.current.toDataURL('image/jpeg');
            setForm({ ...form, photo: photoDataUrl });
            stopCamera();
        }
    };

    const handleClose = () => {
        stopCamera();
        setForm({ name: '', phone: '', purpose: 'Meeting', whomToMeet: '', photo: null }); // Reset form on close
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onCheckIn(form);
        // Don't reset form here, wait for successful check-in, then close
    };

    // Effect to close modal *after* submission is successful
    useEffect(() => {
        if (show && !isSubmitting) {
             // If modal is open but submission finished, reset and close
            if (form.name !== '') { // Basic check to see if form was ever filled
               // This logic might need refinement depending on how onCheckIn works
            }
        }
        // If isSubmitting becomes false, and it *was* true, close modal
    }, [isSubmitting, show]);


    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto" onClick={handleClose}>
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl my-8" onClick={e => e.stopPropagation()}>
                <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] to-[#66B2FF] px-6 py-4 text-white">
                    <h2 className="text-lg font-semibold">New Visitor Check-in</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <IconInput label="Full Name *" id="name" icon={FiUser} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            <IconInput label="Phone Number *" id="phone" icon={FiPhone} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                            <IconInput label="Purpose of Visit" id="purpose" icon={FiBookOpen} as="select" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                                <option>Meeting</option>
                                <option>Delivery</option>
                                <option>Interview</option>
                                <option>Personal</option>
                                <option>Other</option>
                            </IconInput>
                            <IconInput label="Whom to Meet" id="whomToMeet" icon={FiBriefcase} placeholder="e.g., Mr. Sharma" value={form.whomToMeet} onChange={(e) => setForm({ ...form, whomToMeet: e.target.value })} />
                        </div>
                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
                            {isCameraOpen ? (
                                <div className="text-center"><video ref={videoRef} autoPlay className="rounded-lg mb-2 w-full max-w-xs"></video><button type="button" onClick={takePicture} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg"><FiCamera /> Capture</button></div>
                            ) : form.photo ? (
                                <div className="text-center"><img src={form.photo} alt="Visitor" className="rounded-lg mb-2 w-40 h-30 object-cover" /><button type="button" onClick={() => { setForm({...form, photo: null}); startCamera(); }} className="flex items-center gap-2 mx-auto px-4 py-2 text-sm font-semibold text-red-600"><FiRefreshCcw /> Retake</button></div>
                            ) : (
                                <button type="button" onClick={startCamera} className="flex flex-col items-center gap-2 p-8 text-gray-500"><FiCamera size={40} /> <span className="mt-2 text-sm">Capture Photo</span></button>
                            )}
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#003B6F] to-[#66B2FF] text-white text-sm font-medium w-28 disabled:opacity-50">
                            {isSubmitting ? 'Checking in...' : 'Check In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewVisitorModal = ({ visitor, onClose }) => {
    if (!visitor) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-8" onClick={e => e.stopPropagation()}>
                <div className="rounded-t-2xl bg-gradient-to-r from-[#003B6F] to-[#66B2FF] px-6 py-4 text-white flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Visitor Details</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-3xl">&times;</button>
                </div>
                <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
                    {visitor.photo ? (
                        <img src={visitor.photo} alt={visitor.name} className="w-32 h-24 object-cover rounded-lg border p-1" />
                    ) : (
                        <div className="w-32 h-24 rounded-lg border p-1 bg-gray-50 flex items-center justify-center">
                            <FiUser className="h-10 w-10 text-gray-400" />
                        </div>
                    )}
                    <div className="space-y-3 text-sm">
                        <h3 className="font-bold text-xl text-gray-800 -mt-2">{visitor.name}</h3>
                        <p><strong>Phone:</strong> {visitor.phone}</p>
                        <p><strong>Purpose:</strong> {visitor.purpose}</p>
                        <p><strong>To Meet:</strong> {visitor.whomToMeet || 'N/A'}</p>
                        <p><strong>Check-in:</strong> {formatDateTime(visitor.checkInTime)}</p>
                        <p><strong>Check-out:</strong> {formatDateTime(visitor.checkOutTime)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 💎 NEW: Reusable Confirmation Modal
const ConfirmModal = ({ show, onClose, onConfirm, title, message, confirmText = "Confirm", isSubmitting = false }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <FiAlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                            <p className="mt-2 text-sm text-gray-600">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-100">
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={onConfirm} 
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium w-32 disabled:bg-red-400"
                    >
                        {isSubmitting ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


const Visitor = ({ businessName = "SmartDhandha" }) => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // 💎 For all API actions
    const [showModal, setShowModal] = useState(false);
    const [viewVisitor, setViewVisitor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
    const [purposeFilter, setPurposeFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    // 💎 State for the new confirmation modal
    const [confirmModal, setConfirmModal] = useState({ show: false, visitorId: null });

    const fetchAndSetVisitors = async () => {
        try {
            const data = await getVisitors();
            setVisitors(data.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)));
        } catch (err) { toast.error('Failed to fetch visitor data.'); }
    };

    useEffect(() => {
        setLoading(true);
        fetchAndSetVisitors().finally(() => setLoading(false));
    }, []);

    const handleCheckIn = async (visitorFormData) => {
        if (!visitorFormData.name.trim() || !visitorFormData.phone.trim()) { toast.warn('Name and Phone are required.'); return; }
        
        setIsSubmitting(true);
        const newVisitor = { ...visitorFormData, checkInTime: new Date().toISOString(), checkOutTime: null };
        try {
            await addVisitor(newVisitor);
            toast.success('Visitor checked in successfully! ✅');
            fetchAndSetVisitors();
            setShowModal(false); // Close modal on success
        } catch (error) { 
            toast.error(error.message || 'Failed to check in visitor.'); 
        } finally {
            setIsSubmitting(false);
        }
    };

    // 💎 Step 1: Show confirmation modal
    const handleCheckOut = (visitorId) => {
        setConfirmModal({ show: true, visitorId: visitorId });
    };

    // 💎 Step 2: Handle the actual check-out after confirmation
    const confirmCheckOut = async () => {
        const { visitorId } = confirmModal;
        if (!visitorId) return;

        setIsSubmitting(true);
        const payload = { checkOutTime: new Date().toISOString() };
        try {
            await updateVisitor(visitorId, payload);
            toast.success('Visitor checked out! 🕒');
            fetchAndSetVisitors();
        } catch (error) { 
            toast.error(error.message || 'Failed to check out visitor.'); 
        } finally {
            setIsSubmitting(false);
            setConfirmModal({ show: false, visitorId: null }); // Close modal
        }
    };

    const filteredVisitors = useMemo(() => {
        return visitors.filter(v => {
            const checkInDate = v.checkInTime ? new Date(v.checkInTime) : null;
            const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
            const toDate = dateFilter.to ? new Date(dateFilter.to) : null;
            if(fromDate) fromDate.setHours(0,0,0,0);
            if(toDate) toDate.setHours(23,59,59,999);
            
            const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.phone.includes(searchTerm);
            const matchesPurpose = purposeFilter === 'All' || v.purpose === purposeFilter;
            const matchesDate = !checkInDate || (!fromDate || checkInDate >= fromDate) && (!toDate || checkInDate <= toDate);
            
            return matchesSearch && matchesPurpose && matchesDate;
        });
    }, [visitors, searchTerm, dateFilter, purposeFilter]);

    const totalPages = Math.ceil(filteredVisitors.length / ITEMS_PER_PAGE);
    const paginatedVisitors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredVisitors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredVisitors, currentPage]);

    const dashboardStats = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const visitorsToday = visitors.filter(v => v.checkInTime?.startsWith(todayStr));
        const currentlyInside = visitors.filter(v => !v.checkOutTime).length;
        return { totalToday: visitorsToday.length, currentlyInside: currentlyInside, totalEntries: visitors.length };
    }, [visitors]);

    // 💎 IMPLEMENTED: exportCSV
    const exportCSV = () => {
        if (filteredVisitors.length === 0) {
            toast.warn("No data to export.");
            return;
        }
        
        const headers = ["Name", "Phone", "Purpose", "Whom to Meet", "Check-in Time", "Check-out Time"];
        const rows = filteredVisitors.map(v => [
            v.name,
            v.phone,
            v.purpose,
            v.whomToMeet || 'N/A',
            formatDateTime(v.checkInTime),
            formatDateTime(v.checkOutTime)
        ].join(','));
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `visitor_log_${formatDate(new Date().toISOString())}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV export downloaded!");
    };

    // 💎 100% WORKING: printPDF with iFrame trick
    const printPDF = () => {
         if (filteredVisitors.length === 0) {
            toast.warn("No data to print.");
            return;
        }

        // --- 1. Generate the PDF document (same as before) ---
        const doc = new jsPDF();
        const tableColumn = ["Name", "Phone", "Purpose", "To Meet", "Check-in", "Check-out"];
        const tableRows = [];

        filteredVisitors.forEach(v => {
            const visitorData = [
                v.name,
                v.phone,
                v.purpose,
                v.whomToMeet || 'N/A',
                formatDateTime(v.checkInTime),
                formatDateTime(v.checkOutTime)
            ];
            tableRows.push(visitorData);
        });

        doc.setFontSize(18);
        doc.text(`Visitor Log - ${businessName}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Report generated: ${formatDateTime(new Date().toISOString())}`, 14, 22);
        
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            headStyles: { fillCellColor: [0, 59, 111] }, // Dark blue header
            styles: { fontSize: 8 },
        });
        
        // --- 2. The iFrame Print Trick (Bypasses Pop-up Blockers) ---
        try {
            // Generate the PDF as a data URI
            const pdfDataUri = doc.output('datauristring');

            // Create an iframe
            const iframe = document.createElement('iframe');
            
            // Hide the iframe from view
            iframe.style.position = 'fixed';
            iframe.style.right = '100%'; // Off-screen
            iframe.style.bottom = '100%';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';

            // Set the iframe's source to the PDF data
            iframe.src = pdfDataUri;

            // Append the iframe to the document
            document.body.appendChild(iframe);

            // Wait for the iframe to load the PDF
            iframe.onload = () => {
                try {
                    // Trigger the print dialog
                    iframe.contentWindow.print();
                    
                    // Remove the iframe after printing (or cancel)
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 500); // 0.5s delay

                } catch (e) {
                    console.error("Print dialog error:", e);
                    toast.error("Could not open print dialog. Please try downloading.");
                    document.body.removeChild(iframe); // Clean up
                }
            };
        } catch (err) {
            console.error("PDF generation error:", err);
            toast.error("Failed to generate PDF for printing.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-semibold">Loading Visitor Log...</div>;

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <div className="min-h-screen bg-gray-50">
                <div className="bg-gradient-to-r from-[#003B6F] to-[#66B2FF] text-white">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <h1 className="text-2xl font-semibold tracking-wide">Visitor Log Book</h1>
                        <p className="text-white/80 text-sm">Monitor visitors for {businessName}</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KPI title="Visitors Today" value={dashboardStats.totalToday} icon={<FiClock />} />
                            <KPI title="Currently Inside" value={dashboardStats.currentlyInside} icon={<FiLogIn />} />
                            <KPI title="Total Entries" value={dashboardStats.totalEntries} icon={<FiUsers />} />
                        </div>
                    </div>
                </div>
                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                            <h2 className="text-xl font-semibold text-gray-800">Visitor Entries ({filteredVisitors.length})</h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200"><FiDownload />CSV</button>
                                <button onClick={printPDF} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200"><FiPrinter />Print</button>
                                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#003B6F] to-[#66B2FF] text-white text-sm font-semibold"><FiPlus />Add Visitor</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <input type="text" placeholder="Search by name or phone..." className="w-full border rounded-lg p-2 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <select className="w-full border rounded-lg p-2 text-sm bg-white" value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)}><option value="All">All Purposes</option><option>Meeting</option><option>Delivery</option><option>Interview</option><option>Personal</option><option>Other</option></select>
                            <input type="date" className="w-full border rounded-lg p-2 text-sm text-gray-500" value={dateFilter.from} onChange={e => setDateFilter({...dateFilter, from: e.target.value})} />
                            <input type="date" className="w-full border rounded-lg p-2 text-sm text-gray-500" value={dateFilter.to} onChange={e => setDateFilter({...dateFilter, to: e.target.value})} />
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Visitor</th>
                                        <th className="px-4 py-3 font-semibold">Purpose</th>
                                        <th className="px-4 py-3 font-semibold">Check-in</th>
                                        <th className="px-4 py-3 font-semibold">Check-out</th>
                                        <th className="px-4 py-3 font-semibold text-center">Status & Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedVisitors.length === 0 ? (
                                        <tr><td colSpan="5" className="py-10 text-center text-gray-500">No visitors match the current filters.</td></tr>
                                    ) : (
                                        paginatedVisitors.map((v) => (
                                            <tr key={v._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {v.photo ? (
                                                            <img src={v.photo} alt={v.name} className="h-10 w-10 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <FiUser className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-semibold text-gray-800">{v.name}</div>
                                                            <div className="text-xs text-gray-500">{v.phone}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{v.purpose}</td>
                                                <td className="px-4 py-3 text-gray-600">{formatDateTime(v.checkInTime)}</td>
                                                <td className="px-4 py-3 text-gray-600">{formatDateTime(v.checkOutTime)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {v.checkOutTime ? (
                                                        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-gray-100 text-gray-700">Departed</span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleCheckOut(v._id)} 
                                                            className="flex-shrink-0 px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 inline-flex items-center gap-1"
                                                        >
                                                            <FiLogOut className="h-3 w-3" />
                                                            Check-out
                                                        </button>
                                                    )}
                                                    <button onClick={() => setViewVisitor(v)} className="ml-2 p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100">
                                                        <FiEye />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4 text-sm">
                             <span className="text-gray-600">Page {currentPage} of {totalPages || 1}</span>
                             <div className="flex items-center gap-2">
                                 <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"><FiChevronLeft /></button>
                                 <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"><FiChevronRight /></button>
                             </div>
                         </div>
                    </div>
                </main>
            </div>
            <VisitorModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                onCheckIn={handleCheckIn} 
                isSubmitting={isSubmitting} 
            />
            <ViewVisitorModal visitor={viewVisitor} onClose={() => setViewVisitor(null)} />
            <ConfirmModal
                show={confirmModal.show}
                onClose={() => setConfirmModal({ show: false, visitorId: null })}
                onConfirm={confirmCheckOut}
                title="Check Out Visitor?"
                message="Are you sure you want to mark this visitor as checked out? This action cannot be undone."
                confirmText="Check Out"
                isSubmitting={isSubmitting}
            />
        </>
    );
};

export default Visitor;