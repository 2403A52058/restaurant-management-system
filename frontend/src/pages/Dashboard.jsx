import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Grid3X3,
  CalendarDays,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  ChefHat,
  Receipt,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';

const PIE_COLORS = ['#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { settings } = useAuth();
  const currency = settings?.currencySymbol || '$';

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState({ daily: [], monthly: [], categories: [] });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, chartsRes, ordersRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/sales-charts'),
        api.get('/dashboard/recent-orders'),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (chartsRes.data?.success) setCharts(chartsRes.data.data);
      if (ordersRes.data?.success) setRecentOrders(ordersRes.data.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      PREPARING: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      READY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      SERVED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-cream-300">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-orange mb-2" />
        <p className="text-xs">Aggregating live MySQL restaurant data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Executive Overview
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Real-time business telemetry and operations management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {stats?.lowStockCount > 0 && (
            <Link
              to="/inventory"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{stats.lowStockCount} Low Stock Alert{stats.lowStockCount > 1 ? 's' : ''}</span>
            </Link>
          )}

          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 border border-charcoal-700 text-cream-200 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-orange' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`${currency}${stats?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
          icon={DollarSign}
          subtitle={`Today: ${currency}${stats?.todayRevenue?.toFixed(2) || '0.00'}`}
          color="orange"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingBag}
          subtitle={`Today: ${stats?.todayOrders || 0} orders`}
          color="gold"
        />
        <StatCard
          title="Table Occupancy"
          value={`${stats?.occupiedTables || 0} / ${stats?.totalTables || 0}`}
          icon={Grid3X3}
          subtitle={`${stats?.availableTables || 0} available right now`}
          color="emerald"
        />
        <StatCard
          title="Reservations"
          value={stats?.pendingReservations || 0}
          icon={CalendarDays}
          subtitle="Pending guest confirmations"
          color="blue"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-serif font-bold text-cream-50 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-brand-orange" />
                <span>Daily Sales Velocity (Last 7 Days)</span>
              </h3>
              <p className="text-[11px] text-cream-400">Day-over-day revenue distribution</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                <XAxis dataKey="date" stroke="#8a8a9e" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a8a9e" tick={{ fontSize: 11 }} tickFormatter={(val) => `${currency}${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141418', borderColor: '#2c2c36', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => [`${currency}${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie Chart */}
        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-serif font-bold text-cream-50">Sales by Category</h3>
            <p className="text-[11px] text-cream-400 mb-2">Revenue contribution by menu section</p>
          </div>
          <div className="h-52 w-full">
            {charts.categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categories}
                    dataKey="revenue"
                    nameKey="fullName"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {charts.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141418', borderColor: '#2c2c36', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val) => [`${currency}${Number(val).toFixed(2)}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-cream-400">
                No categorical sales recorded yet
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-charcoal-800 text-[11px]">
            {charts.categories.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center space-x-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate text-cream-300">{c.fullName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Sales Area Trend & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 shadow-xl">
          <h3 className="text-sm font-serif font-bold text-cream-50 mb-1">Monthly Trend</h3>
          <p className="text-[11px] text-cream-400 mb-4">Past 6 months revenue performance</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthly}>
                <defs>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                <XAxis dataKey="month" stroke="#8a8a9e" tick={{ fontSize: 10 }} />
                <YAxis stroke="#8a8a9e" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141418', borderColor: '#2c2c36', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(val) => [`${currency}${Number(val).toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorMonthly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-serif font-bold text-cream-50">Recent Food Orders</h3>
              <p className="text-[11px] text-cream-400">Live order queue and table service activity</p>
            </div>
            <Link
              to="/orders"
              className="text-xs text-brand-orange hover:text-brand-orange-light font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] font-semibold text-cream-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Table / Type</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800/60">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-charcoal-850/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-cream-100">{ord.orderNumber}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-brand-gold">
                        {ord.table ? ord.table.tableNumber : ord.orderType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-cream-200">
                      {ord.customer?.name || 'Walk-in Guest'}
                    </td>
                    <td className="py-3 px-3 text-cream-400">
                      {ord.orderItems?.length || 0} item{(ord.orderItems?.length || 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-3 font-semibold text-cream-100">
                      {currency}{Number(ord.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(ord.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
