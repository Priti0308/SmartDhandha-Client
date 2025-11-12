import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// --- Import Pages ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

// --- Import User Feature Pages ---
import Dashboard from "./pages/Dashboard";
import Inventory from "./features/Inventory/Inventory";
import Ledger from "./features/Ledger/Ledger";
import Report from "./features/Reports/Reports";
import Visitor from "./features/Visitor/Visitor";
import Customer from "./features/Customer/Customer";

// --- Import Superadmin Pages ---
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
// import UserManagementPage from "./pages/UserManagementPage"; // You can add this next

// --- Import Route Protection ---
import PrivateRoute from "./router/PrivateRoute";
import SuperAdminRoute from "./router/SuperAdminRoute"; // <-- IMPORT THE NEW ROUTE

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ================================== */}
          {/* Public Routes              */}
          {/* ================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<Feedback />} />

          {/* ================================== */}
          {/* Regular User Protected Routes    */}
          {/* ================================== */}
          {/* These routes are for 'user' and 'admin' roles */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customer" element={<Customer />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/report" element={<Report />} />
            <Route path="/visitor" element={<Visitor />} />
          </Route>

          {/* ================================== */}
          {/* Superadmin Protected Routes    */}
          {/* ================================== */}
          {/* These routes are ONLY for the 'superadmin' role */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
            {/* <Route path="/superadmin/users" element={<UserManagementPage />} /> */}
          </Route>

          {/* ================================== */}
          {/* 404 Page                 */}
          {/* ================================== */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;