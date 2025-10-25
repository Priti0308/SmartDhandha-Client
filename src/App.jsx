import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import Feedback from "./pages/Feedback";
import Profile from "./pages/Profile";

import Inventory from "./features/Inventory/Inventory";
import Ledger from "./features/Ledger/Ledger";
import Report from "./features/Reports/Reports";
import Visitor from "./features/Visitor/Visitor";
import Customer from "./features/Customer/Customer";
// import AuthContext from "./context/AuthContext";
import PrivateRoute from "./router/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
       <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/feedback" element={<Feedback/>} />
        {/* <Route path="/auth/*" element={<AuthContext />} /> */}

        {/* Protected Routes */}
       
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <Inventory />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer"
          element={
            <PrivateRoute>
              <Customer />
            </PrivateRoute>
          }
        />
        <Route
          path="/ledger"
          element={
            <PrivateRoute>
              <Ledger />
            </PrivateRoute>
          }
        />
        <Route
          path="/report"
          element={
            <PrivateRoute>
              <Report />
            </PrivateRoute>
          }
        />
        <Route
          path="/visitor"
          element={
            <PrivateRoute>
              <Visitor />
            </PrivateRoute>
          }
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
