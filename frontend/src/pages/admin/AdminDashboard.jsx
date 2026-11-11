import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import SEOHead from '../../components/SEOHead';
import {
  Shield, Users, Building2, Scale, DollarSign, Settings,
  AlertTriangle, CheckCircle, XCircle, Loader2, ArrowRight,
  TrendingUp, RefreshCw, FileText, Lock, IndianRupee, Key
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | farms | users | settings | financials | complaints | audit
  const [stats, setStats] = useState(null);
  const [farms, setFarms] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [financials, setFinancials] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Settings Form State
  const [commissionRate, setCommissionRate] = useState('0.03');
  const [deliveryBaseFee, setDeliveryBaseFee] = useState('50');
  const [deliveryPerKmRate, setDeliveryPerKmRate] = useState('10');
  const [deliveryFreeRadius, setDeliveryFreeRadius] = useState('0');
  const [deliveryMaxDistance, setDeliveryMaxDistance] = useState('50');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, farmsRes, usersRes, settingsRes, finRes, auditRes, bookingsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAllFarms(),
        adminAPI.getAllUsers(),
        adminAPI.getSettings(),
        adminAPI.getFinancials(),
        adminAPI.getAuditLogs(),
        adminAPI.getAllBookings(),
      ]);

      setStats(dashRes?.stats || null);
      setFarms(farmsRes?.farms || []);
      setUsers(usersRes?.users || []);
      setFinancials(finRes?.summary || null);
      setAuditLogs(auditRes?.logs || []);
      setAllBookings(bookingsRes?.bookings || []);

      // Populate settings map
      const sMap = {};
      (settingsRes?.settings || []).forEach((s) => {
        sMap[s.key] = s.value;
      });
      setSettings(sMap);
      if (sMap['platform_commission_rate']) setCommissionRate(sMap['platform_commission_rate']);
      if (sMap['delivery_base_fee']) setDeliveryBaseFee(sMap['delivery_base_fee']);
      if (sMap['delivery_per_km_rate']) setDeliveryPerKmRate(sMap['delivery_per_km_rate']);
      if (sMap['delivery_free_radius_km']) setDeliveryFreeRadius(sMap['delivery_free_radius_km']);
      if (sMap['delivery_max_distance_km']) setDeliveryMaxDistance(sMap['delivery_max_distance_km']);
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to fetch admin data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleFarmAction = async (farmId, action) => {
    let reason = '';
    if (action === 'SUSPEND') {
      reason = prompt('Enter suspension reason:') || 'Policy violation';
    }
    setActionLoading(true);
    try {
      await adminAPI.farmAction(farmId, action, reason);
      setFeedbackMsg({ text: `Farm status updated (${action}).`, type: 'success' });
      await fetchAdminData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Action failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updates = [
        { key: 'platform_commission_rate', value: commissionRate.trim() },
        { key: 'delivery_base_fee', value: deliveryBaseFee.trim() },
        { key: 'delivery_per_km_rate', value: deliveryPerKmRate.trim() },
        { key: 'delivery_free_radius_km', value: deliveryFreeRadius.trim() },
        { key: 'delivery_max_distance_km', value: deliveryMaxDistance.trim() },
      ];

      for (const s of updates) {
        await adminAPI.updateSettings(s);
      }
      setFeedbackMsg({ text: 'Platform settings updated successfully across all nodes.', type: 'success' });
      await fetchAdminData();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to update settings.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead title="Super Admin Dashboard | KodiKart" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Admin Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 text-red-700 p-3 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-brown">Super Admin Control Center</h1>
              <p className="text-xs text-gray-500">
                Logged in as {user?.name} (+91 {user?.phone}) • Strict Platform Oversight
              </p>
            </div>
          </div>
          <button
            onClick={fetchAdminData}
            className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>

        {/* Global Feedback */}
        {feedbackMsg.text && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between ${
              feedbackMsg.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg({ text: '', type: '' })}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="card text-center p-3">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Active Users</span>
            <p className="text-xl font-black text-brown mt-0.5">{stats?.totalUsers || 0}</p>
          </div>
          <div className="card text-center p-3">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Farms</span>
            <p className="text-xl font-black text-green-700 mt-0.5">{stats?.totalFarms || 0}</p>
          </div>
          <div className="card text-center p-3">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Pending Verif</span>
            <p className="text-xl font-black text-amber-600 mt-0.5">{stats?.pendingVerifications || 0}</p>
          </div>
          <div className="card text-center p-3">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Available Hens</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{stats?.totalHens || 0}</p>
          </div>
          <div className="card text-center p-3">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Total Bookings</span>
            <p className="text-xl font-black text-blue-700 mt-0.5">{stats?.totalBookings || 0}</p>
          </div>
          <div className="card text-center p-3">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Commission (3%)</span>
            <p className="text-xl font-black text-gold mt-0.5">₹{financials?.totalPlatformCommission || 0}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-4 overflow-x-auto pb-1 text-xs font-bold">
          {[
            { id: 'farms', label: `Farms & Verification (${farms.length})` },
            { id: 'bookings', label: `Bookings (${allBookings.length})` },
            { id: 'settings', label: 'Commission & Delivery Settings' },
            { id: 'users', label: `User Directory (${users.length})` },
            { id: 'financials', label: 'Financial Ledgers' },
            { id: 'audit', label: `Security Logs (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-1 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-green-700 text-green-700 font-extrabold'
                  : 'border-transparent text-gray-500 hover:text-brown'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: FARMS MANAGEMENT & VERIFICATION */}
        {activeTab === 'farms' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-brown text-sm">Farm Registry & Verification Badges</h3>
              <span className="text-xs text-gray-500">
                Rule: All new farms start as "Unverified Farm" until inspected.
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream text-brown font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Farm</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Owner Details</th>
                    <th className="p-3">Hens</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {farms.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <strong className="text-brown block">{f.farmName}</strong>
                        <span className="text-[10px] text-gray-400 font-mono">ID: #{f.id}</span>
                      </td>
                      <td className="p-3">
                        {f.villageOrTown}, {f.district} ({f.state})
                      </td>
                      <td className="p-3">
                        <span>{f.owner?.name}</span>
                        <span className="text-gray-400 block text-[11px]">+91 {f.owner?.phone}</span>
                      </td>
                      <td className="p-3 font-semibold">{f._count?.henInventory || 0}</td>
                      <td className="p-3">
                        {f.isVerified ? (
                          <span className="badge-verified text-[11px]">
                            <CheckCircle className="w-3 h-3" /> Verified Farm
                          </span>
                        ) : (
                          <span className="badge-unverified text-[11px]">
                            <XCircle className="w-3 h-3" /> Unverified Farm
                          </span>
                        )}
                        {!f.isActive && (
                          <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded ml-1 font-bold">
                            SUSPENDED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {f.isVerified ? (
                          <button
                            onClick={() => handleFarmAction(f.id, 'UNVERIFY')}
                            disabled={actionLoading}
                            className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200 px-2.5 py-1 rounded font-semibold"
                          >
                            Mark Unverified
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFarmAction(f.id, 'VERIFY')}
                            disabled={actionLoading}
                            className="text-xs bg-green-100 text-green-800 hover:bg-green-200 px-2.5 py-1 rounded font-semibold"
                          >
                            Verify Farm
                          </button>
                        )}
                        {f.isActive ? (
                          <button
                            onClick={() => handleFarmAction(f.id, 'SUSPEND')}
                            disabled={actionLoading}
                            className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFarmAction(f.id, 'UNSUSPEND')}
                            disabled={actionLoading}
                            className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-semibold"
                          >
                            Reinstate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: BOOKINGS MANAGEMENT */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-brown text-sm">All Platform Bookings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream text-brown font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Booking #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Farm</th>
                    <th className="p-3">Breed & Qty</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-green-800">{b.bookingNumber}</td>
                      <td className="p-3">{b.customer?.name} (+91 {b.customer?.phone})</td>
                      <td className="p-3">{b.farm?.farmName}</td>
                      <td className="p-3">{b.breed?.name} ({b.requestedQuantity} hens)</td>
                      <td className="p-3 font-bold text-green-700">₹{b.finalTotalAmount}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">
                        {new Date(b.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: COMMISSION & DELIVERY SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl space-y-4">
            <h3 className="font-bold text-brown text-base flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" />
              Platform Commission & Delivery Configuration
            </h3>
            <p className="text-xs text-gray-500">
              Only authorized Super Admins can adjust platform rates. Changes apply to future bookings.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs pt-2">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <label className="block font-bold text-green-900 mb-1">
                  Platform Commission Rate (Default: 0.03 = 3%) *
                </label>
                <input
                  type="number"
                  step="0.005"
                  min="0.01"
                  max="0.20"
                  required
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="input-field font-bold text-sm"
                />
                <span className="text-[10px] text-green-700 mt-1 block">
                  Current: {(parseFloat(commissionRate || 0) * 100).toFixed(1)}%. Customer price = Farm base + this commission.
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <h4 className="font-bold text-brown text-xs uppercase tracking-wider">
                  Automated Distance-Based Delivery Pricing
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-brown mb-1">Base Delivery Fee (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={deliveryBaseFee}
                      onChange={(e) => setDeliveryBaseFee(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brown mb-1">Rate Per Kilometre (₹/km) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={deliveryPerKmRate}
                      onChange={(e) => setDeliveryPerKmRate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-brown mb-1">Free Radius (km)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={deliveryFreeRadius}
                      onChange={(e) => setDeliveryFreeRadius(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brown mb-1">Max Delivery Distance (km)</label>
                    <input
                      type="number"
                      min="5"
                      required
                      value={deliveryMaxDistance}
                      onChange={(e) => setDeliveryMaxDistance(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="btn-primary py-2.5 px-6 text-sm font-bold shadow-md"
              >
                {actionLoading ? 'Saving Settings...' : 'Update Platform Settings'}
              </button>
            </form>
          </div>
        )}

        {/* TAB: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-brown text-sm">User Directory</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream text-brown font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-brown">{u.name}</td>
                      <td className="p-3 font-mono">+91 {u.phone}</td>
                      <td className="p-3 text-gray-500">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: FINANCIAL LEDGERS */}
        {activeTab === 'financials' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card text-center p-4">
                <span className="text-xs text-gray-500 font-semibold">Total Platform Commission (3%)</span>
                <p className="text-2xl font-black text-gold mt-1">₹{financials?.totalPlatformCommission || 0}</p>
              </div>
              <div className="card text-center p-4">
                <span className="text-xs text-gray-500 font-semibold">Total Farm Earnings</span>
                <p className="text-2xl font-black text-green-700 mt-1">₹{financials?.totalFarmEarnings || 0}</p>
              </div>
              <div className="card text-center p-4">
                <span className="text-xs text-gray-500 font-semibold">Completed Orders</span>
                <p className="text-2xl font-black text-blue-700 mt-1">{financials?.completedBookings || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-xs text-gray-600 space-y-2">
              <h4 className="font-bold text-brown text-sm">Ledger Separation Guarantee:</h4>
              <p>
                1. <strong>Platform Commission Ledger:</strong> Accumulates the 3% snapshot calculated at quotation time upon order completion.
              </p>
              <p>
                2. <strong>Farm Earnings Ledger:</strong> Accumulates 100% of the farm base amount for each completed order. Farmers are never double-charged.
              </p>
            </div>
          </div>
        )}

        {/* TAB: SECURITY AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-brown text-sm">Immutable Security Audit Trail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream text-brown font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">User</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-green-900 bg-green-50 px-2 py-0.5 rounded text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3">{log.user?.name || `ID #${log.userId || 'Anon'}`}</td>
                      <td className="p-3 font-mono text-gray-500">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="p-3 text-gray-600">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
