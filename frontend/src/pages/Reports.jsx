import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

const COLORS = ['#f97316', '#eab308', '#10b981', '#3b82f6'];

export default function Reports() {
  const { settings } = useAuth();
  const currency = settings?.currencySymbol || '$';

  const [period, setPeriod] = useState('daily'); // daily | monthly
  const [reportData, setReportData] = useState(null);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [salesRes, popRes] = await Promise.all([
        api.get('/reports/sales', { params: { period } }),
        api.get('/reports/popular-items'),
      ]);

      if (salesRes.data?.success) setReportData(salesRes.data.data);
      if (popRes.data?.success) setPopularItems(popRes.data.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handleDownloadCSV = () => {
    // Download directly from backend authenticated endpoint
    const token = localStorage.getItem('token');
    fetch('/api/reports/export-csv', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `restaurant-sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Export failed'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">
            Business Intelligence & Reports
          </h1>
          <p className="text-xs text-cream-400 mt-0.5">
            Audit metrics, best-seller analysis, revenue velocity, and CSV export
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Period selector */}
          <div className="flex items-center space-x-1 bg-charcoal-850 p-1 rounded-xl border border-charcoal-800 text-xs">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                period === 'daily'
                  ? 'bg-brand-orange text-white'
                  : 'text-cream-400 hover:text-white'
              }`}
            >
              14-Day Daily
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                period === 'monthly'
                  ? 'bg-brand-orange text-white'
                  : 'text-cream-400 hover:text-white'
              }`}
            >
              12-Month Annual
            </button>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-gold-dark to-brand-gold text-charcoal-950 text-xs font-bold shadow-md shadow-brand-gold/20 hover:opacity-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Sales"
          value={`${currency}${reportData?.summary?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
          icon={DollarSign}
          subtitle="All completed meal receipts"
          color="orange"
        />
        <StatCard
          title="Orders Processed"
          value={reportData?.summary?.totalOrders || 0}
          icon={ShoppingBag}
          subtitle={`${reportData?.summary?.completedOrders || 0} completed successfully`}
          color="gold"
        />
        <StatCard
          title="Average Ticket"
          value={`${currency}${reportData?.summary?.avgOrderValue?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          subtitle="Average spend per order"
          color="emerald"
        />
        <StatCard
          title="Order Completion"
          value={
            reportData?.summary?.totalOrders
              ? `${Math.round(
                  (reportData.summary.completedOrders / reportData.summary.totalOrders) * 100
                )}%`
              : '100%'
          }
          icon={Award}
          subtitle="Fulfillment rate"
          color="blue"
        />
      </div>

      {/* Sales Velocity Chart */}
      <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 shadow-xl">
        <h3 className="text-sm font-serif font-bold text-cream-50 mb-1">
          Revenue Velocity Timeline ({period === 'daily' ? 'Past 14 Days' : 'Past 12 Months'})
        </h3>
        <p className="text-[11px] text-cream-400 mb-4">Historical trends and revenue trajectory</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData?.timeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
              <XAxis dataKey="label" stroke="#8a8a9e" tick={{ fontSize: 10 }} />
              <YAxis stroke="#8a8a9e" tick={{ fontSize: 10 }} tickFormatter={(val) => `${currency}${val}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141418', borderColor: '#2c2c36', borderRadius: '12px', fontSize: '11px' }}
                formatter={(val) => [`${currency}${Number(val).toFixed(2)}`, 'Sales Revenue']}
              />
              <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Items & Payment Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Popular Dishes */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-serif font-bold text-cream-50 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-brand-gold" />
                <span>Top Performing Culinary Dishes</span>
              </h3>
              <p className="text-[11px] text-cream-400">Best-sellers ranked by guest order volume & revenue</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] font-semibold text-cream-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Rank & Dish</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {popularItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-charcoal-850/60 transition-colors">
                    <td className="py-3 px-3 flex items-center space-x-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-brand-gold text-charcoal-950' : idx === 1 ? 'bg-cream-300 text-charcoal-950' : 'bg-charcoal-800 text-cream-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-cream-100">{item.name}</span>
                    </td>
                    <td className="py-3 px-3 text-cream-400">{item.category}</td>
                    <td className="py-3 px-3 font-mono text-cream-300">{currency}{item.price.toFixed(2)}</td>
                    <td className="py-3 px-3 font-bold text-cream-100">{item.totalSold} orders</td>
                    <td className="py-3 px-3 text-right font-serif font-bold text-brand-orange">
                      {currency}{item.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Tender Method Breakdown */}
        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-serif font-bold text-cream-50 flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-brand-orange" />
              <span>Tender Method Breakdown</span>
            </h3>
            <p className="text-[11px] text-cream-400 mb-2">Cash vs Card vs UPI settlements</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData?.paymentBreakdown || []}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {(reportData?.paymentBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#141418', borderColor: '#2c2c36', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(val) => [`${currency}${Number(val).toFixed(2)}`, 'Tender Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-charcoal-800 text-xs">
            {(reportData?.paymentBreakdown || []).map((p, i) => (
              <div key={p.method} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-cream-300 font-medium">{p.method} ({p.count} txns)</span>
                </div>
                <span className="font-serif font-bold text-cream-50">{currency}{p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
