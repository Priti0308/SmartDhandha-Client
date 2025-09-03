// src/pages/Visitor.jsx
import React, { useState } from "react";
import { Download, UserPlus, LogIn, LogOut, Bell, AlertCircle, User } from "lucide-react";

const Visitor = () => {
  // For pass-based visitors
  const [visitors, setVisitors] = useState([
    { id: "VST1001", name: "Ravi Sharma", company: "TechCorp", purpose: "Meeting", status: "Inside" },
    { id: "VST1002", name: "Anita Singh", company: "HealthPlus", purpose: "Delivery", status: "Exited" },
  ]);

  // For registered users (signed up/logged in)
  const [registeredUsers, setRegisteredUsers] = useState([
    { id: "USR1001", name: "Arjun Mehta", email: "arjun@demo.com", status: "Active" },
    { id: "USR1002", name: "Priya Kapoor", email: "priya@demo.com", status: "Inactive" },
  ]);

  const [alerts, setAlerts] = useState([]);

  const [newVisitor, setNewVisitor] = useState({ name: "", company: "", purpose: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });

  // Add new visitor (pass system)
  const handleAddVisitor = (e) => {
    e.preventDefault();
    const passId = `VST${Math.floor(1000 + Math.random() * 9000)}`;
    const visitorObj = { id: passId, ...newVisitor, status: "Inside" };
    setVisitors([...visitors, visitorObj]);
    setAlerts([{ id: Date.now(), type: "info", message: `Visitor ${newVisitor.name} entered premises.` }, ...alerts]);
    setNewVisitor({ name: "", company: "", purpose: "" });
    alert(`Visitor Pass Generated: ${passId}`);
  };

  // Toggle visitor entry/exit
  const toggleStatus = (id) => {
    setVisitors(
      visitors.map((v) =>
        v.id === id ? { ...v, status: v.status === "Inside" ? "Exited" : "Inside" } : v
      )
    );
    const toggledVisitor = visitors.find((v) => v.id === id);
    if (toggledVisitor) {
      setAlerts([
        {
          id: Date.now(),
          type: toggledVisitor.status === "Inside" ? "warning" : "info",
          message: `Visitor ${toggledVisitor.name} ${toggledVisitor.status === "Inside" ? "exited" : "entered"} premises.`,
        },
        ...alerts,
      ]);
    }
  };

  // Register new user
  const handleRegister = (e) => {
    e.preventDefault();
    const userId = `USR${Math.floor(1000 + Math.random() * 9000)}`;
    setRegisteredUsers([...registeredUsers, { id: userId, ...newUser, status: "Active" }]);
    setNewUser({ name: "", email: "", password: "" });
    alert("User Registered Successfully!");
  };

  // Toggle user active/inactive
  const toggleUserStatus = (id) => {
    setRegisteredUsers(
      registeredUsers.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#001B48] via-[#02457A] to-[#018ABE] p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Visitor Management</h1>
        <p className="text-sm opacity-90">Generate passes, track entry/exit, register users & receive alerts</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/90 rounded-2xl shadow-lg p-4 text-center">
            <h2 className="text-lg font-semibold text-[#001B48]">Total Visitors</h2>
            <p className="text-2xl font-bold">{visitors.length}</p>
          </div>
          <div className="bg-white/90 rounded-2xl shadow-lg p-4 text-center">
            <h2 className="text-lg font-semibold text-[#02457A]">Inside Premises</h2>
            <p className="text-2xl font-bold">{visitors.filter((v) => v.status === "Inside").length}</p>
          </div>
          <div className="bg-white/90 rounded-2xl shadow-lg p-4 text-center">
            <h2 className="text-lg font-semibold text-[#018ABE]">Exited</h2>
            <p className="text-2xl font-bold">{visitors.filter((v) => v.status === "Exited").length}</p>
          </div>
          <div className="bg-gradient-to-r from-[#018ABE] to-[#02457A] rounded-2xl shadow-lg p-4 text-center text-white flex items-center justify-center gap-2">
            <Bell /> Alerts Active
          </div>
        </div>

        {/* Add Visitor Pass */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#001B48] mb-4 flex items-center gap-2">
            <UserPlus className="text-[#018ABE]" /> Generate Visitor Pass
          </h2>
          <form onSubmit={handleAddVisitor} className="grid md:grid-cols-3 gap-4">
            <input type="text" placeholder="Visitor Name" className="p-2 border rounded-lg focus:ring-2 focus:ring-[#018ABE]" value={newVisitor.name} onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })} required />
            <input type="text" placeholder="Company/Org" className="p-2 border rounded-lg focus:ring-2 focus:ring-[#018ABE]" value={newVisitor.company} onChange={(e) => setNewVisitor({ ...newVisitor, company: e.target.value })} required />
            <input type="text" placeholder="Purpose of Visit" className="p-2 border rounded-lg focus:ring-2 focus:ring-[#018ABE]" value={newVisitor.purpose} onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })} required />
            <button type="submit" className="bg-gradient-to-r from-[#018ABE] to-[#02457A] text-white px-4 py-2 rounded-lg hover:opacity-90 transition">Generate Pass</button>
          </form>
        </div>

        {/* Register New User */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#001B48] mb-4 flex items-center gap-2">
            <User className="text-[#02457A]" /> Register New Visitor
          </h2>
          <form onSubmit={handleRegister} className="grid md:grid-cols-3 gap-4">
            <input type="text" placeholder="Full Name" className="p-2 border rounded-lg focus:ring-2 focus:ring-[#018ABE]" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
            <input type="email" placeholder="Email" className="p-2 border rounded-lg focus:ring-2 focus:ring-[#018ABE]" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
            <input type="password" placeholder="Password" className="p-2 border rounded-lg focus:ring-2 focus:ring-[#018ABE]" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            <button type="submit" className="bg-gradient-to-r from-[#001B48] to-[#018ABE] text-white px-4 py-2 rounded-lg hover:opacity-90 transition">Register</button>
          </form>
        </div>

        {/* Registered Visitors */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#001B48]">Registered Visitors</h2>
            <button className="flex items-center gap-2 bg-gradient-to-r from-[#02457A] to-[#018ABE] text-white px-4 py-2 rounded-lg hover:opacity-90 transition">
              <Download size={18} /> Export CSV
            </button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#001B48] to-[#02457A] text-white">
                <th className="border p-2">User ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {registeredUsers.map((u) => (
                <tr key={u.id} className="text-center hover:bg-[#D6E8EE]">
                  <td className="border p-2">{u.id}</td>
                  <td className="border p-2">{u.name}</td>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${u.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.status}</span>
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-white transition ${
                        u.status === "Active"
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : "bg-gradient-to-r from-green-500 to-green-600"
                      }`}
                    >
                      {u.status === "Active" ? <LogOut size={16} /> : <LogIn size={16} />}
                      {u.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#001B48] mb-4 flex items-center gap-2">
            <AlertCircle className="text-[#02457A]" /> Recent Alerts
          </h2>
          {alerts.length === 0 ? (
            <p className="text-gray-500">No alerts yet.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    alert.type === "warning" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                  }`}
                >
                  <Bell size={16} /> {alert.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visitor;
