import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Grid3X3,
  Phone,
  Mail,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tableId: '',
    reservationDate: new Date().toISOString().split('T')[0],
    timeSlot: '19:00 - 21:00',
    guestCount: 2,
    specialRequests: '',
  });

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const [resRes, tablesRes] = await Promise.all([
        api.get('/reservations', { params }),
        api.get('/tables'),
      ]);

      if (resRes.data?.success) setReservations(resRes.data.data);
      if (tablesRes.data?.success) {
        setTables(tablesRes.data.data);
        if (!formData.tableId && tablesRes.data.data.length > 0) {
          setFormData((prev) => ({ ...prev, tableId: tablesRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter, dateFilter]);

  const handleOpenAdd = () => {
    setErrorMessage('');
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      tableId: tables[0]?.id || '',
      reservationDate: new Date().toISOString().split('T')[0],
      timeSlot: '19:00 - 21:00',
      guestCount: 2,
      specialRequests: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const res = await api.post('/reservations', formData);
      if (res.data?.success) {
        setIsModalOpen(false);
        fetchReservations();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to book reservation');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status: newStatus });
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert('Could not update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this reservation?')) {
      try {
        await api.delete(`/reservations/${id}`);
        setReservations((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        alert('Could not delete reservation');
      }
    }
  };

  const timeSlots = [
    '12:00 - 14:00',
    '13:00 - 15:00',
    '18:00 - 20:00',
    '19:00 - 21:00',
    '20:00 - 22:00',
    '21:00 - 23:00',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Guest Reservations
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Table allocations, conflict avoidance, and party guest bookings
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchReservations}
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
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-charcoal-800 border border-charcoal-700 text-cream-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-charcoal-800 border border-charcoal-700 text-cream-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
          >
            <option value="all">All Bookings</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-brand-gold hover:underline"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Reservations Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-cream-400 text-xs">Loading bookings...</div>
      ) : reservations.length === 0 ? (
        <div className="p-12 text-center bg-charcoal-900 border border-charcoal-800 rounded-2xl">
          <CalendarDays className="w-10 h-10 mx-auto text-cream-400/40 mb-2" />
          <p className="text-sm font-serif font-bold text-cream-100">No reservations found</p>
          <p className="text-xs text-cream-400 mt-1">Book a new reservation above</p>
        </div>
      ) : (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] font-semibold text-cream-400 uppercase tracking-wider bg-charcoal-850">
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Guest Info</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Party Size</th>
                  <th className="py-3 px-4">Special Requests</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-charcoal-850/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-cream-100">
                        {new Date(res.reservationDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-brand-gold flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{res.timeSlot}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-cream-50 text-sm">
                        {res.customer?.name}
                      </div>
                      <div className="text-[11px] text-cream-400 flex items-center space-x-2 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{res.customer?.phone}</span>
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 font-bold text-brand-orange">
                        {res.table?.tableNumber || 'Table'}
                      </span>
                      <span className="block text-[10px] text-cream-400/80 mt-1">
                        {res.table?.location}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-cream-200">
                        <Users className="w-3.5 h-3.5 text-cream-400" />
                        <span>{res.guestCount} Guests</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-cream-300 max-w-xs">
                      {res.specialRequests || <span className="text-cream-400/50 italic">None</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={res.status}
                        onChange={(e) => handleStatusChange(res.id, e.target.value)}
                        className={`text-[10px] font-bold rounded-lg px-2.5 py-1 border bg-charcoal-800 focus:outline-none ${
                          res.status === 'CONFIRMED'
                            ? 'text-emerald-400 border-emerald-500/40'
                            : res.status === 'PENDING'
                            ? 'text-brand-gold border-brand-gold/40'
                            : res.status === 'COMPLETED'
                            ? 'text-blue-400 border-blue-500/40'
                            : 'text-red-400 border-red-500/40'
                        }`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="p-1.5 rounded-lg text-cream-400 hover:text-red-400 hover:bg-charcoal-800"
                        title="Remove Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Reservation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Book Table Reservation"
      >
        <form onSubmit={handleCreateReservation} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Guest Full Name *</label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="e.g. Jonathan Sterling"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+1 (555) 234-8910"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="guest@example.com"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Reservation Date *</label>
              <input
                type="date"
                required
                value={formData.reservationDate}
                onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Time Slot *</label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Allocate Table *</label>
              <select
                required
                value={formData.tableId}
                onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} ({t.seatingCapacity} seats - {t.location})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">Number of Guests *</label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Special Requests</label>
            <textarea
              rows={2}
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              placeholder="Anniversary, allergy notes, quiet window booth..."
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-brand-orange"
            />
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
              className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold shadow-md shadow-brand-orange/20"
            >
              Confirm Reservation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
