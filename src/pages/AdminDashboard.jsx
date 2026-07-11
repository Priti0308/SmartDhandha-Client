import React, { useState, useEffect, useMemo } from 'react';
import { 
  getSystemStats, 
  getAllUsers, 
  approveUser, 
  deleteUser, 
  updateMySettings,
  updateUser 
} from '../services/adminService';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiUsers, FiClock, FiCheckCircle, FiCheck, FiMail, FiLogOut, FiSettings, FiTrash2,
  FiSave, FiChevronLeft, FiEdit, FiX, FiShield, FiPhone, FiBriefcase
} from 'react-icons/fi';

//=================================================================
// ## REUSABLE SUB-COMPONENTS
//=================================================================

const StatCard = ({ title, value, icon, bgColorClass, iconColorClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
    <div className={`p-4 rounded-xl ${bgColorClass} ${iconColorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">{title}</p>
      <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  </div>
);

const UserTable = ({ users, onApprove, onDelete, onEdit }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-100">
      <thead className="bg-slate-50/75">
        <tr>
          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Business Owner</th>
          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact details</th>
          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
          <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-100">
        {users.map(user => (
          <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0173AE] to-[#66C6E6] text-white font-bold flex items-center justify-center shadow-inner">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-bold text-slate-900">{user.fullName || 'No Name'}</div>
                  <div className="text-xs text-slate-500 flex items-center mt-0.5">
                    <FiBriefcase className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    {user.businessName || 'No Business'}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-slate-800 flex items-center">
                <FiMail className="h-4 w-4 mr-2 text-slate-400" />
                {user.email}
              </div>
              <div className="text-xs text-slate-500 flex items-center mt-1">
                <FiPhone className="h-3.5 w-3.5 mr-2 text-slate-400" />
                {user.mobile || 'N/A'}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                user.role === 'admin' 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'bg-teal-100 text-teal-800'
              }`}>
                {user.role || 'user'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user.isApproved 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {user.isApproved ? 'Approved' : 'Pending'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              {onApprove && !user.isApproved && (
                <button
                  onClick={() => onApprove(user._id)}
                  title="Approve User"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-sm transition-all"
                >
                  <FiCheck className="mr-1 h-3.5 w-3.5" />
                  Approve
                </button>
              )}
              <button
                onClick={() => onEdit(user)}
                title="Edit User Profile"
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
              >
                <FiEdit className="mr-1 h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => onDelete(user._id)}
                title="Delete User"
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-all"
              >
                <FiTrash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

//=================================================================
// ## MAIN COMPONENT: ADMIN DASHBOARD
//=================================================================
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    businessName: '',
    email: '',
    mobile: '',
    role: 'user',
    isApproved: false
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

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
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
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

  // Open Edit Modal
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || '',
      businessName: user.businessName || '',
      email: user.email || '',
      mobile: user.mobile || '',
      role: user.role || 'user',
      isApproved: user.isApproved || false
    });
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      await updateUser(selectedUser._id, editForm);
      setEditSuccess('User profile updated successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        fetchData(); // Refresh the list
      }, 1500);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const { pendingUsers, approvedUsers } = useMemo(() => {
    const pending = [];
    const approved = [];
    users.forEach(user => {
      const userRole = user.role ? user.role.toLowerCase() : 'user';
      // Exclude system owner from database users list
      if (userRole !== 'admin') {
        if (user.isApproved) {
          approved.push(user);
        } else {
          pending.push(user);
        }
      }
    });
    return { pendingUsers: pending, approvedUsers: approved };
  }, [users]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#0173AE]/30 border-t-[#0173AE] animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-rose-100 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <FiX className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <button onClick={fetchData} className="px-5 py-2 bg-[#0173AE] text-white font-semibold rounded-lg hover:bg-[#00264B] transition">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Glow Top Banner */}
      <div className="bg-gradient-to-r from-[#00264B] via-[#0173AE] to-[#66C6E6] text-white py-8 px-4 md:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                <FiShield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Admin Control Center</h1>
            </div>
            <p className="text-white/75 mt-1 text-sm md:text-base font-medium">Manage and approve client business databases, settings, and users.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link 
              to="/admin/settings" 
              className="flex items-center px-4 py-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl font-bold text-sm backdrop-blur-md transition border border-white/10 shadow-sm"
            >
              <FiSettings className="mr-2 h-4 w-4" />
              System Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2.5 bg-rose-600/90 text-white hover:bg-rose-700 rounded-xl font-bold text-sm transition shadow-md"
            >
              <FiLogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Content wrapper */}
      <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
        
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
              title="Total Business Accounts" 
              value={stats.totalUsers} 
              icon={<FiUsers className="h-6 w-6" />} 
              bgColorClass="bg-blue-50" 
              iconColorClass="text-[#0173AE]"
            />
            <StatCard 
              title="Pending Approval" 
              value={pendingUsers.length} 
              icon={<FiClock className="h-6 w-6" />} 
              bgColorClass="bg-amber-50" 
              iconColorClass="text-amber-600"
            />
            <StatCard 
              title="Active Businesses" 
              value={approvedUsers.length} 
              icon={<FiCheckCircle className="h-6 w-6" />} 
              bgColorClass="bg-emerald-50" 
              iconColorClass="text-emerald-600"
            />
          </div>
        )}

        {/* Pending Approvals Table */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2.5 animate-pulse"></span>
              Pending Approvals
            </h2>
            <p className="text-xs text-slate-500 mt-1">Review registrations that require admin approval to access ledger dashboard features.</p>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FiClock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No accounts waiting for approval</p>
            </div>
          ) : (
            <UserTable users={pendingUsers} onApprove={handleApprove} onDelete={handleDelete} onEdit={handleEditClick} />
          )}
        </div>
        
        {/* Active Companies Table */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5"></span>
              Approved Company Owners
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure and manage active business owner logins.</p>
          </div>
          {approvedUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FiCheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No approved companies registered yet</p>
            </div>
          ) : (
            <UserTable users={approvedUsers} onDelete={handleDelete} onEdit={handleEditClick} />
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* ## PORTAL MODAL: USER PROFILE EDITOR */}
      {/* ================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => !editLoading && setIsEditModalOpen(false)}
          ></div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden transform transition-all z-10">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Account Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify profile credentials and system roles.</p>
              </div>
              <button 
                type="button"
                disabled={editLoading}
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                
                {editError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-2"></span>
                    {editError}
                  </div>
                )}

                {editSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2"></span>
                    {editSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="e.g. Priti Prakash Kadam"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0173AE]/40 focus:border-[#0173AE] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">Business Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.businessName}
                      onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                      placeholder="e.g. Kadam Store"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0173AE]/40 focus:border-[#0173AE] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="e.g. priti@gmail.com"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0173AE]/40 focus:border-[#0173AE] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">Mobile Number (Login ID)</label>
                    <input
                      type="tel"
                      required
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                      placeholder="e.g. 8459894232"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0173AE]/40 focus:border-[#0173AE] focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">System Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0173AE]/40 focus:border-[#0173AE] focus:outline-none transition bg-white"
                    >
                      <option value="user">Business Owner (user)</option>
                      <option value="admin">Employee (admin)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">Approval Rights</label>
                    <label className="inline-flex items-center mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isApproved}
                        onChange={(e) => setEditForm({ ...editForm, isApproved: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0173AE]/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      <span className="ms-3 text-sm font-semibold text-slate-700">
                        {editForm.isApproved ? 'Approved & Active' : 'Suspended / Pending'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  disabled={editLoading}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-sm font-semibold rounded-lg text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-[#0173AE] hover:bg-[#00264B] text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center"
                >
                  {editLoading && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


//=================================================================
// ## COMPONENT 2: THE SETTINGS PAGE
//=================================================================

export const AdminSettings = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const { logout } = useAuth();
    const navigate = useNavigate();

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
        <div className="min-h-screen bg-slate-50">
            <div className="bg-gradient-to-r from-[#00264B] via-[#0173AE] to-[#66C6E6] text-white py-6 px-4 md:px-8 shadow-sm">
                <div className="max-w-xl mx-auto flex items-center space-x-4">
                    <Link to="/admin" className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white">
                        <FiChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Admin Settings</h1>
                        <p className="text-xs text-white/75 mt-0.5 font-medium">Update control credentials for authentication.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto py-8 px-4">
                <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Security Credentials</h2>
                    <p className="text-xs text-slate-500 mb-6 font-medium">Update your login mobile number or password. Only fill the fields you want to change.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="mobile" className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">
                                New Mobile Number
                            </label>
                            <input
                                type="tel"
                                id="mobile"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="Enter new mobile number"
                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#0173AE]/40 focus:border-[#0173AE] focus:outline-none transition bg-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#0173AE]/40 focus:border-[#0173AE] focus:outline-none transition bg-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center px-4 py-2.5 bg-[#0173AE] hover:bg-[#00264B] text-white font-bold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
                        >
                            {loading ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            ) : (
                              <FiSave className="h-4 w-4 mr-2" />
                            )}
                            {loading ? 'Saving Changes...' : 'Save Settings'}
                        </button>

                        {message.text && (
                            <div className={`p-3.5 rounded-xl border text-xs font-bold mt-4 flex items-center ${
                              message.type === 'success' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                : 'bg-rose-50 border-rose-100 text-rose-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${message.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                              {message.text}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
