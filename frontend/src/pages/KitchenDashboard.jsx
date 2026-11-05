import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  UtensilsCrossed,
  RefreshCw,
  Bell,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchKitchenOrders = async () => {
    try {
      const res = await api.get('/kitchen/orders');
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error loading kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 10000); // 10s auto refresh for kitchen
    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus });
      fetchKitchenOrders();
    } catch (err) {
      alert('Could not update order status');
    }
  };

  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      await api.patch(`/kitchen/items/${itemId}/status`, { status: newStatus });
      fetchKitchenOrders();
    } catch (err) {
      alert('Could not update item status');
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  const getUrgencyColor = (elapsed) => {
    if (elapsed > 20) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (elapsed > 10) return 'text-brand-orange bg-brand-orange/10 border-brand-orange/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-orange-dark to-brand-gold flex items-center justify-center text-white shadow-lg">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50 flex items-center space-x-2">
              <span>Kitchen Display System (KDS)</span>
              <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
            </h1>
            <p className="text-xs text-cream-400 mt-0.5">
              Live preparation tickets, ticket aging, and cook station updates
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-charcoal-850 p-1 rounded-xl border border-charcoal-800 text-xs">
            {['all', 'PENDING', 'PREPARING', 'READY'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all capitalize ${
                  filter === st
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'text-cream-400 hover:text-white'
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchKitchenOrders}
            className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-cream-300 border border-charcoal-700"
            title="Refresh Live Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Ticket Grid */}
      {loading ? (
        <div className="p-12 text-center text-cream-400 text-xs">Connecting to kitchen display feed...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-charcoal-900 border border-charcoal-800 rounded-3xl">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
          <h3 className="text-lg font-serif font-bold text-cream-100">All Clear in Kitchen!</h3>
          <p className="text-xs text-cream-400 mt-1">
            No pending tickets in line. New incoming orders will automatically pop up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredOrders.map((ord) => {
            const isReady = ord.status === 'READY';
            const isPreparing = ord.status === 'PREPARING';

            return (
              <div
                key={ord.id}
                className={`rounded-2xl bg-charcoal-900 border flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ${
                  isReady
                    ? 'border-emerald-500/50 shadow-emerald-950/20'
                    : isPreparing
                    ? 'border-brand-orange/50 shadow-brand-orange/10'
                    : 'border-yellow-500/40 shadow-yellow-950/20'
                }`}
              >
                {/* Ticket Header */}
                <div className="p-4 bg-charcoal-850 border-b border-charcoal-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-cream-50">
                      {ord.orderNumber}
                    </span>
                    <span className="block text-xs font-serif font-bold text-brand-gold">
                      {ord.table ? `Table: ${ord.table.tableNumber}` : ord.orderType}
                    </span>
                  </div>

                  {/* Elapsed Timer Pill */}
                  <div
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold ${getUrgencyColor(
                      ord.elapsedMinutes
                    )}`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{ord.elapsedMinutes}m ago</span>
                  </div>
                </div>

                {/* Ticket Items List */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72 divide-y divide-charcoal-800/60">
                  {ord.orderItems?.map((it) => {
                    const itemDone = it.status === 'READY' || it.status === 'SERVED';

                    return (
                      <div key={it.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={`text-xs font-bold leading-snug transition-colors ${
                              itemDone ? 'line-through text-cream-400/50' : 'text-cream-100'
                            }`}
                          >
                            <span className="text-brand-orange font-black mr-1.5">{it.quantity}x</span>
                            <span>{it.menuItem?.name}</span>
                          </p>
                          {it.notes && (
                            <p className="text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-md mt-1 inline-block border border-brand-gold/20 font-medium">
                              Note: {it.notes}
                            </p>
                          )}
                        </div>

                        {/* Item Status Toggle Checkbox */}
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItemStatus(
                              it.id,
                              it.status === 'READY' ? 'PREPARING' : 'READY'
                            )
                          }
                          className={`p-1 rounded-lg border text-[10px] font-bold transition-all ${
                            itemDone
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : 'bg-charcoal-800 text-cream-400 border-charcoal-700 hover:text-white'
                          }`}
                          title="Toggle Item Done"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Order Notes if any */}
                {ord.notes && (
                  <div className="px-4 py-2 bg-charcoal-850/60 border-t border-charcoal-800 text-[11px] text-cream-300 italic">
                    Special order request: {ord.notes}
                  </div>
                )}

                {/* Action Footer */}
                <div className="p-3 bg-charcoal-850 border-t border-charcoal-800 flex items-center gap-2">
                  {ord.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-brand-orange-dark to-brand-orange hover:from-brand-orange text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-brand-orange/20"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {ord.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'READY')}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark All Ready</span>
                    </button>
                  )}

                  {ord.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'SERVED')}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20"
                    >
                      <span>Served to Table</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
