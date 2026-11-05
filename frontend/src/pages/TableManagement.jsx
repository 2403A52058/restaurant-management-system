import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Plus,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  Ban,
  Edit2,
  Trash2,
  RefreshCw,
  Utensils,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function TableManagement() {
  const { hasRole, settings } = useAuth();
  const currency = settings?.currencySymbol || '$';

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTableId, setCurrentTableId] = useState(null);

  const [formData, setFormData] = useState({
    tableNumber: '',
    seatingCapacity: 4,
    location: 'Main Dining Hall',
    status: 'AVAILABLE',
  });

  const fetchTables = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterLocation !== 'all') params.location = filterLocation;
      if (filterStatus !== 'all') params.status = filterStatus;

      const res = await api.get('/tables', { params });
      if (res.data?.success) setTables(res.data.data);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [filterLocation, filterStatus]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setCurrentTableId(null);
    setFormData({
      tableNumber: `T-0${tables.length + 1}`,
      seatingCapacity: 4,
      location: 'Main Dining Hall',
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (table) => {
    setIsEditMode(true);
    setCurrentTableId(table.id);
    setFormData({
      tableNumber: table.tableNumber,
      seatingCapacity: table.seatingCapacity,
      location: table.location || 'Main Dining Hall',
      status: table.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/tables/${currentTableId}`, formData);
      } else {
        await api.post('/tables', formData);
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save table');
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await api.patch(`/tables/${tableId}/status`, { status: newStatus });
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      alert('Could not update status');
    }
  };

  const handleDeleteTable = async (tableId, tableNum) => {
    if (window.confirm(`Delete table ${tableNum}?`)) {
      try {
        await api.delete(`/tables/${tableId}`);
        setTables((prev) => prev.filter((t) => t.id !== tableId));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete table');
      }
    }
  };

  // Status Styling
  const statusConfig = {
    AVAILABLE: {
      bg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      label: 'Available',
    },
    OCCUPIED: {
      bg: 'bg-brand-orange-dark/20 border-brand-orange/40 text-brand-orange',
      badge: 'bg-brand-orange/20 text-brand-orange border-brand-orange/30',
      icon: Utensils,
      label: 'Occupied',
    },
    RESERVED: {
      bg: 'bg-brand-gold/15 border-brand-gold/40 text-brand-gold',
      badge: 'bg-brand-gold/20 text-brand-gold border-brand-gold/30',
      icon: Clock,
      label: 'Reserved',
    },
  };

  const locations = ['Main Dining Hall', 'Patio Garden', 'Rooftop Terrace', 'Private VIP Lounge'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Table & Floor Layout Management
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Real-time floor grid, seating capacities, and dynamic occupancy states
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchTables}
            className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-cream-300 border border-charcoal-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {hasRole(['ADMIN', 'MANAGER']) && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold shadow-md shadow-brand-orange/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="bg-charcoal-800 border border-charcoal-700 text-cream-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-charcoal-800 border border-charcoal-700 text-cream-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
          >
            <option value="all">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="OCCUPIED">Occupied</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-cream-300">Available</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-gold" />
            <span className="text-cream-300">Reserved</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
            <span className="text-cream-300">Occupied</span>
          </div>
        </div>
      </div>

      {/* Tables Floor Visualizer Grid */}
      {loading ? (
        <div className="p-12 text-center text-cream-400 text-xs">Loading floor map...</div>
      ) : tables.length === 0 ? (
        <div className="p-12 text-center bg-charcoal-900 border border-charcoal-800 rounded-2xl">
          <Grid3X3 className="w-10 h-10 mx-auto text-cream-400/40 mb-2" />
          <p className="text-sm font-serif font-bold text-cream-100">No tables found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {tables.map((table) => {
            const conf = statusConfig[table.status] || statusConfig.AVAILABLE;
            const activeOrder = table.orders && table.orders.length > 0 ? table.orders[0] : null;
            const activeRes = table.reservations && table.reservations.length > 0 ? table.reservations[0] : null;

            return (
              <div
                key={table.id}
                className={`p-4 rounded-2xl bg-charcoal-900 border ${conf.bg} relative overflow-hidden flex flex-col justify-between group hover:border-cream-300/40 hover:shadow-xl transition-all duration-300`}
              >
                <div>
                  {/* Top: Table Number & Status Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-serif font-bold text-lg text-cream-50">
                      {table.tableNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${conf.badge}`}
                    >
                      {conf.label}
                    </span>
                  </div>

                  {/* Meta: Capacity & Location */}
                  <div className="space-y-1 text-xs text-cream-300 mb-4">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-cream-400" />
                      <span>{table.seatingCapacity} Seater</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cream-400" />
                      <span className="truncate text-cream-400">{table.location || 'Main Floor'}</span>
                    </div>
                  </div>

                  {/* Active Context details */}
                  {table.status === 'OCCUPIED' && activeOrder && (
                    <div className="p-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700/60 text-[11px] space-y-1 mb-3">
                      <p className="font-semibold text-brand-orange truncate">
                        Order #{activeOrder.orderNumber}
                      </p>
                      <p className="text-cream-400 truncate">
                        Total: {currency}{Number(activeOrder.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-cream-400/80">
                        {activeOrder.orderItems?.length || 0} items ordered
                      </p>
                    </div>
                  )}

                  {table.status === 'RESERVED' && activeRes && (
                    <div className="p-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700/60 text-[11px] space-y-1 mb-3">
                      <p className="font-semibold text-brand-gold truncate">
                        Guest: {activeRes.customer?.name}
                      </p>
                      <p className="text-cream-400">
                        Slot: {activeRes.timeSlot}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Switcher & Actions */}
                <div className="pt-3 border-t border-charcoal-800/80 flex items-center justify-between">
                  <select
                    value={table.status}
                    onChange={(e) => handleStatusChange(table.id, e.target.value)}
                    className="bg-charcoal-800 border border-charcoal-700 text-cream-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-brand-orange"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="OCCUPIED">Occupied</option>
                  </select>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="p-1 text-cream-400 hover:text-white"
                      title="Edit Table"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {hasRole(['ADMIN']) && (
                      <button
                        onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                        className="p-1 text-cream-400 hover:text-red-400"
                        title="Delete Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Table' : 'Add New Restaurant Table'}
      >
        <form onSubmit={handleSaveTable} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Table Number *</label>
            <input
              type="text"
              required
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              placeholder="e.g. T-12 or VIP-01"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Seating Capacity *</label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={formData.seatingCapacity}
              onChange={(e) => setFormData({ ...formData, seatingCapacity: e.target.value })}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Dining Zone / Location</label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Initial Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            >
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="OCCUPIED">Occupied</option>
            </select>
          </div>

          <div className="pt-4 border-t border-charcoal-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-cream-300 text-xs font-medium hover:bg-charcoal-750"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold"
            >
              {isEditMode ? 'Update Table' : 'Add Table'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
