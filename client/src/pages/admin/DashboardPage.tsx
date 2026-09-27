import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CalendarDays,
  Users,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
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

const PALETTE = ['#B600A8', '#7621B0', '#BE4C00', '#BBCCD7', '#10B981', '#F59E0B'];

export const DashboardPage: React.FC = () => {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('30d');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminAuditAction[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ordersByHour, setOrdersByHour] = useState<any[]>([]);
  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [typeSplit, setTypeSplit] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showTour, setShowTour] = useState(() => {
    return localStorage.getItem('dinesphere_admin_tour_dismissed') !== 'true';
  });

  const dismissTour = () => {
    setShowTour(false);
    localStorage.setItem('dinesphere_admin_tour_dismissed', 'true');
  };

  const navigate = useNavigate();

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
        setRecentLogs(logsRes.value.data.data.logs);
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
    const interval = setInterval(() => loadData(false), 15000); // 15s auto-refresh
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
  }) => {
    const isPositive = delta?.startsWith('+');
    const isNegative = delta?.startsWith('-');

    return (
      <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03] backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-[#B600A8]/60 hover:bg-white/[0.05] shadow-lg shadow-black/40">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-[#D7E2EA]/20 flex items-center justify-center text-white">
            {icon}
          </div>
          {delta && (
            <span
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isNegative
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-white/10 text-white/70 border-white/20'
              }`}
            >
              {isPositive ? <ArrowUpRight size={14} /> : isNegative ? <ArrowDownRight size={14} /> : null}
              {delta}
            </span>
          )}
        </div>
        <div className="text-[#D7E2EA]/60 text-xs uppercase tracking-wider font-semibold mb-1">
          {title}
        </div>
        <div className="text-3xl font-bold text-white tracking-tight font-kanit">
          {value}
        </div>
        {subtitle && (
          <div className="text-[11px] text-[#D7E2EA]/40 mt-1">{subtitle}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Quick Tour Card ── */}
      {showTour && (
        <div className="bg-gradient-to-r from-[#B600A8]/20 to-[#7621B0]/20 border border-[#B600A8]/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={100} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-2xl">👋</span> Welcome to DineSphere Admin!
            </h3>
            <p className="text-[#D7E2EA]/80 text-sm leading-relaxed">
              Here you can monitor live restaurant activity. Use the sidebar to navigate to Orders, Kitchen, or Settings.
            </p>
          </div>
          <button 
            onClick={dismissTour}
            className="relative z-10 shrink-0 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      )}

      {/* ── Top Filter Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h2>
          <p className="text-[#D7E2EA]/60 text-xs sm:text-sm mt-0.5">
            Real-time restaurant operations, culinary performance, and financial analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Chips */}
          <div className="flex bg-white/[0.04] border border-[#D7E2EA]/20 rounded-2xl p-1 text-xs font-medium">
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

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${(summary?.revenue.value || 0).toLocaleString()}`}
          delta={summary?.revenue.delta}
          icon={<DollarSign size={22} className="text-[#B600A8]" />}
          subtitle="Net sales after discounts"
        />
        <StatCard
          title="Total Orders"
          value={`${summary?.orders.value || 0}`}
          delta={summary?.orders.delta}
          icon={<ShoppingBag size={22} className="text-[#7621B0]" />}
          subtitle="Kitchen & takeout orders"
        />
        <StatCard
          title="Average Order"
          value={`₹${summary?.aov.value || 0}`}
          delta={summary?.aov.delta}
          icon={<TrendingUp size={22} className="text-[#BE4C00]" />}
          subtitle="Revenue per active ticket"
        />
        <StatCard
          title="Reservations"
          value={`${summary?.reservations.value || 0}`}
          delta={summary?.reservations.delta}
          icon={<CalendarDays size={22} className="text-[#BBCCD7]" />}
          subtitle="Cinema-seat tables booked"
        />
        <StatCard
          title="New Guests"
          value={`${summary?.newCustomers.value || 0}`}
          delta={summary?.newCustomers.delta}
          icon={<Users size={22} className="text-emerald-400]" />}
          subtitle="Customer accounts created"
        />
        <StatCard
          title="Cancellations"
          value={`${summary?.cancelledOrders.value || 0}`}
          delta={summary?.cancelledOrders.delta}
          icon={<AlertCircle size={22} className="text-red-400" />}
          subtitle="Pre-kitchen voids"
        />
      </div>

      {/* ── Main Charts and Attention Center ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Over Time Chart */}
          <div className="p-6 sm:p-8 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03] backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Revenue Trend</h3>
                <p className="text-xs text-[#D7E2EA]/50">Gross income progression across the selected timeframe</p>
              </div>
            </div>

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
                  <XAxis
                    dataKey="date"
                    stroke="#D7E2EA"
                    opacity={0.4}
                    fontSize={11}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis
                    stroke="#D7E2EA"
                    opacity={0.4}
                    fontSize={11}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161616',
                      borderColor: 'rgba(215, 226, 234, 0.3)',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#B600A8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by Hour & Order Types Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders by Hour Bar Chart */}
            <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
              <h3 className="text-base font-bold text-white mb-1">Peak Dining Hours</h3>
              <p className="text-xs text-[#D7E2EA]/50 mb-4">Orders volume by service hour</p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D7E2EA" opacity={0.08} vertical={false} />
                    <XAxis dataKey="hour" stroke="#D7E2EA" opacity={0.4} fontSize={10} />
                    <YAxis stroke="#D7E2EA" opacity={0.4} fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161616',
                        borderColor: 'rgba(215, 226, 234, 0.3)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="orders" fill="#BE4C00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Type Donut Chart */}
            <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
              <h3 className="text-base font-bold text-white mb-1">Order Type Split</h3>
              <p className="text-xs text-[#D7E2EA]/50 mb-4">Dine-in vs Delivery vs Takeaway</p>
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161616',
                        borderColor: 'rgba(215, 226, 234, 0.3)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-2">
                {typeSplit.map((t, idx) => (
                  <div key={t.type} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                    />
                    <span className="text-white/70">{t.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 5 Signature Dishes */}
          <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03]">
            <h3 className="text-base font-bold text-white mb-1">Top 5 Best-Selling Dishes</h3>
            <p className="text-xs text-[#D7E2EA]/50 mb-6">Quantity prepared and total revenue contribution</p>
            <div className="space-y-4">
              {topDishes.map((dish, i) => (
                <div key={dish.name} className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold text-xs font-mono">
                      {i + 1}
                    </span>
                    <span className="text-white font-medium">{dish.name}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-white/60">{dish.quantity} orders</span>
                    <span className="text-emerald-400 font-bold">₹{dish.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Needs Attention & Live Audit Stream */}
        <div className="space-y-8">
          {/* Needs Attention Widget */}
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
                  <ShoppingBag size={18} className="text-[#B600A8]" />
                  <div>
                    <div className="text-xs font-semibold text-white">New Orders in Queue</div>
                    <div className="text-[11px] text-white/50">Needs acceptance into kitchen</div>
                  </div>
                </div>
                <span className="text-base font-bold font-mono text-[#B600A8]">
                  {alerts?.new_orders || 0}
                </span>
              </div>

              <div
                onClick={() => navigate('/admin/inventory')}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/40 transition cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <Boxes size={18} className="text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Low Stock Ingredients</div>
                    <div className="text-[11px] text-white/50">Restock required immediately</div>
                  </div>
                </div>
                <span className="text-base font-bold font-mono text-amber-400">
                  {alerts?.low_stock || 0}
                </span>
              </div>

              <div
                onClick={() => navigate('/admin/support')}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 transition cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <HeadphonesIcon size={18} className="text-cyan-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Open Support Inquiries</div>
                    <div className="text-[11px] text-white/50">Customers waiting for resolution</div>
                  </div>
                </div>
                <span className="text-base font-bold font-mono text-cyan-400">
                  {alerts?.open_tickets || 0}
                </span>
              </div>

              <div
                onClick={() => navigate('/admin/reservations')}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 transition cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Today's Reservations</div>
                    <div className="text-[11px] text-white/50">Active floor allocations</div>
                  </div>
                </div>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {alerts?.todays_reservations || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Live Recent Activity Feed */}
          <div className="p-6 rounded-3xl border border-[#D7E2EA]/30 bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Recent Admin Activity</h3>
              <button
                onClick={() => navigate('/admin/audit-log')}
                className="text-xs text-[#B600A8] hover:text-white transition font-medium"
              >
                View all &rarr;
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-xs text-white/40 italic py-4">No recent activity logged</div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="text-xs p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[11px] font-bold text-[#BE4C00]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-white/40 flex items-center gap-1 font-mono">
                        <Clock size={10} />
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-white/80 font-medium">Entity: {log.entity}</div>
                    {log.details && (
                      <div className="text-[11px] text-white/50 truncate mt-0.5">
                        {log.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
