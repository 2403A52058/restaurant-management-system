import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Star,
  ShoppingBag,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Customers() {
  const { settings, hasRole } = useAuth();
  const currency = settings?.currencySymbol || '$';

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustId, setCurrentCustId] = useState(null);

  // Customer Profile History Drawer
  const [viewCustomer, setViewCustomer] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    loyaltyPoints: 0,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;

      const res = await api.get('/customers', { params });
      if (res.data?.success) setCustomers(res.data.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setCurrentCustId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      loyaltyPoints: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setIsEditMode(true);
    setCurrentCustId(c.id);
    setFormData({
      name: c.name,
      email: c.email || '',
      phone: c.phone,
      address: c.address || '',
      loyaltyPoints: c.loyaltyPoints || 0,
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/customers/${currentCustId}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleViewCustomerProfile = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data?.success) {
        setViewCustomer(res.data.data);
        setIsProfileOpen(true);
      }
    } catch (err) {
      alert('Could not load profile');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (window.confirm(`Delete customer "${name}"?`)) {
      try {
        await api.delete(`/customers/${id}`);
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete customer');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Customer Relationship Directory
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Guest contacts, loyalty reward points, and dining history records
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchCustomers}
            className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-cream-300 border border-charcoal-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold shadow-md shadow-brand-orange/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-cream-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest name, phone, or email address..."
            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-4 py-2 text-xs text-cream-100 placeholder-cream-400/50 focus:outline-none focus:border-brand-orange"
          />
        </form>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="p-12 text-center text-cream-400 text-xs">Loading customer directory...</div>
      ) : customers.length === 0 ? (
        <div className="p-12 text-center bg-charcoal-900 border border-charcoal-800 rounded-2xl">
          <Users className="w-10 h-10 mx-auto text-cream-400/40 mb-2" />
          <p className="text-sm font-serif font-bold text-cream-100">No guests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 hover:border-brand-orange/40 hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-orange/20 to-brand-gold/20 border border-brand-gold/30 flex items-center justify-center font-bold text-sm text-brand-gold">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-cream-50 leading-tight">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-cream-400/80">
                        Member since {new Date(c.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[11px] font-bold">
                    <Star className="w-3 h-3 fill-brand-gold" />
                    <span>{c.loyaltyPoints} pts</span>
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-cream-300 py-2 border-t border-charcoal-800">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-cream-400" />
                    <span>{c.phone}</span>
                  </div>
                  {c.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-cream-400" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-cream-400" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-center text-[11px] border-t border-charcoal-800/60">
                  <div className="p-1.5 rounded-lg bg-charcoal-800">
                    <span className="block font-bold text-cream-100">{c._count?.orders || 0}</span>
                    <span className="text-[10px] text-cream-400">Past Orders</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-charcoal-800">
                    <span className="block font-bold text-cream-100">{c._count?.reservations || 0}</span>
                    <span className="text-[10px] text-cream-400">Bookings</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-charcoal-800/80 mt-3 flex items-center justify-between">
                <button
                  onClick={() => handleViewCustomerProfile(c.id)}
                  className="flex items-center space-x-1 text-xs text-brand-orange hover:text-brand-orange-light font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Meal History</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-cream-400 hover:text-white"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {hasRole(['ADMIN']) && (
                    <button
                      onClick={() => handleDeleteCustomer(c.id, c.name)}
                      className="p-1.5 text-cream-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Guest Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Eleanor Vance"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 019-2831"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="guest@example.com"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Residential Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street, Suite, City..."
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Loyalty Points</label>
            <input
              type="number"
              value={formData.loyaltyPoints}
              onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              {isEditMode ? 'Update Guest' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile & Past Meals Drawer */}
      {viewCustomer && (
        <Modal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          title={`Guest History: ${viewCustomer.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-charcoal-800 border border-charcoal-700 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-cream-400">Loyalty Rewards</p>
                <p className="font-bold text-brand-gold text-base">{viewCustomer.loyaltyPoints} pts</p>
              </div>
              <div>
                <p className="text-[10px] text-cream-400">Total Visits</p>
                <p className="font-bold text-cream-100 text-base">{viewCustomer.orders?.length || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-cream-400">Reservations</p>
                <p className="font-bold text-cream-100 text-base">{viewCustomer.reservations?.length || 0}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-cream-200 uppercase tracking-wider text-[11px] mb-2">Past Food Orders</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {viewCustomer.orders?.length === 0 ? (
                  <p className="text-cream-400 italic">No orders recorded yet.</p>
                ) : (
                  viewCustomer.orders?.map((ord) => (
                    <div key={ord.id} className="p-2.5 rounded-xl bg-charcoal-800/70 border border-charcoal-700 space-y-1">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="font-mono text-cream-100">{ord.orderNumber}</span>
                        <span className="text-brand-orange">{currency}{Number(ord.totalAmount).toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-cream-400">
                        {new Date(ord.createdAt).toLocaleDateString()} • {ord.status}
                      </p>
                      <p className="text-[11px] text-cream-300">
                        {ord.orderItems?.map((i) => `${i.quantity}x ${i.menuItem?.name}`).join(', ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-charcoal-800 flex justify-end">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-charcoal-800 text-cream-300 hover:bg-charcoal-750"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
