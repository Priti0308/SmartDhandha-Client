import React, { useState, useEffect, useMemo } from 'react';
import { getSystemStats, getAllUsers, approveUser, deleteUser, updateMySettings } from '../services/superAdminService'; // <-- Make sure to import updateMySettings
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FiUsers, FiClock, FiCheckCircle, FiCheck, FiMail, FiLogOut, FiSettings, FiTrash2,
    FiSave, FiChevronLeft 
} from 'react-icons/fi';

//=================================================================
// ## COMPONENT 1: THE DASHBOARD
//=================================================================

// --- StatCard Component (re-usable) ---
const StatCard = ({ title, value, icon, bgColorClass }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 transition-all hover:shadow-lg">
    <div className={`p-3 rounded-full ${bgColorClass}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// --- Re-usable User Table Component ---
const UserTable = ({ users, onApprove, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {users.map(user => (
          <tr key={user._id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="font-medium text-gray-900">{user.fullName}</div>
              <div className="text-sm text-gray-500">{user.businessName}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900 flex items-center">
                <FiMail className="h-4 w-4 mr-1.5 text-gray-400" />
                {user.email}
              </div>
              <div className="text-sm text-gray-500">{user.mobile}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              {/* Conditionally show Approve button */}
              {onApprove && (
                <button
                  onClick={() => onApprove(user._id)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full text-green-700 bg-green-100 hover:bg-green-200"
                >
                  <FiCheck className="-ml-1 mr-1 h-4 w-4" />
                  Approve
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(user._id)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200"
                >
                  <FiTrash2 className="-ml-1 mr-1 h-4 w-4" />
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Main Dashboard Component ---
const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        getSystemStats(),
        getAllUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await approveUser(userId);
      fetchData(); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) {
      try {
        await deleteUser(userId);
        fetchData(); 
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { pendingUsers, approvedUsers } = useMemo(() => {
    const pending = [];
    const approved = [];
    users.forEach(user => {
      const userRole = user.role ? user.role.toLowerCase() : 'user';
      if (userRole === 'user') {
        if (user.isApproved) {
          approved.push(user);
        } else {
          pending.push(user);
        }
      }
    });
    return { pendingUsers: pending, approvedUsers: approved };
  }, [users]);

  if (loading) return <div className="p-8 text-gray-600">Loading Dashboard...</div>;
  if (error) return <div className="p-8 text-red-600 font-medium">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Superadmin Dashboard</h1>
        <div className="flex space-x-2">
          <Link to="/superadmin/settings" className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 transition-all border">
            <FiSettings className="mr-2 h-5 w-5" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all"
          >
            <FiLogOut className="mr-2 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon={<FiUsers className="h-6 w-6 text-blue-600" />} bgColorClass="bg-blue-100" />
          <StatCard title="Pending Approval" value={pendingUsers.length} icon={<FiClock className="h-6 w-6 text-orange-600" />} bgColorClass="bg-orange-100" />
          <StatCard title="Active Companies" value={approvedUsers.length} icon={<FiCheckCircle className="h-6 w-6 text-green-600" />} bgColorClass="bg-green-100" />
          <StatCard title="Total Employees" value={stats.totalAdmins} icon={<FiUsers className="h-6 w-6 text-indigo-600" />} bgColorClass="bg-indigo-100" />
        </div>
      )}

      <div className="bg-white shadow-md rounded-2xl overflow-hidden mb-8">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Pending Approvals</h2>
          <p className="text-sm text-gray-500 mt-1">These users are waiting to access their accounts.</p>
        </div>
        {pendingUsers.length === 0 ? (
          <p className="p-5 text-gray-500">No users are waiting for approval.</p>
        ) : (
          <UserTable users={pendingUsers} onApprove={handleApprove} onDelete={handleDelete} />
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Active Company Owners</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all approved business accounts.</p>
        </div>
        {approvedUsers.length === 0 ? (
          <p className="p-5 text-gray-500">No companies have been approved yet.</p>
        ) : (
          <UserTable users={approvedUsers} onDelete={handleDelete} />
        )}
      </div>

    </div>
  );
};

// This is the default export, for the main '/superadmin' route
export default SuperAdminDashboard;


//=================================================================
// ## COMPONENT 2: THE SETTINGS PAGE
//=================================================================

// This is a NAMED export, for the '/superadmin/settings' route
export const SuperAdminSettings = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mobile && !password) {
            setMessage({ type: 'error', text: 'Please enter a new mobile number or password.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const dataToUpdate = {};
            if (mobile) dataToUpdate.mobile = mobile;
            if (password) dataToUpdate.password = password;

            const response = await updateMySettings(dataToUpdate);
            setMessage({ type: 'success', text: response.message });
            setMobile('');
            setPassword('');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-xl mx-auto">
                <div className="mb-4">
                    <Link to="/superadmin" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <FiChevronLeft className="h-4 w-4 mr-1" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white shadow-md rounded-2xl p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Superadmin Settings</h1>
                    <p className="text-sm text-gray-500 mb-6">Update your login mobile number or password. Only fill the fields you want to change.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                                New Mobile Number
                            </label>
                            <input
                                type="tel"
                                id="mobile"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="Enter new mobile number"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <FiSave className="h-5 w-5 mr-2" />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>

                        {message.text && (
                            <div className={`mt-4 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {message.text}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};