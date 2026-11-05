import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Utensils,
  Minus,
  Trash2,
  Clock,
  ArrowRight,
  Receipt,
  User,
  CheckCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
  const { settings, hasRole } = useAuth();
  const currency = settings?.currencySymbol || '$';
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // New Order Form
  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState([]); // [{ menuItemId, name, price, quantity, notes }]

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.orderType = typeFilter;

      const [ordersRes, tablesRes, menuRes] = await Promise.all([
        api.get('/orders', { params }),
        api.get('/tables'),
        api.get('/menu/items', { params: { isAvailable: true } }),
      ]);

      if (ordersRes.data?.success) setOrders(ordersRes.data.data);
      if (tablesRes.data?.success) setTables(tablesRes.data.data);
      if (menuRes.data?.success) setMenuItems(menuRes.data.data);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, [statusFilter, typeFilter]);

  const handleOpenCreateOrder = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    const firstAvailTable = tables.find((t) => t.status === 'AVAILABLE');
    setTableId(firstAvailTable ? firstAvailTable.id : '');
    setIsModalOpen(true);
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          notes: '',
        },
      ];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.menuItemId === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const updateCartNotes = (id, notesStr) => {
    setCart((prev) =>
      prev.map((i) => (i.menuItemId === id ? { ...i, notes: notesStr } : i))
    );
  };

  const cartSubtotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const taxRate = Number(settings?.defaultTaxRate || 5.0);
  const cartTax = (cartSubtotal * taxRate) / 100;
  const cartTotal = cartSubtotal + cartTax;

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Please add at least one dish to the order');
      return;
    }

    try {
      const payload = {
        orderType,
        tableId: orderType === 'DINE_IN' && tableId ? parseInt(tableId) : null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          notes: c.notes || null,
        })),
        notes,
      };

      const res = await api.post('/orders', payload);
      if (res.data?.success) {
        setIsModalOpen(false);
        fetchOrdersData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create order');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert('Could not update status');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      PREPARING: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
      READY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      SERVED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Order Management & POS Hub
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Table orders, takeaway, multi-item creation, and kitchen workflow orchestration
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchOrdersData}
            className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-cream-300 border border-charcoal-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreateOrder}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold shadow-md shadow-brand-orange/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Food Order</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-charcoal-800 border border-charcoal-700 text-cream-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="SERVED">Served</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-charcoal-800 border border-charcoal-700 text-cream-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
          >
            <option value="all">All Types</option>
            <option value="DINE_IN">Dine In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="p-12 text-center text-cream-400 text-xs">Loading food orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-charcoal-900 border border-charcoal-800 rounded-2xl">
          <ClipboardList className="w-10 h-10 mx-auto text-cream-400/40 mb-2" />
          <p className="text-sm font-serif font-bold text-cream-100">No food orders recorded</p>
          <p className="text-xs text-cream-400 mt-1">Click "Create Food Order" to place one</p>
        </div>
      ) : (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] font-semibold text-cream-400 uppercase tracking-wider bg-charcoal-850">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Table / Type</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-charcoal-850/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cream-100">
                      {ord.orderNumber}
                      <span className="block text-[10px] font-sans text-cream-400 font-normal">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 font-bold text-brand-gold">
                        {ord.table ? ord.table.tableNumber : ord.orderType}
                      </span>
                      <span className="block text-[10px] text-cream-400 mt-1">
                        {ord.orderType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-cream-100">
                        {ord.customer?.name || 'Walk-in'}
                      </span>
                      {ord.customer?.phone && (
                        <span className="block text-[10px] text-cream-400">
                          {ord.customer.phone}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-cream-300">
                      {ord.orderItems?.map((oi) => `${oi.quantity}x ${oi.menuItem?.name}`).join(', ')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-sm text-cream-50">
                        {currency}{Number(ord.totalAmount).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-cream-400">
                        Sub: {currency}{Number(ord.subtotal).toFixed(2)} + Tax
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className={`text-[10px] font-bold rounded-lg px-2.5 py-1 border bg-charcoal-800 focus:outline-none ${
                          ord.status === 'READY'
                            ? 'text-emerald-400 border-emerald-500/40'
                            : ord.status === 'PREPARING'
                            ? 'text-brand-orange border-brand-orange/40'
                            : ord.status === 'SERVED'
                            ? 'text-blue-400 border-blue-500/40'
                            : ord.status === 'CANCELLED'
                            ? 'text-red-400 border-red-500/40'
                            : 'text-yellow-400 border-yellow-500/40'
                        }`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="SERVED">Served</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setIsViewOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-cream-300 hover:text-white hover:bg-charcoal-800"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => navigate('/billing')}
                        className="px-2.5 py-1 rounded-lg bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/30 text-brand-gold font-semibold text-[11px]"
                        title="Go to POS Billing"
                      >
                        Checkout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Food Order"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Item Picker */}
            <div className="md:col-span-2 space-y-4 border-r border-charcoal-800 pr-0 md:pr-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-cream-300 mb-1">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
                  >
                    <option value="DINE_IN">Dine In (Table Service)</option>
                    <option value="TAKEAWAY">Takeaway / Pick-up</option>
                    <option value="DELIVERY">Delivery</option>
                  </select>
                </div>

                {orderType === 'DINE_IN' && (
                  <div>
                    <label className="block text-xs font-semibold text-cream-300 mb-1">Select Table *</label>
                    <select
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value)}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-cream-100"
                    >
                      <option value="">Choose Table...</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tableNumber} ({t.status} - {t.seatingCapacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Dish Selection Grid */}
              <div>
                <label className="block text-xs font-semibold text-cream-300 mb-2">
                  Select Culinary Dishes:
                </label>
                <div className="max-h-64 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="p-2.5 rounded-xl bg-charcoal-800/80 hover:bg-charcoal-750 border border-charcoal-700/80 flex items-center justify-between cursor-pointer transition-all hover:border-brand-orange/40 group"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-semibold text-cream-100 group-hover:text-brand-orange truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-brand-gold">
                          {currency}{Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="p-1 rounded-lg bg-charcoal-700 group-hover:bg-brand-orange text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Cart Summary */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-cream-200 uppercase tracking-wider pb-2 border-b border-charcoal-800">
                Order Ticket ({cart.length} item{cart.length !== 1 ? 's' : ''})
              </h4>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-cream-400/60 italic text-center py-6">
                    No items selected yet. Click dishes to add.
                  </p>
                ) : (
                  cart.map((c) => (
                    <div key={c.menuItemId} className="p-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cream-100 truncate pr-1">{c.name}</span>
                        <span className="font-mono text-brand-gold">{currency}{(c.price * c.quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(c.menuItemId, -1)}
                            className="p-0.5 rounded bg-charcoal-700 text-cream-200 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold">{c.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(c.menuItemId, 1)}
                            className="p-0.5 rounded bg-charcoal-700 text-cream-200 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Special note..."
                          value={c.notes}
                          onChange={(e) => updateCartNotes(c.menuItemId, e.target.value)}
                          className="bg-charcoal-900 border border-charcoal-700 text-[10px] text-cream-200 rounded px-1.5 py-0.5 w-24"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-charcoal-800 space-y-1 text-xs">
                <div className="flex justify-between text-cream-400">
                  <span>Subtotal:</span>
                  <span>{currency}{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cream-400">
                  <span>Tax ({taxRate}%):</span>
                  <span>{currency}{cartTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-cream-50 pt-1 border-t border-charcoal-700">
                  <span>Total:</span>
                  <span className="text-brand-orange">{currency}{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold uppercase shadow-md disabled:opacity-50"
              >
                Send Order to Kitchen
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Order Details: ${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-charcoal-800 border border-charcoal-700">
              <div>
                <p className="text-[10px] text-cream-400 uppercase">Table / Location</p>
                <p className="font-bold text-cream-100">{selectedOrder.table?.tableNumber || selectedOrder.orderType}</p>
              </div>
              <div>
                <p className="text-[10px] text-cream-400 uppercase">Status</p>
                <p className="font-bold">{getStatusBadge(selectedOrder.status)}</p>
              </div>
              <div>
                <p className="text-[10px] text-cream-400 uppercase">Placed At</p>
                <p className="text-cream-200">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-cream-400 uppercase">Total</p>
                <p className="font-bold text-brand-gold font-serif text-sm">{currency}{Number(selectedOrder.totalAmount).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <p className="font-bold text-cream-300 uppercase tracking-wider text-[10px] mb-2">Itemized Dishes</p>
              <div className="space-y-1.5 divide-y divide-charcoal-800">
                {selectedOrder.orderItems?.map((oi) => (
                  <div key={oi.id} className="pt-1.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-cream-100">{oi.quantity}x {oi.menuItem?.name}</p>
                      {oi.notes && <p className="text-[10px] text-brand-gold italic">"{oi.notes}"</p>}
                    </div>
                    <span className="font-mono text-cream-200">{currency}{Number(oi.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-charcoal-800 flex justify-end">
              <button
                onClick={() => setIsViewOpen(false)}
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
