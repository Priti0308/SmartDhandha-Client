import React, { useState, useEffect } from 'react';
// --- THIS IS THE FIX ---
// Change the import from '../context/AuthContext' to '../services/superAdminService'
import { getSystemStats } from '../services/superAdminService'; 

// Simple card component for display
const StatCard = ({ title, value }) => (
  <div style={{ padding: '20px', margin: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', textAlign: 'center' }}>
    <h3 style={{ margin: 0, color: '#555' }}>{title}</h3>
    <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0 0' }}>{value}</p>
  </div>
);

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getSystemStats(); // This will now call your API
        setStats(data);
        setError(null);
      } catch (err) {
        // Handle potential errors from the API call
        const message = err.response?.data?.message || err.message || 'Failed to fetch stats';
        setError(message);
        console.error("Failed to fetch stats:", message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) return <div>Loading Dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h1>Superadmin Dashboard</h1>
      {stats && (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <StatCard title="Total Users" value={stats.totalUsers} />
          <StatCard title="Total Companies" value={stats.totalCompanies} />
          <StatCard title="Total Employees" value={stats.totalAdmins} />
          {/* Add more StatCards here as you add stats */}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;