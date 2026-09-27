import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CalendarDays,
  Users,
  AlertCircle,
  Boxes,
  HeadphonesIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { adminApi } from '../../services/adminApi';
import type { DashboardSummary, AlertData, AdminAuditAction } from '../../types/admin';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ordersByHour, setOrdersByHour] = useState<any[]>([]);
  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [typeSplit, setTypeSplit] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [
        sumRes,
        alertsRes,
        revRes,
        hourRes,
        topRes,
        splitRes,
        statRes,
        logsRes
      ] = await Promise.allSettled([
        adminApi.getSummary(range),
        adminApi.getAlerts(),
        adminApi.getRevenueByDay(range),
        adminApi.getOrdersByHour(range),
        adminApi.getTopDishes(5, range),
        adminApi.getOrderTypeSplit(range),
        adminApi.getOrdersByStatus(range),
        adminApi.getAuditLog({ limit: 6 })
      ]);
      
      if (sumRes.status === 'fulfilled' && sumRes.value.data.success) {
        setSummary(sumRes.value.data.data);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value.data.success) {
        setAlerts(alertsRes.value.data.data);
      }
      if (revRes.status === 'fulfilled' && revRes.value.data.success) {
        setRevenueData(revRes.value.data.data);
      }
      if (hourRes.status === 'fulfilled' && hourRes.value.data.success) {
        setOrdersByHour(hourRes.value.data.data);
      }
      if (topRes.status === 'fulfilled' && topRes.value.data.success) {
        setTopDishes(topRes.value.data.data);
      }
      if (splitRes.status === 'fulfilled' && splitRes.value.data.success) {
        setTypeSplit(splitRes.value.data.data);
      }
      if (statRes.status === 'fulfilled' && statRes.value.data.success) {
        setStatusData(statRes.value.data.data);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.data.success) {
        // Logs are handled separately in DashboardPage
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 15000);
    return () => clearInterval(interval);
  }, [range]);

  const StatCard = ({
    title,
    value,
    delta,
    icon,
    subtitle
  }: {
    title: string;
    value: string;
    delta?: string;
    icon: React.ReactNode;
    subtitle?: string;
  }) => (
    <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-[#B600A8]/60 hover:bg-white/[0.05] shadow-lg shadow-black/40">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-[#D7E2EA]/20 flex items-center justify-center text-white">
          {icon}
        </div>
        {delta && (
          <span
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
              delta.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : delta.startsWith('-') ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-white/10 text-white/70 border-white/20'
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="text-[#D7E2EA]/60 text-xs uppercase tracking-wider font-semibold mb-1">
        {title}
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-[#D7E2EA]/40 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Financial performance, operational metrics, and business intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/[0.04] border border-[#D7E2EA]/20 rounded-2xl p-1">
            <button
              onClick={() => setRange('today')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                range === 'today'
                  ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-semibold shadow-md'
                  : 'text-[#D7E2EA]/70 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setRange('7d')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                range === '7d'
                  ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-semibold shadow-md'
                  : 'text-[#D7E2EA]/70 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                range === '30d'
                  ? 'bg-gradient-to-r from-[#B600A8] to-[#7621B0] text-white font-semibold shadow-md'
                  : 'text-[#D7E2EA]/70 hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>
          <button
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="p-2.5 rounded-2xl border border-[#D7E2EA]/20 bg-white/[0.04] text-[#D7E2EA]/70 hover:text-white transition cursor-pointer"
            title="Refresh metrics now"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${summary?.revenue.value.toLocaleString() || 0}`}
          delta={summary?.revenue.delta}
          icon={<DollarSign size={22} className="text-[#B600A8]" />}
          subtitle="Net sales"
        />
        <StatCard
          title="Total Orders"
          value={`${summary?.orders.value || 0}`}
          delta={summary?.orders.delta}
          icon={<ShoppingBag size={22} className="text-[#7621B0]" />}
          subtitle="Order count"
        />
        <StatCard
          title="Average Order Value"
          value={`₹${summary?.aov.value || 0}`}
          delta={summary?.aov.delta}
          icon={<TrendingUp size={22} className="text-[#BE4C00]" />}
          subtitle="Revenue per order"
        />
        <StatCard
          title="Reservations"
          value={`${summary?.reservations.value || 0}`}
          delta={summary?.reservations.delta}
          icon={<CalendarDays size={22} className="text-[#BBCCD7]" />}
          subtitle="Booked tables"
        />
        <StatCard
          title="New Customers"
          value={`${summary?.newCustomers.value || 0}`}
          delta={summary?.newCustomers.delta}
          icon={<Users size={22} className="text-emerald-400" />}
          subtitle="New customer registrations"
        />
        <StatCard
          title="Cancellations"
          value={`${summary?.cancelledOrders.value || 0}`}
          delta={summary?.cancelledOrders.delta}
          icon={<AlertCircle size={22} className="text-red-400" />}
          subtitle="Cancelled orders"
        />
      </div>

      {/* Charts and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
            <h3 className="text-lg font-bold text-white mb-1">Revenue Trend</h3>
            <p className="text-xs text-[#D7E2EA]/50 mb-4">Daily revenue progression</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B600A8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7621B0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D7E2EA" opacity={0.08} vertical={false} />
                  <XAxis dataKey="date" stroke="#D7E2EA" opacity={0.4} fontSize={11} tickFormatter={(val) => val.slice(5)} />
                  <YAxis stroke="#D7E2EA" opacity={0.4} fontSize={11} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161616', border: '1px solid #D7E2EA', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#B600A8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Orders by Hour & Type Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
            <h3 className="text-base font-bold text-white mb-1">Peak Hours</h3>
            <p className="text-xs text-[#D7E2EA]/50 mb-4">Orders by hour of day</p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D7E2EA" opacity={0.08} vertical={false} />
                  <XAxis dataKey="hour" stroke="#D7E2EA" opacity={0.4} fontSize={10} />
                  <YAxis stroke="#D7E2EA" opacity={0.4} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#161616', border: '1px solid #D7E2EA', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="orders" fill="#BE4C00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
            <h3 className="text-base font-bold text-white mb-1">Order Type Split</h3>
            <p className="text-xs text-[#D7E2EA]/50 mb-4">Dine-in vs Delivery vs Takeaway</p>
            <div className="h-60 w-full flex items-center justify-center">
              <PieChart>
                <Pie
                  data={typeSplit}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {typeSplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#161616', border: '1px solid #D7E2EA', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </div>
            <div className="flex justify-center gap-4 text-xs mt-2">
              {typeSplit.map((t, idx) => (
                <div key={t.type} className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${PALETTE[idx % PALETTE.length]}`}
                  />
                  <span className="text-white/70">{t.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Dishes */}
        <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
          <h3 className="text-base font-bold text-white mb-1">Top 5 Dishes</h3>
          <p className="text-xs text-[#D7E2EA]/50 mb-6">Top-selling dishes by quantity and revenue</p>
          {topDishes.length > 0 ? (
            <div className="space-y-4">
              {topDishes.map((dish, i) => (
                <div key={dish.name} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold text-xs font-mono">{i + 1}</span>
                  <span className="text-white font-medium">{dish.name}</span>
                  <span className="text-emerald-400 font-bold">₹{dish.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-4">No dish data yet</p>
          )}
        </div>
      </div>

      {/* Needs Attention */}
      <div className="space-y-8">
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.06] to-transparent backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <AlertCircle size={20} />
              <span>Immediate Attention</span>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
              LIVE ALERTS
            </span>
          </div>
          <div className="space-y-3">
            <div
              onClick={() => navigate('/admin/orders')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#B600A8]/40 transition cursor-pointer flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#B600A8]/20 text-[#B600A8] flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">New Orders in Queue</div>
                  <div className="text-[11px] text-white/50">Needs acceptance into kitchen</div>
                </div>
                <span className="text-base font-bold text-[#B600A8]">
                  {alerts?.new_orders || 0}
                </span>
              </div>
            </div>
            <div
              onClick={() => navigate('/admin/inventory')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/40 transition cursor-pointer flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Boxes size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Low Stock Items</div>
                  <div className="text-[11px] text-white/50">Restock required immediately</div>
                </div>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {alerts?.low_stock || 0}
                </span>
              </div>
            </div>
            <div
              onClick={() => navigate('/admin/support')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 transition cursor-pointer flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <HeadphonesIcon size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Open Support Tickets</div>
                  <div className="text-[11px] text-white/50">Customers waiting for resolution</div>
                </div>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  {alerts?.open_tickets || 0}
                </span>
              </div>
            </div>
            <div
              onClick={() => navigate('/admin/reservations')}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 transition cursor-pointer flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Today's Reservations</div>
                  <div className="text-[11px] text-white/50">Confirmed bookings</div>
                </div>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {alerts?.todays_reservations || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PALETTE = ['#B600A8', '#7621B0', '#BE4C00', '#BBCCD7', '#10B981', '#F59E0B'];

export default ReportsPage;